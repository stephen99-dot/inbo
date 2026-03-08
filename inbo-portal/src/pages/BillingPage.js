import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  { key: 'starter', name: 'Starter', price: 12, features: ['1 email account','200 emails/day','AI summaries & categorisation','Basic draft replies','Email support'] },
  { key: 'professional', name: 'Professional', price: 22, popular: true, features: ['2 email accounts','Unlimited emails','AI drafts in your tone','Tone learning','Priority support'] },
  { key: 'team', name: 'Team', price: 16, perUser: true, features: ['Everything in Professional','Up to 10 users','Shared tone profiles','Team inbox management','Admin dashboard'] },
];

export default function BillingPage() {
  const { user } = useAuth();
  const current = user?.plan || 'starter';

  return (
    <Layout title="Billing" topbarRight={<button className="topbar-btn ghost">Update preferences</button>}>
      <div className="tabs"><button className="tab-btn active">General</button></div>

      <div className="plan-grid">
        {PLANS.map(p => (
          <div key={p.key} className={`plan-card ${current === p.key ? 'current' : ''}`}>
            {p.popular && <div className="plan-badge-label">Most popular</div>}
            {current === p.key && !p.popular && <div className="plan-badge-label" style={{ background: 'var(--green)' }}>Current plan</div>}
            <div className="plan-name">{p.name}</div>
            <div className="plan-price">£{p.price}<span>/mo{p.perUser ? ' per user' : ''}</span></div>
            <div className="plan-features">
              {p.features.map(f => <div key={f} className="plan-feature">{f}</div>)}
            </div>
            <button
              className={`btn btn-sm ${current === p.key ? 'btn-ghost' : 'btn-primary'}`}
              disabled={current === p.key}
              style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
            >
              {current === p.key ? 'Current plan' : `Switch to ${p.name}`}
            </button>
          </div>
        ))}
      </div>

      <div className="settings-section">
        <div className="settings-section-header">Billing Details</div>
        <div style={{ padding: '16px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 18 }}>
            {[
              { label: 'Current plan', value: current, amber: true },
              { label: 'Next billing', value: 'N/A' },
              { label: 'Payment', value: 'Not set up' },
            ].map(i => (
              <div key={i.label}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 5 }}>{i.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: i.amber ? 'var(--amber)' : 'var(--text)', textTransform: 'capitalize' }}>{i.value}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 14px', background: 'var(--amber-softer)', border: '1px solid rgba(240,112,48,0.2)', borderRadius: 7, fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--amber)' }}>Stripe integration coming soon.</strong> To upgrade, contact <a href="mailto:hello@crmwizardai.com" style={{ color: 'var(--amber)' }}>hello@crmwizardai.com</a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
