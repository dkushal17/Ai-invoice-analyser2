import "./globals.css";
import { InvoiceProvider } from "./context/InvoiceContext";

export const metadata = {
  title: "Ledge AI | Transform Invoice Chaos into AI Clarity",
  description: "The definitive ledger for high-growth enterprises. Automate invoice processing, detect anomalies, and unlock deep financial intelligence.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body>
        <InvoiceProvider>{children}</InvoiceProvider>
      </body>
    </html>
  );
}
