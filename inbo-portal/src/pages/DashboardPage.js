import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, unread: 0, drafts: 0, urgent: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/stats').then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(`https://inbo.ai/e/${user?.email?.split('@')[0]}/30`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const topbarRight = (
    <div className="topbar-select" onClick={() => navigate('/settings/organization')}>
      Personal <span style={{ fontSize: 10, marginLeft: 4 }}>⌄</span>
    </div>
  );

  return (
    <Layout title="Dashboard" topbarRight={topbarRight}>
      {/* ── Stat cards ── */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-label">Emails processed</div>
          <div className="stat-value">{loading ? '—' : stats.total.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Drafts created</div>
          <div className="stat-value">{loading ? '—' : stats.drafts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Urgent flagged</div>
          <div className="stat-value">{loading ? '—' : stats.urgent}<sub>emails</sub></div>
        </div>
      </div>

      {/* ── Meetings ── */}
      <p className="section-title-label">Your meetings</p>
      <div className="meetings-grid">
        <div className="meeting-card">
          <div className="meeting-card-header">Today</div>
          <div className="meeting-card-body">No meetings today</div>
        </div>
        <div className="meeting-card">
          <div className="meeting-card-header">Tomorrow</div>
          <div className="meeting-card-body">No meetings tomorrow</div>
        </div>
      </div>

      {/* ── Scheduling link ── */}
      <div className="scheduling-section">
        <div className="sched-text">
          <h3>Share your scheduling link</h3>
          <p>Inbo uses this link when someone asks what times you're available for a meeting. You can also directly share this link to let others book a time on your calendar.</p>
        </div>
        <div className="sched-link-box">
          <div className="link-row">
            <input
              className="link-input"
              readOnly
              value={`https://inbo.ai/e/${user?.email?.split('@')[0] || 'you'}/30`}
            />
            <button className="copy-btn" onClick={copyLink}>
              {copied ? 'Copied ✓' : 'Copy link ⌄'}
            </button>
          </div>
          <div className="update-link" onClick={() => navigate('/scheduling')}>
            Update Meeting Settings →
          </div>
        </div>
      </div>

      {/* ── Promo cards ── */}
      <div className="promo-grid">
        <div className="promo-card" onClick={() => navigate('/notetaker')}>
          <div className="promo-art">📝</div>
          <div className="promo-body">
            <div className="promo-title">Browse your meeting notes</div>
            <div className="promo-desc">Watch meeting recordings, read full transcripts, and get concise summaries</div>
            <div className="promo-cta">View Notes →</div>
          </div>
        </div>
        <div className="promo-card" onClick={() => navigate('/categorization')}>
          <div className="promo-art">🗂</div>
          <div className="promo-body">
            <div className="promo-title">Customize your inbox</div>
            <div className="promo-desc">Choose what stays visible, and quietly sort everything else away</div>
            <div className="promo-cta">Manage categories →</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
