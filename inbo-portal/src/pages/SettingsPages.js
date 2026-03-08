import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function Toggle({ defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked ?? false);
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={() => setChecked(c => !c)} />
      <span className="toggle-track" />
    </label>
  );
}

// ─── ORGANIZATION ──────────────────────────────────────────────────────────────
export function OrganizationPage() {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState(user?.company || '');
  const [domain, setDomain] = useState('');

  return (
    <Layout title="Organization" topbarRight={<button className="topbar-btn ghost">Update preferences</button>}>
      <div className="tabs">
        <button className="tab-btn active">General</button>
      </div>

      <div className="invite-banner">
        <div className="invite-icon">👥</div>
        <div style={{ flex: 1 }}>
          <div className="invite-title">Invite your team</div>
          <div className="invite-desc">Inbo gets smarter when teammates share context. Invite them to collaborate.</div>
        </div>
        <button className="btn btn-ghost btn-sm">Add teammates →</button>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">Organization Details</div>
        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Organization Name</div>
          <input
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, padding: '4px 0', outline: 'none', width: '100%' }}
            placeholder="Your company name"
          />
        </div>
        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Organization Domain</div>
          <input
            value={domain}
            onChange={e => setDomain(e.target.value)}
            style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, padding: '4px 0', outline: 'none', width: '100%' }}
            placeholder="example.com"
          />
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Teammates with this email domain can automatically join this organization when they sign up.</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">Members &amp; Access</div>
        <div className="settings-row">
          <div className="sr-info">
            <div className="sr-label">Automatically add users for this domain</div>
            <div className="sr-desc">Teammates with your email domain will automatically join when they sign up to Inbo</div>
          </div>
          <Toggle />
        </div>
        <div className="settings-row">
          <div className="sr-info">
            <div className="sr-label">Discoverable organization</div>
            <div className="sr-desc">New teammates will see this organization when signing up with your domain</div>
          </div>
          <Toggle />
        </div>
      </div>

      <div className="settings-section">
        <div className="danger-zone">
          <div className="danger-zone-title">Danger Zone</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Irreversible actions for your organization</div>
          <div className="danger-actions">
            <button className="btn btn-ghost btn-sm">Leave Organization</button>
            <button className="btn btn-danger btn-sm">Delete Organization</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ─── PEOPLE ────────────────────────────────────────────────────────────────────
export function PeoplePage() {
  const { user } = useAuth();
  return (
    <Layout title="People" topbarRight={<button className="topbar-btn ghost">Update preferences</button>}>
      <div className="tabs"><button className="tab-btn active">General</button></div>
      <div className="settings-section">
        <div className="settings-section-header">Team Members</div>
        <div style={{ padding: '18px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--amber-soft)', border: '1px solid var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--amber)' }}>
            {user?.full_name?.split(' ').map(p => p[0]).join('').toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{user?.full_name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user?.email} · Admin</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--amber)', fontWeight: 600, textTransform: 'uppercase' }}>You</span>
        </div>
      </div>
      <div style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-secondary)' }}>
        Invite teammates to collaborate — use the Organization page to set up your domain.
      </div>
    </Layout>
  );
}

// ─── INTEGRATIONS ──────────────────────────────────────────────────────────────
export function IntegrationsPage() {
  const { user } = useAuth();
  const { setUser } = useAuth();

  const INTEGRATIONS = [
    { key: 'gmail', icon: '📧', name: 'Gmail', desc: 'Connect your Gmail inbox', connected: user?.gmail_connected },
    { key: 'outlook', icon: '📬', name: 'Outlook / Microsoft 365', desc: 'Connect your Outlook inbox', connected: user?.outlook_connected },
    { key: 'gcal', icon: '📅', name: 'Google Calendar', desc: 'Sync your calendar for scheduling', connected: false },
    { key: 'zoom', icon: '🎥', name: 'Zoom', desc: 'Let Inbo join and transcribe Zoom calls', connected: false },
    { key: 'teams', icon: '💻', name: 'Microsoft Teams', desc: 'Let Inbo join and transcribe Teams calls', connected: false },
    { key: 'meet', icon: '📡', name: 'Google Meet', desc: 'Let Inbo join and transcribe Meet calls', connected: false },
  ];

  const handleConnect = (key) => {
    alert(`${key === 'gmail' ? 'Gmail' : 'This'} OAuth coming soon — add the relevant API credentials to your Render environment variables.`);
  };

  return (
    <Layout title="Integrations" topbarRight={<button className="topbar-btn ghost">Update preferences</button>}>
      <div className="tabs"><button className="tab-btn active">General</button></div>
      <div className="settings-section">
        <div className="settings-section-header">Connected accounts</div>
        {INTEGRATIONS.map(int => (
          <div key={int.key} className="integration-row">
            <div className="int-logo">{int.icon}</div>
            <div className="int-info">
              <div className="int-name">{int.name}</div>
              <div className={`int-status ${int.connected ? 'connected' : ''}`}>
                {int.connected ? 'Connected' : int.desc}
              </div>
            </div>
            <button
              className={`btn btn-sm ${int.connected ? 'btn-danger' : 'btn-ghost'}`}
              onClick={() => handleConnect(int.key)}
            >
              {int.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
      <div style={{ padding: 14, background: 'var(--amber-softer)', border: '1px solid rgba(240,112,48,0.2)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--amber)' }}>Setting up OAuth?</strong> Add <code style={{ background: 'var(--bg-active)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>GOOGLE_CLIENT_ID</code>, <code style={{ background: 'var(--bg-active)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>GOOGLE_CLIENT_SECRET</code> to Render environment variables. See README for full setup guide.
      </div>
    </Layout>
  );
}

// ─── PROFILE (sub-page for personal settings) ──────────────────────────────────
export function ProfileSettingsPage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name || '', company: user?.company || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.patch('/profile', form);
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  return (
    <Layout title="Profile" topbarRight={<button className="topbar-btn ghost">Update preferences</button>}>
      <div className="settings-section">
        <div className="settings-section-header">Personal Details</div>
        <div style={{ padding: 18 }}>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label>Full name</label>
              <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={user?.email || ''} disabled />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+44 7700 000000" />
          </div>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
