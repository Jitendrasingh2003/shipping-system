import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Truck, User, Key, Lock, Mail, Phone, Loader2, MapPin, Clock, Coins, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const PortalSelectPage = () => {
  const navigate = useNavigate();
  const { login, register, token, user } = useAuth();
  
  const [lang, setLang] = useState('en');
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState('customer'); // 'customer' | 'staff' | 'admin'
  
  const t = (key) => {
    const dict = {
      en: {
        pitchTitle: 'Smart Logistics Simplified',
        pitchDesc: 'Calculate estimated delivery times instantly, track shipments over Socket.io, and confirm orders with seamless Razorpay checkout.',
        signIn: 'Sign In',
        createAccount: 'Create Account',
        staffHub: 'Staff Hub',
        staffDesc: 'Authorized Operator Credentials Entry Only',
        fullName: 'Full Name',
        emailAddress: 'Email Address',
        phoneNum: 'Phone Number (Optional)',
        password: 'Password',
        newCustomer: 'New customer? ',
        alreadyAcc: 'Already have an account? ',
        createAccBtn: 'Create an account',
        signInHere: 'Sign In here',
        visitWebsite: 'Visit Company Website',
        placeholderName: 'Enter your name',
        placeholderEmail: 'Enter email address',
        placeholderPhone: 'Enter phone number'
      },
      hi: {
        pitchTitle: 'स्मार्ट लॉजिस्टिक्स अब आसान',
        pitchDesc: 'डिलीवरी समय का तुरंत अनुमान लगाएं, सॉकेट द्वारा शिपमेंट ट्रैक करें, और आसान रेज़रपे पेमेंट से बुकिंग कन्फर्म करें।',
        signIn: 'साइन इन करें',
        createAccount: 'अकाउंट बनाएं',
        staffHub: 'स्टाफ हब',
        staffDesc: 'केवल अधिकृत स्टाफ ऑपरेटर के लिए लॉगिन',
        fullName: 'पूरा नाम',
        emailAddress: 'ईमेल पता',
        phoneNum: 'फ़ोन नंबर (वैकल्पिक)',
        password: 'पासवर्ड',
        newCustomer: 'नए ग्राहक? ',
        alreadyAcc: 'पहले से ही खाता है? ',
        createAccBtn: 'अकाउंट बनाएं',
        signInHere: 'यहाँ साइन इन करें',
        visitWebsite: 'कंपनी की वेबसाइट पर जाएं',
        placeholderName: 'अपना नाम दर्ज करें',
        placeholderEmail: 'ईमेल पता दर्ज करें',
        placeholderPhone: 'फ़ोन नंबर दर्ज करें'
      }
    };
    return dict[lang][key] || key;
  };

  const [email, setEmail] = useState('customer1@shiptrack.com');
  const [password, setPassword] = useState('Customer@123');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeFocus, setActiveFocus] = useState(null); // 'name' | 'email' | 'phone' | 'password' | null

  // Auto-redirect if already logged in
  useEffect(() => {
    if (token && user) {
      navigate(`/${user.role}`);
    }
  }, [token, user, navigate]);

  const handleDemoFill = (roleType) => {
    setSelectedRole(roleType);
    setActiveTab('login');
    if (roleType === 'admin') {
      setEmail('admin@shiptrack.com');
      setPassword('Admin@123');
    } else if (roleType === 'staff') {
      setEmail('staff1@shiptrack.com');
      setPassword('Staff@123');
    } else {
      setEmail('customer1@shiptrack.com');
      setPassword('Customer@123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please fill in all required fields.');
    }
    
    setSubmitting(true);
    if (activeTab === 'login') {
      const res = await login(email, password);
      setSubmitting(false);
      if (res?.success) {
        toast.success(`Welcome back, ${res.user.name}!`);
        navigate(`/${res.user.role}`);
      } else {
        toast.error(res?.message || 'Login failed.');
      }
    } else {
      if (!name) {
        setSubmitting(false);
        return toast.error('Please enter your name.');
      }
      const res = await register(name, email, password, phone);
      setSubmitting(false);
      if (res?.success) {
        toast.success(`Registered successfully! Welcome, ${res.user.name}!`);
        navigate('/customer');
      } else {
        toast.error(res?.message || 'Registration failed.');
      }
    }
  };

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden font-sans text-slate-100"
      style={{ backgroundColor: '#080b11' }}
    >
      {/* Floating Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <button
          type="button"
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="px-3.5 py-1.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-indigo-400 hover:text-indigo-300 transition shadow-md flex items-center space-x-1.5"
        >
          <Globe size={12} className="animate-spin-slow" />
          <span>{lang === 'en' ? 'हिन्दी (HI)' : 'English (EN)'}</span>
        </button>
      </div>
      {/* Background Video Loop (Real cargo ship at sea) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-40 brightness-[0.5]"
        src="/shipping-bg.mp4"
      />
      {/* Dark neutral overlay for video */}
      <div 
        className="absolute inset-0 backdrop-blur-[2px] z-0 pointer-events-none" 
        style={{ backgroundColor: 'rgba(8, 11, 17, 0.45)' }}
      />

      {/* Custom Styles for Floating Blobs & Glassmorphism */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-30px, 30px) scale(1.1); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.05); }
        }
        .animate-float-1 {
          animation: float-1 15s infinite ease-in-out;
        }
        .animate-float-2 {
          animation: float-2 18s infinite ease-in-out;
        }
        .animate-float-3 {
          animation: float-3 20s infinite ease-in-out;
        }
      `}} />
      
      {/* Dynamic Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-500/20 blur-[130px] animate-float-1 pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-purple-500/10 blur-[130px] animate-float-2 pointer-events-none z-0"></div>
      <div className="absolute top-[30%] right-[20%] w-[35%] h-[35%] rounded-full bg-cyan-500/10 blur-[110px] animate-float-3 pointer-events-none z-0"></div>
      
      <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Product pitch & Mock Shipment Stepper */}
        <div className="md:col-span-5 space-y-6 text-center md:text-left pr-4 flex flex-col justify-center">
          <div 
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-sm text-indigo-400 text-sm font-semibold w-fit self-center md:self-start"
            style={{ backgroundColor: 'rgba(17, 24, 39, 0.75)', borderColor: 'rgba(31, 41, 55, 0.8)' }}
          >
            <Truck size={16} className="animate-bounce" />
            <span>Marine Bytes Systems v2.1</span>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.15]">
              {lang === 'en' ? (
                <>Smart Logistics <br /><span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Simplified</span></>
              ) : (
                <>स्मार्ट लॉजिस्टिक्स <br /><span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">अब आसान</span></>
              )}
            </h1>
            
            <p className="text-slate-300 text-sm leading-relaxed">
              {t('pitchDesc')}
            </p>
          </div>

          {/* Key Logistics Highlights Points */}
          <div className="hidden md:block space-y-3.5 pt-2 text-left">
            {[
              {
                title: 'Real-Time Map Tracking',
                desc: 'WebSocket-powered live shipping routes, simulated GPS telemetry, and transit timelines.',
                icon: MapPin,
                color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
              },
              {
                title: 'Fulfillment Cost Engine',
                desc: 'Dynamic shipping tariffs configured by administration with automatic GST tax calculations.',
                icon: Coins,
                color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              },
              {
                title: 'Unified Fleet & Depots',
                desc: 'MySQL database-backed storage inventory and registered cargo vehicles directories.',
                icon: Truck,
                color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
              },
              {
                title: 'Secure Payment Checkout',
                desc: 'Seamless Razorpay integration with mock simulation modes and automated PDF billing invoices.',
                icon: Key,
                color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
              }
            ].map((pt, idx) => {
              const Icon = pt.icon;
              return (
                <div key={idx} className="flex items-start space-x-3 p-3 rounded-2xl border transition hover:translate-x-1 duration-200" style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)', borderColor: 'rgba(31, 41, 55, 0.6)' }}>
                  <div className={`p-2 rounded-xl border shrink-0 ${pt.color}`}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{pt.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{pt.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Demo Fill Selector */}
          <div className="pt-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center md:text-left">
              Select Demo Credentials
            </h3>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <button 
                onClick={() => handleDemoFill('customer')}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border text-sm text-slate-200 hover:text-purple-400 hover:border-purple-500 hover:scale-105 active:scale-95 transition duration-150 shadow-sm"
                style={{ backgroundColor: 'rgba(17, 24, 39, 0.65)', borderColor: 'rgba(31, 41, 55, 0.6)' }}
              >
                <User size={14} className="text-purple-400" />
                <span className="font-semibold">Customer Portal</span>
              </button>
              <button 
                onClick={() => handleDemoFill('staff')}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border text-sm text-slate-200 hover:text-cyan-400 hover:border-cyan-500 hover:scale-105 active:scale-95 transition duration-150 shadow-sm"
                style={{ backgroundColor: 'rgba(17, 24, 39, 0.65)', borderColor: 'rgba(31, 41, 55, 0.6)' }}
              >
                <Truck size={14} className="text-cyan-400" />
                <span className="font-semibold">Staff Hub</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="md:col-span-7 w-full">
          <div 
            className="border p-8 md:p-10 rounded-3xl shadow-2xl"
            style={{ backgroundColor: 'rgba(17, 24, 39, 0.65)', borderColor: 'rgba(31, 41, 55, 0.65)' }}
          >
            
            {/* Tabs */}
            {selectedRole === 'customer' ? (
              <div className="flex border-b border-slate-800 mb-8">
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); }}
                  className={`flex-1 pb-4 text-center font-bold text-sm transition border-b-2 ${
                    activeTab === 'login' 
                      ? 'text-indigo-400 border-indigo-500' 
                      : 'text-slate-400 border-transparent hover:text-slate-300'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); }}
                  className={`flex-1 pb-4 text-center font-bold text-sm transition border-b-2 ${
                    activeTab === 'register' 
                      ? 'text-indigo-400 border-indigo-500' 
                      : 'text-slate-400 border-transparent hover:text-slate-300'
                  }`}
                >
                  Create Account
                </button>
              </div>
            ) : (
              <div className="mb-6 border-b border-slate-800/60 pb-4">
                <h2 className="text-lg font-black text-white tracking-tight">Staff Hub</h2>
                <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Authorized Operator Credentials Entry Only</p>
              </div>
            )}

            {/* Role Header (only for Login) */}
            {activeTab === 'login' && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { key: 'customer', label: 'Customer', icon: User, color: 'hover:text-purple-400 hover:border-purple-500/50' },
                  { key: 'staff', label: 'Staff', icon: Truck, color: 'hover:text-cyan-400 hover:border-cyan-500/50' }
                ].map((role) => {
                  const Icon = role.icon;
                  const isSel = selectedRole === role.key;
                  return (
                    <button
                      key={role.key}
                      onClick={() => {
                        setSelectedRole(role.key);
                        if (role.key === 'staff') {
                          setEmail('staff1@shiptrack.com');
                          setPassword('Staff@123');
                        } else {
                          setEmail('customer1@shiptrack.com');
                          setPassword('Customer@123');
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-xs font-semibold transition ${
                        isSel 
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' 
                          : `bg-slate-950/40 border-slate-800 text-slate-400 ${role.color}`
                      }`}
                    >
                      <Icon size={18} className="mb-1.5" />
                      {role.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Forms */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {t('fullName')}
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3.5 top-3.5 transition-colors duration-200 ${activeFocus === 'name' ? 'text-indigo-500' : 'text-slate-500'}`} size={18} />
                    <input
                      type="text"
                      placeholder={t('placeholderName')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setActiveFocus('name')}
                      onBlur={() => setActiveFocus(null)}
                      className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t('emailAddress')}
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3.5 top-3.5 transition-colors duration-200 ${activeFocus === 'email' ? 'text-indigo-500' : 'text-slate-500'}`} size={18} />
                  <input
                    type="email"
                    placeholder={t('placeholderEmail')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setActiveFocus('email')}
                    onBlur={() => setActiveFocus(null)}
                    className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    required
                  />
                </div>
              </div>

              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {t('phoneNum')}
                  </label>
                  <div className="relative">
                    <Phone className={`absolute left-3.5 top-3.5 transition-colors duration-200 ${activeFocus === 'phone' ? 'text-indigo-500' : 'text-slate-500'}`} size={18} />
                    <input
                      type="tel"
                      placeholder={t('placeholderPhone')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => setActiveFocus('phone')}
                      onBlur={() => setActiveFocus(null)}
                      className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3.5 top-3.5 transition-colors duration-200 ${activeFocus === 'password' ? 'text-indigo-500' : 'text-slate-500'}`} size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setActiveFocus('password')}
                    onBlur={() => setActiveFocus(null)}
                    className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl py-3.5 shadow-md transition duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Key size={16} />
                    <span>{activeTab === 'login' ? `${t('signIn')} (${selectedRole.toUpperCase()})` : t('createAccount')}</span>
                  </>
                )}
              </button>

              {/* Quick Tab Toggle Link */}
              {selectedRole === 'customer' && (
                <div className="text-center pt-2">
                  {activeTab === 'login' ? (
                    <div>
                      <span className="text-xs text-slate-400">New customer? </span>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('register'); setSelectedRole('customer'); }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition underline"
                      >
                        Create an account
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs text-slate-400">Already have an account? </span>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('login'); }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition underline"
                      >
                        Sign In here
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Visit Website Button */}
              <div className="border-t border-slate-800/60 mt-5 pt-4 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/welcome')}
                  className="w-full py-2.5 px-4 bg-slate-900/60 hover:bg-slate-850/80 border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Globe size={14} className="animate-pulse" />
                  <span>Visit Company Website</span>
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PortalSelectPage;
