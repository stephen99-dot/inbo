import Layout from '../components/Layout';
import { Icon } from '../components/Layout';

export default function NotetakerPage() {
  const topbarRight = (
    <button className="topbar-btn primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {Icon.record} Record meeting
    </button>
  );

  return (
    <Layout title="Notetaker" topbarRight={topbarRight}>
      <div style={{ textAlign: 'center', paddingTop: 16, marginBottom: 32 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Meet your new AI Notetaker</p>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Never write meeting notes again</h2>
      </div>

      <div className="promo-grid" style={{ maxWidth: 800, margin: '0 auto 24px' }}>
        <div className="promo-card">
          <div className="promo-art" style={{ flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-active)', borderRadius: 8, padding: '10px 16px', width: '80%' }}>
              <svg viewBox="0 0 10 10" width="8" height="8"><circle cx="5" cy="5" r="5" fill="var(--red)"/></svg>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>00:24</span>
              <div style={{ flex: 1, height: 20, borderRadius: 4, background: 'linear-gradient(90deg, var(--amber) 0%, var(--amber-soft) 60%, transparent 100%)', opacity: 0.6 }} />
              <div style={{ background: 'var(--bg-hover)', borderRadius: 4, padding: '3px 8px', fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {Icon.record} Stop
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Listening...</span>
          </div>
          <div className="promo-body">
            <div className="promo-title">Record in-person meetings</div>
            <div className="promo-desc">Click. Speak. Record. Done. Instant transcripts and summaries.</div>
            <div className="promo-cta">Start →</div>
          </div>
        </div>
        <div className="promo-card">
          <div className="promo-art">{Icon.video}</div>
          <div className="promo-body">
            <div className="promo-title">Join video calls</div>
            <div className="promo-desc">Let Inbo join your meetings for instant transcripts and summaries.</div>
            <div className="promo-cta">Start →</div>
          </div>
        </div>
      </div>

      <div className="notetaker-feature-strip">
        <div className="notetaker-feature">
          {Icon.mic}
          <div className="notetaker-feature-label">Record and summarize meetings</div>
        </div>
        <div className="notetaker-feature">
          {Icon.chat}
          <div className="notetaker-feature-label">Find answers instantly with Chat</div>
        </div>
        <div className="notetaker-feature">
          {Icon.mail}
          <div className="notetaker-feature-label">Automatic follow-ups</div>
        </div>
      </div>
    </Layout>
  );
}
