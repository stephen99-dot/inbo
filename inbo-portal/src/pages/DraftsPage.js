import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../utils/api';

export default function DraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/emails?limit=100').then(emails => {
      const pending = emails.filter(e => e.has_draft && !e.draft_approved);
      setDrafts(pending);
    }).finally(() => setLoading(false));
  }, []);

  const selectDraft = (email) => {
    setSelected(email);
    setDraftText(email.draft_content || '');
  };

  const approve = async () => {
    await api.patch(`/emails/${selected.id}`, { draft_approved: true, draft_content: draftText, status: 'replied' });
    setDrafts(prev => prev.filter(e => e.id !== selected.id));
    setSelected(null);
  };

  const discard = async () => {
    await api.patch(`/emails/${selected.id}`, { status: 'read' });
    setDrafts(prev => prev.filter(e => e.id !== selected.id));
    setSelected(null);
  };

  return (
    <Layout title="AI Drafts">
      <div style={{ marginBottom: 20 }}>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          {drafts.length > 0
            ? `${drafts.length} AI-drafted ${drafts.length === 1 ? 'reply' : 'replies'} waiting for your approval`
            : 'No pending drafts — all caught up!'}
        </p>
      </div>

      {loading
        ? <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        : drafts.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8 }}>All caught up</div>
              <div style={{ fontSize: 13 }}>Inbo will draft replies as new emails arrive</div>
            </div>
          )
          : (
            <div style={{ display: 'grid', gridTemplateColumns: selected ? '340px 1fr' : '1fr', gap: 20 }}>
              <div>
                {drafts.map(email => (
                  <div
                    key={email.id}
                    className={`section-card`}
                    onClick={() => selectDraft(email)}
                    style={{
                      marginBottom: 12,
                      cursor: 'pointer',
                      borderColor: selected?.id === email.id ? 'var(--amber)' : 'var(--border)',
                      transition: 'border-color 0.15s'
                    }}
                  >
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{email.from_name}</span>
                        <span className={`tag tag-${email.category}`}>{email.category.replace('_', ' ')}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 4 }}>{email.subject}</div>
                      <div style={{ fontSize: 11, color: 'var(--amber)' }}>✦ Draft reply ready</div>
                    </div>
                  </div>
                ))}
              </div>

              {selected && (
                <div className="section-card" style={{ height: 'fit-content' }}>
                  <div className="section-header">
                    <div>
                      <div className="section-title">{selected.subject}</div>
                      <div className="section-subtitle">From {selected.from_name}</div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 13.5, color: 'var(--text-dim)', lineHeight: 1.7 }}>
                    {selected.full_body}
                  </div>
                  <div style={{ padding: '12px 20px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--amber)' }}>
                    ✦ AI Draft Reply
                  </div>
                  <textarea
                    className="draft-textarea"
                    value={draftText}
                    onChange={e => setDraftText(e.target.value)}
                    style={{ padding: '0 20px 16px', minHeight: 160 }}
                  />
                  <div className="draft-actions" style={{ padding: '12px 20px' }}>
                    <button className="btn-sm danger" onClick={discard}>Discard</button>
                    <button className="btn-sm ghost" onClick={() => setDraftText(selected.draft_content)}>Reset</button>
                    <button className="btn-sm amber" onClick={approve}>✓ Approve & send</button>
                  </div>
                </div>
              )}
            </div>
          )}
    </Layout>
  );
}
