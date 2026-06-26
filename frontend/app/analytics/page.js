"use client";

import { useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Chart from "chart.js/auto";
import Sidebar from "../components/Sidebar";
import { useInvoices } from "../context/InvoiceContext";
import styles from "./analytics.module.css";

export default function AnalyticsPage() {
  const { invoices, getStats } = useInvoices();
  const stats = getStats();
  const lineRef = useRef(null);
  const donutRef = useRef(null);
  const barRef = useRef(null);
  const lineChart = useRef(null);
  const donutChart = useRef(null);
  const barChart = useRef(null);

  // Compute data from context
  const totalValue = stats.totalValue;
  const avgInvoice = invoices.length > 0 ? totalValue / invoices.length : 0;

  const categoryMap = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      map[inv.category] = (map[inv.category] || 0) + inv.amount;
    });
    return map;
  }, [invoices]);

  const vendorMap = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      map[inv.vendor] = (map[inv.vendor] || 0) + inv.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [invoices]);

  // Group by month for monthly comparison
  const monthlyData = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      const d = new Date(inv.date);
      const key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!map[key]) map[key] = { total: 0, count: 0 };
      map[key].total += inv.amount;
      map[key].count += 1;
    });
    return Object.entries(map).map(([month, data]) => ({
      month,
      value: data.total,
      invoices: data.count,
    }));
  }, [invoices]);

  const kpis = [
    { icon: "payments", label: "Total Spend", value: "₹" + totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 }), delta: `${stats.count} invoices`, up: true, bg: "rgba(46,102,255,0.12)", color: "#2e66ff" },
    { icon: "receipt_long", label: "Avg Invoice Value", value: "₹" + avgInvoice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), delta: "+3.2%", up: true, bg: "rgba(52,211,153,0.12)", color: "#34d399" },
    { icon: "speed", label: "Processing Time", value: "1.2s", delta: "-18%", up: true, bg: "rgba(209,203,66,0.12)", color: "#d1cb42" },
    { icon: "savings", label: "Cost Savings", value: "₹" + (totalValue * 0.186).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }), delta: "+24.1%", up: true, bg: "rgba(139,92,246,0.12)", color: "#8b5cf6" },
  ];

  useEffect(() => {
    const chartColors = ["#2e66ff", "#8b5cf6", "#d1cb42", "#34d399", "#737477", "#ff6b6b", "#ff9900"];

    // Line chart – spending trend by date
    if (lineRef.current) {
      if (lineChart.current) lineChart.current.destroy();
      const ctx = lineRef.current.getContext("2d");
      const gradient = ctx.createLinearGradient(0, 0, 0, 280);
      gradient.addColorStop(0, "rgba(46,102,255,0.25)");
      gradient.addColorStop(1, "rgba(46,102,255,0)");

      // Sort invoices by date for trend
      const sorted = [...invoices].sort((a, b) => new Date(a.date) - new Date(b.date));
      let cumulative = 0;
      const trendData = sorted.map((inv) => {
        cumulative += inv.amount;
        return cumulative;
      });
      const trendLabels = sorted.map((inv) =>
        new Date(inv.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      );

      lineChart.current = new Chart(lineRef.current, {
        type: "line",
        data: {
          labels: trendLabels,
          datasets: [{
            label: "Cumulative Spend",
            data: trendData,
            borderColor: "#2e66ff", backgroundColor: gradient, fill: true,
            tension: 0.4, pointBackgroundColor: "#2e66ff", pointBorderColor: "#1e2024",
            pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: "rgba(30,32,36,0.95)", titleColor: "#e2e2e8", bodyColor: "#c3c5d8", padding: 12, cornerRadius: 8, callbacks: { label: (c) => "₹" + c.raw.toLocaleString() } },
          },
          scales: {
            x: { grid: { color: "rgba(67,70,85,0.2)" }, ticks: { color: "#8d90a1", font: { family: "Inter", size: 11 }, maxTicksLimit: 8 } },
            y: { grid: { color: "rgba(67,70,85,0.2)" }, ticks: { color: "#8d90a1", font: { family: "Inter", size: 11 }, callback: (v) => "₹" + (v / 1000).toFixed(0) + "k" } },
          },
        },
      });
    }

    // Donut – categories from context
    if (donutRef.current) {
      if (donutChart.current) donutChart.current.destroy();
      const catLabels = Object.keys(categoryMap);
      const catValues = Object.values(categoryMap);
      donutChart.current = new Chart(donutRef.current, {
        type: "doughnut",
        data: {
          labels: catLabels,
          datasets: [{ data: catValues, backgroundColor: chartColors.slice(0, catLabels.length), borderWidth: 0, hoverOffset: 10 }],
        },
        options: {
          cutout: "68%", responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: "bottom", labels: { color: "#c3c5d8", font: { family: "Inter", size: 11 }, padding: 14, usePointStyle: true, pointStyleWidth: 8 } } },
        },
      });
    }

    // Bar – vendors from context
    if (barRef.current) {
      if (barChart.current) barChart.current.destroy();
      barChart.current = new Chart(barRef.current, {
        type: "bar",
        data: {
          labels: vendorMap.map((e) => e[0]),
          datasets: [{
            data: vendorMap.map((e) => e[1]),
            backgroundColor: chartColors.slice(0, vendorMap.length).map((c) => c.replace(")", ",0.7)").replace("rgb", "rgba")),
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
      if (lineChart.current) lineChart.current.destroy();
      if (donutChart.current) donutChart.current.destroy();
      if (barChart.current) barChart.current.destroy();
    };
  }, [invoices, categoryMap, vendorMap]);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main className="main-with-sidebar">
        <div className={styles.header}>
          <div>
            <h2>Analytics</h2>
            <p className={styles.headerSub}>
              Deep financial insights and spending trends powered by AI analysis.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className={`${styles.statsRow} stagger`}>
          {kpis.map((k, i) => (
            <div key={i} className="stat-card animate-fade-in-up">
              <div className={styles.kpiIcon} style={{ background: k.bg, color: k.color }}>
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
            <span className={`material-icons ${styles.emptyIcon}`}>query_stats</span>
            <h3 className={styles.emptyTitle}>No Analytics Data Yet</h3>
            <p className={styles.emptyText}>
              Once you process your first few invoices, we'll start generating spending trends, category distributions, and multi-currency insights here.
            </p>
            <Link href="/upload" className="btn-primary" style={{ textDecoration: "none" }}>
              Upload Your First Document
            </Link>
          </div>
        ) : (
          <>
            {/* Charts */}
            <div className={styles.chartsRow}>
              <section className={styles.chartCard} style={{ display: invoices.length > 0 ? "block" : "none" }}>
                <div className={styles.chartHeader}>
                  <h4 className={styles.chartTitle}>Spending Trend</h4>
                  <span className={styles.chartBadge}>Cumulative</span>
                </div>
                <div className={styles.chartWrap}><canvas ref={lineRef}></canvas></div>
              </section>
              <section className={styles.chartCard} style={{ display: Object.keys(categoryMap).length > 0 ? "block" : "none" }}>
                <div className={styles.chartHeader}>
                  <h4 className={styles.chartTitle}>Category Distribution</h4>
                </div>
                <div className={styles.chartWrap}><canvas ref={donutRef}></canvas></div>
              </section>
            </div>

            {/* Vendor bar */}
            <section className={`${styles.vendorSection} ${styles.chartCard}`}>
              <div className={styles.chartHeader}>
                <h4 className={styles.chartTitle}>Top Vendors by Spend</h4>
                <span className={styles.chartBadge}>All time</span>
              </div>
              <div className={styles.vendorChartWrap}><canvas ref={barRef}></canvas></div>
            </section>

            {/* Monthly Comparison */}
            {monthlyData.length > 0 && (
              <section className={styles.comparisonSection}>
                <h3 className={styles.sectionTitle}>
                  <span className="material-icons" style={{ color: "var(--primary)" }}>calendar_month</span>
                  Monthly Comparison
                </h3>
                <div className={`${styles.comparisonGrid} stagger`}>
                  {monthlyData.map((m, i) => (
                    <div key={i} className={`${styles.compCard} animate-fade-in-up`}>
                      <p className={styles.compMonth}>{m.month}</p>
                      <p className={styles.compValue}>
                        ₹{m.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      <div className={styles.compMeta}>
                        <span className={styles.compInvoices}>{m.invoices} invoices</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Currency Conversions */}
            {invoices.some((inv) => inv.currency && inv.currency !== "INR") && (
              <section className={styles.comparisonSection} style={{ marginTop: "var(--sp-6)" }}>
                <h3 className={styles.sectionTitle}>
                  <span className="material-icons" style={{ color: "var(--primary)" }}>currency_exchange</span>
                  Recent Currency Conversions
                </h3>
                <div className={`${styles.comparisonGrid} stagger`}>
                  {invoices.filter((inv) => inv.currency && inv.currency !== "INR").slice(0, 3).map((inv, i) => (
                    <div key={i} className={`${styles.compCard} animate-fade-in-up`}>
                      <p className={styles.compMonth}>{inv.vendor}</p>
                      <div style={{ marginTop: "8px", fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span>Original:</span>
                          <span style={{ fontWeight: 500, color: "var(--on-surface)" }}>
                            {inv.currency === "USD" ? "$" : inv.currency === "EUR" ? "€" : ""}{(inv.original_total || inv.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} {inv.currency}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Converted:</span>
                          <span style={{ fontWeight: 600, color: "#34d399" }}>
                            ₹{inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} INR
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
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
