import Link from "next/link";
import LowStockWidget from "@/components/dashboard/LowStockWidget";

export default function Home() {
  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, background: 'linear-gradient(to right, var(--accent-primary), #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          StockSense
        </h1>
        <p style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto', color: 'var(--text-secondary)' }}>
          The centralized, real-time inventory management system replacing your scattered registers and spreadsheets.
        </p>
      </div>

      <div className="grid-cols-3">
        {/* Main Navigation Cards */}
        <div className="glass-card animate-fade-in" style={{ gridColumn: 'span 2' }}>
          <h2>Core Modules</h2>
          <p>Access your inventory management workflows.</p>
          
          <div className="grid-cols-2" style={{ marginTop: '2rem' }}>
            <Link href="/products" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ cursor: 'pointer', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                <h3 style={{ color: 'var(--accent-primary)' }}>📦 Products Catalog</h3>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Manage SKUs, categories, and master reorder levels.</p>
              </div>
            </Link>
            
            <Link href="/history" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ cursor: 'pointer', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
                <h3 style={{ color: 'var(--accent-warning)' }}>📜 Move History</h3>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>View the immutable stock ledger and audit trail.</p>
              </div>
            </Link>

            <Link href="/settings" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ cursor: 'pointer', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                <h3 style={{ color: 'var(--accent-success)' }}>🏢 Warehouses & Locations</h3>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Configure tracking locations and system settings.</p>
              </div>
            </Link>

            <Link href="/login" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ cursor: 'pointer' }}>
                <h3 style={{ color: 'var(--text-primary)' }}>🔐 Authentication</h3>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Sign in with OTP or demo credentials.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Low Stock Widget embedded here so Person 2 can see how it looks */}
        <div className="animate-fade-in" style={{ gridColumn: 'span 1', animationDelay: '0.1s' }}>
          <LowStockWidget />
        </div>
      </div>
    </div>
  );
}
