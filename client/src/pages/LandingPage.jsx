import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ShieldCheck, ArrowRight, CheckCircle2, ChevronDown, Play, Pause, 
  Sparkles, Globe2, Zap, BarChart4, DollarSign, Users, Layers, ShieldCheckIcon
} from 'lucide-react';

const FEATURES = [
  { icon: Globe2, title: 'Multi-Tenant Isolation', desc: 'Har company ka data completely separate aur secure rehta hai. Zero data leak chance.' },
  { icon: Sparkles, title: 'White-Label Portal', desc: 'Apna customized domain aur unique brand themes setup karein taaki customers aapki identity pehchanein.' },
  { icon: Zap, title: 'Automated Operations', desc: 'Auto-generation of shipping labels, barcode scanning support, aur OTP-verified delivery triggers.' },
  { icon: BarChart4, title: 'Deep Analytics Engine', desc: 'Monthly recurring revenue, shipment dispatch reports aur customer satisfaction graphs ek simple dashboard me.' },
  { icon: Layers, title: 'Fleet & Hub Coordination', desc: 'Vehicles, drivers aur warehouses ko real-time status updates ke sath efficiently monitoring karein.' },
  { icon: ShieldCheck, title: 'Enterprise Guard', desc: 'JWT security validations, request rate limiters aur full audit history for complete peace of mind.' },
];

