import React from 'react';

// Helper function to format sale date and time
// Handles timezone properly - assumes server sends timestamp in Africa/Kampala timezone
const formatSaleDateTime = (saleDate, createdAt) => {
  const dateString = saleDate || createdAt || '';
  if (!dateString) return { date: 'N/A', time: '' };
  
  // Parse the date string as-is (server already in correct timezone)
  const d = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(d.getTime())) return { date: 'N/A', time: '' };
  
  const date = d.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric'
  });
  
  const time = d.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false  // Use 24-hour format
  });
  
  return { date, time };
};

// Unified Receipt Component - Used by both POS and Sales sections
export default function SaleReceipt({ sale, user, elementId = 'receipt-content' }) {
  const items = sale.sale_items || sale.saleItems || sale.items || [];
  const subtotal = items.reduce((s, i) => s + parseFloat(i.subtotal || 0), 0);
  const discount = parseFloat(sale.discount_amount) || 0;
  const tax = parseFloat(sale.tax_amount) || 0;
  const total = parseFloat(sale.total_amount) || 0;
  const { date, time } = formatSaleDateTime(sale.sale_date, sale.created_at);
  
  const tenant = user?.tenant || {};
  const tenantName = tenant.name || 'InventoryPro';
  const receiptPhone = tenant.contacts && tenant.contacts.length > 0 
    ? tenant.contacts.map(c => c.number).join(' / ') 
    : (tenant.phone || '0705364749 / 0788111823');
  const receiptEmail = tenant.email || 'zziwa.biz@gmail.com';
  const receiptAddress = tenant.address || 'Mukwano arcade shop AG 84';
  
  // Build receipt reference
  const saleDate = sale.sale_date || sale.created_at || '';
  const datePart = saleDate.replace(/-/g, '').slice(0, 8);
  const saleId = String(sale.id).padStart(4, '0');
  const receiptRef = `SAL-${datePart}-${saleId}`;

  return (
    <div id={elementId} style={{ fontFamily: 'inherit', position: 'relative' }}>
      {/* Decorative circle — top right */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 200, height: 200, borderRadius: '50%',
        background: 'rgba(190,18,60,0.06)', pointerEvents: 'none',
      }} />

      {/* ── Business Header ── */}
      <div style={{ textAlign: 'center', paddingBottom: 20, borderBottom: '2px solid #be123c', position: 'relative' }}>
        {/* Logo */}
        <img
          src="/zziwa logo.png"
          alt={tenantName}
          style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 8 }}
        />
        <div style={{ fontWeight: 900, fontSize: 24, color: '#be123c', letterSpacing: '-0.5px' }}>{tenantName}</div>
        <div style={{ fontSize: 13, color: '#475569', marginTop: 6, fontWeight: 500 }}>
          {[receiptPhone && `Tel: ${receiptPhone}`, receiptEmail && `Email: ${receiptEmail}`].filter(Boolean).join(' | ')}
        </div>
        {receiptAddress && <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{receiptAddress}</div>}
        {/* Receipt Badge */}
        <div style={{
          marginTop: 10,
          display: 'inline-block',
          padding: '6px 16px',
          background: '#fff1f2',
          border: '1.5px solid #fda4af',
          borderRadius: 20,
          color: '#881337',
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          Receipt
        </div>
      </div>

      {/* ── Receipt Details + Customer ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '18px 0', borderBottom: '1.5px solid #cbd5e1', position: 'relative' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#881337', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Receipt Details</div>
          <div style={{ color: '#be123c', fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{receiptRef}</div>
          <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <span>📅</span> {date}
          </div>
          {time && (
            <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <span>🕐</span> {time}
            </div>
          )}
          <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>👤</span> Served by: {sale.user?.name || user?.name || 'Staff'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#881337', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Customer</div>
          <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>
            {sale.customer?.name || 'Walk-in Customer'}
          </div>
          {sale.customer?.phone && (
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>📞 {sale.customer.phone}</div>
          )}
          {sale.customer?.email && (
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>✉️ {sale.customer.email}</div>
          )}
        </div>
      </div>

      {/* ── Items Table ── */}
      <div style={{ paddingTop: 18, position: 'relative' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#881337', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Items Purchased</div>
        <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#881337' }}>
                {['#', 'Product', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px', fontSize: 11, fontWeight: 800, color: '#ffffff',
                    letterSpacing: '0.07em', textTransform: 'uppercase',
                    textAlign: i === 0 ? 'center' : i >= 2 ? 'right' : 'left',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>No items recorded.</td></tr>
              ) : items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: idx === items.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: 14, color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{item.product?.name || `Product #${item.product_id}`}</div>
                    {item.product?.sku && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>SKU: {item.product.sku}</div>}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: 14, color: '#475569' }}>
                    {parseFloat(item.quantity).toFixed(2)} {item.product?.unit || 'pcs'}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: 14, color: '#475569' }}>
                    UGX {parseFloat(item.price).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    UGX {parseFloat(item.subtotal).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Totals ── */}
      <div style={{ marginTop: 16, borderTop: '1.5px solid #cbd5e1', paddingTop: 16, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: 520, width: '100%', border: '1.5px solid #cbd5e1', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span style={{ color: '#64748b' }}>Subtotal:</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>UGX {subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>Discount:</span>
              <span style={{ fontWeight: 600, color: '#dc2626' }}>− UGX {discount.toLocaleString()}</span>
            </div>
          )}
          {tax > 0 && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>Tax:</span>
              <span style={{ fontWeight: 600, color: '#16a34a' }}>+ UGX {tax.toLocaleString()}</span>
            </div>
          )}
          <div style={{
            padding: '12px 16px',
            background: '#fff1f2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#881337' }}>TOTAL:</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#be123c' }}>UGX {total.toLocaleString()}</span>
          </div>
        </div>
        
        <div style={{ maxWidth: 520, width: '100%', marginTop: 12, padding: '10px 16px', border: '1.5px solid #cbd5e1', borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ color: '#64748b', fontSize: 14 }}>Payment Method:</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{sale.payment_method?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: 14 }}>Payment Status:</span>
            <span style={{
              background: '#dcfce7',
              color: '#16a34a',
              fontWeight: 800,
              fontSize: 11,
              padding: '4px 12px',
              borderRadius: 20,
              letterSpacing: '0.03em',
              textTransform: 'uppercase'
            }}>
              Paid
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {sale.notes && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, fontSize: 13, color: '#475569', borderLeft: '4px solid #be123c' }}>
          📝 {sale.notes}
        </div>
      )}

      {/* ── Thank you footer ── */}
      <div style={{ marginTop: 24, paddingTop: 18, borderTop: '2px solid #be123c', textAlign: 'center', position: 'relative' }}>
        <div style={{ fontWeight: 800, fontSize: 17, color: '#881337', marginBottom: 6 }}>Thank you for your business!</div>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>We appreciate your patronage. Visit us again!</div>
      </div>
    </div>
  );
}
