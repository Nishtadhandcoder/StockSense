import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "StockSense | Next-Gen Enterprise Warehouse Operations OS",
  description: "Real-time KPI telemetry, multi-location inventory ledger, and operations engine for modern supply chain logistics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#09090b]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

