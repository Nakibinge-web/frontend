import React, { useState, useEffect, useCallback, useRef } from 'react';
import { theme } from './styles/theme';
import DashboardCard from './components/ui/DashboardCard';
import DataTable from './components/ui/DataTable';
import Badge from './components/ui/Badge';
import EmptyState from './components/ui/EmptyState';
import Button from './components/ui/Button';
import Modal from './components/ui/Modal';
import QuickActions from './components/ui/QuickActions';
import AddProductForm from './components/AddProductForm';
import EditProductForm from './components/EditProductForm';
import { ToastContainer, useToast } from './components/ui/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// ── Floating AI Chat Widget ──────────────────────────────────────────────────
function FloatingAiChat({ token, data }) {
  const [isOpen, setIsOpen] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm your AI business analyst. Ask me anything about your business data.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const bottomRef = useRef(null);
  const cooldownRef = useRef(null);

  const QUICK_PROMPTS = [
    { label: 'Sales performance', icon: '📊', text: 'How did my sales perform this month?' },
    { label: 'Top products', icon: '🏆', text: 'Which are my top 5 products by revenue?' },
    { label: 'Low stock', icon: '⚠️', text: 'Which products are running low on stock?' },
  ];

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  const startCooldown = (seconds) => {
    setCooldown(seconds);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const send = async (questionText) => {
    const q = (questionText ?? input).trim();
    if (!q || loading || cooldown > 0) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ai/chat`, { method: 'POST', headers, body: JSON.stringify({ question: q }) });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg = res.status === 429
          ? '⏳ Rate limited. Please wait 30 seconds.'
          : json.message || 'AI service error.';
        setMessages(prev => [...prev, { role: 'assistant', text: msg }]);
        if (res.status === 429) startCooldown(30);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: json.answer }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Could not reach server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );
      const isBullet = line.startsWith('- ') || line.startsWith('• ');
      if (isBullet) {
        return <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 2 }}><span style={{ color: '#4f46e5' }}>•</span><span>{parts}</span></div>;
      }
      return <div key={i} style={{ marginBottom: line ? 3 : 6 }}>{parts}</div>;
    });
  };

  return (
    <>
      {/* Chat panel overlay */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 90,
          right: 20,
          width: 420,
          maxHeight: 600,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            padding: '16px 20px',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 22 }}>🤖</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>AI Assistant</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Powered by Mistral AI</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                width: 28,
                height: 28,
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 300,
            maxHeight: 400,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: msg.role === 'user' ? '#4f46e5' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  flexShrink: 0,
                }}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div style={{
                  maxWidth: '75%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                  background: msg.role === 'user' ? '#4f46e5' : '#f8fafc',
                  border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                  color: msg.role === 'user' ? '#fff' : '#0f172a',
                  fontSize: 13,
                  lineHeight: '1.5',
                }}>
                  {renderText(msg.text)}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}>
                  🤖
                </div>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '4px 12px 12px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  gap: 4,
                }}>
                  {[0, 1, 2].map(d => (
                    <div key={d} style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#94a3b8',
                      animation: `aiPulse 1.2s ease-in-out ${d * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div style={{ padding: '0 16px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_PROMPTS.map(p => (
              <button
                key={p.label}
                onClick={() => send(p.text)}
                disabled={loading || cooldown > 0}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#475569',
                  cursor: loading || cooldown > 0 ? 'not-allowed' : 'pointer',
                  opacity: loading || cooldown > 0 ? 0.5 : 1,
                }}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #f1f5f9' }}>
            {cooldown > 0 && (
              <div style={{
                marginBottom: 8,
                padding: '6px 10px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 6,
                fontSize: 11,
                color: '#92400e',
              }}>
                ⏳ Ready in {cooldown}s
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(); }}
                placeholder="Ask anything..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading || cooldown > 0}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: input.trim() && !loading && !cooldown ? '#4f46e5' : '#e2e8f0',
                  color: input.trim() && !loading && !cooldown ? '#fff' : '#94a3b8',
                  cursor: input.trim() && !loading && !cooldown ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          border: 'none',
          color: '#fff',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(79,70,229,0.5)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,70,229,0.4)';
        }}
      >
        {isOpen ? '✕' : '🤖'}
      </button>
    </>
  );
}

