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
      backgroundColor: '#4f46e5',
      color: '#ffffff',
      border: '1px solid #4f46e5',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      hover: {
        backgroundColor: '#4338ca',
        borderColor: '#4338ca'
      }
    },
    secondary: {
      backgroundColor: '#ffffff',
      color: '#334155',
      border: '1px solid #cbd5e1',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      hover: {
        backgroundColor: '#f8fafc',
        borderColor: '#94a3b8',
        color: '#0f172a'
      }
    },
    success: {
      backgroundColor: '#16a34a',
      color: '#ffffff',
      border: '1px solid #16a34a',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      hover: {
        backgroundColor: '#15803d',
        borderColor: '#15803d'
      }
    },
    danger: {
      backgroundColor: '#dc2626',
      color: '#ffffff',
      border: '1px solid #dc2626',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      hover: {
        backgroundColor: '#b91c1c',
        borderColor: '#b91c1c'
      }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#64748b',
      border: '1px solid transparent',
      hover: {
        backgroundColor: '#f1f5f9',
        color: '#0f172a'
      }
    }
  };

  const sizes = {
    sm: {
      padding: '5px 12px',
      fontSize: '13px',
      fontWeight: 500,
      minHeight: '32px',
      borderRadius: '6px'
    },
    md: {
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: 600,
      minHeight: '38px',
      borderRadius: '8px'
    },
    lg: {
      padding: '10px 22px',
      fontSize: '15px',
      fontWeight: 600,
      minHeight: '44px',
      borderRadius: '8px'
    }
  };

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '8px',
    fontFamily: theme.typography.fontFamily,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
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