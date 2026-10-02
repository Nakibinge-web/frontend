import React, { useState, useEffect, useRef } from 'react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SaleReceipt from '../components/SaleReceipt';
import styles, { posS } from '../styles/dashboardStyles';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function POSTab({ products, categories, customers, token, user, onSaleCompleted, canSell = true }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [saleError, setSaleError] = useState(null);
  const [viewingSale, setViewingSale] = useState(null);

  // Customer selection state
  const [customerType, setCustomerType] = useState('walk_in');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

  // Discount & tax state
  const [discountValue, setDiscountValue] = useState('');
  const [taxValue, setTaxValue] = useState('');

  // Cash payment state
  const [amountPaid, setAmountPaid] = useState('');
  const [cashNote, setCashNote] = useState('');

  // ── Barcode scanner state ────────────────────────────────
  const barcodeInputRef = useRef(null);
  const [barcodeValue, setBarcodeValue] = useState('');
  const [barcodeFlash, setBarcodeFlash] = useState(null); // 'success' | 'error' | null
  const [barcodeMsg, setBarcodeMsg] = useState('');
  const barcodeTimerRef = useRef(null);
  // Tracks rapid keystrokes to distinguish scanner input from manual typing
  const barcodeLastKeyTime = useRef(0);
  
  // Auto-focus barcode input when the POS mounts
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // ── Global keydown listener: redirect keystrokes to barcode field
  // even if the user has clicked elsewhere on the page.
  // Only redirects if the active element is not another input/textarea/select.
  useEffect(() => {
    const handleGlobalKey = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isOtherInput = ['input', 'textarea', 'select'].includes(tag) &&
        document.activeElement !== barcodeInputRef.current;
      if (isOtherInput) return;
      if (e.key === 'Tab' || e.key === 'Escape' || e.ctrlKey || e.altKey || e.metaKey) return;
      barcodeInputRef.current?.focus();
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const flashBarcode = (type, msg) => {
    setBarcodeFlash(type);
    setBarcodeMsg(msg);
    clearTimeout(barcodeTimerRef.current);
    barcodeTimerRef.current = setTimeout(() => {
      setBarcodeFlash(null);
      setBarcodeMsg('');
      setBarcodeValue('');
    }, 1800);
  };

  const handleBarcodeScan = (rawValue) => {
    const code = rawValue.trim();
    if (!code) return;

    // Match against barcode field first, then SKU as fallback
    const product = products.find(
      p => (p.barcode && p.barcode.trim() === code) ||
        (p.sku && p.sku.trim().toLowerCase() === code.toLowerCase())
    );

    if (!product) {
      flashBarcode('error', `No product found for "${code}"`);
      return;
    }
    if (Number(product.stock) <= 0) {
      flashBarcode('error', `"${product.name}" is out of stock`);
      return;
    }

    addToCart(product);
    flashBarcode('success', `✓ Added: ${product.name}`);
  };

  // Detect scanner input: scanners fire characters in <50ms bursts then send Enter.
  // If Enter arrives after a rapid burst, treat as a scan (auto-submit).
  // If Enter arrives after slow typing, also submit — keeps manual entry working.
  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeScan(barcodeValue);
      return;
    }
    // Track timing so we know if input was fast (scanner) vs slow (keyboard)
    const now = Date.now();
    barcodeLastKeyTime.current = now;
  };

  const inStockProducts = products.filter(p => Number(p.stock) > 0);

  const filtered = inStockProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // cap at available stock
        return prev.map(i => i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
          : i
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        subtotal: parseFloat(product.price),
        maxStock: product.stock,
      }];
    });
  };

  const updateQty = (product_id, qty) => {
    const n = parseInt(qty, 10);
    if (isNaN(n) || n < 1) return;
    setCart(prev => prev.map(i => i.product_id === product_id
      ? { ...i, quantity: Math.min(n, i.maxStock), subtotal: Math.min(n, i.maxStock) * i.price }
      : i
    ));
  };

  const removeFromCart = (product_id) => setCart(prev => prev.filter(i => i.product_id !== product_id));

  const cartSubtotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const discountAmount = (() => {
    const v = parseFloat(discountValue) || 0;
    return Math.min(v, cartSubtotal);
  })();
  const taxAmount = parseFloat(taxValue) || 0;
  const cartTotal = cartSubtotal - discountAmount + taxAmount;
  const changeAmount = paymentMethod === 'cash'
    ? Math.max(0, (parseFloat(amountPaid) || 0) - cartTotal)
    : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setSaleError(null);
    try {
      const res = await fetch(`${API}/sales`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price })),
          customer_type: customerType,
          ...(customerType === 'existing' && selectedCustomerId ? { customer_id: parseInt(selectedCustomerId) } : {}),
          ...(customerType === 'new' ? { new_customer: newCustomer } : {}),
          discount_type: discountAmount > 0 ? 'fixed' : null,
          discount_amount: discountAmount > 0 ? discountAmount : null,
          tax_amount: taxAmount > 0 ? taxAmount : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSaleError(data?.message || 'Checkout failed.'); return; }
      const saleWithDetails = data.data;
      
      // Auto-show receipt modal for printing with complete sale data
      setViewingSale(saleWithDetails);
      onSaleCompleted(saleWithDetails);
      
      setCart([]);
      setSearch('');
      setCustomerType('walk_in');
      setSelectedCustomerId('');
      setNewCustomer({ name: '', phone: '', email: '' });
      setCustomerSearch('');
      setDiscountValue('');
      setTaxValue('');
      setAmountPaid('');
      setCashNote('');
    } catch {
      setSaleError('Network error. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // No longer need the lastReceipt view - receipt shows in modal instead

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '24px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sales</p>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Point of Sale</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Search products, build a cart, and process payment</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Items in cart</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc' }}>{cart.reduce((s, i) => s + i.quantity, 0)}</div>
        </div>
      </div>

      <div className="pos-layout">

        {/* Left — product search & grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Barcode scanner input ── */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📷 Barcode Scanner
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>— scan barcode to add instantly</span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeValue}
                onChange={e => setBarcodeValue(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="Scan barcode or type SKU…"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  border: `2px solid ${barcodeFlash === 'success' ? '#16a34a' : barcodeFlash === 'error' ? '#dc2626' : '#e2e8f0'}`,
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: barcodeFlash === 'success' ? '#f0fdf4' : barcodeFlash === 'error' ? '#fef2f2' : '#fff',
                  color: '#0f172a',
                  transition: 'border-color 0.2s, background 0.2s',
                  letterSpacing: '0.03em',
                }}
              />
              {/* Barcode icon */}
              <svg style={{ position: 'absolute', left: 12, pointerEvents: 'none', opacity: 0.4 }}
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5v14M7 5v14M11 5v14M15 5v10M19 5v14M15 18v1" />
              </svg>
            </div>
            {/* Feedback message */}
            {barcodeFlash && (
              <div style={{
                marginTop: 6, padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: barcodeFlash === 'success' ? '#dcfce7' : '#fee2e2',
                color: barcodeFlash === 'success' ? '#15803d' : '#b91c1c',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {barcodeFlash === 'success' ? '✓' : '✕'} {barcodeMsg}
              </div>
            )}
          </div>

          {/* ── Name / SKU search ── */}
          <input
            style={posS.searchInput}
            placeholder="Search products by name or SKU…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => { /* don't steal focus from barcode field on click */ }}
          />

          {/* Category filter pills */}
          {categories && categories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', border: '1.5px solid',
                  borderColor: selectedCategory === null ? '#16a34a' : '#e2e8f0',
                  background: selectedCategory === null ? '#f0fdf4' : '#fff',
                  color: selectedCategory === null ? '#16a34a' : '#64748b',
                  transition: 'all 0.15s',
                }}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', border: '1.5px solid',
                    borderColor: selectedCategory === cat.id ? '#16a34a' : '#e2e8f0',
                    background: selectedCategory === cat.id ? '#f0fdf4' : '#fff',
                    color: selectedCategory === cat.id ? '#16a34a' : '#64748b',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 36 }}>📦</div>
              <div style={{ marginTop: 8 }}>
                {search || selectedCategory
                  ? 'No products match your filters'
                  : 'No products in stock'}
              </div>
            </div>
          ) : (
            <div className="pos-product-grid">
              {filtered.map(p => (
                <button key={p.id} style={posS.productCard} onClick={() => addToCart(p)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(79,70,229,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
                >
                  {/* Product initial avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontSize: 15, fontWeight: 700, color: '#4f46e5' }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={posS.productName}>{p.name}</div>
                  {p.sku && <div style={posS.productSku}>SKU: {p.sku}</div>}
                  <div style={posS.productPrice}>UGX {parseFloat(p.price).toLocaleString()}</div>
                  <div style={{ marginTop: 6, fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>
                    {p.stock} in stock
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column — customer + cart */}
        <div className="pos-cart-sticky" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>

          {/* Customer Card */}
          <div style={posS.cartPanel}>
            <div style={posS.cartHeader}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Customer</span>
                <span style={{ marginLeft: 6, fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>Optional</span>
              </div>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { value: 'walk_in', label: 'Walk-in Customer' },
                { value: 'existing', label: 'Existing Customer' },
                { value: 'new', label: 'New Customer' },
              ].map(type => (
                <label key={type.value} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${customerType === type.value ? '#4f46e5' : '#e2e8f0'}`,
                  background: customerType === type.value ? '#f5f3ff' : '#fff',
                  transition: 'all 0.15s',
                }}>
                  <input type="radio" name="customerType" value={type.value}
                    checked={customerType === type.value}
                    onChange={() => { setCustomerType(type.value); setSelectedCustomerId(''); setCustomerSearch(''); setNewCustomer({ name: '', phone: '', email: '' }); }}
                    style={{ accentColor: '#4f46e5', width: 15, height: 15 }} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{type.label}</span>
                </label>
              ))}

              {customerType === 'existing' && (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input style={posS.searchInput} placeholder="Search by name or phone…"
                    value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                  <select style={posS.select} value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                    <option value="">— Select customer —</option>
                    {(customers || []).filter(c => c.status === 'active' && (!customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone || '').includes(customerSearch)))
                      .map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
                  </select>
                </div>
              )}

              {customerType === 'new' && (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input style={posS.searchInput} placeholder="Full name *" value={newCustomer.name} onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))} />
                  <input style={posS.searchInput} placeholder="Phone" value={newCustomer.phone} onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))} />
                  <input style={posS.searchInput} placeholder="Email" type="email" value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))} />
                </div>
              )}
            </div>
          </div>

          {/* Cart Card */}
          <div style={posS.cartPanel}>
            <div style={posS.cartHeader}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Cart {cart.length > 0 && <span style={{ marginLeft: 6, padding: '1px 8px', borderRadius: 20, background: '#ede9fe', color: '#4f46e5', fontSize: 12 }}>{cart.length}</span>}</span>
              {cart.length > 0 && <button style={posS.clearBtn} onClick={() => setCart([])}>Clear all</button>}
            </div>

            {cart.length === 0 ? (
              <div style={posS.emptyCart}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Select products to add to cart</div>
              </div>
            ) : (
              <div style={posS.cartItems}>
                {cart.map(item => (
                  <div key={item.product_id} style={posS.cartItem}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={posS.cartItemName}>{item.name}</div>
                      <div style={posS.cartItemPrice}>UGX {item.price.toLocaleString()} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <button style={posS.qtyBtn} onClick={() => updateQty(item.product_id, item.quantity - 1)}>−</button>
                      <input style={posS.qtyInput} type="number" min={1} max={item.maxStock}
                        value={item.quantity} onChange={e => updateQty(item.product_id, e.target.value)} />
                      <button style={posS.qtyBtn} onClick={() => updateQty(item.product_id, item.quantity + 1)}>+</button>
                      <button style={posS.removeBtn} onClick={() => removeFromCart(item.product_id)}>✕</button>
                    </div>
                    <div style={posS.cartItemSubtotal}>UGX {item.subtotal.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={posS.cartFooter}>
              {/* Subtotal row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>UGX {cartSubtotal.toLocaleString()}</span>
              </div>

              {/* Discount */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Discount:</span>
                <input
                  style={posS.discountInput}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                />
              </div>

              {/* Tax */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Tax:</span>
                <input
                  style={posS.discountInput}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={taxValue}
                  onChange={e => setTaxValue(e.target.value)}
                />
              </div>

              {/* Total row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, paddingTop: 10, borderTop: '1px dashed #e2e8f0' }}>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#dc2626' }}>
                    <span>Discount applied</span>
                    <span>− UGX {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a' }}>
                    <span>Tax</span>
                    <span>+ UGX {taxAmount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 18 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: 20, color: '#0f172a' }}>UGX {cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={posS.label}>Payment Method</label>
                <select style={posS.select} value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); setAmountPaid(''); setCashNote(''); }}>
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                </select>
              </div>

              {/* Cash payment panel */}
              {paymentMethod === 'cash' && (
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    💵 Payment (Cash)
                  </div>

                  {/* Amount Paid */}
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Amount Paid</label>
                    <input
                      style={{ ...posS.searchInput, textAlign: 'right', fontWeight: 700, fontSize: 16 }}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                    />
                  </div>

                  {/* Exact Amount shortcut */}
                  <button
                    style={{
                      width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #bfdbfe',
                      background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                    onClick={() => setAmountPaid(cartTotal.toString())}
                  >
                    ≡ Exact Amount
                  </button>

                  {/* Change */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '10px 14px',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Change:</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: (parseFloat(amountPaid) || 0) < cartTotal ? '#dc2626' : '#16a34a' }}>
                      UGX {changeAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Underpayment warning */}
                  {amountPaid !== '' && (parseFloat(amountPaid) || 0) < cartTotal && (
                    <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                      ⚠️ Amount paid is less than total by UGX {(cartTotal - (parseFloat(amountPaid) || 0)).toLocaleString()}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Notes (Optional)</label>
                    <textarea
                      style={{ ...posS.searchInput, resize: 'vertical', minHeight: 64, fontFamily: 'inherit' }}
                      placeholder="Add any notes…"
                      value={cashNote}
                      onChange={e => setCashNote(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {saleError && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>
                  {saleError}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || submitting || !canSell}
                style={{
                  width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                  background: (cart.length === 0 || !canSell) ? '#e2e8f0' : '#be123c',
                  color: (cart.length === 0 || !canSell) ? '#94a3b8' : '#fff',
                  fontSize: 14, fontWeight: 700, cursor: (cart.length === 0 || !canSell) ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s', letterSpacing: '0.02em',
                }}
                onMouseEnter={e => { if (cart.length > 0 && !submitting && canSell) e.currentTarget.style.background = '#881337'; }}
                onMouseLeave={e => { if (cart.length > 0 && !submitting && canSell) e.currentTarget.style.background = '#be123c'; }}
              >
                {!canSell ? 'No permission to sell' : submitting ? 'Processing…' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Receipt Modal - Auto-shown after sale completion */}
      {viewingSale && (
        <Modal
          isOpen={true}
          onClose={() => setViewingSale(null)}
          title=""
          size="md"
          footer={
            <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>✓</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#be123c' }}>Sale Completed Successfully!</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" onClick={() => setViewingSale(null)}>Close &amp; New Sale</Button>
                <Button
                  variant="success"
                  style={{ background: '#be123c', borderColor: '#be123c' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#881337'}
                  onMouseLeave={e => e.currentTarget.style.background = '#be123c'}
                  onClick={() => {
                  const src = document.getElementById('pos-receipt-content');
                  if (!src) {
                    alert('Receipt content not found. Please try again.');
                    return;
                  }
                  
                  const win = window.open('', '_blank', 'width=800,height=900');
                  if (!win) {
                    alert('Pop-up blocked. Please allow pop-ups for this site.');
                    return;
                  }
                  
                  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Receipt - ${viewingSale?.id || 'RECEIPT'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif; 
      background: #fff; 
      color: #000; 
      padding: 32px; 
      font-size: 14px; 
      max-width: 800px;
      margin: 0 auto;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 10px; }
    img { max-width: 100%; height: auto; }
    
    @media print {
      body { padding: 20px; }
      button { display: none !important; }
      @page { 
        margin: 0.5in;
        size: A4;
      }
    }
    
    @media screen {
      body {
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
        margin: 20px auto;
      }
    }
  </style>
</head>
<body>${src.innerHTML}</body>
</html>`);
                  win.document.close();
                  
                  // Wait for images to load
                  win.addEventListener('load', () => {
                    setTimeout(() => {
                      win.focus();
                      win.print();
                    }, 500);
                  });
                }}
              >
                🖨️ Print / Save PDF
              </Button>
              </div>
            </div>
          }
        >
          <SaleReceipt sale={viewingSale} user={user} elementId="pos-receipt-content" />
        </Modal>
      )}
    </div>
  );
}

export default POSTab;
export { POSTab };
