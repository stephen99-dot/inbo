import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';

const steps = [
  { key: 'connect', label: 'Connect inbox' },
  { key: 'processing', label: 'Processing' },
  { key: 'done', label: 'Ready' },
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState('connect');
  const [error, setError] = useState('');

  // Check if they came back from Gmail OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    if (hash.includes('success=gmail') || params.get('success') === 'gmail') {
      setStep('processing');
      // Trigger full sync + draft replies in background
      Promise.all([
        api.post('/gmail/sync', { full: true }),
        api.post('/gmail/draft-all', {})
      ]).finally(() => {
        setTimeout(() => setStep('done'), 2000);
      });
    }
    if (hash.includes('error=gmail_denied')) {
      setError('Gmail connection was cancelled. Please try again.');
    }
  }, []);

  const connectGmail = async () => {
    try {
      const { url } = await api.get('/auth/gmail');
      window.location.href = url;
    } catch {
      setError('Failed to start Gmail connection. Please try again.');
    }
  };

  const skip = () => navigate('/dashboard');
  const finish = () => navigate('/inbox');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative'
    }}>
      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          position: 'absolute', top: 20, right: 20,
          background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: 'var(--text-secondary)'
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Logo */}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 48, letterSpacing: -1 }}>
        in<span style={{ color: 'var(--amber)' }}>bo</span>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 48 }}>
        {steps.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              background: step === s.key ? 'var(--amber)' : steps.indexOf(steps.find(x => x.key === step)) > i ? 'var(--green)' : 'var(--bg-card)',
              color: step === s.key || steps.indexOf(steps.find(x => x.key === step)) > i ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${step === s.key ? 'var(--amber)' : 'var(--border)'}`,
              transition: 'all 0.3s'
            }}>
              {steps.indexOf(steps.find(x => x.key === step)) > i ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 13, color: step === s.key ? 'var(--text)' : 'var(--text-muted)', fontWeight: step === s.key ? 600 : 400 }}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div style={{ width: 32, height: 1, background: 'var(--border)', marginLeft: 4 }} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 460,
        textAlign: 'center'
      }}>

        {step === 'connect' && (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: 'var(--amber-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: 28
            }}>✉️</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 10, fontFamily: 'var(--font-display)' }}>
              Connect your inbox
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32, maxWidth: 340, margin: '0 auto 32px' }}>
              Inbo works directly inside Gmail. Connect your inbox and we'll start sorting, categorising and drafting replies automatically.
            </div>

            {error && (
              <div style={{ background: 'var(--red-soft)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#EF4444', padding: '10px 14px', fontSize: 13, marginBottom: 20 }}>
                {error}
              </div>
            )}

            <button
              onClick={connectGmail}
              style={{
                width: '100%', padding: '14px', borderRadius: 10,
                background: 'var(--amber)', color: '#fff', border: 'none',
                fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                marginBottom: 12, transition: 'background 0.15s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--amber-hover)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--amber)'}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
              </svg>
              Connect Gmail
            </button>

            <button
              onClick={skip}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', padding: '8px' }}
            >
              Skip for now — I'll connect later
            </button>
          </>
        )}

        {step === 'processing' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto', borderWidth: 3 }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 10, fontFamily: 'var(--font-display)' }}>
              Setting up your inbox
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              We're syncing your emails, categorising them and drafting replies to anything that needs one. This'll just take a moment.
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'var(--green-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: 28
            }}>✓</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 10, fontFamily: 'var(--font-display)' }}>
              You're all set!
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
              Your inbox is connected. Inbo is already working in the background — sorting emails and drafting replies as they arrive.
            </div>
            <button
              onClick={finish}
              style={{
                width: '100%', padding: '14px', borderRadius: 10,
                background: 'var(--amber)', color: '#fff', border: 'none',
                fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)'
              }}
            >
              Go to my inbox →
            </button>
          </>
        )}
      </div>

      {/* Hi message */}
      {step === 'connect' && (
        <div style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          Welcome, {user?.full_name?.split(' ')[0]} 👋
        </div>
      )}
    </div>
  );
}
