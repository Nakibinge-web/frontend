import React, { useState } from 'react';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import styles, { supS } from '../styles/dashboardStyles';


function SuppliersTab({ suppliers, loading, token, user, toast, onSupplierAdded, onSupplierUpdated, onSupplierDeleted, canCreate = true, canEdit = true, canDelete = true }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const EMPTY_FORM = { name: '', contact: '', email: '', address: '' };
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const openEdit = (supplier) => {
    setEditTarget(supplier);
    setForm({ name: supplier.name, contact: supplier.contact || '', email: supplier.email || '', address: supplier.address || '' });
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const handleDelete = async (supplier) => {
    if (!window.confirm(`Delete supplier "${supplier.name}"? This cannot be undone.`)) return;
    setDeletingId(supplier.id);
    try {
      const res = await fetch(`${API_URL}/suppliers/${supplier.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to delete supplier');
      onSupplierDeleted(supplier.id);
      toast.success('Supplier deleted', `"${supplier.name}" has been removed.`);
    } catch (e) {
      toast.error('Delete failed', e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    // Custom validation
    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Supplier name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Supplier name must be at least 2 characters';
    } else if (form.name.trim().length > 100) {
      errors.name = 'Supplier name must not exceed 100 characters';
    }
    
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (form.contact && form.contact.trim() && !/^[\d\s+\-()]+$/.test(form.contact)) {
      errors.contact = 'Invalid phone number format';
    }
    
    if (form.address && form.address.length > 500) {
      errors.address = 'Address must not exceed 500 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please fix the errors below');
      setSaving(false);
      return;
    }

    try {
      const isEdit = !!editTarget;
      const url = isEdit ? `${API_URL}/suppliers/${editTarget.id}` : `${API_URL}/suppliers`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: JSON.stringify({ 
          name: form.name.trim(), 
          contact: form.contact.trim(), 
          email: form.email.trim(), 
          address: form.address.trim(), 
          tenant_id: user.tenant_id 
        }),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json?.message || 'Something went wrong.'); return; }
      isEdit ? onSupplierUpdated(json.data) : onSupplierAdded(json.data);
      toast.success(isEdit ? 'Supplier updated' : 'Supplier added', `"${json.data.name}" has been ${isEdit ? 'updated' : 'added'}.`);
      setShowModal(false);
    } catch {
      setFormError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.contact?.toLowerCase().includes(search.toLowerCase())
  );

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
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Procurement</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Suppliers</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {suppliers.length} {suppliers.length === 1 ? 'supplier' : 'suppliers'} — manage your vendor relationships
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {suppliers.length > 0 && (
            <input
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', width: 220 }}
              placeholder="Search suppliers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          )}
          {canCreate && (
            <button onClick={openAdd} style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
              onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
              + Add Supplier
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={styles.cardsGrid}>
          {[...Array(6)].map((_, i) => <div key={i} style={styles.skeletonCard} />)}
        </div>
      ) : suppliers.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState title="No suppliers yet" description="Add suppliers to track where you purchase your products." actionLabel={canCreate ? "Add First Supplier" : undefined} onAction={canCreate ? openAdd : undefined} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState title="No suppliers match your search" description="Try a different name, email, or contact." actionLabel="Clear Search" onAction={() => setSearch('')} />
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {filtered.map(supplier => (
            <div key={supplier.id} style={{ ...styles.supplierCard, transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#ede9fe', color: '#4f46e5', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {supplier.name?.charAt(0).toUpperCase()}
                </div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{supplier.name}</h3>
              </div>
              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Phone', value: supplier.contact },
                  { label: 'Email', value: supplier.email },
                  { label: 'Address', value: supplier.address },
                ].map(d => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', width: 52, flexShrink: 0, paddingTop: 1 }}>{d.label}</span>
                    <span style={{ fontSize: 13, color: d.value ? '#0f172a' : '#cbd5e1', fontStyle: d.value ? 'normal' : 'italic' }}>{d.value || '—'}</span>
                  </div>
                ))}
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                {canEdit && (
                  <button onClick={() => openEdit(supplier)} style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(supplier)} disabled={deletingId === supplier.id} style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    {deletingId === supplier.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? 'Edit Supplier' : 'Add New Supplier'}
        size="lg"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Row 1: Name (full width) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={supS.label}>Supplier Company Name (Required)</label>
            <input style={{ ...supS.input, borderColor: fieldErrors.name ? '#dc2626' : '#e2e8f0' }} placeholder="e.g., Foam Factory Ltd, Textile Suppliers Uganda" value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null })); }} />
            {fieldErrors.name && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4 }}>{fieldErrors.name}</span>}
          </div>
          {/* Row 2: Contact + Email side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={supS.label}>Supplier Phone Number</label>
              <input style={{ ...supS.input, borderColor: fieldErrors.contact ? '#dc2626' : '#e2e8f0' }} placeholder="+256 700 000 000" value={form.contact}
                onChange={e => { setForm(f => ({ ...f, contact: e.target.value })); if (fieldErrors.contact) setFieldErrors(prev => ({ ...prev, contact: null })); }} />
              {fieldErrors.contact && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4 }}>{fieldErrors.contact}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={supS.label}>Supplier Email Address</label>
              <input style={{ ...supS.input, borderColor: fieldErrors.email ? '#dc2626' : '#e2e8f0' }} type="email" placeholder="contact@supplier.com" value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null })); }} />
              {fieldErrors.email && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4 }}>{fieldErrors.email}</span>}
            </div>
          </div>
          {/* Row 3: Address (full width) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={supS.label}>Supplier Physical Address</label>
            <input style={{ ...supS.input, borderColor: fieldErrors.address ? '#dc2626' : '#e2e8f0' }} placeholder="e.g., Plot 123, Industrial Area, Kampala" value={form.address}
              onChange={e => { setForm(f => ({ ...f, address: e.target.value })); if (fieldErrors.address) setFieldErrors(prev => ({ ...prev, address: null })); }} />
            {fieldErrors.address && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4 }}>{fieldErrors.address}</span>}
          </div>

          {formError && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
              ⚠️ {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Supplier'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SuppliersTab;
export { SuppliersTab };
