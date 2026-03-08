import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../utils/api';

const CAT = {
  urgent:        { bg: '#FEE2E2', color: '#DC2626', label: 'Urgent' },
  reply_needed:  { bg: '#FEF3C7', color: '#D97706', label: 'Reply needed' },
  fyi:           { bg: '#DBEAFE', color: '#2563EB', label: 'FYI' },
  marketing:     { bg: '#EDE9FE', color: '#7C3AED', label: 'Marketing' },
  uncategorised: { bg: '#F3F4F6', color: '#6B7280', label: 'Uncategorised' },
};

function Tag({ category }) {
  const s = CAT[category] || CAT.uncategorised;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 10, fontWeight: 700, padding: '2px 7px',
      borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em',
      whiteSpace: 'nowrap', flexShrink: 0
    }}>
      {s.label}
    </span>
  );
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendMsg, setSendMsg] = useState('');

  useEffect(() => {
    api.get('/emails?limit=100').then(emails => {
      setDrafts(emails.filter(e => e.has_draft && !e.draft_approved));
    }).finally(() => setLoading(false));
  }, []);

  const selectDraft = (email) => {
    setSelected(email);
    setDraftText(email.draft_content || '');
    setSendMsg('');
  };

  const approve = async () => {
    setSaving(true);
    setSendMsg('');
    try {
      await api.patch(`/emails/${selected.id}`, {
        draft_approved: true,
        draft_content: draftText,
        status: 'replied'
      });
      setSendMsg('✓ Sent successfully');
      setDrafts(prev => prev.filter(e => e.id !== selected.id));
      setTimeout(() => { setSelected(null); setSendMsg(''); }, 1500);
    } catch (err) {
      setSendMsg('Failed to send: ' + (err.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const discard = async () => {
    await api.patch(`/emails/${selected.id}`, { has_draft: false, status: 'read' });
    setDrafts(prev => prev.filter(e => e.id !== selected.id));
    setSelected(null);
  };

  if (loading) return <Layout title="AI Drafts"><div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div></Layout>;

  return (
    <Layout title="AI Drafts">
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
        {drafts.length > 0
          ? `${drafts.length} AI-drafted ${drafts.length === 1 ? 'reply' : 'replies'} waiting for your approval`
          : 'No pending drafts — all caught up!'}
      </div>

      {drafts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40" style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }}>
            <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>All caught up</div>
          <div style={{ fontSize: 13 }}>Inbo will draft replies as new emails arrive</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '300px 1fr' : '1fr', gap: 16, alignItems: 'start', minWidth: 0 }}>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
            {drafts.map(email => (
              <div
                key={email.id}
                onClick={() => selectDraft(email)}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${selected?.id === email.id ? 'var(--amber)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '12px 14px', cursor: 'pointer',
                  transition: 'border-color 0.15s', minWidth: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email.from_name}
                  </span>
                  <Tag category={email.category} />
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                  {email.subject}
                </div>
                <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600 }}>✦ Draft ready</div>
              </div>
            ))}
          </div>

          {/* Detail */}
          {selected && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', minWidth: 0 }}>
              {/* Header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3, wordBreak: 'break-word' }}>{selected.subject}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  From <strong style={{ color: 'var(--text)' }}>{selected.from_name}</strong> · {selected.from_email}
                </div>
              </div>

              {/* Original email body */}
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid var(--border)',
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65,
                maxHeight: 180, overflowY: 'auto',
                wordBreak: 'break-word', whiteSpace: 'pre-wrap', overflowX: 'hidden'
              }}>
                {selected.body_preview}
              </div>

              {/* Draft label */}
              <div style={{ padding: '8px 18px 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--amber)' }}>
                ✦ AI Draft Reply
              </div>

              {/* Editable draft */}
              <textarea
                value={draftText}
                onChange={e => setDraftText(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--bg)', border: 'none',
                  borderTop: '1px solid var(--border)',
                  padding: '12px 18px', fontSize: 13.5,
                  fontFamily: 'var(--font)', color: 'var(--text)',
                  resize: 'vertical', minHeight: 160, outline: 'none',
                  lineHeight: 1.65, wordBreak: 'break-word'
                }}
              />

              {/* Actions */}
              <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                {sendMsg && (
                  <span style={{ fontSize: 12, color: sendMsg.startsWith('✓') ? '#16a34a' : '#dc2626', flex: 1 }}>
                    {sendMsg}
                  </span>
                )}
                <button className="btn btn-sm" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={discard}>Discard</button>
                <button className="btn btn-sm" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={() => setDraftText(selected.draft_content)}>Reset</button>
                <button className="btn btn-sm btn-primary" onClick={approve} disabled={saving}>
                  {saving ? 'Sending...' : '✓ Approve & send'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
