import React, { useState, useEffect } from 'react';
import Modal from './components/ui/Modal';

// ════════════════════════════════════════════════
// INVOICE SETTINGS & BRANDING STORAGE HELPERS
// ════════════════════════════════════════════════
export function getStoredInvoiceSettings(user) {
  const tenant = user?.tenant || {};
  const defaults = {
    businessName: tenant.name || user?.name || 'SURE GADGETS',
    tagline: 'Quality & Reliability | Inventory Management',
    address: tenant.address || 'Shop 311, Level 3, Kooki Tower Opp. City Square, Kampala Uganda',
    phone: tenant.phone || user?.phone || '+256 754 723 743',
    email: tenant.email || user?.email || 'kategereian@gmail.com',
    tin: '1002345678',
    bankName: 'ABSA Bank Uganda',
    accountName: tenant.name || 'SURE GADGETS',
    accountNumber: '6008040719',
    mobileMoneyNumber: '+256 754 723 743',
    mobileMoneyName: tenant.name || 'SURE GADGETS',
    paymentTerms: 'Due upon receipt',
    notes: 'Please quote the invoice number as the payment reference. Thank you for your business!',
    logoUrl: ''
  };

  try {
    const saved = localStorage.getItem('zziwa_invoice_settings');
    if (saved) {
      return { ...defaults, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load invoice settings', e);
  }
  return defaults;
}

export function saveStoredInvoiceSettings(settings) {
  try {
    localStorage.setItem('zziwa_invoice_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save invoice settings', e);
  }
}

// ════════════════════════════════════════════════
// INVOICE SETTINGS & BRANDING MODAL
// ════════════════════════════════════════════════
export function InvoiceSettingsModal({ user, onClose, onSaved }) {
  const [settings, setSettings] = useState(() => getStoredInvoiceSettings(user));

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Please choose an image file under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSettings(prev => ({ ...prev, logoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveStoredInvoiceSettings(settings);
    if (onSaved) onSaved(settings);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Invoice Branding & Remittance Settings" maxWidth="740px">
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b' }}>
          Configure your company branding, tax registration, and payment remittance information. These details will automatically populate all invoices and prints.
        </p>

        {/* Logo Upload & Preview */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            Company Logo (Appears on Official Invoices)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {settings.logoUrl ? (
              <div style={{ position: 'relative', border: '1px solid #cbd5e1', borderRadius: 6, padding: 6, background: '#ffffff' }}>
                <img src={settings.logoUrl} alt="Logo Preview" style={{ maxHeight: 60, maxWidth: 160, objectFit: 'contain', display: 'block' }} />
              </div>
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 6, background: '#f1f5f9', border: '1.5px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11, textAlign: 'center', padding: 4 }}>
                No Logo
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{
                  padding: '7px 14px', borderRadius: 6, border: '1px solid #cbd5e1',
                  background: '#ffffff', color: '#0f172a', fontWeight: 600, fontSize: 12,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {settings.logoUrl ? 'Change Logo Image' : 'Upload Logo Image'}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                </label>
                {settings.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Remove Logo
                  </button>
                )}
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Recommended: PNG or JPG with transparent/white background (Max 2MB)</span>
            </div>
          </div>
        </div>

        {/* Business Details Grid */}
        <div className="invoice-form-grid-2">
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Business / Company Name *</label>
            <input
              type="text"
              required
              value={settings.businessName}
              onChange={e => setSettings({ ...settings, businessName: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Tax ID (TIN / VAT Number)</label>
            <input
              type="text"
              placeholder="e.g. 1002345678"
              value={settings.tin}
              onChange={e => setSettings({ ...settings, tin: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div className="invoice-form-grid-2">
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Official Phone</label>
            <input
              type="text"
              value={settings.phone}
              onChange={e => setSettings({ ...settings, phone: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Official Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={e => setSettings({ ...settings, email: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Physical Address / Location</label>
          <input
            type="text"
            value={settings.address}
            onChange={e => setSettings({ ...settings, address: e.target.value })}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>

        {/* Banking & Remittance Information */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Banking &amp; Remittance Details
          </h4>
          <div className="invoice-form-grid-3" style={{ marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Bank Name</label>
              <input
                type="text"
                placeholder="e.g. ABSA Bank Uganda"
                value={settings.bankName}
                onChange={e => setSettings({ ...settings, bankName: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Account Number *</label>
              <input
                type="text"
                placeholder="e.g. 6008040719"
                value={settings.accountNumber}
                onChange={e => setSettings({ ...settings, accountNumber: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, fontWeight: 600, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Account Name / Holder</label>
              <input
                type="text"
                placeholder="e.g. SURE GADGETS"
                value={settings.accountName}
                onChange={e => setSettings({ ...settings, accountName: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div className="invoice-form-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Mobile Money Number</label>
              <input
                type="text"
                placeholder="e.g. +256 754 723 743"
                value={settings.mobileMoneyNumber}
                onChange={e => setSettings({ ...settings, mobileMoneyNumber: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Mobile Money Registered Name</label>
              <input
                type="text"
                placeholder="e.g. SURE GADGETS"
                value={settings.mobileMoneyName}
                onChange={e => setSettings({ ...settings, mobileMoneyName: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* Default Payment Terms & Notes */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <div className="invoice-form-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Default Payment Terms</label>
              <input
                type="text"
                placeholder="e.g. Due upon receipt"
                value={settings.paymentTerms}
                onChange={e => setSettings({ ...settings, paymentTerms: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Invoice Footer Notes</label>
              <input
                type="text"
                placeholder="e.g. Thank you for your business!"
                value={settings.notes}
                onChange={e => setSettings({ ...settings, notes: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: '1.5px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: 'none', background: '#0f172a', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'background-color 0.15s' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#1e293b'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#0f172a'}
          >
            Save Invoice Settings
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ════════════════════════════════════════════════
// PRINTABLE INVOICE MODAL (1:1 A4 Paper Sheet Preview)
// ════════════════════════════════════════════════
export function PrintableInvoiceModal({ invoice, user, onClose }) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const storedSettings = getStoredInvoiceSettings(user);

  // Business & Remittance details (invoice specific overrides fallback to storedSettings)
  const businessName = invoice.business_name || storedSettings.businessName;
  const businessPhone = invoice.business_phone || storedSettings.phone;
  const businessEmail = invoice.business_email || storedSettings.email;
  const businessAddress = invoice.business_address || storedSettings.address;
  const businessTin = invoice.business_tin || storedSettings.tin;
  const logoUrl = invoice.logo_url || storedSettings.logoUrl;

  const bankName = invoice.bank_name || storedSettings.bankName;
  const accountNumber = invoice.account_number || storedSettings.accountNumber;
  const accountName = invoice.account_name || storedSettings.accountName;
  const mobileMoneyNumber = invoice.mobile_money_number || storedSettings.mobileMoneyNumber;
  const mobileMoneyName = invoice.mobile_money_name || storedSettings.mobileMoneyName;
  const paymentTerms = invoice.payment_terms || storedSettings.paymentTerms || 'Due upon receipt';
  const notes = invoice.notes || storedSettings.notes;
  const customerTin = invoice.customer_tin || invoice.customer?.tin || '';

  const items = invoice.items || invoice.sale_items || invoice.saleItems || [];
  const subtotal = invoice.subtotal || items.reduce((s, i) => s + (parseFloat(i.subtotal) || (parseFloat(i.price || i.cost_price || 0) * parseFloat(i.quantity || 1))), 0);
  const discount = parseFloat(invoice.discount_amount || invoice.discount || 0);
  const tax = parseFloat(invoice.tax_amount || invoice.tax || 0);
  const total = parseFloat(invoice.total_amount || invoice.total || (subtotal - discount + tax));
  const paid = parseFloat(invoice.amount_paid !== undefined ? invoice.amount_paid : (invoice.payment_status === 'paid' ? total : total));
  const balance = Math.max(0, total - paid);

  const status = balance === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'DUE';
  const statusStyle = status === 'PAID'
    ? { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }
    : status === 'PARTIAL'
    ? { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }
    : { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' };

  const isProforma = invoice.is_proforma || invoice.type === 'proforma' || invoice.status === 'proforma' || (invoice.title && invoice.title.toUpperCase().includes('PROFORMA'));
  const documentType = invoice.title || (isProforma ? 'PROFORMA INVOICE' : 'TAX INVOICE');

  const invoiceNumber = invoice.invoice_number || invoice.reference || `INV/25-26/${String(invoice.id || '0125').padStart(4, '0')}`;
  const invoiceDate = invoice.invoice_date || invoice.sale_date || invoice.created_at 
    ? new Date(invoice.invoice_date || invoice.sale_date || invoice.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) 
    : new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  
  const dueDate = invoice.due_date 
    ? new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) 
    : invoiceDate;
    
  const sourceRef = invoice.source_ref || `S${String(invoice.id || '00124').padStart(5, '0')}`;

  const customerName = invoice.customer_name || invoice.customer?.name || 'Valued Customer';
  const customerEmail = invoice.customer_email || invoice.customer?.email || '';
  const customerPhone = invoice.customer_phone || invoice.customer?.phone || invoice.customer?.contact || '';
  const customerAddress = invoice.customer_address || invoice.customer?.address || '';

  return (
    <Modal isOpen={true} onClose={onClose} title="" maxWidth="920px">
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print invoice-actions-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{documentType} #{invoiceNumber}</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>A4 Print Preview &bull; Exact 1:1 format</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '8px 18px', borderRadius: 6, border: 'none',
              background: '#0f172a', color: '#ffffff', fontWeight: 600,
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'background-color 0.15s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#1e293b'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#0f172a'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print / Save as PDF
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1',
              background: '#ffffff', color: '#334155', fontWeight: 500,
              fontSize: 13, cursor: 'pointer', transition: 'background-color 0.15s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            Close
          </button>
        </div>
      </div>

      {/* Studio Document Workspace (Emulating authentic physical A4 paper page) */}
      <div
        className="invoice-preview-canvas invoice-print-canvas"
        style={{
          background: '#f1f5f9',
          padding: '24px 16px',
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'center',
          overflowX: 'auto'
        }}
      >
        <div
          id="printable-invoice"
          className="invoice-a4-sheet"
          style={{
            width: '100%',
            maxWidth: '794px',
            minHeight: '1000px',
            background: '#ffffff',
            color: '#0f172a',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            padding: '42px 46px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
            border: '1px solid #cbd5e1',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            lineHeight: 1.5
          }}
        >
          <div>
            {/* Top Header: Brand (Left) & Document Meta (Right) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 20, borderBottom: '2px solid #0f172a', marginBottom: 20 }}>
              {/* Logo / Company Identity */}
              <div style={{ maxWidth: '54%' }}>
                {logoUrl ? (
                  <div style={{ marginBottom: 8 }}>
                    <img src={logoUrl} alt={businessName} style={{ maxHeight: 52, maxWidth: 220, objectFit: 'contain', display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 6, background: '#0f172a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: 14, flexShrink: 0
                    }}>
                      {businessName.slice(0, 2).toUpperCase()}
                    </div>
                    <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      {businessName}
                    </h1>
                  </div>
                )}
                {logoUrl && (
                  <h1 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    {businessName}
                  </h1>
                )}
                <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
                  <div>{businessAddress}</div>
                  <div>Phone: {businessPhone} &bull; Email: {businessEmail}</div>
                  {businessTin && (
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                      TIN / VAT Reg: <span style={{ fontVariantNumeric: 'tabular-nums' }}>{businessTin}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Title & Reference Table */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {documentType}
                </div>
                <table style={{ marginLeft: 'auto', borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '2px 8px', color: '#64748b', fontWeight: 500, textAlign: 'right' }}>Invoice No:</td>
                      <td style={{ padding: '2px 0 2px 8px', fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{invoiceNumber}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 8px', color: '#64748b', fontWeight: 500, textAlign: 'right' }}>Date:</td>
                      <td style={{ padding: '2px 0 2px 8px', fontWeight: 600, color: '#0f172a' }}>{invoiceDate}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 8px', color: '#64748b', fontWeight: 500, textAlign: 'right' }}>Due Date:</td>
                      <td style={{ padding: '2px 0 2px 8px', fontWeight: 600, color: '#0f172a' }}>{dueDate}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 8px', color: '#64748b', fontWeight: 500, textAlign: 'right' }}>Terms:</td>
                      <td style={{ padding: '2px 0 2px 8px', fontWeight: 600, color: '#334155' }}>{paymentTerms}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 8px', color: '#64748b', fontWeight: 500, textAlign: 'right' }}>Status:</td>
                      <td style={{ padding: '2px 0 2px 8px', textAlign: 'right' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', ...statusStyle }}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Client & Transaction Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 18, borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Billed To
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>
                  {customerName}
                </div>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                  {customerAddress && <div>{customerAddress}</div>}
                  {customerPhone && <div>Phone: {customerPhone}</div>}
                  {customerEmail && <div>Email: {customerEmail}</div>}
                  {customerTin && <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>Customer TIN: {customerTin}</div>}
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: 160 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Transaction Details
                </div>
                <div style={{ fontSize: 12, color: '#334155' }}>
                  Source Ref: <strong style={{ color: '#0f172a' }}>{sourceRef}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                  Currency: <strong style={{ color: '#0f172a' }}>UGX</strong>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  Method: <span style={{ fontWeight: 600, color: '#0f172a' }}>{invoice.payment_method || 'Electronic / Cash'}</span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', width: 36 }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', width: 110 }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', width: 125 }}>Unit Price</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', width: 135 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const name = item.product?.name || item.name || item.description || `Item #${idx + 1}`;
                  const qty = parseFloat(item.quantity || 1);
                  const price = parseFloat(item.price || item.unit_price || 0);
                  const amt = parseFloat(item.subtotal || (qty * price));
                  const unitLabel = item.product?.unit || item.unit || 'Units';
                  return (
                    <tr key={idx} className="invoice-table-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 10px', textAlign: 'center', fontSize: 12, color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 10px', fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{name}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: 12, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
                        {qty.toFixed(2)} <span style={{ fontSize: 10, color: '#64748b' }}>{unitLabel}</span>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: 12, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
                        UGX {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                        UGX {amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      No items listed on this invoice
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Bottom Remittance & Summary */}
            <div className="invoice-summary-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 28, marginTop: 8, paddingBottom: 20, borderBottom: '1px solid #e2e8f0' }}>
              {/* Payment Instructions */}
              <div style={{ flex: 1, fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Remittance &amp; Payment Instructions
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 14px' }}>
                  <div><strong>Payment Reference:</strong> <span style={{ color: '#0f172a', fontWeight: 700 }}>{invoiceNumber}</span></div>
                  <div><strong>Bank:</strong> {bankName} &bull; <strong>Acc No:</strong> <span style={{ color: '#0f172a', fontWeight: 700 }}>{accountNumber}</span></div>
                  {accountName && <div><strong>Account Name:</strong> {accountName}</div>}
                  {mobileMoneyNumber && (
                    <div><strong>Mobile Money:</strong> {mobileMoneyNumber} ({mobileMoneyName || businessName})</div>
                  )}
                </div>
                {notes && (
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: '#64748b' }}>{notes}</p>
                )}
              </div>

              {/* Financial Totals */}
              <div style={{ width: 280, flexShrink: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#475569' }}>Subtotal</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                        UGX {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {discount > 0 && (
                      <tr>
                        <td style={{ padding: '4px 0', color: '#dc2626' }}>Discount</td>
                        <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
                          &minus; UGX {discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    {tax > 0 && (
                      <tr>
                        <td style={{ padding: '4px 0', color: '#16a34a' }}>Tax / VAT</td>
                        <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
                          + UGX {tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '1px solid #cbd5e1' }}>
                      <td style={{ padding: '6px 0', fontWeight: 700, color: '#0f172a', fontSize: 13 }}>Total</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                        UGX {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#64748b' }}>Amount Paid</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', color: '#475569', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        UGX {paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr style={{ borderTop: '2px solid #0f172a' }}>
                      <td style={{ padding: '8px 0 2px', fontWeight: 800, color: balance > 0 ? '#991b1b' : '#0f172a', fontSize: 14 }}>
                        Balance Due
                      </td>
                      <td style={{ padding: '8px 0 2px', textAlign: 'right', fontWeight: 800, color: balance > 0 ? '#991b1b' : '#059669', fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
                        UGX {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sign-off Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 20, fontSize: 11, color: '#64748b' }}>
            <div>
              <div style={{ color: '#0f172a', fontWeight: 600, marginBottom: 2 }}>{businessName}</div>
              <div>Computer generated document. Official and valid without physical seal.</div>
            </div>
            <div style={{ textAlign: 'right', minWidth: 180 }}>
              <div style={{ borderBottom: '1px solid #94a3b8', width: 160, marginBottom: 4 }}></div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════
// CREATE CUSTOM INVOICE MODAL (Fixed Layout & Dynamic Remittance)
// ════════════════════════════════════════════════
export function CustomInvoiceCreateModal({ user, customers, onClose, onCreated }) {
  const storedSettings = getStoredInvoiceSettings(user);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerTin, setCustomerTin] = useState('');

  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [sourceRef, setSourceRef] = useState(`S00${Math.floor(100 + Math.random() * 900)}`);
  const [documentType, setDocumentType] = useState('PROFORMA INVOICE');

  // Remittance overrides
  const [bankName, setBankName] = useState(storedSettings.bankName);
  const [accountNumber, setAccountNumber] = useState(storedSettings.accountNumber);
  const [accountName, setAccountName] = useState(storedSettings.accountName);
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState(storedSettings.mobileMoneyNumber);
  const [paymentTerms, setPaymentTerms] = useState(storedSettings.paymentTerms);
  const [businessTin, setBusinessTin] = useState(storedSettings.tin);

  const [items, setItems] = useState([
    { description: '', quantity: '1', price: '' }
  ]);

  const handleAddItem = () => {
    setItems(prev => [...prev, { description: '', quantity: '1', price: '' }]);
  };

  const handleRemoveItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
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
      setCustomerAddress(cust.address || '');
      setCustomerTin(cust.tin || '');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter or select a customer name.');
      return;
    }
    const validItems = items.filter(i => i.description.trim() && parseFloat(i.price) > 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid item with a description and unit price.');
      return;
    }

    const total = calculateTotal();
    const invNumber = `INV/25-26/${String(Math.floor(100 + Math.random() * 9000)).padStart(4, '0')}`;

    const newInvoice = {
      id: Date.now(),
      title: documentType,
      invoice_number: invNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      source_ref: sourceRef,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      customer_address: customerAddress,
      customer_tin: customerTin,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      mobile_money_number: mobileMoneyNumber,
      payment_terms: paymentTerms,
      business_tin: businessTin,
      total_amount: total,
      amount_paid: total,
      payment_status: 'paid',
      items: validItems.map(i => ({
        description: i.description,
        quantity: parseFloat(i.quantity) || 1,
        price: parseFloat(i.price) || 0,
        subtotal: (parseFloat(i.quantity) || 1) * (parseFloat(i.price) || 0)
      }))
    };

    onCreated(newInvoice);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create New Proforma / Tax Invoice" maxWidth="840px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {customers && customers.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>
              Quick Select Customer (Optional)
            </label>
            <select
              onChange={handleSelectCustomer}
              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, background: '#fff', boxSizing: 'border-box' }}
            >
              <option value="">— Select an existing customer —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
              ))}
            </select>
          </div>
        )}

        {/* Customer Information Row */}
        <div className="invoice-form-grid-3">
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Customer Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Asher Electronics Ltd"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Phone Number</label>
            <input
              type="text"
              placeholder="e.g. 0776 000000"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Customer TIN</label>
            <input
              type="text"
              placeholder="e.g. 1004567890"
              value={customerTin}
              onChange={e => setCustomerTin(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Dates & Reference Row */}
        <div className="invoice-form-grid-4">
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Document Type</label>
            <select
              value={documentType}
              onChange={e => setDocumentType(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, background: '#fff', boxSizing: 'border-box' }}
            >
              <option value="PROFORMA INVOICE">Proforma Invoice</option>
              <option value="TAX INVOICE">Tax Invoice</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={e => setInvoiceDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 5 }}>Source / Ref</label>
            <input
              type="text"
              placeholder="e.g. S00124"
              value={sourceRef}
              onChange={e => setSourceRef(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Invoice Line Items (Clean Responsive Flex Table — Zero Overlapping) */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Invoice Line Items
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.15s' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
            >
              + Add Item Line
            </button>
          </div>

          <div className="table-scroll" style={{ width: '100%' }}>
            <div className="invoice-items-flex-table" style={{ minWidth: 540 }}>
              {/* Table Header Row */}
              <div style={{ display: 'flex', gap: 8, padding: '6px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px 6px 0 0', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                <div style={{ width: 24, textAlign: 'center' }}>#</div>
                <div style={{ flex: 3, minWidth: 0 }}>Description *</div>
                <div style={{ width: 85, textAlign: 'center' }}>Qty</div>
                <div style={{ flex: 2, minWidth: 0, textAlign: 'right' }}>Unit Price (UGX) *</div>
                <div style={{ flex: 1.6, minWidth: 0, textAlign: 'right' }}>Subtotal</div>
                <div style={{ width: 32 }}></div>
              </div>

              {/* Table Body Rows */}
              <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: '8px', display: 'flex', flexDirection: 'column', gap: 6, background: '#ffffff' }}>
                {items.map((item, idx) => {
                  const q = parseFloat(item.quantity) || 0;
                  const p = parseFloat(item.price) || 0;
                  const sub = q * p;
                  return (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ width: 24, textAlign: 'center', fontSize: 12, color: '#64748b' }}>{idx + 1}</div>
                      <input
                        type="text"
                        placeholder="e.g. Apple iPhone 15 Pro 256GB"
                        value={item.description}
                        onChange={e => handleItemChange(idx, 'description', e.target.value)}
                        style={{ flex: 3, minWidth: 0, padding: '7px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        style={{ width: 85, padding: '7px 6px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, textAlign: 'center', boxSizing: 'border-box' }}
                        required
                      />
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="Price"
                        value={item.price}
                        onChange={e => handleItemChange(idx, 'price', e.target.value)}
                        style={{ flex: 2, minWidth: 0, padding: '7px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, textAlign: 'right', boxSizing: 'border-box' }}
                        required
                      />
                      <div style={{ flex: 1.6, minWidth: 0, textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        UGX {sub.toLocaleString()}
                      </div>
                      <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            style={{ width: 28, height: 28, borderRadius: 5, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Remittance & Bank Info For This Invoice */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            Payment Terms &amp; Remittance Details (Quoted on Invoice)
          </div>
          <div className="invoice-form-grid-3">
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontWeight: 700, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Account Name</label>
              <input
                type="text"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Mobile Money (Optional)</label>
              <input
                type="text"
                value={mobileMoneyNumber}
                onChange={e => setMobileMoneyNumber(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Business TIN</label>
              <input
                type="text"
                value={businessTin}
                onChange={e => setBusinessTin(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Payment Terms</label>
              <input
                type="text"
                placeholder="e.g. Due upon receipt"
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* Total Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 18px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Total Invoice Amount:</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
            UGX {calculateTotal().toLocaleString()}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: '1.5px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: 'none', background: '#0f172a', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'background-color 0.15s' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#1e293b'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#0f172a'}
          >
            Generate Invoice
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ════════════════════════════════════════════════
// INVOICES TAB COMPONENT
// ════════════════════════════════════════════════
export function InvoicesTab({ sales, customers, user, token, toast }) {
  const [invoicesList, setInvoicesList] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [search, setSearch] = useState('');

  // Invoice Branding & Remittance settings
  const [settings, setSettings] = useState(() => getStoredInvoiceSettings(user));

  useEffect(() => {
    if (sales && sales.length > 0) {
      const generated = sales.map(s => ({
        id: s.id,
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
        source_ref: `S${String(s.id).padStart(5, '0')}`,
        bank_name: settings.bankName,
        account_number: settings.accountNumber,
        account_name: settings.accountName,
        mobile_money_number: settings.mobileMoneyNumber,
        payment_terms: settings.paymentTerms,
        business_tin: settings.tin
      }));
      setInvoicesList(generated);
    }
  }, [sales, settings]);

  const filteredInvoices = invoicesList.filter(inv => {
    return !search || 
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) || 
      inv.customer_name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '4px 0 32px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Invoices &amp; Proforma Generator</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Generate, customize, and print official business invoices</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              padding: '9px 16px', borderRadius: 6, border: '1.5px solid #cbd5e1',
              background: '#ffffff', color: '#0f172a', fontWeight: 600,
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)', transition: 'background-color 0.15s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Invoice Settings &amp; Branding
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '9px 18px', borderRadius: 6, border: 'none',
              background: '#0f172a', color: '#ffffff', fontWeight: 600,
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'background-color 0.15s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#1e293b'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#0f172a'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Custom Invoice
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Total Invoices',
            value: invoicesList.length,
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            )
          },
          {
            label: 'Total Invoiced Value',
            value: `UGX ${invoicesList.reduce((s, i) => s + i.total_amount, 0).toLocaleString()}`,
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            )
          },
          {
            label: 'Collected Amount',
            value: `UGX ${invoicesList.reduce((s, i) => s + i.amount_paid, 0).toLocaleString()}`,
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )
          },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</p>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{k.value}</h3>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {k.icon}
              </div>
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
          style={{ width: '100%', maxWidth: 360, padding: '9px 14px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: 13 }}
        />
      </div>

      {/* Invoices List Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Invoice #', 'Customer', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Amount' ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? filteredInvoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{inv.invoice_number}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{inv.customer_name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}>{inv.invoice_date}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>UGX {inv.total_amount.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', letterSpacing: '0.04em' }}>
                      PAID
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      style={{
                        padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1',
                        background: '#ffffff', color: '#0f172a', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      View / Print
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                    No invoices found matching search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Invoice Modal (1:1 A4 preview & print) */}
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
          onClose={() => setShowCreateModal(false)}
          onCreated={(newInv) => {
            setInvoicesList(prev => [newInv, ...prev]);
            setShowCreateModal(false);
            setSelectedInvoice(newInv);
          }}
        />
      )}

      {/* Invoice Settings & Branding Modal */}
      {showSettingsModal && (
        <InvoiceSettingsModal
          user={user}
          onClose={() => setShowSettingsModal(false)}
          onSaved={(newSettings) => {
            setSettings(newSettings);
            if (toast) toast('Invoice settings & branding updated successfully!');
          }}
        />
      )}
    </div>
  );
}
