import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const FEATURES = [
  { icon: '🏢', title: 'Multi-Company Ready', desc: 'Har company ko apna isolated dashboard, data, aur branding milti hai.' },
  { icon: '🎨', title: 'White-Label Branding', desc: 'Apna logo, colors, aur domain use karo. Customers tumhari hi brand dekhenge.' },
  { icon: '📦', title: 'End-to-End Shipment Tracking', desc: 'Real-time status updates, OTP delivery, aur customer notifications.' },
  { icon: '💳', title: 'Integrated Payments', desc: 'Razorpay se direct payments. Invoices auto-generate hoti hain.' },
  { icon: '🚛', title: 'Fleet & Warehouse Mgmt', desc: 'Apna fleet track karo, warehouses manage karo, staff assign karo.' },
  { icon: '📊', title: 'Analytics Dashboard', desc: 'Revenue, shipments, aur customer insights ek jagah par.' },
  { icon: '💬', title: 'Live Chat & Tickets', desc: 'Customers se real-time chat. Support tickets aur AI chatbot included.' },
  { icon: '🔒', title: 'Enterprise Security', desc: 'JWT auth, rate limiting, data isolation. Har tenant ka data safe.' },
];

const PLANS = [
  {
    name: 'Trial',
    price: 'FREE',
    period: '14 days',
    color: '#f59e0b',
    features: ['2 Users', '50 Shipments/month', 'Basic Dashboard', 'Email Support'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Basic',
    price: '₹999',
    period: '/month',
    color: '#6366f1',
    features: ['5 Users', '500 Shipments/month', 'All Dashboards', 'Analytics', 'Priority Support'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '₹2,999',
    period: '/month',
    color: '#8b5cf6',
    features: ['20 Users', '2,000 Shipments/month', 'White-Label', 'Custom Domain', 'API Access', 'Dedicated Support'],
    cta: 'Go Pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    color: '#10b981',
    features: ['Unlimited Users', 'Unlimited Shipments', 'SLA Guarantee', 'Custom Integrations', '24/7 Support'],
    cta: 'Contact Sales',
    popular: false,
  },
];

const STATS = [
  { value: '500+', label: 'Companies Trust Us' },
  { value: '2M+', label: 'Shipments Processed' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '4.9★', label: 'Customer Rating' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={s.page}>
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav style={{ ...s.nav, ...(scrolled ? s.navScrolled : {}) }}>
        <div style={s.navInner}>
          <div style={s.logo}>
            <span style={{ fontSize: '28px' }}>📦</span>
            <span style={s.logoText}>SmartShip</span>
          </div>
          <div style={s.navLinks}>
            <a href="#features" style={s.navLink}>Features</a>
            <a href="#pricing" style={s.navLink}>Pricing</a>
            <a href="#contact" style={s.navLink}>Contact</a>
          </div>
          <div style={s.navActions}>
            <Link to="/" style={s.navLoginBtn}>Login</Link>
            <Link to="/register-company" style={s.navCta}>Start Free Trial →</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section style={s.hero}>
        <div style={s.heroBg1} />
        <div style={s.heroBg2} />
        <div style={s.heroBg3} />

        <div style={s.heroContent}>
          <div style={s.heroTagline}>
            <span style={s.taglineDot} />
            India's #1 Shipping SaaS Platform
          </div>

          <h1 style={s.heroTitle}>
            Apni Logistics Company ka
            <br />
            <span style={s.heroGradient}>Ready-Made Software</span>
          </h1>

          <p style={s.heroSub}>
            SmartShip SaaS par apni courier company register karo aur 14 din mein hi
            <br />
            apna fully-featured shipping management portal start karo — bina ek line code likhe.
          </p>

          <div style={s.heroBtns}>
            <Link to="/register-company" style={s.heroCta}>
              🚀 Start Free Trial — 14 Days Free
            </Link>
            <Link to="/superadmin" style={s.heroSecondary}>
              View Super Admin Demo →
            </Link>
          </div>

          {/* Stats Bar */}
          <div style={s.statsBar}>
            {STATS.map((stat, i) => (
              <div key={i} style={s.statItem}>
                <div style={s.statValue}>{stat.value}</div>
                <div style={s.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Dashboard Preview */}
        <div style={s.heroPreview}>
          <div style={s.previewCard}>
            <div style={s.previewHeader}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ ...s.previewDot, background: '#ef4444' }} />
                <div style={{ ...s.previewDot, background: '#f59e0b' }} />
                <div style={{ ...s.previewDot, background: '#10b981' }} />
              </div>
              <div style={s.previewTitle}>SmartShip Dashboard</div>
            </div>
            <div style={s.previewBody}>
              {[
                { label: 'Total Shipments', val: '2,847', color: '#6366f1', icon: '📦' },
                { label: 'Delivered Today', val: '143', color: '#10b981', icon: '✅' },
                { label: 'Revenue MTD', val: '₹4.2L', color: '#f59e0b', icon: '💰' },
                { label: 'Active Fleet', val: '28', color: '#8b5cf6', icon: '🚛' },
              ].map((item, i) => (
                <div key={i} style={s.previewStat}>
                  <div style={{ fontSize: '20px' }}>{item.icon}</div>
                  <div style={{ ...s.previewStatVal, color: item.color }}>{item.val}</div>
                  <div style={s.previewStatLabel}>{item.label}</div>
                </div>
              ))}
            </div>
            <div style={s.previewList}>
              {['Mumbai → Delhi', 'Pune → Bengaluru', 'Chennai → Hyderabad'].map((route, i) => (
                <div key={i} style={s.previewListItem}>
                  <div style={s.previewListIcon}>📍</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: '600' }}>{route}</div>
                    <div style={{ color: '#475569', fontSize: '11px' }}>In Transit</div>
                  </div>
                  <div style={s.inTransitBadge}>● In Transit</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionTag}>Features</div>
          <h2 style={s.sectionTitle}>Sab kuch ek platform par</h2>
          <p style={s.sectionSub}>Jo bhi ek professional logistics company ko chahiye — sab SmartShip mein built-in hai</p>

          <div style={s.featuresGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} style={s.featureCard}>
                <div style={s.featureIcon}>{f.icon}</div>
                <h3 style={s.featureTitle}>{f.title}</h3>
                <p style={s.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────── */}
      <section style={{ ...s.section, background: '#0a0f1e' }}>
        <div style={s.sectionInner}>
          <div style={s.sectionTag}>Process</div>
          <h2 style={s.sectionTitle}>3 Steps mein Ready</h2>
          <p style={s.sectionSub}>Setup mein sirf 5 minute lagte hain</p>

          <div style={s.stepsRow}>
            {[
              { step: '01', title: 'Register karo', desc: 'Company name aur subdomain choose karo. Email verify karo.', icon: '📝' },
              { step: '02', title: 'Customize karo', desc: 'Apna logo, colors lagao. Staff add karo. Razorpay connect karo.', icon: '🎨' },
              { step: '03', title: 'Launch karo', desc: 'Customers ko invite karo. Shipments start hone lagte hain!', icon: '🚀' },
            ].map((item, i) => (
              <div key={i} style={s.stepCard}>
                <div style={s.stepNum}>{item.step}</div>
                <div style={s.stepIcon}>{item.icon}</div>
                <h3 style={s.stepTitle}>{item.title}</h3>
                <p style={s.stepDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────── */}
      <section id="pricing" style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionTag}>Pricing</div>
          <h2 style={s.sectionTitle}>Simple, Transparent Pricing</h2>
          <p style={s.sectionSub}>Pehle 14 din bilkul free — koi credit card nahi chahiye</p>

          <div style={s.plansGrid}>
            {PLANS.map((plan, i) => (
              <div key={i} style={{ ...s.planCard, ...(plan.popular ? s.planCardPopular : {}), borderColor: plan.popular ? plan.color : '#1e293b' }}>
                {plan.popular && <div style={s.popularBadge}>⭐ Most Popular</div>}
                <div style={{ ...s.planName, color: plan.color }}>{plan.name}</div>
                <div style={s.planPrice}>
                  {plan.price}
                  <span style={s.planPeriod}>{plan.period}</span>
                </div>
                <div style={s.planFeatures}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={s.planFeatureItem}>
                      <span style={{ color: '#10b981' }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <Link
                  to={plan.name === 'Enterprise' ? '#contact' : '/register-company'}
                  style={{ ...s.planCta, background: plan.popular ? `linear-gradient(135deg, ${plan.color}, #6366f1)` : 'transparent', border: `1px solid ${plan.color}`, color: plan.popular ? '#fff' : plan.color }}
                >
                  {plan.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────── */}
      <section style={s.ctaBanner}>
        <div style={s.ctaOrb1} />
        <div style={s.ctaOrb2} />
        <h2 style={s.ctaTitle}>Aaj hi apna portal launch karo</h2>
        <p style={s.ctaSub}>14 din free. Koi credit card nahi. Setup mein 5 minute.</p>
        <Link to="/register-company" style={s.ctaBtn}>
          🚀 Start Free Trial →
        </Link>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer id="contact" style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerLogo}>
            <span style={{ fontSize: '24px' }}>📦</span>
            <span style={{ ...s.logoText, fontSize: '20px' }}>SmartShip</span>
          </div>
          <p style={s.footerDesc}>India's leading shipping management SaaS. Built for logistics companies of all sizes.</p>
          <div style={s.footerLinks}>
            <a href="mailto:support@smartship.io" style={s.footerLink}>support@smartship.io</a>
            <Link to="/superadmin" style={s.footerLink}>Admin Panel</Link>
            <Link to="/register-company" style={s.footerLink}>Register Company</Link>
          </div>
          <p style={s.footerCopy}>© 2026 SmartShip. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const s = {
  page: { background: '#030712', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#f1f5f9', overflowX: 'hidden' },

  // Navbar
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '20px 0', transition: 'all 0.3s' },
  navScrolled: { background: 'rgba(3,7,18,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1e293b', padding: '14px 0' },
  navInner: { maxWidth: '1200px', margin: '0 auto', padding: '0 40px', display: 'flex', alignItems: 'center', gap: '32px' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoText: { fontSize: '22px', fontWeight: '800', color: '#fff', fontFamily: "'Outfit', sans-serif" },
  navLinks: { display: 'flex', gap: '32px', flex: 1 },
  navLink: { color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' },
  navActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  navLoginBtn: { color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: '500', padding: '8px 16px' },
  navCta: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', transition: 'opacity 0.2s' },

  // Hero
  hero: { minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 40px 80px', maxWidth: '1200px', margin: '0 auto', position: 'relative', gap: '60px' },
  heroBg1: { position: 'fixed', top: '-300px', left: '-300px', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, #6366f120, transparent 70%)', pointerEvents: 'none' },
  heroBg2: { position: 'fixed', bottom: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, #8b5cf620, transparent 70%)', pointerEvents: 'none' },
  heroBg3: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, #06b6d408, transparent 70%)', pointerEvents: 'none' },
  heroContent: { flex: 1, maxWidth: '600px' },
  heroTagline: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#6366f120', border: '1px solid #6366f140', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', color: '#a5b4fc', fontWeight: '600', marginBottom: '24px' },
  taglineDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', animation: 'pulse 2s infinite' },
  heroTitle: { fontSize: '56px', fontWeight: '900', lineHeight: '1.1', color: '#f1f5f9', margin: '0 0 20px', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' },
  heroGradient: { background: 'linear-gradient(135deg, #6366f1, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroSub: { fontSize: '17px', color: '#64748b', lineHeight: '1.7', margin: '0 0 36px' },
  heroBtns: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' },
  heroCta: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', textDecoration: 'none', padding: '16px 28px', borderRadius: '14px', fontSize: '15px', fontWeight: '700', boxShadow: '0 0 40px #6366f140', transition: 'all 0.2s' },
  heroSecondary: { background: 'transparent', color: '#94a3b8', textDecoration: 'none', padding: '16px 24px', borderRadius: '14px', fontSize: '15px', fontWeight: '600', border: '1px solid #1e293b', transition: 'all 0.2s' },

  // Stats bar
  statsBar: { display: 'flex', gap: '32px', padding: '24px 28px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' },
  statItem: { textAlign: 'center' },
  statValue: { fontSize: '24px', fontWeight: '800', color: '#f1f5f9', fontFamily: "'Outfit', sans-serif" },
  statLabel: { fontSize: '12px', color: '#475569', fontWeight: '500', marginTop: '2px' },

  // Hero Preview Card
  heroPreview: { flex: '0 0 420px' },
  previewCard: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' },
  previewHeader: { padding: '16px 20px', background: '#0a0f1e', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px' },
  previewDot: { width: '10px', height: '10px', borderRadius: '50%' },
  previewTitle: { fontSize: '13px', color: '#475569', fontWeight: '600', flex: 1, textAlign: 'center' },
  previewBody: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#1e293b' },
  previewStat: { background: '#0f172a', padding: '20px', textAlign: 'center' },
  previewStatVal: { fontSize: '22px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", marginTop: '6px' },
  previewStatLabel: { fontSize: '11px', color: '#475569', marginTop: '4px' },
  previewList: { padding: '12px' },
  previewListItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#0a0f1e', borderRadius: '10px', marginBottom: '8px' },
  previewListIcon: { fontSize: '16px' },
  inTransitBadge: { fontSize: '11px', color: '#f59e0b', fontWeight: '600' },

  // Sections
  section: { padding: '100px 40px' },
  sectionInner: { maxWidth: '1200px', margin: '0 auto' },
  sectionTag: { display: 'inline-block', background: '#6366f120', border: '1px solid #6366f140', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', color: '#a5b4fc', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' },
  sectionTitle: { fontSize: '42px', fontWeight: '800', color: '#f1f5f9', margin: '0 0 16px', fontFamily: "'Outfit', sans-serif" },
  sectionSub: { fontSize: '16px', color: '#64748b', margin: '0 0 60px', lineHeight: '1.6' },

  // Features Grid
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  featureCard: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '28px 24px', transition: 'border-color 0.2s, transform 0.2s' },
  featureIcon: { fontSize: '32px', marginBottom: '16px' },
  featureTitle: { fontSize: '16px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 10px' },
  featureDesc: { fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0 },

  // Steps
  stepsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  stepCard: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '20px', padding: '36px 28px', textAlign: 'center' },
  stepNum: { fontSize: '48px', fontWeight: '900', color: '#1e293b', fontFamily: "'Outfit', sans-serif", marginBottom: '8px' },
  stepIcon: { fontSize: '40px', marginBottom: '16px' },
  stepTitle: { fontSize: '20px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 12px' },
  stepDesc: { fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: 0 },

  // Plans
  plansGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  planCard: { background: '#0f172a', border: '2px solid #1e293b', borderRadius: '20px', padding: '32px 24px', position: 'relative', transition: 'transform 0.2s' },
  planCardPopular: { background: '#0a0218', transform: 'scale(1.04)', boxShadow: '0 0 60px #8b5cf630' },
  popularBadge: { position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', fontSize: '12px', fontWeight: '700', padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap' },
  planName: { fontSize: '14px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' },
  planPrice: { fontSize: '36px', fontWeight: '900', color: '#f1f5f9', margin: '0 0 4px', fontFamily: "'Outfit', sans-serif" },
  planPeriod: { fontSize: '14px', color: '#475569', fontWeight: '500' },
  planFeatures: { margin: '24px 0', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #1e293b', paddingTop: '20px' },
  planFeatureItem: { fontSize: '13px', color: '#94a3b8', display: 'flex', gap: '8px', alignItems: 'flex-start' },
  planCta: { display: 'block', textAlign: 'center', padding: '13px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', transition: 'all 0.2s', marginTop: '8px' },

  // CTA Banner
  ctaBanner: { padding: '100px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' },
  ctaOrb1: { position: 'absolute', top: '50%', left: '20%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, #6366f125, transparent 70%)', pointerEvents: 'none' },
  ctaOrb2: { position: 'absolute', top: '50%', right: '20%', transform: 'translate(50%, -50%)', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, #8b5cf625, transparent 70%)', pointerEvents: 'none' },
  ctaTitle: { fontSize: '52px', fontWeight: '900', color: '#f1f5f9', margin: '0 0 16px', fontFamily: "'Outfit', sans-serif", position: 'relative' },
  ctaSub: { fontSize: '18px', color: '#64748b', margin: '0 0 40px', position: 'relative' },
  ctaBtn: { display: 'inline-block', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', textDecoration: 'none', padding: '18px 40px', borderRadius: '16px', fontSize: '17px', fontWeight: '800', boxShadow: '0 0 60px #6366f150', position: 'relative', transition: 'all 0.2s' },

  // Footer
  footer: { background: '#0a0f1e', borderTop: '1px solid #1e293b', padding: '60px 40px' },
  footerInner: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center' },
  footerLogo: { display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  footerDesc: { color: '#475569', fontSize: '14px', marginBottom: '24px' },
  footerLinks: { display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '24px' },
  footerLink: { color: '#64748b', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' },
  footerCopy: { color: '#1e293b', fontSize: '13px' },
};
