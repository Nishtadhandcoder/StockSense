import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function HistoryPage() {
  const ledgers = await prisma.stockLedger.findMany({
    orderBy: { timestamp: 'desc' },
    include: {
      product: true,
      sourceLocation: true,
      destLocation: true,
      operation: true,
    }
  });

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Move History (Ledger)</h1>
          <p>Immutable audit trail of all inventory movements.</p>
        </div>
        <Link href="/" className="btn btn-secondary">Back to Home</Link>
      </div>

      <div className="glass-card animate-fade-in">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Operation</th>
                <th>Product</th>
                <th>Qty</th>
                <th>From Location</th>
                <th>To Location</th>
              </tr>
            </thead>
            <tbody>
              {ledgers.map(ledger => (
                <tr key={ledger.id}>
                  <td style={{ fontSize: '0.875rem' }}>{new Date(ledger.timestamp).toLocaleString()}</td>
                  <td>
                    {ledger.operation ? (
                      <span className={`badge ${
                        ledger.operation.type === 'RECEIPT' ? 'badge-success' : 
                        ledger.operation.type === 'DELIVERY' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {ledger.operation.type}
                      </span>
                    ) : (
                      <span className="badge badge-danger">MANUAL</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {ledger.product.name} <br/>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ledger.product.sku}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {ledger.qty} {ledger.product.uom}
                  </td>
                  <td>{ledger.sourceLocation?.name || "N/A"}</td>
                  <td>{ledger.destLocation?.name || "N/A"}</td>
                </tr>
              ))}
              {ledgers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    No stock movements recorded yet. Once receipts or deliveries are validated, they will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
