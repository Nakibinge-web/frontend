import React, { useState } from 'react';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import styles, { catS } from '../styles/dashboardStyles';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function CategoriesTab({ categories, loading, token, canCreate = true, canEdit = true, canDelete = true, onCategoryAdded, onCategoryUpdated, onCategoryDeleted }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [deletingCat, setDeletingCat] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteError, setDeleteError] = useState(null);

  const openAdd = () => { setForm({ name: '', description: '' }); setFormError(null); setFieldErrors({}); setShowAddModal(true); };
  const openEdit = (cat) => { setForm({ name: cat.name, description: cat.description || '' }); setFormError(null); setFieldErrors({}); setEditingCat(cat); };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    // Custom validation
    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Category name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    } else if (form.name.trim().length > 100) {
      errors.name = 'Category name must not exceed 100 characters';
    }
    
    if (form.description && form.description.length > 500) {
      errors.description = 'Description must not exceed 500 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please fix the errors below');
      setSaving(false);
      return;
    }

    const isEdit = !!editingCat;
    try {
      const res = await fetch(
        isEdit ? `${API}/categories/${editingCat.id}` : `${API}/categories`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setFormError(data?.message || `Error ${res.status}`); }
      else {
        if (isEdit) { onCategoryUpdated(data.data); setEditingCat(null); }
        else { onCategoryAdded(data.data); setShowAddModal(false); }
        setForm({ name: '', description: '' });
      }
    } catch {
      setFormError('Failed to save. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCat) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${API}/categories/${deletingCat.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });
      if (res.ok) {
        onCategoryDeleted(deletingCat.id);
        setDeletingCat(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data?.message || 'Failed to delete category.');
      }
    } catch {
      setDeleteError('Error deleting category. Check your connection.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const categoryFormJsx = (onCancel) => (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={catS.label}>Category Name (Required)</label>
        <input
          style={{ ...catS.input, borderColor: fieldErrors.name ? '#dc2626' : '#e2e8f0' }}
          placeholder="e.g., Spring Mattresses, Memory Foam, Bedding Sheets, Pillows"
          value={form.name}
          onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null })); }}
          autoFocus
        />
        {fieldErrors.name && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 2 }}>{fieldErrors.name}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={catS.label}>Category Description (Optional)</label>
        <textarea
          style={{ ...catS.input, minHeight: 80, resize: 'vertical', borderColor: fieldErrors.description ? '#dc2626' : '#e2e8f0' }}
          placeholder="e.g., High-quality memory foam mattresses in various sizes"
          value={form.description}
          onChange={e => { setForm(f => ({ ...f, description: e.target.value })); if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: null })); }}
        />
        {fieldErrors.description && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 2 }}>{fieldErrors.description}</span>}
      </div>
      {formError && <div style={catS.error}>{formError}</div>}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <Button type="button" variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving} style={{ flex: 1 }}>
          {saving ? 'Saving…' : editingCat ? 'Save Changes' : 'Add Category'}
        </Button>
      </div>
    </form>
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
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inventory</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Categories</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} — organise your products into logical groups
          </p>
        </div>
        {canCreate && (
          <button onClick={openAdd} style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: '#4f46e5', color: '#fff', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
            onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
            + Add Category
          </button>
        )}
      </div>

      {loading ? (
        <div style={styles.cardsGrid}>
          {[...Array(6)].map((_, i) => <div key={i} style={styles.skeletonCard} />)}
        </div>
      ) : categories.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState
            title="No categories yet"
            description="Create categories to organise your products better."
            actionLabel={canCreate ? "Add First Category" : undefined}
            onAction={canCreate ? openAdd : undefined}
          />
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {categories.map((category, idx) => {
            const colors = ['#4f46e5', '#16a34a', '#0891b2', '#d97706', '#dc2626', '#7c3aed'];
            const accent = colors[idx % colors.length];
            return (
              <div key={category.id} style={{
                ...styles.categoryCard,
                borderTop: `3px solid ${accent}`,
              }}>
                <h3 style={styles.categoryTitle}>{category.name}</h3>
                <p style={styles.categoryDescription}>
                  {category.description || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No description</span>}
                </p>
                <div style={{ ...styles.categoryFooter, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={styles.categoryDate}>
                    {new Date(category.created_at).toLocaleDateString()}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {canEdit && <button onClick={() => openEdit(category)} style={catS.editBtn}>Edit</button>}
                    {canDelete && <button onClick={() => { setDeleteError(null); setDeletingCat(category); }} style={catS.deleteBtn}>Delete</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Category Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Category" size="sm">
        {categoryFormJsx(() => setShowAddModal(false))}
      </Modal>

      {/* Edit Category Modal */}
      <Modal isOpen={!!editingCat} onClose={() => setEditingCat(null)} title="Edit Category" size="sm">
        {categoryFormJsx(() => setEditingCat(null))}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingCat}
        onClose={() => { setDeletingCat(null); setDeleteError(null); }}
        title="Delete Category"
        size="sm"
      >
        {deletingCat && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, marginBottom: 4 }}>{deletingCat.name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                This will permanently delete the category. Products in this category will not be deleted.
              </div>
            </div>
            {deleteError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                {deleteError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="button" variant="secondary"
                onClick={() => { setDeletingCat(null); setDeleteError(null); }}
                style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button type="button" variant="danger" loading={deleteLoading} onClick={handleDelete} style={{ flex: 1 }}>
                {deleteLoading ? 'Deleting…' : 'Delete Category'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CategoriesTab;
export { CategoriesTab };
