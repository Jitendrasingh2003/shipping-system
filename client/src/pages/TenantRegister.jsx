import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000/api';

export default function TenantRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=Company Info, 2=Admin Account, 3=Done
  const [loading, setLoading] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [slugChecking, setSlugChecking] = useState(false);

  const [form, setForm] = useState({
    companyName: '',
    slug: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerPhone: '',
  });

  // Auto-generate slug from company name
  useEffect(() => {
    if (form.companyName && step === 1) {
      const autoSlug = form.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);
      setForm(f => ({ ...f, slug: autoSlug }));
    }
  }, [form.companyName]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!form.slug || form.slug.length < 3) { setSlugAvailable(null); return; }
    const timer = setTimeout(async () => {
      setSlugChecking(true);
      try {
        const res = await fetch(`${API}/tenant/check-slug/${form.slug}`);
        const data = await res.json();
        setSlugAvailable(data.available);
      } catch { setSlugAvailable(null); }
      finally { setSlugChecking(false); }
    }, 600);
    return () => clearTimeout(timer);
  }, [form.slug]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.companyName || !form.slug || !form.ownerName || !form.ownerEmail || !form.ownerPassword) {
      toast.error('Please fill all required fields.');
      return;
    }
    if (!slugAvailable) { toast.error('Please choose an available subdomain.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/tenant/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.message); return; }

      localStorage.setItem('smartship_token', data.token);
      localStorage.setItem('smartship_user', JSON.stringify(data.user));
      localStorage.setItem('dev_tenant_slug', form.slug);
      setStep(3);
    } catch {
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Success Screen ──────────────────────────────────────────
  if (step === 3) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.successIcon}>🎉</div>
          <h1 style={styles.successTitle}>Welcome aboard!</h1>
          <p style={styles.successSub}>Your company portal is ready</p>
          <div style={styles.portalUrl}>
            <span style={styles.portalLabel}>Your Portal URL</span>
            <code style={styles.portalCode}>{form.slug}.smartship.io</code>
          </div>
          <div style={styles.trialBadge}>✨ 14-day free trial activated</div>
          <button style={styles.btn} onClick={() => navigate('/admin')}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  // ── Main Registration Form ──────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Background */}
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />

      {/* Header */}
      <div style={styles.header}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>📦</span>
          <span style={styles.logoText}>SmartShip</span>
        </Link>
      </div>

      <div style={styles.container}>
        {/* Progress Steps */}
        <div style={styles.steps}>
          {['Company Info', 'Admin Account', 'Done!'].map((label, i) => (
            <div key={i} style={styles.stepItem}>
              <div style={{
                ...styles.stepDot,
                background: step > i + 1 ? '#10b981' : step === i + 1 ? '#6366f1' : '#374151',
                boxShadow: step === i + 1 ? '0 0 16px #6366f188' : 'none',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ ...styles.stepLabel, color: step === i + 1 ? '#fff' : '#6b7280' }}>{label}</span>
              {i < 2 && <div style={{ ...styles.stepLine, background: step > i + 1 ? '#10b981' : '#1f2937' }} />}
            </div>
          ))}
        </div>

        <div style={styles.card}>
          {step === 1 && (
            <>
              <h2 style={styles.cardTitle}>Set up your company</h2>
              <p style={styles.cardSub}>Create your dedicated shipping portal</p>

              <div style={styles.field}>
                <label style={styles.label}>Company Name *</label>
                <input
                  style={styles.input}
                  name="companyName"
                  placeholder="e.g. DTDC Courier Services"
                  value={form.companyName}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Your Subdomain *</label>
                <div style={styles.slugRow}>
                  <input
                    style={{ ...styles.input, flex: 1, borderRight: 'none', borderRadius: '10px 0 0 10px' }}
                    name="slug"
                    placeholder="yourcompany"
                    value={form.slug}
                    onChange={handleChange}
                  />
                  <div style={styles.slugSuffix}>.smartship.io</div>
                </div>
                <div style={styles.slugStatus}>
                  {slugChecking && <span style={{ color: '#6b7280' }}>⏳ Checking...</span>}
                  {!slugChecking && slugAvailable === true && <span style={{ color: '#10b981' }}>✅ Available!</span>}
                  {!slugChecking && slugAvailable === false && <span style={{ color: '#ef4444' }}>❌ Already taken. Try another.</span>}
                </div>
              </div>

              <button
                style={{ ...styles.btn, opacity: slugAvailable ? 1 : 0.5 }}
                onClick={() => slugAvailable && setStep(2)}
                disabled={!slugAvailable}
              >
                Continue →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={styles.cardTitle}>Create admin account</h2>
              <p style={styles.cardSub}>You'll use this to manage your portal</p>

              {[
                { name: 'ownerName', label: 'Full Name *', placeholder: 'Rahul Sharma', type: 'text' },
                { name: 'ownerEmail', label: 'Email Address *', placeholder: 'rahul@dtdc.com', type: 'email' },
                { name: 'ownerPhone', label: 'Phone Number', placeholder: '+91 9876543210', type: 'tel' },
                { name: 'ownerPassword', label: 'Password *', placeholder: 'Min 8 characters', type: 'password' },
              ].map(f => (
                <div key={f.name} style={styles.field}>
                  <label style={styles.label}>{f.label}</label>
                  <input
                    style={styles.input}
                    name={f.name}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={handleChange}
                  />
                </div>
              ))}

              <div style={styles.btnRow}>
                <button style={styles.btnOutline} onClick={() => setStep(1)}>← Back</button>
                <button style={{ ...styles.btn, flex: 1 }} onClick={handleSubmit} disabled={loading}>
                  {loading ? '⏳ Creating...' : '🚀 Launch My Portal'}
                </button>
              </div>
            </>
          )}

          <p style={styles.loginHint}>
            Already have an account? <Link to="/" style={{ color: '#6366f1' }}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const styles = {
  page: { minHeight: '100vh', background: '#030712', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden', fontFamily: "'Inter', sans-serif" },
  bgOrb1: { position: 'fixed', top: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, #6366f133, transparent 70%)', pointerEvents: 'none' },
  bgOrb2: { position: 'fixed', bottom: '-200px', left: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, #8b5cf633, transparent 70%)', pointerEvents: 'none' },
  header: { width: '100%', padding: '24px 40px', display: 'flex', alignItems: 'center' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' },
  logoIcon: { fontSize: '28px' },
  logoText: { fontSize: '22px', fontWeight: '700', color: '#fff', fontFamily: "'Outfit', sans-serif" },
  container: { width: '100%', maxWidth: '540px', padding: '0 20px 60px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  steps: { display: 'flex', alignItems: 'center', marginBottom: '32px', gap: 0 },
  stepItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  stepDot: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0, transition: 'all 0.3s' },
  stepLabel: { fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap' },
  stepLine: { width: '40px', height: '2px', margin: '0 8px', transition: 'all 0.3s' },
  card: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '20px', padding: '40px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  cardTitle: { fontSize: '24px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 8px', fontFamily: "'Outfit', sans-serif" },
  cardSub: { fontSize: '14px', color: '#64748b', margin: '0 0 28px' },
  field: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.03em' },
  input: { width: '100%', padding: '12px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#f1f5f9', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: "'Inter', sans-serif" },
  slugRow: { display: 'flex', alignItems: 'stretch' },
  slugSuffix: { padding: '12px 16px', background: '#1e293b', border: '1px solid #334155', borderLeft: 'none', borderRadius: '0 10px 10px 0', color: '#6366f1', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' },
  slugStatus: { marginTop: '8px', fontSize: '13px', minHeight: '20px' },
  btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '8px', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif" },
  btnOutline: { padding: '14px 20px', background: 'transparent', border: '1px solid #334155', borderRadius: '12px', color: '#94a3b8', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
  btnRow: { display: 'flex', gap: '12px', marginTop: '8px' },
  loginHint: { textAlign: 'center', fontSize: '13px', color: '#475569', marginTop: '24px' },
  // Success styles
  successIcon: { fontSize: '64px', textAlign: 'center', marginBottom: '16px' },
  successTitle: { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', textAlign: 'center', margin: '0 0 8px', fontFamily: "'Outfit', sans-serif" },
  successSub: { fontSize: '15px', color: '#64748b', textAlign: 'center', margin: '0 0 28px' },
  portalUrl: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '20px' },
  portalLabel: { display: 'block', fontSize: '12px', color: '#475569', marginBottom: '8px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' },
  portalCode: { fontSize: '18px', color: '#6366f1', fontWeight: '700', fontFamily: 'monospace' },
  trialBadge: { background: 'linear-gradient(135deg, #059669, #10b981)', borderRadius: '8px', padding: '10px 16px', textAlign: 'center', color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '20px' },
};
