"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { useInvoices } from "../context/InvoiceContext";
import styles from "./history.module.css";

export default function HistoryPage() {
  const router = useRouter();
  const { invoices } = useInvoices();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  const filtered = useMemo(() => {
    let result = [...invoices];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (inv) => inv.id.toLowerCase().includes(q) || inv.vendor.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = new Date(a.date) - new Date(b.date);
      else if (sortField === "amount") cmp = a.amount - b.amount;
      else if (sortField === "vendor") cmp = a.vendor.localeCompare(b.vendor);
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [invoices, search, statusFilter, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Vendor summary cards – top 4 by total spend
  const vendorMap = {};
  invoices.forEach((inv) => {
    if (!vendorMap[inv.vendor]) vendorMap[inv.vendor] = { total: 0, category: inv.category };
    vendorMap[inv.vendor].total += inv.amount;
  });
  const topVendors = Object.entries(vendorMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 4);

  const vendorColors = ["#4285f4", "#ff9900", "#611f69", "#8b5cf6"];

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main className="main-with-sidebar">
        <div className={styles.header}>
          <div>
            <h2>Invoice History</h2>
            <p className={styles.headerSub}>
              Comprehensive archive of all processed financial documents and AI intelligence reports.
            </p>
          </div>
          <div className={styles.controls}>
            <div className={styles.searchWrap}>
              <span className="material-icons" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--outline)", fontSize: 18 }}>search</span>
              <input
                className="search-input"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status filter dropdown */}
            <div className={styles.filterGroup}>
              {["All", "Paid", "Pending", "Flagged"].map((status) => (
                <button
                  key={status}
                  className={`btn-ghost ${statusFilter === status ? styles.filterActive : ""}`}
                  style={{ padding: "8px 14px", fontSize: "0.8125rem" }}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vendor Quick Cards */}
        <div className={`${styles.vendorCards} stagger`}>
          {topVendors.map(([name, data], i) => (
            <div key={i} className={`${styles.vendorCard} animate-fade-in-up`}>
              <div className={styles.vendorDot} style={{ background: vendorColors[i] }}></div>
              <div>
                <p className={styles.vendorName}>{name}</p>
                <p className={styles.vendorCat}>{data.category}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("vendor")}
                >
                  Vendor {sortField === "vendor" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th>Category</th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("amount")}
                >
                  Amount {sortField === "amount" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th>Status</th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("date")}
                >
                  Date {sortField === "date" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => (
                <tr
                  key={i}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms`, cursor: "pointer" }}
                  onClick={() => router.push(`/result?id=${inv.id}`)}
                >
                  <td style={{ fontFamily: "var(--font-headline)", fontWeight: 500 }}>
                    {inv.invoice_number || inv.id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{inv.vendor}</td>
                  <td style={{ color: "var(--on-surface-variant)" }}>{inv.category}</td>
                  <td style={{ fontFamily: "var(--font-headline)", fontWeight: 600 }}>
                    ₹{inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className={`chip chip-${inv.status.toLowerCase()}`}>{inv.status}</span>
                  </td>
                  <td style={{ color: "var(--on-surface-variant)" }}>
                    {new Date(inv.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td>
                    <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); router.push(`/result?id=${inv.id}`); }}>
                      <span className="material-icons" style={{ fontSize: 18 }}>open_in_new</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--on-surface-variant)", padding: "var(--sp-8)" }}>
            No invoices found matching your criteria.
          </p>
        )}

        <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--on-surface-variant)", marginBottom: "var(--sp-8)", marginTop: "var(--sp-4)" }}>
          Showing {filtered.length} of {invoices.length} invoices
        </p>

        {/* Footer */}
        <footer className="page-footer" style={{ marginLeft: "calc(-1 * var(--sp-12))", marginRight: "calc(-1 * var(--sp-12))", marginBottom: "calc(-1 * var(--sp-8))" }}>
          <p className="copyright">© 2024 Ledge AI Financial. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">Security</a><a href="#">Status</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
