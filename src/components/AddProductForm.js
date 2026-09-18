import { useState, useCallback, useRef } from 'react';
import Button from './ui/Button';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const UNITS = [
  'Pieces (pcs)', 'Kilograms (kg)', 'Grams (g)', 'Litres (L)',
  'Millilitres (mL)', 'Metres (m)', 'Centimetres (cm)',
  'Boxes', 'Cartons', 'Dozens', 'Pairs', 'Rolls', 'Bags', 'Bottles', 'Cans',
];

const emptyProduct = () => ({
  _id:              Math.random().toString(36).slice(2), // local key only
  name:             '',
  sku:              '',
  skuAuto:          false,
  skuLoading:       false,
  barcode:          '',
  unit:             '',
  category_mode:    'existing',
  category_id:      '',
  new_category:     '',
  supplier_id:      '',
  stock:            '',
  cost_price:       '',
  price:            '',
  reorder_level:    '',
  description:      '',
  track_expiry:     false,
  manufacture_date: '',
  expiry_date:      '',
  image:            null,   // File object
  imagePreview:     null,   // object URL for display
});

export default function AddProductForm({ token, categories, suppliers, onSuccess, onCancel }) {
  const [products, setProducts] = useState([emptyProduct()]);
  const [expanded, setExpanded] = useState(new Set(['0'])); // expanded by index string
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [saved,    setSaved]    = useState([]); // successfully saved products preview

  /* ── field update helper ─────────────────────────────── */
  const updateField = (idx, key, value) => {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, [key]: value } : p));
  };

  /* ── auto-generate SKU on name blur ──────────────────── */
  const handleNameBlur = useCallback(async (idx, name) => {
    if (!name.trim()) return;
    const p = products[idx];
    if (p.sku && !p.skuAuto) return; // user typed their own SKU — leave it

    updateField(idx, 'skuLoading', true);
    try {
      const res  = await fetch(`${API}/products/generate-sku?name=${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.map((p, i) =>
          i === idx ? { ...p, sku: data.sku, skuAuto: true, skuLoading: false } : p
        ));
        return;
      }
    } catch { /* silent */ }
    updateField(idx, 'skuLoading', false);
  }, [products, token]);

  /* ── add / remove product entries ───────────────────── */
  const addProduct = () => {
    const next = emptyProduct();
    setProducts(prev => [...prev, next]);
    // auto-expand the new card
    setExpanded(prev => new Set([...prev, String(products.length)]));
  };

  const removeProduct = (idx) => {
    if (products.length === 1) return; // always keep at least one
    setProducts(prev => prev.filter((_, i) => i !== idx));
    setExpanded(prev => {
      const s = new Set(prev);
      s.delete(String(idx));
      return s;
    });
  };

  const toggleExpand = (idx) => {
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(String(idx)) ? s.delete(String(idx)) : s.add(String(idx));
      return s;
    });
  };

  /* ── submit all products ─────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Validate all products
    const validProducts = products.filter(p => p.name.trim() && p.price !== '' && p.stock !== '');
    if (validProducts.length === 0) {
      setError('Please fill in at least one complete product (Name, Price, Stock)');
      setSaving(false);
      return;
    }

    try {
      const savedProducts = [];
      for (const p of validProducts) {
        const fd = new FormData();
        fd.append('name', p.name);
        fd.append('sku', p.sku);
        fd.append('barcode', p.barcode);
        fd.append('unit', p.unit);
        fd.append('supplier_id', p.supplier_id);
        fd.append('stock', p.stock);
        fd.append('cost_price', p.cost_price);
        fd.append('price', p.price);
        fd.append('reorder_level', p.reorder_level || 0);
        fd.append('description', p.description);
        fd.append('track_expiry', p.track_expiry ? 1 : 0);
        
        if (p.track_expiry) {
          fd.append('manufacture_date', p.manufacture_date);
          fd.append('expiry_date', p.expiry_date);
        }

        if (p.category_mode === 'existing') {
          fd.append('category_id', p.category_id);
        } else if (p.new_category) {
          fd.append('new_category', p.new_category);
        }

        if (p.image) {
          fd.append('image', p.image);
        }

        const res = await fetch(`${API}/products`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
          body: fd,
        });
        
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || `Failed to save ${p.name}`);
        }
        savedProducts.push(data.data);
      }

      onSuccess(savedProducts);
    } catch (err) {
      setError(err.message || 'Failed to save products. Check your connection.');
      setSaving(false);
    }
  };

  const completedCount = products.filter(p => p.name.trim() && p.price !== '' && p.stock !== '').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Product cards ── */}
      {products.map((p, idx) => {
        const isOpen   = expanded.has(String(idx));
        const isDone   = p.name.trim() && p.price !== '' && p.stock !== '';
        return (
          <div key={p._id} style={s.card}>

            {/* Card header */}
            <div
              style={s.cardHeader}
              onClick={() => toggleExpand(idx)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Status dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: isDone ? '#16a34a' : '#f59e0b',
                }} />
                <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                  {p.name.trim() || `Product ${idx + 1}`}
                </span>
                {isDone && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '1px 8px', borderRadius: 20 }}>
                    Ready
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removeProduct(idx); }}
                    style={s.removeBtn}
                    title="Remove this product"
                  >
                    ✕
                  </button>
                )}
                <span style={{ fontSize: 11, color: '#94a3b8', userSelect: 'none' }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* Card body */}
            {isOpen && (
              <div style={s.cardBody}>
                <ProductFields
                  p={p}
                  idx={idx}
                  categories={categories}
                  suppliers={suppliers}
                  onField={updateField}
                  onNameBlur={handleNameBlur}
                  onImageChange={(idx, file, preview) => {
                    setProducts(prev => prev.map((p, i) =>
                      i === idx ? { ...p, image: file, imagePreview: preview } : p
                    ));
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* ── Add another product button ── */}
      <button type="button" onClick={addProduct} style={s.addMoreBtn}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
        Add another product
      </button>

      {error && (
        <div style={s.error}>
          <span>⚠️</span>
          <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <Button type="button" variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="success"
          loading={saving}
          onClick={handleSubmit}
          style={{ flex: 2 }}
          disabled={completedCount === 0}
        >
          {saving
            ? 'Saving…'
            : products.length === 1
              ? 'Add Product'
              : `Save ${products.length} Products`
          }
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ProductFields — all fields for one product entry
───────────────────────────────────────────────────────────────────────────── */
function ProductFields({ p, idx, categories, suppliers, onField, onNameBlur, onImageChange }) {
  const set = (key, value) => onField(idx, key, value);
  const fileRef = useRef();
  const handle = e => {
    const { name, value, type, checked } = e.target;
    set(name, type === 'checkbox' ? checked : value);
    if (name === 'sku') set('skuAuto', false);
  };

  const handleImage = e => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    onImageChange(idx, file, preview);
  };

  const removeImage = () => {
    if (p.imagePreview) URL.revokeObjectURL(p.imagePreview);
    onImageChange(idx, null, null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Row 1: Name + SKU */}
      <div className="product-form-row" style={s.row}>
        <Field label="Product Name *">
          <input
            style={s.input}
            name="name"
            placeholder="e.g. Paracetamol 500mg"
            value={p.name}
            onChange={handle}
            onBlur={e => onNameBlur(idx, e.target.value)}
          />
        </Field>
        <Field label={
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            SKU
            {p.skuLoading && <span style={{ fontSize: 10, color: '#94a3b8' }}>generating…</span>}
            {p.skuAuto && !p.skuLoading && (
              <span style={{ fontSize: 10, fontWeight: 700, background: '#ede9fe', color: '#7c3aed', padding: '1px 7px', borderRadius: 20 }}>AUTO</span>
            )}
          </span>
        }>
          <input
            style={{ ...s.input, background: p.skuAuto ? '#fafbff' : '#fff', borderColor: p.skuAuto ? '#c4b5fd' : '#e2e8f0' }}
            name="sku"
            placeholder={p.skuLoading ? 'Generating…' : 'e.g. AP-001'}
            value={p.sku}
            onChange={handle}
          />
        </Field>
      </div>

      {/* Row 2: Barcode + Unit */}
      <div className="product-form-row" style={s.row}>
        <Field label="Barcode (optional)">
          <input style={s.input} name="barcode" placeholder="Scan or type barcode" value={p.barcode} onChange={handle} />
        </Field>
        <Field label="Unit of Measure">
          <select style={s.input} name="unit" value={p.unit} onChange={handle}>
            <option value="">— Select unit —</option>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
      </div>

      {/* Category */}
      <Field label="Category">
        <div style={s.segmented}>
          {['existing', 'new'].map(m => (
            <button key={m} type="button"
              style={{ ...s.seg, ...(p.category_mode === m ? s.segActive : {}) }}
              onClick={() => set('category_mode', m)}>
              {m === 'existing' ? '📂 Existing' : '➕ New category'}
            </button>
          ))}
        </div>
        {p.category_mode === 'existing' ? (
          <select style={{ ...s.input, marginTop: 8 }} name="category_id" value={p.category_id} onChange={handle}>
            <option value="">— Select category —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <input style={{ ...s.input, marginTop: 8 }} name="new_category"
            placeholder="Type new category name" value={p.new_category} onChange={handle} />
        )}
      </Field>

      {/* Supplier */}
      <Field label="Supplier (optional)">
        <select style={s.input} name="supplier_id" value={p.supplier_id} onChange={handle}>
          <option value="">— No supplier —</option>
          {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
        </select>
      </Field>

      {/* Row 3: Qty + Reorder */}
      <div className="product-form-row" style={s.row}>
        <Field label="Quantity *">
          <input style={s.input} name="stock" type="number" min="0" placeholder="0" value={p.stock} onChange={handle} />
        </Field>
        <Field label="Reorder Level">
          <input style={s.input} name="reorder_level" type="number" min="0" placeholder="0" value={p.reorder_level} onChange={handle} />
        </Field>
      </div>

      {/* Row 4: Cost + Selling price */}
      <div className="product-form-row" style={s.row}>
        <Field label="Cost Price">
          <input style={s.input} name="cost_price" type="number" step="0.01" min="0" placeholder="0.00" value={p.cost_price} onChange={handle} />
        </Field>
        <Field label="Selling Price *">
          <input style={s.input} name="price" type="number" step="0.01" min="0" placeholder="0.00" value={p.price} onChange={handle} />
        </Field>
      </div>

      {/* Description */}
      <Field label="Description">
        <textarea style={{ ...s.input, minHeight: 60, resize: 'vertical' }}
          name="description" placeholder="Optional product description…" value={p.description} onChange={handle} />
      </Field>

      {/* Product Image */}
      <Field label="Product Image (optional)">
        <div style={s.imageArea} onClick={() => fileRef.current.click()}>
          {p.imagePreview
            ? <img src={p.imagePreview} alt="preview" style={s.imagePreview} />
            : (
              <div style={s.imagePlaceholder}>
                <span style={{ fontSize: '1.6rem' }}>🖼️</span>
                <span style={s.imageHint}>Click to upload image</span>
                <span style={s.imageHint2}>PNG, JPG up to 2 MB</span>
              </div>
            )
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
        {p.imagePreview && (
          <button type="button" style={s.removeImg} onClick={removeImage}>
            ✕ Remove image
          </button>
        )}
      </Field>

      {/* Track expiry toggle */}
      <label style={s.toggle}>
        <div style={{ ...s.toggleTrack, background: p.track_expiry ? '#4f46e5' : '#e2e8f0' }}>
          <div style={{ ...s.toggleThumb, transform: p.track_expiry ? 'translateX(20px)' : 'translateX(2px)' }} />
        </div>
        <input type="checkbox" name="track_expiry" checked={p.track_expiry} onChange={handle} style={{ display: 'none' }} />
        <div>
          <div style={s.toggleLabel}>Track Expiry Date</div>
          <div style={s.toggleSub}>Record manufacture & expiry dates for this product</div>
        </div>
      </label>

      {p.track_expiry && (
        <div style={s.expiryBox}>
          <div className="product-form-row" style={s.row}>
            <Field label="Manufacture Date">
              <input style={s.input} name="manufacture_date" type="date" value={p.manufacture_date} onChange={handle} />
            </Field>
            <Field label="Expiry Date *">
              <input style={s.input} name="expiry_date" type="date" value={p.expiry_date} onChange={handle} min={p.manufacture_date || undefined} />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      {label && <label style={s.label}>{label}</label>}
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
  row:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151', letterSpacing: '0.03em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 },
  input: {
    padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%',
    boxSizing: 'border-box', background: '#fff', color: '#0f172a',
    transition: 'border-color 0.2s',
  },
  // Card
  card: {
    border: '1.5px solid #e2e8f0', borderRadius: 12,
    background: '#fff', overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', cursor: 'pointer', userSelect: 'none',
    background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
  },
  cardBody: { padding: '16px' },
  removeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#ef4444', fontSize: 14, fontWeight: 700,
    padding: '2px 6px', borderRadius: 6, lineHeight: 1,
  },
  addMoreBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '11px 16px', borderRadius: 10,
    border: '2px dashed #c7d2fe', background: '#fafbff',
    color: '#4f46e5', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s', width: '100%',
  },
  // Category segmented control
  segmented: { display: 'flex', gap: 6 },
  seg: {
    flex: 1, padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8,
    background: '#f8fafc', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.15s', color: '#64748b',
  },
  segActive: { background: '#ede9fe', borderColor: '#7c3aed', color: '#4f46e5', fontWeight: 600 },
  // Expiry toggle
  toggle: {
    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
    padding: '10px 12px', background: '#f8fafc', borderRadius: 10,
    border: '1.5px solid #e2e8f0',
  },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, position: 'relative', flexShrink: 0, transition: 'background 0.25s' },
  toggleThumb: { position: 'absolute', top: 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 0.25s' },
  toggleLabel: { fontSize: 13, fontWeight: 600, color: '#0f172a' },
  toggleSub:   { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  error:  { display: 'flex', gap: 8, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 },
  expiryBox: { padding: '12px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10 },
  // Image upload
  imageArea: {
    border: '2px dashed #e2e8f0', borderRadius: 10, padding: 14,
    cursor: 'pointer', textAlign: 'center', background: '#f8fafc',
    minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  imagePlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  imageHint:        { fontSize: 13, color: '#64748b', fontWeight: 500 },
  imageHint2:       { fontSize: 11, color: '#94a3b8' },
  imagePreview:     { maxHeight: 100, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' },
  removeImg: {
    marginTop: 6, background: 'none', border: 'none', color: '#ef4444',
    fontSize: 12, cursor: 'pointer', fontWeight: 500, padding: 0,
  },
};
