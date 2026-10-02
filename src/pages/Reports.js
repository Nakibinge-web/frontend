import React, { useState } from 'react';
import Button from '../components/ui/Button';
import styles, { supS } from '../styles/dashboardStyles';


function ReportsTab({ data, loading, token }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const [activeReport, setActiveReport] = useState('overview');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeklyDate, setWeeklyDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().toISOString().slice(0, 7));
  const [yearlyYear, setYearlyYear] = useState(new Date().getFullYear().toString());
  const [dailyPurchasesDate, setDailyPurchasesDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  const totalRevenue = data.stats.totalSales - data.stats.totalPurchases;

  // ── Export Functions ──────────────────────────────────────────────────────
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportOverviewToCSV = () => {
    const overviewData = [
      { metric: 'Total Revenue', value: `UGX ${data.stats.totalSales.toLocaleString()}` },
      { metric: 'Total Costs', value: `UGX ${data.stats.totalPurchases.toLocaleString()}` },
      { metric: 'Net Profit', value: `UGX ${totalRevenue.toLocaleString()}` },
      { metric: 'Low Stock Items', value: data.stats.lowStockCount },
      { metric: 'Total Products', value: data.stats.totalProducts },
      { metric: 'Total Sales Count', value: data.sales.length },
      { metric: 'Total Purchases Count', value: data.purchases.length },
      { metric: 'Total Customers', value: data.customers.length },
      { metric: 'Total Suppliers', value: data.suppliers.length },
    ];
    exportToCSV(overviewData, 'overview_report');
  };

  const exportSalesData = () => {
    const salesData = data.sales.map(sale => ({
      id: sale.id,
      date: sale.sale_date || sale.created_at,
      customer: sale.customer?.name || 'Walk-in',
      payment_method: sale.payment_method,
      total_amount: sale.total_amount,
      discount: sale.discount_amount || 0,
      tax: sale.tax_amount || 0,
      items_count: (sale.sale_items || []).length
    }));
    exportToCSV(salesData, 'sales_report');
  };

  const exportPurchasesData = () => {
    const purchasesData = data.purchases.map(purchase => ({
      id: purchase.id,
      date: purchase.purchase_date || purchase.created_at,
      supplier: purchase.supplier?.name || 'Unknown',
      total_amount: purchase.total_amount,
      items_count: (purchase.purchase_items || []).length
    }));
    exportToCSV(purchasesData, 'purchases_report');
  };

  const exportProductsData = () => {
    const productsData = data.products.map(product => ({
      sku: product.sku || '',
      name: product.name,
      category: product.category?.name || '',
      stock: product.stock,
      unit: product.unit || '',
      cost_price: product.cost_price || 0,
      selling_price: product.price,
      reorder_level: product.reorder_level || 0,
      status: product.stock <= (product.reorder_level || 10) ? 'Low Stock' : 'In Stock'
    }));
    exportToCSV(productsData, 'products_inventory');
  };

  // ── Derived analytics from existing data ──────────────────────────────────

  // Sales by payment method
  const paymentBreakdown = data.sales.reduce((acc, s) => {
    const m = s.payment_method || 'unknown';
    acc[m] = (acc[m] || 0) + parseFloat(s.total_amount || 0);
    return acc;
  }, {});
  const paymentTotal = Object.values(paymentBreakdown).reduce((a, b) => a + b, 0);

  // Top 5 products by revenue (from sale items)
  const productRevenue = {};
  data.sales.forEach(s => {
    (s.sale_items || s.saleItems || []).forEach(item => {
      const name = item.product?.name || `#${item.product_id}`;
      productRevenue[name] = (productRevenue[name] || 0) + parseFloat(item.subtotal || 0);
    });
  });
  const topProducts = Object.entries(productRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxProductRev = topProducts[0]?.[1] || 1;

  // Top 5 suppliers by purchase spend
  const supplierSpend = {};
  data.purchases.forEach(p => {
    const name = p.supplier?.name || `#${p.supplier_id}`;
    supplierSpend[name] = (supplierSpend[name] || 0) + parseFloat(p.total_amount || 0);
  });
  const topSuppliers = Object.entries(supplierSpend).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSupplierSpend = topSuppliers[0]?.[1] || 1;

  // ── Fetch reports ──────────────────────────────────────────────────────────
  const fetchReport = async () => {
    setReportLoading(true);
    setReportError(null);
    setReportData(null);
    try {
      let url;
      if (activeReport === 'daily') url = `${API_URL}/sales/daily-report?date=${dailyDate}`;
      else if (activeReport === 'weekly') url = `${API_URL}/sales/weekly-report?date=${weeklyDate}`;
      else if (activeReport === 'monthly-sales') url = `${API_URL}/sales/monthly-report?month=${monthlyMonth}`;
      else if (activeReport === 'yearly') url = `${API_URL}/sales/yearly-report?year=${yearlyYear}`;
      else if (activeReport === 'daily-purchases') url = `${API_URL}/purchases/daily-report?date=${dailyPurchasesDate}`;
      else url = `${API_URL}/purchases/monthly-report?month=${monthlyMonth}`;

      const res = await fetch(url, { headers });
      const json = await res.json();
      if (!res.ok) { setReportError(json?.message || 'Failed to load report.'); return; }
      setReportData(json.data);
    } catch { setReportError('Could not reach the server.'); }
    finally { setReportLoading(false); }
  };

  const paymentColors = { cash: '#16a34a', card: '#2563eb', mobile_money: '#7c3aed', bank_transfer: '#0891b2' };
  const getPayColor = (m) => paymentColors[m] || '#64748b';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'daily', label: 'Daily Sales' },
    { id: 'weekly', label: 'Weekly Sales' },
    { id: 'monthly-sales', label: 'Monthly Sales' },
    { id: 'yearly', label: 'Yearly Report' },
    { id: 'daily-purchases', label: 'Daily Purchases' },
  ];

  return (
    <div style={styles.pageContainer}>
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Business Intelligence</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Reports & Analytics</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Analyse your business performance and trends</p>
        </div>
        
        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={exportOverviewToCSV}
            style={{
              padding: '10px 16px',
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
            onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
          >
            📊 Export Overview
          </button>
          <button
            onClick={exportSalesData}
            style={{
              padding: '10px 16px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
          >
            💰 Export Sales
          </button>
          <button
            onClick={exportPurchasesData}
            style={{
              padding: '10px 16px',
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
            onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
          >
            🛒 Export Purchases
          </button>
          <button
            onClick={exportProductsData}
            style={{
              padding: '10px 16px',
              background: '#d97706',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#c2410c'}
            onMouseLeave={e => e.currentTarget.style.background = '#d97706'}
          >
            📦 Export Inventory
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #f1f5f9', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveReport(t.id); setReportData(null); setReportError(null); }} style={{
            padding: '9px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            color: activeReport === t.id ? '#4f46e5' : '#64748b',
            borderBottom: activeReport === t.id ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: -2, transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeReport === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* KPI row */}
          <div className="reports-kpi-grid">
            {[
              { label: 'Total Revenue', value: `UGX ${data.stats.totalSales.toLocaleString()}`, icon: '💰', color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Total Costs', value: `UGX ${data.stats.totalPurchases.toLocaleString()}`, icon: '🛒', color: '#d97706', bg: '#fffbeb' },
              { label: 'Net Profit', value: `UGX ${totalRevenue.toLocaleString()}`, icon: '📈', color: totalRevenue >= 0 ? '#16a34a' : '#dc2626', bg: totalRevenue >= 0 ? '#f0fdf4' : '#fef2f2' },
              { label: 'Low Stock', value: data.stats.lowStockCount, icon: '⚠️', color: data.stats.lowStockCount > 0 ? '#dc2626' : '#16a34a', bg: data.stats.lowStockCount > 0 ? '#fef2f2' : '#f0fdf4' },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</p>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{k.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="reports-2col">

            {/* Payment method breakdown */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
              <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales by Payment Method</h3>
              {Object.keys(paymentBreakdown).length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 14 }}>No sales data yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Object.entries(paymentBreakdown).map(([method, amount]) => (
                    <div key={method}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{method.replace('_', ' ')}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>UGX {amount.toLocaleString()} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({Math.round(amount / paymentTotal * 100)}%)</span></span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(amount / paymentTotal) * 100}%`, background: getPayColor(method), borderRadius: 4, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory summary */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
              <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Inventory Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Total Products', value: data.stats.totalProducts, icon: '📦' },
                  { label: 'Categories', value: data.categories.length, icon: '🏷️' },
                  { label: 'Suppliers', value: data.suppliers.length, icon: '🏭' },
                  { label: 'Customers', value: data.customers.length, icon: '👥' },
                  { label: 'Total Sales', value: data.sales.length, icon: '💰' },
                  { label: 'Total Purchases', value: data.purchases.length, icon: '🛒' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                    <span style={{ fontSize: 14, color: '#475569' }}>{r.icon} {r.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="reports-2col">

            {/* Top products */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
              <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Top Products by Revenue</h3>
              {topProducts.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 14 }}>No sales data yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {topProducts.map(([name, rev], i) => (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>#{i + 1} {name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>UGX {rev.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(rev / maxProductRev) * 100}%`, background: '#4f46e5', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top suppliers */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
              <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Top Suppliers by Spend</h3>
              {topSuppliers.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 14 }}>No purchase data yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {topSuppliers.map(([name, spend], i) => (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>#{i + 1} {name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>UGX {spend.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(spend / maxSupplierSpend) * 100}%`, background: '#0891b2', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DAILY SALES REPORT ── */}
      {activeReport === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Select Date</label>
              <input style={{ ...supS.input, width: 200 }} type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)} />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { label: 'Date', value: reportData.date },
                  { label: 'Transactions', value: reportData.total_transactions },
                  { label: 'Total Sales', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}` },
                  { label: 'Total Cost', value: `UGX ${parseFloat(reportData.total_cost || 0).toLocaleString()}` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                  </div>
                ))}
              </div>
              {/* Profit highlight */}
              <div style={{ background: parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Net Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                    UGX {parseFloat(reportData.total_profit || 0).toLocaleString()}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                    {parseFloat(reportData.total_sales) > 0
                      ? `${((parseFloat(reportData.total_profit) / parseFloat(reportData.total_sales)) * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales Transactions</h3>
                </div>
                {reportData.sales?.length === 0 ? (
                  <p style={{ padding: 20, color: '#94a3b8', fontSize: 14 }}>No sales on this date.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Time', 'Cashier', 'Payment', 'Items', 'Amount', 'Cost', 'Profit'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.sales?.map(s => (
                        <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{new Date(s.created_at).toLocaleTimeString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>{s.user?.name || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: getPayColor(s.payment_method) + '18', color: getPayColor(s.payment_method), border: `1px solid ${getPayColor(s.payment_method)}40`, textTransform: 'capitalize' }}>
                              {s.payment_method?.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{(s.sale_items || s.saleItems || []).length}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>UGX {parseFloat(s.total_amount || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748b' }}>UGX {parseFloat(s.cost || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: parseFloat(s.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>UGX {parseFloat(s.profit || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WEEKLY SALES REPORT ── */}
      {activeReport === 'weekly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Any date within the week</label>
              <input style={{ ...supS.input, width: 200 }} type="date" value={weeklyDate} onChange={e => setWeeklyDate(e.target.value)} />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* KPI cards */}
              <div className="reports-kpi-grid">
                {[
                  { label: 'Week Start', value: reportData.week_start },
                  { label: 'Week End', value: reportData.week_end },
                  { label: 'Transactions', value: reportData.total_transactions },
                  { label: 'Total Sales', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Profit highlight */}
              <div style={{ background: parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Net Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                    UGX {parseFloat(reportData.total_profit || 0).toLocaleString()}
                  </p>
                </div>
                <div style={{ marginLeft: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Total Cost</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>UGX {parseFloat(reportData.total_cost || 0).toLocaleString()}</p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                    {parseFloat(reportData.total_sales) > 0
                      ? `${((parseFloat(reportData.total_profit) / parseFloat(reportData.total_sales)) * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Daily breakdown bar chart */}
              {reportData.by_day && reportData.by_day.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Daily Breakdown</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {(() => {
                      const maxTotal = Math.max(...reportData.by_day.map(d => parseFloat(d.total || 0)), 1);
                      return reportData.by_day.map(d => (
                        <div key={d.date}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{d.day} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({d.date})</span></span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                              UGX {parseFloat(d.total || 0).toLocaleString()} &nbsp;
                              <span style={{ color: '#94a3b8', fontWeight: 400 }}>{d.transactions} txn{d.transactions !== 1 ? 's' : ''}</span>
                              &nbsp;·&nbsp;
                              <span style={{ color: parseFloat(d.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                                profit: UGX {parseFloat(d.profit || 0).toLocaleString()}
                              </span>
                            </span>
                          </div>
                          <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${(parseFloat(d.total || 0) / maxTotal) * 100}%`,
                              background: d.transactions > 0 ? '#4f46e5' : '#e2e8f0',
                              borderRadius: 5,
                              transition: 'width 0.4s ease',
                            }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Transactions table */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales Transactions</h3>
                </div>
                {reportData.sales?.length === 0 ? (
                  <p style={{ padding: 20, color: '#94a3b8', fontSize: 14 }}>No sales this week.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Date', 'Cashier', 'Customer', 'Payment', 'Items', 'Amount', 'Cost', 'Profit'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.sales?.map(s => (
                        <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{new Date(s.sale_date).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>{s.user?.name || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{s.customer?.name || 'Walk-in'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: getPayColor(s.payment_method) + '18', color: getPayColor(s.payment_method), border: `1px solid ${getPayColor(s.payment_method)}40`, textTransform: 'capitalize' }}>
                              {s.payment_method?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{(s.sale_items || s.saleItems || []).length}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>UGX {parseFloat(s.total_amount || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748b' }}>UGX {parseFloat(s.cost || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: parseFloat(s.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>UGX {parseFloat(s.profit || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MONTHLY SALES REPORT ── */}
      {activeReport === 'monthly-sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Select Month</label>
              <input style={{ ...supS.input, width: 200 }} type="month" value={monthlyMonth} onChange={e => setMonthlyMonth(e.target.value)} />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Month', value: reportData.month },
                  { label: 'Transactions', value: reportData.total_transactions },
                  { label: 'Total Sales', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Profit highlight */}
              <div style={{ background: parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Net Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                    UGX {parseFloat(reportData.total_profit || 0).toLocaleString()}
                  </p>
                </div>
                <div style={{ marginLeft: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Total Cost</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>UGX {parseFloat(reportData.total_cost || 0).toLocaleString()}</p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                    {parseFloat(reportData.total_sales) > 0
                      ? `${((parseFloat(reportData.total_profit) / parseFloat(reportData.total_sales)) * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Payment method breakdown */}
                {reportData.by_payment && reportData.by_payment.length > 0 && (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
                    <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales by Payment Method</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {(() => {
                        const methodTotal = reportData.by_payment.reduce((sum, p) => sum + parseFloat(p.total || 0), 0) || 1;
                        return reportData.by_payment.map(p => (
                          <div key={p.method}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{(p.method || '').replace(/_/g, ' ')}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                UGX {parseFloat(p.total || 0).toLocaleString()} &nbsp;
                                <span style={{ color: '#94a3b8', fontWeight: 400 }}>({Math.round((parseFloat(p.total || 0) / methodTotal) * 100)}%)</span>
                                &nbsp;·&nbsp;
                                <span style={{ color: parseFloat(p.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                                  profit: UGX {parseFloat(p.profit || 0).toLocaleString()}
                                </span>
                              </span>
                            </div>
                            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(parseFloat(p.total || 0) / methodTotal) * 100}%`, background: getPayColor(p.method), borderRadius: 4, transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Daily breakdown within the month */}
                {reportData.by_day && reportData.by_day.length > 0 && (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22, maxHeight: 340, overflowY: 'auto' }}>
                    <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Daily Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(() => {
                        const maxDayTotal = Math.max(...reportData.by_day.map(d => parseFloat(d.total || 0)), 1);
                        return reportData.by_day.map(d => (
                          <div key={d.date}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                                UGX {parseFloat(d.total || 0).toLocaleString()} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({d.transactions})</span>
                                &nbsp;·&nbsp;
                                <span style={{ color: parseFloat(d.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                                  UGX {parseFloat(d.profit || 0).toLocaleString()}
                                </span>
                              </span>
                            </div>
                            <div style={{ height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(parseFloat(d.total || 0) / maxDayTotal) * 100}%`, background: '#16a34a', borderRadius: 4 }} />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Transactions table */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales Transactions</h3>
                </div>
                {reportData.sales?.length === 0 ? (
                  <p style={{ padding: 20, color: '#94a3b8', fontSize: 14 }}>No sales this month.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Date', 'Cashier', 'Customer', 'Payment', 'Items', 'Amount', 'Cost', 'Profit'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.sales?.map(s => (
                        <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{new Date(s.sale_date).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>{s.user?.name || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{s.customer?.name || 'Walk-in'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: getPayColor(s.payment_method) + '18', color: getPayColor(s.payment_method), border: `1px solid ${getPayColor(s.payment_method)}40`, textTransform: 'capitalize' }}>
                              {s.payment_method?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{(s.sale_items || s.saleItems || []).length}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>UGX {parseFloat(s.total_amount || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748b' }}>UGX {parseFloat(s.cost || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: parseFloat(s.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>UGX {parseFloat(s.profit || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── YEARLY REPORT ── */}
      {activeReport === 'yearly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Select Year</label>
              <select
                value={yearlyYear}
                onChange={e => { setYearlyYear(e.target.value); setReportData(null); }}
                style={{ ...supS.input, width: 140 }}
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── KPI row ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { label: 'Year', value: reportData.year, icon: '📅', color: '#4f46e5', bg: '#eef2ff' },
                  { label: 'Transactions', value: reportData.total_transactions, icon: '🧾', color: '#0891b2', bg: '#ecfeff' },
                  { label: 'Total Revenue', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}`, icon: '💰', color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'Total Cost', value: `UGX ${parseFloat(reportData.total_cost || 0).toLocaleString()}`, icon: '🛒', color: '#d97706', bg: '#fffbeb' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{k.icon}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Profit highlight ── */}
              <div style={{ background: parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '20px 26px', display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ fontSize: 36 }}>{parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Annual Net Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, color: parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626', letterSpacing: '-0.5px' }}>
                    UGX {parseFloat(reportData.total_profit || 0).toLocaleString()}
                  </p>
                </div>
                <div style={{ marginLeft: 20 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Profit Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: '#374151' }}>
                    {parseFloat(reportData.total_sales) > 0 ? `${((parseFloat(reportData.total_profit) / parseFloat(reportData.total_sales)) * 100).toFixed(1)}%` : '—'}
                  </p>
                </div>
                {reportData.best_month && (
                  <div style={{ marginLeft: 20 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Best Month</p>
                    <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#16a34a' }}>
                      {reportData.best_month.month_name} — UGX {parseFloat(reportData.best_month.total || 0).toLocaleString()}
                    </p>
                  </div>
                )}
                {reportData.worst_month && (
                  <div style={{ marginLeft: 20 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Lowest Month</p>
                    <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#64748b' }}>
                      {reportData.worst_month.month_name} — UGX {parseFloat(reportData.worst_month.total || 0).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Monthly bar chart ── */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Monthly Revenue & Profit</h3>
                {(() => {
                  const maxTotal = Math.max(...(reportData.by_month || []).map(m => parseFloat(m.total || 0)), 1);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(reportData.by_month || []).map(m => {
                        const revPct = Math.round((parseFloat(m.total || 0) / maxTotal) * 100);
                        const profitPct = Math.round((parseFloat(m.profit || 0) / maxTotal) * 100);
                        const isProfit = parseFloat(m.profit || 0) >= 0;
                        return (
                          <div key={m.month}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', minWidth: 36 }}>{m.month_name}</span>
                              <span style={{ fontSize: 12, color: '#64748b' }}>
                                UGX {parseFloat(m.total || 0).toLocaleString()}
                                &nbsp;·&nbsp;
                                <span style={{ color: isProfit ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                  {isProfit ? '+' : ''}UGX {parseFloat(m.profit || 0).toLocaleString()}
                                </span>
                                &nbsp;·&nbsp;
                                <span style={{ color: '#94a3b8' }}>{m.transactions} txns</span>
                              </span>
                            </div>
                            {/* Revenue bar */}
                            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 3 }}>
                              <div style={{ height: '100%', width: `${revPct}%`, background: m.transactions > 0 ? '#4f46e5' : '#e2e8f0', borderRadius: 4, transition: 'width 0.4s ease' }} />
                            </div>
                            {/* Profit bar */}
                            <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.abs(profitPct)}%`, background: isProfit ? '#16a34a' : '#dc2626', borderRadius: 3, transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}><span style={{ width: 12, height: 8, background: '#4f46e5', borderRadius: 2, display: 'inline-block' }}></span>Revenue</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}><span style={{ width: 12, height: 5, background: '#16a34a', borderRadius: 2, display: 'inline-block' }}></span>Profit</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ── Quarter breakdown ── */}
              {reportData.by_quarter && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Quarterly Breakdown</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {reportData.by_quarter.map(q => {
                      const maxQ = Math.max(...reportData.by_quarter.map(x => parseFloat(x.total || 0)), 1);
                      const pct = Math.round((parseFloat(q.total || 0) / maxQ) * 100);
                      return (
                        <div key={q.quarter} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 14px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{q.quarter}</div>
                          <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: '#4f46e5', borderRadius: 3, transition: 'width 0.4s ease' }} />
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>UGX {parseFloat(q.total || 0).toLocaleString()}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{q.transactions} transactions</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: parseFloat(q.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                            Profit: UGX {parseFloat(q.profit || 0).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Payment method breakdown ── */}
              {reportData.by_payment && reportData.by_payment.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales by Payment Method</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(() => {
                      const total = reportData.by_payment.reduce((s, p) => s + parseFloat(p.total || 0), 0) || 1;
                      return reportData.by_payment.map(p => (
                        <div key={p.method}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{(p.method || '').replace(/_/g, ' ')}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                              UGX {parseFloat(p.total || 0).toLocaleString()}
                              &nbsp;<span style={{ color: '#94a3b8', fontWeight: 400 }}>({Math.round((parseFloat(p.total || 0) / total) * 100)}%)</span>
                              &nbsp;·&nbsp;
                              <span style={{ color: parseFloat(p.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>profit: UGX {parseFloat(p.profit || 0).toLocaleString()}</span>
                            </span>
                          </div>
                          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(parseFloat(p.total || 0) / total) * 100}%`, background: getPayColor(p.method), borderRadius: 4, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* ── DAILY PURCHASES REPORT ── */}
      {activeReport === 'daily-purchases' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Date picker + button */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Select Date</label>
              <input
                type="date"
                value={dailyPurchasesDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => { setDailyPurchasesDate(e.target.value); setReportData(null); }}
                style={{ ...supS.input, width: 180 }}
              />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
              ⚠️ {reportError}
            </div>
          )}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { label: 'Date', value: new Date(reportData.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), icon: '📅', color: '#4f46e5', bg: '#eef2ff' },
                  { label: 'Transactions', value: reportData.total_transactions, icon: '🧾', color: '#0891b2', bg: '#ecfeff' },
                  { label: 'Total Spent', value: `UGX ${parseFloat(reportData.total_amount || 0).toLocaleString()}`, icon: '💸', color: '#dc2626', bg: '#fef2f2' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{k.icon}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
                      <p style={{ margin: '4px 0 0', fontSize: k.label === 'Date' ? 13 : 20, fontWeight: 700, color: k.color }}>{k.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* No purchases message */}
              {reportData.total_transactions === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: 32, margin: '0 0 8px' }}>🛒</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#334155' }}>No purchases on this day</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8' }}>Try selecting a different date.</p>
                </div>
              )}

              {reportData.total_transactions > 0 && (
                <>
                  {/* Supplier breakdown */}
                  {reportData.by_supplier && reportData.by_supplier.length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Spend by Supplier</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(() => {
                          const maxSpend = Math.max(...reportData.by_supplier.map(s => parseFloat(s.total_amount || 0)), 1);
                          return reportData.by_supplier.map(s => (
                            <div key={s.supplier}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{s.supplier}</span>
                                <span style={{ fontSize: 13, color: '#64748b' }}>
                                  {s.transactions} order{s.transactions !== 1 ? 's' : ''}
                                  &nbsp;·&nbsp;
                                  <strong style={{ color: '#0f172a' }}>UGX {parseFloat(s.total_amount || 0).toLocaleString()}</strong>
                                </span>
                              </div>
                              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${(parseFloat(s.total_amount || 0) / maxSpend) * 100}%`, background: '#4f46e5', borderRadius: 4, transition: 'width 0.4s ease' }} />
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Detailed purchases table */}
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Purchase Details</h3>
                      <span style={{ fontSize: 12, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '3px 10px' }}>
                        {reportData.total_transactions} order{reportData.total_transactions !== 1 ? 's' : ''} · {reportData.total_items} item{reportData.total_items !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {(reportData.purchases || []).map((purchase, pi) => (
                      <div key={purchase.id} style={{ borderBottom: pi < reportData.purchases.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        {/* Purchase header */}
                        <div style={{ padding: '14px 24px', background: '#fafbff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ width: 28, height: 28, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#4f46e5', flexShrink: 0 }}>
                              #{pi + 1}
                            </span>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                {purchase.supplier?.name || 'Unknown Supplier'}
                              </span>
                              <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>
                                Order #{purchase.id}
                              </span>
                            </div>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5' }}>
                            UGX {parseFloat(purchase.total_amount || 0).toLocaleString()}
                          </span>
                        </div>

                        {/* Line items */}
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              {['Product', 'Qty', 'Unit Cost', 'Subtotal'].map(h => (
                                <th key={h} style={{ padding: '8px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(purchase.purchase_items || []).map((item, idx) => (
                              <tr key={idx} style={{ borderTop: '1px solid #f8fafc' }}>
                                <td style={{ padding: '10px 24px', fontSize: 13, color: '#0f172a', fontWeight: 500 }}>
                                  {item.product?.name || `Product #${item.product_id}`}
                                  {item.product?.sku && <span style={{ marginLeft: 6, fontSize: 11, color: '#94a3b8' }}>({item.product.sku})</span>}
                                </td>
                                <td style={{ padding: '10px 24px', fontSize: 13, color: '#475569' }}>{item.quantity}</td>
                                <td style={{ padding: '10px 24px', fontSize: 13, color: '#475569' }}>UGX {parseFloat(item.cost_price || 0).toLocaleString()}</td>
                                <td style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                                  UGX {(item.quantity * parseFloat(item.cost_price || 0)).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}

                    {/* Grand total footer */}
                    <div style={{ padding: '16px 24px', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>TOTAL SPENT ON {new Date(reportData.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>UGX {parseFloat(reportData.total_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AI Assistant Tab ──────────────────────────────────────────────────────────

export default ReportsTab;
export { ReportsTab };
