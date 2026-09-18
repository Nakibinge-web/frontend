import { theme } from '../../styles/theme';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left'
}) {
  const variants = {
    primary: {
      backgroundColor: theme.colors.primary[600],
      color: '#ffffff',
      border: '1px solid ' + theme.colors.primary[600],
      hover: {
        backgroundColor: theme.colors.primary[700],
        borderColor: theme.colors.primary[700]
      }
    },
    secondary: {
      backgroundColor: '#ffffff',
      color: theme.colors.neutral[700],
      border: '1px solid ' + theme.colors.neutral[300],
      hover: {
        backgroundColor: theme.colors.neutral[50],
        borderColor: theme.colors.neutral[400]
      }
    },
    success: {
      backgroundColor: theme.colors.success[600],
      color: '#ffffff',
      border: '1px solid ' + theme.colors.success[600],
      hover: {
        backgroundColor: theme.colors.success[700],
        borderColor: theme.colors.success[700]
      }
    },
    danger: {
      backgroundColor: theme.colors.danger[600],
      color: '#ffffff',
      border: '1px solid ' + theme.colors.danger[600],
      hover: {
        backgroundColor: theme.colors.danger[700],
        borderColor: theme.colors.danger[700]
      }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.neutral[600],
      border: 'none',
      hover: {
        backgroundColor: theme.colors.neutral[100],
        color: theme.colors.neutral[700]
      }
    }
  };

  const sizes = {
    sm: {
      padding: '6px 12px',
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      minHeight: '32px'
    },
    md: {
      padding: '8px 16px',
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      minHeight: '40px'
    },
    lg: {
      padding: '12px 24px',
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.medium,
      minHeight: '48px'
    }
  };

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    fontFamily: theme.typography.fontFamily,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: theme.transitions.default,
    textDecoration: 'none',
    outline: 'none',
    position: 'relative',
    ...sizes[size],
    ...variants[variant],
    opacity: disabled || loading ? 0.6 : 1
  };

  const handleMouseEnter = (e) => {
    if (!disabled && !loading) {
      Object.assign(e.target.style, variants[variant].hover);
    }
  };

  const handleMouseLeave = (e) => {
    if (!disabled && !loading) {
      Object.assign(e.target.style, {
        backgroundColor: variants[variant].backgroundColor,
        borderColor: variants[variant].border?.split(' ')[2] || 'transparent',
        color: variants[variant].color
      });
    }
  };

  const spinnerStyles = {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTop: '2px solid currentColor',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  return (
    <button
      type={type}
      style={baseStyles}
      onClick={disabled || loading ? undefined : onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      disabled={disabled || loading}
    >
      {loading && <div style={spinnerStyles}></div>}
      {!loading && icon && iconPosition === 'left' && <span>{icon}</span>}
      {!loading && children}
      {!loading && icon && iconPosition === 'right' && <span>{icon}</span>}
    </button>
  );
}

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-component="Button"]')) {
  styleSheet.setAttribute('data-component', 'Button');
  document.head.appendChild(styleSheet);
}