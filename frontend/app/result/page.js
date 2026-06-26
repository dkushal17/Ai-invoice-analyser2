"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { useInvoices } from "../context/InvoiceContext";
import styles from "./result.module.css";

function ResultContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("id") || "INV-7842";
  const { getInvoice, saveInvoice } = useInvoices();
  const invoice = getInvoice(invoiceId);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error

  const handleSave = async () => {
    if (!invoice || saveState === "saving") return;
    setSaveState("saving");
    const result = await saveInvoice(invoice);
    setSaveState(result.success ? "saved" : "error");
    if (result.success) {
      setTimeout(() => setSaveState("idle"), 3000);
    }
  };

  if (!invoice) {
    return (
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main className="main-with-sidebar">
          <h2>Invoice Not Found</h2>
          <p style={{ color: "var(--on-surface-variant)", marginTop: "var(--sp-4)" }}>
            No invoice with ID &quot;{invoiceId}&quot; was found.
          </p>
          <Link href="/dashboard" className="btn-primary" style={{ marginTop: "var(--sp-6)", display: "inline-flex" }}>
            Go to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const delta = invoice.amount - invoice.historicalAvg;
  const deltaPercent = ((delta / invoice.historicalAvg) * 100).toFixed(1);
  const maxVal = Math.max(invoice.amount, invoice.historicalAvg);
  const warningCount = invoice.findings.filter((f) => f.type === "warning").length;

  const saveLabel = {
    idle: "Save Result",
    saving: "Saving...",
    saved: "Saved ✓",
    error: "Failed — Retry",
  }[saveState];

  const saveIcon = {
    idle: "save",
    saving: "sync",
    saved: "check_circle",
    error: "error_outline",
  }[saveState];

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main className="main-with-sidebar">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2>Invoice Result</h2>
            <p className={styles.headerSub}>
              AI-powered analysis complete for {invoice.id}
            </p>
            <div className={styles.headerBadge}>
              <span className={`chip chip-${invoice.status.toLowerCase()}`}>{invoice.status}</span>
              {invoice.duplicate_type === "strong" && <span className="chip chip-error">Duplicate</span>}
              {invoice.duplicate_type === "smart" && <span className="chip chip-warning">Possible Duplicate</span>}
              {warningCount > 0 && (
                <span className="chip chip-flagged">
                  {warningCount} {warningCount === 1 ? "Warning" : "Warnings"}
                </span>
              )}
            </div>
          </div>
          <div className={styles.actions}>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saveState === "saving"}
              style={saveState === "saved" ? { background: "#34d399" } : saveState === "error" ? { background: "var(--error)" } : {}}
            >
              <span className="material-icons" style={{ fontSize: 18, animation: saveState === "saving" ? "spin 1s linear infinite" : "none" }}>{saveIcon}</span>
              {saveLabel}
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          {/* ── Extracted Data ── */}
          <section className={`${styles.section} animate-fade-in-up`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <span className="material-icons" style={{ fontSize: 18 }}>receipt_long</span>
              </div>
              <span className={styles.sectionTitle}>Extracted Data</span>
            </div>
            <div className={styles.dataGrid}>
              <div className={styles.dataField}>
                <span className={styles.dataLabel}>Invoice Number</span>
                <span className={styles.dataValue}>{invoice.invoice_number}</span>
              </div>
              <div className={styles.dataField}>
                <span className={styles.dataLabel}>System ID</span>
                <span className={styles.dataValue} style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)" }}>{invoice.id}</span>
              </div>
              <div className={styles.dataField}>
                <span className={styles.dataLabel}>Vendor</span>
                <span className={styles.dataValue}>{invoice.vendor}</span>
              </div>
              <div className={styles.dataField}>
                <span className={styles.dataLabel}>Date</span>
                <span className={styles.dataValue}>
                  {new Date(invoice.date).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </span>
              </div>
              <div className={styles.dataField}>
                <span className={styles.dataLabel}>Category</span>
                <span className={styles.dataValue}>{invoice.category}</span>
              </div>
              <div className={styles.dataField}>
                <span className={styles.dataLabel}>Subtotal</span>
                <span className={styles.dataValue}>₹{invoice.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className={styles.dataField}>
                <span className={styles.dataLabel}>Tax</span>
                <span className={styles.dataValue}>₹{invoice.tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className={`${styles.dataField} ${styles.fullWidth}`}>
                <span className={styles.dataLabel}>Total Amount</span>
                <span className={`${styles.dataValue} ${styles.dataValueLarge}`}>
                  ₹{invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </section>

          {/* ── AI Insights ── */}
          <section className={`${styles.section} animate-fade-in-up`} style={{ animationDelay: "100ms" }}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <span className="material-icons" style={{ fontSize: 18 }}>psychology</span>
              </div>
              <span className={styles.sectionTitle}>AI Insights</span>
            </div>
            <div className={styles.findingsList}>
              {invoice.findings.map((finding, i) => (
                <div
                  key={i}
                  className={`${styles.finding} ${finding.type === "warning" ? styles.findingWarning : styles.findingOk}`}
                >
                  <span
                    className={`material-icons ${styles.findingIcon}`}
                    style={{
                      fontSize: 20,
                      color: finding.type === "warning" ? "var(--secondary)" : "#34d399",
                    }}
                  >
                    {finding.type === "warning" ? "warning_amber" : "check_circle"}
                  </span>
                  <span className={styles.findingText}>{finding.text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Historical Comparison ── */}
          <section className={`${styles.section} ${styles.fullWidth} animate-fade-in-up`} style={{ animationDelay: "200ms" }}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <span className="material-icons" style={{ fontSize: 18 }}>compare_arrows</span>
              </div>
              <span className={styles.sectionTitle}>Historical Comparison</span>
            </div>
            <div className={styles.comparisonRow}>
              <div className={styles.compItem}>
                <span className={styles.compLabel}>Current Invoice</span>
                <div className={styles.compBarTrack}>
                  <div
                    className={`${styles.compBarFill} ${styles.compBarCurrent}`}
                    style={{ width: `${(invoice.amount / maxVal) * 100}%` }}
                  ></div>
                </div>
                <span className={styles.compValue}>
                  ₹{invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className={styles.compItem}>
                <span className={styles.compLabel}>Historical Average</span>
                <div className={styles.compBarTrack}>
                  <div
                    className={`${styles.compBarFill} ${styles.compBarAvg}`}
                    style={{ width: `${(invoice.historicalAvg / maxVal) * 100}%` }}
                  ></div>
                </div>
                <span className={styles.compValue}>
                  ₹{invoice.historicalAvg.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span
                  className={`${styles.compDelta} ${
                    delta > 0 ? styles.compDeltaUp : delta < 0 ? styles.compDeltaDown : styles.compDeltaNeutral
                  }`}
                >
                  <span className="material-icons" style={{ fontSize: 14 }}>
                    {delta > 0 ? "trending_up" : delta < 0 ? "trending_down" : "trending_flat"}
                  </span>
                  {delta > 0 ? "+" : ""}{deltaPercent}% vs average (₹{Math.abs(delta).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  {delta >= 0 ? " above" : " below"})
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ── Actions ── */}
        <div className={styles.actions}>
          <Link href="/upload" className="btn-primary" style={{ textDecoration: "none" }}>
            <span className="material-icons" style={{ fontSize: 18 }}>cloud_upload</span>
            Upload Another
          </Link>
          <Link href="/dashboard" className="btn-ghost" style={{ textDecoration: "none" }}>
            <span className="material-icons" style={{ fontSize: 18 }}>dashboard</span>
            Go to Dashboard
          </Link>
          <Link href="/history" className="btn-ghost" style={{ textDecoration: "none" }}>
            <span className="material-icons" style={{ fontSize: 18 }}>history</span>
            View History
          </Link>
        </div>

        {/* Footer */}
        <footer className="page-footer" style={{ marginTop: "var(--sp-10)", marginLeft: "calc(-1 * var(--sp-12))", marginRight: "calc(-1 * var(--sp-12))", marginBottom: "calc(-1 * var(--sp-8))" }}>
          <p className="copyright">© 2024 Ledge AI Financial. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security</a>
            <a href="#">Status</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex" }}><main className="main-with-sidebar"><p>Loading...</p></main></div>}>
      <ResultContent />
    </Suspense>
  );
}
