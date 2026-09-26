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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
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
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideIn 0.2s ease-out',
    ...sizes[size],
    ...(maxWidth ? { maxWidth } : {})
  };

  const headerStyles = {
    padding: '16px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    minHeight: 56,
  };

  const titleStyles = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.015em',
    margin: 0,
  };

  const closeButtonStyles = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#64748b',
    padding: '6px',
    borderRadius: '8px',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    flexShrink: 0,
  };

  const contentStyles = {
    padding: '24px',
    flex: 1,
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: 'contain',
  };

  const footerStyles = {
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
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
          <div style={headerStyles} className="modal-header-responsive">
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
        <div style={contentStyles} className="modal-content-responsive">
          {children}
        </div>
        {footer && (
          <div style={footerStyles} className="modal-footer-responsive">
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
