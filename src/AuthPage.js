import { useState, useEffect, useRef } from 'react';
import Dashboard from './Dashboard';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/* ── Password strength evaluation ── */
function getStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['', '#ef4444', '#f59e0b', '#10b981', '#059669'];

/* ── SVG icons ── */
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ── Password field with visibility toggle ── */
function PasswordField({ name, label, placeholder, value, onChange, showStrength }) {
  const [visible, setVisible] = useState(false);
  const strength = getStrength(value);

  return (
    <div className="field-group">
      <label className="field-label" htmlFor={name}>{label}</label>
      <div className="pw-wrap">
        <input
          id={name}
          className="field-input"
          name={name}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
        />
        <button
          type="button"
          className="eye-btn"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {showStrength && value && (
        <div className="strength-wrap">
          <div className="strength-bars">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="strength-bar"
                style={{ backgroundColor: i <= strength ? STRENGTH_COLOR[strength] : undefined }}
              />
            ))}
          </div>
          <span className="strength-label" style={{ color: STRENGTH_COLOR[strength] }}>
            {STRENGTH_LABEL[strength]} password
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Main Auth Page ── */
export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    business_name: '',
    phone: '',
    address: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoDragOver, setLogoDragOver] = useState(false);
  const logoInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleLogoChange = (file) => {
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'register') {
      if (!form.name.trim()) {
        setError('Full name is required');
        setLoading(false);
        return;
      }
      if (!form.business_name.trim()) {
        setError('Business name is required');
        setLoading(false);
        return;
      }
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }
      if (form.password !== form.password_confirmation) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!form.password) {
      setError('Password is required');
      setLoading(false);
      return;
    }
    try {
      let res;
      if (mode === 'login') {
        res = await fetch(`${API}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
      } else {
        // Use FormData to support file upload
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('email', form.email);
        fd.append('password', form.password);
        fd.append('password_confirmation', form.password_confirmation);
        fd.append('business_name', form.business_name);
        if (form.phone) fd.append('phone', form.phone);
        if (form.address) fd.append('address', form.address);
        if (logoFile) fd.append('logo', logoFile);

        res = await fetch(`${API}/register`, {
          method: 'POST',
          headers: { 'Accept': 'application/json' }, // NO Content-Type – let browser set multipart boundary
          body: fd,
        });
      }

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text }; }

      if (!res.ok) {
        setError(data?.message || `Error ${res.status}`);
      } else if (data.success && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
      }
    } catch {
      setError('Could not reach the server. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    setForm({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      business_name: '',
      phone: '',
      address: '',
    });
    setLogoFile(null);
    setLogoPreview(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const switchMode = newMode => {
    setMode(newMode);
    setError(null);
  };

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) {
      try {
        setUser(JSON.parse(u));
        setToken(t);
        fetch(`${API}/users/me`, {
          headers: { 'Authorization': `Bearer ${t}`, 'Accept': 'application/json' },
        })
          .then(r => (r.ok ? r.json() : null))
          .then(data => {
            if (data?.data) {
              setUser(data.data);
              localStorage.setItem('user', JSON.stringify(data.data));
            }
          })
          .catch(() => {});
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  if (user && token) return <Dashboard user={user} token={token} onLogout={logout} onUserUpdate={setUser} />;

  const isLogin = mode === 'login';

  return (
    <div className="auth-page">
      <div className={`auth-container ${!isLogin ? 'register-mode' : ''}`}>
        {/* Brand header */}
        <div className="auth-brand-header">
          <div className="auth-brand-badge-wrap">
            <div className="auth-brand-logo" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <span className="auth-brand-name">StockPro</span>
            <span className="auth-brand-tag">Inventory &amp; Sales</span>
          </div>
        </div>

        {/* Card */}
        <div className="auth-card">
          {/* Segmented control tabs */}
          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Register business
            </button>
          </div>

          {/* Form Header */}
          <div className="auth-header">
            <h1 className="auth-title">
              {isLogin ? 'Sign in to your account' : 'Register your business'}
            </h1>
            <p className="auth-subtitle">
              {isLogin
                ? 'Enter your email and password to access your workspace.'
                : 'Create a business profile and your primary administrator account.'}
            </p>
          </div>

          {/* Error notification */}
          {error && (
            <div className="auth-error" role="alert">
              <svg className="auth-error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="auth-form" noValidate>
            {!isLogin && (
              <div className="field-group">
                <label className="field-label" htmlFor="name">Full name</label>
                <input
                  id="name"
                  className="field-input"
                  name="name"
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={handle}
                  required
                />
              </div>
            )}

            <div className="field-group">
              <label className="field-label" htmlFor="email">Email address</label>
              <input
                id="email"
                className="field-input"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handle}
                required
              />
            </div>

            <PasswordField
              name="password"
              label="Password"
              placeholder={isLogin ? 'Enter your password' : 'Create a secure password (min. 8 chars)'}
              value={form.password}
              onChange={handle}
              showStrength={!isLogin}
            />

            {!isLogin && (
              <>
                <PasswordField
                  name="password_confirmation"
                  label="Confirm password"
                  placeholder="Repeat your password"
                  value={form.password_confirmation}
                  onChange={handle}
                  showStrength={false}
                />

                <div className="auth-section-divider">
                  <span>Business Profile</span>
                </div>

                {/* Logo upload */}
                <div className="field-group">
                  <label className="field-label">Business logo (optional)</label>
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setLogoDragOver(true); }}
                    onDragLeave={() => setLogoDragOver(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setLogoDragOver(false);
                      const f = e.dataTransfer.files[0];
                      if (f && f.type.startsWith('image/')) handleLogoChange(f);
                    }}
                    style={{
                      border: `2px dashed ${logoDragOver ? '#4f46e5' : '#e2e8f0'}`,
                      borderRadius: 12,
                      padding: '20px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 10,
                      background: logoDragOver ? '#eef2ff' : '#fafafa',
                      transition: 'all 0.15s',
                    }}
                  >
                    {logoPreview ? (
                      <>
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 10 }}
                        />
                        <span style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600 }}>{logoFile?.name}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>Click to change</span>
                      </>
                    ) : (
                      <>
                        <div style={{
                          width: 48, height: 48, borderRadius: 12,
                          background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Upload your logo</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>PNG, JPG, SVG · max 2 MB · drag or click</span>
                      </>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => handleLogoChange(e.target.files[0])}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="business_name">Business or store name</label>
                  <input
                    id="business_name"
                    className="field-input"
                    name="business_name"
                    placeholder="e.g. Acme Retail Ltd."
                    value={form.business_name}
                    onChange={handle}
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="phone">Phone number (optional)</label>
                  <input
                    id="phone"
                    className="field-input"
                    name="phone"
                    type="tel"
                    placeholder="+256 700 000 000"
                    value={form.phone}
                    onChange={handle}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="address">Business address (optional)</label>
                  <textarea
                    id="address"
                    className="field-input"
                    name="address"
                    placeholder="Plot, Street, City, Country"
                    value={form.address}
                    onChange={handle}
                  />
                </div>
              </>
            )}

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading && <span className="btn-spinner" />}
              {loading
                ? (isLogin ? 'Signing in...' : 'Creating account...')
                : (isLogin ? 'Sign in' : 'Create business account')}
            </button>
          </form>

          {/* Toggle helper */}
          <p className="auth-toggle">
            {isLogin ? "Don't have an account yet? " : 'Already registered? '}
            <button
              type="button"
              className="auth-toggle-link"
              onClick={() => switchMode(isLogin ? 'register' : 'login')}
            >
              {isLogin ? 'Register your business' : 'Sign in here'}
            </button>
          </p>
        </div>

        {/* High-trust footer */}
        <div className="auth-footer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Multi-tenant data isolation &bull; 256-bit SSL session</span>
        </div>
      </div>
    </div>
  );
}
