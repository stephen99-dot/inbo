import { useState } from 'react';
import Layout from '../components/Layout';

function Toggle({ defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked ?? true);
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={() => setChecked(c => !c)} />
      <span className="toggle-track" />
    </label>
  );
}

function Stepper({ defaultVal, min = 1, max = 90, suffix = 'days' }) {
  const [val, setVal] = useState(defaultVal);
  return (
    <div className="stepper">
      <button className="stepper-btn" onClick={() => setVal(v => Math.max(min, v - 1))}>−</button>
      <div className="stepper-val">{val} {suffix}</div>
      <button className="stepper-btn" onClick={() => setVal(v => Math.min(max, v + 1))}>+</button>
    </div>
  );
}

export default function DraftsSettingsPage() {
  const [tab, setTab] = useState('general');

  const topbarRight = (
    <button className="topbar-btn ghost">Update preferences</button>
  );

  return (
    <Layout title="Drafts" topbarRight={topbarRight}>
      <div className="tabs">
        <button className={`tab-btn ${tab === 'general' ? 'active' : ''}`} onClick={() => setTab('general')}>General</button>
        <button className={`tab-btn ${tab === 'signatures' ? 'active' : ''}`} onClick={() => setTab('signatures')}>Signatures</button>
        <button className={`tab-btn ${tab === 'custom' ? 'active' : ''}`} onClick={() => setTab('custom')}>Custom Files</button>
      </div>

      {tab === 'general' && (
        <>
          <div className="settings-section">
            <div className="settings-section-header">Draft Settings</div>
            <div className="settings-row">
              <div className="sr-info">
                <div className="sr-label">Enable draft replies</div>
                <div className="sr-desc">Automatically generate draft replies for incoming emails</div>
              </div>
              <Toggle defaultChecked />
            </div>
            <div className="settings-row">
              <div className="sr-info">
                <div className="sr-label" style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>Unused drafts are deleted after</div>
              </div>
              <Stepper defaultVal={14} />
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-header">Response Style</div>
            <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
              <div className="sr-info">
                <div className="sr-label" style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>How often do you like to reply?</div>
              </div>
              <select className="sel">
                <option>I reply to almost everything, even just to be polite</option>
                <option>I only reply when necessary</option>
                <option>I reply to urgent and important emails only</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-header">Follow-ups</div>
            <div className="settings-row">
              <div className="sr-info">
                <div className="sr-label">Enable follow-up drafts</div>
                <div className="sr-desc">Automatically draft follow-up emails when you haven't received a response</div>
              </div>
              <Toggle defaultChecked />
            </div>
            <div className="settings-row">
              <div className="sr-info">
                <div className="sr-label" style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>Days before following up</div>
              </div>
              <Stepper defaultVal={3} />
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-header">Custom Tone</div>
            <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
              <div className="sr-desc">Add custom instructions to guide how Inbo writes replies in your voice</div>
              <textarea
                className="sel"
                rows={4}
                style={{ minWidth: '100%', resize: 'vertical' }}
                placeholder="e.g. Always end emails with 'Kind regards' and use a professional but friendly tone..."
              />
            </div>
          </div>
        </>
      )}

      {tab === 'signatures' && (
        <div className="settings-section">
          <div className="settings-section-header">Email Signatures</div>
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
            <div className="sr-desc">Add a signature that Inbo will append to AI-drafted replies</div>
            <textarea
              className="sel"
              rows={6}
              style={{ minWidth: '100%', resize: 'vertical' }}
              placeholder="Kind regards,&#10;[Your name]&#10;[Your company]"
            />
            <button className="btn btn-primary btn-sm">Save signature</button>
          </div>
        </div>
      )}

      {tab === 'custom' && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          Upload custom files for Inbo to reference when drafting replies — coming soon
        </div>
      )}
    </Layout>
  );
}
