import React from 'react';
import DashboardCard from '../components/ui/DashboardCard';
import DataTable from '../components/ui/DataTable';

function OverviewTab({ data, loading, onNavigate, onAddProduct, canSell = true, canAddProduct = true, canAddSupplier = true, canRecordPurchase = true, user = {} }) {
  const today = new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const recentSalesColumns = [
    { key: 'sale_date', title: 'Date', type: 'date' },
    { key: 'total_amount', title: 'Amount', type: 'currency' },
    {
      key: 'payment_method', title: 'Payment', render: v => (
        <span style={{
          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: '#f1f5f9', color: '#475569', textTransform: 'capitalize'
        }}>
          {v?.replace(/_/g, ' ') || '—'}
        </span>
      )
    },
    { key: 'user', title: 'Cashier', render: v => v?.name || '—' }
  ];

  const kpi = [
    { label: 'Total Products', value: data.stats.totalProducts, sub: 'Items in inventory', color: 'primary' },
    { label: 'Total Sales', value: `UGX ${data.stats.totalSales.toLocaleString()}`, sub: 'Revenue generated', color: 'success' },
    { label: 'Total Purchases', value: `UGX ${data.stats.totalPurchases.toLocaleString()}`, sub: 'Stock investment', color: 'warning' },
    { label: 'Low Stock Alerts', value: data.stats.lowStockCount, sub: 'Items need reordering', color: 'danger', trend: data.stats.lowStockCount > 0 ? 'up' : 'neutral', tv: data.stats.lowStockCount > 0 ? 'Needs attention' : 'All good' },
  ];

  const quickActions = [
    ...(canSell ? [{ label: 'New Sale', sub: 'Process a sale transaction', action: () => onNavigate('pos'), accent: '#4f46e5' }] : []),
    ...(canAddProduct ? [{ label: 'Add Product', sub: 'Add to your inventory', action: onAddProduct, accent: '#16a34a' }] : []),
    ...(canAddSupplier ? [{ label: 'Add Supplier', sub: 'Register a new vendor', action: () => onNavigate('suppliers'), accent: '#0891b2' }] : []),
    ...(canRecordPurchase ? [{ label: 'Record Purchase', sub: 'Log a supplier order', action: () => onNavigate('purchases'), accent: '#d97706' }] : []),
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '4px 0 32px' }}>

      {/* ── Hero header ───────────────────────────────────── */}
      <div className="section-hero" style={{
        background: '#ffffff',
        borderRadius: 14, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04), 0 4px 12px -2px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img 
            src={user.tenant?.logo_url || '/zziwa logo.png'} 
            alt={`${user.tenant?.name || 'Business'} Logo`}
            style={{ 
              width: 72, 
              height: 72, 
              objectFit: 'contain', 
              background: '#ffffff', 
              padding: '6px', 
              borderRadius: 14, 
              flexShrink: 0,
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }} 
          />
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{today}</p>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {greeting} 👋
            </h1>
            <p style={{ margin: 0, fontSize: 13.5, color: '#64748b', maxWidth: 460, lineHeight: 1.5 }}>
              Here's a live snapshot of your business. Use the quick actions below to get things done fast.
            </p>
          </div>
        </div>
        <div style={{
          flexShrink: 0,
          background: '#ffffff',
          padding: '14px 20px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          minWidth: 200,
          textAlign: 'right'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Today's Sales
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>UGX</span>
            <span style={{
              fontSize: 24,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.025em',
              fontFamily: "'DM Mono', monospace",
              fontFeatureSettings: "'tnum'"
            }}>
              {data.sales
                .filter(s => new Date(s.sale_date).toDateString() === new Date().toDateString())
                .reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0)
                .toLocaleString()}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#94a3b8' }}>Real-time register sync</p>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div className="kpi-grid-4">
        {kpi.map(k => (
          <DashboardCard key={k.label} title={k.label} value={k.value} subtitle={k.sub}
            color={k.color} trend={k.trend} trendValue={k.tv} loading={loading} />
        ))}
      </div>

      {/* ── Quick Actions ──────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Quick Actions
        </h2>
        {quickActions.length > 0 ? (
          <div className="quick-actions-grid" style={{ gridTemplateColumns: `repeat(${quickActions.length}, 1fr)` }}>
            {quickActions.map(q => (
              <button key={q.label} onClick={q.action} style={{
                padding: '18px 20px', borderRadius: 12,
                border: `1.5px solid #e2e8f0`,
                background: '#ffffff', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s', outline: 'none', position: 'relative', overflow: 'hidden',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = q.accent;
                  e.currentTarget.style.background = q.accent + '08';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${q.accent}22`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                {/* Accent dot */}
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: q.accent, marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{q.label}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{q.sub}</div>
              </button>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No quick actions available for your role.</p>
        )}
      </div>

      {/* ── Bottom row: Recent Sales + Low Stock ──────────── */}
      <div className="overview-bottom-grid" style={{ gridTemplateColumns: data.lowStock.length > 0 ? '1fr 340px' : '1fr' }}>

        {/* Recent Sales */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recent Sales</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Last {Math.min(data.sales.length, 5)} transactions</p>
            </div>
            <button onClick={() => onNavigate('sales')} style={{
              fontSize: 12, color: '#6366f1', background: '#ede9fe', border: 'none',
              cursor: 'pointer', fontWeight: 600, padding: '5px 12px', borderRadius: 20,
            }}>
              View all
            </button>
          </div>
          <DataTable
            columns={recentSalesColumns}
            data={data.sales.slice(0, 5)}
            loading={loading}
            emptyStateProps={{
              title: 'No sales recorded yet',
              description: 'Head to the POS to process your first transaction.',
              actionLabel: 'Open POS',
              onAction: () => onNavigate('pos')
            }}
          />
        </div>

        {/* Low Stock */}
        {data.lowStock.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Low Stock</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Needs reordering</p>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                {data.lowStock.length} items
              </span>
            </div>
            <div>
              {data.lowStock.slice(0, 6).map((product, i) => (
                <div key={product.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 22px',
                  borderBottom: i < Math.min(data.lowStock.length, 6) - 1 ? '1px solid #f8fafc' : 'none',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Min: {product.reorder_level} units</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>{product.stock}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>in stock</div>
                  </div>
                </div>
              ))}
              {data.lowStock.length > 6 && (
                <div style={{ padding: '12px 22px' }}>
                  <button onClick={() => onNavigate('products')} style={{
                    fontSize: 12, color: '#6366f1', background: 'none', border: 'none',
                    cursor: 'pointer', fontWeight: 600, padding: 0,
                  }}>
                    +{data.lowStock.length - 6} more items →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OverviewTab;
export { OverviewTab };
