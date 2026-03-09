import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const perks = [
  { icon: '⚡', text: 'Auto-categorise every email on arrival' },
  { icon: '✍️', text: 'AI drafts replies in your voice' },
  { icon: '📬', text: 'Approve and send without leaving Inbo' },
  { icon: '🏷️', text: 'Gmail labels applied automatically' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', company: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await register(form.email, form.password, form.fullName, form.company, form.phone);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      {/* LEFT PANEL */}
      <div className="auth-panel-left">
        <div className="auth-panel-left-inner">
          <div className="auth-split-logo">in<em>bo</em></div>
          <div className="auth-split-tagline">Your inbox, handled.</div>
          <div className="auth-testimonial-card">
            <div className="auth-perks-title">What you get</div>
            <div className="auth-perks-list">
              {perks.map((p, i) => (
                <div key={i} className="auth-perk-row">
                  <span className="auth-perk-icon">{p.icon}</span>
                  <span className="auth-perk-text">{p.text}</span>
                </div>
              ))}
            </div>
            <div className="auth-perks-note">Free 14-day trial &mdash; no credit card required</div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-panel-right">
        <div className="auth-form-wrap">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Get started with Inbo — free for 14 days</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Full name</label>
                <input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Stephen Gormley" required autoFocus />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Company name" />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" required />
            </div>
            <div className="form-group">
              <label>Phone <span style={{color:'var(--text-muted)',fontWeight:400}}>(optional)</span></label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+44 7700 000000" />
            </div>
            <button type="submit" className="btn-auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create free account'}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account? <a onClick={() => navigate('/login')}>Sign in</a>
          </div>
          <p className="auth-legal">By creating an account you agree to our <a href="https://getinbo.io/terms.html" target="_blank" rel="noopener">Terms</a> and <a href="https://getinbo.io/privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</p>
        </div>
      </div>
    </div>
  );
}
