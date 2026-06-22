import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  Package, MapPin, CreditCard, LogOut, RefreshCw, Sparkles, Navigation, CheckCircle, FileText, Download, Clock,
  BookOpen, Heart, HelpCircle, Bell, PlusCircle, Trash2, Shield, Compass, Calculator, Send, AlertTriangle, MessageSquare,
  BarChart2, Coins, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'];
const SHIPMENT_TYPES = ['Standard', 'Express', 'Air', 'Ocean'];
const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomerDashboard = () => {
  const { logout, user } = useAuth();
  const socket = useSocket();

  const [lang, setLang] = useState('en');
  const t = (key) => {
    const dict = {
      en: {
        totalBookings: 'Booked Orders',
        transitTracker: 'In Transit',
        spendLeaderboard: 'Spend Ledger Analysis',
        recentHistory: 'Recent Timeline History',
        activeAlerts: 'Active Alerts & Feeds',
        welcomeBack: 'Welcome back',
        bookShipment: 'Book Shipment',
        billingStatements: 'Billing Statements',
        transitMap: 'Transit Map Tracker',
        supportTickets: 'Support Tickets',
        warehouseRates: 'Logistics Tariff Calculator',
        myConsignments: 'My Consignments',
        spendLogistics: 'Spend & Logistics Charts',
        bookNewShipment: 'Book New Shipment',
        rateCalculator: 'Rate Calculator',
        shippingTariff: 'Shipping Tariff Rates',
        supportDeskChat: 'Support Desk Chat',
        billingInvoices: 'Billing Invoices',
        savedAddresses: 'Saved Addresses',
        notificationFeed: 'Notification Feed'
      },
      hi: {
        totalBookings: 'कुल बुकिंग',
        transitTracker: 'पारगमन में',
        spendLeaderboard: 'व्यय खाता विश्लेषण',
        recentHistory: 'हालिया इतिहास',
        activeAlerts: 'सक्रिय सूचनाएं',
        welcomeBack: 'आपका स्वागत है',
        bookShipment: 'शिपमेंट बुक करें',
        billingStatements: 'बिलिंग विवरण',
        transitMap: 'पारगमन मानचित्र ट्रैकर',
        supportTickets: 'सहायता टिकट',
        warehouseRates: 'लॉजिस्टिक्स टैरिफ कैलकुलेटर',
        myConsignments: 'मेरी खेप (पार्सल)',
        spendLogistics: 'व्यय और चार्ट',
        bookNewShipment: 'नया पार्सल बुक करें',
        rateCalculator: 'मूल्य कैलकुलेटर',
        shippingTariff: 'शिपिंग दर तालिका',
        supportDeskChat: 'सहायता चैट डेस्क',
        billingInvoices: 'बिलिंग इनवॉइस',
        savedAddresses: 'बचाए गए पते',
        notificationFeed: 'सूचना फ़ीड'
      }
    };
    return dict[lang][key] || key;
  };

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'book' | 'calculator' | 'tickets' | 'invoices' | 'address' | 'alerts' | 'rates'
  const [stats, setStats] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // MySQL logistics rates configuration
  const [rates, setRates] = useState({
    base_fare: 150,
    tax_rate: 18,
    per_kg_fare: 50,
    express_multiplier: 1.5,
    air_multiplier: 2.5,
    ocean_multiplier: 0.8
  });

  // Form Booking State
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [originCity, setOriginCity] = useState(CITIES[0]);
  const [destinationCity, setDestinationCity] = useState(CITIES[1]);
  const [weight, setWeight] = useState(1.0);
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(10);
  const [shipmentType, setShipmentType] = useState(SHIPMENT_TYPES[0]);
  
  // Real-time ETA estimation
  const [etaLoading, setEtaLoading] = useState(false);
  const [estimatedEta, setEstimatedEta] = useState(null);

  // AI Route Recommender State
  const [recommenderUrgency, setRecommenderUrgency] = useState('Standard');
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);

  // Rate Calculator State
  const [calcOrigin, setCalcOrigin] = useState(CITIES[0]);
  const [calcDest, setCalcDest] = useState(CITIES[1]);
  const [calcWeight, setCalcWeight] = useState(1.0);
  const [calcType, setCalcType] = useState(SHIPMENT_TYPES[0]);
  const [calculatedCost, setCalculatedCost] = useState(null);
  const [calculatedDays, setCalculatedDays] = useState(null);

  // Address Book State
  const [addresses, setAddresses] = useState([]);
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrText, setAddrText] = useState('');
  const [addrCity, setAddrCity] = useState(CITIES[0]);
  const [addrPin, setAddrPin] = useState('');

  // Support Tickets State
  const [tickets, setTickets] = useState([]);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCat, setTicketCat] = useState('General');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // In-app Notifications
  const [notifications, setNotifications] = useState([]);

  // Tracking details state
  const [trackedShipment, setTrackedShipment] = useState(null);
  const [trackingLogs, setTrackingLogs] = useState([]);

  // Payment State
  const [payingShipment, setPayingShipment] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Chat and Map Refs/States
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [chatMode, setChatMode] = useState('ai');
  const chatBottomRef = useRef(null);

  // Floating AI Chatbot State
  const [floatingChatOpen, setFloatingChatOpen] = useState(false);
  const [floatingMessages, setFloatingMessages] = useState([
    { text: "Hello! I am your Marine Bytes AI Assistant. How can I help you today?", isAi: true, time: new Date() }
  ]);
  const [floatingInput, setFloatingInput] = useState('');
  const [floatingLoading, setFloatingLoading] = useState(false);
  const floatingChatBottomRef = useRef(null);
  const mapRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const statsRes = await axios.get('/dashboard/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      const shipmentsRes = await axios.get('/shipments/customer');
      if (shipmentsRes.data.success) {
        setShipments(shipmentsRes.data.shipments);
      }

      const invoicesRes = await axios.get('/payments/invoices');
      if (invoicesRes.data.success) {
        setInvoices(invoicesRes.data.invoices);
      }

      const addressRes = await axios.get('/auth/addresses');
      if (addressRes.data.success) {
        setAddresses(addressRes.data.addresses);
      }

      const ticketRes = await axios.get('/shipments/tickets');
      if (ticketRes.data.success) {
        setTickets(ticketRes.data.tickets);
      }

      const notifRes = await axios.get('/notifications');
      if (notifRes.data.success) {
        setNotifications(notifRes.data.notifications);
      }

      // Fetch dynamic tariff rates from MySQL
      const ratesRes = await axios.get('/logistics/rates');
      if (ratesRes.data.success && Object.keys(ratesRes.data.rates).length > 0) {
        setRates(ratesRes.data.rates);
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

  const exportInvoicesToCSV = () => {
    if (invoices.length === 0) return toast.error('No invoices to export.');
    const headers = ['Invoice Number', 'Date', 'Payment ID', 'Amount Paid'];
    const rows = invoices.map(inv => [
      inv.invoiceNumber,
      new Date(inv.createdAt).toLocaleDateString(),
      inv.paymentId,
      inv.amount
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
    toast.success('Invoices exported successfully!');
  };

  // Update Live ETA prediction on form changes
  const checkLiveEta = async () => {
    if (!originCity || !destinationCity || originCity === destinationCity) {
      return setEstimatedEta(null);
    }
    
    setEtaLoading(true);
    try {
      const res = await axios.post('/shipments/calculate-eta', {
        origin: originCity,
        destination: destinationCity,
        weight: parseFloat(weight),
        shipmentType
      });
      if (res.data.success) {
        setEstimatedEta(res.data.estimated_delivery_days);
      }
    } catch (err) {
      const dist = Math.abs(originCity.length - destinationCity.length) + 3;
      let base = dist * 0.8;
      if (shipmentType === 'Air') base *= 0.3;
      else if (shipmentType === 'Express') base *= 0.6;
      else if (shipmentType === 'Ocean') base *= 1.8;
      setEstimatedEta(Math.round((base + weight * 0.005 + 0.5) * 10) / 10);
    } finally {
      setEtaLoading(false);
    }
  };

  const handleGetAiRecommendation = async () => {
    if (originCity === destinationCity) {
      return toast.error('Origin and Destination cities must be different.');
    }

    setRecommendationLoading(true);
    setAiRecommendation(null);
    try {
      const res = await axios.post('/shipments/recommend-route', {
        origin: originCity,
        destination: destinationCity,
        weight,
        urgency: recommenderUrgency
      });

      if (res.data.success) {
        setAiRecommendation(res.data.recommendation);
        toast.success('AI recommendation loaded successfully!');
      }
    } catch (err) {
      toast.error('Failed to load AI route recommendation.');
    } finally {
      setRecommendationLoading(false);
    }
  };

  useEffect(() => {
    checkLiveEta();
  }, [originCity, destinationCity, weight, shipmentType]);

  // Leaflet Map Initialization and Update Loop
  useEffect(() => {
    if (!trackedShipment || !window.L) return;

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

    const originCoords = cityCoordinates[trackedShipment.originCity] || [20.5937, 78.9629];
    const destCoords = cityCoordinates[trackedShipment.destinationCity] || [20.5937, 78.9629];

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Wrap in a short timeout to ensure container is fully rendered in DOM
    const timer = setTimeout(() => {
      const mapEl = document.getElementById('tracking-map');
      if (!mapEl) return;

      const map = window.L.map('tracking-map', {
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

      // Origin
      window.L.marker(originCoords, {
        icon: window.L.divIcon({
          className: 'bg-indigo-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-[10px] border border-white shadow-md',
          html: 'A',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map).bindPopup(`<b>Origin Hub:</b> ${trackedShipment.originCity}`);

      // Destination
      window.L.marker(destCoords, {
        icon: window.L.divIcon({
          className: 'bg-emerald-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-[10px] border border-white shadow-md',
          html: 'B',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map).bindPopup(`<b>Destination Hub:</b> ${trackedShipment.destinationCity}`);

      // Route
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

      const progress = statusProgress[trackedShipment.status] || 0;
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
      }).addTo(map).bindPopup(`<b>Package Status:</b> ${trackedShipment.status}`);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [trackedShipment, trackingLogs]);

  // Load chat history and join room
  useEffect(() => {
    if (!socket || activeTab !== 'chat' || !user) return;

    socket.emit('chat:join', user.id);

    axios.get(`/chat/history/${user.id}`).then(res => {
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
  }, [socket, activeTab, user]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !socket || !user) return;

    socket.emit('chat:send_message', {
      roomId: user.id,
      senderId: user.id,
      senderName: user.name,
      senderRole: 'customer',
      message: newMessageText.trim(),
      chatMode: chatMode
    });

    setNewMessageText('');
  };

  useEffect(() => {
    if (floatingChatBottomRef.current) {
      floatingChatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [floatingMessages, floatingChatOpen]);

  const handleSendFloatingMessage = async (e) => {
    e.preventDefault();
    if (!floatingInput.trim() || floatingLoading) return;

    const userText = floatingInput.trim();
    setFloatingInput('');
    setFloatingMessages(prev => [...prev, { text: userText, isAi: false, time: new Date() }]);
    setFloatingLoading(true);

    try {
      const res = await axios.post('/chat/ai', { message: userText });
      if (res.data.success) {
        setFloatingMessages(prev => [
          ...prev,
          { text: res.data.response, isAi: true, time: new Date() }
        ]);
      }
    } catch (err) {
      setFloatingMessages(prev => [
        ...prev,
        { text: "Sorry, I ran into an error trying to process your request. Please try again.", isAi: true, time: new Date() }
      ]);
    } finally {
      setFloatingLoading(false);
    }
  };

  // Rate Calculator Logic
  const handleCalculateRate = async (e) => {
    e.preventDefault();
    if (calcOrigin === calcDest) {
      return toast.error('Origin and Destination cities must be different.');
    }

    // Cost formula using MySQL dynamic rates
    const basePrice = rates.base_fare || 150.0;
    const perKgRate = rates.per_kg_fare || 50.0;
    const taxPercent = rates.tax_rate || 18.0;

    let multiplier = 1.0;
    if (calcType === 'Express') multiplier = rates.express_multiplier || 1.5;
    else if (calcType === 'Air') multiplier = rates.air_multiplier || 2.5;
    else if (calcType === 'Ocean') multiplier = rates.ocean_multiplier || 0.8;
    
    const costBeforeTax = (basePrice + (calcWeight * perKgRate)) * multiplier;
    const cost = costBeforeTax * (1 + (taxPercent / 100));
    setCalculatedCost(Math.round(cost * 100) / 100);

    // Call ML prediction endpoint for calculator
    try {
      const res = await axios.post('/shipments/calculate-eta', {
        origin: calcOrigin,
        destination: calcDest,
        weight: calcWeight,
        shipmentType: calcType
      });
      if (res.data.success) {
        setCalculatedDays(res.data.estimated_delivery_days);
      }
    } catch (err) {
      const dist = Math.abs(calcOrigin.length - calcDest.length) + 3;
      let base = dist * 0.8;
      if (calcType === 'Air') base *= 0.3;
      else if (calcType === 'Express') base *= 0.6;
      else if (calcType === 'Ocean') base *= 1.8;
      setCalculatedDays(Math.round((base + calcWeight * 0.005 + 0.5) * 10) / 10);
    }
  };

  // Submit Support Ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!ticketTitle || !ticketMessage) return;

    setSubmittingTicket(true);
    try {
      const res = await axios.post('/shipments/tickets', {
        title: ticketTitle,
        message: ticketMessage,
        category: ticketCat
      });
      if (res.data.success) {
        toast.success('Support ticket created successfully.');
        setTicketTitle('');
        setTicketMessage('');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to submit ticket.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Create Address Card
  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!addrName || !addrPhone || !addrText || !addrPin) return;

    try {
      const res = await axios.post('/auth/addresses', {
        name: addrName,
        phone: addrPhone,
        address: addrText,
        city: addrCity,
        pincode: addrPin
      });
      if (res.data.success) {
        toast.success('Address saved.');
        setAddrName('');
        setAddrPhone('');
        setAddrText('');
        setAddrPin('');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to save address.');
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id) => {
    try {
      const res = await axios.delete(`/auth/addresses/${id}`);
      if (res.data.success) {
        toast.success('Address deleted.');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to delete address.');
    }
  };

  // Socket Tracking listener
  useEffect(() => {
    if (!socket || !trackedShipment) return;

    socket.emit('join:shipment', trackedShipment.trackingId);

    socket.on('status-update', (data) => {
      if (data.trackingId === trackedShipment.trackingId) {
        toast.success(`Package status updated to: ${data.status}`);
        setTrackingLogs(prev => [
          { status: data.status, location: data.location, timestamp: data.timestamp },
          ...prev
        ]);
        
        setTrackedShipment(prev => ({ ...prev, status: data.status }));
        
        axios.get('/shipments/customer').then(res => {
          if (res.data.success) setShipments(res.data.shipments);
        });
      }
    });

    return () => {
      socket.off('status-update');
    };
  }, [socket, trackedShipment]);

  const handleTrack = (shipment) => {
    setTrackedShipment(shipment);
    const sortedLogs = [...shipment.history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setTrackingLogs(sortedLogs);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (originCity === destinationCity) {
      return toast.error('Origin and Destination cities must be different.');
    }

    try {
      const res = await axios.post('/shipments/book', {
        recipientName,
        recipientAddress,
        originCity,
        destinationCity,
        weight,
        length,
        width,
        height,
        shipmentType
      });

      if (res.data.success) {
        toast.success('Shipment draft saved. Redirecting to checkout...');
        setRecipientName('');
        setRecipientAddress('');
        setWeight(1.0);
        
        setPayingShipment(res.data.shipment);
        setActiveTab('orders');
        fetchData();
      }
    } catch (err) {
      toast.error('Booking failed. Please try again.');
    }
  };

  const handlePayment = async (shipment) => {
    setPaymentLoading(true);
    try {
      const orderRes = await axios.post('/payments/order', { shipmentId: shipment.id });
      const { order, keyId, amount, isMock } = orderRes.data;

      if (isMock) {
        toast.loading('Simulating Payment Verification...', { id: 'verify' });
        setTimeout(async () => {
          try {
            const verifyRes = await axios.post('/payments/verify', {
              shipmentId: shipment.id,
              razorpay_order_id: order.id,
              isMock: true
            });
            if (verifyRes.data.success) {
              toast.success('Mock Payment Successful!', { id: 'verify' });
              setPayingShipment(null);
              fetchData();
            }
          } catch (e) {
            toast.error('Verification failed.', { id: 'verify' });
          }
        }, 1500);
        return;
      }

      const loadScript = () => new Promise(res => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => res(true);
        script.onerror = () => res(false);
        document.body.appendChild(script);
      });

      const loaded = await loadScript();
      if (!loaded) {
        setPaymentLoading(false);
        return toast.error('Razorpay SDK failed to load.');
      }

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Marine Bytes Logistics',
        description: `Shipment cost for ${shipment.trackingId}`,
        order_id: order.id,
        handler: async (response) => {
          toast.loading('Verifying Payment Signature...', { id: 'verify' });
          try {
            const verifyRes = await axios.post('/payments/verify', {
              shipmentId: shipment.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              isMock: false
            });
            if (verifyRes.data.success) {
              toast.success('Payment Received! Shipment Booked.', { id: 'verify' });
              setPayingShipment(null);
              fetchData();
            }
          } catch (err) {
            toast.error('Verification signature validation failed.', { id: 'verify' });
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: { color: '#4f46e5' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error('Payment checkout initiation failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceNumber) => {
    try {
      toast.loading('Downloading invoice...', { id: 'download' });
      const response = await axios.get(`/payments/invoice/${invoiceNumber}/download`, {
        responseType: 'blob'
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `Invoice-${invoiceNumber}.pdf`;
      link.click();
      toast.success('Download complete!', { id: 'download' });
    } catch (err) {
      toast.error('Failed to download PDF.', { id: 'download' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-5 z-20">
        <div className="space-y-6">
          
          {/* Logo */}
          <div className="flex items-center justify-between px-2 py-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 text-white rounded-xl">
                <Package size={20} />
              </div>
              <div>
                <span className="font-extrabold text-slate-800 text-lg leading-none">Marine Bytes</span>
                <span className="text-[10px] text-slate-400 block font-bold tracking-widest uppercase">Customer portal</span>
              </div>
            </div>
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition flex items-center space-x-1"
              title="Toggle Language"
            >
              <Globe size={13} />
              <span className="uppercase text-[9px] font-extrabold">{lang}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: 'orders', label: t('myConsignments'), icon: Compass },
              { id: 'analytics', label: t('spendLogistics'), icon: BarChart2 },
              { id: 'book', label: t('bookNewShipment'), icon: PlusCircle },
              { id: 'calculator', label: t('rateCalculator'), icon: Calculator },
              { id: 'rates', label: t('shippingTariff'), icon: Coins },
              { id: 'chat', label: t('supportDeskChat'), icon: MessageSquare },
              { id: 'tickets', label: t('supportTickets'), icon: HelpCircle },
              { id: 'invoices', label: t('billingInvoices'), icon: FileText },
              { id: 'address', label: t('savedAddresses'), icon: BookOpen },
              { id: 'alerts', label: t('notificationFeed'), icon: Bell }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setTrackedShipment(null); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-150 ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/50' 
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
            <div className="bg-purple-100 text-purple-600 p-2.5 rounded-full font-bold text-xs uppercase">
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

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className={`col-span-12 ${trackedShipment ? 'lg:col-span-7' : ''} space-y-6`}>
            
            {/* TAB 1: ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-fade-in">
                {payingShipment && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 text-amber-700">
                      <Clock size={20} />
                      <div>
                        <p className="font-bold text-xs">Unpaid Shipment Awaiting Checkout</p>
                        <p className="text-[10px] text-slate-500">Order {payingShipment.trackingId} needs payment confirmation.</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => setPayingShipment(null)} className="px-3 py-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold">Dismiss</button>
                      <button onClick={() => handlePayment(payingShipment)} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs shadow-sm flex items-center space-x-1">
                        <CreditCard size={12} />
                        <span>Pay Cost</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Package size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booked Orders</p>
                      <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats?.totalBooked || 0}</h3>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                      <Navigation size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Transit</p>
                      <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats?.activeShipments || 0}</h3>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <CreditCard size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Spent</p>
                      <h3 className="text-2xl font-black text-slate-800 mt-0.5">₹{stats?.totalSpent?.toLocaleString('en-IN') || '0.00'}</h3>
                    </div>
                  </div>
                </div>

                {/* Consignments List */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4">My Consignments Registry</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold">
                          <th className="pb-3">Tracking ID</th>
                          <th className="pb-3">Route</th>
                          <th className="pb-3">Est. Days</th>
                          <th className="pb-3">Service</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {shipments.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-6 text-center text-slate-400 italic">No shipment records found.</td>
                          </tr>
                        ) : (
                          shipments.map((shipment) => (
                            <tr key={shipment.id} className="hover:bg-slate-50/30 transition">
                              <td className="py-3.5 font-bold text-slate-800">{shipment.trackingId}</td>
                              <td className="py-3.5">{shipment.originCity} → {shipment.destinationCity}</td>
                              <td className="py-3.5 font-semibold text-indigo-600">{shipment.estimatedDeliveryDays ? `${shipment.estimatedDeliveryDays} days` : 'N/A'}</td>
                              <td className="py-3.5">
                                <span className="px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700">
                                  {shipment.shipmentType}
                                </span>
                              </td>
                              <td className="py-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  shipment.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                                  shipment.status === 'Pending Payment' ? 'bg-slate-100 text-slate-400' :
                                  'bg-indigo-100 text-indigo-700 animate-pulse'
                                }`}>
                                  {shipment.status}
                                </span>
                              </td>
                              <td className="py-3.5 text-right space-x-2">
                                {shipment.status === 'Pending Payment' ? (
                                  <button onClick={() => handlePayment(shipment)} className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold transition">Pay & Book</button>
                                ) : (
                                  <button onClick={() => handleTrack(shipment)} className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold transition">Track Logs</button>
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

            {/* TAB: ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Spend & Logistics Analytics</h2>
                  <p className="text-slate-500 text-sm mt-1">Detailed overview of your shipping patterns, expenses, and distribution.</p>
                </div>

                {/* Spend Trend Chart */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">Monthly Spending Trend</h3>
                    <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg font-bold">Last 6 Months</span>
                  </div>
                  <div className="h-72">
                    {stats?.spendHistory && stats.spendHistory.some(h => h.amount > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.spendHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(value) => `₹${value}`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                            formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Spent']}
                          />
                          <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpend)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-slate-400 text-xs italic">
                        <span>No spend history logged yet.</span>
                        <span className="text-[10px] text-slate-400 not-italic mt-1">Book and pay for a shipment to view your spending trend.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grid for distribution charts */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Shipping Channel Pie */}
                  <div className="lg:col-span-6 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Shipping Channels</h3>
                    <div className="h-64 flex items-center justify-center">
                      {stats?.typeBreakdown && Object.values(stats.typeBreakdown).some(v => v > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.keys(stats.typeBreakdown).map(key => ({ name: key, value: stats.typeBreakdown[key] }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {Object.keys(stats.typeBreakdown).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                            <Legend verticalAlign="bottom" height={36} fontSize={11} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 text-xs italic">No shipments registered yet.</div>
                      )}
                    </div>
                  </div>

                  {/* Consignment Status Bar */}
                  <div className="lg:col-span-6 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Consignment Lifecycle States</h3>
                    <div className="h-64">
                      {stats?.statusBreakdown && Object.values(stats.statusBreakdown).some(v => v > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={Object.keys(stats.statusBreakdown).map(key => ({ name: key, count: stats.statusBreakdown[key] }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                            <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                            <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                              {Object.keys(stats.statusBreakdown).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 text-xs italic">No status history logged yet.</div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 2: BOOK SHIPMENT */}
            {activeTab === 'book' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
                <div className="md:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Book New Delivery</h3>
                  
                  <form onSubmit={handleBook} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Origin</label>
                        <select value={originCity} onChange={(e) => setOriginCity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800">
                          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Destination</label>
                        <select value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800">
                          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Weight (kg)</label>
                        <input type="number" step="0.1" min="0.1" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Shipment Method</label>
                        <select value={shipmentType} onChange={(e) => setShipmentType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800">
                          {SHIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 grid grid-cols-3 gap-3">
                      <input type="number" placeholder="L cm" value={length} onChange={(e) => setLength(parseInt(e.target.value) || 0)} className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-center" required />
                      <input type="number" placeholder="W cm" value={width} onChange={(e) => setWidth(parseInt(e.target.value) || 0)} className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-center" required />
                      <input type="number" placeholder="H cm" value={height} onChange={(e) => setHeight(parseInt(e.target.value) || 0)} className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-center" required />
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <input type="text" placeholder="Recipient Name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs" required />
                      <textarea placeholder="Delivery Address" rows="3" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs" required></textarea>
                    </div>

                    <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-indigo-glow">Confirm Details & Pay</button>
                  </form>
                </div>

                <div className="md:col-span-4 space-y-6 flex flex-col h-fit">
                  {/* ETA Card */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                      <Sparkles size={14} className="text-indigo-600" />
                      <span>Estimated Transit ETA</span>
                    </h4>
                    {etaLoading ? (
                      <div className="py-6 text-center text-xs text-slate-400">Predicting delivery...</div>
                    ) : estimatedEta ? (
                      <div className="text-center py-4 space-y-2">
                        <span className="block text-4xl font-extrabold text-indigo-600">{estimatedEta}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Days Transit Time</span>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs italic">Awaiting origin/dest.</div>
                    )}
                  </div>

                  {/* Estimated Cost Card */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm animate-fade-in">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                      <Coins size={14} className="text-emerald-600" />
                      <span>Estimated Cost Quote</span>
                    </h4>
                    <div className="text-center py-4 space-y-2">
                      <span className="block text-3xl font-black text-emerald-600">
                        ₹{(() => {
                          const basePrice = rates.base_fare || 150.0;
                          const perKgRate = rates.per_kg_fare || 50.0;
                          const taxPercent = rates.tax_rate || 18.0;

                          let multiplier = 1.0;
                          if (shipmentType === 'Express') multiplier = rates.express_multiplier || 1.5;
                          else if (shipmentType === 'Air') multiplier = rates.air_multiplier || 2.5;
                          else if (shipmentType === 'Ocean') multiplier = rates.ocean_multiplier || 0.8;
                          
                          const costBeforeTax = (basePrice + (weight * perKgRate)) * multiplier;
                          const cost = costBeforeTax * (1 + (taxPercent / 100));
                          return Math.round(cost * 100) / 100;
                        })().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                        Includes GST ({rates.tax_rate || 18}%) & Service factors
                      </span>
                    </div>
                  </div>

                  {/* AI Recommender Card */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 border-b border-slate-100 pb-3">
                      <Sparkles size={14} className="text-purple-600" />
                      <span>AI Route Recommender</span>
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Delivery Urgency</label>
                        <select
                          value={recommenderUrgency}
                          onChange={(e) => setRecommenderUrgency(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[11px] text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Standard">Standard (Economical)</option>
                          <option value="Rush">Rush (Fast Delivery)</option>
                          <option value="Urgent">Urgent (Immediate Flight)</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleGetAiRecommendation}
                        disabled={recommendationLoading}
                        className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-[10px] font-bold transition shadow-sm"
                      >
                        {recommendationLoading ? 'Analyzing Route...' : '✨ Get AI Recommendation'}
                      </button>
                    </div>

                    {aiRecommendation && (
                      <div className="pt-3 border-t border-slate-100 space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-500">Recommended:</span>
                          <span className="px-2.5 py-0.5 rounded bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-black uppercase">
                            {aiRecommendation.recommendedMode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {aiRecommendation.explanation}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setShipmentType(aiRecommendation.recommendedMode);
                            toast.success(`Applied recommended mode: ${aiRecommendation.recommendedMode}`);
                          }}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold transition"
                        >
                          Apply Recommended Mode
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: RATE CALCULATOR */}
            {activeTab === 'calculator' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-fade-in">
                <div className="md:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Instant Rate Estimator</h3>
                  
                  <form onSubmit={handleCalculateRate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">From</label>
                        <select value={calcOrigin} onChange={(e) => setCalcOrigin(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs">
                          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">To</label>
                        <select value={calcDest} onChange={(e) => setCalcDest(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs">
                          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Weight (kg)</label>
                        <input type="number" step="0.1" value={calcWeight} onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Service</label>
                        <select value={calcType} onChange={(e) => setCalcType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs">
                          {SHIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition">Calculate Estimation</button>
                  </form>
                </div>

                <div className="md:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-fit">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">Pricing & Transit Quote</h4>
                  {calculatedCost ? (
                    <div className="space-y-4">
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs text-slate-500 font-semibold">Estimated Cost</span>
                        <span className="text-xs font-bold text-emerald-600">₹{calculatedCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-500 font-semibold">Estimated Transit Duration</span>
                        <span className="text-xs font-bold text-indigo-600">{calculatedDays || 'N/A'} Days</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs italic">Submit parameters to calculate.</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: SUPPORT TICKETS */}
            {activeTab === 'tickets' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-fit">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Submit Support Ticket</h3>
                  
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Category</label>
                      <select value={ticketCat} onChange={(e) => setTicketCat(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs">
                        <option value="General">General Inquiries</option>
                        <option value="Delay">Delivery Delay</option>
                        <option value="Billing">Billing & Cost Errors</option>
                        <option value="Damage package">Damage package / Claims</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Issue Title</label>
                      <input type="text" value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} placeholder="Brief title of issue" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs" required />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Description Message</label>
                      <textarea value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} placeholder="Describe the issue in detail..." rows="4" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs" required></textarea>
                    </div>

                    <button type="submit" disabled={submittingTicket} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition">
                      {submittingTicket ? 'Submitting...' : 'Send Ticket'}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">My Support Tickets</h3>
                  
                  <div className="space-y-3">
                    {tickets.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6">No support tickets submitted.</p>
                    ) : (
                      tickets.map(t => (
                        <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9px] font-bold uppercase">{t.category}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${t.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{t.status}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800">{t.title}</h4>
                          <p className="text-[11px] text-slate-500">{t.message}</p>
                          <span className="text-[9px] text-slate-400 block font-medium">Created: {new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: BILLING INVOICES */}
            {activeTab === 'invoices' && (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">Billing Ledger logs</h3>
                  <button
                    onClick={exportInvoicesToCSV}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 self-start sm:self-auto shadow-sm"
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="pb-3.5">Invoice Number</th>
                        <th className="pb-3.5">Date</th>
                        <th className="pb-3.5">Payment ID</th>
                        <th className="pb-3.5">Amount Paid</th>
                        <th className="pb-3.5 text-right">Invoice Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-6 text-center text-slate-400 italic">No billing statements available.</td>
                        </tr>
                      ) : (
                        invoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-slate-50/40 transition">
                            <td className="py-3.5 font-bold text-slate-800">{invoice.invoiceNumber}</td>
                            <td className="py-3.5 text-slate-400">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                            <td className="py-3.5 text-slate-500 font-mono text-[10px]">{invoice.paymentId}</td>
                            <td className="py-3.5 font-bold text-emerald-600">₹{Number(invoice.amount || 0).toFixed(2)}</td>
                            <td className="py-3.5 text-right">
                              <button
                                onClick={() => handleDownloadInvoice(invoice.invoiceNumber)}
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
              </div>
            )}

            {/* TAB 6: SAVED ADDRESSES */}
            {activeTab === 'address' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-fit">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Save New Address</h3>
                  
                  <form onSubmit={handleCreateAddress} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Recipient Name</label>
                      <input type="text" value={addrName} onChange={(e) => setAddrName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Contact Phone</label>
                      <input type="tel" value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Complete Address</label>
                      <textarea value={addrText} onChange={(e) => setAddrText(e.target.value)} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs" required></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">City</label>
                        <select value={addrCity} onChange={(e) => setAddrCity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2 text-xs">
                          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Pincode</label>
                        <input type="text" value={addrPin} onChange={(e) => setAddrPin(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2 text-xs" required />
                      </div>
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-indigo-glow">Save Address</button>
                  </form>
                </div>

                <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">My Saved Addresses</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-6 col-span-2 text-center">No saved addresses.</p>
                    ) : (
                      addresses.map(a => (
                        <div key={a.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-2">
                          <button onClick={() => handleDeleteAddress(a.id)} className="absolute top-3 right-3 p-1.5 bg-white border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition">
                            <Trash2 size={12} />
                          </button>
                          <h4 className="text-xs font-bold text-slate-800 pr-6">{a.name}</h4>
                          <p className="text-[11px] text-slate-500">{a.address}</p>
                          <p className="text-[10px] font-semibold text-slate-700">{a.city} - {a.pincode}</p>
                          <span className="text-[9px] text-slate-400 block font-medium">Phone: {a.phone}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: NOTIFICATION FEED */}
            {activeTab === 'alerts' && (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm max-w-2xl animate-fade-in">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Notification History Logs</h3>
                
                <div className="divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">No recent notification alerts.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="py-3.5 flex items-start space-x-3 hover:bg-slate-50/20 transition px-2 rounded-lg">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mt-0.5">
                          <Bell size={14} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-slate-400 block mt-1 font-semibold">{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: SHIPPING TARIFF RATES (MySQL) */}
            {activeTab === 'rates' && (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm max-w-2xl animate-fade-in space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Logistics Shipping Tariff Rates</h2>
                  <p className="text-slate-500 text-xs mt-1">Review active delivery rates and transport multipliers configured by administration (MySQL Stored).</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Base Booking Charge</span>
                    <p className="text-lg font-black text-slate-800">₹{rates.base_fare || 150.0}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Flat fee charged for any parcel booking registration</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Service GST Tax</span>
                    <p className="text-lg font-black text-slate-800">{rates.tax_rate || 18.0}%</p>
                    <p className="text-[10px] text-slate-400 font-medium">Standard goods and services tax applied on final cost</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Weight Rate per Kilogram</span>
                    <p className="text-lg font-black text-slate-800">₹{rates.per_kg_fare || 50.0} / kg</p>
                    <p className="text-[10px] text-slate-400 font-medium">Additional payload weight charge</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Express Multiplier</span>
                    <p className="text-lg font-black text-slate-800">{rates.express_multiplier || 1.5}x</p>
                    <p className="text-[10px] text-slate-400 font-medium">Fulfillment speed multiplier for Express priority</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Air Cargo Multiplier</span>
                    <p className="text-lg font-black text-slate-800">{rates.air_multiplier || 2.5}x</p>
                    <p className="text-[10px] text-slate-400 font-medium">Transit route channel factor for Air dispatch</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ocean Freight Discount</span>
                    <p className="text-lg font-black text-slate-800">{rates.ocean_multiplier || 0.8}x</p>
                    <p className="text-[10px] text-slate-400 font-medium">Slow transport discount applied for sea cargo routes</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: SUPPORT CHAT */}
            {activeTab === 'chat' && (
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-[550px] overflow-hidden animate-fade-in">
                {/* Chat Header */}
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Support Desk Chat</h3>
                      <p className="text-[10px] text-slate-400 font-bold">Ask questions in real-time</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setChatMode(prev => prev === 'ai' ? 'staff' : 'ai')}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition duration-150 flex items-center space-x-1.5 ${
                        chatMode === 'ai'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>🤖 {chatMode === 'ai' ? 'AI Assistant: ON' : 'Talk to AI'}</span>
                    </button>
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>Support Agents Online</span>
                    </span>
                  </div>
                </div>

                {/* Chat Log */}
                <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                      <MessageSquare size={36} className="text-slate-300 stroke-[1.5]" />
                      <p className="text-xs italic">No messages yet. Send a message to start chatting with support!</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => {
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
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-200 bg-white flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Type your message here..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition flex items-center justify-center border border-transparent"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Live WS timeline tracking side drawer */}
          {trackedShipment && (
            <div className="col-span-12 lg:col-span-5 animate-fade-in">
              <div className="bg-white border border-cyan-500/30 p-6 rounded-3xl shadow-cyan-glow relative">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-cyan-600">WebSocket Live Tracker</h3>
                    <p className="text-[10px] text-slate-400 font-bold">{trackedShipment.trackingId}</p>
                  </div>
                  <button onClick={() => setTrackedShipment(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕ Close</button>
                </div>

                {/* Map widget */}
                <div id="tracking-map" className="mb-6 h-[200px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-10"></div>

                <div className="space-y-6 pl-2 relative">
                  <div className="absolute left-[13px] top-[10px] bottom-[10px] w-0.5 bg-slate-100"></div>

                  {trackingLogs.map((log, index) => (
                    <div key={index} className="flex items-start space-x-4 relative">
                      <div className={`z-10 rounded-full p-1 border-4 ${index === 0 ? 'bg-cyan-500 border-cyan-100 shadow-cyan-glow' : 'bg-slate-100 border-slate-50'}`}>
                        <CheckCircle size={10} className={index === 0 ? 'text-white' : 'text-slate-400'} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold ${index === 0 ? 'text-cyan-600' : 'text-slate-700'}`}>{log.status}</p>
                          <span className="text-[9px] text-slate-400 font-bold">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Location: {log.location || 'Warehouse node'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {trackedShipment.status === 'Delivered' && trackedShipment.signature && (
                  <div className="mt-6 pt-5 border-t border-slate-100 animate-fade-in">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Captured Proof of Delivery</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center">
                      <img 
                        src={trackedShipment.signature} 
                        alt="Proof of Delivery Signature" 
                        className="max-h-[80px] w-auto border-b border-dashed border-slate-300 pb-2 mb-2 select-none" 
                      />
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Customer Signature Receipt</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Floating AI Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Panel */}
        {floatingChatOpen && (
          <div className="w-[340px] h-[450px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-extrabold text-xs tracking-wider uppercase">Marine Bytes AI Assistant</span>
              </div>
              <button 
                onClick={() => setFloatingChatOpen(false)}
                className="text-white hover:text-indigo-200 text-sm font-bold bg-white/10 rounded-full h-6 w-6 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-3">
              {floatingMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.isAi ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-xs shadow-sm ${
                    msg.isAi 
                      ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-none' 
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}>
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className={`text-[8px] block text-right mt-1 font-semibold ${msg.isAi ? 'text-slate-400' : 'text-indigo-200'}`}>
                      {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {floatingLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-400 border border-slate-100 rounded-2xl rounded-tl-none p-3 text-xs shadow-sm flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={floatingChatBottomRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendFloatingMessage} className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
              <input
                type="text"
                value={floatingInput}
                onChange={(e) => setFloatingInput(e.target.value)}
                placeholder="Ask AI anything..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={floatingLoading}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition flex items-center justify-center border border-transparent disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {/* Floating Bubble Button */}
        <button
          onClick={() => setFloatingChatOpen(prev => !prev)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg hover:shadow-indigo-glow border border-indigo-400/20 hover:scale-105 active:scale-95 transition duration-150 relative"
        >
          {floatingChatOpen ? (
            <span className="text-xl font-bold">✕</span>
          ) : (
            <span className="text-2xl animate-pulse">🤖</span>
          )}
          {!floatingChatOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 border-2 border-white"></span>
            </span>
          )}
        </button>
      </div>

    </div>
  );
};

const Loader2 = ({ className, size }) => (
  <svg className={`animate-spin ${className}`} style={{ width: size, height: size }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default CustomerDashboard;
