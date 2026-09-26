import { theme } from '../../styles/theme';

export default function QuickActions({ actions = [], className = '' }) {
  const containerStyles = {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: '20px 24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
    marginBottom: '24px'
  };

  const titleStyles = {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 16px 0',
    letterSpacing: '-0.015em'
  };

  const actionsGridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px'
  };

  const actionCardStyles = {
    padding: '14px 16px',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'left'
  };

  const actionTitleStyles = {
    fontSize: '13.5px',
    fontWeight: 600,
    color: '#0f172a',
    margin: '0 0 4px 0'
  };

  const actionDescStyles = {
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.4
  };

  const handleActionHover = (e, isEntering) => {
    if (isEntering) {
      e.currentTarget.style.backgroundColor = '#f8fafc';
      e.currentTarget.style.borderColor = '#c7d2fe';
      e.currentTarget.style.transform = 'translateY(-1px)';
    } else {
      e.currentTarget.style.backgroundColor = '#ffffff';
      e.currentTarget.style.borderColor = '#e2e8f0';
      e.currentTarget.style.transform = 'translateY(0)';
    }
  };

  const defaultActions = [
    {
      id: 'new-sale',
      title: 'New Sale',
      description: 'Process a new sale transaction',
      onClick: () => {}
    },
    {
      id: 'add-product',
      title: 'Add Product',
      description: 'Add a new product to inventory',
      onClick: () => {}
    },
    {
      id: 'add-supplier',
      title: 'Add Supplier',
      description: 'Register a new supplier',
      onClick: () => {}
    },
    {
      id: 'record-purchase',
      title: 'Record Purchase',
      description: 'Record a new purchase order',
      onClick: () => {}
    }
  ];

  const actionsToShow = actions.length > 0 ? actions : defaultActions;

  return (
    <div style={containerStyles} className={className}>
      <h3 style={titleStyles}>Quick Actions</h3>
      <div style={actionsGridStyles}>
        {actionsToShow.map((action) => (
          <div
            key={action.id}
            style={actionCardStyles}
            onClick={action.onClick}
            onMouseEnter={(e) => handleActionHover(e, true)}
            onMouseLeave={(e) => handleActionHover(e, false)}
          >
            <h4 style={actionTitleStyles}>{action.title}</h4>
            <p style={actionDescStyles}>{action.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
