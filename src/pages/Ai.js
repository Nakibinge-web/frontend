import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/dashboardStyles';

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
        setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ai/chat`, { method: 'POST', headers, body: JSON.stringify({ question: q }) });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg = res.status === 429
          ? '⏳ The AI service is rate-limited right now. Please wait 30 seconds and try again.'
          : json.message || 'The AI service returned an error.';
                setMessages(prev => [...prev, { role: 'assistant', text: msg }]);
        if (res.status === 429) startCooldown(30);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: json.answer }]);
      }
    } catch {
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
      <div className="section-hero" style={{ background: '#ffffff', borderRadius: 14, padding: '24px 28px', marginBottom: 24, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 4px 12px -2px rgba(0, 0, 0, 0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eef2ff', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🤖</div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Powered by Mistral AI</p>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>AI Business Assistant</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Analyse your financial data, spot trends, and forecast business performance</p>
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

export default AiTab;
export { AiTab };
