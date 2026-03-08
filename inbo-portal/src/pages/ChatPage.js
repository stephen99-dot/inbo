import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { Icon } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function formatDate(dt) {
  const d = new Date(dt);
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConvo) loadMessages(activeConvo.id);
  }, [activeConvo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await api.get('/chat/conversations');
      setConversations(data);
    } catch {}
  };

  const loadMessages = async (id) => {
    try {
      const data = await api.get(`/chat/conversations/${id}/messages`);
      setMessages(data);
    } catch {}
  };

  const newConversation = async () => {
    try {
      const convo = await api.post('/chat/conversations', { title: 'New conversation' });
      setConversations(prev => [convo, ...prev]);
      setActiveConvo(convo);
      setMessages([]);
      inputRef.current?.focus();
    } catch {}
  };

  const deleteConvo = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/conversations/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvo?.id === id) { setActiveConvo(null); setMessages([]); }
    } catch {}
  };

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    let convoId = activeConvo?.id;

    // Auto-create conversation if none selected
    if (!convoId) {
      try {
        const convo = await api.post('/chat/conversations', { title: input.substring(0, 40) });
        setConversations(prev => [convo, ...prev]);
        setActiveConvo(convo);
        convoId = convo.id;
      } catch { return; }
    }

    const userMsg = { id: Date.now(), role: 'user', content: input, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    // Add placeholder assistant message
    const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: '', created_at: new Date().toISOString() };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const token = localStorage.getItem('inbo_token');
      const response = await fetch(`/api/chat/conversations/${convoId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg.content })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setStreaming(false);
              loadConversations(); // refresh titles
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: m.content + parsed.text } : m
                ));
              }
              if (parsed.error) {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: 'Error: ' + parsed.error } : m
                ));
                setStreaming(false);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id ? { ...m, content: 'Something went wrong. Please try again.' } : m
      ));
    }
    setStreaming(false);
  };

  const filtered = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  // Group by date
  const grouped = filtered.reduce((acc, c) => {
    const date = formatDate(c.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(c);
    return acc;
  }, {});

  return (
    <Layout title="Chat" noPadding>
      <div className="chat-layout">
        {/* ── Left panel ── */}
        <div className="chat-side">
          <div className="chat-side-top">
            <div className="chat-search">
              {Icon.search}
              <input placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="chat-new-btn" onClick={newConversation}>
              {Icon.compose} New Chat
            </button>
          </div>
          <div className="chat-list">
            {Object.entries(grouped).map(([date, convos]) => (
              <div key={date}>
                <div className="chat-date-label">{date}</div>
                {convos.map(c => (
                  <div
                    key={c.id}
                    className={`chat-item ${activeConvo?.id === c.id ? 'active' : ''}`}
                    onClick={() => setActiveConvo(c)}
                  >
                    <span className="chat-item-title">{c.title}</span>
                    <span className="chat-menu" onClick={e => deleteConvo(e, c.id)}>{Icon.dots}</span>
                  </div>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '20px 10px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                No conversations yet
              </div>
            )}
          </div>
        </div>

        {/* ── Main panel ── */}
        <div className="chat-main" style={{ justifyContent: messages.length > 0 ? 'flex-start' : 'center', padding: messages.length > 0 ? '0' : '40px' }}>
          {messages.length === 0 ? (
            <>
              <div className="chat-logo">in<em>bo</em></div>
              <div className="chat-input-box">
                <div className="chat-input-row">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask me anything about your meetings & emails..."
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  />
                </div>
                <div className="chat-input-footer">
                  <span style={{ display: 'flex', color: 'var(--text-muted)' }}>{Icon.mic}</span>
                  <div className="chat-source">
                    {Icon.mail}
                    <span>{user?.email || 'your email'}</span>
                  </div>
                  <button className="chat-send" onClick={sendMessage} disabled={streaming}>
                    {Icon.arrowUp}
                  </button>
                </div>
              </div>
              <div className="chat-suggestions">
                {['Summarise my urgent emails', 'Draft a reply to my latest email', 'What emails need my attention today?'].map(s => (
                  <div key={s} className="chat-suggestion" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 14, fontSize: 13, color: 'var(--text-muted)' }}
                    onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                    {s}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {messages.map(m => (
                  <div key={m.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                      background: m.role === 'user' ? 'var(--amber)' : 'var(--bg-active)',
                      color: m.role === 'user' ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid var(--border)'
                    }}>
                      {m.role === 'user' ? (user?.full_name?.charAt(0) || 'U') : 'AI'}
                    </div>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: 10, fontSize: 13.5, lineHeight: 1.6,
                      background: m.role === 'user' ? 'var(--amber-soft)' : 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {m.content || (streaming && m.role === 'assistant' ? <span style={{ color: 'var(--text-muted)' }}>Thinking...</span> : '')}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input at bottom */}
              <div style={{ padding: '12px 32px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                <div className="chat-input-box">
                  <div className="chat-input-row">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Ask a follow-up..."
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    />
                  </div>
                  <div className="chat-input-footer">
                    <span style={{ display: 'flex', color: 'var(--text-muted)' }}>{Icon.mic}</span>
                    <div className="chat-source">
                      {Icon.mail}
                      <span>{user?.email || 'your email'}</span>
                    </div>
                    <button className="chat-send" onClick={sendMessage} disabled={streaming}>
                      {streaming
                        ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                        : Icon.arrowUp}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
