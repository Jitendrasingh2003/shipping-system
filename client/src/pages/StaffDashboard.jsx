import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { 
  Package, MapPin, CheckCircle, Clock, LogOut, RefreshCw, Send,
  Truck, ClipboardList, User, Award, Shield, ChevronRight, Activity, Calendar, Phone, MapPinIcon,
  Layers, Warehouse, Map, Compass
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_PIPELINE = ['Booked', 'Picked up', 'In Transit', 'Out for Delivery', 'Delivered'];

const StaffDashboard = () => {
  const { logout, user } = useAuth();
  const socket = useSocket();
  const mapRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'active' | 'transit' | 'history' | 'profile' | 'warehouses' | 'fleet'
  const [stats, setStats] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tracking & Telemetry States
  const [selectedTransitShipment, setSelectedTransitShipment] = useState(null);
  const [trackingLogs, setTrackingLogs] = useState([]);
  
  // Logistics States
  const [warehouses, setWarehouses] = useState([]);
  const [fleet, setFleet] = useState([]);
  
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
        if (selectedTransitShipment) {
          const updated = shipmentsRes.data.shipments.find(s => s._id === selectedTransitShipment._id);
          if (updated) {
            setSelectedTransitShipment(updated);
            setTrackingLogs([...updated.history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
          }
        }
      }

      // Fetch logistics databases
      const whRes = await axios.get('/logistics/warehouses');
      if (whRes.data.success) {
        setWarehouses(whRes.data.warehouses);
      }

      const flRes = await axios.get('/logistics/fleet');
      if (flRes.data.success) {
        setFleet(flRes.data.fleet);
      }
    } catch (err) {
      toast.error('Failed to load portal data.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFleetStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Idle' ? 'In Transit' : currentStatus === 'In Transit' ? 'Maintenance' : 'Idle';
    const nextRoute = nextStatus === 'In Transit' ? 'Active Dispatch Path' : 'Unassigned';
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

  useEffect(() => {
    fetchData();
  }, []);

  // Socket Tracking listener for Staff
  useEffect(() => {
    if (!socket || !selectedTransitShipment) return;

    socket.emit('join:shipment', selectedTransitShipment.trackingId);

    const handleStatusUpdate = (data) => {
      if (data.trackingId === selectedTransitShipment.trackingId) {
        toast.success(`Package status updated to: ${data.status}`);
        setTrackingLogs(prev => [
          { status: data.status, location: data.location, timestamp: data.timestamp },
          ...prev
        ]);
        setSelectedTransitShipment(prev => ({ ...prev, status: data.status }));
        
        // Refresh shipments list
        axios.get('/shipments/staff').then(res => {
          if (res.data.success) setShipments(res.data.shipments);
        });
      }
    };

    socket.on('status-update', handleStatusUpdate);

    return () => {
      socket.off('status-update', handleStatusUpdate);
    };
  }, [socket, selectedTransitShipment]);

  // Leaflet Map Initialization and Update Loop
  useEffect(() => {
    if (activeTab !== 'transit' || !selectedTransitShipment || !window.L) return;

    const cityCoordinates = {
      'Mumbai': [19.0760, 72.8777],
      'Delhi': [28.7041, 77.1025],
      'Bangalore': [12.9716, 77.5946],
      'Chennai': [13.0827, 80.2707],
      'Kolkata': [22.5726, 88.3639],
      'Hyderabad': [17.3850, 78.4867],
      'Pune': [18.5204, 73.8567],
      'Ahmedabad': [23.0225, 72.5714],
      'Jaipur': [26.9124, 75.7873],
      'Surat': [21.1702, 72.8311]
    };

    const originCoords = cityCoordinates[selectedTransitShipment.originCity] || [20.5937, 78.9629];
    const destCoords = cityCoordinates[selectedTransitShipment.destinationCity] || [20.5937, 78.9629];

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const timer = setTimeout(() => {
      const mapEl = document.getElementById('staff-tracking-map');
      if (!mapEl) return;

      const map = window.L.map('staff-tracking-map', {
        zoomControl: false,
        attributionControl: false
      }).setView([
        (originCoords[0] + destCoords[0]) / 2,
        (originCoords[1] + destCoords[1]) / 2
      ], 5);

      mapRef.current = map;

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      // Origin Hub Marker
      window.L.marker(originCoords, {
        icon: window.L.divIcon({
          className: 'bg-indigo-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-[10px] border border-white shadow-md',
          html: 'A',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map).bindPopup(`<b>Origin Hub:</b> ${selectedTransitShipment.originCity}`);

      // Destination Hub Marker
      window.L.marker(destCoords, {
        icon: window.L.divIcon({
          className: 'bg-emerald-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-[10px] border border-white shadow-md',
          html: 'B',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map).bindPopup(`<b>Destination Hub:</b> ${selectedTransitShipment.destinationCity}`);

      // Route polyline
      const routeLine = window.L.polyline([originCoords, destCoords], {
        color: '#6366f1',
        weight: 3,
        dashArray: '5, 10'
      }).addTo(map);

      map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });

      // Live truck marker interpolation
      const statusProgress = {
        'Booked': 0,
        'Picked up': 0.25,
        'In Transit': 0.5,
        'Out for Delivery': 0.75,
        'Delivered': 1
      };

      const progress = statusProgress[selectedTransitShipment.status] || 0;
      const truckCoords = [
        originCoords[0] + (destCoords[0] - originCoords[0]) * progress,
        originCoords[1] + (destCoords[1] - originCoords[1]) * progress
      ];

      window.L.marker(truckCoords, {
        icon: window.L.divIcon({
          className: 'text-2xl flex items-center justify-center filter drop-shadow',
          html: '🚚',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(map).bindPopup(`<b>Package Status:</b> ${selectedTransitShipment.status}`);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [selectedTransitShipment, trackingLogs, activeTab]);

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
              <span className="font-extrabold text-slate-800 text-lg leading-none">Marine Bytes</span>
              <span className="text-[10px] text-indigo-600 block font-bold tracking-widest uppercase mt-0.5">Staff Console</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'My Dashboard', icon: ClipboardList },
              { id: 'active', label: 'Active Deliveries', icon: Truck, count: activeDeliveries.length },
              { id: 'transit', label: 'Live Transit Tracker', icon: Map },
              { id: 'warehouses', label: 'Warehouse Inventory', icon: Layers },
              { id: 'fleet', label: 'Fleet & Vehicles', icon: Truck },
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
              {activeTab === 'transit' && 'Live Transit Tracker'}
              {activeTab === 'warehouses' && 'Warehouse Inventory'}
              {activeTab === 'fleet' && 'Fleet & Vehicle Registry'}
              {activeTab === 'history' && 'Completed Shipments'}
              {activeTab === 'profile' && 'Carrier Profile'}
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              {activeTab === 'dashboard' && 'Manage your active deliveries, view KPIs, and track logistics performance metrics.'}
              {activeTab === 'active' && 'Review assigned shipments, update transit hubs, and mark deliveries as complete.'}
              {activeTab === 'transit' && 'Monitor real-time shipment routing paths, GPS coordinates, and historical telemetry.'}
              {activeTab === 'warehouses' && 'Review active logistics depots, managers, and current capacities (MySQL-Backed).'}
              {activeTab === 'fleet' && 'Review active cargo transport assets. Tap vehicle status pills to toggle vehicle availability.'}
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
                          <td className="py-3.5 text-right space-x-2">
                            {s.status !== 'Delivered' && s.status !== 'Cancelled' ? (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedTransitShipment(s);
                                    setTrackingLogs([...s.history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
                                    setActiveTab('transit');
                                  }}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-bold transition text-[10px]"
                                >
                                  Track
                                </button>
                                <button
                                  onClick={() => openStatusUpdate(s)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition text-[10px]"
                                >
                                  Update Status
                                </button>
                              </>
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
                    <div className="p-4 border-t border-slate-100 bg-slate-50/20 flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTransitShipment(s);
                          setTrackingLogs([...s.history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
                          setActiveTab('transit');
                        }}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition"
                      >
                        Track Route
                      </button>
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

        {/* TAB 3: LIVE TRANSIT MAP TRACKER */}
        {activeTab === 'transit' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Shipments List */}
              <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 max-h-[500px] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">My Assigned Cargo</h3>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold">
                    {activeDeliveries.length} active
                  </span>
                </div>
                {activeDeliveries.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No active shipments assigned to you.</p>
                ) : (
                  activeDeliveries.map(s => {
                    const isSelected = selectedTransitShipment?._id === s._id;
                    return (
                      <button
                        key={s._id}
                        onClick={() => {
                          setSelectedTransitShipment(s);
                          setTrackingLogs([...s.history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
                        }}
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
              <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col min-h-[450px]">
                {selectedTransitShipment ? (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    
                    {/* Telemetry Header */}
                    <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-slate-800 text-sm">Tracking ID: {selectedTransitShipment.trackingId}</h3>
                          <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full text-[9px] font-bold uppercase tracking-wider animate-pulse flex items-center space-x-1">
                            <span className="h-1 w-1 bg-cyan-600 rounded-full animate-ping"></span>
                            <span>WS Live Connected</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Fulfillment Target: {selectedTransitShipment.recipientName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Estimated Transit Days</span>
                        <h4 className="text-md font-black text-slate-800 mt-0.5">{selectedTransitShipment.estimatedDeliveryDays || '2.5'} Days</h4>
                      </div>
                    </div>

                    {/* Leaflet Map container */}
                    <div id="staff-tracking-map" className="h-[250px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-10"></div>

                    {/* Path Stepper Illustration */}
                    <div className="py-4 px-2 flex justify-between items-center relative">
                      <div className="absolute left-[10%] right-[10%] top-[40%] h-[3px] bg-slate-100 -translate-y-1/2 z-0 rounded-full"></div>
                      <div 
                        className="absolute left-[10%] top-[40%] h-[3px] bg-indigo-600 -translate-y-1/2 z-0 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${
                            selectedTransitShipment.status === 'Booked' ? '0%' :
                            selectedTransitShipment.status === 'Picked up' ? '25%' :
                            selectedTransitShipment.status === 'In Transit' ? '50%' :
                            selectedTransitShipment.status === 'Out for Delivery' ? '75%' :
                            selectedTransitShipment.status === 'Delivered' ? '100%' : '0%'
                          }%`
                        }}
                      ></div>

                      <div className="z-10 flex flex-col items-center">
                        <div className={`p-2 rounded-full shadow-md ${selectedTransitShipment.status !== 'Pending Payment' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                          <Warehouse size={14} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 mt-1">{selectedTransitShipment.originCity}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">Origin</span>
                      </div>

                      <div className="z-10 flex flex-col items-center">
                        <div className={`p-2 rounded-full shadow-md transition-all ${
                          selectedTransitShipment.status === 'In Transit' 
                            ? 'bg-indigo-600 text-white animate-bounce' 
                            : selectedTransitShipment.status === 'Out for Delivery' || selectedTransitShipment.status === 'Delivered'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-400 border border-slate-200'
                        }`}>
                          <Truck size={14} />
                        </div>
                        <span className="text-[9px] font-semibold text-slate-500 mt-1">In Transit</span>
                      </div>

                      <div className="z-10 flex flex-col items-center">
                        <div className={`p-2 rounded-full shadow-md ${selectedTransitShipment.status === 'Delivered' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                          <CheckCircle size={14} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 mt-1">{selectedTransitShipment.destinationCity}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">Destination</span>
                      </div>
                    </div>

                    {/* Telemetry Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-5 text-center">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Simulated Coordinates</p>
                        <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                          {selectedTransitShipment.status === 'Booked' ? '19.0760° N, 72.8777° E' :
                           selectedTransitShipment.status === 'Picked up' ? '18.9500° N, 73.1200° E' :
                           selectedTransitShipment.status === 'In Transit' ? '15.4200° N, 75.3400° E' :
                           selectedTransitShipment.status === 'Out for Delivery' ? '13.0400° N, 77.5200° E' :
                           '12.9716° N, 77.5946° E'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Transit Velocity</p>
                        <p className="text-xs font-bold text-slate-800 mt-1">
                          {selectedTransitShipment.status === 'Delivered' ? '0 km/h (At Destination)' :
                           selectedTransitShipment.shipmentType === 'Air' ? '540 km/h' :
                           selectedTransitShipment.shipmentType === 'Express' ? '82 km/h' :
                           selectedTransitShipment.shipmentType === 'Ocean' ? '28 knots' : '65 km/h'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Cargo Payload Weight</p>
                        <p className="text-xs font-bold text-slate-800 mt-1">{selectedTransitShipment.weight} kg</p>
                      </div>
                    </div>

                    {/* Timeline Logs */}
                    <div className="border-t border-slate-100 pt-5">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3">WS Timeline Status Logs</h4>
                      <div className="space-y-3 max-h-[150px] overflow-y-auto pl-1">
                        {trackingLogs.map((log, index) => (
                          <div key={index} className="flex items-start space-x-3 text-xs animate-fade-in">
                            <div className="h-2 w-2 rounded-full bg-indigo-600 mt-1.5 shrink-0 shadow-sm shadow-indigo-200"></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-700">{log.status}</span>
                                <span className="text-[9px] text-slate-400 font-semibold">
                                  {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">Location Hub: {log.location || 'Sorting Depot'}</p>
                            </div>
                          </div>
                        ))}
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

        {/* TAB 4: WAREHOUSES (Read-only for Staff) */}
        {activeTab === 'warehouses' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-800">Warehouse Storage Inventory</h2>
              <p className="text-slate-500 text-xs mt-1">Review active logistics depots, managers, and current capacities (MySQL-Backed).</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {warehouses.map(w => {
                const loadPercent = Math.min(100, Math.round((w.currentLoad / w.capacity) * 100));
                return (
                  <div key={w.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Warehouse size={18} />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs">{w.name}</h3>
                      <p className="text-slate-400 text-[10px] mt-0.5">{w.location}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-400">Occupancy</span>
                        <span className="text-slate-700">{w.currentLoad} / {w.capacity} kg ({loadPercent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            loadPercent > 85 ? 'bg-red-500' : loadPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${loadPercent}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Supervisor Manager:</span>
                      <span className="font-semibold text-slate-700">{w.managerName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: FLEET REGISTRY (Read-only + toggle status for Staff) */}
        {activeTab === 'fleet' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-800">Fleet & Vehicle Registry</h2>
              <p className="text-slate-500 text-xs mt-1">Review active cargo transport assets. Tap vehicle status pills to toggle vehicle availability.</p>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fleet.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-slate-400 italic">No vehicles registered in MySQL fleet database.</td>
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
                  <p className="text-xs font-semibold text-slate-400">Marine Bytes Registered Logistics Officer</p>
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
