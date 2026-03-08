import { useState } from 'react';
import Layout from '../components/Layout';

const CATEGORIES = [
  { key: 'respond', name: 'To respond', desc: 'Need your response', color: '#EF4444' },
  { key: 'fyi', name: 'FYI', desc: 'Important, no reply needed', color: '#F59E0B' },
  { key: 'comment', name: 'Comment', desc: 'Document comments & chats', color: '#EAB308' },
  { key: 'notification', name: 'Notification', desc: 'Automated tool notifications', color: '#10B981' },
  { key: 'meeting', name: 'Meeting update', desc: 'Calendar & meeting invites', color: '#3B82F6' },
  { key: 'awaiting', name: 'Awaiting reply', desc: 'Waiting for their reply', color: '#6366F1' },
  { key: 'actioned', name: 'Actioned', desc: 'Resolved & completed threads', color: '#8B5CF6' },
  { key: 'marketing', name: 'Marketing', desc: 'Sales & marketing emails', color: '#EC4899' },
];

const EXTRA = [
  { key: 'respect', name: 'Respect my categories', desc: "We won't sort emails already labelled", color: '#6B7280' },
];

function Toggle({ defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked ?? true);
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={() => setChecked(c => !c)} />
      <span className="toggle-track" />
    </label>
  );
}

export default function CategorizationPage() {
  const [tab, setTab] = useState('general');

  const topbarRight = (
    <button className="topbar-btn ghost">Update preferences</button>
  );

  return (
    <Layout title="Categorization" topbarRight={topbarRight}>
      <div className="tabs">
        <button className={`tab-btn ${tab === 'general' ? 'active' : ''}`} onClick={() => setTab('general')}>General</button>
        <button className={`tab-btn ${tab === 'advanced' ? 'active' : ''}`} onClick={() => setTab('advanced')}>Advanced</button>
      </div>

      {tab === 'general' && (
        <>
          <div className="cat-layout" style={{ marginBottom: 16 }}>
            {/* Move out of inbox */}
            <div className="cat-section">
              <div className="cat-section-header">Move these out of my Inbox</div>
              {CATEGORIES.map(c => (
                <div key={c.key} className="cat-item">
                  <div className="cat-dot" style={{ background: c.color }} />
                  <div className="cat-info">
                    <div className="cat-name">{c.name}</div>
                    <div className="cat-desc">{c.desc}</div>
                  </div>
                  <Toggle defaultChecked />
                </div>
              ))}
            </div>

            {/* Keep in inbox */}
            <div className="cat-section">
              <div className="cat-section-header">Keep these in my Inbox</div>
              <div className="cat-empty">No categories selected</div>
            </div>
          </div>

          {/* Existing categories */}
          <div className="cat-section" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div className="cat-section-header">Existing categories</div>
            {EXTRA.map(c => (
              <div key={c.key} className="cat-item">
                <div className="cat-dot" style={{ background: c.color }} />
                <div className="cat-info">
                  <div className="cat-name">{c.name}</div>
                  <div className="cat-desc">{c.desc}</div>
                </div>
                <Toggle defaultChecked={false} />
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'advanced' && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          Advanced categorization rules coming soon
        </div>
      )}
    </Layout>
  );
}
