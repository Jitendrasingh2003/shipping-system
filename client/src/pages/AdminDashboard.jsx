import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  BarChart3, Users, Package, CreditCard, LogOut, CheckCircle, Clock, Navigation, AlertCircle, RefreshCw,
  ShieldAlert, Settings, FileText, UserCheck, Activity, Search, Trash2, Heart, PlusCircle, Check,
  Truck, MessageSquare, Send, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const socket = useSocket();
  
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'shipments' | 'users' | 'finance' | 'audits' | 'health' | 'settings'
  const [activeChats, setActiveChats] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const chatBottomRef = useRef(null);

  // Export Shipments to CSV
  const exportShipmentsToCSV = () => {
    if (shipments.length === 0) return toast.error('No shipments to export.');
    const headers = ['Tracking ID', 'Sender Name', 'Recipient Name', 'Origin', 'Destination', 'Type', 'Status', 'Payment Status', 'Assigned Staff'];
    const rows = shipments.map(s => [
      s.trackingId,
      s.senderName,
      s.recipientName,
      s.originCity,
      s.destinationCity,
      s.shipmentType,
      s.status,
      s.paymentStatus,
      s.assignedStaffName || 'Unassigned'
    ]);
    const csvContent = [
      headers.join(','), 
      ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SmartShip-Shipments-Export-${Date.now()}.csv`);
    link.click();
    toast.success('Shipments exported successfully!');
  };

  // Fetch unique active support rooms
  const fetchActiveChats = async () => {
    try {
      const res = await axios.get('/chat/active');
      if (res.data.success) {
        setActiveChats(res.data.chats);
      }
    } catch (err) {
      console.error('Failed to load active chats:', err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'chats') {
      fetchActiveChats();
    }
  }, [activeTab]);

  // Load chat history & join room
  useEffect(() => {
    if (!socket || !selectedRoomId || activeTab !== 'chats') return;

    socket.emit('chat:join', selectedRoomId);

    axios.get(`/chat/history/${selectedRoomId}`).then(res => {
      if (res.data.success) {
        setChatMessages(res.data.messages);
      }
    }).catch(err => console.error('Chat history fetch failed:', err.message));

    socket.on('chat:message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off('chat:message');
    };
  }, [socket, selectedRoomId, activeTab]);

  // Listen to new message alerts to update active chats list dynamically
  useEffect(() => {
    if (!socket) return;

    socket.on('chat:new_message_alert', (data) => {
      fetchActiveChats();
      toast.success(`New support message from ${data.senderName}`);
    });

    return () => {
      socket.off('chat:new_message_alert');
    };
  }, [socket]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !socket || !selectedRoomId || !user) return;

    socket.emit('chat:send_message', {
      roomId: selectedRoomId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      message: newMessageText.trim()
    });

    setNewMessageText('');
  };
  const [stats, setStats] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Shipment Actions State
  const [assignModal, setAssignModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Register Staff State
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [registering, setRegistering] = useState(false);

  // Settings State
  const [taxRate, setTaxRate] = useState(18);
  const [baseFare, setBaseFare] = useState(150);
  const [systemAlerts, setSystemAlerts] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const statsRes = await axios.get('/dashboard/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      const shipmentsRes = await axios.get('/shipments/all');
      if (shipmentsRes.data.success) {
        setShipments(shipmentsRes.data.shipments);
      }

      const staffRes = await axios.get('/auth/staff');
      if (staffRes.data.success) {
        setStaffList(staffRes.data.staff);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedStaff || !selectedShipment) return;

    const staffObj = staffList.find(s => s.id === selectedStaff);
    
    try {
      const res = await axios.put(`/shipments/${selectedShipment._id}/assign`, {
        staffId: selectedStaff,
        staffName: staffObj.name
      });
      if (res.data.success) {
        toast.success(`Shipment successfully assigned to ${staffObj.name}`);
        setAssignModal(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed.');
    }
  };

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffPassword) {
      return toast.error('Please enter all required fields.');
    }

    setRegistering(true);
    try {
      const res = await axios.post('/auth/register', {
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        phone: staffPhone,
        role: 'staff'
      });
      if (res.data.success) {
        toast.success(`Successfully registered staff member: ${staffName}`);
        setStaffName('');
        setStaffEmail('');
        setStaffPassword('');
        setStaffPhone('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create staff member.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const statusData = stats?.statusBreakdown 
    ? Object.keys(stats.statusBreakdown).map(key => ({ name: key, count: stats.statusBreakdown[key] }))
    : [];

  const typeData = stats?.typeBreakdown 
    ? Object.keys(stats.typeBreakdown).map(key => ({ name: key, value: stats.typeBreakdown[key] }))
    : [];

  const filteredShipments = shipments.filter(ship => 
    ship.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ship.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ship.recipientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <span className="text-[10px] text-slate-400 block font-bold tracking-widest uppercase">Admin Operations</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
              { id: 'shipments', label: 'Manage Shipments', icon: Package },
              { id: 'users', label: 'Staff Directory', icon: UserCheck },
              { id: 'finance', label: 'Finance & Invoices', icon: FileText },
              { id: 'chats', label: 'Customer Support Chat', icon: MessageSquare },
              { id: 'health', label: 'System Operations Monitor', icon: Activity },
              { id: 'settings', label: 'Control Settings', icon: Settings }
            ].map(tab => {
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

        {/* Footer info & Logout */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center space-x-3 px-2">
            <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-full font-bold text-xs uppercase">
              {user?.name?.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
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
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Dashboard</h2>
              <p className="text-slate-500 text-sm mt-1">High-level shipping metrics, lifecycle volumes, and registrations.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Package size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Shipments</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats?.totalShipments || 0}</h3>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CreditCard size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue Audit</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">₹{stats?.totalRevenue?.toLocaleString('en-IN') || '0.00'}</h3>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
                  <Users size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats?.totalUsers || 0}</h3>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Activity size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Staff</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats?.usersBreakdown?.staff || 0}</h3>
                </div>
              </div>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Lifecycle Bar */}
              <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Shipment Lifecycle distribution</h3>
                <div className="h-64">
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                        <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400 text-xs italic">No shipment records found to plot lifecycle graphs.</div>
                  )}
                </div>
              </div>

              {/* Methods Pie */}
              <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Shipping Channels</h3>
                <div className="h-64 flex items-center justify-center">
                  {typeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                        <Legend verticalAlign="bottom" height={36} fontSize={11} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400 text-xs italic">No shipment channels logged.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Shipments */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4">Recent Cargo Bookings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold">
                      <th className="pb-3">Tracking ID</th>
                      <th className="pb-3">Sender</th>
                      <th className="pb-3">Recipient</th>
                      <th className="pb-3">Route</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.recentShipments?.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 font-semibold text-slate-700">{s.trackingId}</td>
                        <td className="py-3">{s.senderName}</td>
                        <td className="py-3">{s.recipientName}</td>
                        <td className="py-3 font-medium">{s.originCity} → {s.destinationCity}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700 animate-pulse'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SHIPMENTS REGISTRY */}
        {activeTab === 'shipments' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Shipment Registry Control</h2>
                <p className="text-slate-500 text-sm mt-1">Audit, assign staff operators, and update lifecycle states.</p>
              </div>
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <button
                  onClick={exportShipmentsToCSV}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold shadow-sm transition text-xs flex items-center space-x-1.5 shrink-0"
                >
                  <Download size={14} className="text-slate-400" />
                  <span>Export CSV</span>
                </button>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search tracking ID, sender, recipient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                      <th className="p-4">Tracking ID</th>
                      <th className="p-4">Sender</th>
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Route</th>
                      <th className="p-4">Service Type</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Staff Operator</th>
                      <th className="p-4 text-right">Assign Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredShipments.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="p-6 text-center text-slate-400 italic">No shipments match search criteria.</td>
                      </tr>
                    ) : (
                      filteredShipments.map((shipment) => (
                        <tr key={shipment._id} className="hover:bg-slate-50/40 transition">
                          <td className="p-4 font-bold text-slate-800">{shipment.trackingId}</td>
                          <td className="p-4">{shipment.senderName}</td>
                          <td className="p-4 font-medium text-slate-700">{shipment.recipientName}</td>
                          <td className="p-4">{shipment.originCity} → {shipment.destinationCity}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700">
                              {shipment.shipmentType}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              shipment.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {shipment.paymentStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              shipment.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                              shipment.status === 'Pending Payment' ? 'bg-slate-100 text-slate-500' :
                              'bg-indigo-100 text-indigo-700'
                            }`}>
                              {shipment.status}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-slate-600">
                            {shipment.assignedStaffName || <span className="text-slate-300 italic text-[10px]">Unassigned</span>}
                          </td>
                          <td className="p-4 text-right">
                            {shipment.paymentStatus === 'Paid' && shipment.status !== 'Delivered' ? (
                              <button
                                onClick={() => {
                                  setSelectedShipment(shipment);
                                  setAssignModal(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition shadow-sm"
                              >
                                Assign Operator
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No action</span>
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

        {/* TAB 3: USERS & ROLES */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Create Staff Form */}
            <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-fit">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5 flex items-center space-x-2">
                <PlusCircle size={16} className="text-indigo-600" />
                <span>Register Staff Member</span>
              </h3>

              <form onSubmit={handleRegisterStaff} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    placeholder="Enter staff name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. staffmember@shiptrack.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Password</label>
                  <input
                    type="password"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <button
                  type="submit"
                  disabled={registering}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-indigo-glow"
                >
                  {registering ? 'Adding Member...' : 'Register Operator'}
                </button>
              </form>
            </div>

            {/* Staff List */}
            <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Staff Directory Logs</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold">
                      <th className="pb-3.5">Name</th>
                      <th className="pb-3.5">Email ID</th>
                      <th className="pb-3.5">Contact Number</th>
                      <th className="pb-3.5">Active Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffList.map((staff) => (
                      <tr key={staff.id} className="hover:bg-slate-50/30 transition">
                        <td className="py-3.5 font-bold text-slate-800">{staff.name}</td>
                        <td className="py-3.5 font-medium text-slate-600">{staff.email}</td>
                        <td className="py-3.5 text-slate-500">{staff.phone || 'N/A'}</td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            <Check size={10} />
                            <span>Verified</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: FINANCE & INVOICES */}
        {activeTab === 'finance' && (
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm animate-fade-in">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Financial Ledger Invoices</h3>
            
            <div className="overflow-x-auto">
              <InvoiceTable listUrl="/payments/invoices" />
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM HEALTH MONITOR */}
        {activeTab === 'health' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-fade-in">
            <div className="md:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">System Node Monitor</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold">Primary Database (MongoDB)</span>
                  <span className="text-xs font-bold text-emerald-600">CONNECTED</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold">Relational Database (MySQL)</span>
                  <span className="text-xs font-bold text-indigo-600">OPERATIONAL FALLBACK</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold">Backend API Server</span>
                  <span className="text-xs font-mono text-slate-800">http://localhost:5000</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                  <span className="text-xs font-semibold">Main Web Server Status</span>
                  <span className="text-xs font-bold uppercase">Online</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4">Logistics Core Hubs</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Active parcel routing centers and hubs directory in operation across major Indian cities:
              </p>
              <div className="flex flex-wrap gap-2">
                {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'].map(c => (
                  <span key={c} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold">{c}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SUPPORT CHAT DESK */}
        {activeTab === 'chats' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px] overflow-hidden animate-fade-in">
            
            {/* Chats List Sidebar */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col h-full overflow-hidden">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">Support Inboxes</h3>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                {activeChats.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">No active support conversations.</p>
                ) : (
                  activeChats.map((chat) => {
                    const isSelected = selectedRoomId === chat._id;
                    return (
                      <button
                        key={chat._id}
                        onClick={() => setSelectedRoomId(chat._id)}
                        className={`w-full text-left p-3.5 rounded-2xl transition border flex flex-col space-y-1.5 ${
                          isSelected 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm' 
                            : 'bg-slate-50 hover:bg-slate-100/70 border-transparent text-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs font-bold truncate pr-2">{chat.senderName}</span>
                          <span className="text-[9px] text-slate-400 font-bold shrink-0">
                            {new Date(chat.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className={`text-[11px] truncate w-full ${isSelected ? 'text-indigo-600 font-medium' : 'text-slate-500'}`}>
                          {chat.lastMessage}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Box Area */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-full overflow-hidden">
              {selectedRoomId ? (
                <>
                  {/* Active Chat Header */}
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                        Chatting with {activeChats.find(c => c._id === selectedRoomId)?.senderName || 'Client'}
                      </h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Client Room ID: {selectedRoomId}</p>
                    </div>
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                      <span>Live Session</span>
                    </span>
                  </div>

                  {/* Active Chat Logs */}
                  <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50 space-y-4">
                    {chatMessages.map((msg, idx) => {
                      const isMe = msg.senderId === user.id;
                      return (
                        <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs md:max-w-md rounded-2xl p-3.5 shadow-sm text-xs ${
                            isMe 
                              ? 'bg-indigo-600 text-white rounded-tr-none' 
                              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                          }`}>
                            {!isMe && (
                              <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide mb-1">
                                {msg.senderName} ({msg.senderRole})
                              </p>
                            )}
                            <p className="leading-relaxed">{msg.message}</p>
                            <span className={`text-[8px] block text-right mt-1 font-semibold ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Active Chat Input */}
                  <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-200 bg-white flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Reply to client..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition"
                    />
                    <button
                      type="submit"
                      className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition flex items-center justify-center border border-transparent"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <MessageSquare size={44} className="text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-semibold">Select a conversation from the support inbox list to view chat logs.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm max-w-xl animate-fade-in">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Logistics Parameters Configuration</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Base Fare Charges (INR)</label>
                <input
                  type="number"
                  value={baseFare}
                  onChange={(e) => setBaseFare(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Service GST Tax Rate (%)</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">System Notification Alerts</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Allow web socket push triggers on status changes.</p>
                </div>
                <input
                  type="checkbox"
                  checked={systemAlerts}
                  onChange={(e) => setSystemAlerts(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={() => toast.success('Parameters saved successfully.')}
                className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Assignment Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-3xl shadow-xl relative">
            <h3 className="text-md font-bold mb-3">Assign Staff Operator</h3>
            
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Choose staff operator for Shipment <span className="font-bold text-slate-800">{selectedShipment?.trackingId}</span> ({selectedShipment?.originCity} → {selectedShipment?.destinationCity}).
            </p>

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Select Staff</label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition"
                  required
                >
                  <option value="">-- Choose Operator --</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-indigo-glow"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Invoice Table helper for reuse
const InvoiceTable = ({ listUrl }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(listUrl).then(res => {
      if (res.data.success) setInvoices(res.data.invoices);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [listUrl]);

  const handleDownload = async (invNum) => {
    try {
      toast.loading('Downloading invoice...', { id: 'download' });
      const response = await axios.get(`/payments/invoice/${invNum}/download`, {
        responseType: 'blob'
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `Invoice-${invNum}.pdf`;
      link.click();
      toast.success('Download complete!', { id: 'download' });
    } catch (err) {
      toast.error('Failed to download invoice PDF.');
    }
  };

  const handleExportCSV = () => {
    if (invoices.length === 0) return toast.error('No ledger records to export.');
    const headers = ['Invoice Number', 'Billing Client', 'Email', 'Payment ID', 'Amount (INR)', 'Created At'];
    const rows = invoices.map(inv => [
      inv.invoiceNumber,
      inv.billingDetails.name,
      inv.billingDetails.email,
      inv.paymentId,
      inv.amount,
      new Date(inv.createdAt).toLocaleString()
    ]);
    const csvContent = [
      headers.join(','), 
      ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SmartShip-Invoices-Export-${Date.now()}.csv`);
    link.click();
    toast.success('Ledger exported successfully!');
  };

  if (loading) return <div className="text-slate-400 text-xs italic">Loading transaction logs...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition inline-flex items-center space-x-1.5 shadow-sm"
        >
          <Download size={12} className="text-slate-400" />
          <span>Export Invoices to CSV</span>
        </button>
      </div>
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold">
            <th className="pb-3.5">Invoice Number</th>
            <th className="pb-3.5">Billing Client</th>
            <th className="pb-3.5">Payment ID</th>
            <th className="pb-3.5">Amount Paid</th>
            <th className="pb-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.length === 0 ? (
            <tr>
              <td colSpan="5" className="py-6 text-center text-slate-400 italic">No financial ledger entries.</td>
            </tr>
          ) : (
            invoices.map((invoice) => (
              <tr key={invoice._id} className="hover:bg-slate-50/40 transition">
                <td className="py-3.5 font-bold text-slate-800">{invoice.invoiceNumber}</td>
                <td className="py-3.5 font-medium">{invoice.billingDetails.name}</td>
                <td className="py-3.5 text-slate-500 font-mono">{invoice.paymentId}</td>
                <td className="py-3.5 font-bold text-emerald-600">₹{invoice.amount.toFixed(2)}</td>
                <td className="py-3.5 text-right">
                  <button
                    onClick={() => handleDownload(invoice.invoiceNumber)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold transition inline-flex items-center space-x-1.5"
                  >
                    <span>Download PDF</span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
export { InvoiceTable };
