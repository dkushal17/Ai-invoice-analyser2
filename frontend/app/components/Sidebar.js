"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/upload", icon: "cloud_upload", label: "Upload" },
  { href: "/analytics", icon: "analytics", label: "Analytics" },
  { href: "/history", icon: "history", label: "History" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

const bottomItems = [
  { href: "#", icon: "help", label: "Help Center" },
  { href: "/", icon: "logout", label: "Sign Out" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Enterprise Ledger</h2>
        <p>AI Financial Intelligence</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={pathname === item.href ? "active" : ""}
          >
            <span className="material-icons">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        <div className="sidebar-bottom">
          {bottomItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <span className="material-icons">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <a href="#">Docs</a>
        <a href="#">Support</a>
      </div>
    </aside>
  );
}
