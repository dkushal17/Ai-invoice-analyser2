"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Chart from "chart.js/auto";
import Sidebar from "../components/Sidebar";
import { useInvoices } from "../context/InvoiceContext";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { invoices, getStats, loading } = useInvoices();
  const stats = getStats();
  const donutRef = useRef(null);
  const barRef = useRef(null);
  const lineRef = useRef(null);
  const donutChart = useRef(null);
  const barChart = useRef(null);
  const lineChart = useRef(null);

  const flaggedInvoices = invoices.filter((inv) =>
    inv.findings && inv.findings.some((f) => f.type === "warning")
  );

  const recentInvoices = invoices.slice(0, 5);

  // Compute category breakdown from context
  const categoryMap = {};
  invoices.forEach((inv) => {
    categoryMap[inv.category] = (categoryMap[inv.category] || 0) + inv.amount;
  });
  const catLabels = Object.keys(categoryMap);
  const catValues = Object.values(categoryMap);

  // Compute vendor totals
  const vendorMap = {};
  invoices.forEach((inv) => {
    vendorMap[inv.vendor] = (vendorMap[inv.vendor] || 0) + inv.amount;
  });
  const vendorEntries = Object.entries(vendorMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  useEffect(() => {
    if (loading) return;

    const vendorColors = [
      "rgba(46,102,255,0.7)", "rgba(139,92,246,0.7)", "rgba(52,211,153,0.7)",
      "rgba(209,203,66,0.7)", "rgba(115,116,119,0.7)",
    ];

    // Mini line chart
    if (lineRef.current) {
      if (lineChart.current) lineChart.current.destroy();
      const ctx = lineRef.current.getContext("2d");
      const gradient = ctx.createLinearGradient(0, 0, 0, 160);
      gradient.addColorStop(0, "rgba(46,102,255,0.2)");
      gradient.addColorStop(1, "rgba(46,102,255,0)");

      lineChart.current = new Chart(lineRef.current, {
        type: "line",
        data: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [{
            data: [6200, 8100, 5400, 9800, 7300, 11200, 8900],
            borderColor: "#2e66ff", backgroundColor: gradient, fill: true,
            tension: 0.4, pointBackgroundColor: "#2e66ff", pointBorderColor: "#1e2024",
            pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: "rgba(30,32,36,0.95)", titleColor: "#e2e2e8", bodyColor: "#c3c5d8", padding: 10, cornerRadius: 8, callbacks: { label: (c) => "₹" + c.raw.toLocaleString() } } },
          scales: {
            x: { grid: { color: "rgba(67,70,85,0.15)" }, ticks: { color: "#8d90a1", font: { family: "Inter", size: 10 } } },
            y: { grid: { color: "rgba(67,70,85,0.15)" }, ticks: { color: "#8d90a1", font: { family: "Inter", size: 10 }, callback: (v) => "₹" + (v / 1000) + "k" } },
          },
        },
      });
    }

    // Donut chart – from context
    if (donutRef.current) {
      if (donutChart.current) donutChart.current.destroy();
      const colors = ["#2e66ff", "#8b5cf6", "#d1cb42", "#737477", "#34d399", "#ff6b6b", "#ff9900"];
      donutChart.current = new Chart(donutRef.current, {
        type: "doughnut",
        data: {
          labels: catLabels,
          datasets: [{ data: catValues, backgroundColor: colors.slice(0, catLabels.length), borderWidth: 0, hoverOffset: 8 }],
        },
        options: {
          cutout: "70%", responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: "bottom", labels: { color: "#c3c5d8", font: { family: "Inter", size: 11 }, padding: 14, usePointStyle: true, pointStyleWidth: 8 } } },
        },
      });
    }

    // Bar chart – from context
    if (barRef.current) {
      if (barChart.current) barChart.current.destroy();
      barChart.current = new Chart(barRef.current, {
        type: "bar",
        data: {
          labels: vendorEntries.map((e) => e[0]),
          datasets: [{
            data: vendorEntries.map((e) => e[1]),
            backgroundColor: vendorColors.slice(0, vendorEntries.length),
            hoverBackgroundColor: vendorColors.map((c) => c.replace("0.7", "0.9")),
            borderRadius: 6, borderSkipped: false,
          }],
        },
        options: {
          indexAxis: "y", responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: "rgba(67,70,85,0.2)" }, ticks: { color: "#8d90a1", font: { family: "Inter", size: 11 }, callback: (v) => "₹" + (v / 1000).toFixed(0) + "k" } },
            y: { grid: { display: false }, ticks: { color: "#c3c5d8", font: { family: "Inter", size: 12 } } },
          },
        },
      });
    }

    return () => {
      if (donutChart.current) donutChart.current.destroy();
      if (barChart.current) barChart.current.destroy();
      if (lineChart.current) lineChart.current.destroy();
    };
  }, [invoices, loading]);

  const kpis = [
    { icon: "account_balance_wallet", label: "Total Value Processed", value: "₹" + stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 }), delta: `${stats.count} invoices`, up: true, bg: "rgba(46,102,255,0.12)", color: "#2e66ff" },
    { icon: "receipt_long", label: "Invoices Audited", value: String(stats.count), delta: `${stats.paidCount} paid`, up: true, bg: "rgba(52,211,153,0.12)", color: "#34d399" },
    { icon: "verified", label: "AI Success Rate", value: "99.2%", delta: "+0.3%", up: true, bg: "rgba(139,92,246,0.12)", color: "#8b5cf6" },
    { icon: "flag", label: "Anomalies Detected", value: `${stats.flaggedCount} Flags`, delta: `${stats.pendingCount} pending`, up: true, bg: "rgba(209,203,66,0.12)", color: "#d1cb42" },
  ];

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main className="main-with-sidebar">
        <div className={styles.header}>
          <div>
            <h2>Analysis Dashboard</h2>
            <p className={styles.headerSub}>Real-time overview of your financial operations and AI insights.</p>
          </div>
          <div className={styles.headerActions}>
            <button className="btn-ghost">
              <span className="material-icons" style={{ fontSize: 18 }}>download</span> Export
            </button>
            <Link href="/upload" className="btn-primary" style={{ textDecoration: "none" }}>
              <span className="material-icons" style={{ fontSize: 18 }}>cloud_upload</span> Upload Invoice
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className={`${styles.statsRow} stagger`}>
          {kpis.map((k, i) => (
            <div key={i} className="stat-card animate-fade-in-up">
              <div className={styles.kpiIconWrap} style={{ background: k.bg, color: k.color }}>
                <span className="material-icons">{k.icon}</span>
              </div>
              <p className="label">{k.label}</p>
              <p className="value">{invoices.length > 0 ? k.value : "—"}</p>
              <span className={`${styles.kpiDelta} ${k.up ? styles.kpiUp : styles.kpiDown}`}>
                <span className="material-icons" style={{ fontSize: 14 }}>
                  {k.up ? "trending_up" : "trending_down"}
                </span>
                {invoices.length > 0 ? k.delta : "No data"}
              </span>
            </div>
          ))}
        </div>

        {invoices.length === 0 ? (
          <div className={`${styles.emptyState} animate-fade-in`}>
            <span className={`material-icons ${styles.emptyIcon}`}>analytics</span>
            <h3 className={styles.emptyTitle}>Welcome to Ledge AI</h3>
            <p className={styles.emptyText}>
              Your intelligent financial dashboard is ready. Upload your first invoice to see AI-powered extraction, anomaly detection, and spending analytics in action.
            </p>
            <Link href="/upload" className="btn-primary" style={{ textDecoration: "none" }}>
              <span className="material-icons" style={{ fontSize: 18, marginRight: "8px" }}>cloud_upload</span>
              Get Started with First Upload
            </Link>
          </div>
        ) : (
          <>
            {/* Main Grid */}
            <div className={styles.mainGrid}>
              <section className={styles.chartCard} style={{ display: invoices.length > 0 ? "block" : "none" }}>
                <div className={styles.chartHeader}>
                  <h4 className={styles.chartTitle}>Weekly Processing Volume</h4>
                  <span className={styles.chartBadge}>This week</span>
                </div>
                <div className={styles.chartWrap}><canvas ref={lineRef}></canvas></div>
              </section>

              {flaggedInvoices.length > 0 && (
                <section className={styles.anomalySection}>
                  <h4 className={styles.anomalySectionTitle}>
                    <span className="material-icons" style={{ color: "var(--secondary)", fontSize: 20 }}>warning_amber</span>
                    Anomaly Detection
                    <span className={styles.anomalyCount}>{stats.flaggedCount}</span>
                  </h4>
                  <div className={`${styles.anomalyList} stagger`}>
                    {flaggedInvoices.slice(0, 3).map((inv, i) => {
                      const warning = inv.findings.find((f) => f.type === "warning");
                      return (
                        <Link
                          key={i}
                          href={`/result?id=${inv.id}`}
                          className="anomaly-card animate-slide-left"
                          style={{ textDecoration: "none", display: "block" }}
                        >
                          <div className={styles.anomalyContent}>
                            <p className={styles.anomalyDesc}>{warning?.text || "Anomaly detected"}</p>
                            <span className={styles.anomalyAmount}>
                              ₹{inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className={styles.anomalyMeta}>
                            <span className="chip chip-flagged">{inv.status}</span>
                            <span className={styles.anomalyTime}>{inv.vendor}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* Charts */}
            <div className={styles.chartsRow}>
              <section className={styles.chartCard}>
                <div className={styles.chartHeader}><h4 className={styles.chartTitle}>Expense Breakdown</h4></div>
                <div className={styles.chartWrap}><canvas ref={donutRef}></canvas></div>
              </section>
              <section className={styles.chartCard}>
                <div className={styles.chartHeader}><h4 className={styles.chartTitle}>Top Vendors by Volume</h4></div>
                <div className={styles.chartWrap}><canvas ref={barRef}></canvas></div>
              </section>
            </div>

            {/* Recent Activity */}
            <section className={styles.recentSection}>
              <div className={styles.chartHeader}>
                <h4 className={styles.chartTitle}>
                  <span className="material-icons" style={{ fontSize: 20, color: "var(--primary)" }}>history</span>
                  Recent Activity
                </h4>
                <Link href="/history" className={styles.viewAll}>View All →</Link>
              </div>
              <div className={styles.recentTable}>
                <table className="data-table">
                  <thead>
                    <tr><th>Invoice Number</th><th>Vendor</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((inv, i) => (
                      <tr
                        key={i}
                        className="animate-fade-in"
                        style={{ animationDelay: `${i * 60}ms`, cursor: "pointer" }}
                        onClick={() => window.location.href = `/result?id=${inv.id}`}
                      >
                        <td style={{ fontFamily: "var(--font-headline)", fontWeight: 500 }}>{inv.invoice_number || inv.id}</td>
                        <td style={{ fontWeight: 600 }}>{inv.vendor}</td>
                        <td style={{ fontFamily: "var(--font-headline)", fontWeight: 600 }}>
                          ₹{inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td><span className={`chip chip-${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                        <td style={{ color: "var(--on-surface-variant)", fontSize: "0.8125rem" }}>
                          {new Date(inv.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}


        <footer className="page-footer" style={{ marginTop: "var(--sp-10)", marginLeft: "calc(-1 * var(--sp-12))", marginRight: "calc(-1 * var(--sp-12))", marginBottom: "calc(-1 * var(--sp-8))" }}>
          <p className="copyright">© 2024 Ledge AI Financial. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">Security</a><a href="#">Status</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
