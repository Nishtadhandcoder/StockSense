import { prisma } from "@/lib/prisma";
import { createProduct } from "../actions";
import Link from "next/link";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Calculate low stock dynamically for alerts
  // Note: For a real app, this joins with StockQuant. For MVP, we pass simple data.

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Product Catalog</h1>
          <p>Manage master inventory items, SKUs, and reorder levels.</p>
        </div>
        <Link href="/" className="btn btn-secondary">Back to Home</Link>
      </div>

      <div className="grid-cols-3">
        {/* Add Product Form */}
        <div className="glass-card animate-fade-in" style={{ gridColumn: 'span 1', height: 'fit-content' }}>
          <h3>Add New Product</h3>
          <form action={createProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label>Product Name</label>
              <input type="text" name="name" required placeholder="e.g. Mechanical Keyboard" />
            </div>
            <div>
              <label>SKU (Unique Code)</label>
              <input type="text" name="sku" required placeholder="e.g. ELEC-001" />
            </div>
            <div>
              <label>Category</label>
              <input type="text" name="category" required placeholder="e.g. Electronics" />
            </div>
            <div className="grid-cols-2">
              <div>
                <label>Unit</label>
                <select name="uom">
                  <option value="Units">Units</option>
                  <option value="Kg">Kg</option>
                  <option value="Boxes">Boxes</option>
                </select>
              </div>
              <div>
                <label>Reorder Level</label>
                <input type="number" name="minReorderLevel" defaultValue="10" min="0" required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Create Product</button>
          </form>
        </div>

        {/* Product List */}
        <div className="glass-card animate-fade-in" style={{ gridColumn: 'span 2', animationDelay: '0.1s' }}>
          <h3>Master Product List ({products.length})</h3>
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Min Level</th>
                  <th>UOM</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td><span className="badge badge-warning">{product.sku}</span></td>
                    <td style={{ fontWeight: 500 }}>{product.name}</td>
                    <td>{product.category}</td>
                    <td>
                      <span className="badge badge-danger">
                        {product.minReorderLevel}
                      </span>
                    </td>
                    <td>{product.uom}</td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
