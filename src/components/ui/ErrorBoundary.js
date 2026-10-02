import React from 'react';

/**
 * ErrorBoundary component that isolates crashes in individual modules.
 * If one page or tab has an error, it prevents the entire Dashboard from breaking.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Module Error Boundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '32px 24px',
          maxWidth: '680px',
          margin: '40px auto',
          background: '#ffffff',
          borderRadius: '14px',
          border: '1.5px solid #fecaca',
          boxShadow: '0 4px 18px rgba(220, 38, 38, 0.08)',
          textAlign: 'center',
          fontFamily: 'inherit',
        }}>
          <div style={{ fontSize: '38px', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#991b1b', margin: '0 0 8px' }}>
            {this.props.fallbackTitle || 'Module Failed to Load'}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.6 }}>
            A temporary problem occurred in this section. The rest of the dashboard and your session are unaffected.
          </p>
          {this.state.error?.message && (
            <pre style={{
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#b91c1c',
              textAlign: 'left',
              overflowX: 'auto',
              marginBottom: '20px',
              fontFamily: 'monospace'
            }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.resetError}
            style={{
              padding: '10px 22px',
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
            onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
          >
            ↻ Retry Loading Section
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
