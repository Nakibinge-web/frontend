import React, { useState, useEffect } from 'react';

// ── Shared inline pagination ──────────────────────────────────────────────────
export function usePagination(items, pageSize = 15) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [items]);
  const totalPages = Math.ceil((items || []).length / pageSize);
  const paged = (items || []).slice((page - 1) * pageSize, page * pageSize);
  return { paged, page, setPage, totalPages, total: (items || []).length, pageSize };
}

export function InlinePager({ page, totalPages, total, pageSize, setPage }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }
  const btn = (active) => ({
    minWidth: 32, height: 32, borderRadius: 7,
    border: `1px solid ${active ? '#4f46e5' : '#e2e8f0'}`,
    background: active ? '#4f46e5' : '#fff',
    color: active ? '#fff' : '#475569',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: '1px solid #f1f5f9', background: '#fafbff' }}>
      <span style={{ fontSize: 13, color: '#64748b' }}>Showing <strong>{from}–{to}</strong> of <strong>{total}</strong></span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{ ...btn(false), opacity: page === 1 ? 0.4 : 1 }} onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
        {pages.map((p, i) => p === '...'
          ? <span key={`e${i}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: 13, alignSelf: 'center' }}>…</span>
          : <button key={p} style={btn(p === page)} onClick={() => setPage(p)}>{p}</button>
        )}
        <button style={{ ...btn(false), opacity: page === totalPages ? 0.4 : 1 }} onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
      </div>
    </div>
  );
}

export default InlinePager;
