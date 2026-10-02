import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/dashboardStyles';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import AddProductForm from '../components/AddProductForm';
import { ToastContainer, useToast } from '../components/ui/Toast';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Independent Page Modules
import OverviewTab from './Overview';
import ProductsTab from './Products';
import CategoriesTab from './Categories';
import SuppliersTab from './Suppliers';
import CustomersTab from './Customers';
import POSTab from './POS';
import SalesTab from './Sales';
import PurchasesTab from './Purchases';
import ReportsTab from './Reports';
import AiTab from './Ai';
import UsersTab from './Users';
import StockMovementsTab from './StockMovements';
import InvoicesTab from './Invoices';
import Settings from './Settings';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const VALID_TABS = [
  'overview',
  'pos',
  'products',
  'categories',
  'suppliers',
  'customers',
  'sales',
  'invoices',
  'purchases',
  'stock-movements',
  'reports',
  'ai',
  'users',
  'settings'
];

function getTabFromPath() {
  if (typeof window === 'undefined') return 'overview';
  const clean = window.location.pathname.replace(/[\\/]+/g, '/').replace(/^\//, '').split('/')[0].toLowerCase();
  if (clean === 'stock' || clean === 'stockmovements') return 'stock-movements';
  if (clean === 'point-of-sale') return 'pos';
  if (clean === 'dashboard') return 'overview';
  if (VALID_TABS.includes(clean)) return clean;
  return 'overview';
}

export default function Dashboard({ user, token, onLogout, onUserUpdate }) {
  const [activeTab, setActiveTabState] = useState(getTabFromPath);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { toasts, toast, remove } = useToast();

  const setActiveTab = useCallback((tabId, replace = false) => {
    setActiveTabState(tabId);
    const targetPath = tabId === 'overview' ? '/overview' : `/${tabId}`;
    if (window.location.pathname !== targetPath) {
      if (replace) {
        window.history.replaceState(null, '', targetPath);
      } else {
        window.history.pushState(null, '', targetPath);
      }
    }
  }, []);

  // Sync route on popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromPath();
      setActiveTabState(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync initial URL on mount
  useEffect(() => {
    const raw = window.location.pathname.replace(/[\\/]+/g, '/').toLowerCase();
    if (raw === '/' || raw === '' || raw === '/dashboard') {
      window.history.replaceState(null, '', '/overview');
    } else {
      const tab = getTabFromPath();
      const target = tab === 'overview' ? '/overview' : `/${tab}`;
      if (window.location.pathname !== target && VALID_TABS.includes(tab)) {
        window.history.replaceState(null, '', target);
      }
    }
  }, []);

  // Lock body scroll when mobile nav drawer is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileNavOpen]);
  const [data, setData] = useState({
    products: [],
    categories: [],
    suppliers: [],
    customers: [],
    sales: [],
    purchases: [],
    lowStock: [],
    stockMovements: [],
    stats: {
      totalProducts: 0,
      totalSales: 0,
      totalPurchases: 0,
      lowStockCount: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const safeJson = async (res) => {
        if (!res.ok) {
          console.warn(`API ${res.url} returned ${res.status}`);
          return { data: [] };
        }
        try { return await res.json(); } catch { return { data: [] }; }
      };

      const [productsRes, categoriesRes, suppliersRes, customersRes, salesRes, purchasesRes, lowStockRes, stockMovementsRes] = await Promise.all([
        fetch(`${API}/products?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/categories?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/suppliers?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/customers?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/sales?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/purchases?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/products/low-stock?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/stock-movements?tenant_id=${user.tenant_id}`, { headers }),
      ]);

      const [products, categories, suppliers, customers, sales, purchases, lowStock, stockMovements] = await Promise.all([
        safeJson(productsRes),
        safeJson(categoriesRes),
        safeJson(suppliersRes),
        safeJson(customersRes),
        safeJson(salesRes),
        safeJson(purchasesRes),
        safeJson(lowStockRes),
        safeJson(stockMovementsRes),
      ]);

      setData({
        products: products.data || [],
        categories: categories.data || [],
        suppliers: suppliers.data || [],
        customers: customers.data || [],
        sales: sales.data || [],
        purchases: purchases.data || [],
        lowStock: lowStock.data || [],
        stockMovements: stockMovements.data || [],
        stats: {
          totalProducts: (products.data || []).length,
          totalSales: (sales.data || []).reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0),
          totalPurchases: (purchases.data || []).reduce((sum, purchase) => sum + parseFloat(purchase.total_amount || 0), 0),
          lowStockCount: (products.data || []).filter(p => p.stock <= (p.reorder_level || 10)).length
        }
      });
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [user.tenant_id, token]);

  // Lightweight refresh for notifications only (doesn't show loading spinner)
  const refreshNotifications = useCallback(async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const safeJson = async (res) => {
        if (!res.ok) return { data: [] };
        try { return await res.json(); } catch { return { data: [] }; }
      };

      // Only fetch data needed for notifications: products (for stock), latest sales, latest purchases
      const [productsRes, salesRes, purchasesRes] = await Promise.all([
        fetch(`${API}/products?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/sales?tenant_id=${user.tenant_id}&limit=10`, { headers }), // Only get latest 10
        fetch(`${API}/purchases?tenant_id=${user.tenant_id}&limit=10`, { headers }), // Only get latest 10
      ]);

      const [products, sales, purchases] = await Promise.all([
        safeJson(productsRes),
        safeJson(salesRes),
        safeJson(purchasesRes),
      ]);

      // Update only the notification-relevant data without disrupting other state
      setData(prev => ({
        ...prev,
        products: products.data || prev.products,
        sales: sales.data || prev.sales,
        purchases: purchases.data || prev.purchases,
        stats: {
          ...prev.stats,
          lowStockCount: (products.data || []).filter(p => p.stock <= (p.reorder_level || 10)).length
        }
      }));
    } catch (err) {
      console.error('Failed to refresh notifications:', err);
      // Silent fail - don't disrupt user experience
    }
  }, [user.tenant_id, token]);

  const handleAddProduct = (newProduct) => {
    setData(prev => ({
      ...prev,
      products: [...prev.products, newProduct],
      stats: {
        ...prev.stats,
        totalProducts: prev.stats.totalProducts + 1
      }
    }));
    setShowAddProduct(false);
  };

  useEffect(() => {
    fetchData();
    
    // Lightweight auto-refresh for notifications every 30 seconds
    // Only updates stock levels, recent sales, and recent purchases
    const notificationRefreshInterval = setInterval(() => {
      refreshNotifications();
    }, 30000); // 30 seconds
    
    return () => clearInterval(notificationRefreshInterval);
  }, [fetchData, refreshNotifications]);

  // ── Global search ──────────────────────────────────────────────────────────
  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    const lower = q.toLowerCase();
    const results = [];
    data.products.forEach(p => {
      if (p.name?.toLowerCase().includes(lower) || p.sku?.toLowerCase().includes(lower))
        results.push({ type: 'Product', icon: '📦', label: p.name, sub: p.sku ? `SKU: ${p.sku}` : `Stock: ${p.stock}`, tab: 'products' });
    });
    data.suppliers.forEach(s => {
      if (s.name?.toLowerCase().includes(lower) || s.email?.toLowerCase().includes(lower))
        results.push({ type: 'Supplier', icon: '🏭', label: s.name, sub: s.email || s.contact || '', tab: 'suppliers' });
    });
    data.customers.forEach(c => {
      if (c.name?.toLowerCase().includes(lower) || c.email?.toLowerCase().includes(lower))
        results.push({ type: 'Customer', icon: '👥', label: c.name, sub: c.email || c.phone || '', tab: 'customers' });
    });
    data.categories.forEach(c => {
      if (c.name?.toLowerCase().includes(lower))
        results.push({ type: 'Category', icon: '🏷️', label: c.name, sub: '', tab: 'categories' });
    });
    data.sales.forEach(s => {
      const amount = `UGX ${parseFloat(s.total_amount || 0).toLocaleString()}`;
      if (amount.toLowerCase().includes(lower) || s.payment_method?.toLowerCase().includes(lower))
        results.push({ type: 'Sale', icon: '💰', label: `Sale — ${amount}`, sub: s.payment_method?.replace('_', ' '), tab: 'sales' });
    });
    setSearchResults(results.slice(0, 8));
    setSearchOpen(results.length > 0);
  };

  const goToResult = (result) => {
    setActiveTab(result.tab);
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  const isOwnerOrAdmin = user.roles && user.roles.some(r => ['owner', 'admin'].includes(r.name));

  // Returns true if the user has a given permission (via any role) OR is owner/admin
  const hasPermission = (perm) => {
    if (isOwnerOrAdmin) return true;
    return (user.roles || []).some(role =>
      (role.permissions || []).some(p => p.name === perm)
    );
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊', color: 'primary' },
    ...(hasPermission('sales.create') ? [{ id: 'pos', label: 'POS', icon: '🖥️', color: 'success' }] : []),
    ...(hasPermission('products.view') ? [{ id: 'products', label: 'Products', icon: '📦', color: 'success' }] : []),
    ...(hasPermission('categories.view') ? [{ id: 'categories', label: 'Categories', icon: '🏷️', color: 'warning' }] : []),
    ...(hasPermission('suppliers.view') ? [{ id: 'suppliers', label: 'Suppliers', icon: '🏭', color: 'neutral' }] : []),
    ...(hasPermission('customers.view') ? [{ id: 'customers', label: 'Customers', icon: '👥', color: 'primary' }] : []),
    ...(hasPermission('sales.view') ? [{ id: 'sales', label: 'Sales', icon: '💰', color: 'success' }] : []),
    ...(hasPermission('sales.view') ? [{ id: 'invoices', label: 'Invoices', icon: '📄', color: 'primary' }] : []),
    ...(hasPermission('purchases.view') ? [{ id: 'purchases', label: 'Purchases', icon: '🛒', color: 'primary' }] : []),
    ...(hasPermission('stock.view') ? [{ id: 'stock-movements', label: 'Stock Movements', icon: '🔄', color: 'neutral' }] : []),
    ...(hasPermission('sales.report') || hasPermission('purchases.report') ? [{ id: 'reports', label: 'Reports', icon: '📈', color: 'danger' }] : []),
    { id: 'ai', label: 'AI Assistant', icon: '🤖', color: 'primary' },
    ...(isOwnerOrAdmin || hasPermission('users.view') || hasPermission('roles.view') ? [{ id: 'users', label: 'Users', icon: '🔑', color: 'primary' }] : []),
  ];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.dashboard} className="dash-root">
      {/* Mobile nav overlay */}
      <div className={`mob-nav-overlay${mobileNavOpen ? ' open' : ''}`} onClick={() => setMobileNavOpen(false)} />

      {/* Header */}
      <header style={styles.header} className="dash-header">
        <div style={styles.headerLeft}>
          {/* Hamburger — mobile only */}
          <button
            className="ham-btn"
            onClick={() => setMobileNavOpen(v => !v)}
            aria-label="Open navigation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Clean enterprise brand badge matching login */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user.tenant?.logo_url ? (
              <img
                src={user.tenant.logo_url}
                alt={`${user.tenant?.name || 'Business'} logo`}
                style={{
                  width: 32, height: 32, objectFit: 'contain',
                  borderRadius: 8, flexShrink: 0,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff'
                }}
              />
            ) : (
              <div style={{
                width: 32, height: 32,
                backgroundColor: '#4f46e5', color: '#ffffff',
                borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 1px 3px rgba(79, 70, 229, 0.3)'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {user.tenant?.name || 'StockPro'}
              </span>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, letterSpacing: '0.01em' }}>
                {user.tenant?.name ? 'Inventory & Sales' : 'Enterprise'}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.headerCenter} className="header-search">
          <div style={{ ...styles.searchContainer, position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              pointerEvents: 'none'
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search products, suppliers, customers... (/)"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
            />
            <span style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '1px 6px',
              fontSize: 11,
              fontWeight: 600,
              color: '#94a3b8',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: 4,
              pointerEvents: 'none'
            }}>
              /
            </span>

            {searchOpen && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                zIndex: 1000,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
              }}>
                {searchResults.map((r, i) => (
                  <div
                    key={i}
                    onMouseDown={() => goToResult(r)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      borderBottom: i < searchResults.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'background-color 0.12s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 18, width: 22, textAlign: 'center' }}>{r.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.label}
                      </div>
                      {r.sub && <div style={{ fontSize: 12, color: '#64748b' }}>{r.sub}</div>}
                    </div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#4338ca',
                      background: '#eef2ff',
                      border: '1px solid #c7d2fe',
                      padding: '2px 8px',
                      borderRadius: 9999
                    }}>
                      {r.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={styles.headerRight}>
          <div 
            className="resp-hide"
            style={{ ...styles.notificationIcon, color: '#64748b', fontSize: '18px', position: 'relative', cursor: 'pointer' }}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {data.stats.lowStockCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: '#dc2626',
                color: '#fff',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700
              }}>
                {data.stats.lowStockCount}
              </span>
            )}
            
            {showNotifications && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                width: 360,
                maxHeight: 450,
                overflowY: 'auto',
                background: '#fff',
                border: '1.5px solid #e2e8f0',
                borderRadius: 12,
                boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                zIndex: 1000
              }}
              onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Notifications</h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button 
                      onClick={() => refreshNotifications()} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        fontSize: 16, 
                        color: '#4f46e5',
                        padding: '4px',
                        borderRadius: 4,
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f0ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      title="Refresh notifications"
                    >
                      🔄
                    </button>
                    <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>×</button>
                  </div>
                </div>
                
                {/* Low/Out of Stock Section */}
                {data.stats.lowStockCount > 0 && (
                  <div>
                    <div style={{ padding: '8px 16px', background: '#fef2f2', borderBottom: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#dc2626' }}>⚠️ Stock Alert ({data.stats.lowStockCount})</p>
                      <button 
                        onClick={() => { setActiveTab('products'); setShowNotifications(false); }}
                        style={{ fontSize: 10, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        VIEW ALL →
                      </button>
                    </div>
                    {data.products
                      .filter(p => p.stock <= (p.reorder_level || 10))
                      .sort((a, b) => a.stock - b.stock)
                      .slice(0, 3)
                      .map(product => (
                      <div key={product.id} style={{ 
                        padding: '10px 16px', 
                        borderBottom: '1px solid #f8fafc', 
                        cursor: 'pointer',
                        background: product.stock === 0 ? '#fef2f2' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                        onClick={() => { setActiveTab('products'); setShowNotifications(false); }}
                        onMouseEnter={e => e.currentTarget.style.background = product.stock === 0 ? '#fee2e2' : '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = product.stock === 0 ? '#fef2f2' : 'transparent'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{product.name}</p>
                          {product.stock === 0 && (
                            <span style={{ 
                              fontSize: 9, 
                              fontWeight: 700, 
                              color: '#dc2626', 
                              background: '#fee2e2', 
                              padding: '2px 6px', 
                              borderRadius: 4 
                            }}>OUT OF STOCK</span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: product.stock === 0 ? '#dc2626' : '#64748b' }}>
                          Stock: <strong>{product.stock}</strong> {product.unit || 'units'} • Reorder at {product.reorder_level || 10}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Recent Sales Section */}
                {data.sales.length > 0 && (
                  <div>
                    <div style={{ padding: '8px 16px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#16a34a' }}>💰 Recent Sales</p>
                    </div>
                    {data.sales.slice(0, 2).map(sale => (
                      <div key={sale.id} style={{ 
                        padding: '10px 16px', 
                        borderBottom: '1px solid #f8fafc', 
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                        onClick={() => { setActiveTab('sales'); setShowNotifications(false); }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                            {sale.customer?.name || 'Walk-in Customer'}
                          </p>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                            UGX {parseFloat(sale.total_amount || 0).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                          {new Date(sale.sale_date || sale.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Recent Purchases Section */}
                {data.purchases.length > 0 && (
                  <div>
                    <div style={{ padding: '8px 16px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#2563eb' }}>🛒 Recent Purchases</p>
                    </div>
                    {data.purchases.slice(0, 2).map(purchase => (
                      <div key={purchase.id} style={{ 
                        padding: '10px 16px', 
                        borderBottom: '1px solid #f8fafc', 
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                        onClick={() => { setActiveTab('purchases'); setShowNotifications(false); }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                            {purchase.supplier?.name || 'Supplier'}
                          </p>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>
                            UGX {parseFloat(purchase.total_amount || 0).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                          {new Date(purchase.purchase_date || purchase.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* No notifications */}
                {data.stats.lowStockCount === 0 && data.sales.length === 0 && data.purchases.length === 0 && (
                  <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>All caught up! No new notifications</p>
                  </div>
                )}
                
                {/* View All Link */}
                {(data.stats.lowStockCount > 3 || data.sales.length > 2 || data.purchases.length > 2) && (
                  <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      style={{ 
                        fontSize: 12, 
                        color: '#64748b', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontWeight: 600
                      }}>
                      Close Notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ ...styles.userDetails }} className="user-details-text">
              <span style={styles.userName}>{user.name}</span>
              <span style={styles.userRole}>
                {user.roles && user.roles.length > 0
                  ? user.roles.map(r => r.name).join(', ')
                  : 'No role'}
              </span>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onLogout}>
            <span className="logout-text-long">Logout</span>
            <span className="logout-text-short">✕</span>
          </Button>
        </div>
      </header>

      <div style={styles.container} className="dash-container">
        {/* Sidebar */}
        <nav style={styles.sidebar} className={`dash-sidebar${mobileNavOpen ? ' open' : ''}`}>
          <div style={{ padding: '20px 12px 16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Close button — mobile only */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px', margin: 0 }}>
                Main Menu
              </p>
              <button
                className="ham-btn"
                onClick={() => setMobileNavOpen(false)}
                style={{ marginLeft: 'auto' }}
                aria-label="Close navigation"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Main nav items — preserving all icons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {menuItems.filter(i => i.id !== 'users').map(item => (
                <button
                  key={item.id}
                  style={{
                    ...styles.menuItem,
                    ...(activeTab === item.id ? styles.menuItemActive : {})
                  }}
                  onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}
                  onMouseEnter={e => {
                    if (activeTab !== item.id) {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#0f172a';
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== item.id) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#475569';
                    }
                  }}
                >
                  <span style={styles.menuIcon}>{item.icon}</span>
                  <span style={styles.menuLabel}>{item.label}</span>
                  {activeTab === item.id && <div style={styles.activeIndicator} />}
                </button>
              ))}
            </div>

            {/* Spacer pushes admin section to bottom */}
            <div style={{ flex: 1 }} />

            {/* Admin section */}
            {(isOwnerOrAdmin || hasPermission('users.view') || hasPermission('roles.view')) && (
              <div>
                <div style={{ height: 1, background: '#f1f5f9', margin: '14px 8px 16px' }} />
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px', marginBottom: 8 }}>
                  Administration
                </p>
                <button
                  style={{
                    ...styles.menuItem,
                    ...(activeTab === 'users' ? styles.menuItemActive : {})
                  }}
                  onClick={() => { setActiveTab('users'); setMobileNavOpen(false); }}
                  onMouseEnter={e => {
                    if (activeTab !== 'users') {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#0f172a';
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== 'users') {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#475569';
                    }
                  }}
                >
                  <span style={styles.menuIcon}>🔑</span>
                  <span style={styles.menuLabel}>Users</span>
                  {activeTab === 'users' && <div style={styles.activeIndicator} />}
                </button>
                <button
                  style={{
                    ...styles.menuItem,
                    ...(activeTab === 'settings' ? styles.menuItemActive : {})
                  }}
                  onClick={() => { setActiveTab('settings'); setMobileNavOpen(false); }}
                  onMouseEnter={e => {
                    if (activeTab !== 'settings') {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#0f172a';
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== 'settings') {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#475569';
                    }
                  }}
                >
                  <span style={styles.menuIcon}>⚙️</span>
                  <span style={styles.menuLabel}>Settings</span>
                  {activeTab === 'settings' && <div style={styles.activeIndicator} />}
                </button>
                <div style={{ height: 16 }} />
              </div>
            )}
          </div> 
        </nav>

        {/* Main Content */}
        <main style={styles.main} className="dash-main">
          {error && (
            <div style={styles.errorBanner}>
              <span style={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
              <Button variant="secondary" size="sm" onClick={fetchData}>
                Retry
              </Button>
            </div>
          )}

                    <ErrorBoundary fallbackTitle={`Error Loading ${activeTab.toUpperCase()}`}>
{activeTab === 'overview' && <OverviewTab data={data} loading={loading} onNavigate={setActiveTab} onAddProduct={() => setShowAddProduct(true)}
            canSell={hasPermission('sales.create')}
            canAddProduct={hasPermission('products.create')}
            canAddSupplier={hasPermission('suppliers.create')}
            canRecordPurchase={hasPermission('purchases.create')}
            user={user}
          />}
          {activeTab === 'pos' && (
            <POSTab
              products={data.products}
              categories={data.categories}
              customers={data.customers}
              token={token}
              user={user}
              canSell={hasPermission('sales.create')}
              toast={toast}
              onSaleCompleted={(sale) => {
                setData(prev => {
                  // If the sale created a new customer, add them to the customers list
                  const newCustomerEntry = sale.customer;
                  const customerAlreadyExists = newCustomerEntry
                    ? prev.customers.some(c => c.id === newCustomerEntry.id)
                    : true;
                  
                  // Calculate new low stock count after sale
                  const updatedProducts = prev.products.map(p => {
                    const item = sale.sale_items?.find(i => i.product_id === p.id)
                      || sale.saleItems?.find(i => i.product_id === p.id);
                    return item ? { ...p, stock: p.stock - item.quantity } : p;
                  });
                  
                  return {
                    ...prev,
                    sales: [sale, ...prev.sales],
                    stats: { 
                      ...prev.stats, 
                      totalSales: prev.stats.totalSales + parseFloat(sale.total_amount || 0),
                      lowStockCount: updatedProducts.filter(p => p.stock <= (p.reorder_level || 10)).length
                    },
                    products: updatedProducts,
                    customers: (!customerAlreadyExists && newCustomerEntry)
                      ? [...prev.customers, newCustomerEntry]
                      : prev.customers,
                  };
                });
                toast.success('Sale completed!', `UGX ${parseFloat(sale.total_amount || 0).toLocaleString()} recorded.`);
                
                // Refresh notifications to show updated stock levels
                setTimeout(() => refreshNotifications(), 1000);
              }}
            />
          )}
          {activeTab === 'products' && (
            <ProductsTab
              products={data.products}
              onAddProduct={() => setShowAddProduct(true)}
              loading={loading}
              token={token}
              user={user}
              categories={data.categories}
              suppliers={data.suppliers}
              toast={toast}
              canCreate={hasPermission('products.create')}
              canEdit={hasPermission('products.edit')}
              canDelete={hasPermission('products.delete')}
              onProductDeleted={(id) => setData(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }))}
              onProductUpdated={(updated) => setData(prev => ({
                ...prev,
                products: prev.products.map(p => p.id === updated.id ? updated : p)
              }))}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesTab
              categories={data.categories}
              loading={loading}
              token={token}
              canCreate={hasPermission('categories.create')}
              canEdit={hasPermission('categories.edit')}
              canDelete={hasPermission('categories.delete')}
              onCategoryAdded={cat => setData(prev => ({ ...prev, categories: [...prev.categories, cat] }))}
              onCategoryUpdated={cat => setData(prev => ({ ...prev, categories: prev.categories.map(c => c.id === cat.id ? cat : c) }))}
              onCategoryDeleted={id => setData(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }))}
            />
          )}
          {activeTab === 'suppliers' && (
            <SuppliersTab
              suppliers={data.suppliers}
              loading={loading}
              token={token}
              user={user}
              toast={toast}
              canCreate={hasPermission('suppliers.create')}
              canEdit={hasPermission('suppliers.edit')}
              canDelete={hasPermission('suppliers.delete')}
              onSupplierAdded={s => setData(prev => ({ ...prev, suppliers: [...prev.suppliers, s] }))}
              onSupplierUpdated={s => setData(prev => ({ ...prev, suppliers: prev.suppliers.map(x => x.id === s.id ? s : x) }))}
              onSupplierDeleted={id => setData(prev => ({ ...prev, suppliers: prev.suppliers.filter(s => s.id !== id) }))}
            />
          )}
          {activeTab === 'customers' && (
            <CustomersTab
              customers={data.customers}
              loading={loading}
              token={token}
              user={user}
              toast={toast}
              canCreate={hasPermission('customers.create')}
              canEdit={hasPermission('customers.edit')}
              canDelete={hasPermission('customers.delete')}
              onCustomerAdded={customer => setData(prev => ({ ...prev, customers: [...prev.customers, customer] }))}
              onCustomerUpdated={customer => setData(prev => ({ ...prev, customers: prev.customers.map(c => c.id === customer.id ? customer : c) }))}
              onCustomerDeleted={id => setData(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }))}
            />
          )}
          {activeTab === 'sales' && <SalesTab sales={data.sales} loading={loading} onNewSale={() => setActiveTab('pos')} token={token} user={user} canCreate={hasPermission('sales.create')} canEdit={hasPermission('sales.edit')} canDelete={hasPermission('sales.delete')} onSaleDeleted={sale => setData(prev => ({
            ...prev,
            sales: prev.sales.filter(s => s.id !== sale.id),
            products: prev.products.map(p => {
              const item = (sale.sale_items || sale.saleItems || []).find(i => i.product_id === p.id);
              return item ? { ...p, stock: p.stock + Number(item.quantity) } : p;
            }),
          }))} />}
          {activeTab === 'invoices' && (
            <InvoicesTab
              sales={data.sales}
              customers={data.customers}
              user={user}
              token={token}
              toast={toast}
            />
          )}
          {activeTab === 'purchases' && (
            <PurchasesTab
              purchases={data.purchases}
              loading={loading}
              token={token}
              user={user}
              suppliers={data.suppliers}
              products={data.products}
              categories={data.categories}
              toast={toast}
              canCreate={hasPermission('purchases.create')}
              canEdit={hasPermission('purchases.edit')}
              canDelete={hasPermission('purchases.delete')}
              onPurchaseAdded={(p, newProducts) => {
                setData(prev => {
                  const updatedProducts = prev.products.map(prod => {
                    const item = p.purchase_items?.find(i => i.product_id === prod.id);
                    return item ? { ...prod, stock: prod.stock + item.quantity } : prod;
                  });
                  const mergedProducts = newProducts && newProducts.length > 0
                    ? [...updatedProducts, ...newProducts.filter(np => !updatedProducts.some(ep => ep.id === np.id))]
                    : updatedProducts;
                  return {
                    ...prev,
                    purchases: [p, ...prev.purchases],
                    stats: { ...prev.stats, totalPurchases: prev.stats.totalPurchases + parseFloat(p.total_amount || 0) },
                    products: mergedProducts,
                  };
                });
              }}
              onPurchaseUpdated={(updated) => {
                setData(prev => ({
                  ...prev,
                  purchases: prev.purchases.map(p => p.id === updated.id ? updated : p),
                }));
              }}
              onPurchaseDeleted={(id, deletedPurchase) => {
                setData(prev => ({
                  ...prev,
                  purchases: prev.purchases.filter(p => p.id !== id),
                  stats: { ...prev.stats, totalPurchases: prev.stats.totalPurchases - parseFloat(deletedPurchase?.total_amount || 0) },
                  // Reverse stock
                  products: prev.products.map(prod => {
                    const item = (deletedPurchase?.purchase_items || []).find(i => i.product_id === prod.id);
                    return item ? { ...prod, stock: Math.max(0, prod.stock - item.quantity) } : prod;
                  }),
                }));
              }}
            />
          )}
          {activeTab === 'reports' && <ReportsTab data={data} loading={loading} token={token} />}
          {activeTab === 'ai' && <AiTab token={token} data={data} />}
          {activeTab === 'stock-movements' && <StockMovementsTab token={token} products={data.products} canCreate={hasPermission('stock.view')} />}
          {activeTab === 'users' && (isOwnerOrAdmin || hasPermission('users.view') || hasPermission('roles.view')) && (
            <UsersTab token={token} user={user} toast={toast}
              canCreate={isOwnerOrAdmin || hasPermission('users.create')}
              canEdit={isOwnerOrAdmin || hasPermission('users.edit')}
              canDelete={isOwnerOrAdmin || hasPermission('users.delete')}
              canViewRoles={isOwnerOrAdmin || hasPermission('roles.view')} />
          )}
          {activeTab === 'settings' && (isOwnerOrAdmin || hasPermission('users.view') || hasPermission('roles.view')) && (
            <Settings user={user} token={token} toast={toast} onBusinessInfoUpdate={onUserUpdate} />
          )}
                  </ErrorBoundary>
        </main>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        title="Add New Product"
        size="lg"
      >
        <AddProductForm
          token={token}
          tenantId={user.tenant_id}
          categories={data.categories}
          suppliers={data.suppliers}
          onSuccess={(p) => { handleAddProduct(p); toast.success('Product added', `"${p.name}" added to inventory.`); }}
          onCancel={() => setShowAddProduct(false)}
        />
      </Modal>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* Mobile Bottom Navigation */}
      <nav className="mob-bottom-nav" aria-label="Mobile navigation">
        <div className="mob-bottom-nav-inner">
          {/* Always show: Overview, POS (if allowed), Products, Sales, more via sidebar */}
          <button
            className={`mob-bottom-nav-item${activeTab === 'overview' ? ' active' : ''}`}
            onClick={() => setActiveTab('overview')}
            aria-label="Overview"
          >
            <span>📊</span>
            <span>Home</span>
          </button>
          {hasPermission('sales.create') && (
            <button
              className={`mob-bottom-nav-item${activeTab === 'pos' ? ' active' : ''}`}
              onClick={() => setActiveTab('pos')}
              aria-label="Point of Sale"
            >
              <span>🖥️</span>
              <span>POS</span>
            </button>
          )}
          {hasPermission('products.view') && (
            <button
              className={`mob-bottom-nav-item${activeTab === 'products' ? ' active' : ''}`}
              onClick={() => setActiveTab('products')}
              aria-label="Products"
            >
              <span>📦</span>
              <span>Products</span>
            </button>
          )}
          {hasPermission('sales.view') && (
            <button
              className={`mob-bottom-nav-item${activeTab === 'sales' ? ' active' : ''}`}
              onClick={() => setActiveTab('sales')}
              aria-label="Sales"
            >
              <span>💰</span>
              <span>Sales</span>
            </button>
          )}
          <button
            className="mob-bottom-nav-item"
            onClick={() => setMobileNavOpen(true)}
            aria-label="More menu"
          >
            <span>☰</span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
