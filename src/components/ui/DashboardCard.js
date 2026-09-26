import React, { useState } from 'react';

// ── Arrow icons for trend badges ──
const ArrowUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function DashboardCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'primary',
  icon: customIcon,
  loading = false
}) {
  const [hovered, setHovered] = useState(false);

  // 3D emoji icon + color config per variant
  const colorMap = {
    primary: {
      bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
      border: '#c7d2fe',
      shadow: 'rgba(79, 70, 229, 0.18)',
      emoji: '📦',
    },
    success: {
      bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      border: '#a7f3d0',
      shadow: 'rgba(5, 150, 105, 0.18)',
      emoji: '📈',
    },
    warning: {
      bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      border: '#fde68a',
      shadow: 'rgba(217, 119, 6, 0.18)',
      emoji: '🛒',
    },
    danger: {
      bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      border: '#fca5a5',
      shadow: 'rgba(220, 38, 38, 0.18)',
      emoji: '⚠️',
    },
    neutral: {
      bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      border: '#e2e8f0',
      shadow: 'rgba(71, 85, 105, 0.12)',
      emoji: '📊',
    },
  };

  const c = colorMap[color] || colorMap.primary;

  // Resolve currency prefix vs raw numeric value
  let currencyPrefix = null;
  let displayValue = value;
  if (typeof value === 'string' && value.startsWith('UGX ')) {
    currencyPrefix = 'UGX';
    displayValue = value.replace('UGX ', '');
  } else if (typeof value === 'number') {
    displayValue = value.toLocaleString();
  }

  const isNumericZero = displayValue === '0' || displayValue === 0;

  const skeletonStyles = {
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: '20px 22px',
        border: '1px solid',
        borderColor: hovered ? '#cbd5e1' : '#e2e8f0',
        boxShadow: hovered
          ? '0 10px 24px -4px rgba(15, 23, 42, 0.07), 0 4px 8px -2px rgba(15, 23, 42, 0.03)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 158,
        position: 'relative'
      }}
    >
      {loading ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ ...skeletonStyles, width: '45%', height: 14 }} />
            <div style={{ ...skeletonStyles, width: 36, height: 36, borderRadius: 10 }} />
          </div>
          <div style={{ ...skeletonStyles, width: '65%', height: 30, marginBottom: 14 }} />
          <div style={{ ...skeletonStyles, width: '40%', height: 12 }} />
        </div>
      ) : (
        <>
          {/* ── Top row: Label & Icon Chip ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <span style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#475569',
              letterSpacing: '0.01em',
              lineHeight: 1.3
            }}>
              {title}
            </span>

            {/* 3D Emoji Icon Chip */}
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: c.bg,
              border: `1px solid ${c.border}`,
              boxShadow: `0 4px 12px ${c.shadow}, 0 1px 3px rgba(0,0,0,0.06)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              transform: hovered ? 'translateY(-2px) scale(1.04)' : 'none',
            }}>
              {customIcon ? (
                <span style={{ fontSize: 20, lineHeight: 1, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.18))' }}>
                  {customIcon}
                </span>
              ) : (
                <span style={{ fontSize: 20, lineHeight: 1, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.18))' }}>
                  {c.emoji}
                </span>
              )}
            </div>
          </div>

          {/* ── Metric Value ── */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 14px 0' }}>
            {currencyPrefix && (
              <span style={{
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#64748b',
                letterSpacing: '0.02em',
                fontFamily: "'Inter', sans-serif"
              }}>
                {currencyPrefix}
              </span>
            )}
            <span style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.025em',
              lineHeight: 1,
              fontFamily: currencyPrefix ? "'DM Mono', monospace" : 'inherit',
              fontFeatureSettings: "'tnum'"
            }}>
              {displayValue}
            </span>
          </div>

          {/* ── Bottom row: Subtitle & Status/Trend Pill ── */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingTop: 10,
            borderTop: '1px solid #f1f5f9'
          }}>
            {subtitle && (
              <span style={{
                fontSize: '12px',
                color: '#64748b',
                fontWeight: 400,
                lineHeight: 1.4,
              }}>
                {subtitle}
              </span>
            )}

            {/* Status / Trend Badge */}
            <div>
              {color === 'danger' ? (
                isNumericZero ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '3px 10px',
                    borderRadius: 9999,
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0'
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                    Healthy
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '3px 10px',
                    borderRadius: 9999,
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#fef2f2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca'
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    {trendValue || 'Needs attention'}
                  </span>
                )
              ) : trend && trendValue ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 10px',
                  borderRadius: 9999,
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: trend === 'up' ? '#ecfdf5' : trend === 'down' ? '#fef2f2' : '#f1f5f9',
                  color: trend === 'up' ? '#047857' : trend === 'down' ? '#b91c1c' : '#475569',
                  border: `1px solid ${trend === 'up' ? '#a7f3d0' : trend === 'down' ? '#fecaca' : '#e2e8f0'}`
                }}>
                  {trend === 'up' && <ArrowUpIcon />}
                  {trend === 'down' && <ArrowDownIcon />}
                  {trendValue}
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 10px',
                  borderRadius: 9999,
                  fontSize: '11px',
                  fontWeight: 500,
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  border: '1px solid #e2e8f0'
                }}>
                  Active
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
