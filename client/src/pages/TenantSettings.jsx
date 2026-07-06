import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000/api';

export default function TenantSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(null);
  const [activeTab, setActiveTab] = useState('branding');

  const token = localStorage.getItem('smartship_token');
  const tenantSlug = localStorage.getItem('dev_tenant_slug') || 'default';

  const [form, setForm] = useState({
    companyName: '',
    primaryColor: '#6366f1',
    logoUrl: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    razorpayKeyId: '',
    razorpayKeySecret: '',
  });

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const res = await fetch(`${API}/tenant/usage`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': tenantSlug,
        },
      });
      const data = await res.json();
      if (data.success) setUsage(data.usage);
    } catch { /* silent */ }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/tenant/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': tenantSlug,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settings saved successfully!');
        // Apply branding immediately
        if (form.primaryColor) {
          document.documentElement.style.setProperty('--primary', form.primaryColor);
        }
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  const PLAN_COLORS = { trial: '#f59e0b', basic: '#3b82f6', pro: '#8b5cf6', enterprise: '#10b981' };

  const usedPercent = (used, max) => max > 900000 ? 0 : Math.min((used / max) * 100, 100);

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.avatar}>⚙️</div>
          <div>
            <div style={styles.sidebarTitle}>Settings</div>
            <div style={styles.sidebarSub}>Tenant Configuration</div>
          </div>
        </div>

        {[
          { id: 'branding', icon: '🎨', label: 'Branding' },
          { id: 'email', icon: '📧', label: 'Email (SMTP)' },
          { id: 'payment', icon: '💳', label: 'Payment Keys' },
          { id: 'usage', icon: '📊', label: 'Usage & Plan' },
        ].map(tab => (
          <button
            key={tab.id}
            style={{ ...styles.navBtn, ...(activeTab === tab.id ? styles.navBtnActive : {}) }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <button style={styles.backBtn} onClick={() => navigate('/admin')}>← Back to Dashboard</button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <div style={styles.contentCard}>

          {/* ── BRANDING ── */}
          {activeTab === 'branding' && (
            <>
              <h2 style={styles.tabTitle}>🎨 Branding Settings</h2>
              <p style={styles.tabSub}>Customize your portal's look and feel</p>

              <div style={styles.field}>
                <label style={styles.label}>Company Name</label>
                <input style={styles.input} name="companyName" placeholder="Your Company Name" value={form.companyName} onChange={handleChange} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Logo URL</label>
                <input style={styles.input} name="logoUrl" placeholder="https://yoursite.com/logo.png" value={form.logoUrl} onChange={handleChange} />
                {form.logoUrl && (
                  <div style={styles.logoPreview}>
                    <img src={form.logoUrl} alt="Logo preview" style={{ height: '40px', borderRadius: '8px' }} onError={e => e.target.style.display = 'none'} />
                    <span style={{ color: '#64748b', fontSize: '12px' }}>Preview</span>
                  </div>
                )}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Brand Color</label>
                <div style={styles.colorRow}>
                  <input
                    type="color"
                    name="primaryColor"
                    value={form.primaryColor}
                    onChange={handleChange}
                    style={styles.colorPicker}
                  />
                  <input
                    style={{ ...styles.input, flex: 1 }}
                    name="primaryColor"
                    value={form.primaryColor}
                    onChange={handleChange}
                    placeholder="#6366f1"
                  />
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  {['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'].map(c => (
                    <button
                      key={c}
                      style={{ width: '28px', height: '28px', borderRadius: '8px', background: c, border: form.primaryColor === c ? '3px solid #fff' : '2px solid transparent', cursor: 'pointer' }}
                      onClick={() => setForm(f => ({ ...f, primaryColor: c }))}
                    />
                  ))}
                </div>
              </div>

              <button style={styles.saveBtn} onClick={handleSave} disabled={loading}>
                {loading ? '⏳ Saving...' : '💾 Save Branding'}
              </button>
            </>
          )}

          {/* ── EMAIL SMTP ── */}
          {activeTab === 'email' && (
            <>
              <h2 style={styles.tabTitle}>📧 Email Settings (SMTP)</h2>
              <p style={styles.tabSub}>Send emails from your own domain (e.g. noreply@yourcompany.com)</p>

              {[
                { name: 'smtpHost', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
                { name: 'smtpPort', label: 'SMTP Port', placeholder: '587' },
                { name: 'smtpUser', label: 'SMTP Username', placeholder: 'yourname@gmail.com' },
                { name: 'smtpPass', label: 'SMTP Password / App Password', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.name} style={styles.field}>
                  <label style={styles.label}>{f.label}</label>
                  <input style={styles.input} name={f.name} type={f.name === 'smtpPass' ? 'password' : 'text'} placeholder={f.placeholder} value={form[f.name]} onChange={handleChange} />
                </div>
              ))}

              <div style={styles.infoBox}>
                💡 <strong>Tip:</strong> For Gmail, use an App Password (not your account password). Enable 2FA first, then generate one from Google Account settings.
              </div>

              <button style={styles.saveBtn} onClick={handleSave} disabled={loading}>
                {loading ? '⏳ Saving...' : '💾 Save Email Settings'}
              </button>
            </>
          )}

          {/* ── PAYMENT KEYS ── */}
          {activeTab === 'payment' && (
            <>
              <h2 style={styles.tabTitle}>💳 Razorpay Configuration</h2>
              <p style={styles.tabSub}>Connect your own Razorpay account to receive payments directly</p>

              <div style={styles.field}>
                <label style={styles.label}>Razorpay Key ID</label>
                <input style={styles.input} name="razorpayKeyId" placeholder="rzp_live_xxxxxxxxxxxxxxxx" value={form.razorpayKeyId} onChange={handleChange} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Razorpay Key Secret</label>
                <input style={styles.input} name="razorpayKeySecret" type="password" placeholder="Your Razorpay secret" value={form.razorpayKeySecret} onChange={handleChange} />
              </div>

              <div style={styles.infoBox}>
                💡 You can find your API keys at <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>Razorpay Dashboard → Settings → API Keys</a>
              </div>

              <button style={styles.saveBtn} onClick={handleSave} disabled={loading}>
                {loading ? '⏳ Saving...' : '💾 Save Payment Settings'}
              </button>
            </>
          )}

          {/* ── USAGE & PLAN ── */}
          {activeTab === 'usage' && (
            <>
              <h2 style={styles.tabTitle}>📊 Usage & Plan</h2>
              <p style={styles.tabSub}>Monitor your resource usage and subscription</p>

              {usage ? (
                <>
                  <div style={{ ...styles.planBadgeCard, borderColor: PLAN_COLORS[usage.plan] || '#6366f1' }}>
                    <div style={styles.planBadgeName}>{usage.plan?.toUpperCase()} PLAN</div>
                    <div style={{ ...styles.planStatusDot, background: usage.planStatus === 'active' ? '#10b981' : '#ef4444' }} />
                    <div style={styles.planStatusText}>{usage.planStatus === 'active' ? 'Active' : usage.planStatus}</div>
                  </div>

                  <div style={styles.usageItem}>
                    <div style={styles.usageHeader}>
                      <span style={styles.usageLabel}>📦 Shipments This Month</span>
                      <span style={styles.usageCount}>{usage.shipmentsThisMonth} / {usage.maxShipments > 900000 ? '∞' : usage.maxShipments}</span>
                    </div>
                    <div style={styles.progressBg}>
                      <div style={{ ...styles.progressBar, width: `${usedPercent(usage.shipmentsThisMonth, usage.maxShipments)}%`, background: '#6366f1' }} />
                    </div>
                  </div>

                  <div style={styles.usageItem}>
                    <div style={styles.usageHeader}>
                      <span style={styles.usageLabel}>👥 Team Members</span>
                      <span style={styles.usageCount}>{usage.users} / {usage.maxUsers > 900000 ? '∞' : usage.maxUsers}</span>
                    </div>
                    <div style={styles.progressBg}>
                      <div style={{ ...styles.progressBar, width: `${usedPercent(usage.users, usage.maxUsers)}%`, background: '#8b5cf6' }} />
                    </div>
                  </div>

                  <div style={styles.upgradeCard}>
                    <div style={styles.upgradeTitle}>🚀 Need more capacity?</div>
                    <p style={styles.upgradeSub}>Upgrade your plan to get more shipments, users, and features.</p>
                    <div style={styles.upgradeGrid}>
                      {[
                        { plan: 'Basic', price: '₹999', limit: '500 shipments, 5 users' },
                        { plan: 'Pro', price: '₹2,999', limit: '2,000 shipments, 20 users' },
                        { plan: 'Enterprise', price: 'Custom', limit: 'Unlimited everything' },
                      ].map(p => (
                        <div key={p.plan} style={styles.upgradePlanCard}>
                          <div style={styles.upgradePlanName}>{p.plan}</div>
                          <div style={styles.upgradePlanPrice}>{p.price}<span style={{ fontSize: '12px', color: '#64748b' }}>/mo</span></div>
                          <div style={styles.upgradePlanLimit}>{p.limit}</div>
                        </div>
                      ))}
                    </div>
                    <a href="mailto:sales@smartship.io" style={styles.contactBtn}>Contact Sales →</a>
                  </div>
                </>
              ) : (
                <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Loading usage data...</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const styles = {
  page: { display: 'flex', minHeight: '100vh', background: '#030712', fontFamily: "'Inter', sans-serif" },
  sidebar: { width: '230px', background: '#0a0f1e', borderRight: '1px solid #1e293b', padding: '24px 12px', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px 24px', borderBottom: '1px solid #1e293b', marginBottom: '16px' },
  avatar: { width: '40px', height: '40px', borderRadius: '10px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  sidebarTitle: { fontSize: '15px', fontWeight: '700', color: '#f1f5f9' },
  sidebarSub: { fontSize: '11px', color: '#475569' },
  navBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', borderRadius: '10px', border: 'none', background: 'transparent', color: '#64748b', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginBottom: '4px', width: '100%', textAlign: 'left', transition: 'all 0.15s' },
  navBtnActive: { background: '#1e293b', color: '#fff' },
  backBtn: { padding: '11px 16px', borderRadius: '10px', border: 'none', background: 'transparent', color: '#475569', fontSize: '13px', cursor: 'pointer', textAlign: 'left' },
  main: { flex: 1, padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' },
  contentCard: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '600px' },
  tabTitle: { fontSize: '22px', fontWeight: '800', color: '#f1f5f9', margin: '0 0 8px', fontFamily: "'Outfit', sans-serif" },
  tabSub: { fontSize: '14px', color: '#64748b', margin: '0 0 28px' },
  field: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.03em' },
  input: { width: '100%', padding: '12px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#f1f5f9', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' },
  colorRow: { display: 'flex', gap: '10px', alignItems: 'center' },
  colorPicker: { width: '48px', height: '46px', border: 'none', borderRadius: '10px', cursor: 'pointer', padding: 0, background: 'none' },
  logoPreview: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' },
  saveBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '8px', fontFamily: "'Inter', sans-serif" },
  infoBox: { background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: '#94a3b8', marginBottom: '24px', lineHeight: '1.6' },
  planBadgeCard: { border: '2px solid #6366f1', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' },
  planBadgeName: { fontSize: '16px', fontWeight: '800', color: '#f1f5f9', flex: 1, fontFamily: "'Outfit', sans-serif" },
  planStatusDot: { width: '10px', height: '10px', borderRadius: '50%' },
  planStatusText: { fontSize: '13px', color: '#64748b', fontWeight: '600' },
  usageItem: { marginBottom: '20px' },
  usageHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  usageLabel: { fontSize: '14px', color: '#94a3b8', fontWeight: '500' },
  usageCount: { fontSize: '14px', color: '#f1f5f9', fontWeight: '700' },
  progressBg: { height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' },
  upgradeCard: { background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px', marginTop: '24px' },
  upgradeTitle: { fontSize: '16px', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' },
  upgradeSub: { fontSize: '13px', color: '#64748b', margin: '0 0 20px' },
  upgradeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' },
  upgradePlanCard: { background: '#1e293b', borderRadius: '10px', padding: '16px', textAlign: 'center' },
  upgradePlanName: { fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' },
  upgradePlanPrice: { fontSize: '22px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px' },
  upgradePlanLimit: { fontSize: '11px', color: '#475569' },
  contactBtn: { display: 'block', textAlign: 'center', padding: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '10px', color: '#fff', textDecoration: 'none', fontWeight: '700', fontSize: '14px' },
};
