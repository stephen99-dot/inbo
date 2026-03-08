import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { Icon } from '../components/Layout';
import { api } from '../utils/api';

const AVATAR_COLORS = ['#3D7A5C','#9BB8C5','#C4A882','#B4A0C8','#7A8C5C','#C47A5C','#5C7AA8'];
function getColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let h = 0;
  for (let c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}
function timeAgo(dt) {
  const d = new Date(dt);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const UrgentDot = () => <svg viewBox="0 0 8 8" width="8" height="8" style={{flexShrink:0}}><circle cx="4" cy="4" r="4" fill="var(--red)"/></svg>;
const ReplyIcon = () => <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M2 7l4-4v2.5c4 0 6 2 6 5.5-1.5-2-3-3-6-3V10L2 7z"/></svg>;
const FYIIcon = () => <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><circle cx="7" cy="7" r="6"/><path d="M7 6v4M7 4.5v.5"/></svg>;
const MarketingIcon = () => <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M2 5h7l2-3v9l-2-3H2V5z"/><path d="M5 8v3"/></svg>;

const FILTERS = [
  { key: 'all', label: 'All', icon: null },
  { key: 'urgent', label: 'Urgent', icon: <UrgentDot /> },
  { key: 'reply_needed', label: 'Reply needed', icon: <ReplyIcon /> },
  { key: 'fyi', label: 'FYI', icon: <FYIIcon /> },
  { key: 'marketing', label: 'Marketing', icon: <MarketingIcon /> },
];

export default function InboxPage() {
  const [emails, setEmails] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [draftText, setDraftText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?category=${filter}` : '';
      const data = await api.get(`/emails${params}`);
      setEmails(data);
    } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const selectEmail = async (email) => {
    setSelected(email);
    setDraftText(email.draft_content || '');
    if (email.status === 'unread') {
      await api.patch(`/emails/${email.id}`, { status: 'read' });
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, status: 'read' } : e));
    }
  };

  const approveDraft = async () => {
    if (!selected) return;
    setSaving(true);
    await api.patch(`/emails/${selected.id}`, { draft_approved: true, draft_content: draftText, status: 'replied' });
    setSelected(prev => ({ ...prev, draft_approved: 1, status: 'replied' }));
    setEmails(prev => prev.map(e => e.id === selected.id ? { ...e, draft_approved: 1, status: 'replied' } : e));
    setSaving(false);
  };

  const dismissDraft = async () => {
    if (!selected) return;
    await api.patch(`/emails/${selected.id}`, { status: 'read' });
    setSelected(prev => ({ ...prev, has_draft: 0 }));
    setEmails(prev => prev.map(e => e.id === selected.id ? { ...e, has_draft: 0 } : e));
  };

  return (
    <Layout title="Inbox">
      <div className="inbox-layout" style={{ margin: '-24px' }}>
        {/* Email list */}
        <div className="email-list-panel">
          <div className="email-filters">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`filter-chip ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {f.icon}{f.label}
              </button>
            ))}
          </div>

          {loading
            ? <div style={{ padding: 32, textAlign: 'center' }}><div className="spinner" /></div>
            : emails.length === 0
              ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No emails in this category
                </div>
              : emails.map(email => (
                <div
                  key={email.id}
                  className={`email-row ${email.status === 'unread' ? 'unread' : ''} ${selected?.id === email.id ? 'selected' : ''}`}
                  onClick={() => selectEmail(email)}
                >
                  <div className="er-avatar" style={{ background: getColor(email.from_name) }}>
                    {initials(email.from_name)}
                  </div>
                  <div className="er-body">
                    <div className="er-top">
                      <span className="er-from">{email.from_name}</span>
                      <span className="er-time">{timeAgo(email.received_at)}</span>
                    </div>
                    <div className="er-subject">{email.subject}</div>
                    <div className="er-tags">
                      <span className={`tag tag-${email.category}`}>{email.category.replace('_', ' ')}</span>
                      {email.has_draft && !email.draft_approved && <span className="tag tag-draft">Draft ready</span>}
                      {email.draft_approved ? <span className="tag" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.25)' }}>Sent ✓</span> : null}
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* Detail panel */}
        <div className="email-detail-panel">
          {!selected
            ? (
              <div className="email-detail-empty">
                <div className="email-detail-empty-icon">✉</div>
                <div className="email-detail-empty-text">Select an email to read it</div>
              </div>
            )
            : (
              <>
                <div className="email-detail-header">
                  <div className="email-subject">{selected.subject}</div>
                  <div className="email-meta">
                    <span className="email-from">From <strong>{selected.from_name}</strong> &lt;{selected.from_email}&gt;</span>
                    <span className={`tag tag-${selected.category}`}>{selected.category.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="email-body">
                  {selected.body_html ? (
                    <iframe
                      srcDoc={selected.body_html}
                      sandbox="allow-same-origin"
                      style={{
                        width: '100%',
                        minHeight: 400,
                        border: 'none',
                        borderRadius: 6,
                        background: '#fff',
                        display: 'block'
                      }}
                      onLoad={e => {
                        const doc = e.target.contentDocument;
                        if (doc) e.target.style.height = doc.documentElement.scrollHeight + 'px';
                      }}
                      title="email-content"
                    />
                  ) : (
                    selected.full_body || selected.body_preview || '(No content)'
                  )}
                </div>

                {selected.has_draft && !selected.draft_approved && (
                  <div className="draft-panel">
                    <div className="draft-header">
                      <span className="draft-label">✦ AI draft reply — sounds like you</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Edit before sending</span>
                    </div>
                    <textarea
                      className="draft-textarea"
                      value={draftText}
                      onChange={e => setDraftText(e.target.value)}
                    />
                    <div className="draft-actions">
                      <button className="btn-sm danger" onClick={dismissDraft}>Discard</button>
                      <button className="btn-sm ghost" onClick={() => setDraftText(selected.draft_content)}>Reset</button>
                      <button className="btn-sm amber" onClick={approveDraft} disabled={saving}>
                        {saving ? 'Sending...' : '✓ Approve & send'}
                      </button>
                    </div>
                  </div>
                )}

                {selected.draft_approved && (
                  <div style={{ margin: '0 24px 24px', padding: '12px 16px', background: 'var(--success-bg)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius)', color: 'var(--success)', fontSize: 13 }}>
                    ✓ Reply approved and sent
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </Layout>
  );
}
