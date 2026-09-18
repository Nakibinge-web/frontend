import { useState, useEffect } from 'react';
import { theme } from '../../styles/theme';
import Badge from './Badge';
import EmptyState from './EmptyState';

export default function DataTable({ 
  columns, 
  data, 
  loading = false,
  emptyStateProps,
  onRowClick,
  className = '',
  pageSize = 15,
}) {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever data changes (e.g. after filter/search)
  useEffect(() => { setPage(1); }, [data]);

  const tableStyles = {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    boxShadow: theme.shadows.md,
    border: '1px solid ' + theme.colors.neutral[200]
  };

  const headerStyles = {
    backgroundColor: theme.colors.neutral[50],
    borderBottom: '1px solid ' + theme.colors.neutral[200]
  };

  const headerCellStyles = {
    padding: theme.spacing.lg,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[700],
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const rowStyles = {
    borderBottom: '1px solid ' + theme.colors.neutral[100],
    transition: theme.transitions.fast,
    cursor: onRowClick ? 'pointer' : 'default'
  };

  const cellStyles = {
    padding: theme.spacing.lg,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral[700],
    verticalAlign: 'middle'
  };

  const skeletonRowStyles = {
    ...rowStyles,
    backgroundColor: theme.colors.neutral[50]
  };

  const skeletonCellStyles = {
    ...cellStyles,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.sm,
    height: '16px',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  };

  const renderCellContent = (column, row) => {
    if (column.render) return column.render(row[column.key], row);
    const value = row[column.key];
    if (column.type === 'currency') return (
      <span style={{ fontFamily: "'DM Mono', monospace", fontFeatureSettings: "'tnum'", letterSpacing: '-0.01em', fontWeight: 500 }}>
        UGX {parseFloat(value || 0).toLocaleString()}
      </span>
    );
    if (column.type === 'date') return new Date(value).toLocaleDateString();
    if (column.type === 'badge') {
      const badgeProps = column.getBadgeProps ? column.getBadgeProps(value, row) : { variant: 'neutral', children: value };
      return <Badge {...badgeProps} />;
    }
    if (column.type === 'number') return typeof value === 'number' ? value.toLocaleString() : value;
    return value || '-';
  };

  const handleRowHover = (e, isEntering) => {
    if (onRowClick) e.currentTarget.style.backgroundColor = isEntering ? theme.colors.neutral[50] : 'transparent';
  };

  if (loading) {
    return (
      <div style={tableStyles}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
            <thead style={headerStyles}>
              <tr>{columns.map((col, i) => <th key={i} style={headerCellStyles}>{col.title}</th>)}</tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, ri) => (
                <tr key={ri} style={skeletonRowStyles}>
                  {columns.map((_, ci) => (
                    <td key={ci} style={cellStyles}>
                      <div style={{ ...skeletonCellStyles, width: Math.random() * 60 + 40 + '%' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div style={tableStyles}><EmptyState {...emptyStateProps} /></div>;
  }

  const paged = data.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={tableStyles} className={className}>
      {/* Desktop table — hidden on mobile via CSS */}
      <div className="table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead style={headerStyles}>
            <tr>{columns.map((col, i) => <th key={i} style={headerCellStyles} className="dt-table-row">{col.title}</th>)}</tr>
          </thead>
          <tbody>
            {paged.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className="dt-table-row"
                style={{ ...rowStyles, backgroundColor: rowIndex % 2 === 0 ? 'transparent' : theme.colors.neutral[25] }}
                onMouseEnter={(e) => handleRowHover(e, true)}
                onMouseLeave={(e) => handleRowHover(e, false)}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col, ci) => <td key={ci} style={cellStyles}>{renderCellContent(col, row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card rows — hidden on desktop via CSS */}
      <div>
        {paged.map((row, rowIndex) => (
          <div
            key={`card-${row.id || rowIndex}`}
            className="dt-card-row"
            style={{
              borderBottom: '1px solid ' + theme.colors.neutral[100],
              padding: '12px 16px',
              cursor: onRowClick ? 'pointer' : 'default',
            }}
            onClick={() => onRowClick && onRowClick(row)}
          >
            {columns.map((col, ci) => (
              <div key={ci} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '4px 0', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: theme.colors.neutral[500], textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0, paddingTop: 2 }}>
                  {col.title}
                </span>
                <span style={{ fontSize: 13, color: theme.colors.neutral[700], textAlign: 'right' }}>
                  {renderCellContent(col, row)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {data.length > pageSize && (
        <PaginationBar total={data.length} page={page} pageSize={pageSize} onPageChange={setPage} />
      )}
    </div>
  );
}

function PaginationBar({ total, page, pageSize, onPageChange }) {
  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }

  const btn = (active) => ({
    minWidth: 34, height: 34, borderRadius: 8, border: `1px solid ${active ? '#4f46e5' : '#e2e8f0'}`,
    background: active ? '#4f46e5' : '#fff', color: active ? '#fff' : '#475569',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#fafbff' }}>
      <span style={{ fontSize: 13, color: '#64748b' }}>Showing <strong>{from}–{to}</strong> of <strong>{total}</strong></span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button style={{ ...btn(false), opacity: page === 1 ? 0.4 : 1 }} onClick={() => onPageChange(page - 1)} disabled={page === 1}>‹</button>
        {pages.map((p, i) => p === '...'
          ? <span key={`e${i}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: 13 }}>…</span>
          : <button key={p} style={btn(p === page)} onClick={() => onPageChange(p)}>{p}</button>
        )}
        <button style={{ ...btn(false), opacity: page === totalPages ? 0.4 : 1 }} onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>›</button>
      </div>
    </div>
  );
}
