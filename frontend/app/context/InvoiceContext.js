"use client";

import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

/* ── Seed Data (Fallback) ── */
const seedInvoices = [];

/* ── Map DB row → frontend shape ── */
/* ── Map DB row → frontend shape ── */
function mapRow(row) {
  let parsedFindings = [];
  const rawFindings = row.insights || row.findings;
  if (Array.isArray(rawFindings)) {
    parsedFindings = rawFindings;
  } else if (typeof rawFindings === "string" && rawFindings.trim()) {
    parsedFindings = [{ type: row.status === "Flagged" ? "warning" : "ok", text: rawFindings }];
  }

  return {
    id: row.id,
    vendor: row.vendor || "Unknown Vendor",
    category: row.category || "Uncategorized",
    amount: Number(row.amount || row.total || 0),
    subtotal: Number(row.subtotal || 0),
    tax: Number(row.tax || 0),
    status: row.status || "Pending",
    date: row.date || new Date().toISOString().split("T")[0],
    fileName: "Attachment",
    findings: parsedFindings,
    historicalAvg: Number(row.historical_avg || 0),
  };
}

/* ── Map frontend shape → DB row ── */
function toRow(inv) {
  return {
    id: inv.id,
    vendor: inv.vendor,
    category: inv.category,
    amount: inv.amount,
    total: inv.amount,      // Map to 'total' column
    subtotal: inv.subtotal,
    tax: inv.tax,
    status: inv.status,
    date: String(inv.date),
    insights: inv.findings, // Map to 'insights' column
    // file_name and historical_avg are kept in frontend but not sent to DB
  };
}

/* ── Reducer ── */
function invoiceReducer(state, action) {
  switch (action.type) {
    case "SET_INVOICES":
      return { ...state, invoices: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "ADD_INVOICE":
      return { ...state, invoices: [action.payload, ...state.invoices] };
    case "UPDATE_STATUS":
      return {
        ...state,
        invoices: state.invoices.map((inv) =>
          inv.id === action.payload.id ? { ...inv, status: action.payload.status } : inv
        ),
      };
    default:
      return state;
  }
}

/* ── Context ── */
const InvoiceContext = createContext(null);

export function InvoiceProvider({ children }) {
  const [state, dispatch] = useReducer(invoiceReducer, {
    invoices: seedInvoices.map(mapRow),
    loading: true,
    error: null,
  });

  /* Fetch all invoices on mount */
  useEffect(() => {
    async function fetchAll() {
      if (!supabase) {
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          dispatch({ type: "SET_INVOICES", payload: data.map(mapRow) });
        } else {
          dispatch({ type: "SET_INVOICES", payload: [] });
        }
      } catch (err) {
        console.warn("Supabase fetch failed, using seed data:", err.message);
        dispatch({ type: "SET_LOADING", payload: false });
      }
    }
    fetchAll();
  }, []);

  /* Add invoice to local state */
  const addInvoice = (invoice) => {
    const mapped = invoice.historicalAvg !== undefined ? invoice : mapRow(invoice);
    dispatch({ type: "ADD_INVOICE", payload: mapped });
  };

  /* Get single invoice from local state */
  const getInvoice = (id) => state.invoices.find((inv) => inv.id === id);

  /* Save invoice to Supabase (upsert) */
  const saveInvoice = useCallback(async (invoice) => {
    if (!supabase) {
      return { success: false, error: "Supabase not configured" };
    }
    try {
      const row = toRow(invoice);
      const { error } = await supabase
        .from("invoices")
        .upsert(row, { onConflict: "id" });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("Save failed:", err.message);
      return { success: false, error: err.message };
    }
  }, []);

  /* Fetch single invoice from Supabase */
  const fetchSingleInvoice = useCallback(async (id) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data ? mapRow(data) : null;
    } catch {
      return null;
    }
  }, []);

  /* Compute stats */
  const getStats = () => {
    const invoices = state.invoices;
    const totalValue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidCount = invoices.filter((inv) => inv.status === "Paid").length;
    const pendingCount = invoices.filter((inv) => inv.status === "Pending").length;
    const flaggedCount = invoices.filter((inv) => inv.status === "Flagged").length;
    return { totalValue, count: invoices.length, paidCount, pendingCount, flaggedCount };
  };

  return (
    <InvoiceContext.Provider
      value={{
        invoices: state.invoices,
        loading: state.loading,
        error: state.error,
        addInvoice,
        getInvoice,
        getStats,
        saveInvoice,
        fetchSingleInvoice,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoices() {
  const context = useContext(InvoiceContext);
  if (!context) throw new Error("useInvoices must be used within InvoiceProvider");
  return context;
}
