import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, MapPin, Shield, Clock, ArrowRight, Anchor, Globe, Ship, Award, 
  Mail, Phone, Users, Star, MessageSquare, Search, ChevronDown, ChevronUp, CheckCircle, Navigation 
} from 'lucide-react';

const WelcomePage = () => {
  const navigate = useNavigate();
  
  // Quick Calculator State
  const [calcOrigin, setCalcOrigin] = useState('New Delhi');
  const [calcDest, setCalcDest] = useState('Singapore Port');
  const [calcType, setCalcType] = useState('Express');
  const [calcResult, setCalcResult] = useState(null);

  // Quick Tracker Simulation State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResult, setTrackResult] = useState(null);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleQuickCalc = (e) => {
    e.preventDefault();
    let baseRate = 1200;
    let days = 6;
    if (calcType === 'Air') { baseRate = 3500; days = 2; }
    else if (calcType === 'Ocean') { baseRate = 800; days = 14; }
    else if (calcType === 'Express') { baseRate = 2200; days = 4; }
    
    const price = Math.round(baseRate + Math.random() * 500);
    setCalcResult({ price, days });
  };

  const handleQuickTrack = (e) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    // Simulate a tracking history timeline based on search
    setTrackResult({
      trackingId: trackQuery.toUpperCase(),
      status: 'In Transit',
      origin: 'Mumbai Hub Depot',
      destination: 'Rotterdam Cargo Terminal',
      eta: '4 Days Remaining',
      steps: [
        { label: 'Shipment Created', desc: 'Booking confirmed and awaiting payment validation.', date: 'June 20, 2026', done: true },
        { label: 'Payment Received', desc: 'Razorpay confirmation ledger entry created.', date: 'June 20, 2026', done: true },
        { label: 'Assigned to Fleet', desc: 'Assigned to transit route and loaded to cargo fleet.', date: 'June 21, 2026', done: true },
        { label: 'In Transit', desc: 'Departed Mumbai Hub, currently overseas.', date: 'June 22, 2026', done: true, active: true },
        { label: 'Out for Delivery', desc: 'Awaiting arrival at Rotterdam destination terminal.', date: 'Pending', done: false }
      ]
    });
  };

  const toggleFaq = (index) => {
    if (expandedFaq === index) setExpandedFaq(null);
    else setExpandedFaq(index);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between selection:bg-indigo-500 selection:text-white scroll-smooth">
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="bg-indigo-600 p-2.5 text-white rounded-xl shadow-md shadow-indigo-600/20">
            <Truck size={22} className="animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-xl tracking-tight leading-none block">Marine Bytes</span>
            <span className="text-[10px] text-slate-400 block font-bold tracking-widest uppercase mt-0.5">Global Freight Systems</span>
          </div>
        </div>
        
        {/* Navigation Menu Links */}
        <nav className="hidden md:flex items-center space-x-6 text-xs font-bold text-slate-500">
          <a href="#services" className="hover:text-indigo-600 transition">Services</a>
          <a href="#why-us" className="hover:text-indigo-600 transition">Why Marine Bytes</a>
          <a href="#calc" className="hover:text-indigo-600 transition">ETA Calculator</a>
          <a href="#tracker" className="hover:text-indigo-600 transition">Track Parcel</a>
          <a href="#reviews" className="hover:text-indigo-600 transition">Testimonials</a>
          <a href="#faq" className="hover:text-indigo-600 transition">FAQs</a>
        </nav>

        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/10 hover:scale-105 active:scale-95 duration-150"
        >
          <span>Go to Login Portal</span>
          <ArrowRight size={14} />
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Pitch */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/60 text-indigo-600 text-xs font-bold uppercase tracking-wider">
              <Award size={14} />
              <span>Next-Gen Logistics Solution</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Smart Freight Management <br />
              <span className="text-indigo-600">Reimagined</span>
            </h1>
            
            <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
              Marine Bytes powers modern supply chains with instant ETA calculation, relational database integrity, secure payment processing, and real-time live map tracking.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 duration-150"
              >
                <span>Access Dashboard Portals</span>
                <ArrowRight size={15} />
              </button>
              <a
                href="#calc"
                className="px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition duration-150 hover:scale-105 active:scale-95"
              >
                Estimate ETA & Cost
              </a>
            </div>

            {/* Quick Trust Badges */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/65 max-w-md mx-auto lg:mx-0">
              <div>
                <p className="text-xl font-black text-slate-900">24/7</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Live Dispatch</p>
              </div>
              <div>
                <p className="text-xl font-black text-indigo-600">100%</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Secure Billing</p>
              </div>
              <div>
                <p className="text-xl font-black text-slate-900">10k+</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Shipments Handled</p>
              </div>
            </div>
          </div>

          {/* Right Image Container */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white shadow-indigo-600/10 group hover:shadow-indigo-600/15 transition-all duration-300">
              <img
                src="/logistics_hero.png"
                alt="Marine Bytes Cargo Ship Harbor"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none"></div>
              <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md py-2.5 px-4 rounded-2xl flex items-center space-x-2.5 shadow-md">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="text-[10px] font-bold text-slate-800 tracking-wider uppercase font-mono">Ocean Terminal 01 Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Stepper Section */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">How Marine Bytes Works</h2>
            <p className="text-slate-500 text-sm">
              We have simplified cargo transit into three transparent milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {[
              { step: '01', title: 'Create & Book Instantly', desc: 'Enter shipment details in the Customer Portal. Get dynamic ETAs and complete payment through secure Razorpay gates.' },
              { step: '02', title: 'Route & Fleet Dispatch', desc: 'Admin assigns staff operators and vehicles. Live telemetry updates warehouse inventory capacities and active fleet status.' },
              { step: '03', title: 'Real-time Tracking & Delivery', desc: 'Track transit milestones live via Socket.io updates. Instantly download generated PDF invoice receipts upon arrival.' }
            ].map((st, idx) => (
              <div key={idx} className="relative space-y-4 text-center md:text-left group">
                <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-xl font-black shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition duration-300">
                  {st.step}
                </div>
                <h3 className="font-extrabold text-slate-800 text-base">{st.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-slate-50/50 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Our Global Logistics Services</h2>
            <p className="text-slate-500 text-sm">
              We offer end-to-end transport networks spanning air, ocean, and express land routes to cover any shipping requirement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { title: 'Ocean Freight Services', icon: Ship, desc: 'Cost-effective global maritime logistics handling both containerised and bulk freight across major international sea lanes.', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
              { title: 'Air Cargo Delivery', icon: Globe, desc: 'Expedited air courier lines for high-value time-sensitive shipments with guaranteed custom clearance procedures.', color: 'text-sky-600 bg-sky-50 border-sky-100' },
              { title: 'Smart Hub Warehousing', icon: Anchor, desc: 'Real-time database inventory monitoring, secure logistics loading, and supervisor manager audits.', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
              { title: 'Express Freight Shipping', icon: Truck, desc: 'Next-day intercity transit operations powered by live coordinates monitoring and staff status updating.', color: 'text-amber-600 bg-amber-50 border-amber-100' }
            ].map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition duration-200">
                  <div className="space-y-4">
                    <div className={`p-3 rounded-xl border w-fit ${srv.color}`}>
                      <Icon size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">{srv.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{srv.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section with 3D Image */}
      <section id="why-us" className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left 3D Isometric Image */}
          <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
            <div className="relative w-full max-w-lg aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-200/80 p-6 shadow-xl flex items-center justify-center group hover:shadow-2xl transition duration-300">
              <img
                src="/logistics_3d_render.png"
                alt="Logistics 3D Isometric Render"
                className="w-4/5 h-4/5 object-contain transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-radial-gradient from-transparent to-white/10 pointer-events-none"></div>
            </div>
          </div>

          {/* Right Why Choose Us list */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-wider">
              <Shield size={14} />
              <span>Full Operational Security</span>
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Why Logistics Operators Choose Marine Bytes</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              We leverage advanced relational schema architecture and socket telemetry to keep cargo manifests accurate, operators accountable, and clients fully informed.
            </p>

            <div className="space-y-4">
              {[
                { title: 'Interactive Dispatch Center', desc: 'Centralized admin controls for assigning shipments to dispatchers and tracking updates.' },
                { title: 'MySQL Transaction Audit', desc: 'Consistent database integrity keeping finance audits, user invoices, and payments fully aligned.' },
                { title: 'Real-Time Map Progress', desc: 'Instant feedback tracking via Socket.io connections updating origin-to-destination paths.' }
              ].map((f, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{f.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Calculator Section */}
      <section id="calc" className="py-20 bg-slate-50/50 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-5">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Interactive Shipping Estimator</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Find out estimated cargo shipping durations and estimated cost rates. Simply log into the portal to process complete bookings, print legal bills, and get real-time tracking assignments.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2.5 text-xs text-slate-600">
                <Clock size={16} className="text-indigo-600" />
                <span>Instant estimations backed by dynamic rate-table calculations.</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-slate-600">
                <Shield size={16} className="text-indigo-600" />
                <span>Encrypted booking IDs generated automatically in MySQL logs.</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-lg space-y-6">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>Fast Calculator Simulator</span>
              </h3>
              
              <form onSubmit={handleQuickCalc} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Origin Port City</label>
                  <input
                    type="text"
                    value={calcOrigin}
                    onChange={(e) => setCalcOrigin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Destination Port City</label>
                  <input
                    type="text"
                    value={calcDest}
                    onChange={(e) => setCalcDest(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Shipping Transit Type</label>
                  <select 
                    value={calcType}
                    onChange={(e) => setCalcType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Express">Express Ground (Fast)</option>
                    <option value="Air">Air Courier (Ultra-Fast)</option>
                    <option value="Ocean">Ocean Freight (Cargo Bulk)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full md:col-span-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition duration-150 shadow-md shadow-indigo-600/10"
                >
                  Estimate Duration & Cost Rate
                </button>
              </form>

              {calcResult && (
                <div className="bg-indigo-50/50 border border-indigo-100/65 p-4 rounded-2xl flex items-center justify-between text-xs animate-fade-in">
                  <div>
                    <p className="text-slate-400">Estimated Cost Rate:</p>
                    <p className="font-black text-lg text-slate-800 mt-0.5">₹{calcResult.price.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Transit Duration:</p>
                    <p className="font-black text-lg text-indigo-600 mt-0.5">{calcResult.days} Days</p>
                  </div>
                  <button
                    onClick={() => { navigate('/'); }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold transition"
                  >
                    Log In to Book
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Live Tracking Demonstration widget */}
      <section id="tracker" className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Interactive Parcel Tracker Preview</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Test our Socket.io dispatch tracking tool right on the home page! Paste a mock tracking ID and check how details load dynamically from the datalog timeline.
            </p>

            <form onSubmit={handleQuickTrack} className="flex gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Enter Mock Tracking ID (e.g. MB-9843-TR)"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
              >
                Track Now
              </button>
            </form>
          </div>

          <div className="lg:col-span-6">
            {trackResult ? (
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-lg space-y-5 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tracking Preview</p>
                    <p className="font-mono text-sm font-bold text-slate-800">{trackResult.trackingId}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-cyan-50 border border-cyan-100 text-cyan-600 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation size={10} className="animate-spin" />
                    {trackResult.status}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {trackResult.steps.map((st, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          st.active ? 'bg-indigo-600 border-indigo-600 text-white' : st.done ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}>
                          <CheckCircle size={10} />
                        </div>
                        {idx < trackResult.steps.length - 1 && (
                          <div className={`w-0.5 h-8 ${st.done ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{st.label}</h4>
                        <p className="text-[10px] text-slate-400 leading-normal">{st.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-white p-6">
                <MapPin size={24} className="text-slate-300 mb-2 animate-bounce" />
                <p className="text-xs font-medium">Enter a tracking query to preview dispatch milestone tracker timeline.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Customer Reviews/Testimonials Section */}
      <section id="reviews" className="py-20 bg-slate-50/50 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <MessageSquare size={12} />
              <span>Customer Success</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">What Our Partners Say</h2>
            <p className="text-slate-500 text-sm">
              Read ratings from verified logistics supervisors and customers using Marine Bytes systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Jenkins', role: 'Supply Chain Coordinator', initial: 'SJ', text: 'Marine Bytes revolutionized our maritime dispatch. The radial occupancy warehouse gauges let us manage container volumes at SGP Harbor in real-time, cutting down planning overhead by 30%.', stars: 5 },
              { name: 'Rajesh Mehta', role: 'Export Director', initial: 'RM', text: 'The instant billing calculations and auto PDF generator integration makes transactions completely transparent. Razorpay sandbox checking runs perfectly. Solid academic project!', stars: 5 },
              { name: 'David Carter', role: 'E-commerce Operator', initial: 'DC', text: 'Having Socket.io notifications for our staff operators directly on the tracking boards reduces shipment delays significantly. The live chats are incredibly smooth.', stars: 5 }
            ].map((rev, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-5 hover:shadow-md hover:border-slate-300 transition duration-200">
                <p className="text-xs text-slate-500 italic leading-relaxed">"{rev.text}"</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center uppercase shadow-inner">
                      {rev.initial}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{rev.name}</h4>
                      <p className="text-[10px] text-slate-400">{rev.role}</p>
                    </div>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(rev.stars)].map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-sm">
              Everything you need to know about the Marine Bytes dispatch system.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { q: 'How does the dynamic ETA calculator work?', a: 'The ETA engine aggregates shipment weights and distances across air/ocean/express tariffs, factoring in active hub conditions and dispatch lead times to estimate exact delivery dates.' },
              { q: 'How are support tickets processed?', a: 'Customers raise issues directly in their dashboard. Admins and staff operators audit these requests, assign supervisor states, and resolve them dynamically.' },
              { q: 'Is there real-time live map tracking?', a: 'Yes! Using socket telemetry connections, coordinates updates are pushed from the staff dashboards to the client tracking map in real-time.' },
              { q: 'Where is the data stored?', a: 'All records (invoices, users, payments, notifications, chat logs, warehouse load capacities) are stored in MySQL relational tables.' }
            ].map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 hover:bg-slate-50 transition duration-150">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left py-4 px-5 flex items-center justify-between font-bold text-xs md:text-sm text-slate-800"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-slate-500 leading-relaxed border-t border-slate-200/60 pt-3 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 border-b border-slate-800 pb-8 text-xs">
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-white">
              <div className="bg-indigo-600 p-2 text-white rounded-xl">
                <Truck size={18} />
              </div>
              <span className="font-extrabold text-base tracking-tight">Marine Bytes</span>
            </div>
            <p className="leading-relaxed">
              Global supply chain management and automated logistics dispatcher software.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider">Quick Actions</h4>
            <ul className="space-y-2">
              <li><button onClick={() => navigate('/')} className="hover:text-white transition">Sign In Portal</button></li>
              <li><button onClick={() => navigate('/')} className="hover:text-white transition font-bold text-indigo-400">Create Account</button></li>
              <li><button onClick={() => navigate('/admin-login')} className="hover:text-white transition">Admin Panel Access</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider">Core Features</h4>
            <ul className="space-y-2">
              <li><a href="#tracker" className="hover:text-white transition">Real-time Map GPS Telemetry</a></li>
              <li><a href="#calc" className="hover:text-white transition">Dynamic Cost Calculating</a></li>
              <li><a href="#why-us" className="hover:text-white transition">Warehouse Occupancy Circle</a></li>
              <li><a href="#services" className="hover:text-white transition">Automated Invoice Receipts Engine</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider">Support Hub</h4>
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2">
                <Mail size={14} className="text-indigo-400" />
                <span>support@marinebytes.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={14} className="text-indigo-400" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users size={14} className="text-indigo-400" />
                <span>Live Chat Enabled</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs">
          <p>© {new Date().getFullYear()} Marine Bytes Global Freight Systems. All rights reserved.</p>
          <p className="text-slate-600 mt-2 md:mt-0">Academic College Project Demonstration Sandbox Mode</p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
