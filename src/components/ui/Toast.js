import { useState, useCallback, useEffect } from 'react';

// ── Toast Item ────────────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const configs = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', icon: '✅' },
    error:   { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', icon: '❌' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', icon: '⚠️' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', icon: 'ℹ️' },
  };
  const c = configs[toast.type] || configs.info;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '14px 16px', borderRadius: 12, minWidth: 280, maxWidth: 380,
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      transform: visible ? 'translateX(0)' : 'translateX(110%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
      pointerEvents: 'all',
    }}>
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && <div style={{ fontWeight: 700, fontSize: 14, marginBottom: toast.message ? 3 : 0 }}>{toast.title}</div>}
        {toast.message && <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.4 }}>{toast.message}</div>}
      </div>
      <button onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.color, opacity: 0.6, fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0 }}>
        ×
      </button>
    </div>
  );
}

// ── Toast Container ───────────────────────────────────────────────────────────
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={onRemove} />)}
    </div>
  );
}

// ── useToast Hook ─────────────────────────────────────────────────────────────
let idCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((type, title, message, duration) => {
    const id = ++idCounter;
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const toast = {
    success: (title, message, duration) => add('success', title, message, duration),
    error:   (title, message, duration) => add('error',   title, message, duration),
    warning: (title, message, duration) => add('warning', title, message, duration),
    info:    (title, message, duration) => add('info',    title, message, duration),
  };

  return { toasts, toast, remove };
}
