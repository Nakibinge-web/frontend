import React, { useState } from 'react';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EditProductForm from '../components/EditProductForm';
import styles, { fS, exS } from '../styles/dashboardStyles';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function ProductsTab({ products, onAddProduct, loading, token, user, onProductDeleted, categories, suppliers, onProductUpdated, toast, canCreate = true, canEdit = true, canDelete = true }) {
  const API_BASE = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '')
    : 'http://localhost:8000';

  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showExpiry, setShowExpiry] = useState(false);
  const [filters, setFilters] = useState({ search: '', category: '', status: '' });

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  const getStockStatus = (stock, reorder) => {
    const s = Number(stock ?? 0), r = Number(reorder ?? 0);
    if (s === 0) return 'out';
    if (s <= r) return 'low';
    return 'in';
  };

  const filteredProducts = products.filter(p => {
    const search = filters.search.toLowerCase();
    if (search && !p.name?.toLowerCase().includes(search) && !p.sku?.toLowerCase().includes(search)) return false;
    if (filters.category && String(p.category_id) !== String(filters.category)) return false;
    if (filters.status && getStockStatus(p.stock, p.reorder_level) !== filters.status) return false;
    return true;
  });

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${API}/products/${deletingProduct.id}?tenant_id=${user.tenant_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        onProductDeleted(deletingProduct.id);
        toast.success('Product deleted', `"${deletingProduct.name}" has been removed.`);
        setDeletingProduct(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data?.message || 'Failed to delete product.');
      }
    } catch {
      setDeleteError('Error deleting product. Check your connection.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'image_path',
      title: 'Image',
      render: (value, row) => {
        const src = row.image_url || (value ? `${API_BASE}/storage/${value}` : null);
        return src
          ? <img src={src} alt="product"
            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
          : <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" />
            </svg>
          </div>;
      }
    },
    { key: 'name', title: 'Product Name' },
    { key: 'sku', title: 'SKU', render: (value) => value || <span style={{ color: '#94a3b8' }}>—</span> },
    {
      key: 'category',
      title: 'Category',
      render: (value) => value?.name ? <Badge variant="neutral" size="sm">{value.name}</Badge> : 'N/A'
    },
    {
      key: 'stock',
      title: 'Stock',
      render: (value, row) => (
        <span>{value}{row.unit ? ` ${row.unit}` : ''}</span>
      )
    },
    {
      key: 'reorder_level',
      title: 'Reorder Level',
      render: (value) => value ?? '—'
    },
    {
      key: 'price',
      title: 'Price',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>UGX {parseFloat(value || 0).toLocaleString()}</div>
          {row.cost_price != null && (
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Cost: UGX {parseFloat(row.cost_price).toLocaleString()}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, row) => {
        const stock = Number(row.stock ?? 0);
        const reorder = Number(row.reorder_level ?? 0);
        if (stock === 0) {
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca'
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              Out of Stock
            </span>
          );
        }
        if (stock <= reorder) {
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a'
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              Low Stock
            </span>
          );
        }
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: '#f0fdf4', color: '#065f46', border: '1px solid #bbf7d0'
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            In Stock
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {canEdit && (
            <button
              onClick={() => setEditingProduct(row)}
              style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid #3b82f6',
                background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 500
              }}
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => { setDeleteError(null); setDeletingProduct(row); }}
              style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid #ef4444',
                background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500
              }}
            >
              Delete
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={styles.pageContainer}>
      {/* Hero header */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inventory Management</p>
          <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.4px' }}>Products</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {products.length} product{products.length !== 1 ? 's' : ''} in your inventory
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowExpiry(true)} style={{
            padding: '9px 18px', borderRadius: 8, border: '1px solid #334155',
            background: 'transparent', color: '#94a3b8', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#a5b4fc'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}>
            Expiry Tracker
          </button>
          {canCreate && (
            <button onClick={onAddProduct} style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: '#4f46e5', color: '#fff', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#4338ca'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#4f46e5'; }}>
              + Add Product
            </button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {!loading && products.length > 0 && (
        <div className="stats-grid-4">
          {[
            { label: 'Total Products', value: products.length, color: '#4f46e5' },
            { label: 'In Stock', value: products.filter(p => Number(p.stock) > Number(p.reorder_level || 0)).length, color: '#16a34a' },
            { label: 'Low Stock', value: products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= Number(p.reorder_level || 0)).length, color: '#d97706' },
            { label: 'Out of Stock', value: products.filter(p => Number(p.stock) === 0).length, color: '#dc2626' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', borderTop: `3px solid ${s.color}` }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div style={styles.contentCard}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <input
            style={{ ...fS.input, flex: '1 1 220px' }}
            placeholder="Search by name or SKU…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
          <select style={fS.select} value={filters.category} onChange={e => setFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select style={fS.select} value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          {(filters.search || filters.category || filters.status) && (
            <button style={fS.clear} onClick={() => setFilters({ search: '', category: '', status: '' })}>
              Clear filters
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={filteredProducts}
          loading={loading}
          emptyStateProps={{
            title: filters.search || filters.category || filters.status ? 'No products match your filters' : 'No products yet',
            description: filters.search || filters.category || filters.status ? 'Try adjusting or clearing your filters.' : 'Start building your inventory by adding your first product.',
            actionLabel: filters.search || filters.category || filters.status ? 'Clear Filters' : 'Add First Product',
            onAction: filters.search || filters.category || filters.status ? () => setFilters({ search: '', category: '', status: '' }) : onAddProduct
          }}
        />
      </div>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Edit Product"
        size="lg"
      >
        {editingProduct && (
          <EditProductForm
            token={token}
            product={editingProduct}
            categories={categories}
            suppliers={suppliers}
            onSuccess={(updated) => {
              onProductUpdated(updated);
              setEditingProduct(null);
            }}
            onCancel={() => setEditingProduct(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingProduct}
        onClose={() => { setDeletingProduct(null); setDeleteError(null); }}
        title="Delete Product"
        size="sm"
      >
        {deletingProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 10
            }}>
              <span style={{ fontSize: 28 }}>🗑️</span>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 15 }}>
                  {deletingProduct.name}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  This action cannot be undone. The product and all its data will be permanently removed.
                </div>
              </div>
            </div>

            {deleteError && (
              <div style={{
                padding: '10px 14px', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: 8,
                color: '#b91c1c', fontSize: 13
              }}>
                ⚠️ {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setDeletingProduct(null); setDeleteError(null); }}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={deleteLoading}
                onClick={handleDelete}
                style={{ flex: 1 }}
              >
                {deleteLoading ? 'Deleting…' : 'Delete Product'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Expiry Goods Modal */}
      <Modal
        isOpen={showExpiry}
        onClose={() => setShowExpiry(false)}
        title="⏳ Expiry Goods Tracker"
        size="lg"
      >
        <ExpiryGoodsView products={products} />
      </Modal>
    </div>
  );
}

// Expiry Goods View Component
function ExpiryGoodsView({ products }) {
  const now = new Date();

  const expiryProducts = products
    .filter(p => p.track_expiry && p.expiry_date)
    .map(p => {
      const expiry = new Date(p.expiry_date);
      const diffMs = expiry - now;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { ...p, diffDays, expiry };
    })
    .sort((a, b) => a.diffDays - b.diffDays);

  const getStatus = (days) => {
    if (days < 0) return { label: 'Expired', variant: 'danger', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' };
    if (days <= 7) return { label: 'Critical', variant: 'danger', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' };
    if (days <= 30) return { label: 'Expiring Soon', variant: 'warning', color: '#92400e', bg: '#fffbeb', border: '#fde68a' };
    return { label: 'Good', variant: 'success', color: '#065f46', bg: '#f0fdf4', border: '#bbf7d0' };
  };

  const getTimeLabel = (days) => {
    if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
    if (days === 0) return 'Expires today!';
    if (days === 1) return '1 day remaining';
    if (days < 30) return `${days} days remaining`;
    const months = Math.floor(days / 30);
    const rem = days % 30;
    return rem > 0 ? `${months}mo ${rem}d remaining` : `${months} month${months !== 1 ? 's' : ''} remaining`;
  };

  if (expiryProducts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontWeight: 600, fontSize: 16, color: '#0f172a' }}>No expiry-tracked products</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          Enable "Track Expiry" on a product to monitor it here.
        </div>
      </div>
    );
  }

  const expired = expiryProducts.filter(p => p.diffDays < 0).length;
  const critical = expiryProducts.filter(p => p.diffDays >= 0 && p.diffDays <= 7).length;
  const soon = expiryProducts.filter(p => p.diffDays > 7 && p.diffDays <= 30).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {expired > 0 && <span style={exS.pill('#fef2f2', '#fecaca', '#b91c1c')}>🚫 {expired} Expired</span>}
        {critical > 0 && <span style={exS.pill('#fef2f2', '#fecaca', '#dc2626')}>🔴 {critical} Critical (≤7 days)</span>}
        {soon > 0 && <span style={exS.pill('#fffbeb', '#fde68a', '#92400e')}>🟡 {soon} Expiring Soon (≤30 days)</span>}
        <span style={exS.pill('#f0fdf4', '#bbf7d0', '#065f46')}>
          ✅ {expiryProducts.length - expired - critical - soon} Good
        </span>
      </div>

      {/* Product rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
        {expiryProducts.map(p => {
          const st = getStatus(p.diffDays);
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px', borderRadius: 10,
              background: st.bg, border: `1px solid ${st.border}`,
            }}>
              {/* Status bar */}
              <div style={{
                width: 4, alignSelf: 'stretch', borderRadius: 4,
                background: st.color, flexShrink: 0,
              }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {p.sku ? `SKU: ${p.sku} · ` : ''}
                  Stock: {p.stock}{p.unit ? ` ${p.unit}` : ''} ·{' '}
                  Expires: {new Date(p.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {p.manufacture_date && ` · Mfg: ${new Date(p.manufacture_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                </div>
              </div>

              {/* Time remaining badge */}
              <div style={{
                flexShrink: 0, padding: '4px 12px', borderRadius: 20,
                background: st.color, color: '#fff',
                fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
              }}>
                {getTimeLabel(p.diffDays)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProductsTab;
export { ProductsTab };
