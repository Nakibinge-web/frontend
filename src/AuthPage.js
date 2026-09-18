import { useState, useEffect, useRef } from 'react';
import Dashboard from './Dashboard';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/* ── Strength helpers ── */
function getStrength(pwd) {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}
const STRENGTH_LABEL = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
const STRENGTH_COLOR = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

/* ── SVG icons ── */
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ── Password field with eye toggle ── */
function PasswordField({ name, label, placeholder, value, onChange, showStrength, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const strength = getStrength(value);

  return (
    <div className="field-group" style={{ animationDelay: `${delay}s` }}>
      <label className="field-label">{label}</label>
      <div className="pw-wrap">
        <input
          className="field-input"
          name={name}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
        />
        <button type="button" className="eye-btn" onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}>
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {showStrength && value && (
        <>
          <div className="strength-bars">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="strength-bar"
                style={{ background: i <= strength ? STRENGTH_COLOR[strength] : undefined }} />
            ))}
          </div>
          <p className="strength-label" style={{ color: STRENGTH_COLOR[strength] }}>
            {STRENGTH_LABEL[strength]}
          </p>
        </>
      )}
    </div>
  );
}

/* ── Animated field wrapper ── */
function Field({ label, delay = 0, children }) {
  return (
    <div className="field-group" style={{ animationDelay: `${delay}s` }}>
      {label && <label className="field-label">{label}</label>}
      {children}
    </div>
  );
}

/* ── Main component ── */
export default function AuthPage() {
  const [mode, setMode]     = useState('login');
  const [form, setForm]     = useState({ name: '', email: '', password: '', password_confirmation: '', business_name: '', phone: '', address: '' });
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(null);
  const cardRef             = useRef(null);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Custom validation
    if (mode === 'register') {
      if (!form.name.trim()) {
        setError('Full name is required');
        setLoading(false);
        return;
      }
      if (form.name.trim().length < 2) {
        setError('Full name must be at least 2 characters');
        setLoading(false);
        return;
      }
      if (!form.business_name.trim()) {
        setError('Business name is required');
        setLoading(false);
        return;
      }
      if (form.business_name.trim().length < 2) {
        setError('Business name must be at least 2 characters');
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
      if (form.phone && !/^[\d\s\+\-\(\)]+$/.test(form.phone)) {
        setError('Invalid phone number format');
        setLoading(false);
        return;
      }
    }

    // Email validation
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

    const body = mode === 'login'
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password,
          password_confirmation: form.password_confirmation,
          business_name: form.business_name, phone: form.phone, address: form.address };

    try {
      const res  = await fetch(`${API}/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body),
      });
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
      setError('Could not reach the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null); setToken(null); setError(null);
    setForm({ name: '', email: '', password: '', password_confirmation: '', business_name: '', phone: '', address: '' });
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const toggle = () => {
    // Animate card out then switch
    if (cardRef.current) {
      cardRef.current.style.opacity = '0';
      cardRef.current.style.transform = 'translateY(12px)';
      setTimeout(() => {
        setMode(m => m === 'login' ? 'register' : 'login');
        setError(null);
        if (cardRef.current) {
          cardRef.current.style.transition = 'none';
          cardRef.current.style.opacity = '0';
          cardRef.current.style.transform = 'translateY(12px)';
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (cardRef.current) {
                cardRef.current.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                cardRef.current.style.opacity = '1';
                cardRef.current.style.transform = 'translateY(0)';
              }
            });
          });
        }
      }, 200);
    } else {
      setMode(m => m === 'login' ? 'register' : 'login');
      setError(null);
    }
  };

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) {
      try {
        setUser(JSON.parse(u));
        setToken(t);
        // Refresh user data from /me to get latest roles + permissions
        fetch(`${API}/me`, {
          headers: { 'Authorization': `Bearer ${t}`, 'Accept': 'application/json' },
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.data) {
              setUser(data.data);
              localStorage.setItem('user', JSON.stringify(data.data));
            }
          })
          .catch(() => {});
      } catch { localStorage.clear(); }
    }
  }, []);

  if (user && token) return <Dashboard user={user} token={token} onLogout={logout} />;

  const isLogin = mode === 'login';

  return (
    <div className="auth-page">
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-orb auth-bg-orb-3" />
      </div>

      {/* Brand panel */}
      <div className="brand-panel">
        <div className="brand-content">
          <div className="brand-logo-wrap">
            <div className="brand-logo-ring" />
            <div className="brand-logo-icon" style={{ background: '#ffffff', padding: 8 }}>
              <img src="/zziwa logo.png" alt="Zziwa Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
          <h1 className="brand-title">Business Yo!</h1>
          <p className="brand-sub">Inventory & Sales Management</p>
          <ul className="feature-list">
            {[
              ['⚡', 'Real-time stock tracking'],
              ['🔐', 'Role-based access control'],
              ['📊', 'Sales & purchase reports'],
              ['🏢', 'Multi-tenant architecture'],
            ].map(([icon, text]) => (
              <li key={text} className="feature-item">
                <span className="feature-check">{icon}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form panel */}
      <div className="form-panel">
        <div
          className="auth-card"
          ref={cardRef}
          style={{ transition: 'opacity 0.4s ease, transform 0.4s ease' }}
        >
          <h2 className="auth-card-title">
            {isLogin ? 'Welcome back 👋' : 'Get started today'}
          </h2>
          <p className="auth-card-sub">
            {isLogin ? 'Sign in to your business account' : 'Create your business account in minutes'}
          </p>

          <form onSubmit={submit} className="form-fields">
            {!isLogin && (
              <Field label="Full name" delay={0.05}>
                <input className="field-input" name="name" placeholder="John Doe"
                  value={form.name} onChange={handle} required />
              </Field>
            )}

            <Field label="Email address" delay={0.1}>
              <input className="field-input" name="email" type="email"
                placeholder="you@business.com" value={form.email} onChange={handle} required />
            </Field>

            <PasswordField
              name="password" label="Password" placeholder="Enter your password"
              value={form.password} onChange={handle}
              showStrength={!isLogin} delay={0.15}
            />

            {!isLogin && (
              <>
                <PasswordField
                  name="password_confirmation" label="Confirm password"
                  placeholder="Repeat your password"
                  value={form.password_confirmation} onChange={handle}
                  delay={0.2}
                />

                <div className="section-divider">Business details</div>

                <Field label="Business name" delay={0.25}>
                  <input className="field-input" name="business_name" placeholder="Acme Ltd."
                    value={form.business_name} onChange={handle} required />
                </Field>

                <Field label="Phone number" delay={0.3}>
                  <input className="field-input" name="phone" type="tel"
                    placeholder="+256 700 000 000" value={form.phone} onChange={handle} />
                </Field>

                <Field label="Business address" delay={0.35}>
                  <textarea className="field-input" name="address"
                    placeholder="Street, City, Country"
                    value={form.address} onChange={handle} />
                </Field>
              </>
            )}

            {error && (
              <div className="auth-error">
                <span className="auth-error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading
                ? <><span className="btn-spinner" />{isLogin ? 'Signing in…' : 'Creating account…'}</>
                : isLogin ? 'Sign in →' : 'Create account →'}
            </button>
          </form>

          <p className="auth-toggle">
            {isLogin ? "Different Staff members can login from here " : 'Already have an account? '}
            <span className="auth-toggle-link" onClick={toggle}>
              {isLogin ? 'Register a new account' : 'Sign in'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
