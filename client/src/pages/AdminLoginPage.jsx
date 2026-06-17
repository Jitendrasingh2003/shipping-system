import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Lock, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, token, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeFocus, setActiveFocus] = useState(null); // 'email' | 'password' | null

  // Auto-redirect if already logged in as Admin
  useEffect(() => {
    if (token && user) {
      navigate(`/${user.role}`);
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please fill in all required fields.');
    }
    
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    
    if (res?.success) {
      if (res.user.role !== 'admin') {
        toast.error('Access Denied: Not authorized as Administrator.');
        return;
      }
      toast.success(`Welcome back, Admin ${res.user.name}!`);
      navigate('/admin');
    } else {
      toast.error(res?.message || 'Login failed.');
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
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-50 brightness-[0.6]"
        src="/shipping-bg-real.webm"
      />
      {/* Dark neutral overlay for video (removing heavy blue-purple tint) */}
      <div 
        className="absolute inset-0 backdrop-blur-[2px] z-0 pointer-events-none" 
        style={{ backgroundColor: 'rgba(8, 11, 17, 0.45)' }}
      />

      {/* Custom Styles for Floating Blobs & Glassmorphism */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.05); }
          66% { transform: translate(-15px, 15px) scale(0.98); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-25px, 25px) scale(1.08); }
        }
        .animate-float-1 {
          animation: float-1 16s infinite ease-in-out;
        }
        .animate-float-2 {
          animation: float-2 20s infinite ease-in-out;
        }
      `}} />
      
      {/* Dynamic Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-500/20 blur-[130px] animate-float-1 pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-purple-500/10 blur-[130px] animate-float-2 pointer-events-none z-0"></div>
      
      <div className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Product pitch / Admin Info */}
        <div className="md:col-span-5 space-y-6 text-center md:text-left pr-4 flex flex-col justify-center">
          <div 
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-sm text-indigo-400 text-sm font-semibold w-fit self-center md:self-start"
            style={{ backgroundColor: 'rgba(17, 24, 39, 0.75)', borderColor: 'rgba(31, 41, 55, 0.8)' }}
          >
            <Shield size={16} className="text-indigo-400 animate-pulse" />
            <span>Admin Operations</span>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.15]">
              Marine Bytes <br />
              <span className="bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-400 bg-clip-text text-transparent">
                Control Room
              </span>
            </h1>
            
            <p className="text-slate-400 text-sm leading-relaxed">
              Authorized entry point for administrative staff. Access operations monitoring, financial audit ledgers, and registry controls.
            </p>
          </div>

          {/* Secure checklist cards */}
          <div className="hidden md:block space-y-3 pt-2">
            {[
              { text: "Encrypted Session Auth", desc: "JWT tokens & secure cookies protection." },
              { text: "Relational User Logins", desc: "MySQL database storage with Mongo failover." },
              { text: "Real-time Monitoring", desc: "Socket.io live tracking & support dispatchers." }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-start space-x-3 border p-3 rounded-xl backdrop-blur-sm"
                style={{
                  backgroundColor: 'rgba(17, 24, 39, 0.45)',
                  borderColor: 'rgba(31, 41, 55, 0.5)'
                }}
              >
                <CheckCircle2 size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{item.text}</h4>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Admin Form Card */}
        <div className="md:col-span-7 w-full">
          <div 
            className="backdrop-blur-xl border p-8 md:p-10 rounded-3xl shadow-2xl"
            style={{
              backgroundColor: 'rgba(17, 24, 39, 0.65)',
              borderColor: 'rgba(31, 41, 55, 0.8)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.15)'
            }}
          >
            
            <div className="mb-6 border-b border-slate-800/60 pb-4">
              <h2 className="text-lg font-black text-white tracking-tight">Sign In</h2>
              <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Administrator Credentials Entry Only</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3.5 top-3.5 transition-colors duration-200 ${activeFocus === 'email' ? 'text-indigo-400' : 'text-slate-500'}`} size={18} />
                  <input
                    type="email"
                    placeholder="admin@marinebytes.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setActiveFocus('email')}
                    onBlur={() => setActiveFocus(null)}
                    className="w-full border rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition duration-200"
                    style={{
                      backgroundColor: 'rgba(11, 15, 25, 0.65)',
                      borderColor: activeFocus === 'email' ? 'rgba(99, 102, 241, 0.8)' : 'rgba(31, 41, 55, 0.8)',
                      boxShadow: activeFocus === 'email' ? '0 0 15px rgba(99, 102, 241, 0.25)' : 'none'
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Secret Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3.5 top-3.5 transition-colors duration-200 ${activeFocus === 'password' ? 'text-indigo-400' : 'text-slate-500'}`} size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setActiveFocus('password')}
                    onBlur={() => setActiveFocus(null)}
                    className="w-full border rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition duration-200"
                    style={{
                      backgroundColor: 'rgba(11, 15, 25, 0.65)',
                      borderColor: activeFocus === 'password' ? 'rgba(99, 102, 241, 0.8)' : 'rgba(31, 41, 55, 0.8)',
                      boxShadow: activeFocus === 'password' ? '0 0 15px rgba(99, 102, 241, 0.25)' : 'none'
                    }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl py-4 transition duration-200 hover:scale-[1.01] active:scale-[0.99] mt-6"
                style={{
                  boxShadow: '0 0 25px rgba(99, 102, 241, 0.45)'
                }}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Key size={16} />
                    <span>Enter Control Room</span>
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

export default AdminLoginPage;
