import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Truck, User, Key, Lock, Mail, Phone, Loader2, MapPin, Clock, Coins } from 'lucide-react';
import toast from 'react-hot-toast';

const PortalSelectPage = () => {
  const navigate = useNavigate();
  const { login, register, token, user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState('customer'); // 'customer' | 'staff' | 'admin'
  
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
              Smart Logistics <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Simplified
              </span>
            </h1>
            
            <p className="text-slate-300 text-sm leading-relaxed">
              Calculate estimated delivery times instantly, track shipments over Socket.io, and confirm orders with seamless Razorpay checkout.
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
            <div className="flex border-b border-slate-800 mb-8">
              <button
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
                onClick={() => { setActiveTab('register'); setSelectedRole('customer'); }}
                className={`flex-1 pb-4 text-center font-bold text-sm transition border-b-2 ${
                  activeTab === 'register' 
                    ? 'text-indigo-400 border-indigo-500' 
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                Create Account
              </button>
            </div>

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
                    Full Name
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3.5 top-3.5 transition-colors duration-200 ${activeFocus === 'name' ? 'text-indigo-500' : 'text-slate-500'}`} size={18} />
                    <input
                      type="text"
                      placeholder="Enter your name"
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
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3.5 top-3.5 transition-colors duration-200 ${activeFocus === 'email' ? 'text-indigo-500' : 'text-slate-500'}`} size={18} />
                  <input
                    type="email"
                    placeholder="Enter email address"
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
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className={`absolute left-3.5 top-3.5 transition-colors duration-200 ${activeFocus === 'phone' ? 'text-indigo-500' : 'text-slate-500'}`} size={18} />
                    <input
                      type="tel"
                      placeholder="Enter phone number"
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
                  Password
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
                    <span>{activeTab === 'login' ? `Login as ${selectedRole.toUpperCase()}` : 'Register'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PortalSelectPage;
