import { theme } from '../../styles/theme';

export default function Badge({ 
  children, 
  variant = 'neutral', 
  size = 'md',
  className = '' 
}) {
  const variants = {
    primary: {
      backgroundColor: '#eef2ff',
      color: '#4338ca',
      border: '1px solid #c7d2fe'
    },
    success: {
      backgroundColor: '#ecfdf5',
      color: '#047857',
      border: '1px solid #a7f3d0'
    },
    warning: {
      backgroundColor: '#fffbeb',
      color: '#b45309',
      border: '1px solid #fde68a'
    },
    danger: {
      backgroundColor: '#fef2f2',
      color: '#b91c1c',
      border: '1px solid #fecaca'
    },
    neutral: {
      backgroundColor: '#f1f5f9',
      color: '#475569',
      border: '1px solid #e2e8f0'
    }
  };

  const sizes = {
    sm: {
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.01em'
    },
    md: {
      padding: '3px 10px',
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '0.01em'
    },
    lg: {
      padding: '5px 14px',
      fontSize: '13px',
      fontWeight: 600,
      letterSpacing: '0.01em'
    }
  };

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    whiteSpace: 'nowrap',
    fontFamily: theme.typography.fontFamily,
    lineHeight: '1',
    ...sizes[size],
    ...variants[variant]
  };

  return (
    <span style={baseStyles} className={className}>
      {children}
    </span>
  );
}