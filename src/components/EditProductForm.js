import { useState, useRef } from 'react';
import Button from './ui/Button';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:8000';

const UNITS = [
  'Pieces (pcs)', 'Kilograms (kg)', 'Grams (g)', 'Litres (L)',
  'Millilitres (mL)', 'Metres (m)', 'Centimetres (cm)',
  'Boxes', 'Cartons', 'Dozens', 'Pairs', 'Rolls', 'Bags', 'Bottles', 'Cans',
];

export default function EditProductForm({ token, product, categories, suppliers, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    name:             product.name || '',
    sku:              product.sku || '',
    barcode:          product.barcode || '',
    unit:             product.unit || '',
    category_id:      product.category_id || '',
    supplier_id:      product.supplier_id || '',
    stock:            product.stock ?? '',
    cost_price:       product.cost_price ?? '',
    price:            product.price ?? '',
    reorder_level:    product.reorder_level ?? '',
    description:      product.description || '',
    track_expiry:     !!product.track_expiry,
    manufacture_date: product.manufacture_date || '',
    expiry_date:      product.expiry_date || '',
  });
  const [image, setImage]     = useState(null);
  const [preview, setPreview] = useState(
    product.image_url || (product.image_path ? `${API_BASE}/storage/${product.image_path}` : null)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const fileRef               = useRef();

  const handle = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
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
    
    if (!form.category_id) {
      errors.category_id = 'Please select a category';
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

  const handleImage = e => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async e => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the errors below before submitting');
      return;
    }
    
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const fd = new FormData();
    fd.append('_method',       'PUT');
    fd.append('name',          form.name);
    fd.append('sku',           form.sku);
    fd.append('barcode',       form.barcode);
    fd.append('unit',          form.unit);
    fd.append('category_id',   form.category_id);
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
    if (image) fd.append('image', image);

    try {
      const res = await fetch(`${API}/products/${product.id}`, {
        method: 'POST', // Laravel requires POST + _method=PUT for multipart
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || `Error ${res.status}`); }
      else { onSuccess(data.data); }
    } catch {
      setError('Failed to update product. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={s.form}>

      {/* Row 1: Name + SKU */}
      <div className="product-form-row" style={s.row}>
        <Field label="Product Name *" error={fieldErrors.name}>
          <input style={{ ...s.input, borderColor: fieldErrors.name ? '#dc2626' : '#e2e8f0' }} name="name" placeholder="e.g. Paracetamol 500mg"
            value={form.name} onChange={handle} />
        </Field>
        <Field label="SKU">
          <input style={s.input} name="sku" placeholder="e.g. MED-001"
            value={form.sku} onChange={handle} />
        </Field>
      </div>

      {/* Row 2: Barcode + Unit */}
      <div className="product-form-row" style={s.row}>
        <Field label="Barcode (optional)">
          <input style={s.input} name="barcode" placeholder="Scan or type barcode"
            value={form.barcode} onChange={handle} />
        </Field>
        <Field label="Unit of Measure" error={fieldErrors.unit}>
          <select style={{ ...s.input, borderColor: fieldErrors.unit ? '#dc2626' : '#e2e8f0' }} name="unit" value={form.unit} onChange={handle}>
            <option value="">— Select unit —</option>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
      </div>

      {/* Category */}
      <Field label="Category" error={fieldErrors.category_id}>
        <select style={{ ...s.input, borderColor: fieldErrors.category_id ? '#dc2626' : '#e2e8f0' }} name="category_id" value={form.category_id} onChange={handle}>
          <option value="">— Select category —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>

      {/* Supplier */}
      <Field label="Supplier (optional)">
        <select style={s.input} name="supplier_id" value={form.supplier_id} onChange={handle}>
          <option value="">— No supplier —</option>
          {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
        </select>
      </Field>

      {/* Row 3: Qty + Reorder */}
      <div className="product-form-row" style={s.row}>
        <Field label="Quantity *" error={fieldErrors.stock}>
          <input style={{ ...s.input, borderColor: fieldErrors.stock ? '#dc2626' : '#e2e8f0' }} name="stock" type="number" min="0"
            placeholder="0" value={form.stock} onChange={handle} />
        </Field>
        <Field label="Reorder Level">
          <input style={s.input} name="reorder_level" type="number" min="0"
            placeholder="0" value={form.reorder_level} onChange={handle} />
        </Field>
      </div>

      {/* Row 4: Cost + Selling price */}
      <div className="product-form-row" style={s.row}>
        <Field label="Cost Price">
          <input style={s.input} name="cost_price" type="number" step="0.01" min="0"
            placeholder="0.00" value={form.cost_price} onChange={handle} />
        </Field>
        <Field label="Selling Price *" error={fieldErrors.price}>
          <input style={{ ...s.input, borderColor: fieldErrors.price ? '#dc2626' : '#e2e8f0' }} name="price" type="number" step="0.01" min="0"
            placeholder="0.00" value={form.price} onChange={handle} />
        </Field>
      </div>

      {/* Description */}
      <Field label="Description">
        <textarea style={{ ...s.input, minHeight: 72, resize: 'vertical' }}
          name="description" placeholder="Optional product description…"
          value={form.description} onChange={handle} />
      </Field>

      {/* Product image */}
      <Field label="Product Image (optional)">
        <div style={s.imageArea} onClick={() => fileRef.current.click()}>
          {preview
            ? <img src={preview} alt="preview" style={s.imagePreview} />
            : <div style={s.imagePlaceholder}>
                <span style={{ fontSize: '2rem' }}>🖼️</span>
                <span style={s.imageHint}>Click to upload image</span>
                <span style={s.imageHint2}>PNG, JPG up to 2 MB</span>
              </div>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*"
          style={{ display: 'none' }} onChange={handleImage} />
        {preview && (
          <button type="button" style={s.removeImg}
            onClick={() => { setImage(null); setPreview(null); }}>
            ✕ Remove image
          </button>
        )}
      </Field>

      {/* Track expiry toggle */}
      <label style={s.toggle}>
        <div style={{ ...s.toggleTrack, background: form.track_expiry ? '#4f46e5' : '#e2e8f0' }}>
          <div style={{ ...s.toggleThumb, transform: form.track_expiry ? 'translateX(20px)' : 'translateX(2px)' }} />
        </div>
        <input type="checkbox" name="track_expiry" checked={form.track_expiry}
          onChange={handle} style={{ display: 'none' }} />
        <div>
          <div style={s.toggleLabel}>Track Expiry Date for this Product</div>
          <div style={s.toggleSub}>Enable to record and monitor expiry dates on stock entries</div>
        </div>
      </label>

      {form.track_expiry && (
        <div style={s.expiryBox}>
          <div className="product-form-row" style={s.row}>
            <Field label="Manufacture Date">
              <input style={s.input} name="manufacture_date" type="date"
                value={form.manufacture_date} onChange={handle} />
            </Field>
            <Field label="Expiry Date *">
              <input style={s.input} name="expiry_date" type="date"
                value={form.expiry_date} onChange={handle}
                min={form.manufacture_date || undefined} required />
            </Field>
          </div>
        </div>
      )}

      {error && <div style={s.error}>⚠️ {error}</div>}

      <div style={s.footer}>
        <Button type="button" variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading} style={{ flex: 1 }}>
          {loading ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      {label && <label style={s.label}>{label}</label>}
      {children}
      {error && <span style={s.fieldError}>{error}</span>}
    </div>
  );
}

const s = {
  form:  { display: 'flex', flexDirection: 'column', gap: 16 },
  row:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151', letterSpacing: '0.03em', textTransform: 'uppercase' },
  input: {
    padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%',
    boxSizing: 'border-box', background: '#fff', color: '#0f172a',
  },
  fieldError: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: 500,
    marginTop: 2,
    display: 'block',
  },
  imageArea: {
    border: '2px dashed #e2e8f0', borderRadius: 10, padding: 16,
    cursor: 'pointer', textAlign: 'center', background: '#f8fafc',
    minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  imagePlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  imageHint:  { fontSize: 13, color: '#64748b', fontWeight: 500 },
  imageHint2: { fontSize: 11, color: '#94a3b8' },
  imagePreview: { maxHeight: 120, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' },
  removeImg: {
    marginTop: 6, background: 'none', border: 'none', color: '#ef4444',
    fontSize: 12, cursor: 'pointer', fontWeight: 500,
  },
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
  error:  { padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 },
  expiryBox: {
    padding: '14px', background: '#f0fdf4', border: '1.5px solid #bbf7d0',
    borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 12,
  },
  footer: { display: 'flex', gap: 10, paddingTop: 4 },
};