const FAQS = [
  { q: 'SmartShip SaaS ko setup karne me kitna samay lagta hai?', a: 'Kuch hi seconds! Naya account register karte hi aapka isolated subdomain and system automatically live ho jata hai.' },
  { q: 'Kya main apna custom domain use kar sakta hoon?', a: 'Haan! Humare Pro aur Enterprise plans ke sath aap arbitrary domains (e.g. shipping.mycompany.com) map kar sakte hain.' },
  { q: 'Customer support tickets kaise track hote hain?', a: 'Har customer panel se live support queries and attachments submit kar sakta hai jise aapke agents and AI assistant reply de sakte hain.' },
  { q: 'Kya hum Razorpay ke alawa dusre gateways use kar sakte hain?', a: 'Hamara system standard standard APIs support karta hai jise aap tenant settings dashboard se manually configure kar sakte hain.' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [sliderValue, setSliderValue] = useState(500);
  const [activeFeatureTab, setActiveFeatureTab] = useState('tracking');
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Determine recommended plan based on slider value (shipments/month)
  const getRecommendedPlan = (value) => {
    if (value <= 50) return { name: 'Trial', price: 'FREE', color: 'text-amber-400', border: 'border-amber-400/40' };
    if (value <= 500) return { name: 'Basic', price: '₹999/mo', color: 'text-blue-400', border: 'border-blue-400/40' };
    if (value <= 2000) return { name: 'Pro', price: '₹2,999/mo', color: 'text-indigo-400', border: 'border-indigo-400/40' };
    return { name: 'Enterprise', price: 'Custom Pricing', color: 'text-emerald-400', border: 'border-emerald-400/40' };
  };

  const recommendedPlan = getRecommendedPlan(sliderValue);

  return (
    <div className="bg-[#030712] text-slate-100 min-h-screen font-sans overflow-x-hidden selection:bg-indigo-600 selection:text-white">
      
      {/* ── Background Grid & Orbs ── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] left-[-100px] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* ── Navigation ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#030712]/80 backdrop-blur-md border-b border-slate-800/80 py-4' : 'py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-3 no-underline group">
            <div className="bg-indigo-600 p-2 text-white rounded-xl shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <Layers size={22} />
            </div>
            <span className="text-2xl font-black text-white tracking-tight font-display">SmartShip<span className="text-indigo-500">.SaaS</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition no-underline">Features</a>
            <a href="#demo" className="text-sm font-medium text-slate-400 hover:text-white transition no-underline">Interactive Demo</a>
            <a href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition no-underline">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-slate-400 hover:text-white transition no-underline">FAQ</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-semibold text-slate-300 hover:text-white transition no-underline px-4 py-2">Log In</Link>
            <Link to="/register-company" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all no-underline">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 px-6 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-8 text-left z-10">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={12} className="animate-pulse" />
              Complete logistics White-Label Suite
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.05]">
              Apni Delivery Service ka <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">SaaS Software</span>
            </h1>
            
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
              Nayi courier company setup karein ya existing operations ko automated cloud platform par shift karein. SmartShip aapko isolated database, customer and staff panels aur Razorpay integration seconds me build karke deta hai.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link to="/register-company" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all no-underline flex items-center gap-2">
                Launch Your Portal <ArrowRight size={18} />
              </Link>
              <Link to="/superadmin" className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-6 py-4 rounded-2xl transition flex items-center gap-2 no-underline">
                View Admin Demo
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800/80 max-w-md">
              <div>
                <p className="text-2xl font-extrabold text-white">500+</p>
                <p className="text-xs text-slate-500">Portals Created</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">99.9%</p>
                <p className="text-xs text-slate-500">Guaranteed Uptime</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">₹0</p>
                <p className="text-xs text-slate-500">No Setup Cost</p>
              </div>
            </div>
          </div>

          {/* Right Video / Visual Column */}
          <div className="lg:col-span-5 relative z-10 w-full">
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-[#0f172a] shadow-2xl shadow-indigo-500/5 aspect-video md:aspect-[4/3] flex flex-col">
              
              {/* Header */}
              <div className="bg-[#0a0f1e] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="text-[11px] font-semibold text-slate-500 font-mono">Logistics Operations Preview</div>
                <button 
                  onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                  className="bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg text-slate-400 hover:text-white transition"
                >
                  {isVideoPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
              </div>

              {/* Video or Image Canvas */}
              <div className="flex-1 relative bg-black">
                {isVideoPlaying ? (
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover opacity-80"
                  >
                    <source src="/shipping-bg.mp4" type="video/mp4" />
                  </video>
                ) : (
                  <img 
                    src="/logistics_hero.png" 
                    alt="Logistics background" 
                    className="w-full h-full object-cover opacity-80"
                  />
                )}
                {/* Floating telemetry widget */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 p-2.5 rounded-xl">
                      <Zap size={18} className="animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-white">Interactive Video Mode</p>
                      <p className="text-[10px] text-slate-500">Showing platform automation flow</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full uppercase">Live feed</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-24 border-y border-slate-900 bg-[#070b19]/40">
        <div className="max-w-7xl mx-auto px-6 md:px-8 text-center space-y-16">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="text-indigo-400 text-xs font-extrabold uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">All-in-one features</span>
            <h2 className="text-3xl md:text-5xl font-black text-white">Full Software Suite Ready Made</h2>
            <p className="text-slate-400">Har feature tenant level customization ke sath integrated hai, bina extra plugins ke.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/30 hover:bg-slate-900 transition-all duration-300 text-left space-y-4 hover:translate-y-[-2px]">
                  <div className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 p-3 rounded-2xl w-fit">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{feat.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Interactive Features Demo ── */}
      <section id="demo" className="py-24 max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text / Controls */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-indigo-400 text-xs font-extrabold uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Live Interactive Demo</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Try Platform Features</h2>
            <p className="text-slate-400">Niche diye gaye tabs par click karke portal ki live functionality test karein.</p>
            
            <div className="flex flex-col gap-2">
              {[
                { id: 'tracking', label: '📍 Customer Shipment Booking', desc: 'Detailed address verification, package dimension scaling' },
                { id: 'staff', label: '👷 Staff Telemetry & ETA', desc: 'Driver allocation maps, package lifecycle update simulation' },
                { id: 'customization', label: '🎨 Tenant Branding & Colors', desc: 'Theme colors live styling overrides' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id)}
                  className={`text-left p-4 rounded-2xl border transition ${activeFeatureTab === tab.id ? 'border-indigo-500 bg-indigo-500/5 text-white' : 'border-slate-800 bg-slate-950/20 text-slate-400'}`}
                >
                  <p className="font-bold text-sm">{tab.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{tab.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative min-h-[380px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-600/5 rounded-full blur-[80px] pointer-events-none" />

            {activeFeatureTab === 'tracking' && (
              <div className="space-y-6 animate-fade-in text-left">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <h4 className="font-bold text-white text-base">New Shipment Reservation</h4>
                  <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-bold">Standard Air Mode</span>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">From City</label>
                      <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm mt-1 text-slate-300">Mumbai Hub</div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">To City</label>
                      <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm mt-1 text-slate-300">New Delhi Hub</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Estimated Tariff Audit</label>
                    <div className="mt-2 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex justify-between items-center">
                      <div>
                        <p className="text-xl font-black text-white">₹382.40</p>
                        <p className="text-[10px] text-slate-500">Including 18% IGST tariff</p>
                      </div>
                      <Link to="/register-company" className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs no-underline">Book Shipment</Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'staff' && (
              <div className="space-y-6 animate-fade-in text-left">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <h4 className="font-bold text-white text-base">Vessel Telemetry Control</h4>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">In Transit</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-800 rounded-2xl">
                    <span className="text-2xl">🚛</span>
                    <div className="flex-1">
                      <p className="text-xs font-extrabold text-white">Truck MH-04-AX-9921</p>
                      <p className="text-[10px] text-slate-500">Assigned Driver: Ramesh Kumar</p>
                    </div>
                    <span className="text-xs text-indigo-400 font-bold">ETA: 4 Hours</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-800 rounded-2xl">
                    <span className="text-2xl">⚓</span>
                    <div className="flex-1">
                      <p className="text-xs font-extrabold text-white">Container Ocean Vessel MB-29</p>
                      <p className="text-[10px] text-slate-500">Route: Nhava Sheva → Gujarat Port</p>
                    </div>
                    <span className="text-xs text-indigo-400 font-bold">ETA: 2 Days</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'customization' && (
              <div className="space-y-6 animate-fade-in text-left">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <h4 className="font-bold text-white text-base">Dynamic Theme Overrides</h4>
                  <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-bold">White-Label</span>
                </div>
                <p className="text-xs text-slate-400">Settings dashboard se single click me company matching themes and custom CSS loading overrides activate karein.</p>
                <div className="grid grid-cols-4 gap-3 pt-3">
                  {[
                    { name: 'Indigo Default', hex: '#6366f1' },
                    { name: 'Cyber Blue', hex: '#0ea5e9' },
                    { name: 'Forest Green', hex: '#10b981' },
                    { name: 'Vibrant Orange', hex: '#f97316' },
                  ].map(color => (
                    <button
                      key={color.hex}
                      onClick={() => document.documentElement.style.setProperty('--primary', color.hex)}
                      className="border border-slate-800 p-3 rounded-2xl bg-slate-950 hover:border-slate-600 transition flex flex-col items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-full border border-white/20" style={{ background: color.hex }} />
                      <span className="text-[10px] font-bold text-slate-500 text-center">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Simulated 3D Graphic Placeholder */}
            <div className="mt-8 border-t border-slate-800/80 pt-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheckIcon size={14} className="text-emerald-500" />
                <span>Simulated Interface Mockups</span>
              </div>
              <img 
                src="/logistics_3d_render.png" 
                alt="Logistics 3d render" 
                className="w-16 h-12 object-contain opacity-60 hover:opacity-100 transition"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── Interactive Pricing Calculator ── */}
      <section id="pricing" className="py-24 border-t border-slate-900 bg-[#070b19]/20">
        <div className="max-w-7xl mx-auto px-6 md:px-8 text-center space-y-16">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="text-indigo-400 text-xs font-extrabold uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Custom pricing plans</span>
            <h2 className="text-3xl md:text-5xl font-black text-white">Plan Recommendations</h2>
            <p className="text-slate-400">Apne expected monthly volume ko select karein aur recommended plan check karein.</p>
          </div>

          {/* Interactive Calculator Slider Card */}
          <div className="bg-slate-900 border border-slate-800 max-w-2xl mx-auto rounded-3xl p-8 space-y-8 shadow-2xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white font-extrabold text-[11px] tracking-wider uppercase px-4 py-1 rounded-full border border-indigo-500">
              Interactive Slider
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-400">Monthly Shipments Target:</span>
                <span className="text-xl font-black text-indigo-400">{sliderValue === 5000 ? '5,000+' : sliderValue.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10"
                max="5000"
                step="50"
                value={sliderValue}
                onChange={e => setSliderValue(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-600 font-bold">
                <span>50</span>
                <span>500</span>
                <span>2,000</span>
                <span>5,000+</span>
              </div>
            </div>

            {/* Recommendation Result */}
            <div className={`p-6 rounded-2xl bg-slate-950 border ${recommendedPlan.border} flex flex-col md:flex-row justify-between items-center gap-6`}>
              <div className="text-left space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recommended Plan</p>
                <div className="flex items-baseline gap-2">
                  <h3 className={`text-2xl font-black ${recommendedPlan.color}`}>{recommendedPlan.name} Plan</h3>
                  <span className="text-sm text-slate-500">at {recommendedPlan.price}</span>
                </div>
              </div>
              <Link to="/register-company" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm px-6 py-3 rounded-xl transition no-underline">
                Create Trial Account →
              </Link>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
            {[
              { name: 'Trial', price: 'Free', limit: '50 shipments', desc: 'Perfect to test features', features: ['2 Users', 'Email alerts simulation', 'Single warehouse tracking', '24x7 System support'] },
              { name: 'Basic', price: '₹999', limit: '500 shipments', desc: 'Ideal for local delivery setups', features: ['5 Users', 'Razorpay test mode keys', 'SMTP customization support', 'Excel metrics exports'] },
              { name: 'Pro', price: '₹2,999', limit: '2,000 shipments', desc: 'Full custom white-label', features: ['20 Users', 'Custom domain mapping', 'Real-time support live feed', 'Full API telemetry endpoints'] },
              { name: 'Enterprise', price: 'Custom', limit: 'Unlimited', desc: 'Custom enterprise integration', features: ['Unlimited Users', 'Dedicated multi-databases', 'SLA level support parameters', 'Custom custom tools integration'] },
            ].map((plan, i) => (
              <div key={i} className={`bg-slate-900/50 border rounded-3xl p-6 text-left space-y-6 flex flex-col justify-between transition-all duration-300 hover:translate-y-[-2px] ${plan.name === recommendedPlan.name ? 'border-indigo-500/80 shadow-lg shadow-indigo-600/5 bg-slate-900' : 'border-slate-800'}`}>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-white text-base">{plan.name}</h4>
                    {plan.name === recommendedPlan.name && <span className="text-[9px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase">Recommended</span>}
                  </div>
                  <p className="text-xs text-slate-500">{plan.desc}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-white">{plan.price}</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{plan.limit}</p>
                </div>
                <ul className="space-y-2 border-t border-slate-800/80 pt-4 flex-1">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="text-indigo-400">✓</span> {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/register-company" className={`block text-center py-2.5 rounded-xl font-bold text-xs no-underline transition ${plan.name === recommendedPlan.name ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'border border-slate-800 text-slate-400 hover:text-white'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Accordion Section ── */}
      <section id="faq" className="py-24 max-w-3xl mx-auto px-6">
        <div className="text-center space-y-12">
          <div className="space-y-4">
            <span className="text-indigo-400 text-xs font-extrabold uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Frequently asked questions</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Common Questions</h2>
          </div>

          <div className="space-y-3 text-left">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-slate-800 rounded-2xl bg-slate-900/20 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-5 flex justify-between items-center text-left hover:bg-slate-900/50 transition"
                >
                  <span className="font-bold text-sm text-white">{faq.q}</span>
                  <ChevronDown size={16} className={`text-slate-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="p-5 border-t border-slate-800 text-xs text-slate-400 leading-relaxed bg-slate-950/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final Call to Action ── */}
      <section className="py-24 text-center max-w-5xl mx-auto px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-[3rem] blur-3xl pointer-events-none" />
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800/80 rounded-[2.5rem] p-12 md:p-16 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Ready to upgrade your logistics?</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            5 minute setup flow se abhi apna custom subdomain register karein. Trial starts instantly. No payment information required.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/register-company" className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-8 py-4 rounded-2xl transition shadow-xl shadow-indigo-600/20 no-underline">
              Create Free Trial Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-900 bg-[#02050c] py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📦</span>
              <span className="text-lg font-extrabold text-white">SmartShip.SaaS</span>
            </div>
            <p className="text-xs text-slate-500">Premium cloud infrastructure for global logistics businesses.</p>
          </div>
          <div className="md:col-span-8 flex flex-wrap gap-8 md:justify-end text-xs text-slate-400">
            <a href="mailto:support@smartship.io" className="hover:text-white transition no-underline">support@smartship.io</a>
            <Link to="/superadmin" className="hover:text-white transition no-underline">SuperAdmin panel</Link>
            <Link to="/" className="hover:text-white transition no-underline">Portal selection</Link>
            <span className="text-slate-700">© 2026 SmartShip. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
