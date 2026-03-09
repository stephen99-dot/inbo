import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Icon } from '../components/Layout';
import { useNavigate } from 'react-router-dom';

const testimonials = [
  { quote: "Inbo cut my email time in half. I used to spend two hours a day just triaging — now I'm in and out in twenty minutes.", name: 'Tom Crawford', role: 'Director, Crawford Contracting' },
  { quote: "The draft replies are scarily good. It writes exactly how I'd write, just faster. I approve maybe 80% without changing a word.", name: 'Laura Hughes', role: 'Project Manager, Heritage PM' },
  { quote: "As a QS juggling four live projects, the urgent flagging alone is worth it. Nothing slips through any more.", name: 'Dan Kowalski', role: 'Senior Quantity Surveyor' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeT, setActiveT] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
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
            <div className="auth-testimonial-quote">&ldquo;{testimonials[activeT].quote}&rdquo;</div>
            <div className="auth-testimonial-author">
              <div className="auth-testimonial-avatar">{testimonials[activeT].name.split(' ').map(n => n[0]).join('')}</div>
              <div>
                <div className="auth-testimonial-name">{testimonials[activeT].name}</div>
                <div className="auth-testimonial-role">{testimonials[activeT].role}</div>
              </div>
            </div>
            <div className="auth-testimonial-dots">
              {testimonials.map((_, i) => (
                <button key={i} className={`auth-t-dot${i === activeT ? ' active' : ''}`} onClick={() => setActiveT(i)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-panel-right">
        <button className="icon-btn auth-theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? Icon.sun : Icon.moon}
        </button>
        <div className="auth-form-wrap">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to your Inbo account</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required autoFocus />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn-auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account? <a onClick={() => navigate('/register')}>Create one</a>
          </div>
        </div>
      </div>
    </div>
  );
}
