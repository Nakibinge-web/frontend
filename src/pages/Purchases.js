import React, { useState } from 'react';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import styles, { supS } from '../styles/dashboardStyles';


function PurchasesTab({ purchases, loading, token, user, suppliers, products, categories = [], toast, onPurchaseAdded, onPurchaseUpdated, onPurchaseDeleted, canCreate = true, canEdit = true, canDelete = true }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Each line can be 'existing' (select from products) or 'new' (fill in details)
  const EMPTY_LINE = {
    mode: 'existing',          // 'existing' | 'new'
    product_id: '',            // used when mode === 'existing'
    // new product fields
    np_name: '', np_sku: '', np_barcode: '', np_unit: '',
    np_category_id: '', np_category_mode: 'existing', np_new_category: '',
    np_price: '', np_reorder: '',
    np_description: '',
    np_track_expiry: false, np_manufacture_date: '', np_expiry_date: '',
    // shared
    quantity: '', cost_price: '',
  };

  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState([{ ...EMPTY_LINE }]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');

  // Edit state
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [editSupplierId, setEditSupplierId] = useState('');
  const [editLines, setEditLines] = useState([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Date filter
  const [dateFilter, setDateFilter] = useState('all');

  // Custom day lookup
  const [customPurchaseDate, setCustomPurchaseDate] = useState('');
  const [customDayPurchases, setCustomDayPurchases] = useState(null);

  // Custom week lookup
  const [customPurchaseWeekDate, setCustomPurchaseWeekDate] = useState('');
  const [customWeekPurchases, setCustomWeekPurchases] = useState(null);
  const [customPurchaseWeekRange, setCustomPurchaseWeekRange] = useState(null);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };

  const inp = {
    width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none',
    background: '#fff', boxSizing: 'border-box',
  };

  const openModal = () => {
    setSupplierId('');
    setLines([{ ...EMPTY_LINE }]);
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const setLine = (i, key, val) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
    // Clear line-specific errors
    if (fieldErrors[`line_${i}_${key}`]) {
      setFieldErrors(prev => ({ ...prev, [`line_${i}_${key}`]: null }));
    }
  };

  const toggleMode = (i) =>
    setLines(prev => prev.map((l, idx) =>
      idx === i ? { ...EMPTY_LINE, mode: l.mode === 'existing' ? 'new' : 'existing' } : l
    ));

  const addLine = () => setLines(prev => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i));

  const lineTotal = (l) => (parseFloat(l.quantity) || 0) * (parseFloat(l.cost_price) || 0);
  const grandTotal = lines.reduce((s, l) => s + lineTotal(l), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    
    if (!supplierId) {
      errors.supplier = 'Please select a supplier';
      setFormError('Please select a supplier');
      setFieldErrors(errors);
      return;
    }

    // Validate lines
    let hasValidLine = false;
    lines.forEach((l, i) => {
      if (l.mode === 'existing') {
        if (!l.product_id) {
          errors[`line_${i}_product`] = 'Select a product';
        }
        if (!l.quantity || l.quantity <= 0) {
          errors[`line_${i}_quantity`] = 'Quantity required';
        }
        if (!l.cost_price || l.cost_price <= 0) {
          errors[`line_${i}_cost`] = 'Cost price required';
        }
        if (l.product_id && l.quantity && l.cost_price) {
          hasValidLine = true;
        }
      } else {
        // new product
        if (!l.np_name || !l.np_name.trim()) {
          errors[`line_${i}_name`] = 'Product name required';
        }
        if (!l.np_price || l.np_price <= 0) {
          errors[`line_${i}_price`] = 'Selling price required';
        }
        if (!l.quantity || l.quantity <= 0) {
          errors[`line_${i}_quantity`] = 'Quantity required';
        }
        if (!l.cost_price || l.cost_price <= 0) {
          errors[`line_${i}_cost`] = 'Cost price required';
        }
        if (l.np_track_expiry && !l.np_expiry_date) {
          errors[`line_${i}_expiry`] = 'Expiry date required';
        }
        if (l.np_name && l.np_price && l.quantity && l.cost_price) {
          hasValidLine = true;
        }
      }
    });

    if (!hasValidLine) {
      setFormError('Add at least one complete product line with all required fields');
      setFieldErrors(errors);
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormError('Please fix the errors in the form');
      setFieldErrors(errors);
      return;
    }

    // Validate lines
    const validLines = lines.filter(l => {
      if (l.mode === 'existing') return l.product_id && l.quantity && l.cost_price;
      return l.np_name && l.np_price && l.quantity && l.cost_price;
    });

    const items = validLines.map(l => {
      if (l.mode === 'existing') {
        return {
          product_id: l.product_id,
          quantity: parseInt(l.quantity),
          cost_price: parseFloat(l.cost_price),
        };
      }
      // new product — omit product_id, include new_product object
      return {
        quantity: parseInt(l.quantity),
        cost_price: parseFloat(l.cost_price),
        new_product: {
          name: l.np_name,
          sku: l.np_sku || undefined,
          barcode: l.np_barcode || undefined,
          unit: l.np_unit || undefined,
          category_id: l.np_category_mode === 'existing' ? (l.np_category_id || undefined) : undefined,
          new_category: l.np_category_mode === 'new' ? (l.np_new_category || undefined) : undefined,
          price: parseFloat(l.np_price),
          reorder_level: l.np_reorder ? parseFloat(l.np_reorder) : undefined,
          description: l.np_description || undefined,
          track_expiry: l.np_track_expiry ? 1 : 0,
          manufacture_date: l.np_track_expiry ? (l.np_manufacture_date || undefined) : undefined,
          expiry_date: l.np_track_expiry ? (l.np_expiry_date || undefined) : undefined,
        },
      };
    });

    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`${API_URL}/purchases`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ supplier_id: supplierId, items }),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json?.message || 'Something went wrong.'); return; }
      onPurchaseAdded(json.data, json.new_products || []);
      toast.success('Purchase recorded', `UGX ${parseFloat(json.data.total_amount || 0).toLocaleString()} purchase recorded.`);
      setShowModal(false);
    } catch { setFormError('Could not reach the server.'); }
    finally { setSaving(false); }
  };

  const filtered = purchases.filter(p => {
    // Search filter
    const matchesSearch =
      p.supplier?.name?.toLowerCase().includes(search.toLowerCase()) ||
      new Date(p.purchase_date).toLocaleDateString().includes(search);
    if (!matchesSearch) return false;

    // Date filter
    if (dateFilter === 'all') return true;
    const raw = (p.purchase_date || p.created_at || '').slice(0, 10);
    const [y, m, d] = raw.split('-').map(Number);
    const purchaseDate = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateFilter === 'today') return purchaseDate.getTime() === today.getTime();
    if (dateFilter === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return purchaseDate >= startOfWeek;
    }
    if (dateFilter === 'month') {
      return purchaseDate.getMonth() === today.getMonth() && purchaseDate.getFullYear() === today.getFullYear();
    }
    return true;
  });

  const openEdit = (p) => {
    setEditingPurchase(p);
    setEditSupplierId(String(p.supplier_id || p.supplier?.id || ''));
    setEditLines((p.purchase_items || []).map(item => ({
      ...EMPTY_LINE,
      mode: 'existing',
      product_id: String(item.product_id),
      quantity: String(item.quantity),
      cost_price: String(item.cost_price),
    })));
    setEditError(null);
  };

  const setEditLine = (i, key, val) =>
    setEditLines(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l));

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editSupplierId) { setEditError('Please select a supplier.'); return; }
    const validLines = editLines.filter(l => l.product_id && l.quantity && l.cost_price);
    if (validLines.length === 0) { setEditError('Add at least one complete product line.'); return; }
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`${API_URL}/purchases/${editingPurchase.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          supplier_id: editSupplierId,
          items: validLines.map(l => ({
            product_id: parseInt(l.product_id),
            quantity: parseInt(l.quantity),
            cost_price: parseFloat(l.cost_price),
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setEditError(json?.message || 'Failed to update purchase.'); return; }
      onPurchaseUpdated(json.data);
      toast.success('Purchase updated', 'The purchase has been corrected successfully.');
      setEditingPurchase(null);
    } catch { setEditError('Could not reach the server.'); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/purchases/${confirmDelete.id}`, { method: 'DELETE', headers });
      if (!res.ok) { const j = await res.json(); toast.error('Delete failed', j?.message || 'Failed to delete purchase.'); return; }
      onPurchaseDeleted(confirmDelete.id, confirmDelete);
      toast.success('Purchase deleted', 'Stock levels have been reversed.');
      setConfirmDelete(null);
    } catch { toast.error('Delete failed', 'Could not reach the server.'); }
    finally { setDeleting(false); }
  };

  return (
    <div style={styles.pageContainer}>
      {/* Header banner */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Procurement</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Purchases</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>{purchases.length} purchase{purchases.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {purchases.length > 0 && (
            <input
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', width: 220 }}
              placeholder="Search by supplier or date…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          )}
          {canCreate && (
            <button
              onClick={openModal}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
              onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
            >
              + Record Purchase
            </button>
          )}
        </div>
      </div>

      {/* KPI summary cards */}
      {!loading && purchases.length > 0 && (
        <div className="kpi-grid-3">
          {[
            { label: 'Total Purchases', value: filtered.length, icon: '🧾', color: '#4f46e5', bg: '#eef2ff' },
            { label: 'Total Spent', value: `UGX ${filtered.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0).toLocaleString()}`, icon: '💸', color: '#dc2626', bg: '#fef2f2' },
            { label: 'Average Purchase', value: `UGX ${filtered.length ? Math.round(filtered.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0) / filtered.length).toLocaleString() : 0}`, icon: '📊', color: '#0891b2', bg: '#ecfeff' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchases table */}
      <div style={styles.contentCard}>

        {/* Date filter bar */}
        {!loading && purchases.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: '4px', background: '#f1f5f9', borderRadius: 12, width: 'fit-content' }}>
            {[
              { key: 'all', label: 'All Purchases', icon: '⊞' },
              { key: 'today', label: 'Today', icon: '◎' },
              { key: 'week', label: 'This Week', icon: '▦' },
              { key: 'month', label: 'This Month', icon: '▤' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setDateFilter(f.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 9, border: 'none',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: dateFilter === f.key ? '#fff' : 'transparent',
                  color: dateFilter === f.key ? '#4f46e5' : '#64748b',
                  boxShadow: dateFilter === f.key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 11, opacity: 0.7 }}>{f.icon}</span> {f.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading purchases…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search || dateFilter !== 'all' ? 'No purchases match your filters' : 'No purchases yet'}
            description={search || dateFilter !== 'all' ? 'Try a different supplier, date, or filter.' : 'Record purchases from suppliers to track inventory costs.'}
            actionLabel={search || dateFilter !== 'all' ? 'Clear Filters' : (canCreate ? 'Record First Purchase' : undefined)}
            onAction={search || dateFilter !== 'all' ? () => { setSearch(''); setDateFilter('all'); } : (canCreate ? openModal : undefined)}
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['Date', 'Supplier', 'Items', 'Total Amount', 'Details', ...(canEdit || canDelete ? ['Actions'] : [])].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <React.Fragment key={p.id}>
                  <tr style={{ borderBottom: expandedId === p.id ? 'none' : '1px solid #f8fafc', background: expandedId === p.id ? '#fafbff' : 'transparent' }}>
                    <td style={{ padding: '14px', color: '#475569', fontSize: 14 }}>{new Date(p.purchase_date).toLocaleDateString()}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                        {p.supplier?.name || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '14px', color: '#475569', fontSize: 14 }}>
                      {p.purchase_items?.length || 0} item{(p.purchase_items?.length || 0) !== 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                      UGX {parseFloat(p.total_amount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <button
                        onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                        style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                      >
                        {expandedId === p.id ? '▲ Hide' : '▼ View'}
                      </button>
                    </td>
                    {(canEdit || canDelete) && (
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {canEdit && (
                            <button
                              onClick={() => openEdit(p)}
                              style={{ padding: '5px 11px', borderRadius: 6, border: '1px solid #3b82f6', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setConfirmDelete(p)}
                              style={{ padding: '5px 11px', borderRadius: 6, border: '1px solid #ef4444', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                  {expandedId === p.id && (
                    <tr key={`${p.id}-exp`}>
                      <td colSpan={canEdit || canDelete ? 6 : 5} style={{ padding: '0 14px 16px', background: '#fafbff' }}>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['Product', 'Qty', 'Cost Price', 'Subtotal'].map(h => (
                                  <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(p.purchase_items || []).map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 14px', fontSize: 14, color: '#0f172a' }}>{item.product?.name || `Product #${item.product_id}`}</td>
                                  <td style={{ padding: '10px 14px', fontSize: 14, color: '#475569' }}>{item.quantity}</td>
                                  <td style={{ padding: '10px 14px', fontSize: 14, color: '#475569' }}>UGX {parseFloat(item.cost_price || 0).toLocaleString()}</td>
                                  <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>UGX {(item.quantity * item.cost_price).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Purchases Query Filters Grid (Day & Week side-by-side) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginTop: 24, alignItems: 'stretch' }}>
        
        {/* Card 1: Purchases by Specific Day */}
        <div style={{ 
          background: '#fff', 
          border: customDayPurchases !== null ? '1.5px solid #6366f1' : '1px solid #e2e8f0', 
          borderRadius: 14, 
          padding: 20,
          boxShadow: customDayPurchases !== null ? '0 4px 14px -2px rgba(99, 102, 241, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16,
          transition: 'all 0.2s ease'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  🔍
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Purchases by Specific Day</h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Select any single date to view all purchases</p>
                </div>
              </div>
              {customDayPurchases !== null && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#e0e7ff', color: '#4338ca', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f46e5' }}></span>
                  Active
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Select Date
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="date"
                  value={customPurchaseDate}
                  onChange={e => { setCustomPurchaseDate(e.target.value); setCustomDayPurchases(null); }}
                  style={{ 
                    flex: 1, 
                    padding: '9px 12px', 
                    border: '1.5px solid #e2e8f0', 
                    borderRadius: 9, 
                    fontSize: 13, 
                    fontFamily: 'inherit', 
                    outline: 'none', 
                    background: '#fff', 
                    color: '#0f172a', 
                    cursor: 'pointer' 
                  }}
                />
                <button
                  onClick={() => {
                    if (!customPurchaseDate) return;
                    const [y, m, d] = customPurchaseDate.split('-').map(Number);
                    const target = new Date(y, m - 1, d);
                    const results = purchases.filter(p => {
                      const raw = (p.purchase_date || p.created_at || '').slice(0, 10);
                      const [py, pm, pd] = raw.split('-').map(Number);
                      return new Date(py, pm - 1, pd).getTime() === target.getTime();
                    });
                    setCustomWeekPurchases(null);
                    setCustomPurchaseWeekRange(null);
                    setCustomDayPurchases(results);
                  }}
                  style={{ 
                    padding: '9px 18px', 
                    borderRadius: 9, 
                    border: 'none', 
                    background: customPurchaseDate ? '#4f46e5' : '#f1f5f9', 
                    color: customPurchaseDate ? '#fff' : '#94a3b8', 
                    fontSize: 13, 
                    fontWeight: 700, 
                    cursor: customPurchaseDate ? 'pointer' : 'not-allowed', 
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                    boxShadow: customPurchaseDate ? '0 1px 2px rgba(79, 70, 229, 0.2)' : 'none'
                  }}
                >
                  View Purchases
                </button>
                {customDayPurchases !== null && (
                  <button
                    onClick={() => { setCustomDayPurchases(null); setCustomPurchaseDate(''); }}
                    style={{ padding: '9px 13px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick presets for Day */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>Quick Select:</span>
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                setCustomPurchaseDate(today);
                const [y, m, d] = today.split('-').map(Number);
                const target = new Date(y, m - 1, d);
                const results = purchases.filter(p => {
                  const raw = (p.purchase_date || p.created_at || '').slice(0, 10);
                  const [py, pm, pd] = raw.split('-').map(Number);
                  return new Date(py, pm - 1, pd).getTime() === target.getTime();
                });
                setCustomWeekPurchases(null);
                setCustomPurchaseWeekRange(null);
                setCustomDayPurchases(results);
              }}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const dObj = new Date();
                dObj.setDate(dObj.getDate() - 1);
                const yest = dObj.toISOString().slice(0, 10);
                setCustomPurchaseDate(yest);
                const [y, m, d] = yest.split('-').map(Number);
                const target = new Date(y, m - 1, d);
                const results = purchases.filter(p => {
                  const raw = (p.purchase_date || p.created_at || '').slice(0, 10);
                  const [py, pm, pd] = raw.split('-').map(Number);
                  return new Date(py, pm - 1, pd).getTime() === target.getTime();
                });
                setCustomWeekPurchases(null);
                setCustomPurchaseWeekRange(null);
                setCustomDayPurchases(results);
              }}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Card 2: Purchases by Specific Week */}
        <div style={{ 
          background: '#fff', 
          border: customWeekPurchases !== null ? '1.5px solid #3b82f6' : '1px solid #e2e8f0', 
          borderRadius: 14, 
          padding: 20,
          boxShadow: customWeekPurchases !== null ? '0 4px 14px -2px rgba(59, 130, 246, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16,
          transition: 'all 0.2s ease'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  📅
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Purchases by Specific Week</h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Pick any date — shows full week (Mon – Sun)</p>
                </div>
              </div>
              {customWeekPurchases !== null && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#dbeafe', color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }}></span>
                  Active
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Any Date In The Week
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="date"
                  value={customPurchaseWeekDate}
                  onChange={e => { setCustomPurchaseWeekDate(e.target.value); setCustomWeekPurchases(null); setCustomPurchaseWeekRange(null); }}
                  style={{ 
                    flex: 1, 
                    padding: '9px 12px', 
                    border: '1.5px solid #e2e8f0', 
                    borderRadius: 9, 
                    fontSize: 13, 
                    fontFamily: 'inherit', 
                    outline: 'none', 
                    background: '#fff', 
                    color: '#0f172a', 
                    cursor: 'pointer' 
                  }}
                />
                <button
                  onClick={() => {
                    if (!customPurchaseWeekDate) return;
                    const [y, m, d] = customPurchaseWeekDate.split('-').map(Number);
                    const picked = new Date(y, m - 1, d);
                    const dow = picked.getDay();
                    const monday = new Date(picked);
                    monday.setDate(picked.getDate() - (dow === 0 ? 6 : dow - 1));
                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    const results = purchases.filter(p => {
                      const raw = (p.purchase_date || p.created_at || '').slice(0, 10);
                      const [py, pm, pd] = raw.split('-').map(Number);
                      const pd2 = new Date(py, pm - 1, pd);
                      return pd2 >= monday && pd2 <= sunday;
                    });
                    setCustomDayPurchases(null);
                    setCustomWeekPurchases(results);
                    setCustomPurchaseWeekRange({ monday, sunday });
                  }}
                  style={{ 
                    padding: '9px 18px', 
                    borderRadius: 9, 
                    border: 'none', 
                    background: customPurchaseWeekDate ? '#4f46e5' : '#f1f5f9', 
                    color: customPurchaseWeekDate ? '#fff' : '#94a3b8', 
                    fontSize: 13, 
                    fontWeight: 700, 
                    cursor: customPurchaseWeekDate ? 'pointer' : 'not-allowed', 
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                    boxShadow: customPurchaseWeekDate ? '0 1px 2px rgba(79, 70, 229, 0.2)' : 'none'
                  }}
                >
                  View Week
                </button>
                {customWeekPurchases !== null && (
                  <button
                    onClick={() => { setCustomWeekPurchases(null); setCustomPurchaseWeekDate(''); setCustomPurchaseWeekRange(null); }}
                    style={{ padding: '9px 13px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick presets for Week */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>Quick Select:</span>
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                setCustomPurchaseWeekDate(today);
                const [y, m, d] = today.split('-').map(Number);
                const picked = new Date(y, m - 1, d);
                const dow = picked.getDay();
                const monday = new Date(picked);
                monday.setDate(picked.getDate() - (dow === 0 ? 6 : dow - 1));
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                const results = purchases.filter(p => {
                  const raw = (p.purchase_date || p.created_at || '').slice(0, 10);
                  const [py, pm, pd] = raw.split('-').map(Number);
                  const pd2 = new Date(py, pm - 1, pd);
                  return pd2 >= monday && pd2 <= sunday;
                });
                setCustomDayPurchases(null);
                setCustomWeekPurchases(results);
                setCustomPurchaseWeekRange({ monday, sunday });
              }}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => {
                const dObj = new Date();
                dObj.setDate(dObj.getDate() - 7);
                const lastWeekDate = dObj.toISOString().slice(0, 10);
                setCustomPurchaseWeekDate(lastWeekDate);
                const [y, m, d] = lastWeekDate.split('-').map(Number);
                const picked = new Date(y, m - 1, d);
                const dow = picked.getDay();
                const monday = new Date(picked);
                monday.setDate(picked.getDate() - (dow === 0 ? 6 : dow - 1));
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                const results = purchases.filter(p => {
                  const raw = (p.purchase_date || p.created_at || '').slice(0, 10);
                  const [py, pm, pd] = raw.split('-').map(Number);
                  const pd2 = new Date(py, pm - 1, pd);
                  return pd2 >= monday && pd2 <= sunday;
                });
                setCustomDayPurchases(null);
                setCustomWeekPurchases(results);
                setCustomPurchaseWeekRange({ monday, sunday });
              }}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              Last Week
            </button>
          </div>
        </div>

      </div>

      {/* ── Day Purchases Results View ── */}
      {customDayPurchases !== null && (
        <div style={{ ...styles.contentCard, marginTop: 20, border: '1.5px solid #6366f1', borderRadius: 14 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🔍</div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Purchases on {new Date(...customPurchaseDate.split('-').map((v, i) => i === 1 ? v - 1 : +v)).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </h4>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Filtered single day results</p>
              </div>
            </div>
            <button
              onClick={() => { setCustomDayPurchases(null); setCustomPurchaseDate(''); }}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              ✕ Close Results
            </button>
          </div>

          {/* Summary banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '16px 22px', background: '#4f46e5', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Date</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', maxWidth: 200 }}>
                {new Date(...customPurchaseDate.split('-').map((v, i) => i === 1 ? v - 1 : +v))
                  .toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div style={{ padding: '16px 22px', borderRight: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Purchases</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#4f46e5', fontFamily: "'DM Mono', monospace, sans-serif" }}>{customDayPurchases.length}</div>
            </div>
            <div style={{ padding: '16px 22px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Total Spent</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', fontFamily: "'DM Mono', monospace, sans-serif" }}>
                UGX {customDayPurchases.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>

          {customDayPurchases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>🗓️</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>No purchases recorded on this day</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Try selecting a different date</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', background: '#f8fafc' }}>
                  {['Supplier', 'Items', 'Total Amount'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customDayPurchases.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                        {p.supplier?.name || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px', color: '#475569', fontSize: 14 }}>
                      {p.purchase_items?.length || 0} item{(p.purchase_items?.length || 0) !== 1 ? 's' : ''}
                      {(p.purchase_items || []).length > 0 && (
                        <ul style={{ margin: '6px 0 0', paddingLeft: 16, listStyle: 'disc' }}>
                          {(p.purchase_items || []).map((item, idx) => (
                            <li key={idx} style={{ fontSize: 12, color: '#64748b' }}>
                              {item.product?.name || `Product #${item.product_id}`} × {item.quantity} @ UGX {parseFloat(item.cost_price || 0).toLocaleString()}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td style={{ padding: '13px 14px', fontWeight: 700, color: '#0f172a', fontSize: 14, fontFamily: "'DM Mono', monospace, sans-serif" }}>
                      UGX {parseFloat(p.total_amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Week Purchases Results View ── */}
      {customWeekPurchases !== null && customPurchaseWeekRange !== null && (() => {
        const { monday, sunday } = customPurchaseWeekRange;
        const fmt = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const weekTotal = customWeekPurchases.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayBreakdown = Array.from({ length: 7 }, (_, i) => {
          const day = new Date(monday);
          day.setDate(monday.getDate() + i);
          const dayPurchases = customWeekPurchases.filter(p => {
            const raw = (p.purchase_date || p.created_at || '').slice(0, 10);
            const [py, pm, pd] = raw.split('-').map(Number);
            return new Date(py, pm - 1, pd).getTime() === day.getTime();
          });
          return {
            day,
            name: dayNames[i],
            count: dayPurchases.length,
            total: dayPurchases.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0),
          };
        });
        const maxDayTotal = Math.max(...dayBreakdown.map(d => d.total), 1);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return (
          <div style={{ ...styles.contentCard, marginTop: 20, border: '1.5px solid #3b82f6', borderRadius: 14 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>📅</div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Purchases for Week: {fmt(monday)} – {fmt(sunday)}
                  </h4>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Filtered 7-day weekly summary & breakdown</p>
                </div>
              </div>
              <button
                onClick={() => { setCustomWeekPurchases(null); setCustomPurchaseWeekDate(''); setCustomPurchaseWeekRange(null); }}
                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                ✕ Close Results
              </button>
            </div>

            {/* Summary banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Week</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{fmt(monday)}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>to {fmt(sunday)}</div>
              </div>
              <div style={{ padding: '16px 22px', borderRight: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Purchases</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8', fontFamily: "'DM Mono', monospace, sans-serif" }}>{customWeekPurchases.length}</div>
              </div>
              <div style={{ padding: '16px 22px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Total Spent</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', fontFamily: "'DM Mono', monospace, sans-serif" }}>UGX {weekTotal.toLocaleString()}</div>
              </div>
            </div>

            {/* Day-by-day breakdown cards */}
            <div className="week-day-grid" style={{ marginBottom: 20 }}>
              {dayBreakdown.map(({ day, name, count, total }) => {
                const isToday = day.getTime() === today.getTime();
                const barPct = Math.round((total / maxDayTotal) * 100);
                return (
                  <div key={name} style={{ background: isToday ? '#eff6ff' : '#fff', border: `1.5px solid ${isToday ? '#3b82f6' : '#e2e8f0'}`, borderRadius: 12, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? '#3b82f6' : '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                    <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barPct}%`, background: count > 0 ? '#3b82f6' : '#e2e8f0', borderRadius: 2, transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: count > 0 ? '#1d4ed8' : '#d1d5db', lineHeight: 1, fontFamily: "'DM Mono', monospace, sans-serif" }}>{count}</div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: count > 0 ? '#64748b' : '#d1d5db', fontFamily: "'DM Mono', monospace, sans-serif" }}>{count > 0 ? `UGX ${total.toLocaleString()}` : '—'}</div>
                  </div>
                );
              })}
            </div>

            {customWeekPurchases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 38, marginBottom: 10 }}>📅</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>No purchases recorded in this week</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Try picking a date from a different week</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', background: '#f8fafc' }}>
                    {['Date', 'Supplier', 'Items', 'Total Amount'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customWeekPurchases.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '13px 14px', color: '#475569', fontSize: 13 }}>
                        {new Date(...(p.purchase_date || p.created_at || '').slice(0, 10).split('-').map((v, i) => i === 1 ? v - 1 : +v))
                          .toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </td>
                      <td style={{ padding: '13px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                          {p.supplier?.name || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 14px', color: '#475569', fontSize: 14 }}>
                        {p.purchase_items?.length || 0} item{(p.purchase_items?.length || 0) !== 1 ? 's' : ''}
                      </td>
                      <td style={{ padding: '13px 14px', fontWeight: 700, color: '#0f172a', fontSize: 14, fontFamily: "'DM Mono', monospace, sans-serif" }}>
                        UGX {parseFloat(p.total_amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })()}

      {/* Record Purchase Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record New Purchase" size="lg">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Supplier */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={supS.label}>Select Supplier (Required)</label>
            <select style={{ ...supS.input, borderColor: fieldErrors.supplier ? '#dc2626' : '#e2e8f0' }} value={supplierId} onChange={e => { setSupplierId(e.target.value); if (fieldErrors.supplier) setFieldErrors(prev => ({ ...prev, supplier: null })); }}>
              <option value="">— Choose supplier for this purchase —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {fieldErrors.supplier && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4 }}>{fieldErrors.supplier}</span>}
          </div>

          {/* Product Lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={supS.label}>Purchase Items (Required)</label>
              <button type="button" onClick={addLine} style={{ fontSize: 13, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                + Add Line
              </button>
            </div>

            {lines.map((line, i) => (
              <div key={i} style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '14px', background: line.mode === 'new' ? '#fafbff' : '#fff' }}>

                {/* Mode toggle + remove */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['existing', 'new'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMode(i)}
                        style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                          border: '1.5px solid',
                          borderColor: line.mode === m ? '#4f46e5' : '#e2e8f0',
                          background: line.mode === m ? '#4f46e5' : '#fff',
                          color: line.mode === m ? '#fff' : '#94a3b8',
                          cursor: 'pointer',
                        }}
                      >
                        {m === 'existing' ? '📦 Existing Product' : '✨ New Product'}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    disabled={lines.length === 1}
                    style={{ padding: '5px 9px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', cursor: lines.length === 1 ? 'not-allowed' : 'pointer', opacity: lines.length === 1 ? 0.4 : 1, fontSize: 13 }}
                  >
                    ✕ Remove
                  </button>
                </div>

                {/* Existing product row */}
                {line.mode === 'existing' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product (Required)</span>
                      <select style={inp} value={line.product_id} onChange={e => setLine(i, 'product_id', e.target.value)}>
                        <option value="">— Choose inventory product —</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                      </select>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Quantity (Required)</span>
                      <input style={inp} type="number" min="1" placeholder="0" value={line.quantity}
                        onChange={e => setLine(i, 'quantity', e.target.value)} />
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Purchase Cost (UGX) (Required)</span>
                      <input style={inp} type="number" min="0" step="0.01" placeholder="0.00" value={line.cost_price}
                        onChange={e => setLine(i, 'cost_price', e.target.value)} />
                    </div>
                  </div>
                )}

                {/* New product rows */}
                {line.mode === 'new' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Row 1: Name + SKU + Barcode */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product Name (Required)</span>
                        <input style={inp} placeholder="e.g., Memory Foam Mattress Queen Size" value={line.np_name}
                          onChange={e => setLine(i, 'np_name', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>SKU Code</span>
                        <input style={inp} placeholder="e.g., MAT-QN-001" value={line.np_sku}
                          onChange={e => setLine(i, 'np_sku', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Barcode</span>
                        <input style={inp} placeholder="Scan barcode" value={line.np_barcode}
                          onChange={e => setLine(i, 'np_barcode', e.target.value)} />
                      </div>
                    </div>

                    {/* Row 2: Unit + Category */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Unit of Measure</span>
                        <select style={inp} value={line.np_unit}
                          onChange={e => setLine(i, 'np_unit', e.target.value)}>
                          <option value="">— Select unit —</option>
                          {['Pieces (pcs)', 'Kilograms (kg)', 'Grams (g)', 'Litres (L)', 'Millilitres (mL)', 'Metres (m)', 'Centimetres (cm)', 'Boxes', 'Cartons', 'Dozens', 'Pairs', 'Rolls', 'Bags', 'Bottles', 'Cans'].map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product Category</span>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                          {['existing', 'new'].map(m => (
                            <button
                              key={m} type="button"
                              onClick={() => setLine(i, 'np_category_mode', m)}
                              style={{
                                flex: 1, padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                border: '1.5px solid',
                                borderColor: line.np_category_mode === m ? '#4f46e5' : '#e2e8f0',
                                background: line.np_category_mode === m ? '#ede9fe' : '#f8fafc',
                                color: line.np_category_mode === m ? '#4f46e5' : '#94a3b8',
                                cursor: 'pointer',
                              }}
                            >
                              {m === 'existing' ? '📂 Existing' : '➕ New'}
                            </button>
                          ))}
                        </div>
                        {line.np_category_mode === 'existing' ? (
                          <select style={inp} value={line.np_category_id}
                            onChange={e => setLine(i, 'np_category_id', e.target.value)}>
                            <option value="">— No category —</option>
                            {(categories || []).map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input style={inp} placeholder="e.g., Orthopedic Mattresses"
                            value={line.np_new_category}
                            onChange={e => setLine(i, 'np_new_category', e.target.value)} />
                        )}
                      </div>
                    </div>

                    {/* Row 3: Selling Price + Reorder + Qty + Cost Price */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Retail Price (UGX) (Required)</span>
                        <input style={inp} type="number" min="0" step="0.01" placeholder="0.00" value={line.np_price}
                          onChange={e => setLine(i, 'np_price', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Low Stock Alert Level</span>
                        <input style={inp} type="number" min="0" placeholder="0" value={line.np_reorder}
                          onChange={e => setLine(i, 'np_reorder', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Purchase Quantity (Required)</span>
                        <input style={inp} type="number" min="1" placeholder="0" value={line.quantity}
                          onChange={e => setLine(i, 'quantity', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Purchase Cost (UGX) (Required)</span>
                        <input style={inp} type="number" min="0" step="0.01" placeholder="0.00" value={line.cost_price}
                          onChange={e => setLine(i, 'cost_price', e.target.value)} />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product Description (Optional)</span>
                      <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }}
                        placeholder="e.g., 12-inch thick memory foam with cooling gel technology"
                        value={line.np_description}
                        onChange={e => setLine(i, 'np_description', e.target.value)} />
                    </div>

                    {/* Track expiry toggle */}
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                      padding: '10px 12px', background: '#f8fafc', borderRadius: 8,
                      border: '1.5px solid #e2e8f0',
                    }}>
                      <div style={{
                        width: 40, height: 22, borderRadius: 11, position: 'relative', flexShrink: 0,
                        background: line.np_track_expiry ? '#4f46e5' : '#e2e8f0', transition: 'background 0.2s',
                      }}>
                        <div style={{
                          position: 'absolute', top: 2, width: 18, height: 18,
                          background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          transform: line.np_track_expiry ? 'translateX(20px)' : 'translateX(2px)',
                          transition: 'transform 0.2s',
                        }} />
                      </div>
                      <input type="checkbox" style={{ display: 'none' }}
                        checked={line.np_track_expiry}
                        onChange={e => setLine(i, 'np_track_expiry', e.target.checked)} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Track Expiry Date</span>
                    </label>

                    {/* Expiry date fields */}
                    {line.np_track_expiry && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '10px 12px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 8 }}>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Manufacture Date</span>
                          <input style={inp} type="date" value={line.np_manufacture_date}
                            onChange={e => setLine(i, 'np_manufacture_date', e.target.value)} />
                        </div>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Expiry Date *</span>
                          <input style={inp} type="date" value={line.np_expiry_date}
                            min={line.np_manufacture_date || undefined}
                            onChange={e => setLine(i, 'np_expiry_date', e.target.value)} />
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: 12, color: '#6366f1', background: '#eef2ff', borderRadius: 6, padding: '6px 10px' }}>
                      ✨ This product will be created in your inventory with the quantity above as its initial stock.
                    </div>
                  </div>
                )}

                {/* Line subtotal */}
                {lineTotal(line) > 0 && (
                  <div style={{ marginTop: 8, textAlign: 'right', fontSize: 13, color: '#64748b' }}>
                    Subtotal: <strong style={{ color: '#0f172a' }}>UGX {lineTotal(line).toLocaleString()}</strong>
                  </div>
                )}
              </div>
            ))}

            {/* Grand total */}
            {grandTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Total: UGX {grandTotal.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {formError && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
              ⚠️ {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving} style={{ flex: 1 }}>
              {saving ? 'Recording…' : 'Record Purchase'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Purchase Modal ── */}
      <Modal isOpen={!!editingPurchase} onClose={() => setEditingPurchase(null)} title="Edit Purchase" size="lg">
        {editingPurchase && (
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Supplier */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Supplier *</label>
              <select
                style={{ ...inp, padding: '10px 12px', borderRadius: 10, fontSize: 14 }}
                value={editSupplierId}
                onChange={e => setEditSupplierId(e.target.value)}
                required
              >
                <option value="">— Select supplier —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Line items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Items *</label>
                <button
                  type="button"
                  onClick={() => setEditLines(prev => [...prev, { ...EMPTY_LINE }])}
                  style={{ fontSize: 13, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  + Add Line
                </button>
              </div>

              {editLines.map((line, i) => (
                <div key={i} style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px', background: '#fff' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product *</span>
                      <select
                        style={inp}
                        value={line.product_id}
                        onChange={e => setEditLine(i, 'product_id', e.target.value)}
                        required
                      >
                        <option value="">— Select product —</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Qty *</span>
                      <input
                        style={inp}
                        type="number" min="1" placeholder="0"
                        value={line.quantity}
                        onChange={e => setEditLine(i, 'quantity', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Cost Price (UGX) *</span>
                      <input
                        style={inp}
                        type="number" min="0" step="0.01" placeholder="0.00"
                        value={line.cost_price}
                        onChange={e => setEditLine(i, 'cost_price', e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditLines(prev => prev.filter((_, idx) => idx !== i))}
                      disabled={editLines.length === 1}
                      style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', cursor: editLines.length === 1 ? 'not-allowed' : 'pointer', opacity: editLines.length === 1 ? 0.4 : 1, fontSize: 13, alignSelf: 'flex-end' }}
                    >
                      ✕
                    </button>
                  </div>
                  {/* line subtotal */}
                  {(parseFloat(line.quantity) || 0) * (parseFloat(line.cost_price) || 0) > 0 && (
                    <div style={{ marginTop: 8, textAlign: 'right', fontSize: 12, color: '#64748b' }}>
                      Subtotal: <strong style={{ color: '#0f172a' }}>
                        UGX {((parseFloat(line.quantity) || 0) * (parseFloat(line.cost_price) || 0)).toLocaleString()}
                      </strong>
                    </div>
                  )}
                </div>
              ))}

              {/* Grand total */}
              {editLines.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.cost_price) || 0), 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    Total: UGX {editLines.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.cost_price) || 0), 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {editError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                ⚠️ {editError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
              <Button type="button" variant="secondary" onClick={() => setEditingPurchase(null)} style={{ flex: 1 }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={editSaving} style={{ flex: 1 }}>
                {editSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Purchase">
        {confirmDelete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#991b1b', fontSize: 15 }}>
                ⚠️ This action cannot be undone
              </p>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
                Deleting this purchase will <strong>reverse all stock levels</strong> for the items in this order. The following purchase will be permanently removed:
              </p>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Supplier</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{confirmDelete.supplier?.name || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Date</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{new Date(confirmDelete.purchase_date).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Items</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{confirmDelete.purchase_items?.length || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Total Amount</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>UGX {parseFloat(confirmDelete.total_amount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button type="button" variant="secondary" onClick={() => setConfirmDelete(null)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 1, padding: '10px 20px', borderRadius: 8, border: 'none', background: deleting ? '#fca5a5' : '#ef4444', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                {deleting ? 'Deleting…' : 'Yes, Delete Purchase'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PurchasesTab;
export { PurchasesTab };
