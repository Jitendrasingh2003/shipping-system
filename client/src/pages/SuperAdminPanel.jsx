import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  BarChart3, Users, Package, CreditCard, LogOut, Building2, ShieldAlert,
  RefreshCw, TrendingUp, CheckCircle, XCircle, Clock, Trash2, Settings,
  ChevronRight, Search, ToggleLeft, ToggleRight, Server, Database, Activity,
  AlertTriangle, Play, HelpCircle
} from 'lucide-react';

const API = 'http://localhost:5000/api';

const fetchSA = async (path, method = 'GET', body = null) => {
  const token = localStorage.getItem('sa_token');
  const res = await fetch(`${API}/superadmin${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : null,
  });
  return res.json();
};

const PLAN_COLORS = {
  trial:      'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  basic:      'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  pro:        'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  enterprise: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
};

const STATUS_COLORS = {
  active:        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  suspended:     'bg-red-500/10 text-red-400 border border-red-500/20',
  trial_expired: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
};

// Mock Server Latencies for Premium View
const LATENCY_DATA = [
  { name: '00:00', ms: 42 }, { name: '04:00', ms: 55 }, { name: '08:00', ms: 38 },
  { name: '12:00', ms: 48 }, { name: '16:00', ms: 64 }, { name: '20:00', ms: 41 },
];

// Mock Platform Event Trail for Real-Time SaaS Feel
const MOCK_EVENTS = [
  { time: 'Just Now', tenant: 'SmartShip Demo', action: 'initiated a new shipping route simulation', type: 'info' },
  { time: '5 mins ago', tenant: 'system', action: 'completed backup check on AWS RDS instance', type: 'system' },
  { time: '12 mins ago', tenant: 'DTDC Express', action: 'added 3 new drivers to fleet database', type: 'success' },
  { time: '34 mins ago', tenant: 'BlueDart Logistics', action: 'exceeded trial plan limit (restricted)', type: 'warning' },
  { time: '1 hour ago', tenant: 'system', action: 'renewed automated SSL credentials for wildcard route', type: 'system' },
];

// ── Super Admin Login ────────────────────────────────────────────
function SALogin({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/superadmin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.message); return; }
      localStorage.setItem('sa_token', data.token);
      onLogin();
      toast.success('Access Granted. Welcome back, Super Admin!');
    } catch { toast.error('Access verification failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] top-[-100px] right-[-100px] pointer-events-none" />
      
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 w-full max-w-md shadow-2xl relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-600/30">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Platform HQ</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Multi-Tenant Console</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">HQ Access Email</label>
            <input
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition"
              type="email" placeholder="superadmin@smartship.io"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Verification Code</label>
            <input
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition"
              type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Decrypt Console Access'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-6 font-medium">
          Credentials: superadmin@smartship.io / SuperAdmin@123
        </p>
      </div>
    </div>
  );
}

// ── Super Admin Dashboard Panel ──────────────────────────────────
export default function SuperAdminPanel() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('sa_token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState({});
  const [revenue, setRevenue] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (loggedIn) loadData();
  }, [loggedIn]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tenantData, revData] = await Promise.all([
        fetchSA('/tenants'),
        fetchSA('/revenue'),
      ]);
      if (tenantData.success) { setTenants(tenantData.tenants); setStats(tenantData.stats); }
      if (revData.success) setRevenue(revData.revenue);
    } catch { toast.error('Authentication expired or server offline.'); }
    finally { setLoading(false); }
  };

  const toggleTenant = async (tenantId) => {
    const data = await fetchSA(`/tenants/${tenantId}/toggle`, 'PATCH');
    if (data.success) { toast.success(data.message); loadData(); }
    else toast.error(data.message);
  };

  const updatePlan = async (tenantId, plan) => {
    const data = await fetchSA(`/tenants/${tenantId}/plan`, 'PUT', { plan, planStatus: 'active' });
    if (data.success) { toast.success(data.message); loadData(); setSelectedTenant(null); }
    else toast.error(data.message);
  };

  const deleteTenant = async (tenantId, name) => {
    if (!confirm(`Permanently wipe all data for tenant "${name}"? This cannot be reverted.`)) return;
    const data = await fetchSA(`/tenants/${tenantId}`, 'DELETE');
    if (data.success) { toast.success('Tenant data deleted.'); loadData(); setSelectedTenant(null); }
    else toast.error(data.message);
  };

  if (!loggedIn) return <SALogin onLogin={() => setLoggedIn(true)} />;

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase()) ||
    t.owner_email.toLowerCase().includes(search.toLowerCase())
  );

  const NAV_TABS = [
    { id: 'dashboard', label: 'Telemetry Overview', icon: BarChart3 },
    { id: 'tenants',   label: 'Tenants Directory',  icon: Building2 },
    { id: 'revenue',   label: 'Revenue & Plans',  icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#030712] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* ── Background Grid ── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 md:h-screen md:sticky md:top-0 overflow-y-auto bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between p-6 z-20">
        <div className="space-y-8">
          <div className="flex items-center space-x-3 px-2 py-1">
            <div className="bg-indigo-600 p-2.5 text-white rounded-2xl shadow-lg shadow-indigo-600/35">
              <Server size={20} />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg leading-none tracking-tight block">SmartShip</span>
              <span className="text-[10px] text-indigo-400 block font-bold tracking-widest uppercase mt-0.5">SaaS Platform HQ</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {NAV_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 border border-indigo-500/20'
                      : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center space-x-3 px-2">
            <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-2.5 rounded-2xl font-black text-xs">
              HQ
            </div>
            <div>
              <p className="text-xs font-bold text-white">Super Admin</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">AWS Active Node</p>
            </div>
          </div>
          <button
            onClick={() => { localStorage.removeItem('sa_token'); setLoggedIn(false); }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold transition"
          >
            <LogOut size={16} />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto z-10 relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800/80 mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {NAV_TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-slate-500 text-xs mt-1.5 font-medium">Real-time health audits, multi-region database scaling, and usage insights.</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs py-3 px-5 rounded-2xl shadow-sm transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Force Re-Sync
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center mt-32 gap-3 text-slate-400">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <span className="text-xs font-semibold tracking-wider uppercase font-mono">Syncing datasets...</span>
          </div>
        ) : (
          <>
            {/* ══ TELEMETRY OVERVIEW ═════════════════════════════════ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: 'Platform Tenants', value: stats.total || 0, icon: Building2, desc: 'Registered platforms' },
                    { label: 'Active Node Portals', value: stats.active || 0, icon: Activity, desc: 'Operational domains' },
                    { label: 'Trial Instances', value: stats.trial || 0, icon: Clock, desc: 'Evaluation phase' },
                    { label: 'Suspended Clusters', value: stats.suspended || 0, icon: AlertTriangle, desc: 'Restricted access' },
                  ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />
                        <div className="flex justify-between items-start mb-4">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
                          <div className="bg-slate-800 p-2.5 rounded-2xl text-indigo-400">
                            <Icon size={16} />
                          </div>
                        </div>
                        <h3 className="text-4xl font-black text-white tracking-tight">{s.value}</h3>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">{s.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Server Status Graph & Event Trail Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Graph */}
                  <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Activity size={16} className="text-indigo-400" />
                          Platform Latency Metric (MS)
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1">Average response times over the last 24 hours</p>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">Optimal</span>
                    </div>

                    <div className="w-full h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={LATENCY_DATA}>
                          <defs>
                            <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#1f293730" strokeDasharray="3 3" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }} />
                          <Area type="monotone" dataKey="ms" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#latencyGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Event Trail */}
                  <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Database size={16} className="text-indigo-400" />
                        Live Platform Event Trail
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1">Real-time status updates across subdomains</p>
                    </div>

                    <div className="space-y-4 my-6 flex-1 overflow-y-auto max-h-[220px] pr-2">
                      {MOCK_EVENTS.map((ev, i) => (
                        <div key={i} className="flex gap-3 text-xs leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-bold text-slate-300">{ev.tenant}</span>{' '}
                            <span className="text-slate-500">{ev.action}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 whitespace-nowrap">{ev.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Revenue Overview Summary */}
                {revenue && (
                  <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <CreditCard size={16} className="text-indigo-400" />
                        Monthly Platform Revenue Audit
                      </h4>
                      <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full uppercase tracking-wider">AWS billing sync active</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {[
                        { label: 'Monthly Revenue (MRR)', val: `₹${(revenue.mrr || 0).toLocaleString()}`, desc: 'Active subscriptions' },
                        { label: 'Annual Revenue (ARR)', val: `₹${(revenue.arr || 0).toLocaleString()}`, desc: 'Projected ARR metrics' },
                        { label: 'Global Shipment Load', val: revenue.totalShipments || 0, desc: 'Processed packages' },
                        { label: 'Registered Team Members', val: revenue.totalUsers || 0, desc: 'Active client staff' },
                      ].map((item, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                          <p className="text-2xl font-black text-white">{item.val}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ TENANTS DIRECTORY ══════════════════════════════════ */}
            {activeTab === 'tenants' && (
              <div className="space-y-6 animate-fade-in">
                {/* Search */}
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition shadow-inner"
                    placeholder="Search subdomains, owner emails or company names..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredTenants.map(t => (
                    <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
                            {t.name[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="font-bold text-white text-sm">{t.name}</h4>
                              <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${PLAN_COLORS[t.plan] || ''}`}>
                                {t.plan?.toUpperCase()}
                              </span>
                              <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[t.plan_status] || ''}`}>
                                {t.is_active ? 'ACTIVE' : 'SUSPENDED'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono">{t.slug}.smartship.io</p>
                            <p className="text-xs text-slate-500 font-medium">{t.owner_email}</p>
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-800/60 text-left">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Users</p>
                            <p className="text-sm font-extrabold text-white mt-0.5">{t.total_users || 0}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Shipments</p>
                            <p className="text-sm font-extrabold text-white mt-0.5">{t.total_shipments || 0}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Initialized</p>
                            <p className="text-sm font-extrabold text-white mt-0.5">{new Date(t.created_at).toLocaleDateString('en-IN')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="mt-6 flex gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedTenant(t)}
                          className="flex items-center gap-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-bold text-xs px-4 py-2.5 rounded-xl border border-indigo-500/10 transition"
                        >
                          <Settings size={13} /> Change Plan
                        </button>
                        <button
                          onClick={() => toggleTenant(t.id)}
                          className={`flex items-center gap-1.5 font-bold text-xs px-4 py-2.5 rounded-xl border transition ${
                            t.is_active
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/10'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/10'
                          }`}
                        >
                          {t.is_active ? 'Suspend Tenant' : 'Activate Tenant'}
                        </button>
                        <button
                          onClick={() => deleteTenant(t.id, t.name)}
                          className="flex items-center gap-1.5 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 font-bold text-xs px-4 py-2.5 rounded-xl border border-transparent transition"
                        >
                          <Trash2 size={13} /> Wipe Data
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ REVENUE ANALYTICS ══════════════════════════════════ */}
            {activeTab === 'revenue' && revenue && (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Monthly Recurring Revenue (MRR)</p>
                    <p className="text-5xl font-black text-indigo-400 tracking-tight">₹{(revenue.mrr || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Accumulated billing across active node clusters</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Projected Annual Run Rate (ARR)</p>
                    <p className="text-5xl font-black text-emerald-400 tracking-tight">₹{(revenue.arr || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Estimated 12-month platform performance projection</p>
                  </div>
                </div>

                {/* Plan list mapping */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <h4 className="text-sm font-bold text-white">Platform Subscriptions Directory</h4>
                  <div className="space-y-3">
                    {Object.entries(revenue.breakdown || {}).map(([plan, data]) => (
                      <div key={plan} className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-slate-950 border border-slate-850">
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${PLAN_COLORS[plan] || ''}`}>
                          {plan.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400 flex-1">{data.count} active cluster instances</span>
                        <span className="text-sm font-extrabold text-white">₹{data.revenue.toLocaleString()}<span className="text-xs text-slate-500 font-normal">/mo</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Manage Plan Modal ── */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedTenant(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-white">Subscription Management</h3>
                <p className="text-xs text-slate-500 mt-1">{selectedTenant.name}</p>
              </div>
              <button onClick={() => setSelectedTenant(null)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">✕</button>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Available Billing Tiers</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { id: 'trial',      label: 'Trial',      desc: 'Free · 50 limits' },
                  { id: 'basic',      label: 'Basic',      desc: '₹999/mo · 500 limits' },
                  { id: 'pro',        label: 'Pro',        desc: '₹2,999/mo · 2000' },
                  { id: 'enterprise', label: 'Enterprise', desc: 'Custom · Unlimited' },
                ].map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => updatePlan(selectedTenant.id, plan.id)}
                    className={`text-left p-4 rounded-2xl border-2 transition ${
                      selectedTenant.plan === plan.id
                        ? 'border-indigo-650 bg-indigo-500/5 text-indigo-400'
                        : 'border-slate-800 bg-slate-950/20 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-extrabold text-xs mb-1 uppercase tracking-wider">{plan.label}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{plan.desc}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => deleteTenant(selectedTenant.id, selectedTenant.name)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs transition"
              >
                <Trash2 size={14} /> WIPE CLUSTER DATA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
