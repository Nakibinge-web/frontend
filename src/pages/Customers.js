import React, { useState } from 'react';
import { usePagination } from '../components/ui/Pagination';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import styles, { supS, custS, focusInputWrap } from '../styles/dashboardStyles';


function CustomersTab({ customers, loading, token, user, toast, onCustomerAdded, onCustomerUpdated, onCustomerDeleted, canCreate = true, canEdit = true, canDelete = true }) {
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // customer pending deletion
  const [search, setSearch] = useState('');

  const openAdd = () => {
    setEditTarget(null);
    setForm({ name: '', phone: '', email: '', status: 'active' });
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const openEdit = (customer) => {
    setEditTarget(customer);
    setForm({ name: customer.name, phone: customer.phone || '', email: customer.email || '', status: customer.status || 'active' });
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const handleDelete = async (customer) => {
    setDeletingId(customer.id);
    try {
      const res = await fetch(`${API}/customers/${customer.id}?tenant_id=${user.tenant_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) { const j = await res.json(); toast.error('Delete failed', j?.message || 'Failed to delete.'); return; }
      onCustomerDeleted(customer.id);
      toast.success('Customer deleted', `"${customer.name}" has been removed.`);
    } catch { toast.error('Delete failed', 'Could not reach the server.'); }
    finally { setDeletingId(null); setConfirmDelete(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    // Custom validation
    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Customer name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Customer name must be at least 2 characters';
    } else if (form.name.trim().length > 100) {
      errors.name = 'Customer name must not exceed 100 characters';
    }
    
    if (form.phone && form.phone.trim() && !/^[\d\s+\-()]+$/.test(form.phone)) {
      errors.phone = 'Invalid phone number format';
    }
    
    if (form.email && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
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
      const url = isEdit ? `${API}/customers/${editTarget.id}` : `${API}/customers`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: JSON.stringify({ 
          name: form.name.trim(), 
          phone: form.phone.trim(), 
          email: form.email.trim(), 
          address: form.address?.trim() || '',
          status: form.status,
          tenant_id: user.tenant_id 
        }),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json?.message || 'Failed to save customer.'); return; }
      isEdit ? onCustomerUpdated(json.data) : onCustomerAdded(json.data);
      toast.success(isEdit ? 'Customer updated' : 'Customer added', `"${json.data.name}" has been ${isEdit ? 'updated' : 'added'}.`);
      setShowModal(false);
    } catch { setFormError('Could not reach the server.'); }
    finally { setSaving(false); }
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );
  const { paged: pagedCustomers, page: cPage, setPage: setCPage, totalPages: cTotalPages, total: cTotal } = usePagination(filtered);

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
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CRM</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Customers</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {customers.length} {customers.length === 1 ? 'customer' : 'customers'} — {customers.filter(c => c.status === 'active').length} active
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {customers.length > 0 && (
            <input
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', width: 220 }}
              placeholder="Search customers…"
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
              + Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {customers.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <input
            style={{ ...supS.input, maxWidth: 320 }}
            placeholder="🔍  Search by name, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? 'Edit Customer' : 'Add New Customer'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={saving}
              onClick={() => document.getElementById('customer-form')?.requestSubmit()}
            >
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Customer'}
            </Button>
          </>
        }
      >
        <div style={custS.hero}>
          <div style={custS.heroIcon}>
            {form.name ? form.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div>
            <p style={custS.heroTitle}>
              {form.name || (editTarget ? 'Update customer details' : 'New customer profile')}
            </p>
            <p style={custS.heroSub}>
              {editTarget
                ? 'Update contact information and account status.'
                : 'Add a customer to link them to future sales and track purchase history.'}
            </p>
          </div>
        </div>

        <form id="customer-form" onSubmit={handleSubmit} style={custS.form}>
          <div style={custS.section}>
            <p style={custS.sectionTitle}>Contact Information</p>

            <div style={custS.field}>
              <label style={custS.label}>
                Customer Full Name (Required)<span style={custS.required}>*</span>
              </label>
              <div style={{ ...custS.inputWrap, borderColor: fieldErrors.name ? '#dc2626' : '#e2e8f0' }} data-input-wrap>
                <span style={custS.inputIcon}>👤</span>
                <input
                  style={custS.input}
                  placeholder="e.g., Jane Nakato, Hotel Manager"
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null })); }}
                  onFocus={e => focusInputWrap(e, true)}
                  onBlur={e => focusInputWrap(e, false)}
                  autoFocus
                />
              </div>
              {fieldErrors.name && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4, display: 'block' }}>{fieldErrors.name}</span>}
            </div>

            <div style={custS.field}>
              <label style={custS.label}>Customer Phone Number</label>
              <div style={{ ...custS.inputWrap, borderColor: fieldErrors.phone ? '#dc2626' : '#e2e8f0' }} data-input-wrap>
                <span style={custS.inputIcon}>📞</span>
                <input
                  style={custS.input}
                  type="tel"
                  placeholder="+256 700 000 000"
                  value={form.phone}
                  onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: null })); }}
                  onFocus={e => focusInputWrap(e, true)}
                  onBlur={e => focusInputWrap(e, false)}
                />
              </div>
              {fieldErrors.phone ? (
                <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4, display: 'block' }}>{fieldErrors.phone}</span>
              ) : (
                <p style={custS.hint}>For order confirmations and delivery coordination</p>
              )}
            </div>

            <div style={custS.field}>
              <label style={custS.label}>Customer Email Address</label>
              <div style={{ ...custS.inputWrap, borderColor: fieldErrors.email ? '#dc2626' : '#e2e8f0' }} data-input-wrap>
                <span style={custS.inputIcon}>✉️</span>
                <input
                  style={custS.input}
                  type="email"
                  placeholder="customer@example.com"
                  value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null })); }}
                  onFocus={e => focusInputWrap(e, true)}
                  onBlur={e => focusInputWrap(e, false)}
                />
              </div>
              {fieldErrors.email && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4, display: 'block' }}>{fieldErrors.email}</span>}
            </div>
          </div>

          <div style={custS.section}>
            <p style={custS.sectionTitle}>Account Status</p>
            <div style={custS.statusRow}>
              {[
                { value: 'active', label: 'Active', icon: '✓' },
                { value: 'inactive', label: 'Inactive', icon: '○' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  style={{
                    ...custS.statusPill,
                    ...(form.status === opt.value ? custS.statusPillActive : {}),
                  }}
                  onClick={() => setForm(f => ({ ...f, status: opt.value }))}
                >
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
            <p style={custS.hint}>
              Inactive customers are hidden from POS customer selection.
            </p>
          </div>

          {formError && (
            <div style={custS.error}>
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}
        </form>
      </Modal>

      {/* ── Customer cards grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <div>Loading customers…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
            {search ? 'No customers match your search' : 'No customers yet'}
          </div>
          {!search && (
            <div style={{ fontSize: 13, marginBottom: 16 }}>Add your first customer to get started.</div>
          )}
          {!search && canCreate && (
            <Button variant="primary" icon="+" iconPosition="left" onClick={openAdd}>Add Customer</Button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {pagedCustomers.map(c => (
              <div key={c.id} style={{
                background: '#fff', borderRadius: 16, padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: '#ede9fe', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  }}>
                    👤
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{c.name}</div>
                </div>

                {/* Contact info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {c.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                      <span>📞</span> {c.phone}
                    </div>
                  )}
                  {c.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                      <span>📧</span> {c.email}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                    <span>🚀</span>
                    <span style={{
                      fontWeight: 600,
                      color: c.status === 'active' ? '#16a34a' : '#64748b',
                    }}>
                      {c.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {canEdit && (
                    <button
                      onClick={() => openEdit(c)}
                      style={{
                        padding: '8px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                        background: '#fff', color: '#0f172a', fontWeight: 600, fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setConfirmDelete(c)}
                      disabled={deletingId === c.id}
                      style={{
                        padding: '8px 18px', borderRadius: 10, border: 'none',
                        background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13,
                        cursor: deletingId === c.id ? 'not-allowed' : 'pointer',
                        opacity: deletingId === c.id ? 0.6 : 1,
                      }}
                    >
                      {deletingId === c.id ? 'Deleting…' : 'Delete'}
                    </button>
                  )}                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {cTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
              <button onClick={() => setCPage(p => Math.max(1, p - 1))} disabled={cPage === 1}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: cPage === 1 ? 'not-allowed' : 'pointer', color: '#64748b', fontWeight: 600 }}>
                ← Prev
              </button>
              <span style={{ fontSize: 13, color: '#64748b' }}>Page {cPage} of {cTotalPages} &nbsp;·&nbsp; {cTotal} customers</span>
              <button onClick={() => setCPage(p => Math.min(cTotalPages, p + 1))} disabled={cPage === cTotalPages}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: cPage === cTotalPages ? 'not-allowed' : 'pointer', color: '#64748b', fontWeight: 600 }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Customer Confirmation Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Customer"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)} style={{ minWidth: 90 }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deletingId === confirmDelete?.id}
              onClick={() => handleDelete(confirmDelete)}
              style={{ minWidth: 120 }}
            >
              Delete
            </Button>
          </div>
        }
      >
        {confirmDelete && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                background: '#fef2f2', border: '2px solid #fecaca',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>
                🗑️
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Delete "{confirmDelete.name}"?
                </p>
                {confirmDelete.email && (
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>{confirmDelete.email}</p>
                )}
              </div>
            </div>
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#b91c1c',
            }}>
              ⚠️ This action is permanent and cannot be undone.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CustomersTab;
export { CustomersTab };
