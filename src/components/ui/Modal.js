import { theme } from '../../styles/theme';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  maxWidth,
  className = '' 
}) {
  if (!isOpen) return null;

  const sizes = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '600px' },
    lg: { maxWidth: '800px' },
    xl: { maxWidth: '1100px' }
  };

  const overlayStyles = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
    animation: 'fadeIn 0.2s ease-out',
    overflowY: 'auto',
  };

  const modalStyles = {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius['2xl'],
    boxShadow: theme.shadows.xl,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideIn 0.2s ease-out',
    ...(maxWidth ? { maxWidth } : sizes[size])
  };

  const headerStyles = {
    padding: `12px ${theme.spacing.xl}`,
    borderBottom: '1px solid ' + theme.colors.neutral[200],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    minHeight: 60,
  };

  const titleStyles = {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[900],
    margin: 0,
  };

  const closeButtonStyles = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: theme.colors.neutral[400],
    padding: '6px',
    borderRadius: theme.borderRadius.md,
    transition: theme.transitions.default,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    flexShrink: 0,
  };

  const contentStyles = {
    padding: theme.spacing.xl,
    flex: 1,
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: 'contain',
  };

  const footerStyles = {
    padding: theme.spacing.xl,
    borderTop: '1px solid ' + theme.colors.neutral[200],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    flexShrink: 0,
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCloseHover = (e, isEntering) => {
    e.target.style.backgroundColor = isEntering ? theme.colors.neutral[100] : 'transparent';
    e.target.style.color = isEntering ? theme.colors.neutral[600] : theme.colors.neutral[400];
  };

  return (
    <div style={overlayStyles} className="modal-overlay-responsive" onClick={handleOverlayClick}>
      <div style={modalStyles} className={`modal-responsive ${className}`}>
        {title && (
          <div style={headerStyles}>
            <h2 style={titleStyles}>{title}</h2>
            <button
              style={closeButtonStyles}
              onClick={onClose}
              onMouseEnter={(e) => handleCloseHover(e, true)}
              onMouseLeave={(e) => handleCloseHover(e, false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <div style={contentStyles}>
          {children}
        </div>
        {footer && (
          <div style={footerStyles}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-20px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
`;
if (!document.head.querySelector('style[data-component="Modal"]')) {
  styleSheet.setAttribute('data-component', 'Modal');
  document.head.appendChild(styleSheet);
}
