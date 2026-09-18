import { theme } from '../../styles/theme';

export default function QuickActions({ actions = [], className = '' }) {
  const containerStyles = {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    border: '1px solid ' + theme.colors.neutral[200],
    marginBottom: theme.spacing.xl
  };

  const titleStyles = {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[800],
    margin: `0 0 ${theme.spacing.md} 0`,
    letterSpacing: '-0.2px'
  };

  const actionsGridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: theme.spacing.md
  };

  const actionCardStyles = {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    border: '1px solid ' + theme.colors.neutral[200],
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: theme.transitions.default,
    textAlign: 'left'
  };

  const actionTitleStyles = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[800],
    margin: `0 0 ${theme.spacing.xs} 0`
  };

  const actionDescStyles = {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral[500],
    margin: 0,
    lineHeight: 1.4
  };

  const handleActionHover = (e, isEntering) => {
    if (isEntering) {
      e.currentTarget.style.backgroundColor = theme.colors.primary[50];
      e.currentTarget.style.borderColor = theme.colors.primary[200];
    } else {
      e.currentTarget.style.backgroundColor = '#ffffff';
      e.currentTarget.style.borderColor = theme.colors.neutral[200];
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
