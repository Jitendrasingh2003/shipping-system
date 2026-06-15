import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Truck, User, Key, Lock, Mail, Phone, Loader2 } from 'lucide-react';
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
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-slate-50 overflow-hidden">
      
      {/* Decorative Warm Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-200/40 blur-[130px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-100/50 blur-[130px]"></div>
      
      <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Product pitch */}
        <div className="md:col-span-5 space-y-6 text-center md:text-left pr-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-indigo-600 text-sm font-semibold">
            <Truck size={16} />
            <span>SmartShip Systems</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Smart Logistics <br />
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
              Simplified
            </span>
          </h1>
          
          <p className="text-slate-500 text-sm leading-relaxed">
            Predict precise ETAs with Random Forest regression, track shipments instantly over Socket.io, and confirm orders with seamless Razorpay checkout.
          </p>

          {/* Quick Demo Fill Selector */}
          <div className="pt-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center md:text-left">
              Select Demo Credentials
            </h3>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <button 
                onClick={() => handleDemoFill('admin')}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-sm text-slate-700 hover:text-indigo-600 hover:border-indigo-500 hover:shadow-md transition duration-200"
              >
                <Shield size={14} className="text-indigo-500" />
                <span className="font-semibold">Admin Dashboard</span>
              </button>
              <button 
                onClick={() => handleDemoFill('staff')}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-sm text-slate-700 hover:text-cyan-600 hover:border-cyan-500 hover:shadow-md transition duration-200"
              >
                <Truck size={14} className="text-cyan-500" />
                <span className="font-semibold">Staff Hub</span>
              </button>
              <button 
                onClick={() => handleDemoFill('customer')}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-sm text-slate-700 hover:text-purple-600 hover:border-purple-500 hover:shadow-md transition duration-200"
              >
                <User size={14} className="text-purple-500" />
                <span className="font-semibold">Customer Portal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="md:col-span-7 w-full">
          <div className="bg-white border border-slate-200/80 p-8 md:p-10 rounded-3xl shadow-xl">
            
            {/* Tabs */}
            <div className="flex border-b border-slate-100 mb-8">
              <button
                onClick={() => { setActiveTab('login'); }}
                className={`flex-1 pb-4 text-center font-bold text-sm transition border-b-2 ${
                  activeTab === 'login' 
                    ? 'text-indigo-600 border-indigo-600' 
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('register'); setSelectedRole('customer'); }}
                className={`flex-1 pb-4 text-center font-bold text-sm transition border-b-2 ${
                  activeTab === 'register' 
                    ? 'text-indigo-600 border-indigo-600' 
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Role Header (only for Login) */}
            {activeTab === 'login' && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { key: 'customer', label: 'Customer', icon: User, color: 'hover:text-purple-600' },
                  { key: 'staff', label: 'Staff', icon: Truck, color: 'hover:text-cyan-600' },
                  { key: 'admin', label: 'Admin', icon: Shield, color: 'hover:text-indigo-600' }
                ].map((role) => {
                  const Icon = role.icon;
                  const isSel = selectedRole === role.key;
                  return (
                    <button
                      key={role.key}
                      onClick={() => {
                        setSelectedRole(role.key);
                        if (role.key === 'admin') {
                          setEmail('admin@shiptrack.com');
                          setPassword('Admin@123');
                        } else if (role.key === 'staff') {
                          setEmail('staff1@shiptrack.com');
                          setPassword('Staff@123');
                        } else {
                          setEmail('customer1@shiptrack.com');
                          setPassword('Customer@123');
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-xs font-semibold transition ${
                        isSel 
                          ? 'bg-indigo-50/50 border-indigo-600 text-indigo-600 shadow-indigo-glow' 
                          : `bg-slate-50 border-slate-200 text-slate-500 ${role.color}`
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    required
                  />
                </div>
              </div>

              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl py-3.5 shadow-indigo-glow transition duration-200"
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
