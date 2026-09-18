import { theme } from '../../styles/theme';
import Button from './Button';

export default function EmptyState({
  icon,
  title = 'No data available',
  description = 'Get started by adding your first item.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
      minHeight: '220px',
    }} className={className}>
      {/* Neutral icon placeholder — no emoji */}
      <div style={{
        width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <path d="M9 9h6M9 12h6M9 15h4"/>
        </svg>
      </div>
      <h3 style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
      <p style={{ margin: '0 0 20px 0', fontSize: 13, color: '#94a3b8', lineHeight: 1.5, maxWidth: 320 }}>{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
