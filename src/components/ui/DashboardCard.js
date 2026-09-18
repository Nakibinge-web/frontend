import { theme } from '../../styles/theme';

export default function DashboardCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'primary',
  loading = false
}) {
  const colorMap = {
    primary: { accent: '#4f46e5', light: '#ede9fe', text: '#4f46e5' },
    success: { accent: '#16a34a', light: '#dcfce7', text: '#16a34a' },
    warning: { accent: '#d97706', light: '#fef3c7', text: '#d97706' },
    danger:  { accent: '#dc2626', light: '#fee2e2', text: '#dc2626' },
    neutral: { accent: '#475569', light: '#f1f5f9', text: '#475569' },
  };
  const c = colorMap[color] || colorMap.primary;

  const trendColor = trend === 'up' ? '#16a34a' : trend === 'down' ? '#dc2626' : '#64748b';
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  const skeletonStyles = {
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 6,
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: '22px 24px',
      border: '1px solid #e2e8f0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 3, backgroundColor: c.accent, borderRadius: '12px 12px 0 0'
      }} />

      {loading ? (
        <div>
          <div style={{ ...skeletonStyles, width: '50%', height: 13, marginBottom: 14 }} />
          <div style={{ ...skeletonStyles, width: '70%', height: 28, marginBottom: 10 }} />
          <div style={{ ...skeletonStyles, width: '40%', height: 12 }} />
        </div>
      ) : (
        <>
          <p style={{
            margin: '0 0 10px 0',
            fontSize: 11,
            fontWeight: 700,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>{title}</p>

          <div style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1,
            marginBottom: 8,
            letterSpacing: '-0.5px',
            fontFamily: typeof value === 'string' && value.startsWith('UGX')
              ? "'DM Mono', monospace"
              : 'inherit',
            fontFeatureSettings: "'tnum'",
          }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>

          {subtitle && (
            <p style={{ margin: '0 0 10px 0', fontSize: 13, color: '#64748b' }}>{subtitle}</p>
          )}

          {trend && trendValue && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 600, color: trendColor,
              background: trendColor + '12', padding: '3px 8px',
              borderRadius: 20,
            }}>
              <span>{trendArrow}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Skeleton animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`;
if (!document.head.querySelector('style[data-component="DashboardCard"]')) {
  styleSheet.setAttribute('data-component', 'DashboardCard');
  document.head.appendChild(styleSheet);
}
