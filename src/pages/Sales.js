import React, { useState, useEffect } from 'react';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SaleReceipt from '../components/SaleReceipt';
import { PrintableInvoiceModal } from './Invoices';
import styles from '../styles/dashboardStyles';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';


function formatSaleDateTime(saleDate, createdAt) {
  const dateSource = saleDate || createdAt;
  if (!dateSource) return { date: '-', time: '' };
  const d = new Date(dateSource);
  if (isNaN(d.getTime())) return { date: '-', time: '' };
  const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const timeSource = createdAt || saleDate;
  const time = new Date(timeSource).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

function SalesTab({ sales, loading, onNewSale, token, user, canCreate = true, canEdit = true, canDelete = false, onSaleDeleted }) {
  const [viewingSale, setViewingSale] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [deletingSale, setDeletingSale] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [localSales, setLocalSales] = useState(sales);

  // Keep localSales in sync when parent refreshes
  useEffect(() => setLocalSales(sales), [sales]);

  // Date filter
  const [dateFilter, setDateFilter] = useState('all');

  // Custom day lookup
  const [customDate, setCustomDate] = useState('');
  const [customDaySales, setCustomDaySales] = useState(null);

  // Custom week lookup
  const [customWeekDate, setCustomWeekDate] = useState('');
  const [customWeekSales, setCustomWeekSales] = useState(null);
  const [customWeekRange, setCustomWeekRange] = useState(null);

  const filteredSales = localSales.filter(sale => {
    if (dateFilter === 'all') return true;

    // Parse the date string as local date (YYYY-MM-DD) to avoid UTC offset shifting
    const raw = (sale.sale_date || sale.created_at || '').slice(0, 10); // "YYYY-MM-DD"
    const [y, m, d] = raw.split('-').map(Number);
    const saleDate = new Date(y, m - 1, d); // local midnight

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilter === 'today') {
      return saleDate.getTime() === today.getTime();
    }
    if (dateFilter === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return saleDate >= startOfWeek;
    }
    if (dateFilter === 'month') {
      return saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
    }
    return true;
  });

  const openEdit = (sale) => {
    setEditingSale(sale);
    const items = sale.sale_items || sale.saleItems || [];
    setEditForm({
      payment_method: sale.payment_method || 'cash',
      discount_amount: sale.discount_amount || '',
      tax_amount: sale.tax_amount || '',
      notes: sale.notes || '',
      customer_type: sale.customer ? 'existing' : 'walk_in',
      customer_id: sale.customer?.id || '',
      items: items.map(i => ({
        product_id: i.product_id,
        name: i.product?.name || `Product #${i.product_id}`,
        quantity: i.quantity,
        price: i.price,
      })),
    });
    setEditError(null);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    setEditError(null);
    try {
      const body = {
        payment_method: editForm.payment_method,
        discount_amount: editForm.discount_amount !== '' ? parseFloat(editForm.discount_amount) : null,
        tax_amount: editForm.tax_amount !== '' ? parseFloat(editForm.tax_amount) : null,
        notes: editForm.notes || null,
        customer_type: editForm.customer_type,
        ...(editForm.customer_type === 'existing' && editForm.customer_id
          ? { customer_id: parseInt(editForm.customer_id) }
          : {}),
        items: editForm.items.map(i => ({
          product_id: i.product_id,
          quantity: parseInt(i.quantity),
          price: parseFloat(i.price),
        })),
      };
      const res = await fetch(`${API}/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data?.message || 'Failed to update sale.'); return; }
      setLocalSales(prev => prev.map(s => s.id === data.data.id ? data.data : s));
      setEditingSale(null);
    } catch {
      setEditError('Network error. Check your connection.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${API}/sales/${deletingSale.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data?.message || 'Failed to delete sale.'); return; }
      const deletedSale = deletingSale;
      setLocalSales(prev => prev.filter(s => s.id !== deletedSale.id));
      if (onSaleDeleted) onSaleDeleted(deletedSale);
      setDeletingSale(null);
    } catch {
      setDeleteError('Network error. Check your connection.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'sale_date',
      title: 'Date',
      render: (value, row) => {
        const { date, time } = formatSaleDateTime(value, row.created_at);
        return (
          <div>
            <div style={{ color: '#1e293b', fontWeight: 500 }}>{date}</div>
            {time && <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{time}</div>}
          </div>
        );
      }
    },
    { key: 'total_amount', title: 'Amount', type: 'currency' },
    {
      key: 'payment_method',
      title: 'Payment Method',
      render: (value) => (
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
          textTransform: 'capitalize'
        }}>
          {value?.replace(/_/g, ' ') || '—'}
        </span>
      )
    },
    {
      key: 'customer',
      title: 'Customer',
      render: (value) => value?.name
        ? <Badge variant="primary" size="sm">{value.name}</Badge>
        : <span style={{ color: '#94a3b8' }}>Walk-in Customer</span>
    },
    {
      key: 'sale_items',
      title: 'Items',
      render: (value, row) => {
        const items = value || row.saleItems || [];
        return `${items.length} item${items.length === 1 ? '' : 's'}`;
      }
    },
    {
      key: 'user',
      title: 'Staff',
      render: (value) => value?.name
        ? value.name
        : <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>Deleted user</span>
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            title="View sale details"
            onClick={() => setViewingSale(row)}
            style={{
              padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: '#f8fafc', color: '#0369a1', cursor: 'pointer',
              fontSize: 15, fontWeight: 600, lineHeight: 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
          >
            👁
          </button>
          <button
            title="Generate & View Invoice"
            onClick={() => setViewingInvoice(row)}
            style={{
              padding: '5px 10px', borderRadius: 8, border: '1.5px solid #fbcfe8',
              background: '#fff1f2', color: '#881337', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, lineHeight: 1,
              display: 'flex', alignItems: 'center', gap: 4,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#ffe4e6'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff1f2'}
          >
            📄 Invoice
          </button>
          {canEdit && (
            <button
              title="Edit sale"
              onClick={() => openEdit(row)}
              style={{
                padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                background: '#f8fafc', color: '#b45309', cursor: 'pointer',
                fontSize: 15, fontWeight: 600, lineHeight: 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef3c7'}
              onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
            >
              ✏️
            </button>
          )}
          {canDelete && (
            <button
              title="Delete sale"
              onClick={() => { setDeleteError(null); setDeletingSale(row); }}
              style={{
                padding: '5px 10px', borderRadius: 8, border: '1.5px solid #fecaca',
                background: '#fff5f5', color: '#dc2626', cursor: 'pointer',
                fontSize: 15, fontWeight: 600, lineHeight: 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}
            >
              🗑️
            </button>
          )}
        </div>
      )
    },
  ];

  // ── helpers ──────────────────────────────────────────────
  
  // ── Summary stats ────────────────────────────────────────
  const totalTx = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);

  return (
    <div style={styles.pageContainer}>

      {/* ── Page header ── */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Revenue</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Sales</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Track all your sales transactions and revenue</p>
        </div>
        {canCreate && (
          <button onClick={onNewSale}
            style={{ padding: '10px 22px', borderRadius: 9, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 7 }}
            onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
            onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Sale
          </button>
        )}
      </div>

      {/* ── KPI cards ── */}
      {!loading && sales.length > 0 && (
        <div className="kpi-grid-3">
          {[
            { label: 'Total Transactions', value: totalTx, icon: '🧾', color: '#4f46e5', bg: '#eef2ff' },
            { label: 'Total Revenue', value: `UGX ${totalRevenue.toLocaleString()}`, icon: '💰', color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Average Sale', value: `UGX ${totalTx ? Math.round(totalRevenue / totalTx).toLocaleString() : 0}`, icon: '📊', color: '#0891b2', bg: '#ecfeff' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.contentCard}>

        {/* ── Filter bar ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: '4px', background: '#f1f5f9', borderRadius: 12, width: 'fit-content' }}>
          {[
            { key: 'all', label: 'All Sales', icon: '⊞' },
            { key: 'today', label: 'Today', icon: '◎' },
            { key: 'week', label: 'This Week', icon: '▦' },
            { key: 'month', label: 'This Month', icon: '▤' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setDateFilter(f.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 9, border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: dateFilter === f.key ? '#fff' : 'transparent',
                color: dateFilter === f.key ? '#4f46e5' : '#64748b',
                boxShadow: dateFilter === f.key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 11, opacity: 0.7 }}>{f.icon}</span> {f.label}
            </button>
          ))}
        </div>

        {/* ── Weekly breakdown (only when This Week is active) ── */}
        {dateFilter === 'week' && (() => {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

          // Build 7 day slots Mon–Sun (reorder so Mon is first)
          const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
          const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d;
          });
          // Reorder: Mon(1)…Sat(6), Sun(0)
          const ordered = [...days.slice(1), days[0]];

          // Build totals per day
          const weekTotal = filteredSales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0);
          const weekCount = filteredSales.length;
          const startLabel = startOfWeek.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
          const endLabel = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');

          const dayTotals = ordered.map(day => {
            const daySales = filteredSales.filter(sale => {
              const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
              const [y, m, d] = raw.split('-').map(Number);
              const sd = new Date(y, m - 1, d);
              return sd.getTime() === day.getTime();
            });
            return {
              day,
              count: daySales.length,
              total: daySales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0),
              isToday: day.getTime() === today.getTime(),
            };
          });

          return (
            <div style={{ marginBottom: 20 }}>
              {/* Summary banner */}
              <div style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                borderRadius: 14, padding: '20px 24px', marginBottom: 14,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 2px 12px rgba(59,130,246,0.25)',
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    This week's sales
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                    UGX {weekTotal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                    {weekCount} transaction{weekCount !== 1 ? 's' : ''} &nbsp;·&nbsp; {startLabel} – {endLabel}
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 18px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Daily avg</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>UGX {weekCount ? Math.round(weekTotal / 7).toLocaleString() : 0}</div>
                </div>
              </div>

              {/* Day cards */}
              <div className="week-day-grid">
                {dayTotals.map(({ day, count, total, isToday }) => {
                  const maxTotal = Math.max(...dayTotals.map(d => d.total), 1);
                  const barPct = Math.round((total / maxTotal) * 100);
                  return (
                    <div key={day.getTime()} style={{
                      background: isToday ? '#eff6ff' : '#fff',
                      border: `1.5px solid ${isToday ? '#3b82f6' : '#e2e8f0'}`,
                      borderRadius: 12, padding: '12px 10px',
                      display: 'flex', flexDirection: 'column', gap: 6,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? '#3b82f6' : '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                        {dayNames[day.getDay()]}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                        {day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </div>
                      {/* Mini bar */}
                      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barPct}%`, background: count > 0 ? '#3b82f6' : '#e2e8f0', borderRadius: 2, transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: count > 0 ? '#1d4ed8' : '#d1d5db', lineHeight: 1 }}>
                        {count}
                      </div>
                      <div style={{ fontSize: 10, color: count > 0 ? '#64748b' : '#d1d5db', fontWeight: 500 }}>
                        {count > 0 ? `UGX ${total.toLocaleString()}` : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Monthly breakdown (only when This Month is active) ── */}
        {dateFilter === 'month' && (() => {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const monthName = today.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

          // Month totals
          const monthTotal = filteredSales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0);
          const monthCount = filteredSales.length;

          // Build calendar weeks for this month (week starts Monday)
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

          // Find Monday on or before the 1st
          const startMon = new Date(firstDay);
          const dow = firstDay.getDay(); // 0=Sun
          startMon.setDate(firstDay.getDate() - (dow === 0 ? 6 : dow - 1));

          // Collect weeks until we pass the last day of the month
          const weeks = [];
          let cursor = new Date(startMon);
          while (cursor <= lastDay) {
            const weekStart = new Date(cursor);
            const weekEnd = new Date(cursor);
            weekEnd.setDate(cursor.getDate() + 6);

            const daySales = filteredSales.filter(sale => {
              const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
              const [y, m, d] = raw.split('-').map(Number);
              const sd = new Date(y, m - 1, d);
              return sd >= weekStart && sd <= weekEnd;
            });

            weeks.push({
              label: `Week ${weeks.length + 1}`,
              start: weekStart,
              end: weekEnd,
              count: daySales.length,
              total: daySales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0),
              isCurrent: today >= weekStart && today <= weekEnd,
            });
            cursor.setDate(cursor.getDate() + 7);
          }

          return (
            <div style={{ marginBottom: 20 }}>
              {/* Summary banner */}
              <div style={{
                background: 'linear-gradient(135deg, #6d28d9 0%, #9333ea 100%)',
                borderRadius: 14, padding: '20px 24px', marginBottom: 14,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 2px 12px rgba(109,40,217,0.25)',
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    {monthName} sales
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                    UGX {monthTotal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                    {monthCount} transaction{monthCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Weekly avg</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>UGX {weeks.length ? Math.round(monthTotal / weeks.length).toLocaleString() : 0}</div>
                </div>
              </div>

              {/* Week cards */}
              <div className="month-week-grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
                {weeks.map(({ label, start, end, count, total, isCurrent }) => {
                  const maxWeekTotal = Math.max(...weeks.map(w => w.total), 1);
                  const barPct = Math.round((total / maxWeekTotal) * 100);
                  return (
                    <div key={label} style={{
                      background: isCurrent ? '#faf5ff' : '#fff',
                      border: `1.5px solid ${isCurrent ? '#9333ea' : '#e2e8f0'}`,
                      borderRadius: 12, padding: '16px 14px',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? '#9333ea' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>
                        {start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – {end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </div>
                      {/* Mini bar */}
                      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{ height: '100%', width: `${barPct}%`, background: count > 0 ? '#9333ea' : '#e2e8f0', borderRadius: 3, transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: count > 0 ? '#6d28d9' : '#d1d5db', marginBottom: 2, lineHeight: 1 }}>
                        {count}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>sale{count !== 1 ? 's' : ''}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: count > 0 ? '#16a34a' : '#d1d5db' }}>
                        {count > 0 ? `UGX ${total.toLocaleString()}` : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <DataTable
          columns={columns}
          data={filteredSales}
          loading={loading}
          emptyStateProps={{
            title: 'No sales yet',
            description: 'Start processing sales to see transaction history here.',
            actionLabel: 'Process First Sale',
            onAction: onNewSale
          }}
        />
      </div>

      {/* ── Sales Query Filters Grid (Day & Week side-by-side) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginTop: 24, alignItems: 'stretch' }}>
        
        {/* Card 1: Sales by Specific Day */}
        <div style={{ 
          background: '#fff', 
          border: customDaySales !== null ? '1.5px solid #6366f1' : '1px solid #e2e8f0', 
          borderRadius: 14, 
          padding: 20,
          boxShadow: customDaySales !== null ? '0 4px 14px -2px rgba(99, 102, 241, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16,
          transition: 'all 0.2s ease'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  🔍
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Sales by Specific Day</h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Select any single date to view all sales</p>
                </div>
              </div>
              {customDaySales !== null && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#e0e7ff', color: '#4338ca', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f46e5' }}></span>
                  Active
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Select Date
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="date"
                  value={customDate}
                  onChange={e => { setCustomDate(e.target.value); setCustomDaySales(null); }}
                  style={{ 
                    flex: 1, 
                    padding: '9px 12px', 
                    border: '1.5px solid #e2e8f0', 
                    borderRadius: 9, 
                    fontSize: 13, 
                    fontFamily: 'inherit', 
                    outline: 'none', 
                    background: '#fff', 
                    color: '#0f172a', 
                    cursor: 'pointer' 
                  }}
                />
                <button
                  onClick={() => {
                    if (!customDate) return;
                    const [y, m, d] = customDate.split('-').map(Number);
                    const target = new Date(y, m - 1, d);
                    const results = localSales.filter(sale => {
                      const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
                      const [sy, sm, sd] = raw.split('-').map(Number);
                      return new Date(sy, sm - 1, sd).getTime() === target.getTime();
                    });
                    setCustomWeekSales(null);
                    setCustomWeekRange(null);
                    setCustomDaySales(results);
                  }}
                  style={{ 
                    padding: '9px 18px', 
                    borderRadius: 9, 
                    border: 'none', 
                    background: customDate ? '#4f46e5' : '#f1f5f9', 
                    color: customDate ? '#fff' : '#94a3b8', 
                    fontSize: 13, 
                    fontWeight: 700, 
                    cursor: customDate ? 'pointer' : 'not-allowed', 
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                    boxShadow: customDate ? '0 1px 2px rgba(79, 70, 229, 0.2)' : 'none'
                  }}
                >
                  View Sales
                </button>
                {customDaySales !== null && (
                  <button
                    onClick={() => { setCustomDaySales(null); setCustomDate(''); }}
                    style={{ padding: '9px 13px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick presets for Day */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>Quick Select:</span>
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                setCustomDate(today);
                const [y, m, d] = today.split('-').map(Number);
                const target = new Date(y, m - 1, d);
                const results = localSales.filter(sale => {
                  const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
                  const [sy, sm, sd] = raw.split('-').map(Number);
                  return new Date(sy, sm - 1, sd).getTime() === target.getTime();
                });
                setCustomWeekSales(null);
                setCustomWeekRange(null);
                setCustomDaySales(results);
              }}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const dObj = new Date();
                dObj.setDate(dObj.getDate() - 1);
                const yest = dObj.toISOString().slice(0, 10);
                setCustomDate(yest);
                const [y, m, d] = yest.split('-').map(Number);
                const target = new Date(y, m - 1, d);
                const results = localSales.filter(sale => {
                  const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
                  const [sy, sm, sd] = raw.split('-').map(Number);
                  return new Date(sy, sm - 1, sd).getTime() === target.getTime();
                });
                setCustomWeekSales(null);
                setCustomWeekRange(null);
                setCustomDaySales(results);
              }}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Card 2: Sales by Specific Week */}
        <div style={{ 
          background: '#fff', 
          border: customWeekSales !== null ? '1.5px solid #3b82f6' : '1px solid #e2e8f0', 
          borderRadius: 14, 
          padding: 20,
          boxShadow: customWeekSales !== null ? '0 4px 14px -2px rgba(59, 130, 246, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16,
          transition: 'all 0.2s ease'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  📅
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Sales by Specific Week</h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Pick any date — shows full week (Mon – Sun)</p>
                </div>
              </div>
              {customWeekSales !== null && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#dbeafe', color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }}></span>
                  Active
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Any Date In The Week
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="date"
                  value={customWeekDate}
                  onChange={e => { setCustomWeekDate(e.target.value); setCustomWeekSales(null); setCustomWeekRange(null); }}
                  style={{ 
                    flex: 1, 
                    padding: '9px 12px', 
                    border: '1.5px solid #e2e8f0', 
                    borderRadius: 9, 
                    fontSize: 13, 
                    fontFamily: 'inherit', 
                    outline: 'none', 
                    background: '#fff', 
                    color: '#0f172a', 
                    cursor: 'pointer' 
                  }}
                />
                <button
                  onClick={() => {
                    if (!customWeekDate) return;
                    const [y, m, d] = customWeekDate.split('-').map(Number);
                    const picked = new Date(y, m - 1, d);
                    const dow = picked.getDay();
                    const monday = new Date(picked);
                    monday.setDate(picked.getDate() - (dow === 0 ? 6 : dow - 1));
                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    const results = localSales.filter(sale => {
                      const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
                      const [sy, sm, sd] = raw.split('-').map(Number);
                      const sd2 = new Date(sy, sm - 1, sd);
                      return sd2 >= monday && sd2 <= sunday;
                    });
                    setCustomDaySales(null);
                    setCustomWeekSales(results);
                    setCustomWeekRange({ monday, sunday });
                  }}
                  style={{ 
                    padding: '9px 18px', 
                    borderRadius: 9, 
                    border: 'none', 
                    background: customWeekDate ? '#4f46e5' : '#f1f5f9', 
                    color: customWeekDate ? '#fff' : '#94a3b8', 
                    fontSize: 13, 
                    fontWeight: 700, 
                    cursor: customWeekDate ? 'pointer' : 'not-allowed', 
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                    boxShadow: customWeekDate ? '0 1px 2px rgba(79, 70, 229, 0.2)' : 'none'
                  }}
                >
                  View Week
                </button>
                {customWeekSales !== null && (
                  <button
                    onClick={() => { setCustomWeekSales(null); setCustomWeekDate(''); setCustomWeekRange(null); }}
                    style={{ padding: '9px 13px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick presets for Week */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>Quick Select:</span>
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                setCustomWeekDate(today);
                const [y, m, d] = today.split('-').map(Number);
                const picked = new Date(y, m - 1, d);
                const dow = picked.getDay();
                const monday = new Date(picked);
                monday.setDate(picked.getDate() - (dow === 0 ? 6 : dow - 1));
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                const results = localSales.filter(sale => {
                  const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
                  const [sy, sm, sd] = raw.split('-').map(Number);
                  const sd2 = new Date(sy, sm - 1, sd);
                  return sd2 >= monday && sd2 <= sunday;
                });
                setCustomDaySales(null);
                setCustomWeekSales(results);
                setCustomWeekRange({ monday, sunday });
              }}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => {
                const dObj = new Date();
                dObj.setDate(dObj.getDate() - 7);
                const lastWeekDate = dObj.toISOString().slice(0, 10);
                setCustomWeekDate(lastWeekDate);
                const [y, m, d] = lastWeekDate.split('-').map(Number);
                const picked = new Date(y, m - 1, d);
                const dow = picked.getDay();
                const monday = new Date(picked);
                monday.setDate(picked.getDate() - (dow === 0 ? 6 : dow - 1));
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                const results = localSales.filter(sale => {
                  const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
                  const [sy, sm, sd] = raw.split('-').map(Number);
                  const sd2 = new Date(sy, sm - 1, sd);
                  return sd2 >= monday && sd2 <= sunday;
                });
                setCustomDaySales(null);
                setCustomWeekSales(results);
                setCustomWeekRange({ monday, sunday });
              }}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              Last Week
            </button>
          </div>
        </div>

      </div>

      {/* ── Day Sales Results View ── */}
      {customDaySales !== null && (
        <div style={{ ...styles.contentCard, marginTop: 20, border: '1.5px solid #6366f1', borderRadius: 14 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🔍</div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Sales on {new Date(...customDate.split('-').map((v, i) => i === 1 ? v - 1 : +v)).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </h4>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Filtered single day results</p>
              </div>
            </div>
            <button
              onClick={() => { setCustomDaySales(null); setCustomDate(''); }}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              ✕ Close Results
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '16px 22px', background: '#4f46e5', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Date</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', maxWidth: 200 }}>
                {new Date(...customDate.split('-').map((v, i) => i === 1 ? v - 1 : +v))
                  .toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div style={{ padding: '16px 22px', borderRight: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Transactions</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#4f46e5', fontFamily: "'DM Mono', monospace, sans-serif" }}>{customDaySales.length}</div>
            </div>
            <div style={{ padding: '16px 22px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Total Revenue</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', fontFamily: "'DM Mono', monospace, sans-serif" }}>
                UGX {customDaySales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
          {customDaySales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>🗓️</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>No sales recorded on this day</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Try selecting a different date</div>
            </div>
          ) : (
            <DataTable columns={columns} data={customDaySales} loading={false} emptyStateProps={{ title: 'No sales', description: '' }} />
          )}
        </div>
      )}

      {/* ── Week Sales Results View ── */}
      {customWeekSales !== null && customWeekRange !== null && (() => {
        const { monday, sunday } = customWeekRange;
        const fmt = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const weekTotal = customWeekSales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0);
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayBreakdown = Array.from({ length: 7 }, (_, i) => {
          const day = new Date(monday);
          day.setDate(monday.getDate() + i);
          const daySales = customWeekSales.filter(sale => {
            const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
            const [sy, sm, sd] = raw.split('-').map(Number);
            return new Date(sy, sm - 1, sd).getTime() === day.getTime();
          });
          return { day, name: dayNames[i], count: daySales.length, total: daySales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0) };
        });
        const maxDayTotal = Math.max(...dayBreakdown.map(d => d.total), 1);

        return (
          <div style={{ ...styles.contentCard, marginTop: 20, border: '1.5px solid #3b82f6', borderRadius: 14 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>📅</div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Sales for Week: {fmt(monday)} – {fmt(sunday)}
                  </h4>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Filtered 7-day weekly summary & breakdown</p>
                </div>
              </div>
              <button
                onClick={() => { setCustomWeekSales(null); setCustomWeekDate(''); setCustomWeekRange(null); }}
                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                ✕ Close Results
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Week</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{fmt(monday)}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>to {fmt(sunday)}</div>
              </div>
              <div style={{ padding: '16px 22px', borderRight: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Transactions</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8', fontFamily: "'DM Mono', monospace, sans-serif" }}>{customWeekSales.length}</div>
              </div>
              <div style={{ padding: '16px 22px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Total Revenue</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', fontFamily: "'DM Mono', monospace, sans-serif" }}>UGX {weekTotal.toLocaleString()}</div>
              </div>
            </div>

            <div className="week-day-grid" style={{ marginBottom: 20 }}>
              {dayBreakdown.map(({ day, name, count, total }) => {
                const barPct = Math.round((total / maxDayTotal) * 100);
                return (
                  <div key={name} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                    <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barPct}%`, background: count > 0 ? '#3b82f6' : '#e2e8f0', borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: count > 0 ? '#1d4ed8' : '#d1d5db', lineHeight: 1, fontFamily: "'DM Mono', monospace, sans-serif" }}>{count}</div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: count > 0 ? '#64748b' : '#d1d5db', fontFamily: "'DM Mono', monospace, sans-serif" }}>{count > 0 ? `UGX ${total.toLocaleString()}` : '—'}</div>
                  </div>
                );
              })}
            </div>

            {customWeekSales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 38, marginBottom: 10 }}>📅</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>No sales recorded in this week</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Try picking a date from a different week</div>
              </div>
            ) : (
              <DataTable columns={columns} data={customWeekSales} loading={false} emptyStateProps={{ title: 'No sales', description: '' }} />
            )}
          </div>
        );
      })()}

      {/* ── View Modal (Receipt) ── */}
      <Modal
        isOpen={!!viewingSale}
        onClose={() => setViewingSale(null)}
        title=""
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setViewingSale(null)}>Close</Button>
            <Button
              variant="success"
              onClick={() => {
                const src = document.getElementById('receipt-content');
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
                    // Don't auto-close to allow user to save as PDF
                    // win.close();
                  }, 500);
                });
              }}
            >
              🖨️ Print / Save PDF
            </Button>
          </div>
        }
      >
        <SaleReceipt sale={viewingSale} user={user} elementId="receipt-content" />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        isOpen={!!editingSale}
        onClose={() => setEditingSale(null)}
        title={`Edit Sale #${editingSale?.id}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingSale(null)}>Cancel</Button>
            <Button variant="success" loading={editSaving} onClick={handleEditSave}>Save Changes</Button>
          </>
        }
      >
        {editingSale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {editError && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                ⚠️ {editError}
              </div>
            )}

            {/* ── Items ── */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Items</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {editForm.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 32px', gap: 6, alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Qty</label>
                      <input
                        type="number" min="1"
                        style={{ width: '100%', padding: '6px 8px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                        value={item.quantity}
                        onChange={e => setEditForm(p => ({
                          ...p,
                          items: p.items.map((it, i) => i === idx ? { ...it, quantity: e.target.value } : it),
                        }))}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Price (UGX)</label>
                      <input
                        type="number" min="0"
                        style={{ width: '100%', padding: '6px 8px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                        value={item.price}
                        onChange={e => setEditForm(p => ({
                          ...p,
                          items: p.items.map((it, i) => i === idx ? { ...it, price: e.target.value } : it),
                        }))}
                      />
                    </div>
                    <button
                      title="Remove item"
                      onClick={() => setEditForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, padding: 4, lineHeight: 1 }}
                    >×</button>
                  </div>
                ))}
                {editForm.items?.length === 0 && (
                  <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>No items. Add at least one item before saving.</div>
                )}
              </div>
            </div>

            {/* ── Customer ── */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Customer</label>
              <select
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
                value={editForm.customer_type}
                onChange={e => setEditForm(p => ({ ...p, customer_type: e.target.value, customer_id: '' }))}
              >
                <option value="walk_in">Walk-in Customer</option>
                <option value="existing">Existing Customer</option>
              </select>
              {editForm.customer_type === 'existing' && (
                <input
                  type="number"
                  placeholder="Customer ID"
                  style={{ width: '100%', marginTop: 6, padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  value={editForm.customer_id}
                  onChange={e => setEditForm(p => ({ ...p, customer_id: e.target.value }))}
                />
              )}
            </div>

            {/* ── Payment & Financials ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Payment Method</label>
                <select
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
                  value={editForm.payment_method}
                  onChange={e => setEditForm(p => ({ ...p, payment_method: e.target.value }))}
                >
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Discount (UGX)</label>
                <input
                  type="number" min="0"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  value={editForm.discount_amount}
                  onChange={e => setEditForm(p => ({ ...p, discount_amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Tax (UGX)</label>
                <input
                  type="number" min="0"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  value={editForm.tax_amount}
                  onChange={e => setEditForm(p => ({ ...p, tax_amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Notes (Optional)</label>
              <textarea
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 60, boxSizing: 'border-box' }}
                value={editForm.notes}
                onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Add any notes…"
              />
            </div>

            {/* Live total preview */}
            {editForm.items?.length > 0 && (() => {
              const subtotal = editForm.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.price) || 0), 0);
              const discount = parseFloat(editForm.discount_amount) || 0;
              const tax = parseFloat(editForm.tax_amount) || 0;
              const total = Math.max(0, subtotal - discount + tax);
              return (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Subtotal</span><span>UGX {subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}><span>Discount</span><span>− UGX {discount.toLocaleString()}</span></div>}
                  {tax > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}><span>Tax</span><span>+ UGX {tax.toLocaleString()}</span></div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, marginTop: 6, borderTop: '1px solid #bbf7d0', paddingTop: 6, color: '#15803d' }}>
                    <span>Total</span><span>UGX {total.toLocaleString()}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        isOpen={!!deletingSale}
        onClose={() => setDeletingSale(null)}
        title="Delete Sale"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingSale(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteLoading} onClick={handleDelete}>Yes, Delete</Button>
          </>
        }
      >
        {deletingSale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {deleteError && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                ⚠️ {deleteError}
              </div>
            )}
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              Are you sure you want to delete <strong>Sale #{deletingSale.id}</strong> for{' '}
              <strong>UGX {parseFloat(deletingSale.total_amount || 0).toLocaleString()}</strong>?
            </div>
            <div style={{ padding: '10px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 13, color: '#9a3412' }}>
              ⚠️ This will permanently delete the sale and restore stock for all items. This cannot be undone.
            </div>
          </div>
        )}
      </Modal>
      {viewingInvoice && (
        <PrintableInvoiceModal
          invoice={{
            id: viewingInvoice.id,
            invoice_number: `INV/25-26/${String(viewingInvoice.id).padStart(4, '0')}`,
            invoice_date: (viewingInvoice.sale_date || viewingInvoice.created_at || '').slice(0, 10),
            due_date: (viewingInvoice.sale_date || viewingInvoice.created_at || '').slice(0, 10),
            customer_name: viewingInvoice.customer?.name || 'Walk-in Customer',
            customer_email: viewingInvoice.customer?.email || '',
            customer_phone: viewingInvoice.customer?.phone || viewingInvoice.customer?.contact || '',
            customer_address: viewingInvoice.customer?.address || '',
            total_amount: parseFloat(viewingInvoice.total_amount || 0),
            discount_amount: parseFloat(viewingInvoice.discount_amount || 0),
            tax_amount: parseFloat(viewingInvoice.tax_amount || 0),
            items: viewingInvoice.sale_items || viewingInvoice.saleItems || [],
            source_ref: `S${String(viewingInvoice.id).padStart(5, '0')}`
          }}
          user={user}
          onClose={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
}

export default SalesTab;
export { SalesTab };
