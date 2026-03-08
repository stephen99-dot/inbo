import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
    <div className="auth-wrap">
      <div className="auth-glow" />
      <div className="auth-card">
        <div className="auth-logo">in<em>bo</em></div>
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
              <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="CRM Wizard AI" />
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
            <label>Phone (optional)</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+44 7700 000000" />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <a onClick={() => navigate('/login')}>Sign in</a>
        </div>
      </div>
    </div>
  );
}
