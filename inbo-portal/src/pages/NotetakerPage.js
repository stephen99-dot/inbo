import Layout from '../components/Layout';

export default function NotetakerPage() {
  const topbarRight = (
    <button className="topbar-btn primary">⏺ Record meeting ⌄</button>
  );

  return (
    <Layout title="Notetaker" topbarRight={topbarRight}>
      <div style={{ textAlign: 'center', paddingTop: 16, marginBottom: 32 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Meet your new AI Notetaker</p>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Never write meeting notes again</h2>
      </div>

      <div className="promo-grid" style={{ maxWidth: 800, margin: '0 auto 32px' }}>
        <div className="promo-card">
          <div className="promo-art" style={{ flexDirection: 'column', gap: 8 }}>
            <div style={{ background: 'var(--amber-soft)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, width: '80%' }}>
              <span style={{ color: 'var(--red)', fontSize: 12 }}>●</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>00:24</span>
              <div style={{ flex: 1, height: 24, background: 'linear-gradient(90deg, var(--amber) 30%, transparent)', borderRadius: 4, opacity: 0.5 }} />
              <span style={{ fontSize: 10, background: 'var(--bg-active)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-muted)' }}>■ Stop</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hello world</span>
          </div>
          <div className="promo-body">
            <div className="promo-title">Record in-person meetings</div>
            <div className="promo-desc">Click. Speak. Record. Done. Instant transcripts and summaries.</div>
            <div className="promo-cta">Start →</div>
          </div>
        </div>
        <div className="promo-card">
          <div className="promo-art" style={{ fontSize: 40 }}>📹</div>
          <div className="promo-body">
            <div className="promo-title">Join video calls</div>
            <div className="promo-desc">Let Inbo join your meetings for instant transcripts and summaries.</div>
            <div className="promo-cta">Start →</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, maxWidth: 700, margin: '0 auto', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {[
          { icon: '🎙', label: 'Record and summarize meetings' },
          { icon: '💬', label: 'Find answers instantly with Chat' },
          { icon: '✉', label: 'Automatic follow-ups' },
        ].map(f => (
          <div key={f.label} style={{ background: 'var(--bg-card)', padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f.label}</div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
