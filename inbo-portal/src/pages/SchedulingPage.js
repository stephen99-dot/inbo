import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Icon } from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function SchedulingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const link = `https://inbo.ai/e/${user?.email?.split('@')[0] || 'you'}/30`;

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout title="Scheduling">
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last 30 days</div>
      <div className="stat-row" style={{ marginBottom: 22 }}>
        <div className="stat-card"><div className="stat-label">Meetings booked</div><div className="stat-value">0</div></div>
        <div className="stat-card"><div className="stat-label">Average attendees</div><div className="stat-value">0.0</div></div>
        <div className="stat-card"><div className="stat-label">Average duration</div><div className="stat-value">0<sub>m</sub></div></div>
      </div>

      <div className="scheduling-section">
        <div className="sched-text">
          <h3>Share your scheduling link</h3>
          <p>Inbo uses this link when someone asks what times you're available. Share it to let others book directly.</p>
        </div>
        <div className="sched-link-box">
          <div className="link-row">
            <input className="link-input" readOnly value={link} />
            <button className="copy-btn" onClick={copyLink}>{copied ? 'Copied ✓' : 'Copy link'}</button>
          </div>
          <div className="update-link">Update Meeting Settings →</div>
        </div>
      </div>

      <div className="promo-grid" style={{ marginTop: 20 }}>
        <div className="promo-card">
          <div className="promo-art">{Icon.calendar}</div>
          <div className="promo-body">
            <div className="promo-title">Optimize your scheduling workflow</div>
            <div className="promo-desc">Smart algorithms suggest optimal meeting times and streamline your scheduling process.</div>
            <div className="promo-cta">Learn more →</div>
          </div>
        </div>
        <div className="promo-card">
          <div className="promo-art">{Icon.users}</div>
          <div className="promo-body">
            <div className="promo-title">Team scheduling</div>
            <div className="promo-desc">Browse availability across your team and book meetings with multiple attendees at once.</div>
            <div className="promo-cta" onClick={() => navigate('/settings/people')}>Manage teams →</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
