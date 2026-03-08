import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { user } = useAuth();
  const [input, setInput] = useState('');

  const pastChats = [
    { date: '22/02/2026', title: 'Order Fulfillment & Deliv...' },
  ];

  return (
    <Layout title="Chat">
      <div className="chat-layout">
        {/* Left panel */}
        <div className="chat-side">
          <div className="chat-side-top">
            <div className="chat-search">
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🔍</span>
              <input placeholder="Search" />
            </div>
            <button className="chat-new-btn">✏ New Chat</button>
          </div>
          <div className="chat-list">
            {pastChats.map((c, i) => (
              <div key={i}>
                <div className="chat-date-label">{c.date}</div>
                <div className="chat-item active">
                  <span className="chat-item-title">{c.title}</span>
                  <span className="chat-menu">···</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div className="chat-main">
          <div className="chat-logo">in<em>bo</em></div>
          <div className="chat-input-box">
            <div className="chat-input-row">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything about your meetings & emails..."
                onKeyDown={e => e.key === 'Enter' && alert('Claude API integration coming soon — add ANTHROPIC_API_KEY to Render env vars')}
              />
            </div>
            <div className="chat-input-footer">
              <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>🎤</span>
              <div className="chat-source">
                <span style={{ fontSize: 12 }}>📧</span>
                {user?.email || 'your email'} ⌄
              </div>
              <button className="chat-send" onClick={() => alert('Claude API integration coming soon — add ANTHROPIC_API_KEY to Render env vars')}>↑</button>
            </div>
          </div>
          <div className="chat-suggestions">
            <div className="chat-suggestion"><div className="shimmer" /></div>
            <div className="chat-suggestion"><div className="shimmer" /></div>
            <div className="chat-suggestion"><div className="shimmer" /></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
