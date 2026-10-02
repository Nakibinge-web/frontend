import { theme } from './theme';

const exS = {
  pill: (bg, border, color) => ({
    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: bg, border: `1px solid ${border}`, color,
  }),
};


const fS = {
  input: {
    flex: '1 1 200px', padding: '8px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none',
    background: '#fff', color: '#0f172a', minWidth: 0,
  },
  select: {
    flex: '0 0 auto', padding: '8px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none',
    background: '#fff', color: '#0f172a', cursor: 'pointer',
  },
  clear: {
    padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8,
    background: '#f8fafc', color: '#64748b', fontSize: 13, cursor: 'pointer',
    fontWeight: 500, whiteSpace: 'nowrap',
  },
};


const supS = {
  label: { fontSize: 12, fontWeight: 600, color: '#374151', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  input: {
    padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%',
    boxSizing: 'border-box', background: '#f8fafc', color: '#0f172a',
    transition: 'border-color 0.2s, background 0.2s',
  },
};



const catS = {
  label: { fontSize: 12, fontWeight: 600, color: '#374151', letterSpacing: '0.03em', textTransform: 'uppercase' },
  input: {
    padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%',
    boxSizing: 'border-box', background: '#fff', color: '#0f172a',
  },
  error: {
    padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 8, color: '#b91c1c', fontSize: 13,
  },
  editBtn: {
    padding: '4px 10px', borderRadius: 6, border: '1px solid #3b82f6',
    background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 12, fontWeight: 500,
  },
  deleteBtn: {
    padding: '4px 10px', borderRadius: 6, border: '1px solid #ef4444',
    background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 500,
  },
};


const custS = {
  hero: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '16px 18px', marginBottom: 20,
    background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%)',
    borderRadius: 12, border: '1px solid #e0e7ff',
  },
  heroIcon: {
    width: 48, height: 48, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, flexShrink: 0,
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
  },
  heroTitle: { margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' },
  heroSub: { margin: '3px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.4 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  section: {
    display: 'flex', flexDirection: 'column', gap: 14,
    padding: '16px', background: '#f8fafc',
    borderRadius: 12, border: '1px solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: '#6366f1',
    textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  required: { color: '#ef4444', marginLeft: 2 },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    background: '#fff', border: '1.5px solid #e2e8f0',
    borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  inputIcon: {
    padding: '0 12px', fontSize: 16, color: '#94a3b8',
    display: 'flex', alignItems: 'center', flexShrink: 0,
    borderRight: '1px solid #f1f5f9', background: '#fafafa',
    alignSelf: 'stretch',
  },
  input: {
    flex: 1, padding: '11px 12px', border: 'none', outline: 'none',
    fontSize: 14, fontFamily: 'inherit', color: '#0f172a', background: 'transparent',
    width: '100%', boxSizing: 'border-box',
  },
  hint: { fontSize: 12, color: '#94a3b8', margin: 0 },
  statusRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  statusPill: {
    padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
    background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: 'all 0.15s ease', fontFamily: 'inherit',
  },
  statusPillActive: {
    border: '1.5px solid #6366f1', background: '#eef2ff', color: '#4f46e5',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.12)',
  },
  error: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 10, color: '#b91c1c', fontSize: 13, lineHeight: 1.4,
  },
};


function focusInputWrap(e, focused) {
  const wrap = e.target.closest('[data-input-wrap]');
  if (!wrap) return;
  wrap.style.borderColor = focused ? '#6366f1' : '#e2e8f0';
  wrap.style.boxShadow = focused ? '0 0 0 3px rgba(99, 102, 241, 0.12)' : 'none';
}

const posS = {
  searchInput: {
    padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%',
    boxSizing: 'border-box', background: '#fff', color: '#0f172a',
  },
  discountInput: {
    padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 120,
    boxSizing: 'border-box', background: '#fff', textAlign: 'right',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 12,
  },
  productCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    padding: '16px 12px', border: '1.5px solid #e2e8f0', borderRadius: 12,
    background: '#fff', cursor: 'pointer', textAlign: 'center',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', outline: 'none',
  },
  productName: { fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.3, marginBottom: 2 },
  productSku: { fontSize: 11, color: '#94a3b8' },
  productPrice: { fontSize: 13, fontWeight: 700, color: '#16a34a', marginTop: 4 },
  cartPanel: {
    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  cartHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderBottom: '1px solid #f1f5f9',
    background: '#fafafa',
  },
  clearBtn: {
    background: 'none', border: 'none', color: '#ef4444', fontSize: 12,
    cursor: 'pointer', fontWeight: 600, padding: 0,
  },
  emptyCart: {
    padding: '28px 16px', textAlign: 'center',
  },
  cartItems: {
    display: 'flex', flexDirection: 'column', maxHeight: 280, overflowY: 'auto',
  },
  cartItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px', borderBottom: '1px solid #f8fafc',
    flexWrap: 'wrap',
  },
  cartItemName: { fontSize: 13, fontWeight: 600, color: '#0f172a' },
  cartItemPrice: { fontSize: 11, color: '#94a3b8' },
  cartItemSubtotal: { fontSize: 13, fontWeight: 700, color: '#0f172a', width: '100%', textAlign: 'right', marginTop: 2 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0',
    background: '#f8fafc', color: '#475569', cursor: 'pointer', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
    flexShrink: 0,
  },
  qtyInput: {
    width: 40, textAlign: 'center', border: '1px solid #e2e8f0',
    borderRadius: 6, padding: '4px 2px', fontSize: 13, outline: 'none',
  },
  removeBtn: {
    background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
    fontSize: 14, padding: '2px 4px', borderRadius: 4,
  },
  cartFooter: {
    padding: '16px 14px', borderTop: '1px solid #f1f5f9', background: '#fafafa',
  },

};