export default function Dashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { toasts, toast, remove } = useToast();
  const [businessName, setBusinessName] = useState(user.tenant?.name || 'Business');

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

      const [productsRes, categoriesRes, suppliersRes, customersRes, salesRes, purchasesRes, lowStockRes, stockMovementsRes, tenantRes] = await Promise.all([
        fetch(`${API}/products?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/categories?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/suppliers?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/customers?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/sales?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/purchases?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/products/low-stock?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/stock-movements?tenant_id=${user.tenant_id}`, { headers }),
        fetch(`${API}/tenants/${user.tenant_id}`, { headers }),
      ]);

      const [products, categories, suppliers, customers, sales, purchases, lowStock, stockMovements, tenant] = await Promise.all([
        safeJson(productsRes),
        safeJson(categoriesRes),
        safeJson(suppliersRes),
        safeJson(customersRes),
        safeJson(salesRes),
        safeJson(purchasesRes),
        safeJson(lowStockRes),
        safeJson(stockMovementsRes),
        safeJson(tenantRes),
      ]);

      // Update business name from tenant data
      if (tenant.data && tenant.data.name) {
        setBusinessName(tenant.data.name);
      }

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

  const handleAddProduct = (newProducts) => {
    const arr = Array.isArray(newProducts) ? newProducts : [newProducts];
    setData(prev => ({
      ...prev,
      products: [...prev.products, ...arr],
      stats: {
        ...prev.stats,
        totalProducts: prev.stats.totalProducts + arr.length,
      }
    }));
    setShowAddProduct(false);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    ...(isOwnerOrAdmin || hasPermission('users.view') || hasPermission('roles.view') ? [{ id: 'users', label: 'Users', icon: '🔑', color: 'primary' }] : []),
    ...(isOwnerOrAdmin ? [{ id: 'settings', label: 'Settings', icon: '⚙️', color: 'neutral' }] : []),
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
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div style={styles.logoContainer}>
            <img 
              src="/zziwa logo.png" 
              alt="Zziwa & Sons Logo" 
              style={{ 
                width: 36, 
                height: 36, 
                objectFit: 'contain', 
                background: '#ffffff', 
                padding: '4px', 
                borderRadius: 8, 
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }} 
            />
          </div>
          <Badge variant="primary" size="sm">
            {businessName}
          </Badge>
        </div>

        <div style={styles.headerCenter} className="header-search">
          <div style={{ ...styles.searchContainer, position: 'relative' }}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search products, suppliers, customers..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
            />
            {searchOpen && searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 1000,
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
              }}>
                {searchResults.map((r, i) => (
                  <div key={i} onMouseDown={() => goToResult(r)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                    cursor: 'pointer', borderBottom: i < searchResults.length - 1 ? '1px solid #f8fafc' : 'none',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
                      {r.sub && <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.sub}</div>}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#4f46e5', background: '#ede9fe', padding: '2px 8px', borderRadius: 20 }}>{r.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={styles.headerRight}>
          <div 
            style={{ ...styles.notificationIcon, color: '#94a3b8', fontSize: '18px', position: 'relative', cursor: 'pointer' }}
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
                  <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>×</button>
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
          <Button variant="danger" size="sm" onClick={onLogout}>
            <span className="logout-text-long">Logout</span>
            <span className="logout-text-short">✕</span>
          </Button>
        </div>
      </header>

      <div style={styles.container} className="dash-container">
        {/* Sidebar */}
        <nav style={styles.sidebar} className={`dash-sidebar${mobileNavOpen ? ' open' : ''}`}>
          <div style={{ padding: '20px 12px 12px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Close button — mobile only */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', margin: 0 }}>
                Main Menu
              </p>
              <button
                className="ham-btn"
                onClick={() => setMobileNavOpen(false)}
                style={{ marginLeft: 'auto' }}
                aria-label="Close navigation"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Main nav items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {menuItems.filter(i => i.id !== 'users').map(item => (
                <button
                  key={item.id}
                  style={{
                    ...styles.menuItem,
                    ...(activeTab === item.id ? styles.menuItemActive : {})
                  }}
                  onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}
                  onMouseEnter={e => { if (activeTab !== item.id) { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#f1f5f9'; } }}
                  onMouseLeave={e => { if (activeTab !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
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
                <div style={{ height: 1, background: '#1e293b', margin: '12px 8px 14px' }} />
                <p style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 8 }}>
                  Administration
                </p>
                <button
                  style={{
                    ...styles.menuItem,
                    ...(activeTab === 'users' ? styles.menuItemActive : {})
                  }}
                  onClick={() => { setActiveTab('users'); setMobileNavOpen(false); }}
                  onMouseEnter={e => { if (activeTab !== 'users') e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#f1f5f9'; }}
                  onMouseLeave={e => { if (activeTab !== 'users') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
                >
                  <span style={styles.menuIcon}>🔑</span>
                  <span style={styles.menuLabel}>Users</span>
                  {activeTab === 'users' && <div style={styles.activeIndicator} />}
                </button>
                <div style={{ height: 20 }} />
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

          {activeTab === 'overview' && <OverviewTab data={data} loading={loading} onNavigate={setActiveTab} onAddProduct={() => setShowAddProduct(true)}
            canSell={hasPermission('sales.create')}
            canAddProduct={hasPermission('products.create')}
            canAddSupplier={hasPermission('suppliers.create')}
            canRecordPurchase={hasPermission('purchases.create')}
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
                  return {
                    ...prev,
                    sales: [sale, ...prev.sales],
                    stats: { ...prev.stats, totalSales: prev.stats.totalSales + parseFloat(sale.total_amount || 0) },
                    products: prev.products.map(p => {
                      const item = sale.sale_items?.find(i => i.product_id === p.id)
                        || sale.saleItems?.find(i => i.product_id === p.id);
                      return item ? { ...p, stock: p.stock - item.quantity } : p;
                    }),
                    customers: (!customerAlreadyExists && newCustomerEntry)
                      ? [...prev.customers, newCustomerEntry]
                      : prev.customers,
                  };
                });
                toast.success('Sale completed!', `UGX ${parseFloat(sale.total_amount || 0).toLocaleString()} recorded.`);
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
              products={data.products}
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
          {activeTab === 'stock-movements' && <StockMovementsTab token={token} products={data.products} canCreate={hasPermission('stock.view')} />}
          {activeTab === 'users' && (isOwnerOrAdmin || hasPermission('users.view') || hasPermission('roles.view')) && (
            <UsersTab token={token} user={user} toast={toast}
              canCreate={isOwnerOrAdmin || hasPermission('users.create')}
              canEdit={isOwnerOrAdmin || hasPermission('users.edit')}
              canDelete={isOwnerOrAdmin || hasPermission('users.delete')}
              canViewRoles={isOwnerOrAdmin || hasPermission('roles.view')} />
          )}
          {activeTab === 'settings' && isOwnerOrAdmin && (
            <SettingsTab 
              token={token} 
              user={user} 
              toast={toast} 
              onUpdate={fetchData}
              onBusinessNameUpdate={setBusinessName}
            />
          )}
        </main>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        title="Add Products"
        size="lg"
      >
        <AddProductForm
          token={token}
          tenantId={user.tenant_id}
          categories={data.categories}
          suppliers={data.suppliers}
          onSuccess={(p) => { handleAddProduct(p); toast.success('Product added', Array.isArray(p) && p.length > 1 ? `${p.length} products added to inventory.` : `"${Array.isArray(p) ? p[0]?.name : p?.name}" added to inventory.`); }}
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

      {/* Floating AI Assistant */}
      <FloatingAiChat token={token} data={data} />
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data, loading, onNavigate, onAddProduct, canSell = true, canAddProduct = true, canAddSupplier = true, canRecordPurchase = true }) {
  const today = new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const recentSalesColumns = [
    { key: 'sale_date', title: 'Date', type: 'date' },
    { key: 'total_amount', title: 'Amount', type: 'currency' },
    {
      key: 'payment_method', title: 'Payment', render: v => (
        <span style={{
          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: '#f1f5f9', color: '#475569', textTransform: 'capitalize'
        }}>
          {v?.replace(/_/g, ' ') || '—'}
        </span>
      )
    },
    { key: 'user', title: 'Cashier', render: v => v?.name || '—' }
  ];

  const kpi = [
    { label: 'Total Products', value: data.stats.totalProducts, sub: 'Items in inventory', color: 'primary' },
    { label: 'Total Sales', value: `UGX ${data.stats.totalSales.toLocaleString()}`, sub: 'Revenue generated', color: 'success' },
    { label: 'Total Purchases', value: `UGX ${data.stats.totalPurchases.toLocaleString()}`, sub: 'Stock investment', color: 'warning' },
    { label: 'Low Stock Alerts', value: data.stats.lowStockCount, sub: 'Items need reordering', color: 'danger', trend: data.stats.lowStockCount > 0 ? 'up' : 'neutral', tv: data.stats.lowStockCount > 0 ? 'Needs attention' : 'All good' },
  ];

  const quickActions = [
    ...(canSell ? [{ label: 'New Sale', sub: 'Process a sale transaction', action: () => onNavigate('pos'), accent: '#4f46e5' }] : []),
    ...(canAddProduct ? [{ label: 'Add Product', sub: 'Add to your inventory', action: onAddProduct, accent: '#16a34a' }] : []),
    ...(canAddSupplier ? [{ label: 'Add Supplier', sub: 'Register a new vendor', action: () => onNavigate('suppliers'), accent: '#0891b2' }] : []),
    ...(canRecordPurchase ? [{ label: 'Record Purchase', sub: 'Log a supplier order', action: () => onNavigate('purchases'), accent: '#d97706' }] : []),
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '4px 0 32px' }}>

      {/* ── Hero header ───────────────────────────────────── */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '32px 36px', marginBottom: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img 
            src="/zziwa logo.png" 
            alt="Zziwa & Sons Logo" 
            style={{ 
              width: 96, 
              height: 96, 
              objectFit: 'contain', 
              background: '#ffffff', 
              padding: '6px', 
              borderRadius: 18, 
              flexShrink: 0,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
            }} 
          />
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{today}</p>
            <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.5px' }}>
              {greeting} 👋
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', maxWidth: 440, lineHeight: 1.5 }}>
              Here's a live snapshot of your business. Use the quick actions below to get things done fast.
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Today's Sales</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', letterSpacing: '-1px' }}>
            UGX {data.sales
              .filter(s => new Date(s.sale_date).toDateString() === new Date().toDateString())
              .reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0)
              .toLocaleString()}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div className="kpi-grid-4">
        {kpi.map(k => (
          <DashboardCard key={k.label} title={k.label} value={k.value} subtitle={k.sub}
            color={k.color} trend={k.trend} trendValue={k.tv} loading={loading} />
        ))}
      </div>

      {/* ── Quick Actions ──────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Quick Actions
        </h2>
        {quickActions.length > 0 ? (
          <div className="quick-actions-grid" style={{ gridTemplateColumns: `repeat(${quickActions.length}, 1fr)` }}>
            {quickActions.map(q => (
              <button key={q.label} onClick={q.action} style={{
                padding: '18px 20px', borderRadius: 12,
                border: `1.5px solid #e2e8f0`,
                background: '#ffffff', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s', outline: 'none', position: 'relative', overflow: 'hidden',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = q.accent;
                  e.currentTarget.style.background = q.accent + '08';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${q.accent}22`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                {/* Accent dot */}
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: q.accent, marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{q.label}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{q.sub}</div>
              </button>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No quick actions available for your role.</p>
        )}
      </div>

      {/* ── Bottom row: Recent Sales + Low Stock ──────────── */}
      <div className="overview-bottom-grid" style={{ gridTemplateColumns: data.lowStock.length > 0 ? '1fr 340px' : '1fr' }}>

        {/* Recent Sales */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recent Sales</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Last {Math.min(data.sales.length, 5)} transactions</p>
            </div>
            <button onClick={() => onNavigate('sales')} style={{
              fontSize: 12, color: '#6366f1', background: '#ede9fe', border: 'none',
              cursor: 'pointer', fontWeight: 600, padding: '5px 12px', borderRadius: 20,
            }}>
              View all
            </button>
          </div>
          <DataTable
            columns={recentSalesColumns}
            data={data.sales.slice(0, 5)}
            loading={loading}
            emptyStateProps={{
              title: 'No sales recorded yet',
              description: 'Head to the POS to process your first transaction.',
              actionLabel: 'Open POS',
              onAction: () => onNavigate('pos')
            }}
          />
        </div>

        {/* Low Stock */}
        {data.lowStock.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Low Stock</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Needs reordering</p>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                {data.lowStock.length} items
              </span>
            </div>
            <div>
              {data.lowStock.slice(0, 6).map((product, i) => (
                <div key={product.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 22px',
                  borderBottom: i < Math.min(data.lowStock.length, 6) - 1 ? '1px solid #f8fafc' : 'none',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Min: {product.reorder_level} units</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>{product.stock}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>in stock</div>
                  </div>
                </div>
              ))}
              {data.lowStock.length > 6 && (
                <div style={{ padding: '12px 22px' }}>
                  <button onClick={() => onNavigate('products')} style={{
                    fontSize: 12, color: '#6366f1', background: 'none', border: 'none',
                    cursor: 'pointer', fontWeight: 600, padding: 0,
                  }}>
                    +{data.lowStock.length - 6} more items →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Products Tab Component
function ProductsTab({ products, onAddProduct, loading, token, user, onProductDeleted, categories, suppliers, onProductUpdated, toast, canCreate = true, canEdit = true, canDelete = true }) {
  const API_BASE = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '')
    : 'http://localhost:8000';

  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showExpiry, setShowExpiry] = useState(false);
  const [filters, setFilters] = useState({ search: '', category: '', status: '' });

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  const getStockStatus = (stock, reorder) => {
    const s = Number(stock ?? 0), r = Number(reorder ?? 0);
    if (s === 0) return 'out';
    if (s <= r) return 'low';
    return 'in';
  };

  const filteredProducts = products.filter(p => {
    const search = filters.search.toLowerCase();
    if (search && !p.name?.toLowerCase().includes(search) && !p.sku?.toLowerCase().includes(search)) return false;
    if (filters.category && String(p.category_id) !== String(filters.category)) return false;
    if (filters.status && getStockStatus(p.stock, p.reorder_level) !== filters.status) return false;
    return true;
  });

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${API}/products/${deletingProduct.id}?tenant_id=${user.tenant_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        onProductDeleted(deletingProduct.id);
        toast.success('Product deleted', `"${deletingProduct.name}" has been removed.`);
        setDeletingProduct(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data?.message || 'Failed to delete product.');
      }
    } catch {
      setDeleteError('Error deleting product. Check your connection.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'image_path',
      title: 'Image',
      render: (value, row) => {
        const src = row.image_url || (value ? `${API_BASE}/storage/${value}` : null);
        return src
          ? <img src={src} alt="product"
            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
          : <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" />
            </svg>
          </div>;
      }
    },
    { key: 'name', title: 'Product Name' },
    { key: 'sku', title: 'SKU', render: (value) => value || <span style={{ color: '#94a3b8' }}>—</span> },
    {
      key: 'category',
      title: 'Category',
      render: (value) => value?.name ? <Badge variant="neutral" size="sm">{value.name}</Badge> : 'N/A'
    },
    {
      key: 'stock',
      title: 'Stock',
      render: (value, row) => (
        <span>{value}{row.unit ? ` ${row.unit}` : ''}</span>
      )
    },
    {
      key: 'reorder_level',
      title: 'Reorder Level',
      render: (value) => value ?? '—'
    },
    {
      key: 'price',
      title: 'Price',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>UGX {parseFloat(value || 0).toLocaleString()}</div>
          {row.cost_price != null && (
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Cost: UGX {parseFloat(row.cost_price).toLocaleString()}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, row) => {
        const stock = Number(row.stock ?? 0);
        const reorder = Number(row.reorder_level ?? 0);
        if (stock === 0) {
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca'
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              Out of Stock
            </span>
          );
        }
        if (stock <= reorder) {
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a'
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              Low Stock
            </span>
          );
        }
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: '#f0fdf4', color: '#065f46', border: '1px solid #bbf7d0'
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            In Stock
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {canEdit && (
            <button
              onClick={() => setEditingProduct(row)}
              style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid #3b82f6',
                background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 500
              }}
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => { setDeleteError(null); setDeletingProduct(row); }}
              style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid #ef4444',
                background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500
              }}
            >
              Delete
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={styles.pageContainer}>
      {/* Hero header */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inventory Management</p>
          <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.4px' }}>Products</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {products.length} product{products.length !== 1 ? 's' : ''} in your inventory
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowExpiry(true)} style={{
            padding: '9px 18px', borderRadius: 8, border: '1px solid #334155',
            background: 'transparent', color: '#94a3b8', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#a5b4fc'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}>
            Expiry Tracker
          </button>
          {canCreate && (
            <button onClick={onAddProduct} style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: '#4f46e5', color: '#fff', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#4338ca'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#4f46e5'; }}>
              + Add Product
            </button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {!loading && products.length > 0 && (
        <div className="stats-grid-4">
          {[
            { label: 'Total Products', value: products.length, color: '#4f46e5' },
            { label: 'In Stock', value: products.filter(p => Number(p.stock) > Number(p.reorder_level || 0)).length, color: '#16a34a' },
            { label: 'Low Stock', value: products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= Number(p.reorder_level || 0)).length, color: '#d97706' },
            { label: 'Out of Stock', value: products.filter(p => Number(p.stock) === 0).length, color: '#dc2626' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', borderTop: `3px solid ${s.color}` }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div style={styles.contentCard}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <input
            style={{ ...fS.input, flex: '1 1 220px' }}
            placeholder="Search by name or SKU…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
          <select style={fS.select} value={filters.category} onChange={e => setFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select style={fS.select} value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          {(filters.search || filters.category || filters.status) && (
            <button style={fS.clear} onClick={() => setFilters({ search: '', category: '', status: '' })}>
              Clear filters
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={filteredProducts}
          loading={loading}
          emptyStateProps={{
            title: filters.search || filters.category || filters.status ? 'No products match your filters' : 'No products yet',
            description: filters.search || filters.category || filters.status ? 'Try adjusting or clearing your filters.' : 'Start building your inventory by adding your first product.',
            actionLabel: filters.search || filters.category || filters.status ? 'Clear Filters' : 'Add First Product',
            onAction: filters.search || filters.category || filters.status ? () => setFilters({ search: '', category: '', status: '' }) : onAddProduct
          }}
        />
      </div>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Edit Product"
        size="lg"
      >
        {editingProduct && (
          <EditProductForm
            token={token}
            product={editingProduct}
            categories={categories}
            suppliers={suppliers}
            onSuccess={(updated) => {
              onProductUpdated(updated);
              setEditingProduct(null);
            }}
            onCancel={() => setEditingProduct(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingProduct}
        onClose={() => { setDeletingProduct(null); setDeleteError(null); }}
        title="Delete Product"
        size="sm"
      >
        {deletingProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 10
            }}>
              <span style={{ fontSize: 28 }}>🗑️</span>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 15 }}>
                  {deletingProduct.name}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  This action cannot be undone. The product and all its data will be permanently removed.
                </div>
              </div>
            </div>

            {deleteError && (
              <div style={{
                padding: '10px 14px', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: 8,
                color: '#b91c1c', fontSize: 13
              }}>
                ⚠️ {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setDeletingProduct(null); setDeleteError(null); }}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={deleteLoading}
                onClick={handleDelete}
                style={{ flex: 1 }}
              >
                {deleteLoading ? 'Deleting…' : 'Delete Product'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Expiry Goods Modal */}
      <Modal
        isOpen={showExpiry}
        onClose={() => setShowExpiry(false)}
        title="⏳ Expiry Goods Tracker"
        size="lg"
      >
        <ExpiryGoodsView products={products} />
      </Modal>
    </div>
  );
}

// Expiry Goods View Component
function ExpiryGoodsView({ products }) {
  const now = new Date();

  const expiryProducts = products
    .filter(p => p.track_expiry && p.expiry_date)
    .map(p => {
      const expiry = new Date(p.expiry_date);
      const diffMs = expiry - now;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { ...p, diffDays, expiry };
    })
    .sort((a, b) => a.diffDays - b.diffDays);

  const getStatus = (days) => {
    if (days < 0) return { label: 'Expired', variant: 'danger', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' };
    if (days <= 7) return { label: 'Critical', variant: 'danger', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' };
    if (days <= 30) return { label: 'Expiring Soon', variant: 'warning', color: '#92400e', bg: '#fffbeb', border: '#fde68a' };
    return { label: 'Good', variant: 'success', color: '#065f46', bg: '#f0fdf4', border: '#bbf7d0' };
  };

  const getTimeLabel = (days) => {
    if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
    if (days === 0) return 'Expires today!';
    if (days === 1) return '1 day remaining';
    if (days < 30) return `${days} days remaining`;
    const months = Math.floor(days / 30);
    const rem = days % 30;
    return rem > 0 ? `${months}mo ${rem}d remaining` : `${months} month${months !== 1 ? 's' : ''} remaining`;
  };

  if (expiryProducts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontWeight: 600, fontSize: 16, color: '#0f172a' }}>No expiry-tracked products</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          Enable "Track Expiry" on a product to monitor it here.
        </div>
      </div>
    );
  }

  const expired = expiryProducts.filter(p => p.diffDays < 0).length;
  const critical = expiryProducts.filter(p => p.diffDays >= 0 && p.diffDays <= 7).length;
  const soon = expiryProducts.filter(p => p.diffDays > 7 && p.diffDays <= 30).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {expired > 0 && <span style={exS.pill('#fef2f2', '#fecaca', '#b91c1c')}>🚫 {expired} Expired</span>}
        {critical > 0 && <span style={exS.pill('#fef2f2', '#fecaca', '#dc2626')}>🔴 {critical} Critical (≤7 days)</span>}
        {soon > 0 && <span style={exS.pill('#fffbeb', '#fde68a', '#92400e')}>🟡 {soon} Expiring Soon (≤30 days)</span>}
        <span style={exS.pill('#f0fdf4', '#bbf7d0', '#065f46')}>
          ✅ {expiryProducts.length - expired - critical - soon} Good
        </span>
      </div>

      {/* Product rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
        {expiryProducts.map(p => {
          const st = getStatus(p.diffDays);
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px', borderRadius: 10,
              background: st.bg, border: `1px solid ${st.border}`,
            }}>
              {/* Status bar */}
              <div style={{
                width: 4, alignSelf: 'stretch', borderRadius: 4,
                background: st.color, flexShrink: 0,
              }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {p.sku ? `SKU: ${p.sku} · ` : ''}
                  Stock: {p.stock}{p.unit ? ` ${p.unit}` : ''} ·{' '}
                  Expires: {new Date(p.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {p.manufacture_date && ` · Mfg: ${new Date(p.manufacture_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                </div>
              </div>

              {/* Time remaining badge */}
              <div style={{
                flexShrink: 0, padding: '4px 12px', borderRadius: 20,
                background: st.color, color: '#fff',
                fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
              }}>
                {getTimeLabel(p.diffDays)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

// Categories Tab Component
function CategoriesTab({ categories, loading, token, canCreate = true, canEdit = true, canDelete = true, onCategoryAdded, onCategoryUpdated, onCategoryDeleted }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [deletingCat, setDeletingCat] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteError, setDeleteError] = useState(null);

  const openAdd = () => { setForm({ name: '', description: '' }); setFormError(null); setFieldErrors({}); setShowAddModal(true); };
  const openEdit = (cat) => { setForm({ name: cat.name, description: cat.description || '' }); setFormError(null); setFieldErrors({}); setEditingCat(cat); };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    // Custom validation
    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Category name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    } else if (form.name.trim().length > 100) {
      errors.name = 'Category name must not exceed 100 characters';
    }
    
    if (form.description && form.description.length > 500) {
      errors.description = 'Description must not exceed 500 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please fix the errors below');
      setSaving(false);
      return;
    }

    const isEdit = !!editingCat;
    try {
      const res = await fetch(
        isEdit ? `${API}/categories/${editingCat.id}` : `${API}/categories`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setFormError(data?.message || `Error ${res.status}`); }
      else {
        if (isEdit) { onCategoryUpdated(data.data); setEditingCat(null); }
        else { onCategoryAdded(data.data); setShowAddModal(false); }
        setForm({ name: '', description: '' });
      }
    } catch {
      setFormError('Failed to save. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCat) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${API}/categories/${deletingCat.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });
      if (res.ok) {
        onCategoryDeleted(deletingCat.id);
        setDeletingCat(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data?.message || 'Failed to delete category.');
      }
    } catch {
      setDeleteError('Error deleting category. Check your connection.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const categoryFormJsx = (onCancel) => (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={catS.label}>Category Name *</label>
        <input
          style={{ ...catS.input, borderColor: fieldErrors.name ? '#dc2626' : '#e2e8f0' }}
          placeholder="e.g. Electronics"
          value={form.name}
          onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null })); }}
          autoFocus
        />
        {fieldErrors.name && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 2 }}>{fieldErrors.name}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={catS.label}>Description (optional)</label>
        <textarea
          style={{ ...catS.input, minHeight: 80, resize: 'vertical', borderColor: fieldErrors.description ? '#dc2626' : '#e2e8f0' }}
          placeholder="Brief description of this category…"
          value={form.description}
          onChange={e => { setForm(f => ({ ...f, description: e.target.value })); if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: null })); }}
        />
        {fieldErrors.description && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 2 }}>{fieldErrors.description}</span>}
      </div>
      {formError && <div style={catS.error}>{formError}</div>}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <Button type="button" variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving} style={{ flex: 1 }}>
          {saving ? 'Saving…' : editingCat ? 'Save Changes' : 'Add Category'}
        </Button>
      </div>
    </form>
  );

  return (
    <div style={styles.pageContainer}>
      {/* Hero header */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inventory</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Categories</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} — organise your products into logical groups
          </p>
        </div>
        {canCreate && (
          <button onClick={openAdd} style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: '#4f46e5', color: '#fff', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
            onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
            + Add Category
          </button>
        )}
      </div>

      {loading ? (
        <div style={styles.cardsGrid}>
          {[...Array(6)].map((_, i) => <div key={i} style={styles.skeletonCard} />)}
        </div>
      ) : categories.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState
            title="No categories yet"
            description="Create categories to organise your products better."
            actionLabel={canCreate ? "Add First Category" : undefined}
            onAction={canCreate ? openAdd : undefined}
          />
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {categories.map((category, idx) => {
            const colors = ['#4f46e5', '#16a34a', '#0891b2', '#d97706', '#dc2626', '#7c3aed'];
            const accent = colors[idx % colors.length];
            return (
              <div key={category.id} style={{
                ...styles.categoryCard,
                borderTop: `3px solid ${accent}`,
              }}>
                <h3 style={styles.categoryTitle}>{category.name}</h3>
                <p style={styles.categoryDescription}>
                  {category.description || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No description</span>}
                </p>
                <div style={{ ...styles.categoryFooter, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={styles.categoryDate}>
                    {new Date(category.created_at).toLocaleDateString()}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {canEdit && <button onClick={() => openEdit(category)} style={catS.editBtn}>Edit</button>}
                    {canDelete && <button onClick={() => { setDeleteError(null); setDeletingCat(category); }} style={catS.deleteBtn}>Delete</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Category Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Category" size="sm">
        {categoryFormJsx(() => setShowAddModal(false))}
      </Modal>

      {/* Edit Category Modal */}
      <Modal isOpen={!!editingCat} onClose={() => setEditingCat(null)} title="Edit Category" size="sm">
        {categoryFormJsx(() => setEditingCat(null))}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingCat}
        onClose={() => { setDeletingCat(null); setDeleteError(null); }}
        title="Delete Category"
        size="sm"
      >
        {deletingCat && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, marginBottom: 4 }}>{deletingCat.name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                This will permanently delete the category. Products in this category will not be deleted.
              </div>
            </div>
            {deleteError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                {deleteError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="button" variant="secondary"
                onClick={() => { setDeletingCat(null); setDeleteError(null); }}
                style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button type="button" variant="danger" loading={deleteLoading} onClick={handleDelete} style={{ flex: 1 }}>
                {deleteLoading ? 'Deleting…' : 'Delete Category'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

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

// Suppliers Tab Component
function SuppliersTab({ suppliers, loading, token, user, toast, onSupplierAdded, onSupplierUpdated, onSupplierDeleted, canCreate = true, canEdit = true, canDelete = true }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const EMPTY_FORM = { name: '', contact: '', email: '', address: '' };
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const openEdit = (supplier) => {
    setEditTarget(supplier);
    setForm({ name: supplier.name, contact: supplier.contact || '', email: supplier.email || '', address: supplier.address || '' });
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const handleDelete = async (supplier) => {
    if (!window.confirm(`Delete supplier "${supplier.name}"? This cannot be undone.`)) return;
    setDeletingId(supplier.id);
    try {
      const res = await fetch(`${API_URL}/suppliers/${supplier.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to delete supplier');
      onSupplierDeleted(supplier.id);
      toast.success('Supplier deleted', `"${supplier.name}" has been removed.`);
    } catch (e) {
      toast.error('Delete failed', e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    // Custom validation
    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Supplier name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Supplier name must be at least 2 characters';
    } else if (form.name.trim().length > 100) {
      errors.name = 'Supplier name must not exceed 100 characters';
    }
    
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (form.contact && form.contact.trim() && !/^[\d\s\+\-\(\)]+$/.test(form.contact)) {
      errors.contact = 'Invalid phone number format';
    }
    
    if (form.address && form.address.length > 500) {
      errors.address = 'Address must not exceed 500 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please fix the errors below');
      setSaving(false);
      return;
    }

    try {
      const isEdit = !!editTarget;
      const url = isEdit ? `${API_URL}/suppliers/${editTarget.id}` : `${API_URL}/suppliers`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: JSON.stringify({ 
          name: form.name.trim(), 
          contact: form.contact.trim(), 
          email: form.email.trim(), 
          address: form.address.trim(), 
          tenant_id: user.tenant_id 
        }),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json?.message || 'Something went wrong.'); return; }
      isEdit ? onSupplierUpdated(json.data) : onSupplierAdded(json.data);
      toast.success(isEdit ? 'Supplier updated' : 'Supplier added', `"${json.data.name}" has been ${isEdit ? 'updated' : 'added'}.`);
      setShowModal(false);
    } catch {
      setFormError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.contact?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.pageContainer}>
      {/* Hero header */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Procurement</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Suppliers</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {suppliers.length} {suppliers.length === 1 ? 'supplier' : 'suppliers'} — manage your vendor relationships
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {suppliers.length > 0 && (
            <input
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', width: 220 }}
              placeholder="Search suppliers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          )}
          {canCreate && (
            <button onClick={openAdd} style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
              onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
              + Add Supplier
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={styles.cardsGrid}>
          {[...Array(6)].map((_, i) => <div key={i} style={styles.skeletonCard} />)}
        </div>
      ) : suppliers.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState title="No suppliers yet" description="Add suppliers to track where you purchase your products." actionLabel={canCreate ? "Add First Supplier" : undefined} onAction={canCreate ? openAdd : undefined} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.contentCard}>
          <EmptyState title="No suppliers match your search" description="Try a different name, email, or contact." actionLabel="Clear Search" onAction={() => setSearch('')} />
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {filtered.map(supplier => (
            <div key={supplier.id} style={{ ...styles.supplierCard, transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#ede9fe', color: '#4f46e5', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {supplier.name?.charAt(0).toUpperCase()}
                </div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{supplier.name}</h3>
              </div>
              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Phone', value: supplier.contact },
                  { label: 'Email', value: supplier.email },
                  { label: 'Address', value: supplier.address },
                ].map(d => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', width: 52, flexShrink: 0, paddingTop: 1 }}>{d.label}</span>
                    <span style={{ fontSize: 13, color: d.value ? '#0f172a' : '#cbd5e1', fontStyle: d.value ? 'normal' : 'italic' }}>{d.value || '—'}</span>
                  </div>
                ))}
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                {canEdit && (
                  <button onClick={() => openEdit(supplier)} style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(supplier)} disabled={deletingId === supplier.id} style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    {deletingId === supplier.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? 'Edit Supplier' : 'Add New Supplier'}
        size="lg"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Row 1: Name (full width) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={supS.label}>Supplier Name *</label>
            <input style={{ ...supS.input, borderColor: fieldErrors.name ? '#dc2626' : '#e2e8f0' }} placeholder="e.g. Kampala Distributors" value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null })); }} />
            {fieldErrors.name && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4 }}>{fieldErrors.name}</span>}
          </div>
          {/* Row 2: Contact + Email side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={supS.label}>Contact / Phone</label>
              <input style={{ ...supS.input, borderColor: fieldErrors.contact ? '#dc2626' : '#e2e8f0' }} placeholder="+256 700 000 000" value={form.contact}
                onChange={e => { setForm(f => ({ ...f, contact: e.target.value })); if (fieldErrors.contact) setFieldErrors(prev => ({ ...prev, contact: null })); }} />
              {fieldErrors.contact && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4 }}>{fieldErrors.contact}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={supS.label}>Email</label>
              <input style={{ ...supS.input, borderColor: fieldErrors.email ? '#dc2626' : '#e2e8f0' }} type="email" placeholder="supplier@example.com" value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null })); }} />
              {fieldErrors.email && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4 }}>{fieldErrors.email}</span>}
            </div>
          </div>
          {/* Row 3: Address (full width) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={supS.label}>Address</label>
            <input style={{ ...supS.input, borderColor: fieldErrors.address ? '#dc2626' : '#e2e8f0' }} placeholder="Street, City, Country" value={form.address}
              onChange={e => { setForm(f => ({ ...f, address: e.target.value })); if (fieldErrors.address) setFieldErrors(prev => ({ ...prev, address: null })); }} />
            {fieldErrors.address && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4 }}>{fieldErrors.address}</span>}
          </div>

          {formError && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
              ⚠️ {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Supplier'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Customers Tab Component
function CustomersTab({ customers, loading, token, user, toast, onCustomerAdded, onCustomerUpdated, onCustomerDeleted, canCreate = true, canEdit = true, canDelete = true }) {
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // customer pending deletion
  const [search, setSearch] = useState('');

  const openAdd = () => {
    setEditTarget(null);
    setForm({ name: '', phone: '', email: '', status: 'active' });
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const openEdit = (customer) => {
    setEditTarget(customer);
    setForm({ name: customer.name, phone: customer.phone || '', email: customer.email || '', status: customer.status || 'active' });
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const handleDelete = async (customer) => {
    setDeletingId(customer.id);
    try {
      const res = await fetch(`${API}/customers/${customer.id}?tenant_id=${user.tenant_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) { const j = await res.json(); toast.error('Delete failed', j?.message || 'Failed to delete.'); return; }
      onCustomerDeleted(customer.id);
      toast.success('Customer deleted', `"${customer.name}" has been removed.`);
    } catch { toast.error('Delete failed', 'Could not reach the server.'); }
    finally { setDeletingId(null); setConfirmDelete(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    // Custom validation
    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Customer name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Customer name must be at least 2 characters';
    } else if (form.name.trim().length > 100) {
      errors.name = 'Customer name must not exceed 100 characters';
    }
    
    if (form.phone && form.phone.trim() && !/^[\d\s\+\-\(\)]+$/.test(form.phone)) {
      errors.phone = 'Invalid phone number format';
    }
    
    if (form.email && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (form.address && form.address.length > 500) {
      errors.address = 'Address must not exceed 500 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please fix the errors below');
      setSaving(false);
      return;
    }

    try {
      const isEdit = !!editTarget;
      const url = isEdit ? `${API}/customers/${editTarget.id}` : `${API}/customers`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: JSON.stringify({ 
          name: form.name.trim(), 
          phone: form.phone.trim(), 
          email: form.email.trim(), 
          address: form.address?.trim() || '',
          status: form.status,
          tenant_id: user.tenant_id 
        }),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json?.message || 'Failed to save customer.'); return; }
      isEdit ? onCustomerUpdated(json.data) : onCustomerAdded(json.data);
      toast.success(isEdit ? 'Customer updated' : 'Customer added', `"${json.data.name}" has been ${isEdit ? 'updated' : 'added'}.`);
      setShowModal(false);
    } catch { setFormError('Could not reach the server.'); }
    finally { setSaving(false); }
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );
  const { paged: pagedCustomers, page: cPage, setPage: setCPage, totalPages: cTotalPages, total: cTotal, pageSize: cPageSize } = usePagination(filtered);

  return (
    <div style={styles.pageContainer}>
      {/* Hero header */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CRM</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Customers</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {customers.length} {customers.length === 1 ? 'customer' : 'customers'} — {customers.filter(c => c.status === 'active').length} active
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {customers.length > 0 && (
            <input
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', width: 220 }}
              placeholder="Search customers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          )}
          {canCreate && (
            <button onClick={openAdd} style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
              onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
              + Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {customers.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <input
            style={{ ...supS.input, maxWidth: 320 }}
            placeholder="🔍  Search by name, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? 'Edit Customer' : 'Add New Customer'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={saving}
              onClick={() => document.getElementById('customer-form')?.requestSubmit()}
            >
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Customer'}
            </Button>
          </>
        }
      >
        <div style={custS.hero}>
          <div style={custS.heroIcon}>
            {form.name ? form.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div>
            <p style={custS.heroTitle}>
              {form.name || (editTarget ? 'Update customer details' : 'New customer profile')}
            </p>
            <p style={custS.heroSub}>
              {editTarget
                ? 'Update contact information and account status.'
                : 'Add a customer to link them to future sales and track purchase history.'}
            </p>
          </div>
        </div>

        <form id="customer-form" onSubmit={handleSubmit} style={custS.form}>
          <div style={custS.section}>
            <p style={custS.sectionTitle}>Contact Information</p>

            <div style={custS.field}>
              <label style={custS.label}>
                Full Name<span style={custS.required}>*</span>
              </label>
              <div style={{ ...custS.inputWrap, borderColor: fieldErrors.name ? '#dc2626' : '#e2e8f0' }} data-input-wrap>
                <span style={custS.inputIcon}>👤</span>
                <input
                  style={custS.input}
                  placeholder="e.g. Jane Nakato"
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null })); }}
                  onFocus={e => focusInputWrap(e, true)}
                  onBlur={e => focusInputWrap(e, false)}
                  autoFocus
                />
              </div>
              {fieldErrors.name && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4, display: 'block' }}>{fieldErrors.name}</span>}
            </div>

            <div style={custS.field}>
              <label style={custS.label}>Phone Number</label>
              <div style={{ ...custS.inputWrap, borderColor: fieldErrors.phone ? '#dc2626' : '#e2e8f0' }} data-input-wrap>
                <span style={custS.inputIcon}>📞</span>
                <input
                  style={custS.input}
                  type="tel"
                  placeholder="+256 700 000 000"
                  value={form.phone}
                  onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: null })); }}
                  onFocus={e => focusInputWrap(e, true)}
                  onBlur={e => focusInputWrap(e, false)}
                />
              </div>
              {fieldErrors.phone ? (
                <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4, display: 'block' }}>{fieldErrors.phone}</span>
              ) : (
                <p style={custS.hint}>Optional — used for receipts and follow-ups</p>
              )}
            </div>

            <div style={custS.field}>
              <label style={custS.label}>Email Address</label>
              <div style={{ ...custS.inputWrap, borderColor: fieldErrors.email ? '#dc2626' : '#e2e8f0' }} data-input-wrap>
                <span style={custS.inputIcon}>✉️</span>
                <input
                  style={custS.input}
                  type="email"
                  placeholder="customer@example.com"
                  value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null })); }}
                  onFocus={e => focusInputWrap(e, true)}
                  onBlur={e => focusInputWrap(e, false)}
                />
              </div>
              {fieldErrors.email && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4, display: 'block' }}>{fieldErrors.email}</span>}
            </div>
          </div>

          <div style={custS.section}>
            <p style={custS.sectionTitle}>Account Status</p>
            <div style={custS.statusRow}>
              {[
                { value: 'active', label: 'Active', icon: '✓' },
                { value: 'inactive', label: 'Inactive', icon: '○' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  style={{
                    ...custS.statusPill,
                    ...(form.status === opt.value ? custS.statusPillActive : {}),
                  }}
                  onClick={() => setForm(f => ({ ...f, status: opt.value }))}
                >
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
            <p style={custS.hint}>
              Inactive customers are hidden from POS customer selection.
            </p>
          </div>

          {formError && (
            <div style={custS.error}>
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}
        </form>
      </Modal>

      {/* ── Customer cards grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <div>Loading customers…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
            {search ? 'No customers match your search' : 'No customers yet'}
          </div>
          {!search && (
            <div style={{ fontSize: 13, marginBottom: 16 }}>Add your first customer to get started.</div>
          )}
          {!search && canCreate && (
            <Button variant="primary" icon="+" iconPosition="left" onClick={openAdd}>Add Customer</Button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {pagedCustomers.map(c => (
              <div key={c.id} style={{
                background: '#fff', borderRadius: 16, padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: '#ede9fe', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  }}>
                    👤
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{c.name}</div>
                </div>

                {/* Contact info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {c.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                      <span>📞</span> {c.phone}
                    </div>
                  )}
                  {c.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                      <span>📧</span> {c.email}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                    <span>🚀</span>
                    <span style={{
                      fontWeight: 600,
                      color: c.status === 'active' ? '#16a34a' : '#64748b',
                    }}>
                      {c.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {canEdit && (
                    <button
                      onClick={() => openEdit(c)}
                      style={{
                        padding: '8px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                        background: '#fff', color: '#0f172a', fontWeight: 600, fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setConfirmDelete(c)}
                      disabled={deletingId === c.id}
                      style={{
                        padding: '8px 18px', borderRadius: 10, border: 'none',
                        background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13,
                        cursor: deletingId === c.id ? 'not-allowed' : 'pointer',
                        opacity: deletingId === c.id ? 0.6 : 1,
                      }}
                    >
                      {deletingId === c.id ? 'Deleting…' : 'Delete'}
                    </button>
                  )}                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {cTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
              <button onClick={() => setCPage(p => Math.max(1, p - 1))} disabled={cPage === 1}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: cPage === 1 ? 'not-allowed' : 'pointer', color: '#64748b', fontWeight: 600 }}>
                ← Prev
              </button>
              <span style={{ fontSize: 13, color: '#64748b' }}>Page {cPage} of {cTotalPages} &nbsp;·&nbsp; {cTotal} customers</span>
              <button onClick={() => setCPage(p => Math.min(cTotalPages, p + 1))} disabled={cPage === cTotalPages}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: cPage === cTotalPages ? 'not-allowed' : 'pointer', color: '#64748b', fontWeight: 600 }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Customer Confirmation Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Customer"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)} style={{ minWidth: 90 }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deletingId === confirmDelete?.id}
              onClick={() => handleDelete(confirmDelete)}
              style={{ minWidth: 120 }}
            >
              Delete
            </Button>
          </div>
        }
      >
        {confirmDelete && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                background: '#fef2f2', border: '2px solid #fecaca',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>
                🗑️
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Delete "{confirmDelete.name}"?
                </p>
                {confirmDelete.email && (
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>{confirmDelete.email}</p>
                )}
              </div>
            </div>
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#b91c1c',
            }}>
              ⚠️ This action is permanent and cannot be undone.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
function POSTab({ products, categories, customers, token, user, onSaleCompleted, canSell = true }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [saleError, setSaleError] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Customer selection state
  const [customerType, setCustomerType] = useState('walk_in');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

  // Discount & tax state
  const [discountValue, setDiscountValue] = useState('');
  const [taxValue, setTaxValue] = useState('');

  // Cash payment state
  const [amountPaid, setAmountPaid] = useState('');
  const [cashNote, setCashNote] = useState('');

  // ── Barcode scanner state ────────────────────────────────
  const barcodeInputRef = useRef(null);
  const [barcodeValue, setBarcodeValue] = useState('');
  const [barcodeFlash, setBarcodeFlash] = useState(null); // 'success' | 'error' | null
  const [barcodeMsg, setBarcodeMsg] = useState('');
  const barcodeTimerRef = useRef(null);
  // Tracks rapid keystrokes to distinguish scanner input from manual typing
  const barcodeLastKeyTime = useRef(0);
  const barcodeAccumRef = useRef('');

  // Auto-focus barcode input when the POS mounts
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // ── Global keydown listener: redirect keystrokes to barcode field
  // even if the user has clicked elsewhere on the page.
  // Only redirects if the active element is not another input/textarea/select.
  useEffect(() => {
    const handleGlobalKey = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isOtherInput = ['input', 'textarea', 'select'].includes(tag) &&
        document.activeElement !== barcodeInputRef.current;
      if (isOtherInput) return;
      if (e.key === 'Tab' || e.key === 'Escape' || e.ctrlKey || e.altKey || e.metaKey) return;
      barcodeInputRef.current?.focus();
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const flashBarcode = (type, msg) => {
    setBarcodeFlash(type);
    setBarcodeMsg(msg);
    clearTimeout(barcodeTimerRef.current);
    barcodeTimerRef.current = setTimeout(() => {
      setBarcodeFlash(null);
      setBarcodeMsg('');
      setBarcodeValue('');
    }, 1800);
  };

  const handleBarcodeScan = (rawValue) => {
    const code = rawValue.trim();
    if (!code) return;

    // Match against barcode field first, then SKU as fallback
    const product = products.find(
      p => (p.barcode && p.barcode.trim() === code) ||
        (p.sku && p.sku.trim().toLowerCase() === code.toLowerCase())
    );

    if (!product) {
      flashBarcode('error', `No product found for "${code}"`);
      return;
    }
    if (Number(product.stock) <= 0) {
      flashBarcode('error', `"${product.name}" is out of stock`);
      return;
    }

    addToCart(product);
    flashBarcode('success', `✓ Added: ${product.name}`);
  };

  // Detect scanner input: scanners fire characters in <50ms bursts then send Enter.
  // If Enter arrives after a rapid burst, treat as a scan (auto-submit).
  // If Enter arrives after slow typing, also submit — keeps manual entry working.
  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeScan(barcodeValue);
      return;
    }
    // Track timing so we know if input was fast (scanner) vs slow (keyboard)
    const now = Date.now();
    barcodeLastKeyTime.current = now;
  };

  const inStockProducts = products.filter(p => Number(p.stock) > 0);

  const filtered = inStockProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // cap at available stock
        return prev.map(i => i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
          : i
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        subtotal: parseFloat(product.price),
        maxStock: product.stock,
      }];
    });
  };

  const updateQty = (product_id, qty) => {
    const n = parseInt(qty, 10);
    if (isNaN(n) || n < 1) return;
    setCart(prev => prev.map(i => i.product_id === product_id
      ? { ...i, quantity: Math.min(n, i.maxStock), subtotal: Math.min(n, i.maxStock) * i.price }
      : i
    ));
  };

  const removeFromCart = (product_id) => setCart(prev => prev.filter(i => i.product_id !== product_id));

  const cartSubtotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const discountAmount = (() => {
    const v = parseFloat(discountValue) || 0;
    return Math.min(v, cartSubtotal);
  })();
  const taxAmount = parseFloat(taxValue) || 0;
  const cartTotal = cartSubtotal - discountAmount + taxAmount;
  const changeAmount = paymentMethod === 'cash'
    ? Math.max(0, (parseFloat(amountPaid) || 0) - cartTotal)
    : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setSaleError(null);
    try {
      const res = await fetch(`${API}/sales`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price })),
          customer_type: customerType,
          ...(customerType === 'existing' && selectedCustomerId ? { customer_id: parseInt(selectedCustomerId) } : {}),
          ...(customerType === 'new' ? { new_customer: newCustomer } : {}),
          discount_type: discountAmount > 0 ? 'fixed' : null,
          discount_amount: discountAmount > 0 ? discountAmount : null,
          tax_amount: taxAmount > 0 ? taxAmount : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSaleError(data?.message || 'Checkout failed.'); return; }
      setLastReceipt({ ...data.data, cartSnapshot: cart, paymentMethod, taxAmount, discountAmount, amountPaid: parseFloat(amountPaid) || cartTotal, changeAmount });
      onSaleCompleted(data.data);
      setCart([]);
      setSearch('');
      setCustomerType('walk_in');
      setSelectedCustomerId('');
      setNewCustomer({ name: '', phone: '', email: '' });
      setCustomerSearch('');
      setDiscountValue('');
      setTaxValue('');
      setAmountPaid('');
      setCashNote('');
    } catch {
      setSaleError('Network error. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (lastReceipt) {
    return (
      <div style={styles.pageContainer}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Success banner */}
          <div style={{ background: 'linear-gradient(135deg, #065f46, #16a34a)', borderRadius: 16, padding: '28px 32px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ margin: '0 0 6px', color: '#fff', fontSize: 22, fontWeight: 700 }}>Sale Complete</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Transaction recorded successfully</p>
          </div>

          {/* Receipt */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24 }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: 14, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{user.tenant?.name || 'InventoryPro'}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{new Date().toLocaleString()}</div>
            </div>
            {lastReceipt.cartSnapshot.map(item => (
              <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '5px 0', color: '#475569' }}>
                <span>{item.name} × {item.quantity}</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>UGX {item.subtotal.toLocaleString()}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: 12, paddingTop: 12 }}>
              {lastReceipt.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#dc2626', marginBottom: 4 }}>
                  <span>Discount</span>
                  <span>− UGX {lastReceipt.discountAmount.toLocaleString()}</span>
                </div>
              )}
              {lastReceipt.taxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', marginBottom: 4 }}>
                  <span>Tax</span>
                  <span>+ UGX {lastReceipt.taxAmount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, marginTop: 4 }}>
                <span>Total</span>
                <span>UGX {parseFloat(lastReceipt.total_amount).toLocaleString()}</span>
              </div>
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: '#64748b', textAlign: 'right', textTransform: 'capitalize' }}>
              Payment: <strong>{lastReceipt.paymentMethod?.replace(/_/g, ' ')}</strong>
            </div>
            {lastReceipt.paymentMethod === 'cash' && (
              <div style={{ marginTop: 8, borderTop: '1px dashed #e2e8f0', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                  <span>Amount Paid</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>UGX {(lastReceipt.amountPaid || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                  <span>Change</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>UGX {(lastReceipt.changeAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setLastReceipt(null)} style={{
            padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#0f172a', cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}>
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '24px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sales</p>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Point of Sale</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Search products, build a cart, and process payment</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Items in cart</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc' }}>{cart.reduce((s, i) => s + i.quantity, 0)}</div>
        </div>
      </div>

      <div className="pos-layout">

        {/* Left — product search & grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Barcode scanner input ── */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📷 Barcode Scanner
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>— scan barcode to add instantly</span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeValue}
                onChange={e => setBarcodeValue(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="Scan barcode or type SKU…"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  border: `2px solid ${barcodeFlash === 'success' ? '#16a34a' : barcodeFlash === 'error' ? '#dc2626' : '#e2e8f0'}`,
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: barcodeFlash === 'success' ? '#f0fdf4' : barcodeFlash === 'error' ? '#fef2f2' : '#fff',
                  color: '#0f172a',
                  transition: 'border-color 0.2s, background 0.2s',
                  letterSpacing: '0.03em',
                }}
              />
              {/* Barcode icon */}
              <svg style={{ position: 'absolute', left: 12, pointerEvents: 'none', opacity: 0.4 }}
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5v14M7 5v14M11 5v14M15 5v10M19 5v14M15 18v1" />
              </svg>
            </div>
            {/* Feedback message */}
            {barcodeFlash && (
              <div style={{
                marginTop: 6, padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: barcodeFlash === 'success' ? '#dcfce7' : '#fee2e2',
                color: barcodeFlash === 'success' ? '#15803d' : '#b91c1c',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {barcodeFlash === 'success' ? '✓' : '✕'} {barcodeMsg}
              </div>
            )}
          </div>

          {/* ── Name / SKU search ── */}
          <input
            style={posS.searchInput}
            placeholder="Search products by name or SKU…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => { /* don't steal focus from barcode field on click */ }}
          />

          {/* Category filter pills */}
          {categories && categories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', border: '1.5px solid',
                  borderColor: selectedCategory === null ? '#16a34a' : '#e2e8f0',
                  background: selectedCategory === null ? '#f0fdf4' : '#fff',
                  color: selectedCategory === null ? '#16a34a' : '#64748b',
                  transition: 'all 0.15s',
                }}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', border: '1.5px solid',
                    borderColor: selectedCategory === cat.id ? '#16a34a' : '#e2e8f0',
                    background: selectedCategory === cat.id ? '#f0fdf4' : '#fff',
                    color: selectedCategory === cat.id ? '#16a34a' : '#64748b',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 36 }}>📦</div>
              <div style={{ marginTop: 8 }}>
                {search || selectedCategory
                  ? 'No products match your filters'
                  : 'No products in stock'}
              </div>
            </div>
          ) : (
            <div className="pos-product-grid">
              {filtered.map(p => (
                <button key={p.id} style={posS.productCard} onClick={() => addToCart(p)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(79,70,229,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
                >
                  {/* Product initial avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontSize: 15, fontWeight: 700, color: '#4f46e5' }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={posS.productName}>{p.name}</div>
                  {p.sku && <div style={posS.productSku}>SKU: {p.sku}</div>}
                  <div style={posS.productPrice}>UGX {parseFloat(p.price).toLocaleString()}</div>
                  <div style={{ marginTop: 6, fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>
                    {p.stock} in stock
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column — customer + cart */}
        <div className="pos-cart-sticky" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>

          {/* Customer Card */}
          <div style={posS.cartPanel}>
            <div style={posS.cartHeader}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Customer</span>
                <span style={{ marginLeft: 6, fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>Optional</span>
              </div>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { value: 'walk_in', label: 'Walk-in Customer' },
                { value: 'existing', label: 'Existing Customer' },
                { value: 'new', label: 'New Customer' },
              ].map(type => (
                <label key={type.value} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${customerType === type.value ? '#4f46e5' : '#e2e8f0'}`,
                  background: customerType === type.value ? '#f5f3ff' : '#fff',
                  transition: 'all 0.15s',
                }}>
                  <input type="radio" name="customerType" value={type.value}
                    checked={customerType === type.value}
                    onChange={() => { setCustomerType(type.value); setSelectedCustomerId(''); setCustomerSearch(''); setNewCustomer({ name: '', phone: '', email: '' }); }}
                    style={{ accentColor: '#4f46e5', width: 15, height: 15 }} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{type.label}</span>
                </label>
              ))}

              {customerType === 'existing' && (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input style={posS.searchInput} placeholder="Search by name or phone…"
                    value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                  <select style={posS.select} value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                    <option value="">— Select customer —</option>
                    {(customers || []).filter(c => c.status === 'active' && (!customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone || '').includes(customerSearch)))
                      .map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
                  </select>
                </div>
              )}

              {customerType === 'new' && (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input style={posS.searchInput} placeholder="Full name *" value={newCustomer.name} onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))} />
                  <input style={posS.searchInput} placeholder="Phone" value={newCustomer.phone} onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))} />
                  <input style={posS.searchInput} placeholder="Email" type="email" value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))} />
                </div>
              )}
            </div>
          </div>

          {/* Cart Card */}
          <div style={posS.cartPanel}>
            <div style={posS.cartHeader}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Cart {cart.length > 0 && <span style={{ marginLeft: 6, padding: '1px 8px', borderRadius: 20, background: '#ede9fe', color: '#4f46e5', fontSize: 12 }}>{cart.length}</span>}</span>
              {cart.length > 0 && <button style={posS.clearBtn} onClick={() => setCart([])}>Clear all</button>}
            </div>

            {cart.length === 0 ? (
              <div style={posS.emptyCart}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Select products to add to cart</div>
              </div>
            ) : (
              <div style={posS.cartItems}>
                {cart.map(item => (
                  <div key={item.product_id} style={posS.cartItem}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={posS.cartItemName}>{item.name}</div>
                      <div style={posS.cartItemPrice}>UGX {item.price.toLocaleString()} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <button style={posS.qtyBtn} onClick={() => updateQty(item.product_id, item.quantity - 1)}>−</button>
                      <input style={posS.qtyInput} type="number" min={1} max={item.maxStock}
                        value={item.quantity} onChange={e => updateQty(item.product_id, e.target.value)} />
                      <button style={posS.qtyBtn} onClick={() => updateQty(item.product_id, item.quantity + 1)}>+</button>
                      <button style={posS.removeBtn} onClick={() => removeFromCart(item.product_id)}>✕</button>
                    </div>
                    <div style={posS.cartItemSubtotal}>UGX {item.subtotal.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={posS.cartFooter}>
              {/* Subtotal row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>UGX {cartSubtotal.toLocaleString()}</span>
              </div>

              {/* Discount */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Discount:</span>
                <input
                  style={posS.discountInput}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                />
              </div>

              {/* Tax */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Tax:</span>
                <input
                  style={posS.discountInput}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={taxValue}
                  onChange={e => setTaxValue(e.target.value)}
                />
              </div>

              {/* Total row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, paddingTop: 10, borderTop: '1px dashed #e2e8f0' }}>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#dc2626' }}>
                    <span>Discount applied</span>
                    <span>− UGX {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a' }}>
                    <span>Tax</span>
                    <span>+ UGX {taxAmount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 18 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: 20, color: '#0f172a' }}>UGX {cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={posS.label}>Payment Method</label>
                <select style={posS.select} value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); setAmountPaid(''); setCashNote(''); }}>
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                </select>
              </div>

              {/* Cash payment panel */}
              {paymentMethod === 'cash' && (
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    💵 Payment (Cash)
                  </div>

                  {/* Amount Paid */}
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Amount Paid</label>
                    <input
                      style={{ ...posS.searchInput, textAlign: 'right', fontWeight: 700, fontSize: 16 }}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                    />
                  </div>

                  {/* Exact Amount shortcut */}
                  <button
                    style={{
                      width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #bfdbfe',
                      background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                    onClick={() => setAmountPaid(cartTotal.toString())}
                  >
                    ≡ Exact Amount
                  </button>

                  {/* Change */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '10px 14px',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Change:</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: (parseFloat(amountPaid) || 0) < cartTotal ? '#dc2626' : '#16a34a' }}>
                      UGX {changeAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Underpayment warning */}
                  {amountPaid !== '' && (parseFloat(amountPaid) || 0) < cartTotal && (
                    <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                      ⚠️ Amount paid is less than total by UGX {(cartTotal - (parseFloat(amountPaid) || 0)).toLocaleString()}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Notes (Optional)</label>
                    <textarea
                      style={{ ...posS.searchInput, resize: 'vertical', minHeight: 64, fontFamily: 'inherit' }}
                      placeholder="Add any notes…"
                      value={cashNote}
                      onChange={e => setCashNote(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {saleError && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>
                  {saleError}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || submitting || !canSell}
                style={{
                  width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                  background: (cart.length === 0 || !canSell) ? '#e2e8f0' : '#16a34a',
                  color: (cart.length === 0 || !canSell) ? '#94a3b8' : '#fff',
                  fontSize: 14, fontWeight: 700, cursor: (cart.length === 0 || !canSell) ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s', letterSpacing: '0.02em',
                }}
                onMouseEnter={e => { if (cart.length > 0 && !submitting && canSell) e.currentTarget.style.background = '#15803d'; }}
                onMouseLeave={e => { if (cart.length > 0 && !submitting && canSell) e.currentTarget.style.background = '#16a34a'; }}
              >
                {!canSell ? 'No permission to sell' : submitting ? 'Processing…' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
  select: {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none',
    background: '#fff', color: '#0f172a', cursor: 'pointer',
  },
  label: {
    fontSize: 11, fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', marginBottom: 6,
  },
  emptyCart: {
    padding: '40px 20px', textAlign: 'center', color: '#94a3b8',
  },
  cartItems: {
    display: 'flex', flexDirection: 'column', gap: 0,
    maxHeight: 340, overflowY: 'auto',
  },
  cartItem: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
    padding: '10px 16px', borderBottom: '1px solid #f8fafc',
  },
  cartItemName: { fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cartItemPrice: { fontSize: 11, color: '#94a3b8' },
  cartItemSubtotal: { fontSize: 13, fontWeight: 700, color: '#0f172a', marginLeft: 'auto' },
  qtyBtn: {
    width: 26, height: 26, borderRadius: 6, border: '1px solid #e2e8f0',
    background: '#f8fafc', cursor: 'pointer', fontSize: 14, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  qtyInput: {
    width: 40, textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: 6,
    padding: '3px 4px', fontSize: 13, fontFamily: 'inherit',
  },
  removeBtn: {
    background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, padding: '2px 4px',
  },
  cartFooter: {
    padding: '14px 16px', borderTop: '1px solid #f1f5f9',
  },
  label: {
    display: 'block', fontSize: 11, fontWeight: 600, color: '#374151',
    textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6,
  },
  select: {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#fff',
    boxSizing: 'border-box',
  },
};

function formatSaleDateTime(saleDate, createdAt) {
  const dateSource = saleDate || createdAt;
  if (!dateSource) return { date: '-', time: '' };
  const d = new Date(dateSource);
  if (isNaN(d.getTime())) return { date: '-', time: '' };
  const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const timeSource = createdAt || saleDate;
  const time = new Date(timeSource).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

// Sales Tab Component
function SalesTab({ sales, loading, onNewSale, token, user, canCreate = true, canEdit = true, canDelete = false, onSaleDeleted }) {
  const [viewingSale, setViewingSale] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [deletingSale, setDeletingSale] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [localSales, setLocalSales] = useState(sales);

  // Keep localSales in sync when parent refreshes
  useEffect(() => setLocalSales(sales), [sales]);

  // Date filter
  const [dateFilter, setDateFilter] = useState('all');

  // Custom day lookup
  const [customDate, setCustomDate] = useState('');
  const [customDaySales, setCustomDaySales] = useState(null);

  // Custom week lookup
  const [customWeekDate, setCustomWeekDate] = useState('');
  const [customWeekSales, setCustomWeekSales] = useState(null);
  const [customWeekRange, setCustomWeekRange] = useState(null);

  const filteredSales = localSales.filter(sale => {
    if (dateFilter === 'all') return true;

    // Parse the date string as local date (YYYY-MM-DD) to avoid UTC offset shifting
    const raw = (sale.sale_date || sale.created_at || '').slice(0, 10); // "YYYY-MM-DD"
    const [y, m, d] = raw.split('-').map(Number);
    const saleDate = new Date(y, m - 1, d); // local midnight

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilter === 'today') {
      return saleDate.getTime() === today.getTime();
    }
    if (dateFilter === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return saleDate >= startOfWeek;
    }
    if (dateFilter === 'month') {
      return saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
    }
    return true;
  });

  const openEdit = (sale) => {
    setEditingSale(sale);
    const items = sale.sale_items || sale.saleItems || [];
    setEditForm({
      payment_method: sale.payment_method || 'cash',
      discount_amount: sale.discount_amount || '',
      tax_amount: sale.tax_amount || '',
      notes: sale.notes || '',
      customer_type: sale.customer ? 'existing' : 'walk_in',
      customer_id: sale.customer?.id || '',
      items: items.map(i => ({
        product_id: i.product_id,
        name: i.product?.name || `Product #${i.product_id}`,
        quantity: i.quantity,
        price: i.price,
      })),
    });
    setEditError(null);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    setEditError(null);
    try {
      const body = {
        payment_method: editForm.payment_method,
        discount_amount: editForm.discount_amount !== '' ? parseFloat(editForm.discount_amount) : null,
        tax_amount: editForm.tax_amount !== '' ? parseFloat(editForm.tax_amount) : null,
        notes: editForm.notes || null,
        customer_type: editForm.customer_type,
        ...(editForm.customer_type === 'existing' && editForm.customer_id
          ? { customer_id: parseInt(editForm.customer_id) }
          : {}),
        items: editForm.items.map(i => ({
          product_id: i.product_id,
          quantity: parseInt(i.quantity),
          price: parseFloat(i.price),
        })),
      };
      const res = await fetch(`${API}/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data?.message || 'Failed to update sale.'); return; }
      setLocalSales(prev => prev.map(s => s.id === data.data.id ? data.data : s));
      setEditingSale(null);
    } catch {
      setEditError('Network error. Check your connection.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${API}/sales/${deletingSale.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data?.message || 'Failed to delete sale.'); return; }
      const deletedSale = deletingSale;
      setLocalSales(prev => prev.filter(s => s.id !== deletedSale.id));
      if (onSaleDeleted) onSaleDeleted(deletedSale);
      setDeletingSale(null);
    } catch {
      setDeleteError('Network error. Check your connection.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'sale_date',
      title: 'Date',
      render: (value, row) => {
        const { date, time } = formatSaleDateTime(value, row.created_at);
        return (
          <div>
            <div style={{ color: '#1e293b', fontWeight: 500 }}>{date}</div>
            {time && <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{time}</div>}
          </div>
        );
      }
    },
    { key: 'total_amount', title: 'Amount', type: 'currency' },
    {
      key: 'payment_method',
      title: 'Payment Method',
      render: (value) => (
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
          textTransform: 'capitalize'
        }}>
          {value?.replace(/_/g, ' ') || '—'}
        </span>
      )
    },
    {
      key: 'customer',
      title: 'Customer',
      render: (value) => value?.name
        ? <Badge variant="primary" size="sm">{value.name}</Badge>
        : <span style={{ color: '#94a3b8' }}>Walk-in Customer</span>
    },
    {
      key: 'sale_items',
      title: 'Items',
      render: (value, row) => {
        const items = value || row.saleItems || [];
        return `${items.length} item${items.length === 1 ? '' : 's'}`;
      }
    },
    {
      key: 'user',
      title: 'Staff',
      render: (value) => value?.name
        ? value.name
        : <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>Deleted user</span>
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            title="View sale details"
            onClick={() => setViewingSale(row)}
            style={{
              padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: '#f8fafc', color: '#0369a1', cursor: 'pointer',
              fontSize: 15, fontWeight: 600, lineHeight: 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
          >
            👁
          </button>
          <button
            title="Generate & View Invoice"
            onClick={() => setViewingInvoice(row)}
            style={{
              padding: '5px 10px', borderRadius: 8, border: '1.5px solid #fbcfe8',
              background: '#fff1f2', color: '#881337', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, lineHeight: 1,
              display: 'flex', alignItems: 'center', gap: 4,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#ffe4e6'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff1f2'}
          >
            📄 Invoice
          </button>
          {canEdit && (
            <button
              title="Edit sale"
              onClick={() => openEdit(row)}
              style={{
                padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                background: '#f8fafc', color: '#b45309', cursor: 'pointer',
                fontSize: 15, fontWeight: 600, lineHeight: 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef3c7'}
              onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
            >
              ✏️
            </button>
          )}
          {canDelete && (
            <button
              title="Delete sale"
              onClick={() => { setDeleteError(null); setDeletingSale(row); }}
              style={{
                padding: '5px 10px', borderRadius: 8, border: '1.5px solid #fecaca',
                background: '#fff5f5', color: '#dc2626', cursor: 'pointer',
                fontSize: 15, fontWeight: 600, lineHeight: 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}
            >
              🗑️
            </button>
          )}
        </div>
      )
    },
  ];

  // ── helpers ──────────────────────────────────────────────
  const detailRow = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
      <span style={{ color: '#64748b', fontWeight: 500 }}>{label}</span>
      <span style={{ color: '#0f172a', fontWeight: 600 }}>{value}</span>
    </div>
  );

  // ── Summary stats ────────────────────────────────────────
  const totalTx = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);

  return (
    <div style={styles.pageContainer}>

      {/* ── Page header ── */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Revenue</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Sales</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Track all your sales transactions and revenue</p>
        </div>
        {canCreate && (
          <button onClick={onNewSale}
            style={{ padding: '10px 22px', borderRadius: 9, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 7 }}
            onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
            onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Sale
          </button>
        )}
      </div>

      {/* ── KPI cards ── */}
      {!loading && sales.length > 0 && (
        <div className="kpi-grid-3">
          {[
            { label: 'Total Transactions', value: totalTx, icon: '🧾', color: '#4f46e5', bg: '#eef2ff' },
            { label: 'Total Revenue', value: `UGX ${totalRevenue.toLocaleString()}`, icon: '💰', color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Average Sale', value: `UGX ${totalTx ? Math.round(totalRevenue / totalTx).toLocaleString() : 0}`, icon: '📊', color: '#0891b2', bg: '#ecfeff' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.contentCard}>

        {/* ── Filter bar ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: '4px', background: '#f1f5f9', borderRadius: 12, width: 'fit-content' }}>
          {[
            { key: 'all', label: 'All Sales', icon: '⊞' },
            { key: 'today', label: 'Today', icon: '◎' },
            { key: 'week', label: 'This Week', icon: '▦' },
            { key: 'month', label: 'This Month', icon: '▤' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setDateFilter(f.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 9, border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: dateFilter === f.key ? '#fff' : 'transparent',
                color: dateFilter === f.key ? '#4f46e5' : '#64748b',
                boxShadow: dateFilter === f.key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 11, opacity: 0.7 }}>{f.icon}</span> {f.label}
            </button>
          ))}
        </div>

        {/* ── Weekly breakdown (only when This Week is active) ── */}
        {dateFilter === 'week' && (() => {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

          // Build 7 day slots Mon–Sun (reorder so Mon is first)
          const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
          const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d;
          });
          // Reorder: Mon(1)…Sat(6), Sun(0)
          const ordered = [...days.slice(1), days[0]];

          // Build totals per day
          const weekTotal = filteredSales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0);
          const weekCount = filteredSales.length;
          const startLabel = startOfWeek.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
          const endLabel = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');

          const dayTotals = ordered.map(day => {
            const daySales = filteredSales.filter(sale => {
              const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
              const [y, m, d] = raw.split('-').map(Number);
              const sd = new Date(y, m - 1, d);
              return sd.getTime() === day.getTime();
            });
            return {
              day,
              count: daySales.length,
              total: daySales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0),
              isToday: day.getTime() === today.getTime(),
            };
          });

          return (
            <div style={{ marginBottom: 20 }}>
              {/* Summary banner */}
              <div style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                borderRadius: 14, padding: '20px 24px', marginBottom: 14,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 2px 12px rgba(59,130,246,0.25)',
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    This week's sales
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                    UGX {weekTotal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                    {weekCount} transaction{weekCount !== 1 ? 's' : ''} &nbsp;·&nbsp; {startLabel} – {endLabel}
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 18px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Daily avg</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>UGX {weekCount ? Math.round(weekTotal / 7).toLocaleString() : 0}</div>
                </div>
              </div>

              {/* Day cards */}
              <div className="week-day-grid">
                {dayTotals.map(({ day, count, total, isToday }) => {
                  const maxTotal = Math.max(...dayTotals.map(d => d.total), 1);
                  const barPct = Math.round((total / maxTotal) * 100);
                  return (
                    <div key={day.getTime()} style={{
                      background: isToday ? '#eff6ff' : '#fff',
                      border: `1.5px solid ${isToday ? '#3b82f6' : '#e2e8f0'}`,
                      borderRadius: 12, padding: '12px 10px',
                      display: 'flex', flexDirection: 'column', gap: 6,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? '#3b82f6' : '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                        {dayNames[day.getDay()]}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                        {day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </div>
                      {/* Mini bar */}
                      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barPct}%`, background: count > 0 ? '#3b82f6' : '#e2e8f0', borderRadius: 2, transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: count > 0 ? '#1d4ed8' : '#d1d5db', lineHeight: 1 }}>
                        {count}
                      </div>
                      <div style={{ fontSize: 10, color: count > 0 ? '#64748b' : '#d1d5db', fontWeight: 500 }}>
                        {count > 0 ? `UGX ${total.toLocaleString()}` : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Monthly breakdown (only when This Month is active) ── */}
        {dateFilter === 'month' && (() => {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const monthName = today.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

          // Month totals
          const monthTotal = filteredSales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0);
          const monthCount = filteredSales.length;

          // Build calendar weeks for this month (week starts Monday)
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

          // Find Monday on or before the 1st
          const startMon = new Date(firstDay);
          const dow = firstDay.getDay(); // 0=Sun
          startMon.setDate(firstDay.getDate() - (dow === 0 ? 6 : dow - 1));

          // Collect weeks until we pass the last day of the month
          const weeks = [];
          let cursor = new Date(startMon);
          while (cursor <= lastDay) {
            const weekStart = new Date(cursor);
            const weekEnd = new Date(cursor);
            weekEnd.setDate(cursor.getDate() + 6);

            const daySales = filteredSales.filter(sale => {
              const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
              const [y, m, d] = raw.split('-').map(Number);
              const sd = new Date(y, m - 1, d);
              return sd >= weekStart && sd <= weekEnd;
            });

            weeks.push({
              label: `Week ${weeks.length + 1}`,
              start: weekStart,
              end: weekEnd,
              count: daySales.length,
              total: daySales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0),
              isCurrent: today >= weekStart && today <= weekEnd,
            });
            cursor.setDate(cursor.getDate() + 7);
          }

          return (
            <div style={{ marginBottom: 20 }}>
              {/* Summary banner */}
              <div style={{
                background: 'linear-gradient(135deg, #6d28d9 0%, #9333ea 100%)',
                borderRadius: 14, padding: '20px 24px', marginBottom: 14,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 2px 12px rgba(109,40,217,0.25)',
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    {monthName} sales
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                    UGX {monthTotal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                    {monthCount} transaction{monthCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Weekly avg</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>UGX {weeks.length ? Math.round(monthTotal / weeks.length).toLocaleString() : 0}</div>
                </div>
              </div>

              {/* Week cards */}
              <div className="month-week-grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
                {weeks.map(({ label, start, end, count, total, isCurrent }) => {
                  const maxWeekTotal = Math.max(...weeks.map(w => w.total), 1);
                  const barPct = Math.round((total / maxWeekTotal) * 100);
                  return (
                    <div key={label} style={{
                      background: isCurrent ? '#faf5ff' : '#fff',
                      border: `1.5px solid ${isCurrent ? '#9333ea' : '#e2e8f0'}`,
                      borderRadius: 12, padding: '16px 14px',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? '#9333ea' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>
                        {start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – {end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </div>
                      {/* Mini bar */}
                      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{ height: '100%', width: `${barPct}%`, background: count > 0 ? '#9333ea' : '#e2e8f0', borderRadius: 3, transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: count > 0 ? '#6d28d9' : '#d1d5db', marginBottom: 2, lineHeight: 1 }}>
                        {count}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>sale{count !== 1 ? 's' : ''}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: count > 0 ? '#16a34a' : '#d1d5db' }}>
                        {count > 0 ? `UGX ${total.toLocaleString()}` : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <DataTable
          columns={columns}
          data={filteredSales}
          loading={loading}
          emptyStateProps={{
            title: 'No sales yet',
            description: 'Start processing sales to see transaction history here.',
            actionLabel: 'Process First Sale',
            onAction: onNewSale
          }}
        />
      </div>

      {/* ── Custom Day Lookup ── */}
      <div style={{ ...styles.contentCard, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🔍</div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Sales by Specific Day</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Select any date to view all sales made on that day</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select Date</label>
            <input
              type="date"
              value={customDate}
              onChange={e => { setCustomDate(e.target.value); setCustomDaySales(null); }}
              style={{ padding: '9px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#0f172a', cursor: 'pointer', minWidth: 180 }}
            />
          </div>
          <button
            onClick={() => {
              if (!customDate) return;
              const [y, m, d] = customDate.split('-').map(Number);
              const target = new Date(y, m - 1, d);
              const results = localSales.filter(sale => {
                const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
                const [sy, sm, sd] = raw.split('-').map(Number);
                return new Date(sy, sm - 1, sd).getTime() === target.getTime();
              });
              setCustomDaySales(results);
            }}
            style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: customDate ? '#4f46e5' : '#e2e8f0', color: customDate ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: customDate ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
          >
            View Sales
          </button>
          {customDaySales !== null && (
            <button onClick={() => { setCustomDaySales(null); setCustomDate(''); }}
              style={{ padding: '9px 16px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>

        {customDaySales !== null && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '16px 22px', background: '#4f46e5', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Date</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', maxWidth: 200 }}>
                  {new Date(...customDate.split('-').map((v, i) => i === 1 ? v - 1 : +v))
                    .toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div style={{ padding: '16px 22px', borderRight: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Transactions</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#4f46e5' }}>{customDaySales.length}</div>
              </div>
              <div style={{ padding: '16px 22px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Total Revenue</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>
                  UGX {customDaySales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0).toLocaleString()}
                </div>
              </div>
            </div>
            {customDaySales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 38, marginBottom: 10 }}>🗓️</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>No sales recorded on this day</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Try selecting a different date</div>
              </div>
            ) : (
              <DataTable columns={columns} data={customDaySales} loading={false} emptyStateProps={{ title: 'No sales', description: '' }} />
            )}
          </div>
        )}
      </div>

      {/* ── Custom Week Lookup ── */}
      <div style={{ ...styles.contentCard, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📅</div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Sales by Specific Week</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Pick any date — shows all sales for that full week (Mon – Sun)</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Any date in the week</label>
            <input
              type="date"
              value={customWeekDate}
              onChange={e => { setCustomWeekDate(e.target.value); setCustomWeekSales(null); setCustomWeekRange(null); }}
              style={{ padding: '9px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#0f172a', cursor: 'pointer', minWidth: 180 }}
            />
          </div>
          <button
            onClick={() => {
              if (!customWeekDate) return;
              const [y, m, d] = customWeekDate.split('-').map(Number);
              const picked = new Date(y, m - 1, d);
              const dow = picked.getDay();
              const monday = new Date(picked);
              monday.setDate(picked.getDate() - (dow === 0 ? 6 : dow - 1));
              const sunday = new Date(monday);
              sunday.setDate(monday.getDate() + 6);
              const results = localSales.filter(sale => {
                const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
                const [sy, sm, sd] = raw.split('-').map(Number);
                const sd2 = new Date(sy, sm - 1, sd);
                return sd2 >= monday && sd2 <= sunday;
              });
              setCustomWeekSales(results);
              setCustomWeekRange({ monday, sunday });
            }}
            style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: customWeekDate ? '#4f46e5' : '#e2e8f0', color: customWeekDate ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: customWeekDate ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
          >
            View Week
          </button>
          {customWeekSales !== null && (
            <button onClick={() => { setCustomWeekSales(null); setCustomWeekDate(''); setCustomWeekRange(null); }}
              style={{ padding: '9px 16px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>

        {customWeekSales !== null && customWeekRange !== null && (() => {
          const { monday, sunday } = customWeekRange;
          const fmt = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const weekTotal = customWeekSales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0);
          const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const dayBreakdown = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            const daySales = customWeekSales.filter(sale => {
              const raw = (sale.sale_date || sale.created_at || '').slice(0, 10);
              const [sy, sm, sd] = raw.split('-').map(Number);
              return new Date(sy, sm - 1, sd).getTime() === day.getTime();
            });
            return { day, name: dayNames[i], count: daySales.length, total: daySales.reduce((s, sale) => s + parseFloat(sale.total_amount || 0), 0) };
          });
          const maxDayTotal = Math.max(...dayBreakdown.map(d => d.total), 1);

          return (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Week</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{fmt(monday)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>to {fmt(sunday)}</div>
                </div>
                <div style={{ padding: '16px 22px', borderRight: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Transactions</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8' }}>{customWeekSales.length}</div>
                </div>
                <div style={{ padding: '16px 22px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Total Revenue</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>UGX {weekTotal.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 20 }}>
                {dayBreakdown.map(({ day, name, count, total }) => {
                  const now = new Date();
                  const isToday = day.getTime() === new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                  const barPct = Math.round((total / maxDayTotal) * 100);
                  return (
                    <div key={name} style={{ background: isToday ? '#eff6ff' : '#fff', border: `1.5px solid ${isToday ? '#3b82f6' : '#e2e8f0'}`, borderRadius: 12, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? '#3b82f6' : '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barPct}%`, background: count > 0 ? '#3b82f6' : '#e2e8f0', borderRadius: 2, transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: count > 0 ? '#1d4ed8' : '#d1d5db', lineHeight: 1 }}>{count}</div>
                      <div style={{ fontSize: 10, fontWeight: 500, color: count > 0 ? '#64748b' : '#d1d5db' }}>{count > 0 ? `UGX ${total.toLocaleString()}` : '—'}</div>
                    </div>
                  );
                })}
              </div>

              {customWeekSales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: 38, marginBottom: 10 }}>📅</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>No sales recorded in this week</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Try picking a date from a different week</div>
                </div>
              ) : (
                <DataTable columns={columns} data={customWeekSales} loading={false} emptyStateProps={{ title: 'No sales', description: '' }} />
              )}
            </div>
          );
        })()}
      </div>

      {/* ── View Modal (Receipt) ── */}
      <Modal
        isOpen={!!viewingSale}
        onClose={() => setViewingSale(null)}
        title=""
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setViewingSale(null)}>Close</Button>
            <Button
              variant="success"
              onClick={() => {
                const src = document.getElementById('receipt-content');
                if (!src) {
                  alert('Receipt content not found. Please try again.');
                  return;
                }
                
                const win = window.open('', '_blank', 'width=800,height=900');
                if (!win) {
                  alert('Pop-up blocked. Please allow pop-ups for this site.');
                  return;
                }
                
                win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Receipt - ${viewingSale?.id || 'RECEIPT'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif; 
      background: #fff; 
      color: #000; 
      padding: 32px; 
      font-size: 14px; 
      max-width: 800px;
      margin: 0 auto;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 10px; }
    img { max-width: 100%; height: auto; }
    
    @media print {
      body { padding: 20px; }
      button { display: none !important; }
      @page { 
        margin: 0.5in;
        size: A4;
      }
    }
    
    @media screen {
      body {
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
        margin: 20px auto;
      }
    }
  </style>
</head>
<body>${src.innerHTML}</body>
</html>`);
                win.document.close();
                
                // Wait for images to load
                win.addEventListener('load', () => {
                  setTimeout(() => {
                    win.focus();
                    win.print();
                    // Don't auto-close to allow user to save as PDF
                    // win.close();
                  }, 500);
                });
              }}
            >
              🖨️ Print / Save PDF
            </Button>
          </div>
        }
      >
        {viewingSale && (() => {
          const items = viewingSale.sale_items || viewingSale.saleItems || [];
          const subtotal = items.reduce((s, i) => s + parseFloat(i.subtotal || 0), 0);
          const discount = parseFloat(viewingSale.discount_amount) || 0;
          const tax = parseFloat(viewingSale.tax_amount) || 0;
          const total = parseFloat(viewingSale.total_amount) || 0;
          const { date, time } = formatSaleDateTime(viewingSale.sale_date, viewingSale.created_at);
          const tenant = user?.tenant || {};
          const tenantName = tenant.name || 'InventoryPro';
          // Build a SAL-YYYYMMDD-NNNN style ref using the sale date
          const saleDate = viewingSale.sale_date || viewingSale.created_at || '';
          const datePart = saleDate.replace(/-/g, '').slice(0, 8);
          const saleId = String(viewingSale.id).padStart(4, '0');
          const receiptRef = `SAL-${datePart}-${saleId}`;

          const rRow = (label, value, bold = false, color = '#0f172a') => (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>{label}</span>
              <span style={{ fontWeight: bold ? 700 : 500, color }}>{value}</span>
            </div>
          );

          return (
            <div id="receipt-content" style={{ fontFamily: 'inherit', position: 'relative' }}>

              {/* Decorative circle — top right, matches invoice */}
              <div style={{
                position: 'absolute', top: -60, right: -60,
                width: 200, height: 200, borderRadius: '50%',
                background: 'rgba(190,18,60,0.06)', pointerEvents: 'none',
              }} />

              {/* ── Business Header ── */}
              <div style={{ textAlign: 'center', paddingBottom: 20, borderBottom: '2px solid #be123c', position: 'relative' }}>
                {/* Logo */}
                <img
                  src="/zziwa logo.png"
                  alt={tenantName}
                  style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 8 }}
                />
                <div style={{ fontWeight: 900, fontSize: 24, color: '#be123c', letterSpacing: '-0.5px' }}>{tenantName}</div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 6, fontWeight: 500 }}>
                  {[tenant.phone && `Tel: ${tenant.phone}`, tenant.email && `Email: ${tenant.email}`].filter(Boolean).join(' | ')}
                </div>
                {tenant.address && <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{tenant.address}</div>}
                {/* Receipt Badge */}
                <div style={{
                  marginTop: 10,
                  display: 'inline-block',
                  padding: '6px 16px',
                  background: '#fff1f2',
                  border: '1.5px solid #fda4af',
                  borderRadius: 20,
                  color: '#881337',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>
                  Receipt
                </div>
              </div>

              {/* ── Receipt Details + Customer ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '18px 0', borderBottom: '1.5px solid #cbd5e1', position: 'relative' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#881337', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Receipt Details</div>
                  <div style={{ color: '#be123c', fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{receiptRef}</div>
                  <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <span>📅</span> {date}
                  </div>
                  {time && (
                    <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <span>🕐</span> {time}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>👤</span> Served by: {viewingSale.user?.name || 'Deleted user'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#881337', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Customer</div>
                  <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>
                    {viewingSale.customer?.name || 'Walk-in Customer'}
                  </div>
                  {viewingSale.customer?.phone && (
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>📞 {viewingSale.customer.phone}</div>
                  )}
                  {viewingSale.customer?.email && (
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>✉️ {viewingSale.customer.email}</div>
                  )}
                </div>
              </div>

              {/* ── Items Table ── */}
              <div style={{ paddingTop: 18, position: 'relative' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#881337', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Items Purchased</div>
                <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#881337' }}>
                        {['#', 'Product', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                          <th key={h} style={{
                            padding: '10px', fontSize: 11, fontWeight: 800, color: '#ffffff',
                            letterSpacing: '0.07em', textTransform: 'uppercase',
                            textAlign: i === 0 ? 'center' : i >= 2 ? 'right' : 'left',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>No items recorded.</td></tr>
                      ) : items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: idx === items.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: 14, color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{item.product?.name || `Product #${item.product_id}`}</div>
                            {item.product?.sku && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>SKU: {item.product.sku}</div>}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: 14, color: '#475569' }}>
                            {parseFloat(item.quantity).toFixed(2)} {item.product?.unit || 'pcs'}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: 14, color: '#475569' }}>
                            UGX {parseFloat(item.price).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                            UGX {parseFloat(item.subtotal).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Totals ── */}
              <div style={{ marginTop: 16, borderTop: '1.5px solid #cbd5e1', paddingTop: 16, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ maxWidth: 520, width: '100%', border: '1.5px solid #cbd5e1', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: '#64748b' }}>Subtotal:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>UGX {subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#64748b' }}>Discount:</span>
                      <span style={{ fontWeight: 600, color: '#dc2626' }}>− UGX {discount.toLocaleString()}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#64748b' }}>Tax:</span>
                      <span style={{ fontWeight: 600, color: '#16a34a' }}>+ UGX {tax.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{
                    padding: '12px 16px',
                    background: '#fff1f2',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#881337' }}>TOTAL:</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: '#be123c' }}>UGX {total.toLocaleString()}</span>
                  </div>
                </div>
                
                <div style={{ maxWidth: 520, width: '100%', marginTop: 12, padding: '10px 16px', border: '1.5px solid #cbd5e1', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ color: '#64748b', fontSize: 14 }}>Payment Method:</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{viewingSale.payment_method?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: 14 }}>Payment Status:</span>
                    <span style={{
                      background: '#dcfce7',
                      color: '#16a34a',
                      fontWeight: 800,
                      fontSize: 11,
                      padding: '4px 12px',
                      borderRadius: 20,
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase'
                    }}>
                      Paid
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingSale.notes && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, fontSize: 13, color: '#475569', borderLeft: '4px solid #be123c' }}>
                  📝 {viewingSale.notes}
                </div>
              )}

              {/* ── Thank you footer ── */}
              <div style={{ marginTop: 24, paddingTop: 18, borderTop: '2px solid #be123c', textAlign: 'center', position: 'relative' }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#881337', marginBottom: 6 }}>Thank you for your business!</div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>We appreciate your patronage. Visit us again!</div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        isOpen={!!editingSale}
        onClose={() => setEditingSale(null)}
        title={`Edit Sale #${editingSale?.id}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingSale(null)}>Cancel</Button>
            <Button variant="success" loading={editSaving} onClick={handleEditSave}>Save Changes</Button>
          </>
        }
      >
        {editingSale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {editError && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                ⚠️ {editError}
              </div>
            )}

            {/* ── Items ── */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Items</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {editForm.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 32px', gap: 6, alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Qty</label>
                      <input
                        type="number" min="1"
                        style={{ width: '100%', padding: '6px 8px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                        value={item.quantity}
                        onChange={e => setEditForm(p => ({
                          ...p,
                          items: p.items.map((it, i) => i === idx ? { ...it, quantity: e.target.value } : it),
                        }))}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Price (UGX)</label>
                      <input
                        type="number" min="0"
                        style={{ width: '100%', padding: '6px 8px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                        value={item.price}
                        onChange={e => setEditForm(p => ({
                          ...p,
                          items: p.items.map((it, i) => i === idx ? { ...it, price: e.target.value } : it),
                        }))}
                      />
                    </div>
                    <button
                      title="Remove item"
                      onClick={() => setEditForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, padding: 4, lineHeight: 1 }}
                    >×</button>
                  </div>
                ))}
                {editForm.items?.length === 0 && (
                  <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>No items. Add at least one item before saving.</div>
                )}
              </div>
            </div>

            {/* ── Customer ── */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Customer</label>
              <select
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
                value={editForm.customer_type}
                onChange={e => setEditForm(p => ({ ...p, customer_type: e.target.value, customer_id: '' }))}
              >
                <option value="walk_in">Walk-in Customer</option>
                <option value="existing">Existing Customer</option>
              </select>
              {editForm.customer_type === 'existing' && (
                <input
                  type="number"
                  placeholder="Customer ID"
                  style={{ width: '100%', marginTop: 6, padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  value={editForm.customer_id}
                  onChange={e => setEditForm(p => ({ ...p, customer_id: e.target.value }))}
                />
              )}
            </div>

            {/* ── Payment & Financials ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Payment Method</label>
                <select
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
                  value={editForm.payment_method}
                  onChange={e => setEditForm(p => ({ ...p, payment_method: e.target.value }))}
                >
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Discount (UGX)</label>
                <input
                  type="number" min="0"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  value={editForm.discount_amount}
                  onChange={e => setEditForm(p => ({ ...p, discount_amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Tax (UGX)</label>
                <input
                  type="number" min="0"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  value={editForm.tax_amount}
                  onChange={e => setEditForm(p => ({ ...p, tax_amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Notes (Optional)</label>
              <textarea
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 60, boxSizing: 'border-box' }}
                value={editForm.notes}
                onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Add any notes…"
              />
            </div>

            {/* Live total preview */}
            {editForm.items?.length > 0 && (() => {
              const subtotal = editForm.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.price) || 0), 0);
              const discount = parseFloat(editForm.discount_amount) || 0;
              const tax = parseFloat(editForm.tax_amount) || 0;
              const total = Math.max(0, subtotal - discount + tax);
              return (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Subtotal</span><span>UGX {subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}><span>Discount</span><span>− UGX {discount.toLocaleString()}</span></div>}
                  {tax > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}><span>Tax</span><span>+ UGX {tax.toLocaleString()}</span></div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, marginTop: 6, borderTop: '1px solid #bbf7d0', paddingTop: 6, color: '#15803d' }}>
                    <span>Total</span><span>UGX {total.toLocaleString()}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        isOpen={!!deletingSale}
        onClose={() => setDeletingSale(null)}
        title="Delete Sale"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingSale(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteLoading} onClick={handleDelete}>Yes, Delete</Button>
          </>
        }
      >
        {deletingSale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {deleteError && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                ⚠️ {deleteError}
              </div>
            )}
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              Are you sure you want to delete <strong>Sale #{deletingSale.id}</strong> for{' '}
              <strong>UGX {parseFloat(deletingSale.total_amount || 0).toLocaleString()}</strong>?
            </div>
            <div style={{ padding: '10px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 13, color: '#9a3412' }}>
              ⚠️ This will permanently delete the sale and restore stock for all items. This cannot be undone.
            </div>
          </div>
        )}
      </Modal>
      {viewingInvoice && (
        <PrintableInvoiceModal
          invoice={{
            id: viewingInvoice.id,
            invoice_number: `INV/25-26/${String(viewingInvoice.id).padStart(4, '0')}`,
            invoice_date: (viewingInvoice.sale_date || viewingInvoice.created_at || '').slice(0, 10),
            due_date: (viewingInvoice.sale_date || viewingInvoice.created_at || '').slice(0, 10),
            customer_name: viewingInvoice.customer?.name || 'Walk-in Customer',
            customer_email: viewingInvoice.customer?.email || '',
            customer_phone: viewingInvoice.customer?.phone || viewingInvoice.customer?.contact || '',
            customer_address: viewingInvoice.customer?.address || '',
            total_amount: parseFloat(viewingInvoice.total_amount || 0),
            discount_amount: parseFloat(viewingInvoice.discount_amount || 0),
            tax_amount: parseFloat(viewingInvoice.tax_amount || 0),
            items: viewingInvoice.sale_items || viewingInvoice.saleItems || [],
            source_ref: `S${String(viewingInvoice.id).padStart(5, '0')}`
          }}
          user={user}
          onClose={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
}

// Purchases Tab Component
function PurchasesTab({ purchases, loading, token, user, suppliers, products, categories = [], toast, onPurchaseAdded, onPurchaseUpdated, onPurchaseDeleted, canCreate = true, canEdit = true, canDelete = true }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Each line can be 'existing' (select from products) or 'new' (fill in details)
  const EMPTY_LINE = {
    mode: 'existing',          // 'existing' | 'new'
    product_id: '',            // used when mode === 'existing'
    // new product fields
    np_name: '', np_sku: '', np_barcode: '', np_unit: '',
    np_category_id: '', np_category_mode: 'existing', np_new_category: '',
    np_price: '', np_reorder: '',
    np_description: '',
    np_track_expiry: false, np_manufacture_date: '', np_expiry_date: '',
    // shared
    quantity: '', cost_price: '',
  };

  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState([{ ...EMPTY_LINE }]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');

  // Edit state
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [editSupplierId, setEditSupplierId] = useState('');
  const [editLines, setEditLines] = useState([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Date filter
  const [dateFilter, setDateFilter] = useState('all');

  // Custom day lookup
  const [customPurchaseDate, setCustomPurchaseDate] = useState('');
  const [customDayPurchases, setCustomDayPurchases] = useState(null);

  // Custom week lookup
  const [customPurchaseWeekDate, setCustomPurchaseWeekDate] = useState('');
  const [customWeekPurchases, setCustomWeekPurchases] = useState(null);
  const [customPurchaseWeekRange, setCustomPurchaseWeekRange] = useState(null);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };

  const inp = {
    width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none',
    background: '#fff', boxSizing: 'border-box',
  };

  const openModal = () => {
    setSupplierId('');
    setLines([{ ...EMPTY_LINE }]);
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const setLine = (i, key, val) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
    // Clear line-specific errors
    if (fieldErrors[`line_${i}_${key}`]) {
      setFieldErrors(prev => ({ ...prev, [`line_${i}_${key}`]: null }));
    }
  };

  const toggleMode = (i) =>
    setLines(prev => prev.map((l, idx) =>
      idx === i ? { ...EMPTY_LINE, mode: l.mode === 'existing' ? 'new' : 'existing' } : l
    ));

  const addLine = () => setLines(prev => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i));

  const lineTotal = (l) => (parseFloat(l.quantity) || 0) * (parseFloat(l.cost_price) || 0);
  const grandTotal = lines.reduce((s, l) => s + lineTotal(l), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    
    if (!supplierId) {
      errors.supplier = 'Please select a supplier';
      setFormError('Please select a supplier');
      setFieldErrors(errors);
      return;
    }

    // Validate lines
    let hasValidLine = false;
    lines.forEach((l, i) => {
      if (l.mode === 'existing') {
        if (!l.product_id) {
          errors[`line_${i}_product`] = 'Select a product';
        }
        if (!l.quantity || l.quantity <= 0) {
          errors[`line_${i}_quantity`] = 'Quantity required';
        }
        if (!l.cost_price || l.cost_price <= 0) {
          errors[`line_${i}_cost`] = 'Cost price required';
        }
        if (l.product_id && l.quantity && l.cost_price) {
          hasValidLine = true;
        }
      } else {
        // new product
        if (!l.np_name || !l.np_name.trim()) {
          errors[`line_${i}_name`] = 'Product name required';
        }
        if (!l.np_price || l.np_price <= 0) {
          errors[`line_${i}_price`] = 'Selling price required';
        }
        if (!l.quantity || l.quantity <= 0) {
          errors[`line_${i}_quantity`] = 'Quantity required';
        }
        if (!l.cost_price || l.cost_price <= 0) {
          errors[`line_${i}_cost`] = 'Cost price required';
        }
        if (l.np_track_expiry && !l.np_expiry_date) {
          errors[`line_${i}_expiry`] = 'Expiry date required';
        }
        if (l.np_name && l.np_price && l.quantity && l.cost_price) {
          hasValidLine = true;
        }
      }
    });

    if (!hasValidLine) {
      setFormError('Add at least one complete product line with all required fields');
      setFieldErrors(errors);
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormError('Please fix the errors in the form');
      setFieldErrors(errors);
      return;
    }

    // Validate lines
    const validLines = lines.filter(l => {
      if (l.mode === 'existing') return l.product_id && l.quantity && l.cost_price;
      return l.np_name && l.np_price && l.quantity && l.cost_price;
    });

    const items = validLines.map(l => {
      if (l.mode === 'existing') {
        return {
          product_id: l.product_id,
          quantity: parseInt(l.quantity),
          cost_price: parseFloat(l.cost_price),
        };
      }
      // new product — omit product_id, include new_product object
      return {
        quantity: parseInt(l.quantity),
        cost_price: parseFloat(l.cost_price),
        new_product: {
          name: l.np_name,
          sku: l.np_sku || undefined,
          barcode: l.np_barcode || undefined,
          unit: l.np_unit || undefined,
          category_id: l.np_category_mode === 'existing' ? (l.np_category_id || undefined) : undefined,
          new_category: l.np_category_mode === 'new' ? (l.np_new_category || undefined) : undefined,
          price: parseFloat(l.np_price),
          reorder_level: l.np_reorder ? parseFloat(l.np_reorder) : undefined,
          description: l.np_description || undefined,
          track_expiry: l.np_track_expiry ? 1 : 0,
          manufacture_date: l.np_track_expiry ? (l.np_manufacture_date || undefined) : undefined,
          expiry_date: l.np_track_expiry ? (l.np_expiry_date || undefined) : undefined,
        },
      };
    });

    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`${API_URL}/purchases`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ supplier_id: supplierId || null, items }),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json?.message || 'Something went wrong.'); return; }
      onPurchaseAdded(json.data, json.new_products || []);
      toast.success('Purchase recorded', `UGX ${parseFloat(json.data.total_amount || 0).toLocaleString()} purchase recorded.`);
      setShowModal(false);
    } catch { setFormError('Could not reach the server.'); }
    finally { setSaving(false); }
  };

  const filtered = purchases.filter(p => {
    // Search filter
    const matchesSearch =
      p.supplier?.name?.toLowerCase().includes(search.toLowerCase()) ||
      new Date(p.purchase_date).toLocaleDateString().includes(search);
    if (!matchesSearch) return false;

    // Date filter
    if (dateFilter === 'all') return true;
    const raw = (p.purchase_date || p.created_at || '').slice(0, 10);
    const [y, m, d] = raw.split('-').map(Number);
    const purchaseDate = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateFilter === 'today') return purchaseDate.getTime() === today.getTime();
    if (dateFilter === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return purchaseDate >= startOfWeek;
    }
    if (dateFilter === 'month') {
      return purchaseDate.getMonth() === today.getMonth() && purchaseDate.getFullYear() === today.getFullYear();
    }
    return true;
  });

  const openEdit = (p) => {
    setEditingPurchase(p);
    setEditSupplierId(String(p.supplier_id || p.supplier?.id || ''));
    setEditLines((p.purchase_items || []).map(item => ({
      ...EMPTY_LINE,
      mode: 'existing',
      product_id: String(item.product_id),
      quantity: String(item.quantity),
      cost_price: String(item.cost_price),
    })));
    setEditError(null);
  };

  const setEditLine = (i, key, val) =>
    setEditLines(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l));

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editSupplierId) { setEditError(null); }
    const validLines = editLines.filter(l => l.product_id && l.quantity && l.cost_price);
    if (validLines.length === 0) { setEditError('Add at least one complete product line.'); return; }
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`${API_URL}/purchases/${editingPurchase.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          supplier_id: editSupplierId || null,
          items: validLines.map(l => ({
            product_id: parseInt(l.product_id),
            quantity: parseInt(l.quantity),
            cost_price: parseFloat(l.cost_price),
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setEditError(json?.message || 'Failed to update purchase.'); return; }
      onPurchaseUpdated(json.data);
      toast.success('Purchase updated', 'The purchase has been corrected successfully.');
      setEditingPurchase(null);
    } catch { setEditError('Could not reach the server.'); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/purchases/${confirmDelete.id}`, { method: 'DELETE', headers });
      if (!res.ok) { const j = await res.json(); toast.error('Delete failed', j?.message || 'Failed to delete purchase.'); return; }
      onPurchaseDeleted(confirmDelete.id, confirmDelete);
      toast.success('Purchase deleted', 'Stock levels have been reversed.');
      setConfirmDelete(null);
    } catch { toast.error('Delete failed', 'Could not reach the server.'); }
    finally { setDeleting(false); }
  };

  return (
    <div style={styles.pageContainer}>
      {/* Header banner */}
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Procurement</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Purchases</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>{purchases.length} purchase{purchases.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {purchases.length > 0 && (
            <input
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', width: 220 }}
              placeholder="Search by supplier or date…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          )}
          {canCreate && (
            <button
              onClick={openModal}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
              onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
            >
              + Record Purchase
            </button>
          )}
        </div>
      </div>

      {/* KPI summary cards */}
      {!loading && purchases.length > 0 && (
        <div className="kpi-grid-3">
          {[
            { label: 'Total Purchases', value: filtered.length, icon: '🧾', color: '#4f46e5', bg: '#eef2ff' },
            { label: 'Total Spent', value: `UGX ${filtered.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0).toLocaleString()}`, icon: '💸', color: '#dc2626', bg: '#fef2f2' },
            { label: 'Average Purchase', value: `UGX ${filtered.length ? Math.round(filtered.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0) / filtered.length).toLocaleString() : 0}`, icon: '📊', color: '#0891b2', bg: '#ecfeff' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchases table */}
      <div style={styles.contentCard}>

        {/* Date filter bar */}
        {!loading && purchases.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: '4px', background: '#f1f5f9', borderRadius: 12, width: 'fit-content' }}>
            {[
              { key: 'all', label: 'All Purchases', icon: '⊞' },
              { key: 'today', label: 'Today', icon: '◎' },
              { key: 'week', label: 'This Week', icon: '▦' },
              { key: 'month', label: 'This Month', icon: '▤' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setDateFilter(f.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 9, border: 'none',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: dateFilter === f.key ? '#fff' : 'transparent',
                  color: dateFilter === f.key ? '#4f46e5' : '#64748b',
                  boxShadow: dateFilter === f.key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 11, opacity: 0.7 }}>{f.icon}</span> {f.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading purchases…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search || dateFilter !== 'all' ? 'No purchases match your filters' : 'No purchases yet'}
            description={search || dateFilter !== 'all' ? 'Try a different supplier, date, or filter.' : 'Record purchases from suppliers to track inventory costs.'}
            actionLabel={search || dateFilter !== 'all' ? 'Clear Filters' : (canCreate ? 'Record First Purchase' : undefined)}
            onAction={search || dateFilter !== 'all' ? () => { setSearch(''); setDateFilter('all'); } : (canCreate ? openModal : undefined)}
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['Date', 'Supplier', 'Items', 'Total Amount', 'Details', ...(canEdit || canDelete ? ['Actions'] : [])].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <React.Fragment key={p.id}>
                  <tr style={{ borderBottom: expandedId === p.id ? 'none' : '1px solid #f8fafc', background: expandedId === p.id ? '#fafbff' : 'transparent' }}>
                    <td style={{ padding: '14px', color: '#475569', fontSize: 14 }}>{new Date(p.purchase_date).toLocaleDateString()}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                        {p.supplier?.name || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '14px', color: '#475569', fontSize: 14 }}>
                      {p.purchase_items?.length || 0} item{(p.purchase_items?.length || 0) !== 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                      UGX {parseFloat(p.total_amount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <button
                        onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                        style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                      >
                        {expandedId === p.id ? '▲ Hide' : '▼ View'}
                      </button>
                    </td>
                    {(canEdit || canDelete) && (
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {canEdit && (
                            <button
                              onClick={() => openEdit(p)}
                              style={{ padding: '5px 11px', borderRadius: 6, border: '1px solid #3b82f6', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setConfirmDelete(p)}
                              style={{ padding: '5px 11px', borderRadius: 6, border: '1px solid #ef4444', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                  {expandedId === p.id && (
                    <tr key={`${p.id}-exp`}>
                      <td colSpan={canEdit || canDelete ? 6 : 5} style={{ padding: '0 14px 16px', background: '#fafbff' }}>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['Product', 'Qty', 'Cost Price', 'Subtotal'].map(h => (
                                  <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(p.purchase_items || []).map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 14px', fontSize: 14, color: '#0f172a' }}>{item.product?.name || `Product #${item.product_id}`}</td>
                                  <td style={{ padding: '10px 14px', fontSize: 14, color: '#475569' }}>{item.quantity}</td>
                                  <td style={{ padding: '10px 14px', fontSize: 14, color: '#475569' }}>UGX {parseFloat(item.cost_price || 0).toLocaleString()}</td>
                                  <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>UGX {(item.quantity * item.cost_price).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Purchases by Specific Day ── */}
      <div style={{ ...styles.contentCard, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🔍</div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Purchases by Specific Day</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Select any date to view all purchases made on that day</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select Date</label>
            <input
              type="date"
              value={customPurchaseDate}
              onChange={e => { setCustomPurchaseDate(e.target.value); setCustomDayPurchases(null); }}
              style={{ padding: '9px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#0f172a', cursor: 'pointer', minWidth: 180 }}
            />
          </div>
          <button
            onClick={() => {
              if (!customPurchaseDate) return;
              const [y, m, d] = customPurchaseDate.split('-').map(Number);
              const target = new Date(y, m - 1, d);
              const results = purchases.filter(p => {
                const raw = (p.purchase_date || p.created_at || '').slice(0, 10);
                const [py, pm, pd] = raw.split('-').map(Number);
                return new Date(py, pm - 1, pd).getTime() === target.getTime();
              });
              setCustomDayPurchases(results);
            }}
            style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: customPurchaseDate ? '#4f46e5' : '#e2e8f0', color: customPurchaseDate ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: customPurchaseDate ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
          >
            View Purchases
          </button>
          {customDayPurchases !== null && (
            <button
              onClick={() => { setCustomDayPurchases(null); setCustomPurchaseDate(''); }}
              style={{ padding: '9px 16px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Clear
            </button>
          )}
        </div>

        {customDayPurchases !== null && (
          <div style={{ marginTop: 20 }}>
            {/* Summary banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '16px 22px', background: '#4f46e5', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Date</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', maxWidth: 200 }}>
                  {new Date(...customPurchaseDate.split('-').map((v, i) => i === 1 ? v - 1 : +v))
                    .toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div style={{ padding: '16px 22px', borderRight: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Purchases</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#4f46e5' }}>{customDayPurchases.length}</div>
              </div>
              <div style={{ padding: '16px 22px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Total Spent</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>
                  UGX {customDayPurchases.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0).toLocaleString()}
                </div>
              </div>
            </div>

            {customDayPurchases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 38, marginBottom: 10 }}>🗓️</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>No purchases recorded on this day</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Try selecting a different date</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Supplier', 'Items', 'Total Amount'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customDayPurchases.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '13px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                          {p.supplier?.name || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 14px', color: '#475569', fontSize: 14 }}>
                        {p.purchase_items?.length || 0} item{(p.purchase_items?.length || 0) !== 1 ? 's' : ''}
                        {(p.purchase_items || []).length > 0 && (
                          <ul style={{ margin: '6px 0 0', paddingLeft: 16, listStyle: 'disc' }}>
                            {(p.purchase_items || []).map((item, idx) => (
                              <li key={idx} style={{ fontSize: 12, color: '#64748b' }}>
                                {item.product?.name || `Product #${item.product_id}`} × {item.quantity} @ UGX {parseFloat(item.cost_price || 0).toLocaleString()}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td style={{ padding: '13px 14px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                        UGX {parseFloat(p.total_amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Purchases by Specific Week ── */}
      <div style={{ ...styles.contentCard, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📅</div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Purchases by Specific Week</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Pick any date — shows all purchases for that full week (Mon – Sun)</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Any date in the week</label>
            <input
              type="date"
              value={customPurchaseWeekDate}
              onChange={e => { setCustomPurchaseWeekDate(e.target.value); setCustomWeekPurchases(null); setCustomPurchaseWeekRange(null); }}
              style={{ padding: '9px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#0f172a', cursor: 'pointer', minWidth: 180 }}
            />
          </div>
          <button
            onClick={() => {
              if (!customPurchaseWeekDate) return;
              const [y, m, d] = customPurchaseWeekDate.split('-').map(Number);
              const picked = new Date(y, m - 1, d);
              const dow = picked.getDay();
              const monday = new Date(picked);
              monday.setDate(picked.getDate() - (dow === 0 ? 6 : dow - 1));
              const sunday = new Date(monday);
              sunday.setDate(monday.getDate() + 6);
              const results = purchases.filter(p => {
                const raw = (p.purchase_date || p.created_at || '').slice(0, 10);
                const [py, pm, pd] = raw.split('-').map(Number);
                const pd2 = new Date(py, pm - 1, pd);
                return pd2 >= monday && pd2 <= sunday;
              });
              setCustomWeekPurchases(results);
              setCustomPurchaseWeekRange({ monday, sunday });
            }}
            style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: customPurchaseWeekDate ? '#4f46e5' : '#e2e8f0', color: customPurchaseWeekDate ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: customPurchaseWeekDate ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
          >
            View Week
          </button>
          {customWeekPurchases !== null && (
            <button
              onClick={() => { setCustomWeekPurchases(null); setCustomPurchaseWeekDate(''); setCustomPurchaseWeekRange(null); }}
              style={{ padding: '9px 16px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Clear
            </button>
          )}
        </div>

        {customWeekPurchases !== null && customPurchaseWeekRange !== null && (() => {
          const { monday, sunday } = customPurchaseWeekRange;
          const fmt = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const weekTotal = customWeekPurchases.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);
          const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const dayBreakdown = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            const dayPurchases = customWeekPurchases.filter(p => {
              const raw = (p.purchase_date || p.created_at || '').slice(0, 10);
              const [py, pm, pd] = raw.split('-').map(Number);
              return new Date(py, pm - 1, pd).getTime() === day.getTime();
            });
            return {
              day,
              name: dayNames[i],
              count: dayPurchases.length,
              total: dayPurchases.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0),
            };
          });
          const maxDayTotal = Math.max(...dayBreakdown.map(d => d.total), 1);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          return (
            <div style={{ marginTop: 20 }}>
              {/* Summary banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '16px 22px', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Week</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{fmt(monday)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>to {fmt(sunday)}</div>
                </div>
                <div style={{ padding: '16px 22px', borderRight: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Purchases</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8' }}>{customWeekPurchases.length}</div>
                </div>
                <div style={{ padding: '16px 22px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Total Spent</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>UGX {weekTotal.toLocaleString()}</div>
                </div>
              </div>

              {/* Day-by-day breakdown cards */}
              <div className="week-day-grid" style={{ marginBottom: 20 }}>
                {dayBreakdown.map(({ day, name, count, total }) => {
                  const isToday = day.getTime() === today.getTime();
                  const barPct = Math.round((total / maxDayTotal) * 100);
                  return (
                    <div key={name} style={{ background: isToday ? '#eff6ff' : '#fff', border: `1.5px solid ${isToday ? '#3b82f6' : '#e2e8f0'}`, borderRadius: 12, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? '#3b82f6' : '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barPct}%`, background: count > 0 ? '#3b82f6' : '#e2e8f0', borderRadius: 2, transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: count > 0 ? '#1d4ed8' : '#d1d5db', lineHeight: 1 }}>{count}</div>
                      <div style={{ fontSize: 10, fontWeight: 500, color: count > 0 ? '#64748b' : '#d1d5db' }}>{count > 0 ? `UGX ${total.toLocaleString()}` : '—'}</div>
                    </div>
                  );
                })}
              </div>

              {customWeekPurchases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: 38, marginBottom: 10 }}>📅</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>No purchases recorded in this week</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Try picking a date from a different week</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      {['Date', 'Supplier', 'Items', 'Total Amount'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customWeekPurchases.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '13px 14px', color: '#475569', fontSize: 13 }}>
                          {new Date(...(p.purchase_date || p.created_at || '').slice(0, 10).split('-').map((v, i) => i === 1 ? v - 1 : +v))
                            .toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                            {p.supplier?.name || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '13px 14px', color: '#475569', fontSize: 14 }}>
                          {p.purchase_items?.length || 0} item{(p.purchase_items?.length || 0) !== 1 ? 's' : ''}
                        </td>
                        <td style={{ padding: '13px 14px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                          UGX {parseFloat(p.total_amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })()}
      </div>

      {/* Record Purchase Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record New Purchase" size="lg">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Supplier */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={supS.label}>Supplier (optional)</label>
            <select style={supS.input} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">— No supplier —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {fieldErrors.supplier && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4 }}>{fieldErrors.supplier}</span>}
          </div>

          {/* Product Lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={supS.label}>Products *</label>
              <button type="button" onClick={addLine} style={{ fontSize: 13, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                + Add Line
              </button>
            </div>

            {lines.map((line, i) => (
              <div key={i} style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '14px', background: line.mode === 'new' ? '#fafbff' : '#fff' }}>

                {/* Mode toggle + remove */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['existing', 'new'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMode(i)}
                        style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                          border: '1.5px solid',
                          borderColor: line.mode === m ? '#4f46e5' : '#e2e8f0',
                          background: line.mode === m ? '#4f46e5' : '#fff',
                          color: line.mode === m ? '#fff' : '#94a3b8',
                          cursor: 'pointer',
                        }}
                      >
                        {m === 'existing' ? '📦 Existing Product' : '✨ New Product'}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    disabled={lines.length === 1}
                    style={{ padding: '5px 9px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', cursor: lines.length === 1 ? 'not-allowed' : 'pointer', opacity: lines.length === 1 ? 0.4 : 1, fontSize: 13 }}
                  >
                    ✕ Remove
                  </button>
                </div>

                {/* Existing product row */}
                {line.mode === 'existing' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product *</span>
                      <select style={inp} value={line.product_id} onChange={e => setLine(i, 'product_id', e.target.value)}>
                        <option value="">— Select product —</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                      </select>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Qty *</span>
                      <input style={inp} type="number" min="1" placeholder="0" value={line.quantity}
                        onChange={e => setLine(i, 'quantity', e.target.value)} />
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Cost Price (UGX) *</span>
                      <input style={inp} type="number" min="0" step="0.01" placeholder="0.00" value={line.cost_price}
                        onChange={e => setLine(i, 'cost_price', e.target.value)} />
                    </div>
                  </div>
                )}

                {/* New product rows */}
                {line.mode === 'new' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Row 1: Name + SKU + Barcode */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product Name *</span>
                        <input style={inp} placeholder="e.g. Brown Sugar 1kg" value={line.np_name}
                          onChange={e => setLine(i, 'np_name', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>SKU</span>
                        <input style={inp} placeholder="e.g. SGR-001" value={line.np_sku}
                          onChange={e => setLine(i, 'np_sku', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Barcode</span>
                        <input style={inp} placeholder="Scan or type" value={line.np_barcode}
                          onChange={e => setLine(i, 'np_barcode', e.target.value)} />
                      </div>
                    </div>

                    {/* Row 2: Unit + Category */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Unit</span>
                        <select style={inp} value={line.np_unit}
                          onChange={e => setLine(i, 'np_unit', e.target.value)}>
                          <option value="">— Select unit —</option>
                          {['Pieces (pcs)', 'Kilograms (kg)', 'Grams (g)', 'Litres (L)', 'Millilitres (mL)', 'Metres (m)', 'Centimetres (cm)', 'Boxes', 'Cartons', 'Dozens', 'Pairs', 'Rolls', 'Bags', 'Bottles', 'Cans'].map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Category</span>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                          {['existing', 'new'].map(m => (
                            <button
                              key={m} type="button"
                              onClick={() => setLine(i, 'np_category_mode', m)}
                              style={{
                                flex: 1, padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                border: '1.5px solid',
                                borderColor: line.np_category_mode === m ? '#4f46e5' : '#e2e8f0',
                                background: line.np_category_mode === m ? '#ede9fe' : '#f8fafc',
                                color: line.np_category_mode === m ? '#4f46e5' : '#94a3b8',
                                cursor: 'pointer',
                              }}
                            >
                              {m === 'existing' ? '📂 Existing' : '➕ New'}
                            </button>
                          ))}
                        </div>
                        {line.np_category_mode === 'existing' ? (
                          <select style={inp} value={line.np_category_id}
                            onChange={e => setLine(i, 'np_category_id', e.target.value)}>
                            <option value="">— No category —</option>
                            {(categories || []).map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input style={inp} placeholder="Type new category name"
                            value={line.np_new_category}
                            onChange={e => setLine(i, 'np_new_category', e.target.value)} />
                        )}
                      </div>
                    </div>

                    {/* Row 3: Selling Price + Reorder + Qty + Cost Price */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Selling Price (UGX) *</span>
                        <input style={inp} type="number" min="0" step="0.01" placeholder="0.00" value={line.np_price}
                          onChange={e => setLine(i, 'np_price', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Reorder Level</span>
                        <input style={inp} type="number" min="0" placeholder="0" value={line.np_reorder}
                          onChange={e => setLine(i, 'np_reorder', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Qty Purchased *</span>
                        <input style={inp} type="number" min="1" placeholder="0" value={line.quantity}
                          onChange={e => setLine(i, 'quantity', e.target.value)} />
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Cost Price (UGX) *</span>
                        <input style={inp} type="number" min="0" step="0.01" placeholder="0.00" value={line.cost_price}
                          onChange={e => setLine(i, 'cost_price', e.target.value)} />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Description (optional)</span>
                      <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }}
                        placeholder="Optional product description…"
                        value={line.np_description}
                        onChange={e => setLine(i, 'np_description', e.target.value)} />
                    </div>

                    {/* Track expiry toggle */}
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                      padding: '10px 12px', background: '#f8fafc', borderRadius: 8,
                      border: '1.5px solid #e2e8f0',
                    }}>
                      <div style={{
                        width: 40, height: 22, borderRadius: 11, position: 'relative', flexShrink: 0,
                        background: line.np_track_expiry ? '#4f46e5' : '#e2e8f0', transition: 'background 0.2s',
                      }}>
                        <div style={{
                          position: 'absolute', top: 2, width: 18, height: 18,
                          background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          transform: line.np_track_expiry ? 'translateX(20px)' : 'translateX(2px)',
                          transition: 'transform 0.2s',
                        }} />
                      </div>
                      <input type="checkbox" style={{ display: 'none' }}
                        checked={line.np_track_expiry}
                        onChange={e => setLine(i, 'np_track_expiry', e.target.checked)} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Track Expiry Date</span>
                    </label>

                    {/* Expiry date fields */}
                    {line.np_track_expiry && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '10px 12px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 8 }}>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Manufacture Date</span>
                          <input style={inp} type="date" value={line.np_manufacture_date}
                            onChange={e => setLine(i, 'np_manufacture_date', e.target.value)} />
                        </div>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Expiry Date *</span>
                          <input style={inp} type="date" value={line.np_expiry_date}
                            min={line.np_manufacture_date || undefined}
                            onChange={e => setLine(i, 'np_expiry_date', e.target.value)} />
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: 12, color: '#6366f1', background: '#eef2ff', borderRadius: 6, padding: '6px 10px' }}>
                      ✨ This product will be created in your inventory with the quantity above as its initial stock.
                    </div>
                  </div>
                )}

                {/* Line subtotal */}
                {lineTotal(line) > 0 && (
                  <div style={{ marginTop: 8, textAlign: 'right', fontSize: 13, color: '#64748b' }}>
                    Subtotal: <strong style={{ color: '#0f172a' }}>UGX {lineTotal(line).toLocaleString()}</strong>
                  </div>
                )}
              </div>
            ))}

            {/* Grand total */}
            {grandTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Total: UGX {grandTotal.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {formError && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
              ⚠️ {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving} style={{ flex: 1 }}>
              {saving ? 'Recording…' : 'Record Purchase'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Purchase Modal ── */}
      <Modal isOpen={!!editingPurchase} onClose={() => setEditingPurchase(null)} title="Edit Purchase" size="lg">
        {editingPurchase && (
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Supplier */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Supplier (optional)</label>
              <select
                style={{ ...inp, padding: '10px 12px', borderRadius: 10, fontSize: 14 }}
                value={editSupplierId}
                onChange={e => setEditSupplierId(e.target.value)}
              >
                <option value="">— No supplier —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Line items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Items *</label>
                <button
                  type="button"
                  onClick={() => setEditLines(prev => [...prev, { ...EMPTY_LINE }])}
                  style={{ fontSize: 13, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  + Add Line
                </button>
              </div>

              {editLines.map((line, i) => (
                <div key={i} style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px', background: '#fff' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product *</span>
                      <select
                        style={inp}
                        value={line.product_id}
                        onChange={e => setEditLine(i, 'product_id', e.target.value)}
                        required
                      >
                        <option value="">— Select product —</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Qty *</span>
                      <input
                        style={inp}
                        type="number" min="1" placeholder="0"
                        value={line.quantity}
                        onChange={e => setEditLine(i, 'quantity', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Cost Price (UGX) *</span>
                      <input
                        style={inp}
                        type="number" min="0" step="0.01" placeholder="0.00"
                        value={line.cost_price}
                        onChange={e => setEditLine(i, 'cost_price', e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditLines(prev => prev.filter((_, idx) => idx !== i))}
                      disabled={editLines.length === 1}
                      style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', cursor: editLines.length === 1 ? 'not-allowed' : 'pointer', opacity: editLines.length === 1 ? 0.4 : 1, fontSize: 13, alignSelf: 'flex-end' }}
                    >
                      ✕
                    </button>
                  </div>
                  {/* line subtotal */}
                  {(parseFloat(line.quantity) || 0) * (parseFloat(line.cost_price) || 0) > 0 && (
                    <div style={{ marginTop: 8, textAlign: 'right', fontSize: 12, color: '#64748b' }}>
                      Subtotal: <strong style={{ color: '#0f172a' }}>
                        UGX {((parseFloat(line.quantity) || 0) * (parseFloat(line.cost_price) || 0)).toLocaleString()}
                      </strong>
                    </div>
                  )}
                </div>
              ))}

              {/* Grand total */}
              {editLines.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.cost_price) || 0), 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    Total: UGX {editLines.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.cost_price) || 0), 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {editError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                ⚠️ {editError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
              <Button type="button" variant="secondary" onClick={() => setEditingPurchase(null)} style={{ flex: 1 }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={editSaving} style={{ flex: 1 }}>
                {editSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Purchase">
        {confirmDelete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#991b1b', fontSize: 15 }}>
                ⚠️ This action cannot be undone
              </p>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
                Deleting this purchase will <strong>reverse all stock levels</strong> for the items in this order. The following purchase will be permanently removed:
              </p>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Supplier</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{confirmDelete.supplier?.name || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Date</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{new Date(confirmDelete.purchase_date).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Items</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{confirmDelete.purchase_items?.length || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Total Amount</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>UGX {parseFloat(confirmDelete.total_amount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button type="button" variant="secondary" onClick={() => setConfirmDelete(null)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 1, padding: '10px 20px', borderRadius: 8, border: 'none', background: deleting ? '#fca5a5' : '#ef4444', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                {deleting ? 'Deleting…' : 'Yes, Delete Purchase'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Stock Tab Component
function StockTab({ products, stockMovements, token, onAdjusted, canCreate = true }) {
  const [form, setForm] = useState({ product_id: '', type: 'IN', quantity: '', reason: '', date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const handleSubmit = async () => {
    if (!form.product_id || !form.quantity) { setFormError('Product and quantity are required.'); return; }
    if (parseInt(form.quantity) < 1) { setFormError('Quantity must be at least 1.'); return; }
    setSubmitting(true); setFormError(null); setFormSuccess(null);
    try {
      const res = await fetch(`${API}/stock-movements`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(form.product_id),
          type: form.type,
          quantity: parseInt(form.quantity),
          reason: form.reason || null,
          date: form.date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data?.message || 'Failed to update stock.'); return; }
      setFormSuccess(`Stock updated for "${data.data?.product?.name}".`);
      setForm({ product_id: '', type: 'IN', quantity: '', reason: '', date: '' });
      onAdjusted();
    } catch { setFormError('Network error. Check your connection.'); }
    finally { setSubmitting(false); }
  };

  const typeConfig = {
    IN: { label: 'Stock In', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    OUT: { label: 'Stock Out', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    ADJUSTMENT: { label: 'Adjustment', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  };

  const filtered = stockMovements.filter(m => {
    const matchType = typeFilter === 'ALL' || m.type === typeFilter;
    const matchSearch = !search || (m.product?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalIn = stockMovements.filter(m => m.type === 'IN').reduce((s, m) => s + Number(m.quantity), 0);
  const totalOut = stockMovements.filter(m => m.type === 'OUT').reduce((s, m) => s + Number(m.quantity), 0);
  const lowStock = products.filter(p => Number(p.stock) <= Number(p.reorder_level || 0));

  // Safe date formatter — avoids UTC shift by parsing YYYY-MM-DD as local
  const fmtDate = (raw) => {
    if (!raw) return '—';
    const s = String(raw).slice(0, 10);
    const [y, m, d] = s.split('-').map(Number);
    if (!y || !m || !d) return '—';
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none',
    background: '#fff', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 5 };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Stock Management</h1>
          <p style={styles.pageSubtitle}>Adjust stock levels and view movement history</p>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Products', value: products.length, icon: '📦', iconBg: '#fff7ed', numColor: '#ea580c' },
          { label: 'Total Stock In', value: totalIn, icon: '⬆', iconBg: '#eff6ff', numColor: '#2563eb' },
          { label: 'Total Stock Out', value: totalOut, icon: '⬇', iconBg: '#eff6ff', numColor: '#2563eb' },
        ].map(c => (
          <div key={c.label} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
            padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10, background: c.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>{c.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: c.numColor, lineHeight: 1 }}>{c.value.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: canCreate ? '340px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Left: Adjust Stock form ── */}
        {canCreate && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              🗒️ Adjust Stock
            </h3>

            {formError && <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {formError}</div>}
            {formSuccess && <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#15803d', fontSize: 13 }}>✅ {formSuccess}</div>}

            {/* Product */}
            <div>
              <label style={labelStyle}>Product *</label>
              <select style={inputStyle} value={form.product_id} onChange={e => setForm(p => ({ ...p, product_id: e.target.value }))}>
                <option value="">— Select product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
              </select>
            </div>

            {/* Adjustment Type */}
            <div>
              <label style={labelStyle}>Adjustment Type *</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { val: 'IN', label: '⬆ Stock In' },
                  { val: 'OUT', label: '⬇ Stock Out' },
                  { val: 'ADJUSTMENT', label: '⚙ Set Level' },
                ].map(t => (
                  <button key={t.val} onClick={() => setForm(p => ({ ...p, type: t.val }))} style={{
                    flex: 1, padding: '8px 6px', borderRadius: 8, border: '1.5px solid',
                    borderColor: form.type === t.val ? '#16a34a' : '#e2e8f0',
                    background: form.type === t.val ? '#f0fdf4' : '#fff',
                    color: form.type === t.val ? '#16a34a' : '#64748b',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  }}>{t.label}</button>
                ))}
              </div>
              <div style={{ marginTop: 5, fontSize: 12, color: '#94a3b8' }}>
                {form.type === 'IN' && 'Adds quantity to current stock.'}
                {form.type === 'OUT' && 'Removes quantity from current stock.'}
                {form.type === 'ADJUSTMENT' && 'Sets stock to an exact absolute value.'}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label style={labelStyle}>{form.type === 'ADJUSTMENT' ? 'New Stock Level *' : 'Quantity *'}</label>
              <input style={inputStyle} type="number" min="1"
                placeholder={form.type === 'ADJUSTMENT' ? 'Enter new total stock' : 'Enter quantity'}
                value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
            </div>

            {/* Reason */}
            <div>
              <label style={labelStyle}>Reason (Optional)</label>
              <input style={inputStyle} type="text"
                placeholder="e.g. Damaged goods, Stock count correction…"
                value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
            </div>

            {/* Date */}
            <div>
              <label style={labelStyle}>Date <span style={{ color: '#94a3b8', fontWeight: 400 }}>(defaults to today)</span></label>
              <input style={inputStyle} type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>

            <Button variant="success" style={{ width: '100%', justifyContent: 'center' }} loading={submitting} onClick={handleSubmit}>
              Apply Adjustment
            </Button>

            {/* Low stock alert */}
            {lowStock.length > 0 && (
              <div style={{ padding: '10px 12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
                  ⚠️ {lowStock.length} product{lowStock.length > 1 ? 's' : ''} low on stock
                </div>
                {lowStock.slice(0, 4).map(p => (
                  <div key={p.id} style={{ fontSize: 12, color: '#92400e', padding: '2px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{p.name}</span><span style={{ fontWeight: 700 }}>{p.stock} left</span>
                  </div>
                ))}
                {lowStock.length > 4 && <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>+{lowStock.length - 4} more…</div>}
              </div>
            )}
          </div>
        )}

        {/* ── Right: Movement History ── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px' }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              📋 Movement History
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {['ALL', 'IN', 'OUT', 'ADJUSTMENT'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)} style={{
                  padding: '5px 14px', borderRadius: 8, border: '1.5px solid',
                  borderColor: typeFilter === t ? '#4f46e5' : '#e2e8f0',
                  background: typeFilter === t ? '#4f46e5' : '#fff',
                  color: typeFilter === t ? '#fff' : '#64748b',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 15 }}>🔍</span>
            <input
              style={{ ...inputStyle, paddingLeft: 36 }}
              placeholder="Search by product name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
              <div style={{ fontSize: 14 }}>No movements found</div>
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['PRODUCT', 'TYPE', 'QTY', 'REASON', 'DATE'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left', fontSize: 11,
                        fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em',
                        borderBottom: '1px solid #e2e8f0',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => {
                    const tc = typeConfig[m.type] || typeConfig['IN'];
                    const qty = Number(m.quantity);
                    const qtyColor = m.type === 'IN' ? '#16a34a' : m.type === 'OUT' ? '#dc2626' : '#b45309';
                    const qtyPrefix = m.type === 'IN' ? '+' : m.type === 'OUT' ? '−' : '=';
                    return (
                      <tr key={m.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{m.product?.name || `#${m.product_id}`}</div>
                          {m.product?.sku && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{m.product.sku}</div>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`,
                            borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                          }}>{tc.label}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 15, color: qtyColor }}>
                          {qtyPrefix}{qty}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: m.reason ? '#475569' : '#cbd5e1' }}>
                          {m.reason || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {fmtDate(m.date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reports Tab Component
function ReportsTab({ data, loading, token }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const [activeReport, setActiveReport] = useState('overview');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeklyDate, setWeeklyDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().toISOString().slice(0, 7));
  const [yearlyYear, setYearlyYear] = useState(new Date().getFullYear().toString());
  const [dailyPurchasesDate, setDailyPurchasesDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  const totalRevenue = data.stats.totalSales - data.stats.totalPurchases;

  // ── Derived analytics from existing data ──────────────────────────────────

  // Sales by payment method
  const paymentBreakdown = data.sales.reduce((acc, s) => {
    const m = s.payment_method || 'unknown';
    acc[m] = (acc[m] || 0) + parseFloat(s.total_amount || 0);
    return acc;
  }, {});
  const paymentTotal = Object.values(paymentBreakdown).reduce((a, b) => a + b, 0);

  // Top 5 products by revenue (from sale items)
  const productRevenue = {};
  data.sales.forEach(s => {
    (s.sale_items || s.saleItems || []).forEach(item => {
      const name = item.product?.name || `#${item.product_id}`;
      productRevenue[name] = (productRevenue[name] || 0) + parseFloat(item.subtotal || 0);
    });
  });
  const topProducts = Object.entries(productRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxProductRev = topProducts[0]?.[1] || 1;

  // Top 5 suppliers by purchase spend
  const supplierSpend = {};
  data.purchases.forEach(p => {
    const name = p.supplier?.name || `#${p.supplier_id}`;
    supplierSpend[name] = (supplierSpend[name] || 0) + parseFloat(p.total_amount || 0);
  });
  const topSuppliers = Object.entries(supplierSpend).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSupplierSpend = topSuppliers[0]?.[1] || 1;

  // ── Fetch reports ──────────────────────────────────────────────────────────
  const fetchReport = async () => {
    setReportLoading(true);
    setReportError(null);
    setReportData(null);
    try {
      let url;
      if (activeReport === 'daily') url = `${API_URL}/sales/daily-report?date=${dailyDate}`;
      else if (activeReport === 'weekly') url = `${API_URL}/sales/weekly-report?date=${weeklyDate}`;
      else if (activeReport === 'monthly-sales') url = `${API_URL}/sales/monthly-report?month=${monthlyMonth}`;
      else if (activeReport === 'yearly') url = `${API_URL}/sales/yearly-report?year=${yearlyYear}`;
      else if (activeReport === 'daily-purchases') url = `${API_URL}/purchases/daily-report?date=${dailyPurchasesDate}`;
      else url = `${API_URL}/purchases/monthly-report?month=${monthlyMonth}`;

      const res = await fetch(url, { headers });
      const json = await res.json();
      if (!res.ok) { setReportError(json?.message || 'Failed to load report.'); return; }
      setReportData(json.data);
    } catch { setReportError('Could not reach the server.'); }
    finally { setReportLoading(false); }
  };

  const paymentColors = { cash: '#16a34a', card: '#2563eb', mobile_money: '#7c3aed', bank_transfer: '#0891b2' };
  const getPayColor = (m) => paymentColors[m] || '#64748b';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'daily', label: 'Daily Sales' },
    { id: 'weekly', label: 'Weekly Sales' },
    { id: 'monthly-sales', label: 'Monthly Sales' },
    { id: 'yearly', label: 'Yearly Report' },
    { id: 'daily-purchases', label: 'Daily Purchases' },
  ];

  return (
    <div style={styles.pageContainer}>
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Business Intelligence</p>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Reports & Analytics</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Analyse your business performance and trends</p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #f1f5f9', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveReport(t.id); setReportData(null); setReportError(null); }} style={{
            padding: '9px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            color: activeReport === t.id ? '#4f46e5' : '#64748b',
            borderBottom: activeReport === t.id ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: -2, transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeReport === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* KPI row */}
          <div className="reports-kpi-grid">
            {[
              { label: 'Total Revenue', value: `UGX ${data.stats.totalSales.toLocaleString()}`, icon: '💰', color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Total Costs', value: `UGX ${data.stats.totalPurchases.toLocaleString()}`, icon: '🛒', color: '#d97706', bg: '#fffbeb' },
              { label: 'Net Profit', value: `UGX ${totalRevenue.toLocaleString()}`, icon: '📈', color: totalRevenue >= 0 ? '#16a34a' : '#dc2626', bg: totalRevenue >= 0 ? '#f0fdf4' : '#fef2f2' },
              { label: 'Low Stock', value: data.stats.lowStockCount, icon: '⚠️', color: data.stats.lowStockCount > 0 ? '#dc2626' : '#16a34a', bg: data.stats.lowStockCount > 0 ? '#fef2f2' : '#f0fdf4' },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</p>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{k.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="reports-2col">

            {/* Payment method breakdown */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
              <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales by Payment Method</h3>
              {Object.keys(paymentBreakdown).length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 14 }}>No sales data yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Object.entries(paymentBreakdown).map(([method, amount]) => (
                    <div key={method}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{method.replace('_', ' ')}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>UGX {amount.toLocaleString()} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({Math.round(amount / paymentTotal * 100)}%)</span></span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(amount / paymentTotal) * 100}%`, background: getPayColor(method), borderRadius: 4, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory summary */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
              <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Inventory Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Total Products', value: data.stats.totalProducts, icon: '📦' },
                  { label: 'Categories', value: data.categories.length, icon: '🏷️' },
                  { label: 'Suppliers', value: data.suppliers.length, icon: '🏭' },
                  { label: 'Customers', value: data.customers.length, icon: '👥' },
                  { label: 'Total Sales', value: data.sales.length, icon: '💰' },
                  { label: 'Total Purchases', value: data.purchases.length, icon: '🛒' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                    <span style={{ fontSize: 14, color: '#475569' }}>{r.icon} {r.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="reports-2col">

            {/* Top products */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
              <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Top Products by Revenue</h3>
              {topProducts.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 14 }}>No sales data yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {topProducts.map(([name, rev], i) => (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>#{i + 1} {name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>UGX {rev.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(rev / maxProductRev) * 100}%`, background: '#4f46e5', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top suppliers */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
              <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Top Suppliers by Spend</h3>
              {topSuppliers.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 14 }}>No purchase data yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {topSuppliers.map(([name, spend], i) => (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>#{i + 1} {name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>UGX {spend.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(spend / maxSupplierSpend) * 100}%`, background: '#0891b2', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DAILY SALES REPORT ── */}
      {activeReport === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Select Date</label>
              <input style={{ ...supS.input, width: 200 }} type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)} />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { label: 'Date', value: reportData.date },
                  { label: 'Transactions', value: reportData.total_transactions },
                  { label: 'Total Sales', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}` },
                  { label: 'Total Cost', value: `UGX ${parseFloat(reportData.total_cost || 0).toLocaleString()}` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                  </div>
                ))}
              </div>
              {/* Profit highlight */}
              <div style={{ background: parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Net Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                    UGX {parseFloat(reportData.total_profit || 0).toLocaleString()}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                    {parseFloat(reportData.total_sales) > 0
                      ? `${((parseFloat(reportData.total_profit) / parseFloat(reportData.total_sales)) * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales Transactions</h3>
                </div>
                {reportData.sales?.length === 0 ? (
                  <p style={{ padding: 20, color: '#94a3b8', fontSize: 14 }}>No sales on this date.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Time', 'Cashier', 'Payment', 'Items', 'Amount', 'Cost', 'Profit'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.sales?.map(s => (
                        <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{new Date(s.created_at).toLocaleTimeString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>{s.user?.name || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: getPayColor(s.payment_method) + '18', color: getPayColor(s.payment_method), border: `1px solid ${getPayColor(s.payment_method)}40`, textTransform: 'capitalize' }}>
                              {s.payment_method?.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{(s.sale_items || s.saleItems || []).length}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>UGX {parseFloat(s.total_amount || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748b' }}>UGX {parseFloat(s.cost || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: parseFloat(s.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>UGX {parseFloat(s.profit || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WEEKLY SALES REPORT ── */}
      {activeReport === 'weekly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Any date within the week</label>
              <input style={{ ...supS.input, width: 200 }} type="date" value={weeklyDate} onChange={e => setWeeklyDate(e.target.value)} />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* KPI cards */}
              <div className="reports-kpi-grid">
                {[
                  { label: 'Week Start', value: reportData.week_start },
                  { label: 'Week End', value: reportData.week_end },
                  { label: 'Transactions', value: reportData.total_transactions },
                  { label: 'Total Sales', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Profit highlight */}
              <div style={{ background: parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Net Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                    UGX {parseFloat(reportData.total_profit || 0).toLocaleString()}
                  </p>
                </div>
                <div style={{ marginLeft: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Total Cost</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>UGX {parseFloat(reportData.total_cost || 0).toLocaleString()}</p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                    {parseFloat(reportData.total_sales) > 0
                      ? `${((parseFloat(reportData.total_profit) / parseFloat(reportData.total_sales)) * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Daily breakdown bar chart */}
              {reportData.by_day && reportData.by_day.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Daily Breakdown</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {(() => {
                      const maxTotal = Math.max(...reportData.by_day.map(d => parseFloat(d.total || 0)), 1);
                      return reportData.by_day.map(d => (
                        <div key={d.date}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{d.day} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({d.date})</span></span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                              UGX {parseFloat(d.total || 0).toLocaleString()} &nbsp;
                              <span style={{ color: '#94a3b8', fontWeight: 400 }}>{d.transactions} txn{d.transactions !== 1 ? 's' : ''}</span>
                              &nbsp;·&nbsp;
                              <span style={{ color: parseFloat(d.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                                profit: UGX {parseFloat(d.profit || 0).toLocaleString()}
                              </span>
                            </span>
                          </div>
                          <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${(parseFloat(d.total || 0) / maxTotal) * 100}%`,
                              background: d.transactions > 0 ? '#4f46e5' : '#e2e8f0',
                              borderRadius: 5,
                              transition: 'width 0.4s ease',
                            }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Transactions table */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales Transactions</h3>
                </div>
                {reportData.sales?.length === 0 ? (
                  <p style={{ padding: 20, color: '#94a3b8', fontSize: 14 }}>No sales this week.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Date', 'Cashier', 'Customer', 'Payment', 'Items', 'Amount', 'Cost', 'Profit'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.sales?.map(s => (
                        <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{new Date(s.sale_date).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>{s.user?.name || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{s.customer?.name || 'Walk-in'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: getPayColor(s.payment_method) + '18', color: getPayColor(s.payment_method), border: `1px solid ${getPayColor(s.payment_method)}40`, textTransform: 'capitalize' }}>
                              {s.payment_method?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{(s.sale_items || s.saleItems || []).length}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>UGX {parseFloat(s.total_amount || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748b' }}>UGX {parseFloat(s.cost || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: parseFloat(s.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>UGX {parseFloat(s.profit || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MONTHLY SALES REPORT ── */}
      {activeReport === 'monthly-sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Select Month</label>
              <input style={{ ...supS.input, width: 200 }} type="month" value={monthlyMonth} onChange={e => setMonthlyMonth(e.target.value)} />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Month', value: reportData.month },
                  { label: 'Transactions', value: reportData.total_transactions },
                  { label: 'Total Sales', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Profit highlight */}
              <div style={{ background: parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Net Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                    UGX {parseFloat(reportData.total_profit || 0).toLocaleString()}
                  </p>
                </div>
                <div style={{ marginLeft: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Total Cost</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>UGX {parseFloat(reportData.total_cost || 0).toLocaleString()}</p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#374151' }}>
                    {parseFloat(reportData.total_sales) > 0
                      ? `${((parseFloat(reportData.total_profit) / parseFloat(reportData.total_sales)) * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Payment method breakdown */}
                {reportData.by_payment && reportData.by_payment.length > 0 && (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22 }}>
                    <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales by Payment Method</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {(() => {
                        const methodTotal = reportData.by_payment.reduce((sum, p) => sum + parseFloat(p.total || 0), 0) || 1;
                        return reportData.by_payment.map(p => (
                          <div key={p.method}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{(p.method || '').replace(/_/g, ' ')}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                UGX {parseFloat(p.total || 0).toLocaleString()} &nbsp;
                                <span style={{ color: '#94a3b8', fontWeight: 400 }}>({Math.round((parseFloat(p.total || 0) / methodTotal) * 100)}%)</span>
                                &nbsp;·&nbsp;
                                <span style={{ color: parseFloat(p.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                                  profit: UGX {parseFloat(p.profit || 0).toLocaleString()}
                                </span>
                              </span>
                            </div>
                            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(parseFloat(p.total || 0) / methodTotal) * 100}%`, background: getPayColor(p.method), borderRadius: 4, transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Daily breakdown within the month */}
                {reportData.by_day && reportData.by_day.length > 0 && (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22, maxHeight: 340, overflowY: 'auto' }}>
                    <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Daily Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(() => {
                        const maxDayTotal = Math.max(...reportData.by_day.map(d => parseFloat(d.total || 0)), 1);
                        return reportData.by_day.map(d => (
                          <div key={d.date}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                                UGX {parseFloat(d.total || 0).toLocaleString()} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({d.transactions})</span>
                                &nbsp;·&nbsp;
                                <span style={{ color: parseFloat(d.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                                  UGX {parseFloat(d.profit || 0).toLocaleString()}
                                </span>
                              </span>
                            </div>
                            <div style={{ height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(parseFloat(d.total || 0) / maxDayTotal) * 100}%`, background: '#16a34a', borderRadius: 4 }} />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Transactions table */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales Transactions</h3>
                </div>
                {reportData.sales?.length === 0 ? (
                  <p style={{ padding: 20, color: '#94a3b8', fontSize: 14 }}>No sales this month.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Date', 'Cashier', 'Customer', 'Payment', 'Items', 'Amount', 'Cost', 'Profit'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.sales?.map(s => (
                        <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{new Date(s.sale_date).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>{s.user?.name || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{s.customer?.name || 'Walk-in'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: getPayColor(s.payment_method) + '18', color: getPayColor(s.payment_method), border: `1px solid ${getPayColor(s.payment_method)}40`, textTransform: 'capitalize' }}>
                              {s.payment_method?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{(s.sale_items || s.saleItems || []).length}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>UGX {parseFloat(s.total_amount || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748b' }}>UGX {parseFloat(s.cost || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: parseFloat(s.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>UGX {parseFloat(s.profit || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── YEARLY REPORT ── */}
      {activeReport === 'yearly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Select Year</label>
              <select
                value={yearlyYear}
                onChange={e => { setYearlyYear(e.target.value); setReportData(null); }}
                style={{ ...supS.input, width: 140 }}
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>⚠️ {reportError}</div>}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── KPI row ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { label: 'Year', value: reportData.year, icon: '📅', color: '#4f46e5', bg: '#eef2ff' },
                  { label: 'Transactions', value: reportData.total_transactions, icon: '🧾', color: '#0891b2', bg: '#ecfeff' },
                  { label: 'Total Revenue', value: `UGX ${parseFloat(reportData.total_sales || 0).toLocaleString()}`, icon: '💰', color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'Total Cost', value: `UGX ${parseFloat(reportData.total_cost || 0).toLocaleString()}`, icon: '🛒', color: '#d97706', bg: '#fffbeb' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{k.icon}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{k.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Profit highlight ── */}
              <div style={{ background: parseFloat(reportData.total_profit || 0) >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${parseFloat(reportData.total_profit || 0) >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '20px 26px', display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ fontSize: 36 }}>{parseFloat(reportData.total_profit || 0) >= 0 ? '📈' : '📉'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Annual Net Profit</p>
                  <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, color: parseFloat(reportData.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626', letterSpacing: '-0.5px' }}>
                    UGX {parseFloat(reportData.total_profit || 0).toLocaleString()}
                  </p>
                </div>
                <div style={{ marginLeft: 20 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Profit Margin</p>
                  <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: '#374151' }}>
                    {parseFloat(reportData.total_sales) > 0 ? `${((parseFloat(reportData.total_profit) / parseFloat(reportData.total_sales)) * 100).toFixed(1)}%` : '—'}
                  </p>
                </div>
                {reportData.best_month && (
                  <div style={{ marginLeft: 20 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Best Month</p>
                    <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#16a34a' }}>
                      {reportData.best_month.month_name} — UGX {parseFloat(reportData.best_month.total || 0).toLocaleString()}
                    </p>
                  </div>
                )}
                {reportData.worst_month && (
                  <div style={{ marginLeft: 20 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Lowest Month</p>
                    <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#64748b' }}>
                      {reportData.worst_month.month_name} — UGX {parseFloat(reportData.worst_month.total || 0).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Monthly bar chart ── */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Monthly Revenue & Profit</h3>
                {(() => {
                  const maxTotal = Math.max(...(reportData.by_month || []).map(m => parseFloat(m.total || 0)), 1);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(reportData.by_month || []).map(m => {
                        const revPct = Math.round((parseFloat(m.total || 0) / maxTotal) * 100);
                        const profitPct = Math.round((parseFloat(m.profit || 0) / maxTotal) * 100);
                        const isProfit = parseFloat(m.profit || 0) >= 0;
                        return (
                          <div key={m.month}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', minWidth: 36 }}>{m.month_name}</span>
                              <span style={{ fontSize: 12, color: '#64748b' }}>
                                UGX {parseFloat(m.total || 0).toLocaleString()}
                                &nbsp;·&nbsp;
                                <span style={{ color: isProfit ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                  {isProfit ? '+' : ''}UGX {parseFloat(m.profit || 0).toLocaleString()}
                                </span>
                                &nbsp;·&nbsp;
                                <span style={{ color: '#94a3b8' }}>{m.transactions} txns</span>
                              </span>
                            </div>
                            {/* Revenue bar */}
                            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 3 }}>
                              <div style={{ height: '100%', width: `${revPct}%`, background: m.transactions > 0 ? '#4f46e5' : '#e2e8f0', borderRadius: 4, transition: 'width 0.4s ease' }} />
                            </div>
                            {/* Profit bar */}
                            <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.abs(profitPct)}%`, background: isProfit ? '#16a34a' : '#dc2626', borderRadius: 3, transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}><span style={{ width: 12, height: 8, background: '#4f46e5', borderRadius: 2, display: 'inline-block' }}></span>Revenue</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}><span style={{ width: 12, height: 5, background: '#16a34a', borderRadius: 2, display: 'inline-block' }}></span>Profit</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ── Quarter breakdown ── */}
              {reportData.by_quarter && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Quarterly Breakdown</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {reportData.by_quarter.map(q => {
                      const maxQ = Math.max(...reportData.by_quarter.map(x => parseFloat(x.total || 0)), 1);
                      const pct = Math.round((parseFloat(q.total || 0) / maxQ) * 100);
                      return (
                        <div key={q.quarter} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 14px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{q.quarter}</div>
                          <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: '#4f46e5', borderRadius: 3, transition: 'width 0.4s ease' }} />
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>UGX {parseFloat(q.total || 0).toLocaleString()}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{q.transactions} transactions</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: parseFloat(q.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                            Profit: UGX {parseFloat(q.profit || 0).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Payment method breakdown ── */}
              {reportData.by_payment && reportData.by_payment.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Sales by Payment Method</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(() => {
                      const total = reportData.by_payment.reduce((s, p) => s + parseFloat(p.total || 0), 0) || 1;
                      return reportData.by_payment.map(p => (
                        <div key={p.method}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{(p.method || '').replace(/_/g, ' ')}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                              UGX {parseFloat(p.total || 0).toLocaleString()}
                              &nbsp;<span style={{ color: '#94a3b8', fontWeight: 400 }}>({Math.round((parseFloat(p.total || 0) / total) * 100)}%)</span>
                              &nbsp;·&nbsp;
                              <span style={{ color: parseFloat(p.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>profit: UGX {parseFloat(p.profit || 0).toLocaleString()}</span>
                            </span>
                          </div>
                          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(parseFloat(p.total || 0) / total) * 100}%`, background: getPayColor(p.method), borderRadius: 4, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* ── DAILY PURCHASES REPORT ── */}
      {activeReport === 'daily-purchases' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Date picker + button */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={supS.label}>Select Date</label>
              <input
                type="date"
                value={dailyPurchasesDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => { setDailyPurchasesDate(e.target.value); setReportData(null); }}
                style={{ ...supS.input, width: 180 }}
              />
            </div>
            <Button variant="primary" onClick={fetchReport} loading={reportLoading}>Generate Report</Button>
          </div>

          {reportError && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
              ⚠️ {reportError}
            </div>
          )}

          {reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { label: 'Date', value: new Date(reportData.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), icon: '📅', color: '#4f46e5', bg: '#eef2ff' },
                  { label: 'Transactions', value: reportData.total_transactions, icon: '🧾', color: '#0891b2', bg: '#ecfeff' },
                  { label: 'Total Spent', value: `UGX ${parseFloat(reportData.total_amount || 0).toLocaleString()}`, icon: '💸', color: '#dc2626', bg: '#fef2f2' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{k.icon}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
                      <p style={{ margin: '4px 0 0', fontSize: k.label === 'Date' ? 13 : 20, fontWeight: 700, color: k.color }}>{k.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* No purchases message */}
              {reportData.total_transactions === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: 32, margin: '0 0 8px' }}>🛒</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#334155' }}>No purchases on this day</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8' }}>Try selecting a different date.</p>
                </div>
              )}

              {reportData.total_transactions > 0 && (
                <>
                  {/* Supplier breakdown */}
                  {reportData.by_supplier && reportData.by_supplier.length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Spend by Supplier</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(() => {
                          const maxSpend = Math.max(...reportData.by_supplier.map(s => parseFloat(s.total_amount || 0)), 1);
                          return reportData.by_supplier.map(s => (
                            <div key={s.supplier}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{s.supplier}</span>
                                <span style={{ fontSize: 13, color: '#64748b' }}>
                                  {s.transactions} order{s.transactions !== 1 ? 's' : ''}
                                  &nbsp;·&nbsp;
                                  <strong style={{ color: '#0f172a' }}>UGX {parseFloat(s.total_amount || 0).toLocaleString()}</strong>
                                </span>
                              </div>
                              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${(parseFloat(s.total_amount || 0) / maxSpend) * 100}%`, background: '#4f46e5', borderRadius: 4, transition: 'width 0.4s ease' }} />
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Detailed purchases table */}
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Purchase Details</h3>
                      <span style={{ fontSize: 12, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '3px 10px' }}>
                        {reportData.total_transactions} order{reportData.total_transactions !== 1 ? 's' : ''} · {reportData.total_items} item{reportData.total_items !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {(reportData.purchases || []).map((purchase, pi) => (
                      <div key={purchase.id} style={{ borderBottom: pi < reportData.purchases.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        {/* Purchase header */}
                        <div style={{ padding: '14px 24px', background: '#fafbff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ width: 28, height: 28, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#4f46e5', flexShrink: 0 }}>
                              #{pi + 1}
                            </span>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                {purchase.supplier?.name || 'Unknown Supplier'}
                              </span>
                              <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>
                                Order #{purchase.id}
                              </span>
                            </div>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5' }}>
                            UGX {parseFloat(purchase.total_amount || 0).toLocaleString()}
                          </span>
                        </div>

                        {/* Line items */}
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              {['Product', 'Qty', 'Unit Cost', 'Subtotal'].map(h => (
                                <th key={h} style={{ padding: '8px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(purchase.purchase_items || []).map((item, idx) => (
                              <tr key={idx} style={{ borderTop: '1px solid #f8fafc' }}>
                                <td style={{ padding: '10px 24px', fontSize: 13, color: '#0f172a', fontWeight: 500 }}>
                                  {item.product?.name || `Product #${item.product_id}`}
                                  {item.product?.sku && <span style={{ marginLeft: 6, fontSize: 11, color: '#94a3b8' }}>({item.product.sku})</span>}
                                </td>
                                <td style={{ padding: '10px 24px', fontSize: 13, color: '#475569' }}>{item.quantity}</td>
                                <td style={{ padding: '10px 24px', fontSize: 13, color: '#475569' }}>UGX {parseFloat(item.cost_price || 0).toLocaleString()}</td>
                                <td style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                                  UGX {(item.quantity * parseFloat(item.cost_price || 0)).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}

                    {/* Grand total footer */}
                    <div style={{ padding: '16px 24px', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>TOTAL SPENT ON {new Date(reportData.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>UGX {parseFloat(reportData.total_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AI Assistant Tab ──────────────────────────────────────────────────────────
function AiTab({ token, data }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm your AI business analyst. I have access to your sales, purchases, inventory, and revenue data.\n\nAsk me anything — or pick a quick question below to get started.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(0); // seconds remaining
  const bottomRef = useRef(null);
  const cooldownRef = useRef(null);

  const QUICK_PROMPTS = [
    { label: 'Sales performance', icon: '📊', text: 'How did my sales perform this month compared to last month?' },
    { label: 'Top products', icon: '🏆', text: 'Which are my top 5 best-performing products by revenue?' },
    { label: 'Forecast', icon: '🔮', text: 'Based on my sales trend over the last 6 months, forecast my revenue for next month.' },
    { label: 'Low stock alert', icon: '⚠️', text: 'Which products are running low on stock and what should I reorder first?' },
    { label: 'Profit analysis', icon: '💰', text: 'What is my estimated gross profit this month and how can I improve it?' },
    { label: 'Busiest days', icon: '📅', text: 'What are my busiest sales days and peak revenue periods?' },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startCooldown = (seconds) => {
    setCooldown(seconds);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const send = async (questionText) => {
    const q = (questionText ?? input).trim();
    if (!q || loading || cooldown > 0) return;
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ai/chat`, { method: 'POST', headers, body: JSON.stringify({ question: q }) });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg = res.status === 429
          ? '⏳ The AI service is rate-limited right now. Please wait 30 seconds and try again.'
          : json.message || 'The AI service returned an error.';
        setError(msg);
        setMessages(prev => [...prev, { role: 'assistant', text: msg }]);
        if (res.status === 429) startCooldown(30);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: json.answer }]);
      }
    } catch {
      setError('Could not reach the server.');
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Could not reach the server. Please check your connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Simple markdown-ish renderer: bold, bullets, line breaks
  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      // Bold: **text**
      const parts = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );
      const isBullet = line.startsWith('- ') || line.startsWith('• ');
      if (isBullet) {
        return <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3 }}><span style={{ color: '#4f46e5', flexShrink: 0 }}>•</span><span>{parts}</span></div>;
      }
      return <div key={i} style={{ marginBottom: line ? 4 : 8 }}>{parts}</div>;
    });
  };

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderRadius: 16, padding: '28px 32px', marginBottom: 24, boxShadow: '0 4px 24px rgba(15,23,42,0.14)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, boxShadow: '0 4px 16px rgba(79,70,229,0.4)' }}>🤖</div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Powered by Mistral AI</p>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>AI Business Assistant</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Analyse your financial data, spot trends, and forecast business performance</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* ── Chat panel ── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 420, maxHeight: 560 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: msg.role === 'user' ? '#4f46e5' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, color: '#fff', fontWeight: 700,
                }}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                {/* Bubble */}
                <div style={{
                  maxWidth: '78%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  background: msg.role === 'user' ? '#4f46e5' : '#f8fafc',
                  border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                  color: msg.role === 'user' ? '#fff' : '#0f172a',
                  fontSize: 14, lineHeight: '1.6',
                }}>
                  {renderText(msg.text)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🤖</div>
                <div style={{ padding: '12px 18px', borderRadius: '4px 14px 14px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(d => (
                    <div key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: '#94a3b8', animation: `aiPulse 1.2s ease-in-out ${d * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#fafbff' }}>
            {cooldown > 0 && (
              <div style={{ marginBottom: 10, padding: '8px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                ⏳ Rate limited — ready again in <strong>{cooldown}s</strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask anything about your business… (Enter to send, Shift+Enter for new line)"
                rows={2}
                style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none', background: '#fff', color: '#0f172a', lineHeight: '1.5' }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading || cooldown > 0}
                style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: input.trim() && !loading && !cooldown ? '#4f46e5' : '#e2e8f0', color: input.trim() && !loading && !cooldown ? '#fff' : '#94a3b8', cursor: input.trim() && !loading && !cooldown ? 'pointer' : 'not-allowed', fontSize: 18, transition: 'all 0.15s', flexShrink: 0, lineHeight: 1 }}
              >
                {cooldown > 0 ? `${cooldown}s` : '➤'}
              </button>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#94a3b8' }}>Your live business data is sent as context. No data is stored by the AI.</p>
          </div>
        </div>

        {/* ── Right panel: quick prompts + data snapshot ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Quick prompts */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Quick Questions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p.label} onClick={() => send(p.text)} disabled={loading || cooldown > 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: loading || cooldown > 0 ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: loading || cooldown > 0 ? 0.5 : 1, transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = '#a5b4fc'; e.currentTarget.style.background = '#eef2ff'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                >
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live data snapshot */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Data in Context</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '💰', label: 'Total Sales', value: `UGX ${data.stats.totalSales.toLocaleString()}` },
                { icon: '🛒', label: 'Total Purchases', value: `UGX ${data.stats.totalPurchases.toLocaleString()}` },
                { icon: '📦', label: 'Products', value: data.stats.totalProducts },
                { icon: '🧾', label: 'Transactions', value: data.sales.length },
                { icon: '⚠️', label: 'Low Stock', value: data.stats.lowStockCount },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f8fafc' }}>
                  <span style={{ fontSize: 13, color: '#475569' }}>{s.icon} {s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clear chat */}
          <button onClick={() => setMessages([{ role: 'assistant', text: "Chat cleared. What would you like to know?" }])}
            style={{ padding: '9px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            🗑 Clear Chat
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reusable grouped permission picker for custom roles ─────────────────────
function CustomRolePermissionEditor({ permissions, selectedIds, onChange, roleName }) {
  const GROUP_ICONS = {
    products: '📦', categories: '🏷️', suppliers: '🏭', sales: '🧾',
    purchases: '🛒', stock: '📊', users: '👥', roles: '🔐',
  };

  const allIds = Object.values(permissions).flat().map(p => p.id);

  const selectAll = () => onChange(allIds);
  const clearAll = () => onChange([]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={supS.label}>
          {roleName ? `Permissions for "${roleName}" *` : 'Permissions *'}
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={selectAll}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid #7c3aed', background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer', fontWeight: 600 }}>
            Select All
          </button>
          <button type="button" onClick={clearAll}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>
            Clear
          </button>
        </div>
      </div>

      <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        {Object.entries(permissions).map(([group, perms], gi) => {
          const groupIds = perms.map(p => p.id);
          const allSel = groupIds.every(id => selectedIds.includes(id));
          const someSel = groupIds.some(id => selectedIds.includes(id));

          const toggleGroup = () => {
            if (allSel) {
              onChange(selectedIds.filter(id => !groupIds.includes(id)));
            } else {
              onChange([...new Set([...selectedIds, ...groupIds])]);
            }
          };

          return (
            <div key={group} style={{ borderBottom: gi < Object.entries(permissions).length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <button type="button" onClick={toggleGroup} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: allSel ? '#f5f3ff' : someSel ? '#fafbff' : '#fff',
                transition: 'background 0.12s',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${allSel ? '#7c3aed' : someSel ? '#a78bfa' : '#cbd5e1'}`,
                  background: allSel ? '#7c3aed' : someSel ? '#ede9fe' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {allSel && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                  {!allSel && someSel && <span style={{ color: '#7c3aed', fontSize: 11, lineHeight: 1, fontWeight: 900 }}>–</span>}
                </div>
                <span style={{ fontSize: 13 }}>{GROUP_ICONS[group] || '⚙️'}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{group}</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  {groupIds.filter(id => selectedIds.includes(id)).length}/{perms.length} selected
                </span>
              </button>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '6px 14px 12px 42px' }}>
                {perms.map(p => {
                  const checked = selectedIds.includes(p.id);
                  return (
                    <button key={p.id} type="button"
                      onClick={() => onChange(checked ? selectedIds.filter(id => id !== p.id) : [...selectedIds, p.id])}
                      style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        border: `1.5px solid ${checked ? '#7c3aed' : '#e2e8f0'}`,
                        background: checked ? '#7c3aed' : '#f8fafc',
                        color: checked ? '#fff' : '#475569',
                        transition: 'all 0.12s',
                      }}>
                      {checked && '✓ '}{p.display_name || p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedIds.length === 0 && (
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Select at least one permission</p>
      )}
      {selectedIds.length > 0 && (
        <p style={{ fontSize: 12, color: '#7c3aed', margin: 0, fontWeight: 500 }}>
          {selectedIds.length} permission{selectedIds.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}

// Users Tab Component
function UsersTab({ token, user: currentUser, toast, canCreate = false, canEdit = false, canDelete = false, canViewRoles = false }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const EMPTY_FORM = {
    name: '', email: '', password: '',
    role_ids: [],
    useCustomRole: false,
    customRoleName: '', customRoleDesc: '', customPermIds: [],
    // for editing existing custom role permissions
    editCustomRoleId: null, editCustomPermIds: [],
  };
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({}); // grouped by category
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // holds user object pending deletion
  const [confirmDeleteRole, setConfirmDeleteRole] = useState(null); // holds role object pending deletion
  const [deletingRoleId, setDeletingRoleId] = useState(null);
  const [search, setSearch] = useState('');
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };

  const isOwner = currentUser.roles?.some(r => r.name === 'owner');
  const isOwnerOrAdmin = currentUser.roles?.some(r => ['owner', 'admin'].includes(r.name));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [uRes, rRes, pRes] = await Promise.all([
          fetch(`${API_URL}/users`, { headers }),
          fetch(`${API_URL}/roles`, { headers }),
          fetch(`${API_URL}/permissions`, { headers }),
        ]);
        const uJson = await uRes.json();
        const rJson = await rRes.json();
        const pJson = await pRes.json();
        setUsers(uJson.data || []);
        setRoles(rJson.data || []);
        setPermissions(pJson.data || {});
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  // Load full user details (including custom role permissions) before opening edit modal
  const openEdit = async (u) => {
    setFormError(null);
    setLoadingUserDetail(true);
    setShowModal(true);
    try {
      const res = await fetch(`${API_URL}/users/${u.id}`, { headers });
      const json = await res.json();
      const fullUser = res.ok ? json.data : u;

      // Detect if any of the user's roles is a custom (non-default, tenant-owned) role
      const customRole = (fullUser.roles || []).find(r => r.is_custom);
      const editCustomPermIds = customRole ? (customRole.permissions || []).map(p => p.id) : [];

      setEditTarget(fullUser);
      setForm({
        ...EMPTY_FORM,
        name: fullUser.name,
        email: fullUser.email,
        role_ids: (fullUser.roles || []).map(r => r.id),
        editCustomRoleId: customRole ? customRole.id : null,
        editCustomPermIds,
      });
    } catch {
      setEditTarget(u);
      setForm({ ...EMPTY_FORM, name: u.name, email: u.email, role_ids: (u.roles || []).map(r => r.id) });
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const toggleRole = (id) => {
    setForm(f => ({
      ...f,
      role_ids: f.role_ids.includes(id) ? f.role_ids.filter(r => r !== id) : [...f.role_ids, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Custom validation
    if (!form.name.trim()) {
      setFormError('User name is required');
      return;
    }
    if (form.name.trim().length < 2) {
      setFormError('User name must be at least 2 characters');
      return;
    }
    if (!form.email.trim()) {
      setFormError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError('Please enter a valid email address');
      return;
    }
    if (!editTarget && !form.password) {
      setFormError('Password is required for new users');
      return;
    }
    if (!editTarget && form.password && form.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    // ── ADD USER: Custom role path (atomic endpoint) ──────────────────────────
    if (!editTarget && form.useCustomRole) {
      if (!form.customRoleName.trim()) { setFormError('Please enter a name for the custom role.'); return; }
      if (form.customPermIds.length === 0) { setFormError('Please select at least one permission for the custom role.'); return; }
      setSaving(true);
      setFormError(null);
      try {
        const res = await fetch(`${API_URL}/users/with-custom-role`, {
          method: 'POST', headers,
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            role_name: form.customRoleName.trim(),
            role_description: form.customRoleDesc.trim() || null,
            permission_ids: form.customPermIds,
          }),
        });
        const json = await res.json();
        if (!res.ok) { setFormError(json?.message || 'Failed to create user with custom role.'); return; }

        const newUser = json.data;
        const newRole = json.data.custom_role;
        setUsers(prev => [...prev, newUser]);
        if (newRole) setRoles(prev => [...prev, newRole]);
        toast.success('User added', `"${newUser.name}" has been added with custom role "${newRole?.name || form.customRoleName}".`);
        setShowModal(false);
      } catch { setFormError('Could not reach the server.'); }
      finally { setSaving(false); }
      return;
    }

    // ── ADD USER: Standard role path ─────────────────────────────────────────
    if (!editTarget && !form.useCustomRole && form.role_ids.length === 0) {
      setFormError('Please assign at least one role.');
      return;
    }

    // ── EDIT USER ─────────────────────────────────────────────────────────────
    setSaving(true);
    setFormError(null);
    try {
      const isEdit = !!editTarget;

      // If editing and there's a custom role with changed permissions, update them first
      if (isEdit && form.editCustomRoleId && isOwner) {
        const permRes = await fetch(`${API_URL}/users/${editTarget.id}/custom-role-permissions`, {
          method: 'PUT', headers,
          body: JSON.stringify({
            role_id: form.editCustomRoleId,
            permission_ids: form.editCustomPermIds,
          }),
        });
        const permJson = await permRes.json();
        if (!permRes.ok) { setFormError(permJson?.message || 'Failed to update custom role permissions.'); setSaving(false); return; }
      }

      const body = isEdit
        ? { name: form.name, email: form.email, role_ids: form.role_ids, ...(form.password ? { password: form.password } : {}) }
        : { name: form.name, email: form.email, password: form.password, role_ids: form.role_ids };

      const res = await fetch(`${API_URL}/users${isEdit ? `/${editTarget.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json?.message || 'Something went wrong.'); return; }

      if (isEdit) {
        setUsers(prev => prev.map(u => u.id === editTarget.id ? json.data : u));
      } else {
        setUsers(prev => [...prev, json.data]);
      }
      toast.success(isEdit ? 'User updated' : 'User added', `"${json.data.name}" has been ${isEdit ? 'updated' : 'added'}.`);
      setShowModal(false);
    } catch { setFormError('Could not reach the server.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (u) => {
    setDeletingId(u.id);
    try {
      const res = await fetch(`${API_URL}/users/${u.id}`, { method: 'DELETE', headers });
      if (!res.ok) { const j = await res.json(); toast.error('Delete failed', j?.message || 'Failed to delete user.'); return; }
      setUsers(prev => prev.filter(x => x.id !== u.id));
      toast.success('User deleted', `"${u.name}" has been removed.`);
    } catch { toast.error('Delete failed', 'Could not reach the server.'); }
    finally { setDeletingId(null); setConfirmDelete(null); }
  };

  const handleDeleteRole = async (role) => {
    setDeletingRoleId(role.id);
    try {
      const res = await fetch(`${API_URL}/roles/${role.id}`, { method: 'DELETE', headers });
      if (!res.ok) { const j = await res.json(); toast.error('Delete failed', j?.message || 'Failed to delete role.'); return; }
      setRoles(prev => prev.filter(r => r.id !== role.id));
      // Also clear the role from any users displayed in the table
      setUsers(prev => prev.map(u => ({ ...u, roles: (u.roles || []).filter(r => r.id !== role.id) })));
      toast.success('Role deleted', `"${role.name}" has been removed.`);
    } catch { toast.error('Delete failed', 'Could not reach the server.'); }
    finally { setDeletingRoleId(null); setConfirmDeleteRole(null); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const { paged: pagedUsers, page: uPage, setPage: setUPage, totalPages: uTotalPages, total: uTotal, pageSize: uPageSize } = usePagination(filtered);

  const roleColors = { owner: '#7c3aed', admin: '#2563eb', manager: '#0891b2', cashier: '#16a34a' };
  const getRoleColor = (name) => roleColors[name] || '#64748b';

  return (
    <div style={styles.pageContainer}>
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Administration</p>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>User Management</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Manage team members and their access roles</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {users.length > 0 && (
            <input style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', width: 220 }}
              placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
          )}
          {canCreate && (
            <button onClick={openAdd} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
              onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
              + Add User
            </button>
          )}
        </div>
      </div>
      {/* Users table */}

      <div style={styles.contentCard}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading users…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No users match your search' : 'No users yet'}
            description={search ? 'Try a different name or email.' : 'Add team members to get started.'}
            actionLabel={search ? 'Clear Search' : 'Add First User'}
            onAction={search ? () => setSearch('') : openAdd}
          />
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {['User', 'Email', 'Roles', 'Joined', ...(canEdit || canDelete ? ['Actions'] : [])].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    {/* Avatar + Name */}
                    <td style={{ padding: '14px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', background: '#ede9fe',
                          color: '#7c3aed', fontWeight: 700, fontSize: 15,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{u.name}</div>
                          {u.id === currentUser.id && (
                            <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 500 }}>You</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{ padding: '14px 14px', color: '#475569', fontSize: 14 }}>{u.email}</td>
                    {/* Roles */}
                    <td style={{ padding: '14px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(u.roles || []).length > 0 ? u.roles.map(r => (
                          <span key={r.id} style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            background: getRoleColor(r.name) + '18', color: getRoleColor(r.name),
                            border: `1px solid ${getRoleColor(r.name)}40`,
                          }}>{r.name}</span>
                        )) : <span style={{ color: '#94a3b8', fontSize: 13 }}>No role</span>}
                      </div>
                    </td>
                    {/* Joined */}
                    <td style={{ padding: '14px 14px', color: '#94a3b8', fontSize: 13 }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    {/* Actions */}
                    {(canEdit || canDelete) && (
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {canEdit && (
                            <button onClick={() => openEdit(u)} style={{
                              padding: '5px 12px', borderRadius: 6, border: '1px solid #3b82f6',
                              background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                            }}>Edit</button>
                          )}
                          {canDelete && u.id !== currentUser.id && (isOwner || !u.roles?.some(r => r.name === 'owner')) && (
                            <button onClick={() => setConfirmDelete(u)} disabled={deletingId === u.id} style={{
                              padding: '5px 12px', borderRadius: 6, border: '1px solid #ef4444',
                              background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                            }}>
                              {deletingId === u.id ? '…' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <InlinePager page={uPage} totalPages={uTotalPages} total={uTotal} pageSize={uPageSize} setPage={setUPage} />
          </>
        )}
      </div>

      {/* ── Roles section (visible to anyone with canViewRoles; delete only for owners) ─── */}
      {canViewRoles && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Roles</h2>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>All roles available in this business — default system roles cannot be deleted.</p>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {roles.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                No custom roles yet. Create one by adding a user with a custom role.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Role Name', 'Type', 'Description', 'Assigned To', ...(isOwner ? ['Actions'] : [])].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roles.map(role => {
                    const assignedUsers = users.filter(u => (u.roles || []).some(r => r.id === role.id));
                    return (
                      <tr key={role.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15 }}>{role.is_default ? '🛡️' : '✨'}</span>
                            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{role.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{
                            padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            background: role.is_default ? '#ede9fe' : '#f0fdf4',
                            color: role.is_default ? '#7c3aed' : '#16a34a',
                          }}>
                            {role.is_default ? 'System' : 'Custom'}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px', color: '#475569', fontSize: 13 }}>{role.description || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                        <td style={{ padding: '13px 16px' }}>
                          {assignedUsers.length === 0 ? (
                            <span style={{ color: '#94a3b8', fontSize: 13 }}>Unassigned</span>
                          ) : (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {assignedUsers.map(u => (
                                <span key={u.id} style={{ padding: '2px 9px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: '#f1f5f9', color: '#475569' }}>
                                  {u.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        {isOwner && (
                          <td style={{ padding: '13px 16px' }}>
                            {!role.is_default && (
                              <button
                                onClick={() => setConfirmDeleteRole(role)}
                                disabled={deletingRoleId === role.id}
                                style={{
                                  padding: '5px 12px', borderRadius: 6, border: '1px solid #ef4444',
                                  background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                                  opacity: deletingRoleId === role.id ? 0.6 : 1,
                                }}
                              >
                                {deletingRoleId === role.id ? '…' : 'Delete'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Delete Role Confirmation Modal */}
      <Modal
        isOpen={!!confirmDeleteRole}
        onClose={() => setConfirmDeleteRole(null)}
        title="Delete Custom Role"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setConfirmDeleteRole(null)} style={{ minWidth: 90 }}>Cancel</Button>
            <Button
              variant="danger"
              loading={deletingRoleId === confirmDeleteRole?.id}
              onClick={() => handleDeleteRole(confirmDeleteRole)}
              style={{ minWidth: 120 }}
            >
              Delete Role
            </Button>
          </div>
        }
      >
        {confirmDeleteRole && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#fef2f2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                🗑️
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Delete "{confirmDeleteRole.name}"?</p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>{confirmDeleteRole.description || 'Custom role'}</p>
              </div>
            </div>
            {users.filter(u => (u.roles || []).some(r => r.id === confirmDeleteRole.id)).length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 12 }}>
                ⚠️ This role is currently assigned to {users.filter(u => (u.roles || []).some(r => r.id === confirmDeleteRole.id)).length} user(s). They will lose this role immediately.
              </div>
            )}
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#b91c1c' }}>
              ⚠️ This action is permanent and cannot be undone.
            </div>
          </div>
        )}
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete User"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)} style={{ minWidth: 90 }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deletingId === confirmDelete?.id}
              onClick={() => handleDelete(confirmDelete)}
              style={{ minWidth: 110 }}
            >
              Delete
            </Button>
          </div>
        }
      >
        {confirmDelete && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#fef2f2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                🗑️
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Delete "{confirmDelete.name}"?</p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>{confirmDelete.email}</p>
              </div>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#b91c1c' }}>
              ⚠️ This action is permanent. The user will lose access immediately and cannot be recovered.
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? 'Edit User' : 'Add New User'}
        size="lg"
      >
        {loadingUserDetail ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Loading user details…
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Row 1: Name + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={supS.label}>Full Name *</label>
                <input style={supS.input} placeholder="John Doe" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={supS.label}>Email *</label>
                <input style={supS.input} type="email" placeholder="user@business.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={supS.label}>{editTarget ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
              <input style={supS.input} type="password" placeholder={editTarget ? '••••••••' : 'Min 8 chars, upper, lower, number'}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required={!editTarget} minLength={editTarget ? 0 : 8} />
            </div>

            {/* Role Mode Toggle — only shown when adding a new user (owners only can create custom roles) */}
            {!editTarget && isOwner && (
              <div style={{ display: 'flex', gap: 0, borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, useCustomRole: false, customRoleName: '', customRoleDesc: '', customPermIds: [] }))}
                  style={{
                    flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: 'none', borderRight: '1px solid #e2e8f0',
                    background: !form.useCustomRole ? '#4f46e5' : '#f8fafc',
                    color: !form.useCustomRole ? '#fff' : '#64748b',
                    transition: 'all 0.15s',
                  }}
                >
                  🎭 Predefined Role
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, useCustomRole: true, role_ids: [] }))}
                  style={{
                    flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: 'none',
                    background: form.useCustomRole ? '#7c3aed' : '#f8fafc',
                    color: form.useCustomRole ? '#fff' : '#64748b',
                    transition: 'all 0.15s',
                  }}
                >
                  ✨ Custom Role
                </button>
              </div>
            )}

            {/* ── PREDEFINED ROLE PICKER ── */}
            {(!form.useCustomRole || editTarget) && !(editTarget && form.editCustomRoleId) && (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={supS.label}>Assign Roles *</label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {roles.map(r => {
                  const selected = form.role_ids.includes(r.id);
                  const color = getRoleColor(r.name);

                  const ROLE_META = {
                    owner: { icon: '👑', desc: 'Full access to everything — settings, users, all reports, all data.', perms: ['Manage users & roles', 'All reports & analytics', 'View & edit all sales', 'Manage products & inventory', 'Manage suppliers & customers', 'All purchases'] },
                    admin: { icon: '🛡️', desc: 'Same as owner except cannot delete the owner account.', perms: ['Manage users & roles', 'All reports & analytics', 'View & edit all sales', 'Manage products & inventory', 'Manage suppliers & customers', 'All purchases'] },
                    manager: { icon: '📋', desc: 'Operational access — can see all sales, run reports, manage stock.', perms: ['View all sales (any staff)', 'Daily, weekly, monthly & yearly reports', 'Manage products & inventory', 'Manage suppliers & customers', 'View purchases'] },
                    cashier: { icon: '🧾', desc: 'POS-only access — can process sales and view only their own transactions.', perms: ['Process sales (POS)', 'View own sales only', 'View products & stock levels', 'View customers'] },
                  };

                  const meta = ROLE_META[r.name?.toLowerCase()] || { icon: '👤', desc: r.description || 'Custom role.', perms: [] };

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRole(r.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                        border: `2px solid ${selected ? color : '#e2e8f0'}`,
                        background: selected ? color + '0d' : '#fafbff',
                        transition: 'all 0.15s',
                        width: '100%',
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        border: `2px solid ${selected ? color : '#cbd5e1'}`,
                        background: selected ? color : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {selected && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16 }}>{meta.icon}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: selected ? color : '#0f172a', textTransform: 'capitalize' }}>{r.name}</span>
                          {selected && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: color + '20', color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Selected</span>}
                        </div>
                        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{meta.desc}</p>
                        {meta.perms.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {meta.perms.map(p => (
                              <span key={p} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: selected ? color + '15' : '#f1f5f9', color: selected ? color : '#475569', fontWeight: 500 }}>
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {form.role_ids.length === 0 && (
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Select at least one role</p>
              )}
            </div>
            )}

            {/* ── EDIT: Custom Role Permission Manager (owner only) ── */}
            {editTarget && form.editCustomRoleId && isOwner && (
              <CustomRolePermissionEditor
                permissions={permissions}
                selectedIds={form.editCustomPermIds}
                onChange={ids => setForm(f => ({ ...f, editCustomPermIds: ids }))}
                roleName={(editTarget.roles || []).find(r => r.id === form.editCustomRoleId)?.name}
              />
            )}

            {/* ── EDIT: Custom role info for non-owners (read-only notice) ── */}
            {editTarget && form.editCustomRoleId && !isOwner && (
              <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#6d28d9' }}>
                ✨ This user has a <strong>custom role</strong>. Only the owner can modify its permissions.
              </div>
            )}

            {/* ── ADD USER: CUSTOM ROLE BUILDER ── */}
            {form.useCustomRole && !editTarget && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#6d28d9' }}>
                  <strong>Custom Role</strong> — a new role will be created and assigned exclusively to this user. You pick exactly which permissions it includes.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={supS.label}>Role Name *</label>
                    <input
                      style={supS.input}
                      placeholder="e.g. Warehouse Staff"
                      value={form.customRoleName}
                      onChange={e => setForm(f => ({ ...f, customRoleName: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={supS.label}>Description (optional)</label>
                    <input
                      style={supS.input}
                      placeholder="e.g. Can view stock and process sales"
                      value={form.customRoleDesc}
                      onChange={e => setForm(f => ({ ...f, customRoleDesc: e.target.value }))}
                    />
                  </div>
                </div>

                <CustomRolePermissionEditor
                  permissions={permissions}
                  selectedIds={form.customPermIds}
                  onChange={ids => setForm(f => ({ ...f, customPermIds: ids }))}
                />
              </div>
            )}

            {formError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                ⚠️ {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving} style={{ flex: 1 }}>
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add User'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

// Stock Movements Tab Component
function StockMovementsTab({ token, products, canCreate = true }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  // ── Adjust Stock form state ────────────────────────────────────────────────
  const [adjProduct, setAdjProduct] = useState('');
  const [adjType, setAdjType] = useState('IN');
  const [adjQty, setAdjQty] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [adjDate, setAdjDate] = useState('');
  const [adjLoading, setAdjLoading] = useState(false);
  const [adjError, setAdjError] = useState('');
  const [adjSuccess, setAdjSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/stock-movements`, { headers });
        const json = await res.json();
        setMovements(json.data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const adjTypeDescriptions = {
    IN: 'Adds quantity to current stock.',
    OUT: 'Removes quantity from current stock.',
    ADJUSTMENT: 'Sets stock to an exact absolute level.',
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjError('');
    setAdjSuccess('');
    if (!adjProduct) { setAdjError('Please select a product.'); return; }
    if (!adjQty || isNaN(adjQty) || Number(adjQty) < 1) { setAdjError('Enter a valid quantity (minimum 1).'); return; }

    setAdjLoading(true);
    try {
      const body = {
        product_id: Number(adjProduct),
        type: adjType,
        quantity: Number(adjQty),
        reason: adjReason || undefined,
        date: adjDate || undefined,
      };
      const res = await fetch(`${API_URL}/stock-movements`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to apply adjustment.');

      setAdjSuccess('Stock adjusted successfully.');
      setAdjProduct('');
      setAdjQty('');
      setAdjReason('');
      setAdjDate('');
      setAdjType('IN');

      // Refresh movements list
      const refreshRes = await fetch(`${API_URL}/stock-movements`, { headers });
      const refreshJson = await refreshRes.json();
      setMovements(refreshJson.data || []);
    } catch (err) {
      setAdjError(err.message);
    } finally {
      setAdjLoading(false);
    }
  };

  const filtered = movements.filter(m => {
    const productName = m.product?.name || '';
    if (search && !productName.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && m.type !== typeFilter) return false;
    if (productFilter && String(m.product_id) !== String(productFilter)) return false;
    return true;
  });

  const totalIn = movements.filter(m => m.type === 'IN').reduce((s, m) => s + m.quantity, 0);
  const totalOut = movements.filter(m => m.type === 'OUT').reduce((s, m) => s + m.quantity, 0);

  return (
    <div style={styles.pageContainer}>
      <div className="section-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inventory</p>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Stock Movements</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Full audit trail of all inventory changes</p>
      </div>

      {/* Summary cards */}
      <div className="kpi-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Movements', value: movements.length, color: '#4f46e5', borderColor: '#4f46e5' },
          { label: 'Stock In', value: totalIn, color: '#16a34a', borderColor: '#16a34a' },
          { label: 'Stock Out', value: totalOut, color: '#dc2626', borderColor: '#dc2626' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: `3px solid ${k.borderColor}`, borderRadius: 12, padding: '18px 22px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: k.color, letterSpacing: '-0.5px' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <input style={{ ...fS.input, maxWidth: 240 }} placeholder="Search by product…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select style={fS.select} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>
        <select style={fS.select} value={productFilter} onChange={e => setProductFilter(e.target.value)}>
          <option value="">All Products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(search || typeFilter || productFilter) && (
          <button style={fS.clear} onClick={() => { setSearch(''); setTypeFilter(''); setProductFilter(''); }}>✕ Clear</button>
        )}
      </div>

      <div style={styles.contentCard}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading movements…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔄" title="No stock movements found"
            description={search || typeFilter || productFilter ? 'Try adjusting your filters.' : 'Stock movements are recorded automatically when sales and purchases are made.'}
            actionLabel={search || typeFilter || productFilter ? 'Clear Filters' : null}
            onAction={search || typeFilter || productFilter ? () => { setSearch(''); setTypeFilter(''); setProductFilter(''); } : null}
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['Date', 'Product', 'Type', 'Quantity', 'Reference', 'Source'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '13px 14px', color: '#475569', fontSize: 13 }}>
                    {new Date(m.date || m.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '13px 14px', fontWeight: 600, color: '#0f172a', fontSize: 14 }}>
                    {m.product?.name || `#${m.product_id}`}
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: m.type === 'IN' ? '#f0fdf4' : m.type === 'OUT' ? '#fef2f2' : '#f5f3ff',
                      color: m.type === 'IN' ? '#16a34a' : m.type === 'OUT' ? '#dc2626' : '#7c3aed',
                      border: `1px solid ${m.type === 'IN' ? '#bbf7d0' : m.type === 'OUT' ? '#fecaca' : '#ddd6fe'}`,
                    }}>
                      {m.type === 'IN' ? '📥' : m.type === 'OUT' ? '📤' : '🔧'} {m.type}
                    </span>
                  </td>
                  <td style={{ padding: '13px 14px', fontWeight: 700, fontSize: 14, color: m.type === 'IN' ? '#16a34a' : m.type === 'OUT' ? '#dc2626' : '#7c3aed' }}>
                    {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : '⇒'}{m.quantity}
                  </td>
                  <td style={{ padding: '13px 14px', color: '#475569', fontSize: 13 }}>
                    #{m.reference_id || '—'}
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: m.reference_type === 'sale' ? '#eff6ff' : m.reference_type === 'purchase' ? '#f0fdf4' : '#f5f3ff',
                      color: m.reference_type === 'sale' ? '#2563eb' : m.reference_type === 'purchase' ? '#16a34a' : '#7c3aed',
                      border: `1px solid ${m.reference_type === 'sale' ? '#bfdbfe' : m.reference_type === 'purchase' ? '#bbf7d0' : '#ddd6fe'}`,
                      textTransform: 'capitalize',
                    }}>
                      {m.reference_type || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Adjust Stock Form ───────────────────────────────────────────── */}
      {canCreate && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '28px 32px', marginTop: 28, boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <span style={{ fontSize: 22 }}>📋</span>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Adjust Stock</h2>
          </div>

          <form onSubmit={handleAdjustSubmit}>
            {/* Product */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Product <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={adjProduct}
                onChange={e => setAdjProduct(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: adjProduct ? '#0f172a' : '#94a3b8', background: '#fff', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="">— Select product —</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Adjustment Type */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Adjustment Type <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { value: 'IN', label: '⬆ Stock In', activeColor: '#16a34a', activeBg: '#f0fdf4', activeBorder: '#16a34a' },
                  { value: 'OUT', label: '⬇ Stock Out', activeColor: '#dc2626', activeBg: '#fef2f2', activeBorder: '#dc2626' },
                  { value: 'ADJUSTMENT', label: '🔧 Set Level', activeColor: '#7c3aed', activeBg: '#f5f3ff', activeBorder: '#7c3aed' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAdjType(opt.value)}
                    style={{
                      padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: `2px solid ${adjType === opt.value ? opt.activeBorder : '#e2e8f0'}`,
                      background: adjType === opt.value ? opt.activeBg : '#fff',
                      color: adjType === opt.value ? opt.activeColor : '#64748b',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>{adjTypeDescriptions[adjType]}</p>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Quantity <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={adjQty}
                onChange={e => setAdjQty(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Reason */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Reason <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Damaged goods, Stock count correction..."
                value={adjReason}
                onChange={e => setAdjReason(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Date */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Date <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>(Optional — defaults to today)</span>
              </label>
              <input
                type="date"
                value={adjDate}
                onChange={e => setAdjDate(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Error / Success feedback */}
            {adjError && (
              <div style={{ marginBottom: 16, padding: '10px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13, fontWeight: 500 }}>
                ⚠ {adjError}
              </div>
            )}
            {adjSuccess && (
              <div style={{ marginBottom: 16, padding: '10px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, color: '#16a34a', fontSize: 13, fontWeight: 500 }}>
                ✓ {adjSuccess}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={adjLoading}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                background: adjLoading ? '#86efac' : '#16a34a',
                color: '#fff', fontSize: 15, fontWeight: 700, cursor: adjLoading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {adjLoading ? 'Applying…' : 'Apply Adjustment'}
            </button>
          </form>

          {/* Low stock warnings */}
          {products.filter(p => p.reorder_level != null && p.stock <= p.reorder_level).length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ⚠ {products.filter(p => p.reorder_level != null && p.stock <= p.reorder_level).length} product{products.filter(p => p.reorder_level != null && p.stock <= p.reorder_level).length > 1 ? 's' : ''} low on stock
              </p>
              {products.filter(p => p.reorder_level != null && p.stock <= p.reorder_level).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 13, color: '#b45309', fontWeight: 700 }}>{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared inline pagination ──────────────────────────────────────────────────
function usePagination(items, pageSize = 15) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [items]);
  const totalPages = Math.ceil(items.length / pageSize);
  const paged = items.slice((page - 1) * pageSize, page * pageSize);
  return { paged, page, setPage, totalPages, total: items.length, pageSize };
}

function InlinePager({ page, totalPages, total, pageSize, setPage }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }
  const btn = (active) => ({
    minWidth: 32, height: 32, borderRadius: 7,
    border: `1px solid ${active ? '#4f46e5' : '#e2e8f0'}`,
    background: active ? '#4f46e5' : '#fff',
    color: active ? '#fff' : '#475569',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: '1px solid #f1f5f9', background: '#fafbff' }}>
      <span style={{ fontSize: 13, color: '#64748b' }}>Showing <strong>{from}–{to}</strong> of <strong>{total}</strong></span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{ ...btn(false), opacity: page === 1 ? 0.4 : 1 }} onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
        {pages.map((p, i) => p === '...'
          ? <span key={`e${i}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: 13, alignSelf: 'center' }}>…</span>
          : <button key={p} style={btn(p === page)} onClick={() => setPage(p)}>{p}</button>
        )}
        <button style={{ ...btn(false), opacity: page === totalPages ? 0.4 : 1 }} onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ token, user, toast, onUpdate, onBusinessNameUpdate }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };
  
  const [tenantData, setTenantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Fetch tenant data
  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/tenants/${user.tenant_id}`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        setTenantData(json.data);
        setFormData({
          name: json.data.name || '',
          email: json.data.email || '',
          phone: json.data.phone || '',
          address: json.data.address || ''
        });
      } else {
        toast.error('Failed to load business information');
      }
    } catch (error) {
      console.error('Error fetching tenant:', error);
      toast.error('Failed to load business information');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Business name is required');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/tenants/${user.tenant_id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success('Business information updated successfully');
        setTenantData(json.data);
        setEditMode(false);
        if (onUpdate) onUpdate();
        if (onBusinessNameUpdate && json.data.name) {
          onBusinessNameUpdate(json.data.name);
        }
      } else {
        toast.error(json.message || 'Failed to update business information');
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast.error('Failed to update business information');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: tenantData?.name || '',
      email: tenantData?.email || '',
      phone: tenantData?.phone || '',
      address: tenantData?.address || ''
    });
    setEditMode(false);
  };

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: 20, color: '#64748b' }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
        borderRadius: 16,
        padding: '28px 32px',
        marginBottom: 24,
        boxShadow: '0 4px 24px rgba(15,23,42,0.14)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)'
          }}>
            ⚙️
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              margin: '0 0 2px',
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Business Settings
            </p>
            <h1 style={{
              margin: '0 0 4px',
              fontSize: 22,
              fontWeight: 700,
              color: '#f8fafc',
              letterSpacing: '-0.3px'
            }}>
              Business Information
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1' }}>
              Manage your business details and contact information
            </p>
          </div>
        </div>
      </div>

      {/* Business Information Card */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
      }}>
        {/* Card Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: '#0f172a'
            }}>
              Business Details
            </h2>
            <p style={{
              margin: '4px 0 0',
              fontSize: 13,
              color: '#64748b'
            }}>
              Update your business information visible to staff and reports
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {editMode ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    color: '#64748b',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: saving ? '#cbd5e1' : '#4f46e5',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {saving ? '💾 Saving...' : '💾 Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#4f46e5',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✏️ Edit Information
              </button>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            maxWidth: 900
          }}>
            {/* Business Name */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 6
              }}>
                Business Name *
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter business name"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              ) : (
                <div style={{
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#0f172a',
                  fontWeight: 600
                }}>
                  {tenantData?.name || 'Not set'}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 6
              }}>
                Email Address
              </label>
              {editMode ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="business@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              ) : (
                <div style={{
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#0f172a'
                }}>
                  {tenantData?.email || 'Not set'}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 6
              }}>
                Phone Number
              </label>
              {editMode ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0700000000"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              ) : (
                <div style={{
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#0f172a'
                }}>
                  {tenantData?.phone || 'Not set'}
                </div>
              )}
            </div>

            {/* Address */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 6
              }}>
                Business Address
              </label>
              {editMode ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter complete business address"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              ) : (
                <div style={{
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#0f172a',
                  minHeight: 60
                }}>
                  {tenantData?.address || 'Not set'}
                </div>
              )}
            </div>
          </div>

          {/* Info message */}
          <div style={{
            marginTop: 20,
            padding: '12px 16px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: 18 }}>ℹ️</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#1e40af' }}>
                About Business Information
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#3b82f6', lineHeight: 1.5 }}>
                Your business information is displayed on receipts, reports, and throughout the system. 
                Keep it updated to ensure accurate communication with customers and staff.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div style={{
        marginTop: 20,
        padding: '16px 20px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 12
      }}>
        <div style={{ display: 'flex', gap: 30 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Business ID
            </p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
              #{user.tenant_id}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Created Date
            </p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
              {tenantData?.created_at ? new Date(tenantData.created_at).toLocaleDateString('en-UG', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'N/A'}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Last Updated
            </p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
              {tenantData?.updated_at ? new Date(tenantData.updated_at).toLocaleDateString('en-UG', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    minHeight: 64,
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
    color: '#ffffff',
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
    left: theme.spacing.md,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '14px',
    color: '#94a3b8'
  },

  searchInput: {
    width: '100%',
    padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} ${theme.spacing['2xl']}`,
    border: '1px solid #334155',
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.typography.fontSize.sm,
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    transition: theme.transitions.default,
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
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: theme.colors.primary[600],
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold
  },

  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs
  },

  userName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#f1f5f9'
  },

  userRole: {
    fontSize: theme.typography.fontSize.xs,
    color: '#94a3b8',
    fontWeight: theme.typography.fontWeight.normal
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
    backgroundColor: '#0f172a',
    borderRight: '1px solid #1e293b',
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
    gap: theme.spacing.md,
    padding: '13px 14px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#94a3b8',
    textAlign: 'left',
    borderRadius: theme.borderRadius.lg,
    transition: theme.transitions.default,
    position: 'relative',
    width: '100%'
  },

  menuItemActive: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    fontWeight: theme.typography.fontWeight.semibold
  },

  menuIcon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center',
    opacity: 0.8
  },

  menuLabel: {
    flex: 1,
    fontSize: '14px'
  },

  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '18px',
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.sm
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

// Add CSS animations for dashboard components
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

// ════════════════════════════════════════════════
// PRINTABLE INVOICE MODAL
// ════════════════════════════════════════════════
function PrintableInvoiceModal({ invoice, user, onClose }) {
  if (!invoice) return null;

  const handlePrint = () => { window.print(); };

  const tenant = user?.tenant || {};
  const businessName    = tenant.name    || user?.name  || 'Smart Trendz';
  const businessPhone   = tenant.phone   || user?.phone || '0776 293691';
  const businessEmail   = tenant.email   || user?.email || '';
  const businessAddress = tenant.address || 'Shop 311, Level 3, Kooki Tower Opp. City Square';
  const businessTagline = tenant.tagline || 'Best Unboxing Xperience';

  const items    = invoice.items || invoice.sale_items || invoice.saleItems || [];
  const subtotal = invoice.subtotal != null
    ? parseFloat(invoice.subtotal)
    : items.reduce((s, i) => s + (parseFloat(i.subtotal) || (parseFloat(i.price || 0) * parseFloat(i.quantity || 1))), 0);
  const discount = parseFloat(invoice.discount_amount || 0);
  const tax      = parseFloat(invoice.tax_amount || 0);
  const total    = parseFloat(invoice.total_amount || (subtotal - discount + tax));
  const paid     = parseFloat(invoice.amount_paid ?? total);
  const balance  = Math.max(0, total - paid);

  const fmtDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    // Avoid timezone offset shifting the date
    const utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utc.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const invoiceNumber = invoice.invoice_number || `INV/25-26/${String(invoice.id || '0125').padStart(4, '0')}`;
  const invoiceDate   = fmtDate(invoice.invoice_date || invoice.sale_date || invoice.created_at);
  const dueDate       = fmtDate(invoice.due_date || invoice.invoice_date || invoice.sale_date);
  const sourceRef     = invoice.source_ref || `S${String(invoice.id || '00124').padStart(5, '0')}`;
  const customerName    = invoice.customer_name || invoice.customer?.name || 'Valued Customer';
  const customerPhone   = invoice.customer_phone || invoice.customer?.phone || invoice.customer?.contact || '';
  const customerEmail   = invoice.customer_email || invoice.customer?.email || '';
  const customerAddress = invoice.customer_address || invoice.customer?.address || '';

  return (
    <Modal isOpen={true} onClose={onClose} title="" size="xl" className="invoice-modal">
      {/* ── Action bar (screen only, hidden on print) ── */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📄</div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{invoiceNumber}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{customerName}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handlePrint} style={{ padding: '9px 20px', borderRadius: 7, border: 'none', background: '#881337', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 3px 10px rgba(136,19,55,0.3)' }}>🖨️ Print / Save PDF</button>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 7, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Close</button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PRINTABLE INVOICE BODY
          Matches the Smart Trendz proforma layout
      ══════════════════════════════════════════════ */}
      <div id="printable-invoice" style={{
        background: '#ffffff',
        padding: '36px 44px 32px',
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        color: '#0f172a',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Decorative circle — top right, matches screenshot */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 260, height: 260, borderRadius: '50%',
          background: 'rgba(190,18,60,0.06)', pointerEvents: 'none',
        }} />

        {/* ── HEADER: logo/name + customer left · address right ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>

          {/* Left: logo + business name, then customer details below */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <img
                src="/zziwa logo.png"
                alt={businessName}
                style={{ width: 68, height: 68, objectFit: 'contain', flexShrink: 0 }}
              />
              <div style={{ paddingTop: 2 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#be123c', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                  {businessName}
                </div>
              </div>
            </div>
            {/* Customer details — sits directly below the logo */}
            <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.8, paddingLeft: 2 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>To:</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{customerName}</div>
              {customerPhone   && <div>{customerPhone}</div>}
              {customerEmail   && <div>{customerEmail}</div>}
              {customerAddress && <div>{customerAddress}</div>}
            </div>
          </div>

          {/* Right: business contact block + invoice title below */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ textAlign: 'right', fontSize: 13, color: '#1e293b', lineHeight: 1.8 }}>
              <div style={{ fontWeight: 700 }}>{businessName}</div>
              <div>{businessAddress}</div>
              <div>{businessPhone}</div>
              {businessEmail && <div>{businessEmail}</div>}
              <div>Kampala Uganda</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#be123c', letterSpacing: '-0.3px', textAlign: 'right' }}>
              Invoice {invoiceNumber}
            </div>
          </div>
        </div>

        {/* ── DATE / DUE DATE / SOURCE INFO CARD ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          border: '1.5px solid #cbd5e1',
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 22,
        }}>
          {[
            { label: 'Invoice Date', value: invoiceDate },
            { label: 'Due Date',     value: dueDate     },
            { label: 'Source',       value: sourceRef   },
          ].map((cell, i, arr) => (
            <div key={cell.label} style={{
              padding: '12px 18px',
              borderRight: i < arr.length - 1 ? '1.5px solid #cbd5e1' : 'none',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{cell.label}</div>
              <div style={{ fontSize: 13, color: '#475569' }}>{cell.value}</div>
            </div>
          ))}
        </div>

        {/* ── LINE ITEMS TABLE ── */}
        <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#881337', color: '#ffffff' }}>
                <th style={{ padding: '11px 18px', textAlign: 'left',   fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Items</th>
                <th style={{ padding: '11px 18px', textAlign: 'center', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', width: 130 }}>Quantity</th>
                <th style={{ padding: '11px 18px', textAlign: 'right',  fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', width: 150 }}>Unit Price</th>
                <th style={{ padding: '11px 18px', textAlign: 'right',  fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', width: 160 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '20px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No items</td>
                </tr>
              ) : items.map((item, idx) => {
                const name      = item.product?.name || item.name || item.description || `Item #${idx + 1}`;
                const qty       = parseFloat(item.quantity || 1);
                const price     = parseFloat(item.price || item.unit_price || 0);
                const amt       = parseFloat(item.subtotal != null ? item.subtotal : qty * price);
                const unitLabel = item.product?.unit || item.unit || 'Units';
                const isLast    = idx === items.length - 1;

                return (
                  <tr key={idx} style={{ borderBottom: isLast ? 'none' : '1px solid #f1f5f9' }}>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: '#0f172a' }}>{name}</td>
                    <td style={{ padding: '13px 18px', textAlign: 'center', fontSize: 13, color: '#475569' }}>
                      {qty.toFixed(2)} {unitLabel}
                    </td>
                    <td style={{ padding: '13px 18px', textAlign: 'right', fontSize: 13, color: '#475569' }}>
                      {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '13px 18px', textAlign: 'right', fontSize: 13, color: '#0f172a' }}>
                      {amt.toLocaleString('en-UG', { minimumFractionDigits: 0 })} USh
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── BOTTOM SECTION: payment note (left) + totals (right) ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginTop: 4 }}>

          {/* Payment terms — only shown if the invoice has notes */}
          <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.8 }}>
            {invoice.notes && (
              <div style={{ fontSize: 12, color: '#475569', maxWidth: 380 }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Terms: </span>{invoice.notes}
              </div>
            )}
          </div>

          {/* Totals block — matches screenshot (paid row + bold amount due) */}
          <div style={{ minWidth: 300, border: '1.5px solid #cbd5e1', borderRadius: 10, overflow: 'hidden' }}>
            {/* Paid on date row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
              <span style={{ fontStyle: 'italic', color: '#475569' }}>Paid on {invoiceDate}</span>
              <span style={{ color: '#0f172a' }}>
                {paid.toLocaleString('en-UG', { minimumFractionDigits: 0 })} USh
              </span>
            </div>
            {/* Amount Due row — bold, dark background when balance > 0 */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '12px 18px',
              background: balance > 0 ? '#fff1f2' : '#f0fdf4',
              fontSize: 14,
            }}>
              <span style={{ fontWeight: 800, color: balance > 0 ? '#9f1239' : '#166534' }}>Amount Due</span>
              <span style={{ fontWeight: 800, color: balance > 0 ? '#9f1239' : '#166534' }}>
                {balance.toLocaleString('en-UG', { minimumFractionDigits: 0 })} USh
              </span>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════
// CREATE CUSTOM INVOICE MODAL
// ════════════════════════════════════════════════
function CustomInvoiceCreateModal({ user, customers, products, token, onClose, onCreated }) {
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [sourceRef, setSourceRef] = useState(`S00${Math.floor(100 + Math.random() * 900)}`);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Payment status state
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [amountPaid, setAmountPaid] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');

  const [items, setItems] = useState([
    { product_id: '', description: '', quantity: '1', price: '' }
  ]);

  // jQuery-style validation rules
  const validationRules = {
    customerName: {
      required: true,
      minlength: 2,
      message: 'Customer name is required (minimum 2 characters)'
    },
    customerEmail: {
      email: true,
      message: 'Please enter a valid email address'
    },
    customerPhone: {
      pattern: /^[0-9\s\-\+\(\)]+$/,
      minlength: 10,
      message: 'Please enter a valid phone number (minimum 10 digits)'
    },
    invoiceDate: {
      required: true,
      message: 'Invoice date is required'
    },
    dueDate: {
      required: true,
      message: 'Due date is required'
    },
    items: {
      custom: () => {
        const validItems = items.filter(i => i.description.trim() && parseFloat(i.price) > 0);
        return validItems.length > 0;
      },
      message: 'Please add at least one valid item with description and price'
    }
  };

  // Validate single field (jQuery-style)
  const validateField = (fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    // Required validation
    if (rules.required && !value.trim()) {
      return rules.message || `${fieldName} is required`;
    }

    // Minlength validation
    if (rules.minlength && value.length < rules.minlength) {
      return rules.message || `${fieldName} must be at least ${rules.minlength} characters`;
    }

    // Pattern validation
    if (rules.pattern && value && !rules.pattern.test(value)) {
      return rules.message || `${fieldName} is invalid`;
    }

    // Email validation
    if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return rules.message || 'Please enter a valid email address';
    }

    // Custom validation
    if (rules.custom && !rules.custom(value)) {
      return rules.message || `${fieldName} is invalid`;
    }

    return null;
  };

  // Validate all fields (jQuery-style form validation)
  const validateForm = () => {
    const errors = {};

    // Validate customer name
    const nameError = validateField('customerName', customerName);
    if (nameError) errors.customerName = nameError;

    // Validate email (only if provided)
    if (customerEmail) {
      const emailError = validateField('customerEmail', customerEmail);
      if (emailError) errors.customerEmail = emailError;
    }

    // Validate phone (only if provided)
    if (customerPhone) {
      const phoneError = validateField('customerPhone', customerPhone);
      if (phoneError) errors.customerPhone = phoneError;
    }

    // Validate dates
    const dateError = validateField('invoiceDate', invoiceDate);
    if (dateError) errors.invoiceDate = dateError;

    const dueError = validateField('dueDate', dueDate);
    if (dueError) errors.dueDate = dueError;

    // Validate items
    const itemsError = validateField('items', items);
    if (itemsError) errors.items = itemsError;

    return errors;
  };

  // Handle field blur (jQuery-style live validation)
  const handleBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    let value;
    switch(fieldName) {
      case 'customerName': value = customerName; break;
      case 'customerEmail': value = customerEmail; break;
      case 'customerPhone': value = customerPhone; break;
      case 'invoiceDate': value = invoiceDate; break;
      case 'dueDate': value = dueDate; break;
      case 'items': value = items; break;
      default: value = '';
    }

    const error = validateField(fieldName, value);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { product_id: '', description: '', quantity: '1', price: '' }]);
  };

  const handleRemoveItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
    // Re-validate items after removal
    setTimeout(() => handleBlur('items'), 100);
  };

  const handleItemChange = (idx, field, val) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    // Re-validate items when they change
    setTimeout(() => handleBlur('items'), 100);
  };

  const handleProductSelect = (idx, productId) => {
    if (!productId) {
      // Clear product selection - allow custom entry
      setItems(prev => prev.map((item, i) => 
        i === idx ? { ...item, product_id: '', description: '', price: '' } : item
      ));
      return;
    }
    
    const product = products.find(p => String(p.id) === String(productId));
    if (product) {
      setItems(prev => prev.map((item, i) => 
        i === idx ? {
          ...item,
          product_id: productId,
          description: product.name,
          price: String(product.price || '')
        } : item
      ));
      // Re-validate items after product selection
      setTimeout(() => handleBlur('items'), 100);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return sum + (q * p);
    }, 0);
  };

  const handleSelectCustomer = (e) => {
    const custId = e.target.value;
    if (!custId) return;
    const cust = customers.find(c => String(c.id) === String(custId));
    if (cust) {
      setCustomerName(cust.name || '');
      setCustomerPhone(cust.phone || cust.contact || '');
      setCustomerEmail(cust.email || '');
      // Clear any errors when selecting a customer
      setFieldErrors({});
    }
  };

  // When status changes, reset payment fields and auto-fill where appropriate
  const handleStatusChange = (newStatus) => {
    setPaymentStatus(newStatus);
    const total = calculateTotal();
    if (newStatus === 'paid') {
      setAmountPaid(String(total));
      setAmountDue('0');
    } else if (newStatus === 'due') {
      setAmountPaid('0');
      setAmountDue(String(total));
    } else {
      // partial — clear both so user fills in
      setAmountPaid('');
      setAmountDue('');
    }
  };

  // When partial amount paid changes, auto-calc amount due
  const handlePartialPaidChange = (val) => {
    setAmountPaid(val);
    const total = calculateTotal();
    const paid = parseFloat(val) || 0;
    setAmountDue(String(Math.max(0, total - paid)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    // jQuery-style validation on submit
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('Please fix the validation errors below');
      // Mark all fields as touched to show errors
      setTouched({
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        invoiceDate: true,
        dueDate: true,
        items: true
      });
      return;
    }

    const validItems = items.filter(i => i.description.trim() && parseFloat(i.price) > 0);

    const payload = {
      invoice_date: invoiceDate,
      due_date: dueDate,
      source_ref: sourceRef,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || null,
      customer_email: customerEmail.trim() || null,
      payment_status: paymentStatus,
      amount_paid: parseFloat(amountPaid) || 0,
      notes: paymentTerms.trim() || null,
      items: validItems.map(i => ({
        description: i.description.trim(),
        quantity: parseFloat(i.quantity) || 1,
        price: parseFloat(i.price) || 0,
        subtotal: (parseFloat(i.quantity) || 1) * (parseFloat(i.price) || 0)
      }))
    };

    try {
      setSubmitting(true);
      const res = await fetch(`${API}/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg = json.message || (json.errors ? Object.values(json.errors).flat().join(' ') : 'Failed to save invoice.');
        setSubmitError(msg);
        return;
      }
      onCreated(json.data);
    } catch (err) {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create New Proforma Invoice" maxWidth="720px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {customers && customers.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
              Quick Select Customer (Optional)
            </label>
            <select
              onChange={handleSelectCustomer}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13, background: '#fff' }}
            >
              <option value="">— Select an existing customer —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
              Customer Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Asher"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              onBlur={() => handleBlur('customerName')}
              style={{ 
                width: '100%', 
                padding: '9px 12px', 
                border: '1.5px solid', 
                borderColor: (touched.customerName && fieldErrors.customerName) ? '#dc2626' : '#cbd5e1', 
                borderRadius: 8, 
                fontSize: 13,
                outline: 'none'
              }}
            />
            {touched.customerName && fieldErrors.customerName && (
              <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4, display: 'block' }}>
                {fieldErrors.customerName}
              </span>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
              Phone Number
            </label>
            <input
              type="text"
              placeholder="e.g. 0776 000000"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              onBlur={() => handleBlur('customerPhone')}
              style={{ 
                width: '100%', 
                padding: '9px 12px', 
                border: '1.5px solid', 
                borderColor: (touched.customerPhone && fieldErrors.customerPhone) ? '#dc2626' : '#cbd5e1', 
                borderRadius: 8, 
                fontSize: 13,
                outline: 'none'
              }}
            />
            {touched.customerPhone && fieldErrors.customerPhone && (
              <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4, display: 'block' }}>
                {fieldErrors.customerPhone}
              </span>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
              Source / Ref
            </label>
            <input
              type="text"
              placeholder="e.g. S00124"
              value={sourceRef}
              onChange={e => setSourceRef(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
            Email Address
          </label>
          <input
            type="text"
            placeholder="e.g. customer@example.com"
            value={customerEmail}
            onChange={e => setCustomerEmail(e.target.value)}
            onBlur={() => handleBlur('customerEmail')}
            style={{ 
              width: '100%', 
              padding: '9px 12px', 
              border: '1.5px solid', 
              borderColor: (touched.customerEmail && fieldErrors.customerEmail) ? '#dc2626' : '#cbd5e1', 
              borderRadius: 8, 
              fontSize: 13,
              outline: 'none'
            }}
          />
          {touched.customerEmail && fieldErrors.customerEmail && (
            <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4, display: 'block' }}>
              {fieldErrors.customerEmail}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
              Invoice Date *
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={e => setInvoiceDate(e.target.value)}
              onBlur={() => handleBlur('invoiceDate')}
              style={{ 
                width: '100%', 
                padding: '9px 12px', 
                border: '1.5px solid', 
                borderColor: (touched.invoiceDate && fieldErrors.invoiceDate) ? '#dc2626' : '#cbd5e1', 
                borderRadius: 8, 
                fontSize: 13 
              }}
            />
            {touched.invoiceDate && fieldErrors.invoiceDate && (
              <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4, display: 'block' }}>
                {fieldErrors.invoiceDate}
              </span>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
              Due Date *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              onBlur={() => handleBlur('dueDate')}
              style={{ 
                width: '100%', 
                padding: '9px 12px', 
                border: '1.5px solid', 
                borderColor: (touched.dueDate && fieldErrors.dueDate) ? '#dc2626' : '#cbd5e1', 
                borderRadius: 8, 
                fontSize: 13 
              }}
            />
            {touched.dueDate && fieldErrors.dueDate && (
              <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 4, display: 'block' }}>
                {fieldErrors.dueDate}
              </span>
            )}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 800, color: '#881337', textTransform: 'uppercase' }}>
              Invoice Line Items *
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#be123c', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              + Add Item Line
            </button>
          </div>

          {touched.items && fieldErrors.items && (
            <div style={{ marginBottom: 10, padding: '8px 12px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6 }}>
              <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                {fieldErrors.items}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                {/* Product selector row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px', gap: 10, alignItems: 'center' }}>
                  <select
                    onChange={(e) => {
                      const productId = e.target.value;
                      if (!productId) {
                        // Reset if user selects "manual entry" option
                        handleItemChange(idx, 'product_id', '');
                        return;
                      }
                      const product = products.find(p => String(p.id) === String(productId));
                      if (product) {
                        handleItemChange(idx, 'description', product.name || '');
                        handleItemChange(idx, 'price', String(product.selling_price || product.price || ''));
                        handleItemChange(idx, 'product_id', productId);
                      }
                    }}
                    value={item.product_id || ''}
                    style={{ padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, background: '#fff', cursor: 'pointer' }}
                  >
                    <option value="">📦 Select a product or enter manually below</option>
                    {products && products.length > 0 ? (
                      products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — UGX {(p.selling_price || p.price || 0).toLocaleString()} {p.stock !== undefined ? `(Stock: ${p.stock})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No products available</option>
                    )}
                  </select>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, height: 36, fontWeight: 800, cursor: 'pointer' }}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                {/* Description, quantity, and price row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: 10, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Description (e.g. Apple iPhone 17 Pro Max 512GB)"
                    value={item.description}
                    onChange={e => handleItemChange(idx, 'description', e.target.value)}
                    style={{ padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, background: '#fff' }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                    style={{ padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, textAlign: 'center', background: '#fff' }}
                  />
                  <input
                    type="number"
                    placeholder="Unit Price (UGX)"
                    value={item.price}
                    onChange={e => handleItemChange(idx, 'price', e.target.value)}
                    style={{ padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, textAlign: 'right', background: '#fff' }}
                  />
                </div>
                
                {/* Line total display */}
                {item.description && item.price && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                      Line Total: <span style={{ color: '#881337' }}>UGX {((parseFloat(item.quantity) || 1) * (parseFloat(item.price) || 0)).toLocaleString()}</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '14px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>Total Invoice Amount:</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#881337' }}>UGX {calculateTotal().toLocaleString()}</span>
        </div>

        {/* ── PAYMENT STATUS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Status
            </label>
            <select
              value={paymentStatus}
              onChange={e => handleStatusChange(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13, background: '#fff', fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </select>
          </div>

          {/* PAID — show amount paid (pre-filled with total, editable) */}
          {paymentStatus === 'paid' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Amount Paid (UGX)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #86efac', borderRadius: 8, fontSize: 14, fontWeight: 600, background: '#f0fdf4', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* PARTIAL — amount paid (user fills) + amount due (auto-calculated) */}
          {paymentStatus === 'partial' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Amount Paid (UGX)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter partial amount paid"
                  value={amountPaid}
                  onChange={e => handlePartialPaidChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #fcd34d', borderRadius: 8, fontSize: 14, fontWeight: 600, background: '#fffbeb', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Amount Due (UGX) — Auto
                </label>
                <input
                  type="number"
                  readOnly
                  value={amountDue}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #fca5a5', borderRadius: 8, fontSize: 14, fontWeight: 700, background: '#fef2f2', color: '#b91c1c', boxSizing: 'border-box', cursor: 'not-allowed' }}
                />
              </div>
            </div>
          )}

          {/* DUE — amount due (user fills manually) */}
          {paymentStatus === 'due' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Amount Due (UGX)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount due"
                value={amountDue}
                onChange={e => setAmountDue(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #fca5a5', borderRadius: 8, fontSize: 14, fontWeight: 600, background: '#fef2f2', boxSizing: 'border-box' }}
              />
            </div>
          )}
        </div>

        {/* ── PAYMENT TERMS & CONDITIONS ── */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Payment Terms &amp; Conditions
          </label>
          <textarea
            rows={3}
            value={paymentTerms}
            onChange={e => setPaymentTerms(e.target.value)}
            placeholder="Explicit due date (e.g., Net 30, Due on Receipt), accepted payment methods, and penalties for late payment"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1.5px solid #cbd5e1',
              borderRadius: 8,
              fontSize: 13,
              color: '#0f172a',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              lineHeight: 1.6,
            }}
          />
        </div>

        {submitError && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>
            {submitError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#881337', color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.75 : 1, boxShadow: '0 4px 12px rgba(136,19,55,0.3)' }}
          >
            {submitting ? 'Saving…' : 'Generate Invoice 📄'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ════════════════════════════════════════════════
// INVOICE EDIT STATUS MODAL
// ════════════════════════════════════════════════
function InvoiceEditStatusModal({ invoice, onClose, onSave }) {
  const [status, setStatus] = useState(invoice.payment_status || 'paid');
  const [amountPaid, setAmountPaid] = useState(String(invoice.amount_paid ?? invoice.total_amount ?? ''));
  const [saving, setSaving] = useState(false);

  const total = parseFloat(invoice.total_amount || 0);
  const paid = parseFloat(amountPaid) || 0;
  const balance = Math.max(0, total - paid);

  // Auto-derive status from amount paid when user changes the amount
  const handleAmountChange = (val) => {
    setAmountPaid(val);
    const p = parseFloat(val) || 0;
    if (p >= total) setStatus('paid');
    else if (p > 0) setStatus('partial');
    else setStatus('due');
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(invoice.id, status, parseFloat(amountPaid) || 0);
    setSaving(false);
  };

  const statusOptions = [
    { value: 'paid',    label: 'Paid',    bg: '#dcfce7', color: '#15803d' },
    { value: 'partial', label: 'Partial', bg: '#fef3c7', color: '#b45309' },
    { value: 'due',     label: 'Due',     bg: '#fee2e2', color: '#b91c1c' },
  ];

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Payment Status" maxWidth="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Invoice reference */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Invoice</p>
          <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{invoice.invoice_number}</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#475569' }}>{invoice.customer_name} · Total: <strong>UGX {total.toLocaleString()}</strong></p>
        </div>

        {/* Status selector */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Payment Status
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  border: status === opt.value ? `2px solid ${opt.color}` : '2px solid #e2e8f0',
                  background: status === opt.value ? opt.bg : '#fff',
                  color: status === opt.value ? opt.color : '#64748b',
                  transition: 'all 0.12s'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount paid */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Amount Paid (UGX)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amountPaid}
            onChange={e => handleAmountChange(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, fontWeight: 600, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#64748b' }}>
            <span>Balance remaining: <strong style={{ color: balance > 0 ? '#b91c1c' : '#15803d' }}>UGX {balance.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
              background: '#881337', color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.75 : 1,
              boxShadow: '0 4px 12px rgba(136,19,55,0.25)'
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════
// INVOICES TAB COMPONENT
// ════════════════════════════════════════════════
function InvoicesTab({ sales, customers, products, user, token, toast }) {
  const [customInvoices, setCustomInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);   // invoice being status-edited
  const [search, setSearch] = useState('');

  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Fetch persisted custom invoices from the backend on mount
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch(`${API}/invoices`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const json = await res.json();
        if (json.success) {
          setCustomInvoices(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load invoices', err);
      } finally {
        setLoadingInvoices(false);
      }
    };
    fetchInvoices();
  }, [API, token]);

  // Derive invoice rows from sales (sale-based invoices, always present)
  const saleInvoices = (sales || []).map(s => ({
    id: `sale-${s.id}`,
    _type: 'sale',
    invoice_number: `INV/25-26/${String(s.id).padStart(4, '0')}`,
    invoice_date: (s.sale_date || s.created_at || '').slice(0, 10),
    due_date: (s.sale_date || s.created_at || '').slice(0, 10),
    customer_name: s.customer?.name || 'Walk-in Customer',
    customer_email: s.customer?.email || '',
    customer_phone: s.customer?.phone || s.customer?.contact || '',
    customer_address: s.customer?.address || '',
    total_amount: parseFloat(s.total_amount || 0),
    amount_paid: parseFloat(s.total_amount || 0),
    payment_status: 'paid',
    items: s.sale_items || s.saleItems || [],
    source_ref: `S${String(s.id).padStart(5, '0')}`
  }));

  // Normalise custom invoices from DB for the same shape
  const dbInvoices = customInvoices.map(inv => ({
    ...inv,
    _type: 'custom',
    invoice_date: inv.invoice_date ? String(inv.invoice_date).slice(0, 10) : '',
    due_date: inv.due_date ? String(inv.due_date).slice(0, 10) : '',
    total_amount: parseFloat(inv.total_amount || 0),
    amount_paid: parseFloat(inv.amount_paid || 0),
  }));

  // Merge: custom invoices first (newest), then sale-based
  const invoicesList = [...dbInvoices, ...saleInvoices];

  const filteredInvoices = invoicesList.filter(inv =>
    !search ||
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteInvoice = async (inv) => {
    if (inv._type !== 'custom') return;
    if (!window.confirm(`Delete invoice ${inv.invoice_number}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/invoices/${inv.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const json = await res.json();
      if (json.success) {
        setCustomInvoices(prev => prev.filter(i => i.id !== inv.id));
        if (selectedInvoice?.id === inv.id) setSelectedInvoice(null);
        toast && toast.success('Invoice deleted', 'The invoice has been removed.');
      } else {
        toast && toast.error('Delete failed', json.message || 'Failed to delete invoice.');
      }
    } catch (err) {
      toast && toast.error('Network error', 'Please try again.');
    }
  };

  const handleSaveStatus = async (invoiceId, newStatus, amountPaid) => {
    try {
      const res = await fetch(`${API}/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ payment_status: newStatus, amount_paid: amountPaid })
      });
      const json = await res.json();
      if (json.success) {
        setCustomInvoices(prev =>
          prev.map(i => i.id === invoiceId ? { ...i, payment_status: json.data.payment_status, amount_paid: parseFloat(json.data.amount_paid) } : i)
        );
        setEditingInvoice(null);
        toast && toast.success('Status updated', 'Invoice payment status has been saved.');
      } else {
        toast && toast.error('Update failed', json.message || 'Failed to update invoice.');
      }
    } catch (err) {
      toast && toast.error('Network error', 'Please try again.');
    }
  };

  const statusStyle = (status) => {
    if (status === 'paid') return { background: '#dcfce7', color: '#15803d' };
    if (status === 'partial') return { background: '#fef3c7', color: '#b45309' };
    return { background: '#fee2e2', color: '#b91c1c' };
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '4px 0 32px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Invoices & Proforma Generator</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Generate, view, and print branded invoices featuring Zziwa & Sons branding</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: '#881337', color: '#ffffff', fontWeight: 700,
            fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(136,19,55,0.25)'
          }}
        >
          <span style={{ fontSize: 16 }}>+</span> Create Custom Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Invoices', value: invoicesList.length, color: '#881337', icon: '📄' },
          { label: 'Total Invoiced Value', value: `UGX ${invoicesList.reduce((s, i) => s + i.total_amount, 0).toLocaleString()}`, color: '#be123c', icon: '💰' },
          { label: 'Collected Amount', value: `UGX ${invoicesList.reduce((s, i) => s + i.amount_paid, 0).toLocaleString()}`, color: '#16a34a', icon: '✅' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 22px', borderTop: `3px solid ${k.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{k.value}</h3>
              </div>
              <span style={{ fontSize: 24 }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by invoice # or customer name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: 400, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 13 }}
        />
      </div>

      {/* Invoices List Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        {loadingInvoices ? (
          <div style={{ padding: 36, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading invoices…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                {['Invoice #', 'Customer', 'Date', 'Amount', 'Status', 'Type', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 18px', textAlign: h === 'Amount' ? 'right' : 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? filteredInvoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 800, color: '#881337' }}>{inv.invoice_number}</td>
                  <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{inv.customer_name}</td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: '#64748b' }}>{inv.invoice_date}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>UGX {inv.total_amount.toLocaleString()}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, ...statusStyle(inv.payment_status) }}>
                      {(inv.payment_status || 'paid').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                      background: inv._type === 'custom' ? '#eff6ff' : '#f0fdf4',
                      color: inv._type === 'custom' ? '#1d4ed8' : '#15803d'
                    }}>
                      {inv._type === 'custom' ? 'Custom' : 'Sale'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        style={{
                          padding: '6px 14px', borderRadius: 6, border: '1px solid #881337',
                          background: '#fff1f2', color: '#881337', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <span>📄</span> View / Print
                      </button>
                      {inv._type === 'custom' && (
                        <button
                          onClick={() => setEditingInvoice(inv)}
                          style={{
                            padding: '6px 10px', borderRadius: 6, border: '1px solid #bfdbfe',
                            background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: 12, cursor: 'pointer'
                          }}
                          title="Edit payment status"
                        >
                          ✏️ Status
                        </button>
                      )}
                      {inv._type === 'custom' && (
                        <button
                          onClick={() => handleDeleteInvoice(inv)}
                          style={{
                            padding: '6px 10px', borderRadius: 6, border: '1px solid #fecaca',
                            background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer'
                          }}
                          title="Delete invoice"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                    No invoices found matching search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <PrintableInvoiceModal
          invoice={selectedInvoice}
          user={user}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Create Custom Invoice Modal */}
      {showCreateModal && (
        <CustomInvoiceCreateModal
          user={user}
          customers={customers}
          products={products}
          token={token}
          onClose={() => setShowCreateModal(false)}
          onCreated={(savedInvoice) => {
            setCustomInvoices(prev => [savedInvoice, ...prev]);
            setShowCreateModal(false);
            setSelectedInvoice({ ...savedInvoice, _type: 'custom' });
            toast && toast.success('Invoice created', 'Saved successfully and ready to print.');
          }}
        />
      )}

      {/* Edit Payment Status Modal */}
      {editingInvoice && (
        <InvoiceEditStatusModal
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSave={handleSaveStatus}
        />
      )}
    </div>
  );
}