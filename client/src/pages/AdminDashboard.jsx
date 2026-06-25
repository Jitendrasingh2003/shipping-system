import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  BarChart3, Users, Package, CreditCard, LogOut, CheckCircle, Clock, Navigation, AlertCircle, RefreshCw,
  ShieldAlert, Settings, FileText, UserCheck, Activity, Search, Trash2, Heart, PlusCircle, Check,
  Truck, MessageSquare, Send, Download, Layers, Map, Coins, Warehouse, Eye, EyeOff, Compass, Sun, Cloud, CloudLightning, Anchor,
  QrCode, Camera, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const socket = useSocket();

  const [lang, setLang] = useState('en');
  const t = (key) => {
    const dict = {
      en: {
        dbOverview: 'Dashboard Overview',
        liveFeed: 'LIVE FEED TELEMETRY',
        totalShipments: 'Total Shipments',
        revenueAudit: 'Revenue Audit (INR)',
        activeUsers: 'Active Users',
        fleetStatus: 'Fleet Status',
        lifecycleVolume: 'Shipment Lifecycle Volume',
        shippingChannels: 'Shipping Channels',
        recentOps: 'Recent Operations Feed',
        weatherHub: 'Hub Weather Conditions',
        warehouseOccupancy: 'Warehouse Occupancy',
        totalLoad: 'Total Load Used',
        freeSpace: 'Free Space',
        transitOnline: 'Transit Vehicles Online'
      },
      hi: {
        dbOverview: 'डैशबोर्ड सिंहावलोकन',
        liveFeed: 'लाइव फीड टेलीमेट्री',
        totalShipments: 'कुल शिपमेंट',
        revenueAudit: 'राजस्व लेखापरीक्षा (INR)',
        activeUsers: 'सक्रिय उपयोगकर्ता',
        fleetStatus: 'वाहन बेड़े की स्थिति',
        lifecycleVolume: 'शिपमेंट जीवनचक्र मात्रा',
        shippingChannels: 'शिपिंग चैनल (माध्यम)',
        recentOps: 'हालिया संचालन फ़ीड',
        weatherHub: 'हब मौसम की स्थिति',
        warehouseOccupancy: 'वेयरहाउस अधिभोग (लोड)',
        totalLoad: 'कुल प्रयुक्त वजन',
        freeSpace: 'खाली स्थान',
        transitOnline: 'पारगमन वाहन ऑनलाइन'
      }
    };
    return dict[lang][key] || key;
  };

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'shipments' | 'users' | 'finance' | 'audits' | 'health' | 'settings'
  const [activeChats, setActiveChats] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const chatBottomRef = useRef(null);

  // Export Shipments to CSV
  const exportShipmentsToCSV = () => {
    if (shipments.length === 0) return toast.error('No shipments to export.');
    const headers = ['Tracking ID', 'Sender Name', 'Recipient Name', 'Origin', 'Destination', 'Type', 'Fleet Vehicle', 'Status', 'Payment Status', 'Assigned Staff'];
    const rows = shipments.map(s => [
      s.trackingId,
      s.senderName,
      s.recipientName,
      s.originCity,
      s.destinationCity,
      s.shipmentType,
      s.fleetVehicleName || 'N/A',
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
    link.setAttribute('download', `MarineBytes-Shipments-Export-${Date.now()}.csv`);
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

  // Support Tickets State
  const [tickets, setTickets] = useState([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  // Shipment Actions State
  const [assignModal, setAssignModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [qrModal, setQrModal] = useState(false);
  const [scannedTrackingId, setScannedTrackingId] = useState('');

  // Register Staff State
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Settings State
  const [taxRate, setTaxRate] = useState(18);
  const [baseFare, setBaseFare] = useState(150);
  const [systemAlerts, setSystemAlerts] = useState(true);

  // New Logistics States (MySQL Backed)
  const [warehouses, setWarehouses] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [rates, setRates] = useState({
    base_fare: 150,
    tax_rate: 18,
    per_kg_fare: 50,
    express_multiplier: 1.5,
    air_multiplier: 2.5,
    ocean_multiplier: 0.8
  });
  
  const [warehouseModal, setWarehouseModal] = useState(false);
  const [fleetModal, setFleetModal] = useState(false);
  const [selectedTransitShipment, setSelectedTransitShipment] = useState(null);

  // Warehouse Form State
  const [wName, setWName] = useState('');
  const [wLocation, setWLocation] = useState('');
  const [wCapacity, setWCapacity] = useState('');
  const [wManager, setWManager] = useState('');

  // Fleet Form State
  const [fNumber, setFNumber] = useState('');
  const [fType, setFType] = useState('Truck');
  const [fDriver, setFDriver] = useState('');
  const [fCapacity, setFCapacity] = useState('');

  // Staff Performance State
  const [staffPerformance, setStaffPerformance] = useState([]);

  // Block/Unblock State
  const [blockingUserId, setBlockingUserId] = useState(null);

  // Bulk Assign State
  const [selectedShipmentIds, setSelectedShipmentIds] = useState([]);
  const [bulkAssignModal, setBulkAssignModal] = useState(false);
  const [bulkStaffId, setBulkStaffId] = useState('');
  const [shipmentFilter, setShipmentFilter] = useState('all'); // 'all' | 'domestic' | 'international'

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

      // Fetch MySQL Logistics data
      const whRes = await axios.get('/logistics/warehouses');
      if (whRes.data.success) {
        setWarehouses(whRes.data.warehouses);
      }

      const flRes = await axios.get('/logistics/fleet');
      if (flRes.data.success) {
        setFleet(flRes.data.fleet);
      }

      const ratesRes = await axios.get('/logistics/rates');
      if (ratesRes.data.success && Object.keys(ratesRes.data.rates).length > 0) {
        setRates(ratesRes.data.rates);
        // Also update the local state fallback settings
        if (ratesRes.data.rates.base_fare) setBaseFare(ratesRes.data.rates.base_fare);
        if (ratesRes.data.rates.tax_rate) setTaxRate(ratesRes.data.rates.tax_rate);
      }

      // Fetch Support & Bug Tickets
      const ticketsRes = await axios.get('/shipments/tickets');
      if (ticketsRes.data.success) {
        setTickets(ticketsRes.data.tickets);
      }

      // Fetch Staff Performance
      const perfRes = await axios.get('/shipments/staff-performance');
      if (perfRes.data.success) {
        setStaffPerformance(perfRes.data.performance);
      }
    } catch (err) {
      console.error('Failed to load logistics parameters:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      const res = await axios.put(`/shipments/tickets/${ticketId}/resolve`);
      if (res.data.success) {
        toast.success('Ticket marked as resolved.');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to resolve ticket.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create Warehouse in MySQL
  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/logistics/warehouses', {
        name: wName,
        location: wLocation,
        capacity: parseFloat(wCapacity),
        managerName: wManager
      });
      if (res.data.success) {
        toast.success('Warehouse successfully registered in MySQL.');
        setWarehouseModal(false);
        setWName('');
        setWLocation('');
        setWCapacity('');
        setWManager('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add warehouse.');
    }
  };

  // Delete Warehouse from MySQL
  const handleDeleteWarehouse = async (id) => {
    if (!confirm('Are you sure you want to delete this warehouse from MySQL?')) return;
    try {
      const res = await axios.delete(`/logistics/warehouses/${id}`);
      if (res.data.success) {
        toast.success('Warehouse removed from MySQL.');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to remove warehouse.');
    }
  };

  // Create Fleet Vehicle in MySQL
  const handleCreateFleet = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/logistics/fleet', {
        vehicleNumber: fNumber,
        vehicleType: fType,
        driverName: fDriver,
        capacity: parseFloat(fCapacity)
      });
      if (res.data.success) {
        toast.success('Vehicle successfully added to fleet in MySQL.');
        setFleetModal(false);
        setFNumber('');
        setFDriver('');
        setFCapacity('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register vehicle.');
    }
  };

  // Toggle Vehicle Status
  const handleToggleFleetStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Idle' ? 'In Transit' : currentStatus === 'In Transit' ? 'Maintenance' : 'Idle';
    const nextRoute = nextStatus === 'In Transit' ? 'Simulated Route' : 'Unassigned';
    try {
      const res = await axios.put(`/logistics/fleet/${id}`, { status: nextStatus, currentRoute: nextRoute });
      if (res.data.success) {
        toast.success(`Vehicle status updated to: ${nextStatus}`);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  // Delete Fleet Vehicle from MySQL
  const handleDeleteFleet = async (id) => {
    if (!confirm('Remove vehicle from registry?')) return;
    try {
      const res = await axios.delete(`/logistics/fleet/${id}`);
      if (res.data.success) {
        toast.success('Vehicle deleted from MySQL.');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to remove vehicle.');
    }
  };

  // Save Tariff Rates to MySQL
  const handleSaveRates = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/logistics/rates', { rates });
      if (res.data.success) {
        toast.success('Tariff configurations saved to MySQL.');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to save configurations.');
    }
  };

  const handleRateChange = (key, val) => {
    setRates(prev => ({
      ...prev,
      [key]: parseFloat(val) || 0
    }));
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedStaff || !selectedShipment) return;

    const staffObj = staffList.find(s => s.id === selectedStaff);
    
    try {
      const res = await axios.put(`/shipments/${selectedShipment.id}/assign`, {
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
        setShowStaffPassword(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create staff member.');
    } finally {
      setRegistering(false);
    }
  };

  const handleQRScanSubmit = (e) => {
    e.preventDefault();
    if (!scannedTrackingId) {
      return toast.error('Please select a tracking ID to scan.');
    }
    const exists = shipments.find(s => s.trackingId === scannedTrackingId);
    if (!exists) {
      return toast.error('Invalid QR Code. Consignment not found.');
    }
    setSearchQuery(scannedTrackingId);
    setQrModal(false);
    toast.success(`QR Scan Successful: ${scannedTrackingId} filtered!`);
  };

  // Block / Unblock User
  const handleBlockUser = async (userId, currentBlocked) => {
    setBlockingUserId(userId);
    try {
      const res = await axios.put(`/shipments/users/${userId}/block`, { blocked: !currentBlocked });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update user status.');
    } finally {
      setBlockingUserId(null);
    }
  };

  const handleRefundAction = async (shipmentId, action) => {
    try {
      toast.loading(`Processing refund: ${action}...`, { id: 'refund' });
      const res = await axios.put(`/shipments/${shipmentId}/refund`, { action });
      if (res.data.success) {
        toast.success(`Refund request ${action.toLowerCase()}ed successfully.`, { id: 'refund' });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update refund status.', { id: 'refund' });
    }
  };

  // Bulk Assign Shipments
  const handleBulkAssign = async (e) => {
    e.preventDefault();
    if (!bulkStaffId || selectedShipmentIds.length === 0) return;
    const staffObj = staffList.find(s => s.id === bulkStaffId);
    try {
      const res = await axios.post('/shipments/bulk-assign', {
        shipmentIds: selectedShipmentIds,
        staffId: bulkStaffId,
        staffName: staffObj?.name || ''
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedShipmentIds([]);
        setBulkAssignModal(false);
        setBulkStaffId('');
        fetchData();
      }
    } catch (err) {
      toast.error('Bulk assign failed.');
    }
  };

  const toggleShipmentSelection = (id) => {
    setSelectedShipmentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
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

  const filteredShipments = shipments.filter(ship => {
    const matchesSearch = 
      ship.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ship.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ship.recipientName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    const isDomestic = (ship.originCountry || 'India') === 'India' && (ship.destinationCountry || 'India') === 'India';
    if (shipmentFilter === 'domestic') return isDomestic;
    if (shipmentFilter === 'international') return !isDomestic;
    return true;
  });

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
              <span className="font-extrabold text-slate-800 text-lg leading-none">Marine Bytes</span>
              <span className="text-[10px] text-slate-400 block font-bold tracking-widest uppercase">Admin Operations</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
              { id: 'shipments', label: 'Manage Shipments', icon: Package },
              { id: 'warehouses', label: 'Warehouse Inventory', icon: Layers },
              { id: 'fleet', label: 'Fleet & Vehicles', icon: Truck },
              { id: 'rates', label: 'Shipping Rates', icon: Coins },
              { id: 'transit', label: 'Live Transit Tracker', icon: Map },
              { id: 'users', label: 'Staff Directory', icon: UserCheck },
              { id: 'finance', label: 'Finance & Invoices', icon: FileText },
              { id: 'chats', label: 'Customer Support Chat', icon: MessageSquare },
              { id: 'tickets', label: 'Support & Bug Tickets', icon: AlertCircle },
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
        {activeTab === 'overview' && (() => {
          const totalFleet = fleet.length;
          const activeFleet = fleet.filter(f => f.status === 'In Transit' || f.status === 'Idle').length;
          const fleetPercent = totalFleet > 0 ? Math.round((activeFleet / totalFleet) * 100) : 94;

          const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity, 0);
          const totalLoad = warehouses.reduce((sum, w) => sum + w.currentLoad, 0);
          const warehouseUtilization = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 78;
          const totalLoadFormatted = totalLoad >= 1000 ? `${(totalLoad / 1000).toFixed(1)}K` : totalLoad;
          const totalCapacityFormatted = totalCapacity >= 1000 ? `${(totalCapacity / 1000).toFixed(1)}K` : totalCapacity;
          const availableSpaceFormatted = Math.max(0, totalCapacity - totalLoad) >= 1000 ? `${(Math.max(0, totalCapacity - totalLoad) / 1000).toFixed(1)}K` : Math.max(0, totalCapacity - totalLoad);

          const radius = 40;
          const circumference = 2 * Math.PI * radius; // ~251.2
          const strokeDashoffset = circumference - (warehouseUtilization / 100) * circumference;

          return (
            <div className="space-y-8 animate-fade-in">
              {/* Dashboard Title Area */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                    {t('dbOverview')}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">Global logistics telemetry, real-time shipment workflows, and system health.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                    className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 font-bold py-1.5 px-3.5 rounded-xl shadow-sm transition flex items-center gap-1"
                  >
                    <Globe size={12} />
                    <span>{lang === 'en' ? 'हिन्दी (HI)' : 'English (EN)'}</span>
                  </button>
                  <div className="text-xs bg-slate-100 border border-slate-200 text-indigo-600 font-mono py-1.5 px-3.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    {t('liveFeed')}
                  </div>
                </div>
              </div>

              {/* 🚢 Realistic Maritime Logistics Banner */}
              <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 bg-gradient-to-r from-slate-900 to-indigo-900 text-white shadow-xl h-44 flex items-center p-6 md:p-8">
                {/* Banner Image Background with subtle overlay */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src="/cargo_ship_banner.png" 
                    alt="Maritime Logistics" 
                    className="w-full h-full object-cover opacity-35 mix-blend-overlay"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent"></div>
                </div>
                
                {/* Banner Content */}
                <div className="relative z-10 space-y-2 max-w-xl text-left">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[10px] font-extrabold uppercase tracking-widest">
                    <Globe size={12} className="animate-spin-slow" />
                    <span>HQ Logistics Hub Telemetry</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black tracking-tight text-white">
                    Marine Bytes Fleet Command Operations
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                    Audit container allocations, dispatch vehicles, manage pricing structures, and coordinate international cargo lines seamlessly.
                  </p>
                </div>
              </div>

              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Shipments */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-32 relative group hover:shadow-md hover:border-slate-300 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('totalShipments')}</p>
                      <h3 className="text-3xl font-black text-slate-800 mt-1">{stats?.totalShipments || 0}</h3>
                    </div>
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Package size={20} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center font-mono border border-emerald-100">
                      +8.4%
                    </span>
                    <span>vs last month</span>
                  </div>
                </div>

                {/* Revenue Audit */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-32 relative group hover:shadow-md hover:border-slate-300 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('revenueAudit')}</p>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">₹{stats?.totalRevenue?.toLocaleString('en-IN') || '0.00'}</h3>
                    </div>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <CreditCard size={20} />
                    </div>
                  </div>
                  {/* Revenue Sparkline inside the Card */}
                  <div className="w-full h-8 overflow-hidden rounded">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { val: 3.2 }, { val: 3.5 }, { val: 3.1 }, { val: 3.8 }, { val: 3.6 }, { val: 4.0 }, { val: stats?.totalRevenue ? stats.totalRevenue / 1000 : 4.2 }
                      ]}>
                        <defs>
                          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Total Users */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-32 relative group hover:shadow-md hover:border-slate-300 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('activeUsers')}</p>
                      <h3 className="text-3xl font-black text-slate-800 mt-1">{stats?.totalUsers || 0}</h3>
                    </div>
                    <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
                      <Users size={20} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="text-cyan-600 font-semibold bg-cyan-50 px-1.5 py-0.5 rounded flex items-center font-mono border border-cyan-100">
                      +1.2%
                    </span>
                    <span>steady growth</span>
                  </div>
                </div>

                {/* Active Fleet */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-32 relative group hover:shadow-md hover:border-slate-300 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('fleetStatus')}</p>
                      <h3 className="text-3xl font-black text-slate-800 mt-1">{fleetPercent}%</h3>
                    </div>
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl relative">
                      <Truck size={20} />
                      <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 to-indigo-600 h-full rounded-full" style={{ width: `${fleetPercent}%` }}></div>
                    </div>
                    <p className="text-[9px] text-slate-400 text-right font-medium">{activeFleet}/{totalFleet || 6} {t('transitOnline')}</p>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Double Bar Lifecycle Chart */}
                <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">{t('lifecycleVolume')}</h3>
                  <div className="h-64">
                    {statusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b' }}
                            itemStyle={{ color: '#4f46e5' }}
                          />
                          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
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

                {/* Shipping Channels Pie Chart */}
                <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{t('shippingChannels')}</h3>
                  <div className="h-44 flex items-center justify-center relative">
                    {typeData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={typeData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {typeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Volume</span>
                          <span className="text-xl font-black text-slate-800">{stats?.totalShipments || 0}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400 text-xs italic">No shipment channels logged.</div>
                    )}
                  </div>
                  {/* Modern custom legend */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-500 font-medium">
                    {typeData.map((t, idx) => (
                      <div key={t.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        <span>{t.name} ({t.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Live Activity Feed */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col h-96">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2 pb-3 border-b border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                    {t('recentOps')}
                  </h3>
                  <div className="overflow-y-auto flex-1 pr-1 space-y-3 scrollbar-thin">
                    {stats?.recentShipments && stats.recentShipments.length > 0 ? (
                      stats.recentShipments.map((s) => {
                        let Icon = Package;
                        let iconColor = 'text-indigo-600 bg-indigo-50 border-indigo-100';
                        if (s.status === 'Delivered') {
                          Icon = CheckCircle;
                          iconColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
                        } else if (s.status === 'Pending Payment') {
                          Icon = Clock;
                          iconColor = 'text-amber-600 bg-amber-50 border-amber-100';
                        } else if (s.status === 'In Transit' || s.status === 'Picked up') {
                          Icon = Truck;
                          iconColor = 'text-cyan-600 bg-cyan-50 border-cyan-100';
                        } else if (s.status === 'Out for Delivery') {
                          Icon = Navigation;
                          iconColor = 'text-indigo-600 bg-indigo-50 border-indigo-100';
                        }

                        return (
                          <div key={s.id} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 hover:border-slate-200 transition group">
                            <div className="mt-0.5">
                              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${iconColor}`}>
                                <Icon size={14} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-slate-700">
                                <span className="font-semibold text-slate-800">{s.recipientName}</span>'s shipment ({s.originCity} → {s.destinationCity})
                              </p>
                              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                                <span className="font-mono text-slate-400">{s.trackingId}</span>
                                <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase ${
                                  s.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse'
                                }`}>
                                  {s.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-500 italic text-center py-6">No recent cargo logs.</p>
                    )}
                  </div>
                </div>

                {/* Conditions Widget */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col h-96 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(99,102,241,0.4) 0%, transparent 60%)' }}></div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 pb-3 border-b border-slate-200 z-10">{t('weatherHub')}</h3>
                  <div className="flex-1 flex flex-col justify-between space-y-3 z-10">
                    {/* Singapore */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Singapore Terminal</p>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">SGP • Ocean Hub 01</p>
                      </div>
                      <div className="flex items-center gap-2 text-indigo-600">
                        <CloudLightning size={20} />
                        <span className="font-black text-sm text-slate-800">28°C</span>
                      </div>
                    </div>
                    {/* Rotterdam */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Rotterdam Hub</p>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">NLD • Cargo Depot 02</p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Cloud size={20} />
                        <span className="font-black text-sm text-slate-800">12°C</span>
                      </div>
                    </div>
                    {/* New Jersey */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-800">New Jersey Airport</p>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">USA • Air Terminal 03</p>
                      </div>
                      <div className="flex items-center gap-2 text-amber-500">
                        <Sun size={20} />
                        <span className="font-black text-sm text-slate-800">22°C</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warehouse utilization gauge */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col h-96 justify-between hover:shadow-md transition">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-200">{t('warehouseOccupancy')}</h3>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="relative w-36 h-36">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" fill="none" r={40} stroke="rgba(0,0,0,0.03)" strokeWidth={7}></circle>
                        <circle 
                          className="text-indigo-600 drop-shadow-[0_0_6px_rgba(99,102,241,0.2)]" 
                          cx="50" 
                          cy="50" 
                          fill="none" 
                          r={40} 
                          stroke="currentColor" 
                          strokeDasharray={251.2} 
                          strokeDashoffset={strokeDashoffset} 
                          strokeWidth={7}
                          strokeLinecap="round"
                        ></circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-slate-800 leading-none">{warehouseUtilization}<span className="text-sm font-bold text-slate-400">%</span></span>
                      </div>
                    </div>
                    
                    <div className="w-full mt-5 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">{t('totalLoad')}:</span>
                        <span className="font-mono text-slate-700 font-bold">{totalLoadFormatted} kg</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${warehouseUtilization}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                        <span>{t('freeSpace')}:</span>
                        <span className="font-mono">{availableSpaceFormatted} kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
                  onClick={() => {
                    if (shipments.length > 0) {
                      setScannedTrackingId(shipments[0].trackingId);
                    }
                    setQrModal(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-semibold shadow-sm transition text-xs flex items-center space-x-1.5 shrink-0"
                >
                  <QrCode size={14} />
                  <span>Scan QR Code</span>
                </button>
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

            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl w-full max-w-md">
              <button
                type="button"
                onClick={() => setShipmentFilter('all')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  shipmentFilter === 'all'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Shipments
              </button>
              <button
                type="button"
                onClick={() => setShipmentFilter('domestic')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  shipmentFilter === 'domestic'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Domestic 🇮🇳
              </button>
              <button
                type="button"
                onClick={() => setShipmentFilter('international')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  shipmentFilter === 'international'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                International 🌐
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                      <th className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedShipmentIds.length === filteredShipments.filter(s => s.paymentStatus === 'Paid' && s.status !== 'Delivered').length && filteredShipments.filter(s => s.paymentStatus === 'Paid' && s.status !== 'Delivered').length > 0}
                          onChange={(e) => {
                            const eligible = filteredShipments.filter(s => s.paymentStatus === 'Paid' && s.status !== 'Delivered');
                            setSelectedShipmentIds(e.target.checked ? eligible.map(s => s.id) : []);
                          }}
                          className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                        />
                      </th>
                      <th className="p-4">Tracking ID</th>
                      <th className="p-4">Sender</th>
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Route</th>
                      <th className="p-4">Scheduled Pickup</th>
                      <th className="p-4">Service Type</th>
                      <th className="p-4">Fleet Vehicle</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Staff Operator</th>
                      <th className="p-4 text-right">Assign Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredShipments.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="p-6 text-center text-slate-400 italic">No shipments match search criteria.</td>
                      </tr>
                    ) : (
                      filteredShipments.map((shipment) => (
                        <tr key={shipment.id} className="hover:bg-slate-50/40 transition">
                          <td className="p-4">
                            {shipment.paymentStatus === 'Paid' && shipment.status !== 'Delivered' && (
                              <input
                                type="checkbox"
                                checked={selectedShipmentIds.includes(shipment.id)}
                                onChange={() => toggleShipmentSelection(shipment.id)}
                                className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                              />
                            )}
                          </td>
                          <td className="p-4 font-bold text-slate-800">
                            <div className="flex items-center space-x-1">
                              {((shipment.originCountry || 'India') !== 'India' || (shipment.destinationCountry || 'India') !== 'India') && (
                                <span className="text-indigo-600 font-bold" title={`International: ${shipment.originCountry} → ${shipment.destinationCountry}`}>🌐</span>
                              )}
                              <span>{shipment.trackingId}</span>
                            </div>
                            {shipment.govtIdProof && (
                              <span className="block text-[9px] text-slate-400 font-extrabold bg-slate-100 border border-slate-200 px-1 py-0.5 rounded w-max mt-0.5">
                                ID: {shipment.govtIdProof}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-800">{shipment.senderName}</span>
                            <div className="text-[9px] text-slate-400 font-medium mt-0.5 space-y-0.5">
                              <div>Category: <span className="font-semibold text-slate-600">{shipment.consignmentCategory || 'Parcel'}</span></div>
                              {shipment.declaredValue > 0 && (
                                <div>Value: <span className="font-semibold text-slate-600">
                                  {(() => {
                                    const o = (shipment.originCountry || '').toLowerCase();
                                    const d = (shipment.destinationCountry || '').toLowerCase();
                                    let cur = 'INR';
                                    if (o !== 'india' || d !== 'india') {
                                      const target = o !== 'india' ? o : d;
                                      if (target.includes('united states') || target.includes('us')) cur = 'USD';
                                      else if (target.includes('united kingdom') || target.includes('gb') || target.includes('uk')) cur = 'GBP';
                                      else if (target.includes('united arab emirates') || target.includes('uae')) cur = 'AED';
                                      else if (target.includes('australia')) cur = 'AUD';
                                      else cur = 'USD';
                                    }
                                    const sym = cur === 'USD' ? '$' : cur === 'GBP' ? '£' : cur === 'AED' ? 'د.إ' : cur === 'AUD' ? 'A$' : '₹';
                                    return `${sym}${Number(shipment.declaredValue).toFixed(2)}`;
                                  })()}
                                </span></div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{shipment.recipientName}</div>
                            {shipment.recipientPhone && (
                              <div className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                Phone: <span className="text-slate-600">{shipment.recipientPhone}</span>
                              </div>
                            )}
                            {shipment.customsDescription && (
                              <div className="text-[9px] text-slate-400 italic mt-0.5 max-w-[150px] truncate" title={shipment.customsDescription}>
                                Customs: <span className="text-slate-600">{shipment.customsDescription}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">{shipment.originCity} → {shipment.destinationCity}</td>
                          <td className="p-4 font-semibold text-indigo-600">
                            {shipment.pickupDate ? new Date(shipment.pickupDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Today'}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700">
                              {shipment.shipmentType}
                            </span>
                          </td>
                          <td className="p-4">
                            {shipment.fleetVehicleName ? (
                              <span className="text-[10px] font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg block w-max">
                                {shipment.fleetVehicleName}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic text-[10px]">—</span>
                            )}
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

            {/* Bulk Assign Bar */}
            {selectedShipmentIds.length > 0 && (
              <div className="flex items-center justify-between bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-lg">
                <span className="text-sm font-semibold">{selectedShipmentIds.length} shipment(s) selected</span>
                <div className="flex gap-3">
                  <button onClick={() => setSelectedShipmentIds([])} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition">Clear</button>
                  <button onClick={() => setBulkAssignModal(true)} className="px-3 py-1.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-lg text-xs font-bold transition">Bulk Assign Staff</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bulk Assign Modal */}
        {bulkAssignModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
              <h3 className="text-lg font-extrabold text-slate-800 mb-1">Bulk Assign Staff</h3>
              <p className="text-xs text-slate-500 mb-6">Assigning <span className="font-bold text-indigo-600">{selectedShipmentIds.length} shipments</span> to a staff member.</p>
              <form onSubmit={handleBulkAssign} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Select Staff Operator</label>
                  <select
                    value={bulkStaffId}
                    onChange={e => setBulkStaffId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Staff --</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setBulkAssignModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
                  <button type="submit" disabled={!bulkStaffId} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition disabled:opacity-50">Assign Now</button>
                </div>
              </form>
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
                  <div className="relative">
                    <input
                      type={showStaffPassword ? 'text' : 'password'}
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-indigo-600 transition"
                    >
                      {showStaffPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
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

            {/* Staff Directory + Performance */}
            <div className="lg:col-span-8 space-y-6">
              {/* Performance Cards */}
              {staffPerformance.length > 0 && (
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4">📊 Staff Performance Report</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staffPerformance.map(perf => (
                      <div key={perf.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 text-indigo-600 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm uppercase">
                              {perf.name.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{perf.name}</p>
                              <p className="text-[10px] text-slate-400">{perf.email}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            perf.successRate >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            perf.successRate >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-red-50 text-red-600 border border-red-200'
                          }`}>{perf.successRate}% success</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                          <div className="bg-slate-50 rounded-xl p-2">
                            <p className="font-black text-slate-800 text-base">{perf.totalAssigned}</p>
                            <p className="text-slate-400 font-semibold">Assigned</p>
                          </div>
                          <div className="bg-emerald-50 rounded-xl p-2">
                            <p className="font-black text-emerald-700 text-base">{perf.delivered}</p>
                            <p className="text-slate-400 font-semibold">Delivered</p>
                          </div>
                          <div className="bg-amber-50 rounded-xl p-2">
                            <p className="font-black text-amber-700 text-base">{perf.avgRating || '—'}</p>
                            <p className="text-slate-400 font-semibold">Avg ⭐</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${
                              perf.successRate >= 80 ? 'bg-emerald-500' : perf.successRate >= 50 ? 'bg-amber-400' : 'bg-red-400'
                            }`} style={{ width: `${perf.successRate}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff List with Block Button */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Staff Directory Logs</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="pb-3.5">Name</th>
                        <th className="pb-3.5">Email ID</th>
                        <th className="pb-3.5">Contact</th>
                        <th className="pb-3.5">Status</th>
                        <th className="pb-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffList.map((staff) => (
                        <tr key={staff.id} className="hover:bg-slate-50/30 transition">
                          <td className="py-3.5 font-bold text-slate-800">{staff.name}</td>
                          <td className="py-3.5 font-medium text-slate-600">{staff.email}</td>
                          <td className="py-3.5 text-slate-500">{staff.phone || 'N/A'}</td>
                          <td className="py-3.5">
                            {staff.isBlocked ? (
                              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">
                                <span>🚫 Blocked</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                <Check size={10} />
                                <span>Active</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => handleBlockUser(staff.id, staff.isBlocked)}
                              disabled={blockingUserId === staff.id}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition disabled:opacity-50 ${
                                staff.isBlocked
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                  : 'bg-red-50 hover:bg-red-100 text-red-600'
                              }`}
                            >
                              {blockingUserId === staff.id ? '...' : staff.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: FINANCE & INVOICES */}
        {activeTab === 'finance' && (
          <div className="space-y-8 animate-fade-in">
            {/* Refunds Queue Section */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <Coins size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">Refunds Queue</h3>
                  <p className="text-[10px] text-slate-400">Process refunds for cancelled paid shipments</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold">
                      <th className="pb-3.5">Tracking ID</th>
                      <th className="pb-3.5">Customer</th>
                      <th className="pb-3.5">Amount</th>
                      <th className="pb-3.5">Payment ID</th>
                      <th className="pb-3.5">Refund Status</th>
                      <th className="pb-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shipments.filter(s => s.refundStatus === 'Pending').length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-400 italic">No pending refund requests.</td>
                      </tr>
                    ) : (
                      shipments.filter(s => s.refundStatus === 'Pending').map((shipment) => {
                        const getEstimatedCost = (s) => {
                          const basePrice = 150.0;
                          const perKgRate = 50.0;
                          const taxPercent = 18.0;

                          let multiplier = 1.0;
                          if (s.shipmentType === 'Express') multiplier = 1.5;
                          else if (s.shipmentType === 'Air') multiplier = 2.5;
                          else if (s.shipmentType === 'Ocean') multiplier = 0.8;
                          
                          let intlSurcharge = 1.0;
                          if (s.originCountry !== 'India' || s.destinationCountry !== 'India') {
                            intlSurcharge = 1.8;
                          }
                          const costBeforeTax = (basePrice + (s.weight * perKgRate)) * multiplier * intlSurcharge;
                          const cost = costBeforeTax * (1 + (taxPercent / 100));
                          return Math.round(cost * 100) / 100;
                        };

                        return (
                          <tr key={shipment.id} className="hover:bg-slate-50/40 transition">
                            <td className="py-3.5 font-bold text-slate-800">{shipment.trackingId}</td>
                            <td className="py-3.5 font-medium">{shipment.senderName}</td>
                            <td className="py-3.5 font-bold text-slate-700">₹{getEstimatedCost(shipment).toFixed(2)}</td>
                            <td className="py-3.5 text-slate-500 font-mono">{shipment.paymentId || 'N/A'}</td>
                            <td className="py-3.5">
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 animate-pulse">
                                Pending Refund Approval
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleRefundAction(shipment.id, 'Approve')}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition text-[10px]"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRefundAction(shipment.id, 'Reject')}
                                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition text-[10px]"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoices Section */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Financial Ledger Invoices</h3>
              
              <div className="overflow-x-auto">
                <InvoiceTable listUrl="/payments/invoices" />
              </div>
            </div>
          </div>
        )}


        {/* TAB: WAREHOUSE INVENTORY (MySQL) */}
        {activeTab === 'warehouses' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Warehouse Inventory Management</h2>
                <p className="text-slate-500 text-sm mt-1">Monitor storage capacities, package load, and managers (Stored in MySQL).</p>
              </div>
              <button
                onClick={() => setWarehouseModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
              >
                <PlusCircle size={14} />
                <span>Register Warehouse</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {warehouses.map(w => {
                const loadPercent = Math.min(100, Math.round((w.currentLoad / w.capacity) * 100));
                return (
                  <div key={w.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Warehouse size={20} />
                      </div>
                      <button
                        onClick={() => handleDeleteWarehouse(w.id)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{w.name}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{w.location}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Occupancy Capacity</span>
                        <span className="text-slate-700">{w.currentLoad} / {w.capacity} kg ({loadPercent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            loadPercent > 85 ? 'bg-red-500' : loadPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${loadPercent}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Supervisor Manager:</span>
                      <span className="font-semibold text-slate-700">{w.managerName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: FLEET & VEHICLES (MySQL) */}
        {activeTab === 'fleet' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Logistics Fleet Registry</h2>
                <p className="text-slate-500 text-sm mt-1">Manage transport assets, driver assignments, and vehicle statuses (Stored in MySQL).</p>
              </div>
              <button
                onClick={() => setFleetModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
              >
                <PlusCircle size={14} />
                <span>Register Vehicle</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                    <th className="p-4">Vehicle Number</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Capacity</th>
                    <th className="p-4">Driver Name</th>
                    <th className="p-4">Current Route</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fleet.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-slate-400 italic">No vehicles registered in MySQL fleet database.</td>
                    </tr>
                  ) : (
                    fleet.map(vehicle => (
                      <tr key={vehicle.id} className="hover:bg-slate-50/40 transition">
                        <td className="p-4 font-bold text-slate-800">{vehicle.vehicleNumber}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                            {vehicle.vehicleType}
                          </span>
                        </td>
                        <td className="p-4 font-medium">{vehicle.capacity} kg</td>
                        <td className="p-4 text-slate-700 font-semibold">{vehicle.driverName}</td>
                        <td className="p-4 text-slate-500">{vehicle.currentRoute}</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleToggleFleetStatus(vehicle.id, vehicle.status)}
                              title="Click to toggle status (simulated update)"
                              className={`px-2 py-1 rounded-full text-[10px] font-bold border transition ${
                                vehicle.status === 'Idle' ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' :
                                vehicle.status === 'In Transit' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' :
                                'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              {vehicle.status}
                            </button>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-center ${
                              vehicle.status === 'Idle' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                            }`}>
                              {vehicle.status === 'Idle' ? '✅ Available' : '❌ Not Available'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteFleet(vehicle.id)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: SHIPPING RATES (MySQL) */}
        {activeTab === 'rates' && (
          <div className="space-y-6 animate-fade-in max-w-xl">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tariff & Rates Configuration</h2>
              <p className="text-slate-500 text-sm mt-1">Configure logistics multipliers and base charges (Stored in MySQL).</p>
            </div>

            <form onSubmit={handleSaveRates} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Base Booking Fare (₹)</label>
                  <input
                    type="number"
                    value={rates.base_fare || 0}
                    onChange={(e) => handleRateChange('base_fare', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Service GST Tax Rate (%)</label>
                  <input
                    type="number"
                    value={rates.tax_rate || 0}
                    onChange={(e) => handleRateChange('tax_rate', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Charge per Kilogram (₹)</label>
                  <input
                    type="number"
                    value={rates.per_kg_fare || 0}
                    onChange={(e) => handleRateChange('per_kg_fare', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Express Multiplier (x)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rates.express_multiplier || 0}
                    onChange={(e) => handleRateChange('express_multiplier', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Air Cargo Multiplier (x)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rates.air_multiplier || 0}
                    onChange={(e) => handleRateChange('air_multiplier', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ocean Freight Discount (x)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rates.ocean_multiplier || 0}
                    onChange={(e) => handleRateChange('ocean_multiplier', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm mt-4"
              >
                Save Configurations
              </button>
            </form>
          </div>
        )}

        {/* TAB: LIVE TRANSIT MAP TRACKER */}
        {activeTab === 'transit' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Live Shipment Transit Tracker</h2>
              <p className="text-slate-500 text-sm mt-1">Audit active cargo paths, delivery workflows, and simulated ETA telemetry.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Shipments List */}
              <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 max-h-[500px] overflow-y-auto">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Active Shipments</h3>
                {shipments.filter(s => s.status !== 'Delivered' && s.status !== 'Cancelled').length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No shipments currently in transit.</p>
                ) : (
                  shipments.filter(s => s.status !== 'Delivered' && s.status !== 'Cancelled').map(s => {
                    const isSelected = selectedTransitShipment?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedTransitShipment(s)}
                        className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col space-y-1 ${
                          isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-bold text-slate-800 text-[11px]">{s.trackingId}</span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[9px] font-bold uppercase">{s.shipmentType}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>{s.originCity} → {s.destinationCity}</span>
                          <span className="font-semibold text-indigo-600">{s.status}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Transit Map Telemetry Visualization */}
              <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col min-h-[300px]">
                {selectedTransitShipment ? (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm">Tracking ID: {selectedTransitShipment.trackingId}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Assigned Operator: {selectedTransitShipment.assignedStaffName || 'Not Assigned'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated Transit Days</span>
                        <h4 className="text-lg font-black text-slate-800 mt-0.5">{selectedTransitShipment.estimatedDeliveryDays || '2.5'} Days</h4>
                      </div>
                    </div>

                    {/* Path Illustration */}
                    <div className="py-8 px-4 flex justify-between items-center relative">
                      {/* Connecting Line */}
                      <div className="absolute left-[10%] right-[10%] top-[50%] h-[4px] bg-slate-100 -translate-y-1/2 z-0 rounded-full"></div>
                      <div 
                        className="absolute left-[10%] top-[50%] h-[4px] bg-indigo-600 -translate-y-1/2 z-0 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${
                            selectedTransitShipment.status === 'Booked' ? '20%' :
                            selectedTransitShipment.status === 'Picked up' ? '45%' :
                            selectedTransitShipment.status === 'In Transit' ? '70%' :
                            selectedTransitShipment.status === 'Out for Delivery' ? '90%' : '5%'
                          }`
                        }}
                      ></div>

                      <div className="z-10 flex flex-col items-center">
                        <div className="bg-indigo-600 text-white p-2.5 rounded-full shadow-md">
                          <Warehouse size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 mt-1">{selectedTransitShipment.originCity}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Origin</span>
                      </div>

                      <div className="z-10 flex flex-col items-center">
                        <div className={`p-2.5 rounded-full shadow-md transition-all ${
                          selectedTransitShipment.status === 'In Transit' || selectedTransitShipment.status === 'Out for Delivery' 
                            ? 'bg-indigo-600 text-white animate-bounce' 
                            : 'bg-white text-slate-400 border border-slate-200'
                        }`}>
                          <Truck size={16} />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 mt-1">In Transit</span>
                      </div>

                      <div className="z-10 flex flex-col items-center">
                        <div className={`p-2.5 rounded-full shadow-md ${
                          selectedTransitShipment.status === 'Out for Delivery' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'
                        }`}>
                          <Navigation size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 mt-1">{selectedTransitShipment.destinationCity}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Destination</span>
                      </div>
                    </div>

                    {/* Telemetry Metrics */}
                    <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-5">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Simulated Coordinates</p>
                        <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                          {selectedTransitShipment.status === 'Booked' ? '19.0760° N, 72.8777° E' :
                           selectedTransitShipment.status === 'Picked up' ? '18.9500° N, 73.1200° E' :
                           selectedTransitShipment.status === 'In Transit' ? '15.4200° N, 75.3400° E' :
                           '12.9716° N, 77.5946° E'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Transit Velocity</p>
                        <p className="text-xs font-bold text-slate-800 mt-1">
                          {selectedTransitShipment.shipmentType === 'Air' ? '540 km/h' :
                           selectedTransitShipment.shipmentType === 'Express' ? '82 km/h' :
                           selectedTransitShipment.shipmentType === 'Ocean' ? '28 knots' : '65 km/h'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Cargo Weight Payload</p>
                        <p className="text-xs font-bold text-slate-800 mt-1">{selectedTransitShipment.weight} kg</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs italic">
                    <Compass className="animate-spin text-slate-300 mb-3" size={32} />
                    <span>Select an active shipment on the left to begin transit mapping.</span>
                  </div>
                )}
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
                        <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
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

        {/* TAB: SUPPORT & BUG TICKETS CONSOLE */}
        {activeTab === 'tickets' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <AlertCircle className="text-indigo-600" size={24} />
                <span>Support & Bug Tickets Console</span>
              </h2>
              <p className="text-slate-500 text-sm mt-1">Audit customer and staff bug reports, feature requests, and system issues.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.length === 0 ? (
                <div className="col-span-full bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-400 italic">
                  No support or bug tickets registered in the system.
                </div>
              ) : (
                tickets.map((t) => {
                  const isBug = t.category === 'Bug';
                  return (
                    <div 
                      key={t.id} 
                      className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition duration-150 ${
                        isBug ? 'border-red-200/80 bg-gradient-to-br from-white to-red-50/10' : 'border-slate-200'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                            isBug 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {t.category || 'General'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            t.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {t.status}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1">{t.title}</h4>
                          <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                            From: {t.sender_name || t.senderName} ({t.sender_role || 'customer'})
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed min-h-[40px] whitespace-pre-wrap">{t.message}</p>

                        {/* Screenshot attachment preview */}
                        {t.screenshot && (
                          <div className="pt-2">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Attached screenshot:</span>
                            <button
                              type="button"
                              onClick={() => setSelectedScreenshot(t.screenshot)}
                              className="w-full relative group border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-1 flex justify-center hover:border-indigo-400 transition"
                            >
                              <img src={t.screenshot} alt="Attached screenshot thumbnail" className="max-h-[80px] object-contain rounded-md" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition">
                                Click to View Full Size
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
                        <span>{new Date(t.created_at || t.createdAt).toLocaleDateString()}</span>
                        {t.status === 'open' && (
                          <button
                            onClick={() => handleResolveTicket(t.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </main>

      {/* Warehouse Registration Modal */}
      {warehouseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-3xl shadow-xl relative animate-scale-up">
            <h3 className="text-md font-bold mb-3">Register New Warehouse</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">Add a logistics depot storage unit in MySQL database.</p>

            <form onSubmit={handleCreateWarehouse} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Warehouse Name</label>
                <input
                  type="text"
                  value={wName}
                  onChange={(e) => setWName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800"
                  placeholder="e.g. Navi Mumbai Port Depot"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Location Address</label>
                <input
                  type="text"
                  value={wLocation}
                  onChange={(e) => setWLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800"
                  placeholder="e.g. Sector-11, JNPT Navi Mumbai"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Capacity (kg)</label>
                  <input
                    type="number"
                    value={wCapacity}
                    onChange={(e) => setWCapacity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800"
                    placeholder="e.g. 50000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Supervisor Name</label>
                  <input
                    type="text"
                    value={wManager}
                    onChange={(e) => setWManager(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWarehouseModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-indigo-glow"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fleet Registration Modal */}
      {fleetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-3xl shadow-xl relative animate-scale-up">
            <h3 className="text-md font-bold mb-3">Register Fleet Vehicle</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">Register a new transport asset in MySQL fleet directory.</p>

            <form onSubmit={handleCreateFleet} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Vehicle Plate Number</label>
                <input
                  type="text"
                  value={fNumber}
                  onChange={(e) => setFNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800"
                  placeholder="e.g. MH-03-TC-9876"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Vehicle Type</label>
                  <select
                    value={fType}
                    onChange={(e) => setFType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800"
                    required
                  >
                    <option value="Truck">Truck</option>
                    <option value="Container Ship">Container Ship</option>
                    <option value="Delivery Van">Delivery Van</option>
                    <option value="Cargo Plane">Cargo Plane</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Capacity Payload (kg)</label>
                  <input
                    type="number"
                    value={fCapacity}
                    onChange={(e) => setFCapacity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800"
                    placeholder="e.g. 15000"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Driver Name</label>
                <input
                  type="text"
                  value={fDriver}
                  onChange={(e) => setFDriver(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800"
                  placeholder="e.g. Amit Kumar"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFleetModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-indigo-glow"
                >
                  Register Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* QR Scanner Simulation Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl relative text-slate-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <QrCode size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">QR / Barcode Simulation Registry</h3>
                <p className="text-[10px] text-slate-400">Industrial Cargo Auditing & Tracking Scan</p>
              </div>
            </div>
            
            {/* Viewport Frame */}
            <div className="relative w-full aspect-square max-w-[240px] mx-auto bg-black/60 rounded-2xl border border-slate-700 overflow-hidden mb-6 flex flex-col items-center justify-center">
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-indigo-500"></div>
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-indigo-500"></div>
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-indigo-500"></div>
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-indigo-500"></div>
              
              {/* Glowing Scan Laser Line */}
              <div className="absolute left-0 right-0 h-[2px] bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-[scan_2s_infinite_ease-in-out]"></div>
              
              <div className="flex flex-col items-center space-y-2 opacity-60">
                <Camera size={40} className="text-slate-500 animate-pulse" />
                <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">SCANNING VIEWPORT</span>
              </div>
            </div>

            <form onSubmit={handleQRScanSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Select Shipment QR Code to Scan</label>
                <select
                  value={scannedTrackingId}
                  onChange={(e) => setScannedTrackingId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition border-indigo-500/20"
                  required
                >
                  <option value="">-- Choose Consignment --</option>
                  {shipments.map((s) => (
                    <option key={s.id} value={s.trackingId}>
                      {s.trackingId} ({s.senderName} ➜ {s.recipientName})
                    </option>
                  ))}
                </select>
              </div>

              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scan {
                  0%, 100% { top: 10%; }
                  50% { top: 90%; }
                }
              `}} />

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQrModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                >
                  Simulate Laser Scan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox for screenshots */}
      <ScreenshotLightboxPortal screenshot={selectedScreenshot} onClose={() => setSelectedScreenshot(null)} />

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
    link.setAttribute('download', `MarineBytes-Invoices-Export-${Date.now()}.csv`);
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
              <tr key={invoice.id} className="hover:bg-slate-50/40 transition">
                <td className="py-3.5 font-bold text-slate-800">{invoice.invoiceNumber}</td>
                <td className="py-3.5 font-medium">{invoice.billingDetails.name}</td>
                <td className="py-3.5 text-slate-500 font-mono">{invoice.paymentId}</td>
                <td className="py-3.5 font-bold text-emerald-600">₹{Number(invoice.amount || 0).toFixed(2)}</td>
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

// Modal Portal / Lightbox for Screenshots at root
const ScreenshotLightboxPortal = ({ screenshot, onClose }) => {
  if (!screenshot) return null;
  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fade-in"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-slate-350 text-sm font-bold bg-white/10 hover:bg-white/20 rounded-full h-8 w-8 flex items-center justify-center transition"
        >
          ✕
        </button>
        <img 
          src={screenshot} 
          alt="Attached Screenshot Full Size" 
          className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-700 bg-slate-900 select-none"
        />
      </div>
    </div>
  );
};

// We will inject the Lightbox into AdminDashboard component right at the end by exporting wrapper or inside return
// Let's modify the end of return of AdminDashboard to render it! We'll add the modal trigger inside the return.
