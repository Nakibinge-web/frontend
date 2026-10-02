import React, { useState, useEffect } from 'react';
import EmptyState from '../components/ui/EmptyState';
import styles, { fS } from '../styles/dashboardStyles';


function StockMovementsTab({ token, products, canCreate = true }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  // ── Adjust Stock form state ────────────────────────────────────────────────
  const [adjProduct, setAdjProduct] = useState('');
  const [adjType, setAdjType] = useState('IN');
  const [adjQty, setAdjQty] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [adjDate, setAdjDate] = useState('');
  const [adjLoading, setAdjLoading] = useState(false);
  const [adjError, setAdjError] = useState('');
  const [adjSuccess, setAdjSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/stock-movements`, { headers });
        const json = await res.json();
        setMovements(json.data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const adjTypeDescriptions = {
    IN: 'Adds quantity to current stock.',
    OUT: 'Removes quantity from current stock.',
    ADJUSTMENT: 'Sets stock to an exact absolute level.',
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjError('');
    setAdjSuccess('');
    if (!adjProduct) { setAdjError('Please select a product.'); return; }
    if (!adjQty || isNaN(adjQty) || Number(adjQty) < 1) { setAdjError('Enter a valid quantity (minimum 1).'); return; }

    setAdjLoading(true);
    try {
      const body = {
        product_id: Number(adjProduct),
        type: adjType,
        quantity: Number(adjQty),
        reason: adjReason || undefined,
        date: adjDate || undefined,
      };
      const res = await fetch(`${API_URL}/stock-movements`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to apply adjustment.');

      setAdjSuccess('Stock adjusted successfully.');
      setAdjProduct('');
      setAdjQty('');
      setAdjReason('');
      setAdjDate('');
      setAdjType('IN');

      // Refresh movements list
      const refreshRes = await fetch(`${API_URL}/stock-movements`, { headers });
      const refreshJson = await refreshRes.json();
      setMovements(refreshJson.data || []);
    } catch (err) {
      setAdjError(err.message);
    } finally {
      setAdjLoading(false);
    }
  };

  const filtered = movements.filter(m => {
    const productName = m.product?.name || '';
    if (search && !productName.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && m.type !== typeFilter) return false;
    if (productFilter && String(m.product_id) !== String(productFilter)) return false;
    return true;
  });

  const totalIn = movements.filter(m => m.type === 'IN').reduce((s, m) => s + m.quantity, 0);
  const totalOut = movements.filter(m => m.type === 'OUT').reduce((s, m) => s + m.quantity, 0);

  return (
    <div style={styles.pageContainer}>
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inventory</p>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Stock Movements</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Full audit trail of all inventory changes</p>
      </div>

      {/* Summary cards */}
      <div className="kpi-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Movements', value: movements.length, color: '#4f46e5', borderColor: '#4f46e5' },
          { label: 'Stock In', value: totalIn, color: '#16a34a', borderColor: '#16a34a' },
          { label: 'Stock Out', value: totalOut, color: '#dc2626', borderColor: '#dc2626' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: `3px solid ${k.borderColor}`, borderRadius: 12, padding: '18px 22px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: k.color, letterSpacing: '-0.5px' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <input style={{ ...fS.input, maxWidth: 240 }} placeholder="Search by product…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select style={fS.select} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>
        <select style={fS.select} value={productFilter} onChange={e => setProductFilter(e.target.value)}>
          <option value="">All Products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(search || typeFilter || productFilter) && (
          <button style={fS.clear} onClick={() => { setSearch(''); setTypeFilter(''); setProductFilter(''); }}>✕ Clear</button>
        )}
      </div>

      <div style={styles.contentCard}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading movements…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔄" title="No stock movements found"
            description={search || typeFilter || productFilter ? 'Try adjusting your filters.' : 'Stock movements are recorded automatically when sales and purchases are made.'}
            actionLabel={search || typeFilter || productFilter ? 'Clear Filters' : null}
            onAction={search || typeFilter || productFilter ? () => { setSearch(''); setTypeFilter(''); setProductFilter(''); } : null}
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['Date', 'Product', 'Type', 'Quantity', 'Reference', 'Source'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '13px 14px', color: '#475569', fontSize: 13 }}>
                    {new Date(m.date || m.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '13px 14px', fontWeight: 600, color: '#0f172a', fontSize: 14 }}>
                    {m.product?.name || `#${m.product_id}`}
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: m.type === 'IN' ? '#f0fdf4' : m.type === 'OUT' ? '#fef2f2' : '#f5f3ff',
                      color: m.type === 'IN' ? '#16a34a' : m.type === 'OUT' ? '#dc2626' : '#7c3aed',
                      border: `1px solid ${m.type === 'IN' ? '#bbf7d0' : m.type === 'OUT' ? '#fecaca' : '#ddd6fe'}`,
                    }}>
                      {m.type === 'IN' ? '📥' : m.type === 'OUT' ? '📤' : '🔧'} {m.type}
                    </span>
                  </td>
                  <td style={{ padding: '13px 14px', fontWeight: 700, fontSize: 14, color: m.type === 'IN' ? '#16a34a' : m.type === 'OUT' ? '#dc2626' : '#7c3aed' }}>
                    {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : '⇒'}{m.quantity}
                  </td>
                  <td style={{ padding: '13px 14px', color: '#475569', fontSize: 13 }}>
                    #{m.reference_id || '—'}
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: m.reference_type === 'sale' ? '#eff6ff' : m.reference_type === 'purchase' ? '#f0fdf4' : '#f5f3ff',
                      color: m.reference_type === 'sale' ? '#2563eb' : m.reference_type === 'purchase' ? '#16a34a' : '#7c3aed',
                      border: `1px solid ${m.reference_type === 'sale' ? '#bfdbfe' : m.reference_type === 'purchase' ? '#bbf7d0' : '#ddd6fe'}`,
                      textTransform: 'capitalize',
                    }}>
                      {m.reference_type || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Adjust Stock Form ───────────────────────────────────────────── */}
      {canCreate && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '28px 32px', marginTop: 28, boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <span style={{ fontSize: 22 }}>📋</span>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Adjust Stock</h2>
          </div>

          <form onSubmit={handleAdjustSubmit}>
            {/* Product */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Product <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={adjProduct}
                onChange={e => setAdjProduct(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: adjProduct ? '#0f172a' : '#94a3b8', background: '#fff', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="">— Select product —</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Adjustment Type */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Adjustment Type <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { value: 'IN', label: '⬆ Stock In', activeColor: '#16a34a', activeBg: '#f0fdf4', activeBorder: '#16a34a' },
                  { value: 'OUT', label: '⬇ Stock Out', activeColor: '#dc2626', activeBg: '#fef2f2', activeBorder: '#dc2626' },
                  { value: 'ADJUSTMENT', label: '🔧 Set Level', activeColor: '#7c3aed', activeBg: '#f5f3ff', activeBorder: '#7c3aed' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAdjType(opt.value)}
                    style={{
                      padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: `2px solid ${adjType === opt.value ? opt.activeBorder : '#e2e8f0'}`,
                      background: adjType === opt.value ? opt.activeBg : '#fff',
                      color: adjType === opt.value ? opt.activeColor : '#64748b',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>{adjTypeDescriptions[adjType]}</p>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Quantity <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={adjQty}
                onChange={e => setAdjQty(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Reason */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Reason <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Damaged goods, Stock count correction..."
                value={adjReason}
                onChange={e => setAdjReason(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Date */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Date <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>(Optional — defaults to today)</span>
              </label>
              <input
                type="date"
                value={adjDate}
                onChange={e => setAdjDate(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Error / Success feedback */}
            {adjError && (
              <div style={{ marginBottom: 16, padding: '10px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13, fontWeight: 500 }}>
                ⚠ {adjError}
              </div>
            )}
            {adjSuccess && (
              <div style={{ marginBottom: 16, padding: '10px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, color: '#16a34a', fontSize: 13, fontWeight: 500 }}>
                ✓ {adjSuccess}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={adjLoading}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                background: adjLoading ? '#86efac' : '#16a34a',
                color: '#fff', fontSize: 15, fontWeight: 700, cursor: adjLoading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {adjLoading ? 'Applying…' : 'Apply Adjustment'}
            </button>
          </form>

          {/* Low stock warnings */}
          {products.filter(p => p.reorder_level != null && p.stock <= p.reorder_level).length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ⚠ {products.filter(p => p.reorder_level != null && p.stock <= p.reorder_level).length} product{products.filter(p => p.reorder_level != null && p.stock <= p.reorder_level).length > 1 ? 's' : ''} low on stock
              </p>
              {products.filter(p => p.reorder_level != null && p.stock <= p.reorder_level).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 13, color: '#b45309', fontWeight: 700 }}>{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StockMovementsTab;
export { StockMovementsTab };
