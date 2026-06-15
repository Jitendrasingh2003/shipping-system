import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Package, MapPin, CheckCircle, Clock, LogOut, RefreshCw, Send,
  Truck, ClipboardList, User, Award, Shield, ChevronRight, Activity, Calendar, Phone, MapPinIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_PIPELINE = ['Booked', 'Picked up', 'In Transit', 'Out for Delivery', 'Delivered'];

const StaffDashboard = () => {
  const { logout, user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'active' | 'history' | 'profile'
  const [stats, setStats] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Update Status Modal State
  const [statusModal, setStatusModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch staff dashboard stats
      const statsRes = await axios.get('/dashboard/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      // Fetch shipments assigned to staff
      const shipmentsRes = await axios.get('/shipments/staff');
      if (shipmentsRes.data.success) {
        setShipments(shipmentsRes.data.shipments);
      }
    } catch (err) {
      toast.error('Failed to load portal data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!newStatus || !selectedShipment) return;
    if (!currentLocation.trim()) {
      return toast.error('Please specify current transit location/hub name.');
    }

    setUpdating(true);
    try {
      const res = await axios.put(`/shipments/${selectedShipment._id}/status`, {
        status: newStatus,
        location: currentLocation.trim()
      });
      if (res.data.success) {
        toast.success(`Shipment status updated to: ${newStatus}`);
        setStatusModal(false);
        setNewStatus('');
        setCurrentLocation('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed.');
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = (currentStatus) => {
    const currentIndex = STATUS_PIPELINE.indexOf(currentStatus);
    if (currentIndex !== -1 && currentIndex < STATUS_PIPELINE.length - 1) {
      return STATUS_PIPELINE[currentIndex + 1];
    }
    return currentStatus;
  };

  const openStatusUpdate = (shipment) => {
    setSelectedShipment(shipment);
    setNewStatus(getNextStatus(shipment.status));
    setCurrentLocation(shipment.history?.[shipment.history.length - 1]?.location || '');
    setStatusModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Filter shipments
  const activeDeliveries = shipments.filter(s => s.status !== 'Delivered' && s.status !== 'Cancelled' && s.status !== 'Pending Payment');
  const historyDeliveries = shipments.filter(s => s.status === 'Delivered' || s.status === 'Cancelled');

  const filteredActive = activeDeliveries.filter(s => 
    s.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.destinationCity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Success rate calculator
  const totalAssigned = stats?.totalAssigned || 0;
  const completedAssigned = stats?.completedAssigned || 0;
  const successRate = totalAssigned === 0 ? 100 : Math.round((completedAssigned / totalAssigned) * 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-5 z-20">
        <div className="space-y-6">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 px-2 py-3 border-b border-slate-100">
            <div className="bg-indigo-600 p-2 text-white rounded-xl">
              <Truck size={20} />
            </div>
            <div>
              <span className="font-extrabold text-slate-800 text-lg leading-none">SmartShip</span>
              <span className="text-[10px] text-indigo-600 block font-bold tracking-widest uppercase mt-0.5">Staff Console</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'My Dashboard', icon: ClipboardList },
              { id: 'active', label: 'Active Deliveries', icon: Truck, count: activeDeliveries.length },
              { id: 'history', label: 'Completed History', icon: Clock },
              { id: 'profile', label: 'Operator Profile', icon: User }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition duration-150 ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center space-x-3 px-2">
            <div className="bg-indigo-100 text-indigo-600 h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm uppercase">
              {user?.name?.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate leading-none mb-1">{user?.name}</p>
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold tracking-wider uppercase">LOGISTICS STAFF</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold transition duration-150"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto">
        
        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight capitalize">
              {activeTab === 'dashboard' && 'Operations Dashboard'}
              {activeTab === 'active' && 'Active Deliveries'}
              {activeTab === 'history' && 'Completed Shipments'}
              {activeTab === 'profile' && 'Carrier Profile'}
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              {activeTab === 'dashboard' && 'Manage your active deliveries, view KPIs, and track logistics performance metrics.'}
              {activeTab === 'active' && 'Review assigned shipments, update transit hubs, and mark deliveries as complete.'}
              {activeTab === 'history' && 'Audit logs of completed, delivered, or cancelled logistics routes.'}
              {activeTab === 'profile' && 'Verify your logistics operator credentials, success ratings, and statistics.'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchData}
              className="flex items-center space-x-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold shadow-sm transition text-xs"
            >
              <RefreshCw size={14} className="text-slate-400" />
              <span>Reload Panel</span>
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/30 border border-indigo-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">Logistics Desk</span>
                <h2 className="text-xl font-bold text-slate-800">Hello, {user?.name}!</h2>
                <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
                  You have <span className="font-bold text-indigo-600">{activeDeliveries.length} active routes</span> assigned for delivery. Keep our delivery commitments accurate by updating Hub points in real-time.
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4 shrink-0">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Award size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Fulfillment Rating</p>
                  <h4 className="text-lg font-extrabold text-slate-800">{successRate}% Success</h4>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="premium-card p-5 rounded-2xl flex items-center space-x-4">
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Package size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Assigned Cargo</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalAssigned}</h3>
                </div>
              </div>

              <div className="premium-card p-5 rounded-2xl flex items-center space-x-4">
                <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Truck size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Delivery Workload</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{activeDeliveries.length}</h3>
                </div>
              </div>

              <div className="premium-card p-5 rounded-2xl flex items-center space-x-4">
                <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivered Packages</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{completedAssigned}</h3>
                </div>
              </div>
            </div>

            {/* Recent Tasks Widget */}
            <div className="premium-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Assigned Transit Overview</h3>
                <button 
                  onClick={() => setActiveTab('active')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-0.5"
                >
                  <span>View all shipments</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold">
                      <th className="pb-3">Tracking ID</th>
                      <th className="pb-3">Recipient Name</th>
                      <th className="pb-3">Route Path</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Current Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shipments.slice(0, 5).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-400 italic">No shipments assigned to you.</td>
                      </tr>
                    ) : (
                      shipments.slice(0, 5).map((s) => (
                        <tr key={s._id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 font-bold text-slate-800">{s.trackingId}</td>
                          <td className="py-3.5 font-medium text-slate-700">{s.recipientName}</td>
                          <td className="py-3.5">{s.originCity} → {s.destinationCity}</td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                              {s.shipmentType}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                              s.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            {s.status !== 'Delivered' && s.status !== 'Cancelled' ? (
                              <button
                                onClick={() => openStatusUpdate(s)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition text-[10px]"
                              >
                                Update Status
                              </button>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">No Actions</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE DELIVERIES */}
        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-600">Showing {filteredActive.length} Assigned Parcels</span>
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search by Tracking ID, recipient, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 pl-9 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                />
                <Truck size={14} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            {/* Cargo Cards Grid */}
            {filteredActive.length === 0 ? (
              <div className="premium-card p-10 rounded-2xl text-center text-slate-400 italic">
                No active assigned shipments match your criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredActive.map((s) => (
                  <div key={s._id} className="premium-card rounded-2xl overflow-hidden hover:shadow-md transition border border-slate-200 flex flex-col justify-between">
                    
                    {/* Card Header */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-indigo-600 block">{s.trackingId}</span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{s.shipmentType} Shipping</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
                        <Activity size={10} className="animate-spin text-amber-600" />
                        <span>{s.status}</span>
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-4 flex-1">
                      
                      {/* Destination path */}
                      <div className="flex items-center space-x-3 justify-between">
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">ORIGIN</span>
                          <p className="text-xs font-bold text-slate-700 truncate">{s.originCity}</p>
                        </div>
                        <div className="flex-1 border-t border-dashed border-slate-300 mx-4 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                            <Truck size={12} className="text-slate-400" />
                          </div>
                        </div>
                        <div className="text-right min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">DESTINATION</span>
                          <p className="text-xs font-bold text-slate-700 truncate">{s.destinationCity}</p>
                        </div>
                      </div>

                      {/* Recipient info */}
                      <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">{s.recipientName}</span>
                          <a href={`tel:${s.recipientPhone}`} className="flex items-center space-x-1 text-indigo-600 hover:underline font-semibold text-[10px]">
                            <Phone size={10} />
                            <span>Contact Client</span>
                          </a>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          <MapPin size={10} className="inline mr-1 text-slate-400" />
                          {s.recipientAddress}
                        </p>
                      </div>

                      {/* Cargo parameters */}
                      <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-500 font-semibold border-t border-slate-100 pt-3">
                        <div>
                          <span>Parcel Weight: </span>
                          <span className="text-slate-700 font-bold">{s.weight} kg</span>
                        </div>
                        <div className="text-right">
                          <span>Last Location: </span>
                          <span className="text-indigo-600 font-bold">
                            {s.history?.[s.history.length - 1]?.location || 'N/A'}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/20 flex justify-end">
                      <button
                        onClick={() => openStatusUpdate(s)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        Update Transit Progress
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LOGISTICS HISTORY */}
        {activeTab === 'history' && (
          <div className="premium-card p-6 rounded-2xl bg-white animate-fade-in">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-5">Completed Deliveries History Ledger</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="pb-3.5">Tracking ID</th>
                    <th className="pb-3.5">Recipient Client</th>
                    <th className="pb-3.5">Route Cities</th>
                    <th className="pb-3.5">Type</th>
                    <th className="pb-3.5">Delivered Location</th>
                    <th className="pb-3.5">Completed Date</th>
                    <th className="pb-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-slate-400 italic">No completed delivery history records.</td>
                    </tr>
                  ) : (
                    historyDeliveries.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50/40 transition">
                        <td className="py-3.5 font-bold text-slate-800">{s.trackingId}</td>
                        <td className="py-3.5 font-medium">{s.recipientName}</td>
                        <td className="py-3.5">{s.originCity} → {s.destinationCity}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded font-bold bg-slate-50 text-slate-600 border border-slate-100">
                            {s.shipmentType}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-600 font-medium">
                          {s.history?.[s.history.length - 1]?.location || 'N/A'}
                        </td>
                        <td className="py-3.5 text-slate-400 font-medium">
                          {new Date(s.updatedAt).toLocaleDateString()} at {new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CARRIER PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl space-y-8 animate-fade-in">
            {/* Main profile card */}
            <div className="premium-card p-6 rounded-3xl bg-white flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="h-20 w-20 bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white rounded-full flex items-center justify-center font-bold text-3xl shadow-md border-4 border-indigo-50 shrink-0">
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-4 text-center md:text-left flex-1">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
                  <p className="text-xs font-semibold text-slate-400">SmartShip Registered Logistics Officer</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-slate-100 py-4 text-xs">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <span className="font-bold text-slate-400 uppercase w-16 text-[9px]">EMAIL:</span>
                    <span className="font-semibold">{user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <span className="font-bold text-slate-400 uppercase w-16 text-[9px]">MOBILE:</span>
                    <span className="font-semibold">{user?.phone || 'Not Configured'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <span className="font-bold text-slate-400 uppercase w-16 text-[9px]">PORTAL ID:</span>
                    <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded text-[10px]">{user?.id}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <span className="font-bold text-slate-400 uppercase w-16 text-[9px]">ACCURACIES:</span>
                    <span className="font-bold text-indigo-600">{successRate}% Completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Standards info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="premium-card p-5 rounded-2xl bg-white space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Shield size={16} className="text-indigo-600" />
                  <span>Security & Standards</span>
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Logistics operators must follow verification procedures. Make sure to collect confirmation tags or verify identity proof when updating parcel statuses to <b>Delivered</b>.
                </p>
              </div>

              <div className="premium-card p-5 rounded-2xl bg-white space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Award size={16} className="text-amber-500" />
                  <span>Fulfillment Milestones</span>
                </h4>
                <div className="space-y-2 text-[11px] text-slate-600 font-semibold">
                  <div className="flex justify-between">
                    <span>Delivered Parcels:</span>
                    <span className="text-slate-800 font-bold">{completedAssigned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Workload limit:</span>
                    <span className="text-slate-800 font-bold">Unlimited</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carrier Status:</span>
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold">Active & Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Progress update Modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg p-6 rounded-3xl shadow-xl relative">
            <h3 className="text-md font-bold mb-2">Update Delivery Node</h3>
            
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Report transit facility status updates for shipment <span className="font-bold text-slate-800">{selectedShipment?.trackingId}</span>.
            </p>

            {/* Stepper visualization */}
            <div className="mb-8 relative px-2">
              <div className="absolute top-[13px] left-8 right-8 h-0.5 bg-slate-100"></div>
              {/* Completed lines */}
              <div 
                className="absolute top-[13px] left-8 h-0.5 bg-indigo-600 transition-all duration-300"
                style={{
                  width: `${
                    (Math.max(0, STATUS_PIPELINE.indexOf(selectedShipment?.status)) / (STATUS_PIPELINE.length - 1)) * 100
                  }%`
                }}
              ></div>

              <div className="flex justify-between relative">
                {STATUS_PIPELINE.map((step, idx) => {
                  const currentIdx = STATUS_PIPELINE.indexOf(selectedShipment?.status);
                  const isCompleted = idx < currentIdx;
                  const isActive = idx === currentIdx;
                  const isPending = idx > currentIdx;

                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className={`z-10 h-7 w-7 rounded-full flex items-center justify-center border-4 text-[10px] font-bold transition-all duration-300 ${
                        isCompleted ? 'bg-indigo-600 border-indigo-100 text-white' :
                        isActive ? 'bg-indigo-50 border-indigo-600 text-indigo-600 animate-pulse' :
                        'bg-white border-slate-200 text-slate-400'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[9px] mt-2 font-bold text-center block ${
                        isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-400'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Choose New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition"
                  required
                >
                  <option value="Picked up">Picked up (Parcel loaded at shipper hub)</option>
                  <option value="In Transit">In Transit (Moving between cities/hubs)</option>
                  <option value="Out for Delivery">Out for Delivery (Near customer address)</option>
                  <option value="Delivered">Delivered (Handed to customer)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Current Location / Hub Facility</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Bangalore Sorting Hub"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                    required
                  />
                  <MapPin className="absolute left-3 top-3 text-slate-400" size={14} />
                </div>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStatusModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Send size={12} />
                  <span>{updating ? 'Updating...' : 'Submit Progress'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffDashboard;
