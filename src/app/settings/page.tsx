import { prisma } from "@/lib/prisma";
import { createWarehouse, createLocation } from "../actions";
import Link from "next/link";

export default async function SettingsPage() {
  const warehouses = await prisma.warehouse.findMany({
    include: {
      locations: true,
    }
  });

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>System Settings</h1>
          <p>Configure Warehouses and Locations logic.</p>
        </div>
        <Link href="/" className="btn btn-secondary">Back to Home</Link>
      </div>

      <div className="grid-cols-2">
        {/* Warehouses */}
        <div className="glass-card animate-fade-in">
          <h3>Add Warehouse</h3>
          <form action={createWarehouse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', marginBottom: '2rem' }}>
            <div>
              <label>Warehouse Name</label>
              <input type="text" name="name" required placeholder="e.g. New York Hub" />
            </div>
            <div>
              <label>Code</label>
              <input type="text" name="code" required placeholder="e.g. NYH" />
            </div>
            <button type="submit" className="btn btn-primary">Create Warehouse</button>
          </form>

          <h3>Active Warehouses</h3>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map(w => (
                <tr key={w.id}>
                  <td><span className="badge badge-success">{w.code}</span></td>
                  <td>{w.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Locations */}
        <div className="glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h3>Add Location</h3>
          <form action={createLocation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', marginBottom: '2rem' }}>
            <div>
              <label>Location Name</label>
              <input type="text" name="name" required placeholder="e.g. Rack A" />
            </div>
            <div className="grid-cols-2">
              <div>
                <label>Parent Warehouse</label>
                <select name="warehouseId">
                  <option value="">None (External)</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Location Type</label>
                <select name="isInternal">
                  <option value="true">Internal (Stocked)</option>
                  <option value="false">External (Vendor/Customer)</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Create Location</button>
          </form>

          <h3>All Locations</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Warehouse</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.flatMap(w => w.locations.map(loc => (
                <tr key={loc.id}>
                  <td>{loc.name}</td>
                  <td>
                    {loc.isInternal ? 
                      <span className="badge badge-success">Internal</span> : 
                      <span className="badge badge-warning">External</span>}
                  </td>
                  <td>{w.name}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
