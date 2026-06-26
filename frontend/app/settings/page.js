"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import styles from "./settings.module.css";

const services = [
  { name: "QuickBooks Online", status: "Last synced 2 hours ago", color: "#34d399", connected: true },
  { name: "Xero Accounting", status: "Last synced 5 hours ago", color: "#2e66ff", connected: true },
  { name: "Stripe Payments", status: "Not connected", color: "#737477", connected: false },
  { name: "Slack Notifications", status: "Last synced 1 hour ago", color: "#d1cb42", connected: true },
];

const accentColors = [
  { color: "#2e66ff", name: "Blue" },
  { color: "#8b5cf6", name: "Purple" },
  { color: "#34d399", name: "Green" },
  { color: "#ff6b6b", name: "Red" },
  { color: "#d1cb42", name: "Gold" },
  { color: "#ff9900", name: "Orange" },
];

export default function SettingsPage() {
  const [toggles, setToggles] = useState({
    emailAlerts: true,
    anomalyNotifs: true,
    weeklyReports: false,
    slackNotifs: true,
  });

  const [activeTheme, setActiveTheme] = useState("dark");
  const [activeAccent, setActiveAccent] = useState("#2e66ff");

  const toggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main className="main-with-sidebar">
        <div className={styles.header}>
          <div>
            <h2>Settings</h2>
            <p className={styles.headerSub}>
              Manage your account, preferences, and integrations.
            </p>
          </div>
        </div>

        <div className={styles.sectionsGrid}>
          {/* ── Profile ── */}
          <section className={`${styles.section} animate-fade-in-up`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <span className="material-icons">person</span>
              </div>
              <div>
                <p className={styles.sectionTitle}>Profile</p>
                <p className={styles.sectionDesc}>Your personal account information</p>
              </div>
            </div>

            <div className={styles.profileRow}>
              <div className={styles.avatar}>JD</div>
              <div className={styles.profileInfo}>
                <p className={styles.profileName}>Jordan Davis</p>
                <p className={styles.profileRole}>Finance Administrator • Enterprise Plan</p>
              </div>
              <button className="btn-ghost">
                <span className="material-icons" style={{ fontSize: 18 }}>edit</span>
                Edit
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Display Name</label>
                <input className={styles.formInput} defaultValue="Jordan Davis" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Address</label>
                <input className={styles.formInput} defaultValue="jordan.davis@enterprise.com" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role</label>
                <input className={styles.formInput} defaultValue="Finance Administrator" disabled />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Organization</label>
                <input className={styles.formInput} defaultValue="Enterprise Corp." disabled />
              </div>
            </div>

            <div className={styles.btnRow}>
              <button className="btn-ghost">Cancel</button>
              <button className="btn-primary">Save Changes</button>
            </div>
          </section>

          {/* ── Notifications ── */}
          <section className={`${styles.section} animate-fade-in-up`} style={{ animationDelay: "100ms" }}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <span className="material-icons">notifications</span>
              </div>
              <div>
                <p className={styles.sectionTitle}>Notifications</p>
                <p className={styles.sectionDesc}>Configure how you receive alerts and updates</p>
              </div>
            </div>

            <div className={styles.toggleRow}>
              <div>
                <p className={styles.toggleLabel}>Email Alerts</p>
                <p className={styles.toggleDesc}>Receive email notifications for important events</p>
              </div>
              <button
                className={`${styles.toggle} ${toggles.emailAlerts ? styles.toggleOn : ""}`}
                onClick={() => toggle("emailAlerts")}
                aria-label="Toggle email alerts"
              />
            </div>

            <div className={styles.toggleRow}>
              <div>
                <p className={styles.toggleLabel}>Anomaly Notifications</p>
                <p className={styles.toggleDesc}>Get notified instantly when AI detects invoice anomalies</p>
              </div>
              <button
                className={`${styles.toggle} ${toggles.anomalyNotifs ? styles.toggleOn : ""}`}
                onClick={() => toggle("anomalyNotifs")}
                aria-label="Toggle anomaly notifications"
              />
            </div>

            <div className={styles.toggleRow}>
              <div>
                <p className={styles.toggleLabel}>Weekly Reports</p>
                <p className={styles.toggleDesc}>Receive a weekly spending summary every Monday</p>
              </div>
              <button
                className={`${styles.toggle} ${toggles.weeklyReports ? styles.toggleOn : ""}`}
                onClick={() => toggle("weeklyReports")}
                aria-label="Toggle weekly reports"
              />
            </div>

            <div className={styles.toggleRow}>
              <div>
                <p className={styles.toggleLabel}>Slack Notifications</p>
                <p className={styles.toggleDesc}>Push alerts to your connected Slack channel</p>
              </div>
              <button
                className={`${styles.toggle} ${toggles.slackNotifs ? styles.toggleOn : ""}`}
                onClick={() => toggle("slackNotifs")}
                aria-label="Toggle Slack notifications"
              />
            </div>
          </section>

          {/* ── API & Integrations ── */}
          <section className={`${styles.section} animate-fade-in-up`} style={{ animationDelay: "200ms" }}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <span className="material-icons">token</span>
              </div>
              <div>
                <p className={styles.sectionTitle}>API & Integrations</p>
                <p className={styles.sectionDesc}>Manage API access and connected services</p>
              </div>
            </div>

            <p className={styles.formLabel} style={{ marginBottom: "var(--sp-2)" }}>API Key</p>
            <div className={styles.apiKeyRow}>
              <input
                className={styles.apiKeyInput}
                value="sk-ledge-••••••••••••••••••••••3f7a"
                readOnly
              />
              <button className={styles.apiCopyBtn}>
                <span className="material-icons" style={{ fontSize: 16 }}>content_copy</span>
                Copy
              </button>
              <button className={styles.apiCopyBtn}>
                <span className="material-icons" style={{ fontSize: 16 }}>refresh</span>
                Regenerate
              </button>
            </div>

            <p className={styles.formLabel} style={{ marginBottom: "var(--sp-3)" }}>Connected Services</p>
            <div className={styles.servicesList}>
              {services.map((s, i) => (
                <div key={i} className={styles.serviceItem}>
                  <div className={styles.serviceLeft}>
                    <div className={styles.serviceDot} style={{ background: s.color }}></div>
                    <div>
                      <p className={styles.serviceName}>{s.name}</p>
                      <p className={styles.serviceStatus}>{s.status}</p>
                    </div>
                  </div>
                  {s.connected ? (
                    <span className={styles.serviceConnected}>● Connected</span>
                  ) : (
                    <button className="btn-ghost" style={{ padding: "6px 14px", fontSize: "0.8125rem" }}>Connect</button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Appearance ── */}
          <section className={`${styles.section} animate-fade-in-up`} style={{ animationDelay: "300ms" }}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <span className="material-icons">palette</span>
              </div>
              <div>
                <p className={styles.sectionTitle}>Appearance</p>
                <p className={styles.sectionDesc}>Customize the look and feel of your dashboard</p>
              </div>
            </div>

            <p className={styles.formLabel} style={{ marginBottom: "var(--sp-3)" }}>Theme</p>
            <div className={styles.themePicker}>
              {[
                { key: "dark", icon: "dark_mode", label: "Dark" },
                { key: "light", icon: "light_mode", label: "Light" },
                { key: "system", icon: "settings_brightness", label: "System" },
              ].map((t) => (
                <button
                  key={t.key}
                  className={`${styles.themeOption} ${activeTheme === t.key ? styles.themeActive : ""}`}
                  onClick={() => setActiveTheme(t.key)}
                >
                  <span className={`material-icons ${styles.themeIcon}`}>{t.icon}</span>
                  <span className={styles.themeName}>{t.label}</span>
                </button>
              ))}
            </div>

            <div className={styles.accentRow}>
              <span className={styles.accentLabel}>Accent Color</span>
              <div className={styles.accentPalette}>
                {accentColors.map((a) => (
                  <button
                    key={a.color}
                    className={`${styles.accentDot} ${activeAccent === a.color ? styles.accentDotActive : ""}`}
                    style={{ background: a.color }}
                    onClick={() => setActiveAccent(a.color)}
                    aria-label={`Select ${a.name} accent`}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="page-footer" style={{ marginLeft: "calc(-1 * var(--sp-12))", marginRight: "calc(-1 * var(--sp-12))", marginBottom: "calc(-1 * var(--sp-8))" }}>
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
