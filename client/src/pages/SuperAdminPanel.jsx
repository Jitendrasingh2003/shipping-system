import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart3, Users, Package, CreditCard, LogOut, Building2, ShieldAlert,
  RefreshCw, TrendingUp, CheckCircle, XCircle, Clock, Trash2, Settings,
  ChevronRight, Search, ToggleLeft, ToggleRight, Database, ChevronLeft,
  Calendar, ShieldCheck, Mail, Globe
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
  trial:      'bg-amber-50 text-amber-700 border border-amber-200',
  basic:      'bg-blue-50 text-blue-705 border border-blue-200',
  pro:        'bg-blue-50 text-blue-700 border border-blue-200',
  enterprise: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const STATUS_COLORS = {
  active:        'bg-emerald-50 text-emerald-700 border border-emerald-200',
  suspended:     'bg-red-50 text-red-700 border border-red-200',
  trial_expired: 'bg-amber-50 text-amber-700 border border-amber-200',
};

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
      toast.success('Welcome back, Super Admin!');
    } catch { toast.error('Login failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl p-10 w-full max-w-md shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Super Admin</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">SmartShip Control Center</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
            <input
              className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              type="email" placeholder="superadmin@smartship.io"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
            <input
              className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Login'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Default: superadmin@smartship.io / SuperAdmin@123
        </p>
      </div>
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────
export default function SuperAdminPanel() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('sa_token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState({});
  const [revenue, setRevenue] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantDrawerOpen, setTenantDrawerOpen] = useState(false);
  const [drawerTenantDetails, setDrawerTenantDetails] = useState(null);
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
    } catch { toast.error('Platform sync failed. Please log in again.'); }
    finally { setLoading(false); }
  };

  const toggleTenant = async (tenantId) => {
    const data = await fetchSA(`/tenants/${tenantId}/toggle`, 'PATCH');
    if (data.success) { 
      toast.success(data.message); 
      loadData(); 
      if (drawerTenantDetails?.tenant?.id === tenantId) {
        inspectTenant(tenantId);
      }
    }
    else toast.error(data.message);
  };

  const updatePlan = async (tenantId, plan) => {
    const data = await fetchSA(`/tenants/${tenantId}/plan`, 'PUT', { plan, planStatus: 'active' });
    if (data.success) { 
      toast.success(data.message); 
      loadData(); 
      setSelectedTenant(null); 
      if (drawerTenantDetails?.tenant?.id === tenantId) {
        inspectTenant(tenantId);
      }
    }
    else toast.error(data.message);
  };

  const deleteTenant = async (tenantId, name) => {
    if (!confirm(`Wipe all database records for tenant "${name}" permanently?`)) return;
    const data = await fetchSA(`/tenants/${tenantId}`, 'DELETE');
    if (data.success) { 
      toast.success('Tenant data deleted.'); 
      loadData(); 
      setSelectedTenant(null); 
      setTenantDrawerOpen(false);
    }
    else toast.error(data.message);
  };

  const inspectTenant = async (tenantId) => {
    setLoading(true);
    try {
      const data = await fetchSA(`/tenants/${tenantId}`);
      if (data.success) {
        setDrawerTenantDetails(data);
        setTenantDrawerOpen(true);
      } else {
        toast.error('Failed to resolve tenant details.');
      }
    } catch {
      toast.error('Request failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!loggedIn) return <SALogin onLogin={() => setLoggedIn(true)} />;

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase()) ||
    t.owner_email.toLowerCase().includes(search.toLowerCase())
  );

  const NAV_TABS = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: BarChart3 },
    { id: 'tenants',   label: 'All Tenants',        icon: Building2 },
    { id: 'revenue',   label: 'Revenue Analytics',  icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      
      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 md:h-screen md:sticky md:top-0 overflow-y-auto bg-white border-r border-slate-200 flex flex-col justify-between p-6 z-20">
        <div className="space-y-6">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 px-2 py-3 border-b border-slate-100">
            <div className="bg-blue-600 p-2 text-white rounded-xl">
              <Package size={20} />
            </div>
            <div>
              <span className="font-extrabold text-slate-800 text-lg leading-none tracking-tight block">SmartShip</span>
              <span className="text-[10px] text-slate-400 block font-bold tracking-widest uppercase mt-0.5">SaaS Operations</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center space-x-3 px-2">
            <div className="bg-blue-100 text-blue-600 p-2.5 rounded-full font-bold text-xs">SA</div>
            <div>
              <p className="text-xs font-bold text-slate-800">Super Admin</p>
              <p className="text-[10px] text-slate-400">Platform Owner</p>
            </div>
          </div>
          <button
            onClick={() => { localStorage.removeItem('sa_token'); setLoggedIn(false); }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold transition"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto z-10 relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              {NAV_TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-slate-500 text-xs mt-1.5 font-medium">SmartShip SaaS Platform Control Center</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs py-3 px-5 rounded-2xl shadow-sm transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center mt-32 gap-3 text-slate-400">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <span className="text-xs font-semibold tracking-wider uppercase font-mono">Syncing database...</span>
          </div>
        ) : (
          <>
            {/* ══ TELEMETRY OVERVIEW ═════════════════════════════════ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: 'Total Tenants', value: stats.total || 0, icon: Building2, color: 'blue', desc: 'Registered platforms' },
                    { label: 'Active Portals', value: stats.active || 0, icon: CheckCircle, color: 'emerald', desc: 'Operational domains' },
                    { label: 'Trial Instances', value: stats.trial || 0, icon: Clock, color: 'amber', desc: 'Evaluation phase' },
                    { label: 'Suspended Clusters', value: stats.suspended || 0, icon: XCircle, color: 'red', desc: 'Restricted access' },
                  ].map((s, i) => {
                    const Icon = s.icon;
                    const styleMap = {
                      blue:    'bg-blue-50 text-blue-600 hover:border-blue-300',
                      emerald: 'bg-emerald-50 text-emerald-600 hover:border-emerald-300',
                      amber:   'bg-amber-50 text-amber-600 hover:border-amber-300',
                      red:     'bg-red-50 text-red-650 hover:border-red-300',
                    }[s.color];
                    return (
                      <div key={i} className={`bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow transition duration-200 text-left ${styleMap}`}>
                        <div className="flex justify-between items-start mb-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                          <div className="bg-slate-100 p-2.5 rounded-2xl text-slate-600">
                            <Icon size={16} />
                          </div>
                        </div>
                        <h3 className="text-4xl font-black text-slate-800 tracking-tight">{s.value}</h3>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">{s.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Revenue Overview Summary */}
                {revenue && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <CreditCard size={16} className="text-blue-600" />
                        Billing & Data Aggregation Analytics
                      </h4>
                      <span className="text-[10px] font-bold bg-blue-50 border border-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase tracking-wider">Sync Active</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
                      {[
                        { label: 'Monthly Revenue (MRR)', val: `₹${(revenue.mrr || 0).toLocaleString()}`, desc: 'Active subscriptions' },
                        { label: 'Annual Revenue (ARR)', val: `₹${(revenue.arr || 0).toLocaleString()}`, desc: 'Projected ARR metrics' },
                        { label: 'Global Shipment Load', val: revenue.totalShipments || 0, desc: 'Processed packages' },
                        { label: 'Registered Users', val: revenue.totalUsers || 0, desc: 'Active client staff' },
                      ].map((item, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                          <p className="text-2xl font-black text-slate-800">{item.val}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Tenants */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-left">
                  <h3 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2">
                    <Building2 size={16} className="text-blue-650" />
                    Recent Registrations
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {tenants.slice(0, 5).map(t => (
                      <div
                        key={t.id}
                        onClick={() => inspectTenant(t.id)}
                        className="flex items-center gap-4 py-3 hover:bg-slate-50 cursor-pointer rounded-xl px-2 transition"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
                          {t.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{t.name}</p>
                          <p className="text-xs text-slate-400 truncate">{t.slug}.smartship.io · {t.owner_email}</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${PLAN_COLORS[t.plan] || ''}`}>
                          {t.plan?.charAt(0).toUpperCase() + t.plan?.slice(1)}
                        </span>
                        <ChevronRight size={16} className="text-slate-355" />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ══ TENANTS DATABASE ══════════════════════════════════ */}
            {activeTab === 'tenants' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Search Bar */}
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition shadow-sm"
                    placeholder="Search by company name, slug, or owner email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                {/* Table */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-5">Company Profile</th>
                        <th className="p-5">Billing Plan</th>
                        <th className="p-5">Users</th>
                        <th className="p-5">Shipments</th>
                        <th className="p-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTenants.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs">
                                {t.name[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-slate-800">{t.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t.slug}.smartship.io</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg ${PLAN_COLORS[t.plan] || ''}`}>
                              {t.plan?.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-5 text-xs text-slate-500 font-bold">{t.total_users || 0}</td>
                          <td className="p-5 text-xs text-slate-500 font-bold">{t.total_shipments || 0}</td>
                          <td className="p-5 text-right">
                            <button
                              onClick={() => inspectTenant(t.id)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-bold px-3 py-1.5 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition"
                            >
                              Inspect Details →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTenants.length === 0 && (
                    <div className="text-center py-16 text-slate-400 text-sm">No registered tenants found.</div>
                  )}
                </div>
              </div>
            )}

            {/* ══ REVENUE ANALYTICS ══════════════════════════════════ */}
            {activeTab === 'revenue' && revenue && (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Monthly Recurring Revenue (MRR)</p>
                    <p className="text-5xl font-black text-blue-600 tracking-tight">₹{(revenue.mrr || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Accumulated billing across active client nodes</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Projected Annual Run Rate (ARR)</p>
                    <p className="text-5xl font-black text-emerald-600 tracking-tight">₹{(revenue.arr || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Estimated 12-month platform performance projection</p>
                  </div>
                </div>

                {/* Plan list mapping */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-left space-y-4">
                  <h4 className="text-sm font-bold text-slate-700">Platform Subscriptions Directory</h4>
                  <div className="space-y-3">
                    {Object.entries(revenue.breakdown || {}).map(([plan, data]) => (
                      <div key={plan} className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${PLAN_COLORS[plan] || ''}`}>
                          {plan.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-505 flex-1">{data.count} active accounts</span>
                        <span className="text-sm font-extrabold text-slate-800">₹{data.revenue.toLocaleString()}<span className="text-xs text-slate-400 font-normal">/mo</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Slide-Over Inspection Drawer ── */}
      {tenantDrawerOpen && drawerTenantDetails && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end"
          onClick={() => setTenantDrawerOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-white border-l border-slate-200 h-screen overflow-y-auto p-6 md:p-8 space-y-8 shadow-xl relative text-left"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Tenant Specifications</h3>
                <p className="text-[10px] font-mono text-slate-400 mt-1">Tenant ID: {drawerTenantDetails.tenant?.id}</p>
              </div>
              <button 
                onClick={() => setTenantDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Profile info */}
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg">
                  {drawerTenantDetails.tenant?.name[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-850 text-base">{drawerTenantDetails.tenant?.name}</h4>
                  <p className="text-xs text-blue-650 font-mono mt-0.5">{drawerTenantDetails.tenant?.slug}.smartship.io</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Owner Email</p>
                  <p className="font-bold text-slate-700 mt-0.5">{drawerTenantDetails.tenant?.owner_email}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Initialized On</p>
                  <p className="font-bold text-slate-700 mt-0.5">{new Date(drawerTenantDetails.tenant?.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Tier Controls */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Update Subscription Level</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'trial',      label: 'Trial Mode', price: 'Free · 50 limits' },
                  { id: 'basic',      label: 'Basic Tier', price: '₹999/mo · 500 limits' },
                  { id: 'pro',        label: 'Pro Premium', price: '₹2,999/mo · 2000' },
                  { id: 'enterprise', label: 'Enterprise', price: 'Custom · Unlimited' },
                ].map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => updatePlan(drawerTenantDetails.tenant?.id, plan.id)}
                    className={`text-left p-4 rounded-2xl border-2 transition ${
                      drawerTenantDetails.tenant?.plan === plan.id
                        ? 'border-blue-600 bg-blue-50 text-blue-650'
                        : 'border-slate-200 bg-white hover:border-slate-350 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs uppercase tracking-wider mb-1">{plan.label}</div>
                    <div className="text-[9px] text-slate-500">{plan.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Toggles */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => toggleTenant(drawerTenantDetails.tenant?.id)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border font-bold text-xs transition ${
                  drawerTenantDetails.tenant?.is_active
                    ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-650 border-emerald-200'
                }`}
              >
                {drawerTenantDetails.tenant?.is_active ? 'Suspend Tenant Access' : 'Reactivate Tenant Access'}
              </button>
              
              <button
                onClick={() => deleteTenant(drawerTenantDetails.tenant?.id, drawerTenantDetails.tenant?.name)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-250 text-slate-500 hover:text-red-600 font-bold text-xs transition"
              >
                Wipe Tenant Database Records
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
