import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function LowStockWidget() {
  const products = await prisma.product.findMany({
    include: {
      quants: {
        where: {
          location: { isInternal: true }
        }
      }
    }
  });

  // Calculate total stock per product and filter by reorder level
  const lowStockItems = products.map(product => {
    const totalStock = product.quants.reduce((sum, quant) => sum + quant.quantity, 0);
    return { ...product, totalStock };
  }).filter(product => product.totalStock <= product.minReorderLevel);

  if (lowStockItems.length === 0) {
    return (
      <div className="glass-card">
        <h3>Low-Stock Alerts</h3>
        <p style={{ color: 'var(--accent-success)', marginTop: '0.5rem' }}>
          ✓ All products are sufficiently stocked.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ border: '1px solid var(--accent-danger)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ color: 'var(--accent-danger)', margin: 0 }}>Low-Stock Alerts</h3>
        <span className="badge badge-danger">{lowStockItems.length} items</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {lowStockItems.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SKU: {item.sku}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--accent-danger)', fontWeight: 700 }}>{item.totalStock} {item.uom} left</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Min: {item.minReorderLevel}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <Link href="/products" className="btn btn-secondary" style={{ width: '100%' }}>Manage Catalog</Link>
      </div>
    </div>
  );
}
