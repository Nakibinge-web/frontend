import { theme } from '../../styles/theme';

export default function Badge({ 
  children, 
  variant = 'neutral', 
  size = 'md',
  className = '' 
}) {
  const variants = {
    primary: {
      backgroundColor: theme.colors.primary[100],
      color: theme.colors.primary[700],
      border: '1px solid ' + theme.colors.primary[200]
    },
    success: {
      backgroundColor: theme.colors.success[100],
      color: theme.colors.success[700],
      border: '1px solid ' + theme.colors.success[200]
    },
    warning: {
      backgroundColor: theme.colors.warning[100],
      color: theme.colors.warning[700],
      border: '1px solid ' + theme.colors.warning[200]
    },
    danger: {
      backgroundColor: theme.colors.danger[100],
      color: theme.colors.danger[700],
      border: '1px solid ' + theme.colors.danger[200]
    },
    neutral: {
      backgroundColor: theme.colors.neutral[100],
      color: theme.colors.neutral[700],
      border: '1px solid ' + theme.colors.neutral[200]
    }
  };

  const sizes = {
    sm: {
      padding: '2px 8px',
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.medium
    },
    md: {
      padding: '4px 12px',
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium
    },
    lg: {
      padding: '6px 16px',
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium
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