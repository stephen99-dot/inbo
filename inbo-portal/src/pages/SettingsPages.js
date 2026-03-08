import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Icon } from '../components/Layout';
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
        <div className="invite-icon">{Icon.users}</div>
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
  const { user, setUser } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Refresh user data on load to pick up gmail_connected after OAuth redirect
  useEffect(() => {
    api.get('/auth/me').then(setUser).catch(() => {});
  }, []);

  const hash = window.location.hash;
  const urlSuccess = hash.includes('success=gmail');
  const urlError = hash.includes('error=') && !hash.includes('success=');

  const INTEGRATIONS = [
    { key: 'gmail', icon: Icon.mail, name: 'Gmail', desc: 'Connect your Gmail inbox to read and draft emails', connected: user?.gmail_connected, email: user?.gmail_email },
    { key: 'outlook', icon: Icon.inbox, name: 'Outlook / Microsoft 365', desc: 'Connect your Outlook inbox', connected: user?.outlook_connected },
    { key: 'gcal', icon: Icon.calendar, name: 'Google Calendar', desc: 'Sync your calendar for scheduling', connected: false },
    { key: 'zoom', icon: Icon.video, name: 'Zoom', desc: 'Let Inbo join and transcribe Zoom calls', connected: false },
    { key: 'teams', icon: Icon.video, name: 'Microsoft Teams', desc: 'Let Inbo join and transcribe Teams calls', connected: false },
    { key: 'meet', icon: Icon.video, name: 'Google Meet', desc: 'Let Inbo join and transcribe Meet calls', connected: false },
  ];

  const connectGmail = async () => {
    try {
      const data = await api.get('/auth/gmail');
      window.location.href = data.url;
    } catch (err) {
      alert('Failed to start Gmail OAuth: ' + err.message);
    }
  };

  const [drafting, setDrafting] = useState(false);

  const draftReplies = async () => {
    setDrafting(true);
    setSyncMsg('');
    try {
      const result = await api.post('/gmail/draft-all', {});
      setSyncMsg(`Processing ${result.processing} emails — drafts will appear in Gmail and your Drafts page shortly.`);
      setTimeout(() => setSyncMsg(''), 8000);
    } catch (err) {
      setSyncMsg('Failed: ' + err.message);
    }
    setDrafting(false);
  };
    setSyncing(true);
    setSyncMsg('');
    try {
      const result = await api.post('/gmail/sync', { full });
      setSyncMsg(`Synced — ${result.added} new emails added.`);
      setTimeout(() => setSyncMsg(''), 5000);
    } catch (err) {
      setSyncMsg('Sync failed: ' + err.message);
    }
    setSyncing(false);
  };

  const handleConnect = (key) => {
    if (key === 'gmail') return connectGmail();
    alert('Coming soon — Outlook and calendar integrations are on the roadmap.');
  };

  return (
    <Layout title="Integrations" topbarRight={<button className="topbar-btn ghost">Update preferences</button>}>
      <div className="tabs"><button className="tab-btn active">General</button></div>

      {urlSuccess && (
        <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--green-soft)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--green)' }}>
          Gmail connected successfully! Click <strong>Sync inbox</strong> to pull in your emails.
        </div>
      )}
      {urlError && (
        <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--red-soft)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--red)' }}>
          Gmail connection failed. Please try again.
        </div>
      )}

      <div className="settings-section">
        <div className="settings-section-header">Connected accounts</div>
        {INTEGRATIONS.map(int => (
          <div key={int.key} className="integration-row">
            <div className="int-logo">{int.icon}</div>
            <div className="int-info">
              <div className="int-name">{int.name}</div>
              <div className={`int-status ${int.connected ? 'connected' : ''}`}>
                {int.connected ? `Connected${int.email ? ' · ' + int.email : ''}` : int.desc}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {int.key === 'gmail' && int.connected && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => syncGmail(false)} disabled={syncing}>
                    {syncing ? 'Syncing...' : 'Sync latest'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => syncGmail(true)} disabled={syncing}>
                    Full sync
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={draftReplies} disabled={drafting}>
                    {drafting ? 'Processing...' : 'Draft replies'}
                  </button>
                </>
              )}
              <button
                className={`btn btn-sm ${int.connected ? 'btn-danger' : 'btn-ghost'}`}
                onClick={() => handleConnect(int.key)}
              >
                {int.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {syncMsg && (
        <div style={{ padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-secondary)' }}>
          {syncMsg}
        </div>
      )}
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
