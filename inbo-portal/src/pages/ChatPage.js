import { useState } from 'react';
import Layout from '../components/Layout';
import { Icon } from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const pastChats = [{ date: '22/02/2026', title: 'Order Fulfillment & Delivery...' }];

  return (
    <Layout title="Chat">
      <div className="chat-layout">
        <div className="chat-side">
          <div className="chat-side-top">
            <div className="chat-search">
              {Icon.search}
              <input placeholder="Search" />
            </div>
            <button className="chat-new-btn">
              {Icon.compose} New Chat
            </button>
          </div>
          <div className="chat-list">
            {pastChats.map((c, i) => (
              <div key={i}>
                <div className="chat-date-label">{c.date}</div>
                <div className="chat-item active">
                  <span className="chat-item-title">{c.title}</span>
                  <span className="chat-menu">{Icon.dots}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-main">
          <div className="chat-logo">in<em>bo</em></div>
          <div className="chat-input-box">
            <div className="chat-input-row">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything about your meetings & emails..."
                onKeyDown={e => e.key === 'Enter' && alert('Connect Claude API — add ANTHROPIC_API_KEY to Render env vars')}
              />
            </div>
            <div className="chat-input-footer">
              <span style={{ display: 'flex', color: 'var(--text-muted)' }}>{Icon.mic}</span>
              <div className="chat-source">
                {Icon.mail}
                <span>{user?.email || 'your email'}</span>
                {Icon.chevronDown}
              </div>
              <button className="chat-send" onClick={() => alert('Connect Claude API — add ANTHROPIC_API_KEY to Render env vars')}>
                {Icon.arrowUp}
              </button>
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