const styles = {
  // Layout Styles
  dashboard: {
    height: '100vh',
    backgroundColor: theme.colors.neutral[50],
    fontFamily: theme.typography.fontFamily,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  // Loading Styles
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.neutral[50]
  },

  spinner: {
    width: '48px',
    height: '48px',
    border: `4px solid ${theme.colors.neutral[200]}`,
    borderTop: `4px solid ${theme.colors.primary[600]}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.neutral[600],
    margin: 0
  },

  // Header Styles — layout controlled by .dash-header CSS class
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    minHeight: 64,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.lg
  },

  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm
  },

  logoIcon: {
    fontSize: '22px',
    display: 'none'
  },

  logo: {
    margin: 0,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#0f172a',
    letterSpacing: '-0.5px',
  },

  headerCenter: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '500px',
    margin: `0 ${theme.spacing.xl}`
  },

  searchContainer: {
    position: 'relative',
    width: '100%'
  },

  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '14px',
    color: '#94a3b8'
  },

  searchInput: {
    width: '100%',
    padding: '8px 36px 8px 38px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: '13.5px',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    transition: 'all 0.15s ease',
    outline: 'none'
  },

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.lg
  },

  notificationIcon: {
    fontSize: '20px',
    cursor: 'pointer',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    transition: theme.transitions.default
  },

  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md
  },

  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    border: '1px solid #c7d2fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13.5px',
    fontWeight: 700
  },

  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },

  userName: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: '#0f172a'
  },

  userRole: {
    fontSize: '11.5px',
    color: '#64748b',
    fontWeight: 500
  },

  // Container & Layout — controlled by .dash-container CSS class
  container: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },

  // Sidebar — layout controlled by .dash-sidebar CSS class
  sidebar: {
    width: '260px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },

  sidebarContent: {
    padding: theme.spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs
  },

  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: 500,
    color: '#475569',
    textAlign: 'left',
    borderRadius: 8,
    transition: 'all 0.15s ease',
    position: 'relative',
    width: '100%'
  },

  menuItemActive: {
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    fontWeight: 600
  },

  menuIcon: {
    fontSize: '17px',
    width: '22px',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  menuLabel: {
    flex: 1,
    fontSize: '13.5px'
  },

  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '18px',
    backgroundColor: '#4f46e5',
    borderRadius: '4px'
  },

  // Main Content — padding controlled by .dash-main CSS class
  main: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#f8fafc',
    minWidth: 0,
  },

  // Error Banner
  errorBanner: {
    backgroundColor: theme.colors.danger[50],
    color: theme.colors.danger[700],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.xl,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md,
    border: `1px solid ${theme.colors.danger[200]}`
  },

  errorIcon: {
    fontSize: '20px'
  },

  // Page Layout
  pageContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    paddingBottom: 32
  },

  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: '1px solid #f1f5f9'
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 4px 0',
    letterSpacing: '-0.3px'
  },

  pageSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    margin: 0
  },

  // Content Cards
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  },

  // KPI Grid
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: theme.spacing.xl,
    marginBottom: theme.spacing['2xl']
  },

  // Content Grid
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: theme.spacing.xl,
    marginTop: theme.spacing['2xl']
  },

  cardTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[900],
    margin: `0 0 ${theme.spacing.lg} 0`,
    padding: `${theme.spacing.xl} ${theme.spacing.xl} 0`
  },

  // Alert Card
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.danger[200]}`,
    overflow: 'hidden'
  },

  alertHeader: {
    padding: theme.spacing.xl,
    borderBottom: `1px solid ${theme.colors.danger[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.danger[50]
  },

  alertTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.danger[700],
    margin: 0
  },

  alertList: {
    padding: theme.spacing.xl,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md
  },

  alertItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.neutral[200]}`
  },

  alertItemName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral[900],
    display: 'block'
  },

  alertItemStock: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral[500],
    display: 'block',
    marginTop: theme.spacing.xs
  },

  alertFooter: {
    padding: theme.spacing.xl,
    borderTop: `1px solid ${theme.colors.neutral[200]}`,
    textAlign: 'center'
  },

  // Cards Grid
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20
  },

  // Category Card
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: '20px 22px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.15s',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  },

  categoryIcon: {
    fontSize: '32px',
    marginBottom: 12,
    display: 'block'
  },

  categoryTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 6px 0'
  },

  categoryDescription: {
    fontSize: 13,
    color: '#64748b',
    margin: '0 0 14px 0',
    lineHeight: '1.5'
  },

  categoryFooter: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: 12
  },

  categoryDate: {
    fontSize: 12,
    color: '#94a3b8'
  },

  // Supplier Card
  supplierCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: '20px 22px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.15s',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  },

  supplierHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
  },

  supplierIcon: {
    fontSize: '24px'
  },

  supplierName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },

  supplierDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },

  supplierDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#475569'
  },

  supplierDetailIcon: {
    fontSize: '14px',
    width: '18px',
    opacity: 0.6
  },

  // Reports Grid
  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: 20
  },

  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: '20px 22px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  },

  reportTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 16px 0',
    letterSpacing: '-0.2px'
  },

  reportMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },

  reportMetric: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #f1f5f9'
  },

  reportLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: 500
  },

  reportValue: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a'
  },

  // Skeleton Loading
  skeletonCard: {
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    height: '180px',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  }
};


// Add CSS animations for dashboard components if running in browser
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes aiPulse {
      0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }
  `;
  if (!document.head.querySelector('style[data-component="Dashboard"]')) {
    styleSheet.setAttribute('data-component', 'Dashboard');
    document.head.appendChild(styleSheet);
  }
}

export { styles, exS, fS, supS, catS, custS, focusInputWrap, posS };
export default styles;
