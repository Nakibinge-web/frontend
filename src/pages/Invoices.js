import React, { useState, useEffect } from 'react';
import Modal from '../components/ui/Modal';


function PrintableInvoiceModal({ invoice, user, onClose }) {
  if (!invoice) return null;

  const handlePrint = () => { window.print(); };

  const tenant = user?.tenant || {};
  const businessName    = tenant.name    || user?.name  || 'Smart Trendz';
  const businessPhone   = tenant.phone   || user?.phone || '0776 293691';
  const businessEmail   = tenant.email   || user?.email || '';
  const businessAddress = tenant.address || 'Shop 311, Level 3, Kooki Tower Opp. City Square';

  const items    = invoice.items || invoice.sale_items || invoice.saleItems || [];
  const subtotal = invoice.subtotal != null
    ? parseFloat(invoice.subtotal)
    : items.reduce((s, i) => s + (parseFloat(i.subtotal) || (parseFloat(i.price || 0) * parseFloat(i.quantity || 1))), 0);
  const discount = parseFloat(invoice.discount_amount || 0);
  const tax      = parseFloat(invoice.tax_amount || 0);
  const total    = parseFloat(invoice.total_amount || (subtotal - discount + tax));
  const paid     = parseFloat(invoice.amount_paid ?? total);
  const balance  = Math.max(0, total - paid);

  const fmtDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    // Avoid timezone offset shifting the date
    const utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utc.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const invoiceNumber = invoice.invoice_number || `INV/25-26/${String(invoice.id || '0125').padStart(4, '0')}`;
  const invoiceDate   = fmtDate(invoice.invoice_date || invoice.sale_date || invoice.created_at);
  const dueDate       = fmtDate(invoice.due_date || invoice.invoice_date || invoice.sale_date);
  const sourceRef     = invoice.source_ref || `S${String(invoice.id || '00124').padStart(5, '0')}`;
  const customerName    = invoice.customer_name || invoice.customer?.name || 'Valued Customer';
  const customerPhone   = invoice.customer_phone || invoice.customer?.phone || invoice.customer?.contact || '';
  const customerEmail   = invoice.customer_email || invoice.customer?.email || '';
  const customerAddress = invoice.customer_address || invoice.customer?.address || '';

  // Export invoice to CSV
  const handleExportInvoice = () => {
    const invoiceData = items.map(item => ({
      product: item.product?.name || item.name || `Item ${item.product_id}`,
      quantity: item.quantity || 1,
      unit_price: item.price || 0,
      subtotal: item.subtotal || (item.price * item.quantity)
    }));
    
    const csvHeader = ['Item', 'Quantity', 'Unit Price', 'Subtotal'].join(',');
    const csvRows = invoiceData.map(row => 
      `"${row.product}",${row.quantity},${row.unit_price},${row.subtotal}`
    );
    
    // Add summary rows
    csvRows.push('');
    csvRows.push(`"Subtotal",,,"${subtotal}"`);
    if (discount > 0) csvRows.push(`"Discount",,,"${discount}"`);
    if (tax > 0) csvRows.push(`"Tax",,,"${tax}"`);
    csvRows.push(`"Total",,,"${total}"`);
    csvRows.push(`"Amount Paid",,,"${paid}"`);
    csvRows.push(`"Balance",,,"${balance}"`);
    
    const csvContent = [
      `Invoice: ${invoiceNumber}`,
      `Customer: ${customerName}`,
      `Date: ${invoiceDate}`,
      '',
      csvHeader,
      ...csvRows
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invoice_${invoiceNumber.replace(/\//g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="" size="xl" className="invoice-modal">
      {/* ── Action bar (screen only, hidden on print) ── */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📄</div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{invoiceNumber}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{customerName}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExportInvoice} style={{ padding: '9px 20px', borderRadius: 7, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 3px 10px rgba(22,163,74,0.3)' }}>📥 Export CSV</button>
          <button onClick={handlePrint} style={{ padding: '9px 20px', borderRadius: 7, border: 'none', background: '#881337', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 3px 10px rgba(136,19,55,0.3)' }}>🖨️ Print / Save PDF</button>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 7, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Close</button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PRINTABLE INVOICE BODY
          Matches the Smart Trendz proforma layout
      ══════════════════════════════════════════════ */}
      <div id="printable-invoice" style={{
        background: '#ffffff',
        padding: '36px 44px 32px',
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        color: '#0f172a',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Decorative circle — top right, matches screenshot */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 260, height: 260, borderRadius: '50%',
          background: 'rgba(190,18,60,0.06)', pointerEvents: 'none',
        }} />

        {/* ── HEADER: logo/name + customer left · address right ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>

          {/* Left: logo + business name, then customer details below */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <img
                src="/zziwa logo.png"
                alt={businessName}
                style={{ width: 68, height: 68, objectFit: 'contain', flexShrink: 0 }}
              />
              <div style={{ paddingTop: 2 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#be123c', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                  {businessName}
                </div>
              </div>
            </div>
            {/* Customer details — sits directly below the logo */}
            <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.8, paddingLeft: 2 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>To:</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{customerName}</div>
              {customerPhone   && <div>{customerPhone}</div>}
              {customerEmail   && <div>{customerEmail}</div>}
              {customerAddress && <div>{customerAddress}</div>}
            </div>
          </div>

          {/* Right: business contact block + invoice title below */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ textAlign: 'right', fontSize: 13, color: '#1e293b', lineHeight: 1.8 }}>
              <div style={{ fontWeight: 700 }}>{businessName}</div>
              <div>{businessAddress}</div>
              <div>{businessPhone}</div>
              {businessEmail && <div>{businessEmail}</div>}
              <div>Kampala Uganda</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#be123c', letterSpacing: '-0.3px', textAlign: 'right' }}>
              Invoice {invoiceNumber}
            </div>
          </div>
        </div>

        {/* ── DATE / DUE DATE / SOURCE INFO CARD ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          border: '1.5px solid #cbd5e1',
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 22,
        }}>
          {[
            { label: 'Invoice Date', value: invoiceDate },
            { label: 'Due Date',     value: dueDate     },
            { label: 'Source',       value: sourceRef   },
          ].map((cell, i, arr) => (
            <div key={cell.label} style={{
              padding: '12px 18px',
              borderRight: i < arr.length - 1 ? '1.5px solid #cbd5e1' : 'none',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{cell.label}</div>
              <div style={{ fontSize: 13, color: '#475569' }}>{cell.value}</div>
            </div>
          ))}
        </div>

        {/* ── LINE ITEMS TABLE ── */}
        <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#881337', color: '#ffffff' }}>
                <th style={{ padding: '11px 18px', textAlign: 'left',   fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Items</th>
                <th style={{ padding: '11px 18px', textAlign: 'center', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', width: 130 }}>Quantity</th>
                <th style={{ padding: '11px 18px', textAlign: 'right',  fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', width: 150 }}>Unit Price</th>
                <th style={{ padding: '11px 18px', textAlign: 'right',  fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', width: 160 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '20px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No items</td>
                </tr>
              ) : items.map((item, idx) => {
                const name      = item.product?.name || item.name || item.description || `Item #${idx + 1}`;
                const qty       = parseFloat(item.quantity || 1);
                const price     = parseFloat(item.price || item.unit_price || 0);
                const amt       = parseFloat(item.subtotal != null ? item.subtotal : qty * price);
                const unitLabel = item.product?.unit || item.unit || 'Units';
                const isLast    = idx === items.length - 1;

                return (
                  <tr key={idx} style={{ borderBottom: isLast ? 'none' : '1px solid #f1f5f9' }}>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: '#0f172a' }}>{name}</td>
                    <td style={{ padding: '13px 18px', textAlign: 'center', fontSize: 13, color: '#475569' }}>
                      {qty.toFixed(2)} {unitLabel}
                    </td>
                    <td style={{ padding: '13px 18px', textAlign: 'right', fontSize: 13, color: '#475569' }}>
                      {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '13px 18px', textAlign: 'right', fontSize: 13, color: '#0f172a' }}>
                      {amt.toLocaleString('en-UG', { minimumFractionDigits: 0 })} USh
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── BOTTOM SECTION: payment note (left) + totals (right) ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginTop: 4 }}>

          {/* Payment terms — only shown if the invoice has notes */}
          <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.8 }}>
            {invoice.notes && (
              <div style={{ fontSize: 12, color: '#475569', maxWidth: 380 }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Terms: </span>{invoice.notes}
              </div>
            )}
          </div>

          {/* Totals block — matches screenshot (paid row + bold amount due) */}
          <div style={{ minWidth: 300, border: '1.5px solid #cbd5e1', borderRadius: 10, overflow: 'hidden' }}>
            {/* Paid on date row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
              <span style={{ fontStyle: 'italic', color: '#475569' }}>Paid on {invoiceDate}</span>
              <span style={{ color: '#0f172a' }}>
                {paid.toLocaleString('en-UG', { minimumFractionDigits: 0 })} USh
              </span>
            </div>
            {/* Amount Due row — bold, dark background when balance > 0 */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '12px 18px',
              background: balance > 0 ? '#fff1f2' : '#f0fdf4',
              fontSize: 14,
            }}>
              <span style={{ fontWeight: 800, color: balance > 0 ? '#9f1239' : '#166534' }}>Amount Due</span>
              <span style={{ fontWeight: 800, color: balance > 0 ? '#9f1239' : '#166534' }}>
                {balance.toLocaleString('en-UG', { minimumFractionDigits: 0 })} USh
              </span>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════
// CREATE CUSTOM INVOICE MODAL
// ════════════════════════════════════════════════
function CustomInvoiceCreateModal({ user, customers, token, onClose, onCreated }) {
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [sourceRef, setSourceRef] = useState(`S00${Math.floor(100 + Math.random() * 900)}`);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Payment status state
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [amountPaid, setAmountPaid] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');

  // Products list for dropdown
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [items, setItems] = useState([
    { description: '', quantity: '1', price: '', mode: 'manual', product_id: '' }
  ]);

  // Fetch products for dropdown
  useState(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch(`${API}/products?tenant_id=${user.tenant_id}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
        });
        if (res.ok) {
          const json = await res.json();
          setProducts(json.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddItem = () => {
    setItems(prev => [...prev, { description: '', quantity: '1', price: '', mode: 'manual', product_id: '' }]);
  };

  const handleRemoveItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
    // Clear item error when removed
    if (fieldErrors[`item_${idx}`]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[`item_${idx}`];
      setFieldErrors(newErrors);
    }
  };

  const handleItemChange = (idx, field, val) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    // Clear field error when user types
    if (fieldErrors[`item_${idx}`]) {
      setFieldErrors(prev => ({ ...prev, [`item_${idx}`]: null }));
    }
  };

  // Handle product selection from dropdown
  const handleProductSelect = (idx, productId) => {
    if (!productId) {
      handleItemChange(idx, 'product_id', '');
      handleItemChange(idx, 'mode', 'manual');
      return;
    }
    
    const product = products.find(p => String(p.id) === String(productId));
    if (product) {
      setItems(prev => prev.map((item, i) => i === idx ? {
        ...item,
        product_id: productId,
        mode: 'product',
        description: product.name,
        price: String(product.price || 0)
      } : item));
      
      // Clear error
      if (fieldErrors[`item_${idx}`]) {
        setFieldErrors(prev => ({ ...prev, [`item_${idx}`]: null }));
      }
    }
  };

  // Toggle between product dropdown and manual entry
  const toggleItemMode = (idx) => {
    const currentMode = items[idx].mode;
    const newMode = currentMode === 'manual' ? 'product' : 'manual';
    
    setItems(prev => prev.map((item, i) => i === idx ? {
      ...item,
      mode: newMode,
      product_id: '',
      description: '',
      price: '',
      quantity: '1'
    } : item));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return sum + (q * p);
    }, 0);
  };

  const handleSelectCustomer = (e) => {
    const custId = e.target.value;
    if (!custId) return;
    const cust = customers.find(c => String(c.id) === String(custId));
    if (cust) {
      setCustomerName(cust.name || '');
      setCustomerPhone(cust.phone || cust.contact || '');
      setCustomerEmail(cust.email || '');
      // Clear customer errors
      if (fieldErrors.customerName) {
        setFieldErrors(prev => ({ ...prev, customerName: null }));
      }
    }
  };

  // When status changes, reset payment fields and auto-fill where appropriate
  const handleStatusChange = (newStatus) => {
    setPaymentStatus(newStatus);
    const total = calculateTotal();
    if (newStatus === 'paid') {
      setAmountPaid(String(total));
      setAmountDue('0');
    } else if (newStatus === 'due') {
      setAmountPaid('0');
      setAmountDue(String(total));
    } else {
      // partial — clear both so user fills in
      setAmountPaid('');
      setAmountDue('');
    }
    // Clear payment errors
    setFieldErrors(prev => ({ ...prev, amountPaid: null, amountDue: null }));
  };

  // When partial amount paid changes, auto-calc amount due
  const handlePartialPaidChange = (val) => {
    setAmountPaid(val);
    const total = calculateTotal();
    const paid = parseFloat(val) || 0;
    setAmountDue(String(Math.max(0, total - paid)));
    // Clear error
    if (fieldErrors.amountPaid) {
      setFieldErrors(prev => ({ ...prev, amountPaid: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setFieldErrors({});

    // ══════════════════════════════════════════════════════════════════════
    // COMPREHENSIVE FORM VALIDATION
    // ══════════════════════════════════════════════════════════════════════
    const errors = {};
    
    // 1. Customer Name Validation
    if (!customerName.trim()) {
      errors.customerName = 'Customer name is required for invoice generation';
    } else if (customerName.trim().length < 2) {
      errors.customerName = 'Customer name must be at least 2 characters';
    } else if (customerName.trim().length > 100) {
      errors.customerName = 'Customer name must not exceed 100 characters';
    }
    
    // 2. Customer Phone Validation (optional but must be valid if provided)
    if (customerPhone.trim() && !/^[\d\s+\-()]+$/.test(customerPhone)) {
      errors.customerPhone = 'Phone number contains invalid characters';
    }
    
    // 3. Customer Email Validation (optional but must be valid if provided)
    if (customerEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        errors.customerEmail = 'Please enter a valid email address (e.g., customer@example.com)';
      }
    }
    
    // 4. Invoice Date Validation
    if (!invoiceDate) {
      errors.invoiceDate = 'Invoice date is required';
    }
    
    // 5. Due Date Validation
    if (!dueDate) {
      errors.dueDate = 'Due date is required';
    } else if (invoiceDate && dueDate < invoiceDate) {
      errors.dueDate = 'Due date cannot be earlier than invoice date';
    }
    
    // 6. Items Validation - Comprehensive per-item validation
    const validItems = [];
    
    items.forEach((item, idx) => {
      const itemErrors = [];
      
      // Check description
      if (!item.description.trim()) {
        itemErrors.push('Description is required');
      }
      
      // Check quantity
      const qty = parseFloat(item.quantity);
      if (!item.quantity || isNaN(qty) || qty <= 0) {
        itemErrors.push('Valid quantity required (must be greater than 0)');
      }
      
      // Check price
      const price = parseFloat(item.price);
      if (!item.price || isNaN(price) || price < 0) {
        itemErrors.push('Valid price required (must be 0 or greater)');
      }
      
      // If this item has errors, record them
      if (itemErrors.length > 0) {
        errors[`item_${idx}`] = itemErrors.join(', ');
      } else {
        // Only add to valid items if no errors
        validItems.push(item);
      }
    });
    
    // Overall items check
    if (items.length === 0) {
      errors.items = 'Please add at least one invoice line item';
    } else if (validItems.length === 0) {
      errors.items = 'Please provide valid details for at least one item (description, quantity, and price)';
    }
    
    // 7. Payment Status Validation
    const total = calculateTotal();
    
    if (paymentStatus === 'paid') {
      const paid = parseFloat(amountPaid);
      if (!amountPaid || isNaN(paid) || paid < 0) {
        errors.amountPaid = 'Amount paid is required and must be 0 or greater';
      } else if (paid > total) {
        errors.amountPaid = `Amount paid (${paid.toLocaleString()}) cannot exceed invoice total (${total.toLocaleString()})`;
      }
    } else if (paymentStatus === 'partial') {
      const paid = parseFloat(amountPaid);
      if (!amountPaid || isNaN(paid) || paid <= 0) {
        errors.amountPaid = 'For partial payment, amount paid must be greater than 0';
      } else if (paid >= total) {
        errors.amountPaid = 'For partial payment, amount paid must be less than total. Use "Paid" status instead.';
      }
    } else if (paymentStatus === 'due') {
      const due = parseFloat(amountDue);
      if (!amountDue || isNaN(due) || due <= 0) {
        errors.amountDue = 'Amount due is required and must be greater than 0';
      } else if (due > total) {
        errors.amountDue = `Amount due (${due.toLocaleString()}) cannot exceed invoice total (${total.toLocaleString()})`;
      }
    }

    // 8. If there are validation errors, show them and stop submission
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('Please fix all validation errors before submitting the invoice');
      // Scroll to top to show error message
      setTimeout(() => {
        const modalContent = document.querySelector('[data-invoice-form]');
        if (modalContent) modalContent.scrollTop = 0;
      }, 100);
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PREPARE AND SUBMIT INVOICE DATA
    // ══════════════════════════════════════════════════════════════════════
    const payload = {
      invoice_date: invoiceDate,
      due_date: dueDate,
      source_ref: sourceRef.trim() || null,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || null,
      customer_email: customerEmail.trim() || null,
      payment_status: paymentStatus,
      amount_paid: parseFloat(amountPaid) || 0,
      notes: paymentTerms.trim() || null,
      items: validItems.map(i => ({
        description: i.description.trim(),
        quantity: parseFloat(i.quantity) || 1,
        price: parseFloat(i.price) || 0,
        subtotal: (parseFloat(i.quantity) || 1) * (parseFloat(i.price) || 0)
      }))
    };

    try {
      setSubmitting(true);
      const res = await fetch(`${API}/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg = json.message || (json.errors ? Object.values(json.errors).flat().join(' ') : 'Failed to save invoice.');
        setSubmitError(msg);
        return;
      }
      onCreated(json.data);
    } catch (err) {
      setSubmitError('Network error. Unable to reach the server. Please check your internet connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create New Proforma Invoice" maxWidth="820px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }} data-invoice-form>
        {submitError && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#b91c1c', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Validation Error</div>
              <div>{submitError}</div>
            </div>
          </div>
        )}

        {customers && customers.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
              Quick Select Customer (Optional)
            </label>
            <select
              onChange={handleSelectCustomer}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13, background: '#fff' }}
            >
              <option value="">— Select an existing customer to auto-fill details —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
              Customer Name (Required)
            </label>
            <input
              type="text"
              placeholder="e.g., Jane Nakato, Hotel Manager"
              value={customerName}
              onChange={e => { setCustomerName(e.target.value); if (fieldErrors.customerName) setFieldErrors(prev => ({ ...prev, customerName: null })); }}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid', borderColor: fieldErrors.customerName ? '#dc2626' : '#cbd5e1', borderRadius: 8, fontSize: 13 }}
            />
            {fieldErrors.customerName && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 4, display: 'block' }}>{fieldErrors.customerName}</span>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
              Phone Number (Optional)
            </label>
            <input
              type="text"
              placeholder="+256 700 000 000"
              value={customerPhone}
              onChange={e => { setCustomerPhone(e.target.value); if (fieldErrors.customerPhone) setFieldErrors(prev => ({ ...prev, customerPhone: null })); }}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid', borderColor: fieldErrors.customerPhone ? '#dc2626' : '#cbd5e1', borderRadius: 8, fontSize: 13 }}
            />
            {fieldErrors.customerPhone && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 4, display: 'block' }}>{fieldErrors.customerPhone}</span>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
              Source / Reference
            </label>
            <input
              type="text"
              placeholder="e.g., ORDER-12345"
              value={sourceRef}
              onChange={e => setSourceRef(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
              Customer Email (Optional)
            </label>
            <input
              type="email"
              placeholder="customer@example.com"
              value={customerEmail}
              onChange={e => { setCustomerEmail(e.target.value); if (fieldErrors.customerEmail) setFieldErrors(prev => ({ ...prev, customerEmail: null })); }}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid', borderColor: fieldErrors.customerEmail ? '#dc2626' : '#cbd5e1', borderRadius: 8, fontSize: 13 }}
            />
            {fieldErrors.customerEmail && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 4, display: 'block' }}>{fieldErrors.customerEmail}</span>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
              Invoice Date (Required)
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={e => { setInvoiceDate(e.target.value); if (fieldErrors.invoiceDate) setFieldErrors(prev => ({ ...prev, invoiceDate: null })); }}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid', borderColor: fieldErrors.invoiceDate ? '#dc2626' : '#cbd5e1', borderRadius: 8, fontSize: 13 }}
            />
            {fieldErrors.invoiceDate && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 4, display: 'block' }}>{fieldErrors.invoiceDate}</span>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
              Due Date (Required)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => { setDueDate(e.target.value); if (fieldErrors.dueDate) setFieldErrors(prev => ({ ...prev, dueDate: null })); }}
              min={invoiceDate}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid', borderColor: fieldErrors.dueDate ? '#dc2626' : '#cbd5e1', borderRadius: 8, fontSize: 13 }}
            />
            {fieldErrors.dueDate && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 4, display: 'block' }}>{fieldErrors.dueDate}</span>}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 800, color: '#881337', textTransform: 'uppercase' }}>
              Invoice Line Items {fieldErrors.items && <span style={{ color: '#dc2626', fontSize: 11, marginLeft: 8 }}>⚠️ {fieldErrors.items}</span>}
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#be123c', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              + Add Item Line
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ border: '1.5px solid', borderColor: fieldErrors[`item_${idx}`] ? '#dc2626' : '#e2e8f0', borderRadius: 10, padding: '12px', background: item.mode === 'product' ? '#fafbff' : '#fff' }}>
                {/* Mode toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => toggleItemMode(idx)}
                      style={{
                        padding: '3px 10px', borderRadius: 16, fontSize: 11, fontWeight: 700,
                        border: '1.5px solid',
                        borderColor: item.mode === 'manual' ? '#be123c' : '#3b82f6',
                        background: item.mode === 'manual' ? '#be123c' : '#3b82f6',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      {item.mode === 'manual' ? '✍️ Manual Entry' : '📦 From Products'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItemMode(idx)}
                      style={{
                        padding: '3px 10px', borderRadius: 16, fontSize: 11, fontWeight: 600,
                        border: '1.5px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      🔄 Switch Mode
                    </button>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 10px', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                {/* Product dropdown mode */}
                {item.mode === 'product' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>SELECT PRODUCT</label>
                      <select
                        value={item.product_id}
                        onChange={e => handleProductSelect(idx, e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, background: '#fff' }}
                        disabled={loadingProducts}
                      >
                        <option value="">— Choose from inventory —</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (UGX {parseFloat(p.price || 0).toLocaleString()})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>QUANTITY</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="1"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, textAlign: 'center' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>UNIT PRICE (UGX)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={item.price}
                        onChange={e => handleItemChange(idx, 'price', e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, textAlign: 'right', background: '#f8fafc' }}
                      />
                    </div>
                  </div>
                )}

                {/* Manual entry mode */}
                {item.mode === 'manual' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: 10 }}>
                    <input
                      type="text"
                      placeholder="Item description (e.g., Memory Foam Mattress Queen Size)"
                      value={item.description}
                      onChange={e => handleItemChange(idx, 'description', e.target.value)}
                      style={{ padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                      style={{ padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, textAlign: 'center' }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Unit Price (UGX)"
                      value={item.price}
                      onChange={e => handleItemChange(idx, 'price', e.target.value)}
                      style={{ padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, textAlign: 'right' }}
                    />
                  </div>
                )}

                {/* Subtotal display */}
                {item.quantity && item.price && (
                  <div style={{ marginTop: 8, textAlign: 'right', fontSize: 12, color: '#475569', fontWeight: 600 }}>
                    Subtotal: <span style={{ color: '#881337', fontWeight: 800 }}>UGX {((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toLocaleString()}</span>
                  </div>
                )}

                {/* Item error */}
                {fieldErrors[`item_${idx}`] && (
                  <div style={{ marginTop: 8, padding: '6px 10px', background: '#fef2f2', borderRadius: 6, color: '#dc2626', fontSize: 11, fontWeight: 600 }}>
                    ⚠️ {fieldErrors[`item_${idx}`]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '14px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>Total Invoice Amount:</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#881337' }}>UGX {calculateTotal().toLocaleString()}</span>
        </div>

        {/* ── PAYMENT STATUS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Payment Status (Required)
            </label>
            <select
              value={paymentStatus}
              onChange={e => handleStatusChange(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13, background: '#fff', fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="paid">✅ Paid - Invoice has been fully paid</option>
              <option value="partial">⏳ Partial - Invoice partially paid, balance due</option>
              <option value="due">❌ Due - Invoice unpaid, full amount due</option>
            </select>
          </div>

          {/* PAID — show amount paid (pre-filled with total, editable) */}
          {paymentStatus === 'paid' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Amount Paid (UGX) (Required)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={e => { setAmountPaid(e.target.value); if (fieldErrors.amountPaid) setFieldErrors(prev => ({ ...prev, amountPaid: null })); }}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid', borderColor: fieldErrors.amountPaid ? '#dc2626' : '#86efac', borderRadius: 8, fontSize: 14, fontWeight: 600, background: '#f0fdf4', boxSizing: 'border-box' }}
              />
              {fieldErrors.amountPaid && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 4, display: 'block' }}>{fieldErrors.amountPaid}</span>}
            </div>
          )}

          {/* PARTIAL — amount paid (user fills) + amount due (auto-calculated) */}
          {paymentStatus === 'partial' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Amount Paid (UGX) (Required)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter partial amount paid"
                  value={amountPaid}
                  onChange={e => handlePartialPaidChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid', borderColor: fieldErrors.amountPaid ? '#dc2626' : '#fcd34d', borderRadius: 8, fontSize: 14, fontWeight: 600, background: '#fffbeb', boxSizing: 'border-box' }}
                />
                {fieldErrors.amountPaid && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 4, display: 'block' }}>{fieldErrors.amountPaid}</span>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Amount Due (UGX) — Auto-Calculated
                </label>
                <input
                  type="number"
                  readOnly
                  value={amountDue}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #fca5a5', borderRadius: 8, fontSize: 14, fontWeight: 700, background: '#fef2f2', color: '#b91c1c', boxSizing: 'border-box', cursor: 'not-allowed' }}
                />
              </div>
            </div>
          )}

          {/* DUE — amount due (user fills manually) */}
          {paymentStatus === 'due' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Amount Due (UGX) (Required)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter full amount due"
                value={amountDue}
                onChange={e => { setAmountDue(e.target.value); if (fieldErrors.amountDue) setFieldErrors(prev => ({ ...prev, amountDue: null })); }}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid', borderColor: fieldErrors.amountDue ? '#dc2626' : '#fca5a5', borderRadius: 8, fontSize: 14, fontWeight: 600, background: '#fef2f2', boxSizing: 'border-box' }}
              />
              {fieldErrors.amountDue && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 4, display: 'block' }}>{fieldErrors.amountDue}</span>}
            </div>
          )}
        </div>

        {/* ── PAYMENT TERMS & CONDITIONS ── */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Payment Terms &amp; Conditions (Optional)
          </label>
          <textarea
            rows={3}
            value={paymentTerms}
            onChange={e => setPaymentTerms(e.target.value)}
            placeholder="e.g., Payment due within 30 days. Accepted methods: Bank transfer, Mobile Money. Late payment fee: 5% per month."
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1.5px solid #cbd5e1',
              borderRadius: 8,
              fontSize: 13,
              color: '#0f172a',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              lineHeight: 1.6,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#881337', color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.75 : 1, boxShadow: '0 4px 12px rgba(136,19,55,0.3)' }}
          >
            {submitting ? '⏳ Saving Invoice…' : '📄 Generate Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ════════════════════════════════════════════════
// INVOICE EDIT STATUS MODAL
// ════════════════════════════════════════════════
function InvoiceEditStatusModal({ invoice, onClose, onSave }) {
  const [status, setStatus] = useState(invoice.payment_status || 'paid');
  const [amountPaid, setAmountPaid] = useState(String(invoice.amount_paid ?? invoice.total_amount ?? ''));
  const [saving, setSaving] = useState(false);

  const total = parseFloat(invoice.total_amount || 0);
  const paid = parseFloat(amountPaid) || 0;
  const balance = Math.max(0, total - paid);

  // Auto-derive status from amount paid when user changes the amount
  const handleAmountChange = (val) => {
    setAmountPaid(val);
    const p = parseFloat(val) || 0;
    if (p >= total) setStatus('paid');
    else if (p > 0) setStatus('partial');
    else setStatus('due');
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(invoice.id, status, parseFloat(amountPaid) || 0);
    setSaving(false);
  };

  const statusOptions = [
    { value: 'paid',    label: 'Paid',    bg: '#dcfce7', color: '#15803d' },
    { value: 'partial', label: 'Partial', bg: '#fef3c7', color: '#b45309' },
    { value: 'due',     label: 'Due',     bg: '#fee2e2', color: '#b91c1c' },
  ];

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Payment Status" maxWidth="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Invoice reference */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Invoice</p>
          <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{invoice.invoice_number}</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#475569' }}>{invoice.customer_name} · Total: <strong>UGX {total.toLocaleString()}</strong></p>
        </div>

        {/* Status selector */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Payment Status
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  border: status === opt.value ? `2px solid ${opt.color}` : '2px solid #e2e8f0',
                  background: status === opt.value ? opt.bg : '#fff',
                  color: status === opt.value ? opt.color : '#64748b',
                  transition: 'all 0.12s'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount paid */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Amount Paid (UGX)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amountPaid}
            onChange={e => handleAmountChange(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, fontWeight: 600, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#64748b' }}>
            <span>Balance remaining: <strong style={{ color: balance > 0 ? '#b91c1c' : '#15803d' }}>UGX {balance.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
              background: '#881337', color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.75 : 1,
              boxShadow: '0 4px 12px rgba(136,19,55,0.25)'
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════
// INVOICES TAB COMPONENT
// ════════════════════════════════════════════════
function InvoicesTab({ sales, customers, user, token, toast }) {
  const [customInvoices, setCustomInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);   // invoice being status-edited
  const [search, setSearch] = useState('');

  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Fetch persisted custom invoices from the backend on mount
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch(`${API}/invoices`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const json = await res.json();
        if (json.success) {
          setCustomInvoices(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load invoices', err);
      } finally {
        setLoadingInvoices(false);
      }
    };
    fetchInvoices();
  }, [API, token]);

  // Derive invoice rows from sales (sale-based invoices, always present)
  const saleInvoices = (sales || []).map(s => ({
    id: `sale-${s.id}`,
    _type: 'sale',
    invoice_number: `INV/25-26/${String(s.id).padStart(4, '0')}`,
    invoice_date: (s.sale_date || s.created_at || '').slice(0, 10),
    due_date: (s.sale_date || s.created_at || '').slice(0, 10),
    customer_name: s.customer?.name || 'Walk-in Customer',
    customer_email: s.customer?.email || '',
    customer_phone: s.customer?.phone || s.customer?.contact || '',
    customer_address: s.customer?.address || '',
    total_amount: parseFloat(s.total_amount || 0),
    amount_paid: parseFloat(s.total_amount || 0),
    payment_status: 'paid',
    items: s.sale_items || s.saleItems || [],
    source_ref: `S${String(s.id).padStart(5, '0')}`
  }));

  // Normalise custom invoices from DB for the same shape
  const dbInvoices = customInvoices.map(inv => ({
    ...inv,
    _type: 'custom',
    invoice_date: inv.invoice_date ? String(inv.invoice_date).slice(0, 10) : '',
    due_date: inv.due_date ? String(inv.due_date).slice(0, 10) : '',
    total_amount: parseFloat(inv.total_amount || 0),
    amount_paid: parseFloat(inv.amount_paid || 0),
  }));

  // Merge: custom invoices first (newest), then sale-based
  const invoicesList = [...dbInvoices, ...saleInvoices];

  const filteredInvoices = invoicesList.filter(inv =>
    !search ||
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteInvoice = async (inv) => {
    if (inv._type !== 'custom') return;
    if (!window.confirm(`Delete invoice ${inv.invoice_number}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/invoices/${inv.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const json = await res.json();
      if (json.success) {
        setCustomInvoices(prev => prev.filter(i => i.id !== inv.id));
        if (selectedInvoice?.id === inv.id) setSelectedInvoice(null);
        toast && toast.success('Invoice deleted', 'The invoice has been removed.');
      } else {
        toast && toast.error('Delete failed', json.message || 'Failed to delete invoice.');
      }
    } catch (err) {
      toast && toast.error('Network error', 'Please try again.');
    }
  };

  const handleSaveStatus = async (invoiceId, newStatus, amountPaid) => {
    try {
      const res = await fetch(`${API}/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ payment_status: newStatus, amount_paid: amountPaid })
      });
      const json = await res.json();
      if (json.success) {
        setCustomInvoices(prev =>
          prev.map(i => i.id === invoiceId ? { ...i, payment_status: json.data.payment_status, amount_paid: parseFloat(json.data.amount_paid) } : i)
        );
        setEditingInvoice(null);
        toast && toast.success('Status updated', 'Invoice payment status has been saved.');
      } else {
        toast && toast.error('Update failed', json.message || 'Failed to update invoice.');
      }
    } catch (err) {
      toast && toast.error('Network error', 'Please try again.');
    }
  };

  const statusStyle = (status) => {
    if (status === 'paid') return { background: '#dcfce7', color: '#15803d' };
    if (status === 'partial') return { background: '#fef3c7', color: '#b45309' };
    return { background: '#fee2e2', color: '#b91c1c' };
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '4px 0 32px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Invoices & Proforma Generator</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Generate, view, and print branded invoices featuring Zziwa & Sons branding</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Refresh Button */}
          <button
            onClick={() => {
              const fetchInvoices = async () => {
                try {
                  const res = await fetch(`${API}/invoices`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                  });
                  const json = await res.json();
                  if (json.success) {
                    setCustomInvoices(json.data || []);
                    toast && toast.success('Refreshed', 'Invoice list updated successfully.');
                  }
                } catch (err) {
                  toast && toast.error('Refresh failed', 'Could not reload invoices.');
                }
              };
              fetchInvoices();
            }}
            style={{
              padding: '10px 16px', borderRadius: 10, border: '1px solid #cbd5e1',
              background: '#fff', color: '#475569', fontWeight: 600,
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          >
            🔄 Refresh
          </button>
          
          {/* Export Button */}
          <button
            onClick={() => {
              const exportData = invoicesList.map(inv => ({
                invoice_number: inv.invoice_number,
                customer: inv.customer_name,
                invoice_date: inv.invoice_date,
                due_date: inv.due_date,
                total_amount: inv.total_amount,
                amount_paid: inv.amount_paid,
                balance: inv.total_amount - inv.amount_paid,
                status: inv.payment_status,
                type: inv._type === 'custom' ? 'Custom' : 'Sale'
              }));
              
              const headers = Object.keys(exportData[0] || {});
              const csvContent = [
                headers.join(','),
                ...exportData.map(row => headers.map(h => {
                  const value = row[h] || '';
                  return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
                    ? `"${value.replace(/"/g, '""')}"` 
                    : value;
                }).join(','))
              ].join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `invoices_export_${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
              
              toast && toast.success('Exported', `${exportData.length} invoices exported to CSV.`);
            }}
            style={{
              padding: '10px 16px', borderRadius: 10, border: 'none',
              background: '#2563eb', color: '#fff', fontWeight: 600,
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
          >
            📥 Export CSV
          </button>
          
          {/* Print Button */}
          <button
            onClick={() => {
              const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8"/>
                  <title>Invoices List - ${new Date().toLocaleDateString()}</title>
                  <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: 'Arial', sans-serif; padding: 40px; }
                    h1 { margin-bottom: 10px; color: #881337; }
                    .meta { margin-bottom: 30px; color: #64748b; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                    th { background: #f8fafc; font-weight: 700; font-size: 12px; text-transform: uppercase; color: #475569; }
                    td { font-size: 14px; }
                    .total-row { font-weight: 700; background: #f8fafc; }
                    @media print {
                      body { padding: 20px; }
                      @page { margin: 0.5in; }
                    }
                  </style>
                </head>
                <body>
                  <h1>Invoices List</h1>
                  <div class="meta">
                    Generated: ${new Date().toLocaleString()}<br/>
                    Total Invoices: ${invoicesList.length}<br/>
                    Total Value: UGX ${invoicesList.reduce((s, i) => s + i.total_amount, 0).toLocaleString()}
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${invoicesList.map(inv => `
                        <tr>
                          <td>${inv.invoice_number}</td>
                          <td>${inv.customer_name}</td>
                          <td>${inv.invoice_date}</td>
                          <td>UGX ${inv.total_amount.toLocaleString()}</td>
                          <td>${(inv.payment_status || 'paid').toUpperCase()}</td>
                          <td>${inv._type === 'custom' ? 'Custom' : 'Sale'}</td>
                        </tr>
                      `).join('')}
                      <tr class="total-row">
                        <td colspan="3">TOTAL</td>
                        <td>UGX ${invoicesList.reduce((s, i) => s + i.total_amount, 0).toLocaleString()}</td>
                        <td colspan="2">${invoicesList.length} invoices</td>
                      </tr>
                    </tbody>
                  </table>
                </body>
                </html>
              `;
              
              const win = window.open('', '_blank');
              if (!win) {
                alert('Pop-up blocked. Please allow pop-ups for this site.');
                return;
              }
              win.document.write(printContent);
              win.document.close();
              win.addEventListener('load', () => {
                setTimeout(() => {
                  win.focus();
                  win.print();
                }, 300);
              });
            }}
            style={{
              padding: '10px 16px', borderRadius: 10, border: 'none',
              background: '#7c3aed', color: '#fff', fontWeight: 600,
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
            onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
          >
            🖨️ Print List
          </button>
          
          {/* Create Invoice Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: '#881337', color: '#ffffff', fontWeight: 700,
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 14px rgba(136,19,55,0.25)'
            }}
          >
            <span style={{ fontSize: 16 }}>+</span> Create Custom Invoice
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Invoices', value: invoicesList.length, color: '#881337', icon: '📄' },
          { label: 'Total Invoiced Value', value: `UGX ${invoicesList.reduce((s, i) => s + i.total_amount, 0).toLocaleString()}`, color: '#be123c', icon: '💰' },
          { label: 'Collected Amount', value: `UGX ${invoicesList.reduce((s, i) => s + i.amount_paid, 0).toLocaleString()}`, color: '#16a34a', icon: '✅' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 22px', borderTop: `3px solid ${k.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{k.value}</h3>
              </div>
              <span style={{ fontSize: 24 }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by invoice # or customer name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: 400, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 13 }}
        />
      </div>

      {/* Invoices List Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        {loadingInvoices ? (
          <div style={{ padding: 36, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading invoices…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                {['Invoice #', 'Customer', 'Date', 'Amount', 'Status', 'Type', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 18px', textAlign: h === 'Amount' ? 'right' : 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? filteredInvoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 800, color: '#881337' }}>{inv.invoice_number}</td>
                  <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{inv.customer_name}</td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: '#64748b' }}>{inv.invoice_date}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>UGX {inv.total_amount.toLocaleString()}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, ...statusStyle(inv.payment_status) }}>
                      {(inv.payment_status || 'paid').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                      background: inv._type === 'custom' ? '#eff6ff' : '#f0fdf4',
                      color: inv._type === 'custom' ? '#1d4ed8' : '#15803d'
                    }}>
                      {inv._type === 'custom' ? 'Custom' : 'Sale'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        style={{
                          padding: '6px 14px', borderRadius: 6, border: '1px solid #881337',
                          background: '#fff1f2', color: '#881337', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <span>📄</span> View / Print
                      </button>
                      {inv._type === 'custom' && (
                        <button
                          onClick={() => setEditingInvoice(inv)}
                          style={{
                            padding: '6px 10px', borderRadius: 6, border: '1px solid #bfdbfe',
                            background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: 12, cursor: 'pointer'
                          }}
                          title="Edit payment status"
                        >
                          ✏️ Status
                        </button>
                      )}
                      {inv._type === 'custom' && (
                        <button
                          onClick={() => handleDeleteInvoice(inv)}
                          style={{
                            padding: '6px 10px', borderRadius: 6, border: '1px solid #fecaca',
                            background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer'
                          }}
                          title="Delete invoice"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                    No invoices found matching search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <PrintableInvoiceModal
          invoice={selectedInvoice}
          user={user}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Create Custom Invoice Modal */}
      {showCreateModal && (
        <CustomInvoiceCreateModal
          user={user}
          customers={customers}
          token={token}
          onClose={() => setShowCreateModal(false)}
          onCreated={(savedInvoice) => {
            setCustomInvoices(prev => [savedInvoice, ...prev]);
            setShowCreateModal(false);
            setSelectedInvoice({ ...savedInvoice, _type: 'custom' });
            toast && toast.success('Invoice created', 'Saved successfully and ready to print.');
          }}
        />
      )}

      {/* Edit Payment Status Modal */}
      {editingInvoice && (
        <InvoiceEditStatusModal
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSave={handleSaveStatus}
        />
      )}
    </div>
  );
}

export default InvoicesTab;
export { InvoicesTab, PrintableInvoiceModal, CustomInvoiceCreateModal, InvoiceEditStatusModal };
