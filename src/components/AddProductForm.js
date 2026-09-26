import { useState, useRef, useCallback } from 'react';
import Button from './ui/Button';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const UNITS = [
  'Pieces (pcs)', 'Kilograms (kg)', 'Grams (g)', 'Litres (L)',
  'Millilitres (mL)', 'Metres (m)', 'Centimetres (cm)',
  'Boxes', 'Cartons', 'Dozens', 'Pairs', 'Rolls', 'Bags', 'Bottles', 'Cans',
];

const EMPTY = {
  name: '', sku: '', barcode: '', unit: '',
  category_id: '', new_category: '', category_mode: 'existing',
  supplier_id: '',
  stock: '', cost_price: '', price: '', reorder_level: '',
  description: '', track_expiry: false,
  manufacture_date: '', expiry_date: '',
};

export default function AddProductForm({ token, categories, suppliers, onSuccess, onCancel }) {
  const [form, setForm]         = useState(EMPTY);
  const [skuAuto, setSkuAuto]   = useState(false);   // whether current SKU was auto-generated
  const [skuLoading, setSkuLoading] = useState(false);
  const [image, setImage]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [fieldErrors, setFieldErrors] = useState({}); // inline field errors
  const fileRef                 = useRef();

  const handle = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
    // If user manually edits SKU, stop treating it as auto
    if (name === 'sku') setSkuAuto(false);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.name.trim()) {
      errors.name = 'Product name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Product name must be at least 2 characters';
    }
    
    if (!form.unit) {
      errors.unit = 'Please select a unit of measure';
    }
    
    if (form.category_mode === 'existing' && !form.category_id) {
      errors.category_id = 'Please select a category or create a new one';
    }
    
    if (form.category_mode === 'new' && !form.new_category.trim()) {
      errors.new_category = 'Please enter a category name';
    }
    
    if (!form.stock || form.stock < 0) {
      errors.stock = 'Quantity is required and must be 0 or greater';
    }
    
    if (!form.price || form.price <= 0) {
      errors.price = 'Selling price is required and must be greater than 0';
    }
    
    if (form.cost_price && form.price && parseFloat(form.cost_price) > parseFloat(form.price)) {
      errors.price = 'Selling price should not be less than cost price';
    }
    
    if (form.track_expiry && !form.expiry_date) {
      errors.expiry_date = 'Expiry date is required when tracking expiry';
    }
    
    if (form.manufacture_date && form.expiry_date && form.manufacture_date > form.expiry_date) {
      errors.expiry_date = 'Expiry date must be after manufacture date';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Called when product name field loses focus
  const handleNameBlur = useCallback(async (e) => {
    const name = e.target.value.trim();
    if (!name) return;
    // Only auto-fill if SKU is currently empty or was previously auto-generated
    if (form.sku && !skuAuto) return;

    setSkuLoading(true);
    try {
      const res  = await fetch(`${API}/products/generate-sku?name=${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setForm(f => ({ ...f, sku: data.sku }));
        setSkuAuto(true);
      }
    } catch { /* silent — user can still type SKU manually */ }
    finally { setSkuLoading(false); }
  }, [form.sku, skuAuto, token]);

  const handleImage = e => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async e => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors below before submitting');
      return;
    }
    
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const fd = new FormData();
    fd.append('name',          form.name);
    fd.append('sku',           form.sku);
    fd.append('barcode',       form.barcode);
    fd.append('unit',          form.unit);
    fd.append('supplier_id',   form.supplier_id);
    fd.append('stock',         form.stock);
    fd.append('cost_price',    form.cost_price);
    fd.append('price',         form.price);
    fd.append('reorder_level', form.reorder_level || 0);
    fd.append('description',   form.description);
    fd.append('track_expiry',  form.track_expiry ? 1 : 0);
    if (form.track_expiry) {
      fd.append('manufacture_date', form.manufacture_date);
      fd.append('expiry_date',      form.expiry_date);
    }

    if (form.category_mode === 'existing') {
      fd.append('category_id', form.category_id);
    } else {
      fd.append('new_category', form.new_category);
    }

    if (image) fd.append('image', image);

    try {
      const res = await fetch(`${API}/products`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || `Error ${res.status}`); }
      else { onSuccess(data.data); }
    } catch {
      setError('Failed to add product. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={s.form}>

      {/* ── Row 1: Name + SKU ── */}
      <div className="product-form-row" style={s.row}>
        <Field label="Product Name (Required)" error={fieldErrors.name}>
          <input style={{ ...s.input, borderColor: fieldErrors.name ? '#dc2626' : '#e2e8f0' }} name="name" placeholder="e.g., Memory Foam Mattress Queen, Bedding Sheet King Size"
            value={form.name} onChange={handle} onBlur={handleNameBlur} />
        </Field>
        <Field label={
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            SKU Code
            {skuLoading && (
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>generating…</span>
            )}
            {skuAuto && !skuLoading && (
              <span style={{ fontSize: 10, fontWeight: 700, background: '#ede9fe', color: '#7c3aed', padding: '1px 7px', borderRadius: 20, letterSpacing: '0.04em' }}>AUTO</span>
            )}
          </span>
        }>
          <input
            style={{ ...s.input, background: skuAuto ? '#fafbff' : '#fff', borderColor: skuAuto ? '#c4b5fd' : '#e2e8f0' }}
            name="sku"
            placeholder={skuLoading ? 'Generating…' : 'e.g., MAT-QN-001, BED-KG-050'}
            value={form.sku}
            onChange={handle}
            title={skuAuto ? 'Auto-generated from product name. You can edit this.' : ''}
          />
        </Field>
      </div>

      {/* ── Row 2: Barcode + Unit ── */}
      <div className="product-form-row" style={s.row}>
        <Field label="Product Barcode (Optional)">
          <input style={s.input} name="barcode" placeholder="Scan or manually enter barcode"
            value={form.barcode} onChange={handle} />
        </Field>
        <Field label="Unit of Measure" error={fieldErrors.unit}>
          <select style={{ ...s.input, borderColor: fieldErrors.unit ? '#dc2626' : '#e2e8f0' }} name="unit" value={form.unit} onChange={handle}>
            <option value="">— Select measurement unit —</option>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
      </div>

      {/* ── Category ── */}
      <Field label="Product Category" error={fieldErrors.category_id || fieldErrors.new_category}>
        <div style={s.segmented}>
          {['existing', 'new'].map(m => (
            <button key={m} type="button"
              style={{ ...s.seg, ...(form.category_mode === m ? s.segActive : {}) }}
              onClick={() => setForm(f => ({ ...f, category_mode: m }))}>
              {m === 'existing' ? '📂 Existing Category' : '➕ Create New Category'}
            </button>
          ))}
        </div>
        {form.category_mode === 'existing' ? (
          <select style={{ ...s.input, marginTop: 8, borderColor: fieldErrors.category_id ? '#dc2626' : '#e2e8f0' }} name="category_id"
            value={form.category_id} onChange={handle}>
            <option value="">— Choose from existing categories —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <input style={{ ...s.input, marginTop: 8, borderColor: fieldErrors.new_category ? '#dc2626' : '#e2e8f0' }} name="new_category"
            placeholder="e.g., Spring Mattresses, Orthopedic, Premium Bedding" value={form.new_category} onChange={handle} />
        )}
      </Field>

      {/* ── Supplier (optional) ── */}
      <Field label="Product Supplier (Optional)">
        <select style={s.input} name="supplier_id" value={form.supplier_id} onChange={handle}>
          <option value="">— No supplier assigned —</option>
          {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
        </select>
      </Field>

      {/* ── Row 3: Qty + Reorder ── */}
      <div className="product-form-row" style={s.row}>
        <Field label="Initial Stock Quantity (Required)" error={fieldErrors.stock}>
          <input style={{ ...s.input, borderColor: fieldErrors.stock ? '#dc2626' : '#e2e8f0' }} name="stock" type="number" min="0"
            placeholder="Enter current stock quantity" value={form.stock} onChange={handle} />
        </Field>
        <Field label="Low Stock Alert Level">
          <input style={s.input} name="reorder_level" type="number" min="0"
            placeholder="e.g., 5 (alert when stock is below this)" value={form.reorder_level} onChange={handle} />
        </Field>
      </div>

      {/* ── Row 4: Cost + Selling price ── */}
      <div className="product-form-row" style={s.row}>
        <Field label="Purchase Cost Price (UGX)">
          <input style={s.input} name="cost_price" type="number" step="0.01" min="0"
            placeholder="What you paid to acquire it" value={form.cost_price} onChange={handle} />
        </Field>
        <Field label="Selling Price (Required)" error={fieldErrors.price}>
          <input style={{ ...s.input, borderColor: fieldErrors.price ? '#dc2626' : '#e2e8f0' }} name="price" type="number" step="0.01" min="0"
            placeholder="Customer retail price in UGX" value={form.price} onChange={handle} />
        </Field>
      </div>

      {/* ── Description ── */}
      <Field label="Product Description (Optional)">
        <textarea style={{ ...s.input, minHeight: 72, resize: 'vertical' }}
          name="description" placeholder="e.g., 12-inch memory foam with cooling gel, hypoallergenic cover"
          value={form.description} onChange={handle} />
      </Field>

      {/* ── Product image ── */}
      <Field label="Product Photo (Optional)">
        <div style={s.imageArea} onClick={() => fileRef.current.click()}>
          {preview
            ? <img src={preview} alt="preview" style={s.imagePreview} />
            : <div style={s.imagePlaceholder}>
                <span style={{ fontSize: '2rem' }}>🖼️</span>
                <span style={s.imageHint}>Click to upload product photo</span>
                <span style={s.imageHint2}>PNG, JPG format, maximum 2 MB</span>
              </div>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*"
          style={{ display: 'none' }} onChange={handleImage} />
        {preview && (
          <button type="button" style={s.removeImg}
            onClick={() => { setImage(null); setPreview(null); }}>
            ✕ Remove photo
          </button>
        )}
      </Field>

      {/* ── Track expiry toggle ── */}
      <label style={s.toggle}>
        <div style={{ ...s.toggleTrack, background: form.track_expiry ? '#4f46e5' : '#e2e8f0' }}>
          <div style={{ ...s.toggleThumb, transform: form.track_expiry ? 'translateX(20px)' : 'translateX(2px)' }} />
        </div>
        <input type="checkbox" name="track_expiry" checked={form.track_expiry}
          onChange={handle} style={{ display: 'none' }} />
        <div>
          <div style={s.toggleLabel}>Track Warranty/Expiry Date for this Product</div>
          <div style={s.toggleSub}>Enable if product has warranty period or expiration date</div>
        </div>
      </label>

      {/* ── Expiry date fields (shown when track_expiry is on) ── */}
      {form.track_expiry && (
        <div style={s.expiryBox}>
          <div className="product-form-row" style={s.row}>
            <Field label="Manufacture Date (Optional)">
              <input style={s.input} name="manufacture_date" type="date"
                value={form.manufacture_date} onChange={handle} />
            </Field>
            <Field label="Warranty/Expiry Date (Required)" error={fieldErrors.expiry_date}>
              <input style={{ ...s.input, borderColor: fieldErrors.expiry_date ? '#dc2626' : '#e2e8f0' }} name="expiry_date" type="date"
                value={form.expiry_date} onChange={handle}
                min={form.manufacture_date || undefined} />
            </Field>
          </div>
        </div>
      )}

      {error && <div style={s.error}>⚠️ {error}</div>}

      {/* ── Footer ── */}
      <div style={s.footer}>
        <Button type="button" variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button type="submit" variant="success" loading={loading} style={{ flex: 1 }}>
          {loading ? 'Saving…' : 'Add Product'}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      {label && (
        <label style={s.label}>
          {label}
        </label>
      )}
      {children}
      {error && (
        <span style={s.fieldError}>
          {error}
        </span>
      )}
    </div>
  );
}

const s = {
  form:  { display: 'flex', flexDirection: 'column', gap: 16 },
  row:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151', letterSpacing: '0.03em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 },
  input: {
    padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%',
    boxSizing: 'border-box', background: '#fff', color: '#0f172a',
    transition: 'border-color 0.2s',
  },
  fieldError: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: 500,
    marginTop: 2,
    display: 'block',
  },
  // Category segmented control
  segmented: { display: 'flex', gap: 6 },
  seg: {
    flex: 1, padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8,
    background: '#f8fafc', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.15s', color: '#64748b',
  },
  segActive: { background: '#ede9fe', borderColor: '#7c3aed', color: '#4f46e5', fontWeight: 600 },
  // Image upload
  imageArea: {
    border: '2px dashed #e2e8f0', borderRadius: 10, padding: 16,
    cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s',
    background: '#f8fafc', minHeight: 100, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  imagePlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  imageHint:  { fontSize: 13, color: '#64748b', fontWeight: 500 },
  imageHint2: { fontSize: 11, color: '#94a3b8' },
  imagePreview: { maxHeight: 120, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' },
  removeImg: {
    marginTop: 6, background: 'none', border: 'none', color: '#ef4444',
    fontSize: 12, cursor: 'pointer', fontWeight: 500,
  },
  // Expiry toggle
  toggle: {
    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
    padding: '12px 14px', background: '#f8fafc', borderRadius: 10,
    border: '1.5px solid #e2e8f0',
  },
  toggleTrack: {
    width: 44, height: 24, borderRadius: 12, position: 'relative',
    flexShrink: 0, transition: 'background 0.25s',
  },
  toggleThumb: {
    position: 'absolute', top: 2, width: 20, height: 20,
    background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    transition: 'transform 0.25s',
  },
  toggleLabel: { fontSize: 13, fontWeight: 600, color: '#0f172a' },
  toggleSub:   { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  // Error + footer
  error:  { padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 },
  expiryBox: {
    padding: '14px', background: '#f0fdf4', border: '1.5px solid #bbf7d0',
    borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 12,
  },
  footer: { display: 'flex', gap: 10, paddingTop: 4 },
};
