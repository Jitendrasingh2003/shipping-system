import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart3, Users, Package, CreditCard, LogOut, Building2, ShieldAlert,
  RefreshCw, TrendingUp, CheckCircle, XCircle, Clock, Trash2, Settings,
  ChevronRight, Search, ToggleLeft, ToggleRight
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
  basic:      'bg-blue-50 text-blue-700 border border-blue-200',
  pro:        'bg-indigo-50 text-indigo-700 border border-indigo-200',
  enterprise: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};
const STATUS_COLORS = {
  active:        'bg-emerald-50 text-emerald-700 border border-emerald-200',
  suspended:     'bg-red-50 text-red-600 border border-red-200',
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
      toast.success('Welcome, Super Admin!');
    } catch { toast.error('Login failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Super Admin</h1>
            <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase">SmartShip Control Center</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
              type="email" placeholder="superadmin@smartship.io"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
              type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Logging in...</> : 'Login to Control Center'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-6">
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
    } catch { toast.error('Failed to load data.'); }
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
    if (!confirm(`DELETE "${name}" permanently? This cannot be undone.`)) return;
    const data = await fetchSA(`/tenants/${tenantId}`, 'DELETE');
    if (data.success) { toast.success('Tenant deleted.'); loadData(); setSelectedTenant(null); }
    else toast.error(data.message);
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
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 flex flex-col md:flex-row">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-full md:w-64 md:h-screen md:sticky md:top-0 overflow-y-auto bg-white border-r border-slate-200 flex flex-col justify-between p-5 z-20">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 px-2 py-3 border-b border-slate-100">
            <div className="bg-indigo-600 p-2 text-white rounded-xl">
              <Package size={20} />
            </div>
            <div>
              <span className="font-extrabold text-slate-800 text-lg leading-none">SmartShip</span>
              <span className="text-[10px] text-slate-400 block font-bold tracking-widest uppercase">Super Admin</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {NAV_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-full font-bold text-xs uppercase">SA</div>
            <div>
              <p className="text-xs font-bold text-slate-800">Super Admin</p>
              <p className="text-[10px] text-slate-400">Platform Owner</p>
            </div>
          </div>
          <button
            onClick={() => { localStorage.removeItem('sa_token'); setLoggedIn(false); }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold transition"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto">

        {/* Page Header */}
        <div className="flex justify-between items-center pb-5 border-b border-slate-200 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              {NAV_TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-slate-500 text-sm mt-1">SmartShip SaaS Platform Control Center</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center mt-32">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* ══ DASHBOARD TAB ══════════════════════════════════════ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {[
                    { label: 'Total Tenants', value: stats.total || 0, icon: Building2, color: 'indigo' },
                    { label: 'Active',         value: stats.active || 0, icon: CheckCircle, color: 'emerald' },
                    { label: 'On Trial',       value: stats.trial || 0,  icon: Clock,        color: 'amber' },
                    { label: 'Suspended',      value: stats.suspended || 0, icon: XCircle,   color: 'red' },
                  ].map((s, i) => {
                    const Icon = s.icon;
                    const colors = {
                      indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  val: 'text-indigo-700' },
                      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', val: 'text-emerald-700' },
                      amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   val: 'text-amber-700' },
                      red:     { bg: 'bg-red-50',     text: 'text-red-500',     val: 'text-red-600' },
                    }[s.color];
                    return (
                      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition">
                        <div className="flex justify-between items-start mb-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                          <div className={`${colors.bg} ${colors.text} p-2 rounded-xl`}>
                            <Icon size={16} />
                          </div>
                        </div>
                        <h3 className={`text-3xl font-black ${colors.val}`}>{s.value}</h3>
                      </div>
                    );
                  })}
                </div>

                {/* Revenue Summary */}
                {revenue && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2">
                      <TrendingUp size={16} className="text-indigo-600" />
                      Revenue Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {[
                        { label: 'Monthly Revenue (MRR)', value: `₹${(revenue.mrr || 0).toLocaleString()}`, color: 'text-indigo-600' },
                        { label: 'Annual Revenue (ARR)',  value: `₹${(revenue.arr || 0).toLocaleString()}`, color: 'text-emerald-600' },
                        { label: 'Total Shipments',       value: revenue.totalShipments || 0,               color: 'text-slate-800' },
                        { label: 'Total Users',           value: revenue.totalUsers || 0,                   color: 'text-slate-800' },
                      ].map((item, i) => (
                        <div key={i}>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                          <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Tenants */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2">
                    <Building2 size={16} className="text-indigo-600" />
                    Recent Tenants
                  </h3>
                  <div className="space-y-1">
                    {tenants.slice(0, 6).map(t => (
                      <div
                        key={t.id}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 cursor-pointer transition"
                        onClick={() => { setSelectedTenant(t); setActiveTab('tenants'); }}
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
                          {t.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{t.name}</p>
                          <p className="text-xs text-slate-400 truncate">{t.slug}.smartship.io · {t.owner_email}</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${PLAN_COLORS[t.plan] || ''}`}>
                          {t.plan?.charAt(0).toUpperCase() + t.plan?.slice(1)}
                        </span>
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ TENANTS TAB ════════════════════════════════════════ */}
            {activeTab === 'tenants' && (
              <div className="space-y-5">
                {/* Search */}
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition shadow-sm"
                    placeholder="Search by name, slug, or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                {/* Tenant Cards */}
                <div className="space-y-3">
                  {filteredTenants.map(t => (
                    <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
                          {t.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <h3 className="font-extrabold text-slate-800 text-sm">{t.name}</h3>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${PLAN_COLORS[t.plan] || ''}`}>
                              {t.plan?.charAt(0).toUpperCase() + t.plan?.slice(1)}
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${STATUS_COLORS[t.plan_status] || ''}`}>
                              {t.is_active ? '● Active' : '● Suspended'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{t.slug}.smartship.io · {t.owner_email}</p>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                        {[
                          { label: 'Users', value: t.total_users || 0 },
                          { label: 'Shipments', value: t.total_shipments || 0 },
                          { label: 'Joined', value: new Date(t.created_at).toLocaleDateString('en-IN') },
                        ].map((s, i) => (
                          <div key={i}>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                            <p className="text-sm font-extrabold text-slate-700 mt-0.5">{s.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedTenant(t)}
                          className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs px-3 py-2 rounded-lg transition"
                        >
                          <Settings size={13} /> Manage Plan
                        </button>
                        <button
                          onClick={() => toggleTenant(t.id)}
                          className={`flex items-center gap-1.5 font-semibold text-xs px-3 py-2 rounded-lg transition ${
                            t.is_active
                              ? 'bg-red-50 hover:bg-red-100 text-red-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                          }`}
                        >
                          {t.is_active
                            ? <><ToggleLeft size={13} /> Suspend</>
                            : <><ToggleRight size={13} /> Activate</>
                          }
                        </button>
                        <button
                          onClick={() => deleteTenant(t.id, t.name)}
                          className="flex items-center gap-1.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 font-semibold text-xs px-3 py-2 rounded-lg transition"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredTenants.length === 0 && (
                    <div className="text-center py-16 text-slate-400 text-sm">No tenants found.</div>
                  )}
                </div>
              </div>
            )}

            {/* ══ REVENUE TAB ════════════════════════════════════════ */}
            {activeTab === 'revenue' && revenue && (
              <div className="space-y-6">
                {/* Big MRR / ARR */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Monthly Recurring Revenue</p>
                    <p className="text-5xl font-black text-indigo-600">₹{(revenue.mrr || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-2">From active subscriptions</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Annual Recurring Revenue</p>
                    <p className="text-5xl font-black text-emerald-600">₹{(revenue.arr || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-2">Projected annual revenue</p>
                  </div>
                </div>

                {/* Plan Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-700 mb-5">Plan Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(revenue.breakdown || {}).map(([plan, data]) => (
                      <div key={plan} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className={`text-xs font-bold px-3 py-1 rounded-lg ${PLAN_COLORS[plan] || ''}`}>
                          {plan.charAt(0).toUpperCase() + plan.slice(1)}
                        </span>
                        <span className="text-sm text-slate-500 flex-1">{data.count} tenants</span>
                        <span className="text-sm font-extrabold text-slate-800">₹{data.revenue.toLocaleString()}<span className="text-xs text-slate-400 font-normal">/mo</span></span>
                      </div>
                    ))}
                    {Object.keys(revenue.breakdown || {}).length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-8">No active subscriptions yet.</p>
                    )}
                  </div>
                </div>

                {/* Platform Stats */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Shipments (All Tenants)</p>
                    <p className="text-3xl font-black text-slate-800">{revenue.totalShipments || 0}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Users (All Tenants)</p>
                    <p className="text-3xl font-black text-slate-800">{revenue.totalUsers || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Manage Plan Modal ─────────────────────────────────────── */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedTenant(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-800">Manage Plan</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedTenant.name}</p>
              </div>
              <button onClick={() => setSelectedTenant(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <div className="p-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Select New Plan</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { id: 'trial',      label: 'Trial',      price: 'Free · 50 shipments' },
                  { id: 'basic',      label: 'Basic',      price: '₹999/mo · 500' },
                  { id: 'pro',        label: 'Pro',        price: '₹2,999/mo · 2000' },
                  { id: 'enterprise', label: 'Enterprise', price: 'Custom · Unlimited' },
                ].map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => updatePlan(selectedTenant.id, plan.id)}
                    className={`text-left p-4 rounded-xl border-2 transition font-semibold text-sm ${
                      selectedTenant.plan === plan.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 text-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-sm mb-1">{plan.label}</div>
                    <div className="text-xs text-slate-400 font-normal">{plan.price}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => deleteTenant(selectedTenant.id, selectedTenant.name)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm transition"
              >
                <Trash2 size={15} /> Delete Tenant Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
