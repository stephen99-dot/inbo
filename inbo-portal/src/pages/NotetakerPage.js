import Layout from '../components/Layout';
import { Icon } from '../components/Layout';

export default function NotetakerPage() {
  const topbarRight = (
    <button className="btn btn-primary btn-sm">
      Record meeting
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
          <div className="promo-art">
            {Icon.mic}
          </div>
          <div className="promo-body">
            <div className="promo-title">Record in-person meetings</div>
            <div className="promo-desc">Click. Speak. Record. Done. Instant transcripts and summaries.</div>
            <div className="promo-cta">Start →</div>
          </div>
        </div>
        <div className="promo-card">
          <div className="promo-art">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48" style={{ opacity: 0.5, color: 'var(--text-muted)' }}>
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
            </svg>
          </div>
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
