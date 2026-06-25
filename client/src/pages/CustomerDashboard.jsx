import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  Package, MapPin, CreditCard, LogOut, RefreshCw, Sparkles, Navigation, CheckCircle, FileText, Download, Clock,
  BookOpen, Heart, HelpCircle, Bell, PlusCircle, Trash2, Shield, Compass, Calculator, Send, AlertTriangle, MessageSquare,
  BarChart2, Coins, Globe, Bug, Camera, ClipboardList, Phone, User, Anchor, TrendingUp, Ship, Activity,
  Settings, Gift, Calendar, Undo2, Copy, Check, Award, Star, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const COUNTRIES_AND_CITIES = {
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'San Francisco', 'Miami'],
  'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide']
};
const CITIES = COUNTRIES_AND_CITIES['India'];
const SHIPMENT_TYPES = ['Standard', 'Express', 'Air', 'Ocean'];
const DOMESTIC_TYPES = ['Standard', 'Express', 'Air', 'Ocean'];
const INTERNATIONAL_TYPES = ['Air Cargo', 'Ocean Freight'];
const getAvailableTypes = (origin, dest) => {
  const o = (origin || '').toLowerCase();
  const d = (dest || '').toLowerCase();
  const isInternational = o !== d && !(o === 'india' && d === 'india');
  return isInternational ? INTERNATIONAL_TYPES : DOMESTIC_TYPES;
};
const getTypeMapping = (type) => {
  if (type === 'Air Cargo') return 'Air';
  if (type === 'Ocean Freight') return 'Ocean';
  return type;
};
const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const VESSEL_DATA = {
  'MV Blue Horizon': {
    name: 'MV Blue Horizon',
    imo: 'IMO 9846201',
    callSign: 'V7XW8',
    flag: 'Panama 🇵🇦',
    route: 'Mumbai Port ➔ Dubai Jebel Ali',
    speed: '22.4 kn',
    cargo: '4,200 TEU',
    progress: 64,
    eta: '1.2 Days',
    status: 'Cruising',
    statusColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    coordinates: '19°05\'N, 70°22\'E (Arabian Sea)',
    engineTemp: 82,
    fuelLevel: 78,
    draftDepth: 12.4,
    crewOnBoard: 24,
    cargoDistribution: [
      { name: 'Dry Cargo', value: 40, color: 'bg-indigo-500' },
      { name: 'Reefer Cargo', value: 30, color: 'bg-emerald-500' },
      { name: 'Hazardous', value: 15, color: 'bg-amber-500' },
      { name: 'Special Delivery', value: 15, color: 'bg-purple-500' }
    ]
  },
  'MV Atlantic Clipper': {
    name: 'MV Atlantic Clipper',
    imo: 'IMO 9621458',
    callSign: 'ZQD82',
    flag: 'Singapore 🇸🇬',
    route: 'Chennai Port ➔ Singapore Terminal',
    speed: '18.2 kn',
    cargo: '2,800 TEU',
    progress: 82,
    eta: '0.4 Days',
    status: 'Arriving',
    statusColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    coordinates: '5°55\'N, 95°12\'E (Strait of Malacca)',
    engineTemp: 79,
    fuelLevel: 45,
    draftDepth: 10.8,
    crewOnBoard: 18,
    cargoDistribution: [
      { name: 'Dry Cargo', value: 50, color: 'bg-indigo-500' },
      { name: 'Reefer Cargo', value: 20, color: 'bg-emerald-500' },
      { name: 'Hazardous', value: 10, color: 'bg-amber-500' },
      { name: 'Special Delivery', value: 20, color: 'bg-purple-500' }
    ]
  },
  'MV Pacific Swift': {
    name: 'MV Pacific Swift',
    imo: 'IMO 9912543',
    callSign: 'A3FD9',
    flag: 'Marshall Islands 🇲🇭',
    route: 'Dubai Port ➔ Rotterdam Terminal',
    speed: '24.1 kn',
    cargo: '6,400 TEU',
    progress: 21,
    eta: '9.8 Days',
    status: 'Cruising',
    statusColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    coordinates: '12°11\'N, 43°30\'E (Gulf of Aden)',
    engineTemp: 85,
    fuelLevel: 91,
    draftDepth: 14.2,
    crewOnBoard: 32,
    cargoDistribution: [
      { name: 'Dry Cargo', value: 35, color: 'bg-indigo-500' },
      { name: 'Reefer Cargo', value: 35, color: 'bg-emerald-500' },
      { name: 'Hazardous', value: 20, color: 'bg-amber-500' },
      { name: 'Special Delivery', value: 10, color: 'bg-purple-500' }
    ]
  }
};

const getCurrencyForCountries = (origin, dest) => {
  const o = (origin || '').toLowerCase();
  const d = (dest || '').toLowerCase();
  if (o === 'india' && d === 'india') return 'INR';
  
  const target = o !== 'india' ? o : d;
  if (target.includes('united states') || target.includes('us')) return 'USD';
  if (target.includes('united kingdom') || target.includes('gb') || target.includes('uk')) return 'GBP';
  if (target.includes('united arab emirates') || target.includes('uae')) return 'AED';
  if (target.includes('australia')) return 'AUD';
  return 'USD';
};

const getCurrencySymbol = (currency) => {
  if (currency === 'USD') return '$';
  if (currency === 'GBP') return '£';
  if (currency === 'AED') return 'د.إ';
  if (currency === 'AUD') return 'A$';
  return '₹';
};

const CustomerDashboard = () => {
  const { logout, user, updateProfile, changePassword } = useAuth();
  const socket = useSocket();

  const [lang, setLang] = useState('en');
  const LANGUAGES = ['en', 'hi', 'es', 'fr', 'de', 'ar', 'zh'];
  const LANG_LABELS = { en: 'EN', hi: 'हि', es: 'ES', fr: 'FR', de: 'DE', ar: 'ع', zh: '中' };
  const LANG_FULL = { en: 'English', hi: 'हिन्दी', es: 'Español', fr: 'Français', de: 'Deutsch', ar: 'العربية', zh: '中文' };
  const cycleLang = () => {
    const idx = LANGUAGES.indexOf(lang);
    setLang(LANGUAGES[(idx + 1) % LANGUAGES.length]);
  };
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
        notificationFeed: 'Notification Feed',
        profileSettings: 'Profile Settings',
        referrals: 'Refer & Earn',
        schedule: 'Schedule Calendar',
        returns: 'Returns & Reverse Pickup'
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
        notificationFeed: 'सूचना फ़ीड',
        profileSettings: 'प्रोफ़ाइल सेटिंग्स',
        referrals: 'रेफर करें और कमाएं',
        schedule: 'शेड्यूल कैलेंडर',
        returns: 'रिटर्न और रिवर्स पिकअप'
      },
      es: {
        totalBookings: 'Pedidos Reservados',
        transitTracker: 'En Tránsito',
        spendLeaderboard: 'Análisis de Gastos',
        recentHistory: 'Historial Reciente',
        activeAlerts: 'Alertas Activas',
        welcomeBack: 'Bienvenido de nuevo',
        bookShipment: 'Reservar Envío',
        billingStatements: 'Estado de Cuenta',
        transitMap: 'Mapa de Tránsito',
        supportTickets: 'Tickets de Soporte',
        warehouseRates: 'Calculadora de Tarifas',
        myConsignments: 'Mis Envíos',
        spendLogistics: 'Gastos y Gráficos',
        bookNewShipment: 'Nuevo Envío',
        rateCalculator: 'Calculadora de Tarifas',
        shippingTariff: 'Tarifas de Envío',
        supportDeskChat: 'Chat de Soporte',
        billingInvoices: 'Facturas',
        savedAddresses: 'Direcciones Guardadas',
        notificationFeed: 'Notificaciones',
        profileSettings: 'Configuración',
        referrals: 'Referir y Ganar',
        schedule: 'Calendario',
        returns: 'Devoluciones'
      },
      fr: {
        totalBookings: 'Commandes Réservées',
        transitTracker: 'En Transit',
        spendLeaderboard: 'Analyse des Dépenses',
        recentHistory: 'Historique Récent',
        activeAlerts: 'Alertes Actives',
        welcomeBack: 'Bon retour',
        bookShipment: 'Réserver un Envoi',
        billingStatements: 'Relevés de Facturation',
        transitMap: 'Carte de Transit',
        supportTickets: 'Tickets de Support',
        warehouseRates: 'Calculatrice de Tarifs',
        myConsignments: 'Mes Envois',
        spendLogistics: 'Dépenses et Graphiques',
        bookNewShipment: 'Nouvel Envoi',
        rateCalculator: 'Calculatrice de Tarifs',
        shippingTariff: 'Tarifs d\'Expédition',
        supportDeskChat: 'Chat de Support',
        billingInvoices: 'Factures',
        savedAddresses: 'Adresses Enregistrées',
        notificationFeed: 'Notifications',
        profileSettings: 'Paramètres',
        referrals: 'Parrainer et Gagner',
        schedule: 'Calendrier',
        returns: 'Retours'
      },
      de: {
        totalBookings: 'Gebuchte Bestellungen',
        transitTracker: 'In Transit',
        spendLeaderboard: 'Ausgabenanalyse',
        recentHistory: 'Letzter Verlauf',
        activeAlerts: 'Aktive Benachrichtigungen',
        welcomeBack: 'Willkommen zurück',
        bookShipment: 'Sendung Buchen',
        billingStatements: 'Abrechnungen',
        transitMap: 'Transitkarte',
        supportTickets: 'Support-Tickets',
        warehouseRates: 'Tarifrechner',
        myConsignments: 'Meine Sendungen',
        spendLogistics: 'Ausgaben und Diagramme',
        bookNewShipment: 'Neue Sendung',
        rateCalculator: 'Tarifrechner',
        shippingTariff: 'Versandtarife',
        supportDeskChat: 'Support-Chat',
        billingInvoices: 'Rechnungen',
        savedAddresses: 'Gespeicherte Adressen',
        notificationFeed: 'Benachrichtigungen',
        profileSettings: 'Einstellungen',
        referrals: 'Empfehlen und Verdienen',
        schedule: 'Kalender',
        returns: 'Rücksendungen'
      },
      ar: {
        totalBookings: 'الطلبات المحجوزة',
        transitTracker: 'قيد النقل',
        spendLeaderboard: 'تحليل المصروفات',
        recentHistory: 'السجل الأخير',
        activeAlerts: 'التنبيهات النشطة',
        welcomeBack: 'مرحبًا بعودتك',
        bookShipment: 'حجز شحنة',
        billingStatements: 'كشوف الفواتير',
        transitMap: 'خريطة العبور',
        supportTickets: 'تذاكر الدعم',
        warehouseRates: 'حاسبة التعرفة',
        myConsignments: 'شحناتي',
        spendLogistics: 'المصروفات والرسوم البيانية',
        bookNewShipment: 'شحنة جديدة',
        rateCalculator: 'حاسبة الأسعار',
        shippingTariff: 'تعريفات الشحن',
        supportDeskChat: 'دردشة الدعم',
        billingInvoices: 'الفواتير',
        savedAddresses: 'العناوين المحفوظة',
        notificationFeed: 'الإشعارات',
        profileSettings: 'الإعدادات',
        referrals: 'الإحالة والربح',
        schedule: 'التقويم',
        returns: 'المرتجعات'
      },
      zh: {
        totalBookings: '已预订订单',
        transitTracker: '运输中',
        spendLeaderboard: '支出分析',
        recentHistory: '近期历史',
        activeAlerts: '活跃提醒',
        welcomeBack: '欢迎回来',
        bookShipment: '预订发货',
        billingStatements: '账单报表',
        transitMap: '运输地图',
        supportTickets: '支持工单',
        warehouseRates: '运费计算器',
        myConsignments: '我的货物',
        spendLogistics: '支出与图表',
        bookNewShipment: '新发货',
        rateCalculator: '费率计算器',
        shippingTariff: '运费费率',
        supportDeskChat: '支持聊天',
        billingInvoices: '发票',
        savedAddresses: '已保存地址',
        notificationFeed: '通知',
        profileSettings: '设置',
        referrals: '推荐与赚取',
        schedule: '日程日历',
        returns: '退货与逆向取件'
      }
    };
    return dict[lang][key] || key;
  };

  const [activeTab, setActiveTab] = useState('orders');
  const [stats, setStats] = useState(null);
  const [shipments, setShipments] = useState([]);

  // Profile Settings State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  // Referral & Rewards State
  const [referralData, setReferralData] = useState(null);
  const [referralInput, setReferralInput] = useState('');
  const [referralApplied, setReferralApplied] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);

  // Schedule Calendar State
  const [scheduleShipments, setScheduleShipments] = useState([]);
  const now = new Date();
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth());
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());

  // Returns State
  const [returns, setReturns] = useState([]);
  const [returnShipmentId, setReturnShipmentId] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnPickupAddress, setReturnPickupAddress] = useState('');
  const [returnPickupDate, setReturnPickupDate] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
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
  const [originCountry, setOriginCountry] = useState('India');
  const [originCity, setOriginCity] = useState('Mumbai');
  const [destinationCountry, setDestinationCountry] = useState('India');
  const [destinationCity, setDestinationCity] = useState('Delhi');
  const [weight, setWeight] = useState(1.0);
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(10);
  const [shipmentType, setShipmentType] = useState(SHIPMENT_TYPES[0]);
  const [senderPhone, setSenderPhone] = useState(user?.phone || '');
  const [itemDescription, setItemDescription] = useState('');
  const [isMetal, setIsMetal] = useState(false);
  const [govtIdProof, setGovtIdProof] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [consignmentCategory, setConsignmentCategory] = useState('Parcel');
  const [declaredValue, setDeclaredValue] = useState('1000');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [customsDescription, setCustomsDescription] = useState('');

  // Fleet Vehicle Selection State
  const [availableFleet, setAvailableFleet] = useState([]);
  const [fleetVehicleId, setFleetVehicleId] = useState('');
  const [fleetLoading, setFleetLoading] = useState(false);

  // Fetch fleet vehicles when shipment type changes to Air or Ocean
  useEffect(() => {
    if (shipmentType === 'Air' || shipmentType === 'Ocean') {
      const typeMap = { Air: 'Cargo Plane', Ocean: 'Container Vessel' };
      const vehicleType = typeMap[shipmentType];
      setFleetLoading(true);
      axios.get('/logistics/fleet/available')
        .then(res => {
          if (res.data.success) {
            const filtered = res.data.fleet.filter(v => v.vehicleType === vehicleType && v.status !== 'Maintenance');
            setAvailableFleet(filtered);
            if (filtered.length > 0) setFleetVehicleId(filtered[0].id);
            else setFleetVehicleId('');
          }
        })
        .catch(() => setAvailableFleet([]))
        .finally(() => setFleetLoading(false));
    } else {
      setAvailableFleet([]);
      setFleetVehicleId('');
    }
  }, [shipmentType]);

  useEffect(() => {
    if (user) {
      if (user.phone && !senderPhone) setSenderPhone(user.phone);
      if (!profileName && user.name) setProfileName(user.name);
      if (!profilePhone && user.phone) setProfilePhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    const isIntl = originCountry !== destinationCountry;
    const types = isIntl ? INTERNATIONAL_TYPES : DOMESTIC_TYPES;
    const validTypes = types.map(t => getTypeMapping(t));
    if (!validTypes.includes(shipmentType)) {
      setShipmentType(validTypes[0]);
    }
  }, [originCountry, destinationCountry]);

  const handleOriginCountryChange = (country) => {
    setOriginCountry(country);
    const cities = COUNTRIES_AND_CITIES[country] || [];
    if (cities.length > 0) {
      setOriginCity(cities[0]);
    }
  };

  const handleDestinationCountryChange = (country) => {
    setDestinationCountry(country);
    const cities = COUNTRIES_AND_CITIES[country] || [];
    if (cities.length > 0) {
      setDestinationCity(cities[0]);
    }
  };
  
  // Real-time ETA estimation
  const [etaLoading, setEtaLoading] = useState(false);
  const [estimatedEta, setEstimatedEta] = useState(null);

  // AI Route Recommender State
  const [recommenderUrgency, setRecommenderUrgency] = useState('Standard');
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);

  // Rate Calculator State
  const [calcOriginCountry, setCalcOriginCountry] = useState('India');
  const [calcDestCountry, setCalcDestCountry] = useState('India');
  const [calcOrigin, setCalcOrigin] = useState(CITIES[0]);
  const [calcDest, setCalcDest] = useState(CITIES[1]);
  const [calcWeight, setCalcWeight] = useState(1.0);
  const [calcType, setCalcType] = useState(SHIPMENT_TYPES[0]);
  const [calculatedCost, setCalculatedCost] = useState(null);
  const [calculatedDays, setCalculatedDays] = useState(null);

  useEffect(() => {
    const cities = COUNTRIES_AND_CITIES[calcOriginCountry] || [];
    if (cities.length > 0) setCalcOrigin(cities[0]);
  }, [calcOriginCountry]);

  useEffect(() => {
    const cities = COUNTRIES_AND_CITIES[calcDestCountry] || [];
    if (cities.length > 0) setCalcDest(cities[0]);
  }, [calcDestCountry]);

  useEffect(() => {
    const isIntl = calcOriginCountry !== calcDestCountry;
    const types = isIntl ? INTERNATIONAL_TYPES : DOMESTIC_TYPES;
    const validTypes = types.map(t => getTypeMapping(t));
    if (!validTypes.includes(calcType)) {
      setCalcType(validTypes[0]);
    }
  }, [calcOriginCountry, calcDestCountry]);

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

  // International Checkout Modal State
  const [intlCheckoutOpen, setIntlCheckoutOpen] = useState(false);
  const [intlCheckoutShipment, setIntlCheckoutShipment] = useState(null);
  const [intlCheckoutOrder, setIntlCheckoutOrder] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState('Stripe');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [submittingIntlPayment, setSubmittingIntlPayment] = useState(false);

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

  // Floating Bug Report Bot State
  const [floatingBugOpen, setFloatingBugOpen] = useState(false);
  const [bugInput, setBugInput] = useState('');
  const [bugScreenshot, setBugScreenshot] = useState(null);
  const [bugLoading, setBugLoading] = useState(false);

  // Cancel Shipment State
  const [cancellingId, setCancellingId] = useState(null);

  // Rating Modal State
  const [ratingModal, setRatingModal] = useState(false);
  const [ratingShipment, setRatingShipment] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Re-Order loading state
  const [reOrdering, setReOrdering] = useState(null);

  // Marine Command Control Center interactive local states
  const [selectedVessel, setSelectedVessel] = useState('MV Blue Horizon');
  const [aisLogs, setAisLogs] = useState([
    { time: '22:01:05', tag: 'AIS', msg: 'MV Blue Horizon: Position updated - Lat: 19.01, Lon: 70.85' },
    { time: '22:00:15', tag: 'SYS', msg: 'All vessel transponders online and transmitting.' },
    { time: '21:58:50', tag: 'MET', msg: 'Swell warning issued for Arabian Sea - MV Atlantic Clipper routing adjusted' },
    { time: '21:55:12', tag: 'PORT', msg: 'Rotterdam Terminal Quay 4 cleared for MV Pacific Swift arrival' }
  ]);
  const [transponderStatus, setTransponderStatus] = useState('idle'); // 'idle' | 'pinging' | 'completed'
  const [etaRecalculating, setEtaRecalculating] = useState(false);
  const [activeGaugeDetail, setActiveGaugeDetail] = useState(null); // null | 'terminal' | 'deck' | 'eco'

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

  // Simulate live AIS and command logs ticking
  useEffect(() => {
    if (activeTab !== 'analytics') return;
    
    const logsPool = [
      { tag: 'AIS', msg: 'MV Blue Horizon: Engine RPM optimized to 95. Speed stable at 22.4 kn.' },
      { tag: 'MET', msg: 'Dubai Port Jebel Ali reports local wind speed 12 kn. Wave height 0.8m.' },
      { tag: 'SYS', msg: 'Vessel fuel consumption efficiency index registered at 92.4%.' },
      { tag: 'AIS', msg: 'MV Pacific Swift: Passed Bab-el-Mandeb strait heading north-west.' },
      { tag: 'PORT', msg: 'Mumbai Port Terminal 2 customs clearance batch pre-approved.' },
      { tag: 'AIS', msg: 'MV Atlantic Clipper: Port pilot requested for Singapore approach.' },
      { tag: 'SYS', msg: 'Telemetry check: GPS coordinates verified with oceanic satellite link.' }
    ];

    const interval = setInterval(() => {
      const randomLog = logsPool[Math.floor(Math.random() * logsPool.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setAisLogs(prev => [
        { time: timeStr, tag: randomLog.tag, msg: randomLog.msg },
        ...prev.slice(0, 10) // Keep last 11 logs
      ]);
    }, 6000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const exportInvoicesToCSV = () => {
    if (invoices.length === 0) return toast.error('No invoices to export.');
    const headers = ['Invoice Number', 'Date', 'Payment ID', 'Amount Paid', 'Currency'];
    const rows = invoices.map(inv => [
      inv.invoiceNumber,
      new Date(inv.createdAt).toLocaleDateString(),
      inv.paymentId,
      inv.amount,
      inv.currency || 'INR'
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
    if (!originCity || !destinationCity || (originCountry === destinationCountry && originCity === destinationCity)) {
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
    if (originCountry === destinationCountry && originCity === destinationCity) {
      return toast.error('Origin and Destination must be different.');
    }

    setRecommendationLoading(true);
    setAiRecommendation(null);
    try {
      const res = await axios.post('/shipments/recommend-route', {
        originCountry,
        origin: originCity,
        destinationCountry,
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
  }, [originCountry, originCity, destinationCountry, destinationCity, weight, shipmentType]);

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
      'Surat': [21.1702, 72.8311],
      'New York': [40.7128, -74.0060],
      'Los Angeles': [34.0522, -118.2437],
      'Chicago': [41.8781, -87.6298],
      'Houston': [29.7604, -95.3698],
      'San Francisco': [37.7749, -122.4194],
      'Miami': [25.7617, -80.1918],
      'London': [51.5074, -0.1278],
      'Birmingham': [52.4862, -1.8904],
      'Manchester': [53.4808, -2.2426],
      'Glasgow': [55.8642, -4.2518],
      'Liverpool': [53.4084, -2.9916],
      'Dubai': [25.2048, 55.2708],
      'Abu Dhabi': [24.4539, 54.3773],
      'Sharjah': [25.3463, 55.4209],
      'Ajman': [25.3995, 55.4796],
      'Sydney': [-33.8688, 151.2093],
      'Melbourne': [-37.8136, 144.9631],
      'Brisbane': [-27.4705, 153.0260],
      'Perth': [-31.9505, 115.8605],
      'Adelaide': [-34.9285, 138.6007]
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

  // ── Profile Handlers ──
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileUpdating(true);
    const res = await updateProfile({ name: profileName, phone: profilePhone });
    if (res.success) {
      toast.success('Profile updated successfully!');
    } else {
      toast.error(res.message || 'Failed to update profile.');
    }
    setProfileUpdating(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      return toast.error('Please fill in both password fields.');
    }
    if (newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters.');
    }
    setChangingPwd(true);
    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } else {
      toast.error(res.message || 'Failed to change password.');
    }
    setChangingPwd(false);
  };

  // ── Referral Handlers ──
  const fetchReferralData = async () => {
    try {
      const res = await axios.get('/auth/referral');
      if (res.data.success) setReferralData(res.data);
    } catch (err) { /* ignore */ }
  };

  useEffect(() => {
    if (activeTab === 'referrals') fetchReferralData();
  }, [activeTab]);

  const handleCopyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
      toast.success('Referral code copied!');
    }
  };

  const handleApplyReferral = async () => {
    if (!referralInput.trim()) return toast.error('Enter a referral code.');
    try {
      const res = await axios.post('/auth/referral/apply', { code: referralInput.trim() });
      if (res.data.success) {
        toast.success('Referral applied! You earned 25 points!');
        setReferralApplied(true);
        fetchReferralData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid referral code.');
    }
  };

  // ── Schedule Calendar ──
  useEffect(() => {
    if (activeTab === 'schedule') {
      const upcoming = shipments.filter(s =>
        s.status !== 'Delivered' && s.status !== 'Cancelled'
      );
      setScheduleShipments(upcoming);
    }
  }, [activeTab, shipments]);

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
    else setCalendarMonth(calendarMonth - 1);
  };
  const nextMonth = () => {
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
    else setCalendarMonth(calendarMonth + 1);
  };

  const getShipmentsForDay = (day) => {
    if (!scheduleShipments) return [];
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scheduleShipments.filter(s => {
      if (!s.pickupDate && !s.createdAt) return false;
      const sDate = s.pickupDate ? s.pickupDate.split('T')[0] : s.createdAt.split('T')[0];
      return sDate === dateStr;
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ── Returns / Reverse Pickup ──
  const fetchReturns = async () => {
    try {
      const res = await axios.get('/shipments/returns');
      if (res.data.success) setReturns(res.data.returns);
    } catch (err) { /* ignore */ }
  };

  useEffect(() => {
    if (activeTab === 'returns') fetchReturns();
  }, [activeTab]);

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!returnShipmentId || !returnReason || !returnPickupAddress) {
      return toast.error('Please fill in all required fields.');
    }
    setReturnSubmitting(true);
    try {
      const res = await axios.post('/shipments/return', {
        shipmentId: returnShipmentId,
        reason: returnReason,
        pickupAddress: returnPickupAddress,
        pickupDate: returnPickupDate || null
      });
      if (res.data.success) {
        toast.success('Return request submitted successfully!');
        setReturnShipmentId('');
        setReturnReason('');
        setReturnPickupAddress('');
        setReturnPickupDate('');
        fetchReturns();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit return request.');
    } finally {
      setReturnSubmitting(false);
    }
  };

  const handleBugScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setBugScreenshot(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSendBugReport = async (e) => {
    e.preventDefault();
    if (!bugInput.trim() || bugLoading) return;

    setBugLoading(true);
    try {
      const res = await axios.post('/shipments/tickets', {
        title: 'Bug Report via Widget',
        message: bugInput.trim(),
        category: 'Bug',
        screenshot: bugScreenshot
      });
      if (res.data.success) {
        toast.success('Bug report submitted successfully!');
        setBugInput('');
        setBugScreenshot(null);
        setFloatingBugOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to submit bug report.');
    } finally {
      setBugLoading(false);
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

    let intlSurcharge = 1.0;
    if (calcOriginCountry !== calcDestCountry) {
      intlSurcharge = 1.8;
    }
    
    const costBeforeTax = (basePrice + (calcWeight * perKgRate)) * multiplier * intlSurcharge;
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
    if (originCountry === destinationCountry && originCity === destinationCity) {
      return toast.error('Origin and Destination must be different.');
    }

    try {
      const res = await axios.post('/shipments/book', {
        recipientName,
        recipientAddress,
        originCountry,
        originCity,
        destinationCountry,
        destinationCity,
        weight,
        length,
        width,
        height,
        shipmentType,
        senderPhone,
        itemDescription,
        isMetal,
        govtIdProof,
        pickupDate,
        consignmentCategory,
        declaredValue,
        recipientPhone,
        customsDescription,
        fleetVehicleId: fleetVehicleId || undefined
      });

      if (res.data.success) {
        toast.success('Shipment draft saved. Redirecting to checkout...');
        setRecipientName('');
        setRecipientAddress('');
        setWeight(1.0);
        setItemDescription('');
        setIsMetal(false);
        setGovtIdProof('');
        setPickupDate('');
        setConsignmentCategory('Parcel');
        setDeclaredValue('1000');
        setRecipientPhone('');
        setCustomsDescription('');
        
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
      const { order, keyId, amount, currency, isMock } = orderRes.data;

      if (order.isInternational) {
        setPaymentLoading(false);
        setIntlCheckoutShipment(shipment);
        setIntlCheckoutOrder(order);
        setSelectedGateway('Stripe');
        setCardName(user.name);
        setPaypalEmail(user.email);
        setIntlCheckoutOpen(true);
        return;
      }

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

  // Cancel Shipment
  const handleCancelShipment = async (shipmentId) => {
    if (!window.confirm('Are you sure you want to cancel this shipment? This action cannot be undone.')) return;
    setCancellingId(shipmentId);
    try {
      const res = await axios.put(`/shipments/${shipmentId}/cancel`);
      if (res.data.success) {
        toast.success('Shipment cancelled successfully.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel shipment.');
    } finally {
      setCancellingId(null);
    }
  };

  // Open Rating Modal
  const openRatingModal = (shipment) => {
    setRatingShipment(shipment);
    setSelectedRating(shipment.customerRating || 0);
    setRatingFeedback(shipment.customerFeedback || '');
    setRatingModal(true);
  };

  // Submit Rating
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (selectedRating === 0) return toast.error('Please select a rating from 1 to 5 stars.');
    setSubmittingRating(true);
    try {
      const res = await axios.post(`/shipments/${ratingShipment.id}/rate`, {
        rating: selectedRating,
        feedback: ratingFeedback
      });
      if (res.data.success) {
        toast.success('⭐ Thank you for your feedback!');
        setRatingModal(false);
        setRatingShipment(null);
        setSelectedRating(0);
        setRatingFeedback('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Re-Order Shipment
  const handleReOrder = async (shipmentId) => {
    setReOrdering(shipmentId);
    try {
      const res = await axios.post(`/shipments/${shipmentId}/reorder`);
      if (res.data.success) {
        toast.success('Shipment re-ordered! Redirecting to payment...');
        setPayingShipment(res.data.shipment);
        setActiveTab('orders');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Re-order failed.');
    } finally {
      setReOrdering(null);
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

  const generateBarcodeSvg = (text) => {
    const binary = text.split('').map(char => {
      const code = char.charCodeAt(0);
      return (code * 13247).toString(2).slice(-9);
    }).join('0');
    
    let svgContent = '';
    let x = 10;
    for (let i = 0; i < binary.length; i++) {
      const isBlack = binary[i] === '1';
      const width = isBlack ? 2 : 1;
      if (isBlack) {
        svgContent += `<rect x="${x}" y="10" width="${width}" height="60" fill="black" />`;
      }
      x += width + 1;
    }
    
    return `<svg width="${x + 10}" height="80" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
  };

  const handlePrintLabel = (shipment) => {
    const barcodeSvg = generateBarcodeSvg(shipment.trackingId);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    const html = `
      <html>
        <head>
          <title>Marine Bytes Shipment Label - ${shipment.trackingId}</title>
          <style>
            body {
              font-family: 'Inter', system-ui, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #ffffff;
              color: #1e293b;
            }
            .label-container {
              border: 3px solid #000000;
              padding: 24px;
              max-width: 500px;
              margin: 0 auto;
              border-radius: 12px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #000000;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .logo {
              font-size: 22px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .service-badge {
              background-color: #000000;
              color: #ffffff;
              padding: 6px 12px;
              font-weight: 800;
              font-size: 14px;
              border-radius: 6px;
              text-transform: uppercase;
            }
            .address-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              border-bottom: 1px dashed #000000;
              padding-bottom: 16px;
              margin-bottom: 16px;
            }
            .address-title {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 4px;
            }
            .address-name {
              font-weight: 700;
              font-size: 14px;
              margin-bottom: 2px;
            }
            .address-detail {
              font-size: 12px;
              line-height: 1.4;
            }
            .details-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              border-bottom: 2px solid #000000;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .detail-item {
              text-align: center;
              background-color: #f8fafc;
              padding: 8px;
              border-radius: 6px;
            }
            .detail-label {
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
            }
            .detail-val {
              font-size: 12px;
              font-weight: 700;
              margin-top: 2px;
            }
            .barcode-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              margin-top: 20px;
            }
            .barcode-text {
              font-family: monospace;
              font-size: 14px;
              font-weight: 700;
              letter-spacing: 3px;
              margin-top: 6px;
            }
            @media print {
              body {
                padding: 0;
              }
              .label-container {
                border: 3px solid #000000;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="header">
              <div class="logo">Marine Bytes</div>
              <div class="service-badge">${shipment.shipmentType}</div>
            </div>
            
            <div class="address-section">
              <div>
                <div class="address-title">From (Sender)</div>
                <div class="address-name">${shipment.senderName || 'Valued Customer'}</div>
                <div class="address-detail">City: ${shipment.originCity}</div>
                <div class="address-detail">Phone: ${shipment.senderPhone || '-'}</div>
              </div>
              <div>
                <div class="address-title">To (Recipient)</div>
                <div class="address-name">${shipment.recipientName}</div>
                <div class="address-detail">${shipment.recipientAddress}</div>
                <div class="address-detail">City: ${shipment.destinationCity}</div>
              </div>
            </div>
            
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Weight</div>
                <div class="detail-val">${shipment.weight} kg</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Dimensions</div>
                <div class="detail-val">${shipment.dimensions?.length || 10}x${shipment.dimensions?.width || 10}x${shipment.dimensions?.height || 10} cm</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Scheduled Pickup</div>
                <div class="detail-val">${shipment.pickupDate ? new Date(shipment.pickupDate).toLocaleDateString() : 'Today'}</div>
              </div>
            </div>
            
            <div class="barcode-wrapper">
              ${barcodeSvg}
              <div class="barcode-text">${shipment.trackingId}</div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
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
              onClick={cycleLang}
              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition flex items-center space-x-1 relative group"
              title={LANG_FULL[lang]}
            >
              <Globe size={13} />
              <span className="uppercase text-[9px] font-extrabold">{LANG_LABELS[lang] || lang}</span>
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                {LANG_FULL[lang]}
              </span>
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
              { id: 'alerts', label: t('notificationFeed'), icon: Bell },
              { id: 'profile', label: t('profileSettings'), icon: Settings },
              { id: 'referrals', label: t('referrals'), icon: Gift },
              { id: 'schedule', label: t('schedule'), icon: Calendar },
              { id: 'returns', label: t('returns'), icon: Undo2 }
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
                
                {/* 🚢 Realistic Maritime Logistics Banner */}
                <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-xl h-48 md:h-56 flex items-center p-6 md:p-8">
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
                  <div className="relative z-10 space-y-3 max-w-lg text-left">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[10px] font-extrabold uppercase tracking-widest">
                      <Globe size={12} className="animate-spin-slow" />
                      <span>Oceanic Fleet Terminal Active</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                      Manage Maritime Cargo <span className="text-indigo-400">&</span> Global Deliveries
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Book international sea-freight channels, verify customs KYC parameters, and track active container fleets from port to port in real-time.
                    </p>
                  </div>
                </div>

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
                          <th className="pb-3">Fleet Vehicle</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Rating</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {shipments.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="py-6 text-center text-slate-400 italic">No shipment records found.</td>
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
                                {shipment.fleetVehicleName ? (
                                  <span className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                                    {shipment.fleetVehicleName}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 italic text-[10px]">—</span>
                                )}
                              </td>
                              <td className="py-3.5">
                                <div className="space-y-1">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    shipment.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                                    shipment.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                                    shipment.status === 'Pending Payment' ? 'bg-slate-100 text-slate-400' :
                                    'bg-indigo-100 text-indigo-700 animate-pulse'
                                  }`}>
                                    {shipment.status}
                                  </span>
                                  {shipment.status === 'Out for Delivery' && shipment.deliveryOtp && (
                                    <div className="text-[10px] font-extrabold text-cyan-600 bg-cyan-50 border border-cyan-100 px-1.5 py-0.5 rounded w-max mt-1">
                                      OTP: {shipment.deliveryOtp}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5">
                                {shipment.customerRating ? (
                                  <span className="flex items-center gap-0.5">
                                    {[1,2,3,4,5].map(s => (
                                      <span key={s} className={`text-sm ${s <= shipment.customerRating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                                    ))}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-[10px] italic">—</span>
                                )}
                              </td>
                              <td className="py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {shipment.status === 'Pending Payment' && (
                                    <button onClick={() => handlePayment(shipment)} className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold transition text-[10px]">Pay & Book</button>
                                  )}
                                  {(shipment.status === 'Pending Payment' || shipment.status === 'Booked') && (
                                    <button
                                      onClick={() => handleCancelShipment(shipment.id)}
                                      disabled={cancellingId === shipment.id}
                                      className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold transition text-[10px] disabled:opacity-50"
                                    >
                                      {cancellingId === shipment.id ? '...' : 'Cancel'}
                                    </button>
                                  )}
                                  {shipment.status !== 'Pending Payment' && shipment.status !== 'Cancelled' && (
                                    <>
                                      <button onClick={() => handleTrack(shipment)} className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold transition text-[10px]">Track</button>
                                      <button
                                        onClick={() => handlePrintLabel(shipment)}
                                        className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold transition text-[10px] flex items-center gap-1"
                                      >
                                        <FileText size={10} />
                                        <span>Label</span>
                                      </button>
                                    </>
                                  )}
                                  {shipment.status === 'Delivered' && !shipment.customerRating && (
                                    <button
                                      onClick={() => openRatingModal(shipment)}
                                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold transition text-[10px] flex items-center gap-1"
                                    >
                                      ⭐ Rate
                                    </button>
                                  )}
                                  {(shipment.status === 'Delivered' || shipment.status === 'Cancelled') && (
                                    <button
                                      onClick={() => handleReOrder(shipment.id)}
                                      disabled={reOrdering === shipment.id}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition text-[10px] disabled:opacity-50"
                                    >
                                      {reOrdering === shipment.id ? '...' : '🔄 Re-Order'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ⭐ Rating Modal */}
                {ratingModal && ratingShipment && (
                  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
                      <h3 className="text-lg font-extrabold text-slate-800 mb-1">Rate Your Delivery</h3>
                      <p className="text-xs text-slate-500 mb-6">Tracking ID: <span className="font-bold text-indigo-600">{ratingShipment.trackingId}</span></p>
                      <form onSubmit={handleSubmitRating} className="space-y-5">
                        <div>
                          <p className="text-xs font-bold text-slate-600 mb-2">Your Rating *</p>
                          <div className="flex gap-2">
                            {[1,2,3,4,5].map(star => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setSelectedRating(star)}
                                className={`text-4xl transition-transform hover:scale-110 ${star <= selectedRating ? 'text-amber-400' : 'text-slate-200'}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          {selectedRating > 0 && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              {selectedRating === 1 ? '😞 Poor' : selectedRating === 2 ? '😐 Fair' : selectedRating === 3 ? '🙂 Good' : selectedRating === 4 ? '😊 Very Good' : '🤩 Excellent!'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">Feedback (optional)</label>
                          <textarea
                            value={ratingFeedback}
                            onChange={e => setRatingFeedback(e.target.value)}
                            rows={3}
                            placeholder="Tell us about your experience..."
                            className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 transition resize-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button type="button" onClick={() => setRatingModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
                          <button type="submit" disabled={submittingRating || selectedRating === 0} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition disabled:opacity-50">
                            {submittingRating ? 'Submitting...' : '⭐ Submit Rating'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* 💳 International Checkout Simulator Modal */}
                {intlCheckoutOpen && intlCheckoutShipment && intlCheckoutOrder && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100 text-left">
                      
                      {/* Modal Header */}
                      <div className="bg-indigo-900 text-white p-6 relative">
                        <h3 className="text-lg font-extrabold flex items-center gap-2">
                          <Globe size={18} className="animate-spin-slow" />
                          <span>Secure International Checkout</span>
                        </h3>
                        <p className="text-xs text-indigo-200 mt-1">Simulating payment for booking {intlCheckoutShipment.trackingId}</p>
                        <button
                          type="button"
                          onClick={() => setIntlCheckoutOpen(false)}
                          className="absolute top-6 right-6 text-indigo-200 hover:text-white transition font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Modal Content */}
                      <div className="p-6 space-y-6">
                        
                        {/* Amount Display */}
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Amount</span>
                            <span className="text-xs text-slate-500 font-semibold">{intlCheckoutShipment.originCity} → {intlCheckoutShipment.destinationCity}</span>
                          </div>
                          <span className="text-2xl font-black text-indigo-950">
                            {getCurrencySymbol(intlCheckoutOrder.currency)} {Number(intlCheckoutOrder.amount).toFixed(2)}
                          </span>
                        </div>

                        {/* Gateway Select Tabs */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setSelectedGateway('Stripe')}
                            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                              selectedGateway === 'Stripe'
                                ? 'bg-white text-indigo-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <span>💳 Stripe Card</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedGateway('PayPal')}
                            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                              selectedGateway === 'PayPal'
                                ? 'bg-white text-blue-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <span>🅿️ PayPal</span>
                          </button>
                        </div>

                        {/* Gateway Form */}
                        {selectedGateway === 'Stripe' ? (
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Name on Card</label>
                              <input
                                type="text"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                                placeholder="John Doe"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Card Number</label>
                              <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                                placeholder="4242 4242 4242 4242"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Expiry Date</label>
                                <input
                                  type="text"
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(e.target.value)}
                                  className="w-full border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-medium text-center focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                                  placeholder="MM/YY"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">CVC Code</label>
                                <input
                                  type="text"
                                  value={cardCvc}
                                  onChange={(e) => setCardCvc(e.target.value)}
                                  className="w-full border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-medium text-center focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                                  placeholder="123"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">PayPal Email Address</label>
                              <input
                                type="email"
                                value={paypalEmail}
                                onChange={(e) => setPaypalEmail(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                                placeholder="paypal@example.com"
                              />
                            </div>
                            <div className="bg-blue-50/50 border border-blue-100 text-blue-800 p-3.5 rounded-xl text-[11px] leading-relaxed">
                              You will be redirected to simulated PayPal Express secure checkout environment to approve the pre-authorized transaction.
                            </div>
                          </div>
                        )}

                        {/* Submit Action */}
                        <button
                          type="button"
                          onClick={async () => {
                            setSubmittingIntlPayment(true);
                            toast.loading(`Simulating ${selectedGateway} Checkout...`, { id: 'intl_verify' });
                            
                            setTimeout(async () => {
                              try {
                                const verifyRes = await axios.post('/payments/verify', {
                                  shipmentId: intlCheckoutShipment.id,
                                  razorpay_order_id: intlCheckoutOrder.id,
                                  razorpay_payment_id: `pay_${selectedGateway.toLowerCase()}_${Date.now()}`,
                                  isMock: true,
                                  gateway: selectedGateway
                                });
                                
                                if (verifyRes.data.success) {
                                  toast.success(`${selectedGateway} Payment Successful! Shipment Booked.`, { id: 'intl_verify' });
                                  setIntlCheckoutOpen(false);
                                  setPayingShipment(null);
                                  fetchData();
                                }
                              } catch (err) {
                                toast.error('Simulation payment checkout verification failed.', { id: 'intl_verify' });
                              } finally {
                                setSubmittingIntlPayment(false);
                              }
                            }, 1800);
                          }}
                          disabled={submittingIntlPayment}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-indigo-glow flex items-center justify-center space-x-2"
                        >
                          <span>{submittingIntlPayment ? 'Processing Securely...' : `Pay & Book via ${selectedGateway}`}</span>
                        </button>

                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="space-y-8 animate-fade-in text-left">
                {/* CSS custom styles for map animation */}
                <style>{`
                  @keyframes pulseGlow {
                    0%, 100% { transform: scale(1); opacity: 0.4; }
                    50% { transform: scale(1.6); opacity: 0.8; }
                  }
                  @keyframes routeDash {
                    to { stroke-dashoffset: -20; }
                  }
                  .animate-ping-glow {
                    transform-origin: center;
                    animation: pulseGlow 2s ease-in-out infinite;
                  }
                  .animate-route-dash {
                    stroke-dasharray: 6 4;
                    animation: routeDash 12s linear infinite;
                  }
                  .vessel-cargo-stack {
                    background-image: repeating-linear-gradient(45deg, #1e293b 0px, #1e293b 2px, transparent 2px, transparent 8px);
                  }
                `}</style>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                      <span>Marine Fleet Command & Analytics</span>
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">Real-time ocean shipping routing progress, capacity utilization levels, and trade lane metrics.</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl font-bold text-xs shrink-0">
                    <Activity size={13} className="animate-pulse" />
                    <span>Secure Satellite Link Active</span>
                  </div>
                </div>

                {/* Main Interactive Row: Map & Telemetry Control */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  
                  {/* Left Column: Interactive Map & Fleet Telemetry (8 Cols) */}
                  <div className="xl:col-span-8 space-y-6">
                    
                    {/* Fleet Interactive Map Card */}
                    <div className="bg-slate-950 rounded-3xl border border-slate-900 shadow-2xl p-5 text-white space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                            <Compass size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Interactive Global Trade Lanes Map</h4>
                            <p className="text-[9px] text-slate-500">Click on any vessel marker to lock tracking transponder</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-[9px] text-indigo-400 bg-indigo-950/60 border border-indigo-900/50 px-2 py-0.5 rounded font-bold uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                          <span>Interactive</span>
                        </div>
                      </div>

                      {/* Global Ocean SVG Map */}
                      <div className="relative">
                        <svg viewBox="0 0 800 320" className="w-full h-auto bg-slate-950 rounded-2xl border border-slate-900">
                          {/* Grid Pattern */}
                          <defs>
                            <pattern id="map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                              <circle cx="2" cy="2" r="1" fill="#334155" opacity="0.35" />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#map-grid)" />

                          {/* Schematic continents representation */}
                          <path d="M50 20 Q120 40 180 30 T240 60 T310 110 T350 150 L320 180 L290 120 Z" fill="#1e293b" opacity="0.15" />
                          <path d="M410 140 L450 190 L480 200 L490 220 L510 200 L560 160 Z" fill="#1e293b" opacity="0.15" />
                          <path d="M580 100 Q650 120 720 110 T780 180 L740 240 L690 220 Z" fill="#1e293b" opacity="0.15" />

                          {/* Animated Dashed Sea Lanes */}
                          <path d="M 450 180 Q 385 165 320 150" fill="none" stroke="#6366f1" strokeWidth="2.5" className="animate-route-dash" strokeLinecap="round" opacity="0.75" />
                          <path d="M 490 210 Q 585 225 680 240" fill="none" stroke="#06b6d4" strokeWidth="2.5" className="animate-route-dash" strokeLinecap="round" opacity="0.75" />
                          <path d="M 320 150 Q 200 100 80 50" fill="none" stroke="#8b5cf6" strokeWidth="2.5" className="animate-route-dash" strokeLinecap="round" opacity="0.75" />

                          {/* Port Hub Points */}
                          <circle cx="80" cy="50" r="4.5" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2.5" />
                          <text x="80" y="38" fill="#94a3b8" fontSize="8" font-weight="bold" text-anchor="middle">Rotterdam Port</text>
                          
                          <circle cx="320" cy="150" r="4.5" fill="#ffffff" stroke="#6366f1" strokeWidth="2.5" />
                          <text x="320" y="138" fill="#94a3b8" fontSize="8" font-weight="bold" text-anchor="middle">Dubai Jebel Ali</text>
                          
                          <circle cx="450" cy="180" r="4.5" fill="#ffffff" stroke="#6366f1" strokeWidth="2.5" />
                          <text x="450" y="195" fill="#94a3b8" fontSize="8" font-weight="bold" text-anchor="middle">Mumbai Port</text>
                          
                          <circle cx="490" cy="210" r="4.5" fill="#ffffff" stroke="#06b6d4" strokeWidth="2.5" />
                          <text x="470" y="212" fill="#94a3b8" fontSize="8" font-weight="bold" text-anchor="end">Chennai Port</text>
                          
                          <circle cx="680" cy="240" r="4.5" fill="#ffffff" stroke="#06b6d4" strokeWidth="2.5" />
                          <text x="680" y="255" fill="#94a3b8" fontSize="8" font-weight="bold" text-anchor="middle">Singapore Terminal</text>

                          {/* Vessel Indicators */}
                          <g className="cursor-pointer" onClick={() => setSelectedVessel('MV Blue Horizon')}>
                            <circle cx="367" cy="161" r="12" fill="#6366f1" opacity={selectedVessel === 'MV Blue Horizon' ? '0.45' : '0.2'} className="animate-ping-glow" />
                            <circle cx="367" cy="161" r="6" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" className={`transition-all duration-300 ${selectedVessel === 'MV Blue Horizon' ? 'scale-125' : ''}`} />
                            <text x="367" y="148" fill={selectedVessel === 'MV Blue Horizon' ? '#818cf8' : '#e2e8f0'} fontSize="9" fontWeight="black" textAnchor="middle" className="transition-colors">Blue Horizon</text>
                          </g>

                          <g className="cursor-pointer" onClick={() => setSelectedVessel('MV Atlantic Clipper')}>
                            <circle cx="646" cy="235" r="12" fill="#06b6d4" opacity={selectedVessel === 'MV Atlantic Clipper' ? '0.45' : '0.2'} className="animate-ping-glow" />
                            <circle cx="646" cy="235" r="6" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" className={`transition-all duration-300 ${selectedVessel === 'MV Atlantic Clipper' ? 'scale-125' : ''}`} />
                            <text x="646" y="222" fill={selectedVessel === 'MV Atlantic Clipper' ? '#22d3ee' : '#e2e8f0'} fontSize="9" fontWeight="black" textAnchor="middle" className="transition-colors">Atlantic Clipper</text>
                          </g>

                          <g className="cursor-pointer" onClick={() => setSelectedVessel('MV Pacific Swift')}>
                            <circle cx="270" cy="129" r="12" fill="#8b5cf6" opacity={selectedVessel === 'MV Pacific Swift' ? '0.45' : '0.2'} className="animate-ping-glow" />
                            <circle cx="270" cy="129" r="6" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" className={`transition-all duration-300 ${selectedVessel === 'MV Pacific Swift' ? 'scale-125' : ''}`} />
                            <text x="270" y="116" fill={selectedVessel === 'MV Pacific Swift' ? '#c084fc' : '#e2e8f0'} fontSize="9" fontWeight="black" textAnchor="middle" className="transition-colors">Pacific Swift</text>
                          </g>
                        </svg>

                        {/* Map Overlay info */}
                        <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl text-[9px] text-slate-400 space-y-1">
                          <span className="font-extrabold uppercase text-slate-300 block mb-1">Fleet Legend</span>
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span>Mumbai-Dubai Channel (64% complete)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                            <span>Chennai-Singapore Channel (82% complete)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            <span>Dubai-Rotterdam Channel (21% complete)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fleet Telemetry Control Panel */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden text-left transition-all">
                      {/* Vessel Header */}
                      <div className="bg-slate-50 border-b border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3.5">
                          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                            <Ship size={20} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-base font-black text-slate-800 leading-tight">{VESSEL_DATA[selectedVessel].name}</h3>
                              <span className={`px-2 py-0.5 text-[9px] font-bold border rounded uppercase ${VESSEL_DATA[selectedVessel].statusColor}`}>
                                {VESSEL_DATA[selectedVessel].status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                              {VESSEL_DATA[selectedVessel].imo} • CALL SIGN: {VESSEL_DATA[selectedVessel].callSign} • Flag: {VESSEL_DATA[selectedVessel].flag}
                            </p>
                          </div>
                        </div>

                        {/* Interactive ping actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setTransponderStatus('pinging');
                              toast.loading(`Pinging transponder for ${selectedVessel}...`, { id: 'ping' });
                              setTimeout(() => {
                                setTransponderStatus('completed');
                                toast.success(`📡 Transponder Response: ${selectedVessel} online. Ping: 38ms. Coordinates verified.`, { id: 'ping' });
                                const now = new Date();
                                const timeStr = now.toTimeString().split(' ')[0];
                                setAisLogs(prev => [
                                  { time: timeStr, tag: 'AIS', msg: `Transponder ping SUCCESS for ${selectedVessel} - Sat: ORION-4 (Lat: ${VESSEL_DATA[selectedVessel].coordinates.split(' ')[0]})` },
                                  ...prev
                                ]);
                              }, 1800);
                            }}
                            disabled={transponderStatus === 'pinging'}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition duration-150 flex items-center space-x-1.5 ${
                              transponderStatus === 'pinging'
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-sm'
                            }`}
                          >
                            <span>📡 {transponderStatus === 'pinging' ? 'Pinging...' : 'Ping Transponder'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEtaRecalculating(true);
                              toast.loading('Analyzing current weather patterns and oceanic wind gradients...', { id: 'eta' });
                              setTimeout(() => {
                                setEtaRecalculating(false);
                                toast.success(`ETA Recalculated: ${selectedVessel} schedule optimized. No delays expected.`, { id: 'eta' });
                              }, 1500);
                            }}
                            disabled={etaRecalculating}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-[10px] transition"
                          >
                            {etaRecalculating ? 'Calculating...' : 'Recalculate ETA'}
                          </button>
                        </div>
                      </div>

                      {/* Grid parameters */}
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Left: Telemetry Readings */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Live Telemetry Readings</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Active Sea Coordinates</span>
                              <span className="text-xs font-bold text-slate-700 block mt-0.5 font-mono">{VESSEL_DATA[selectedVessel].coordinates}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Hull Draft Depth</span>
                              <span className="text-xs font-bold text-slate-700 block mt-0.5 font-mono">{VESSEL_DATA[selectedVessel].draftDepth} meters</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Telemetry Route ETA</span>
                              <span className="text-xs font-black text-indigo-600 block mt-0.5 font-mono">{VESSEL_DATA[selectedVessel].eta}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Propulsion Speed</span>
                              <span className="text-xs font-bold text-emerald-600 block mt-0.5 font-mono">{VESSEL_DATA[selectedVessel].speed}</span>
                            </div>
                          </div>

                          {/* Engine stats bars */}
                          <div className="space-y-2.5 pt-2">
                            <div>
                              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                                <span>Engine Core Temperature</span>
                                <span className="font-mono text-slate-600">{VESSEL_DATA[selectedVessel].engineTemp}°C / 95°C Max</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${VESSEL_DATA[selectedVessel].engineTemp > 83 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                  style={{ width: `${(VESSEL_DATA[selectedVessel].engineTemp / 95) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                                <span>Remaining Marine Fuel Capacity</span>
                                <span className="font-mono text-slate-600">{VESSEL_DATA[selectedVessel].fuelLevel}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${VESSEL_DATA[selectedVessel].fuelLevel < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${VESSEL_DATA[selectedVessel].fuelLevel}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Cargo Manifest & Port Clearances */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Cargo Manifest deck Load</h4>

                          {/* Visual Cargo Deck stack */}
                          <div className="p-3 bg-slate-900 rounded-2xl space-y-3 border border-slate-800 text-white">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-extrabold uppercase text-slate-400 tracking-wider">Container Stack Allocation</span>
                              <span className="font-mono text-indigo-400 font-extrabold">{VESSEL_DATA[selectedVessel].cargo} Load</span>
                            </div>
                            
                            {/* Stack Bar */}
                            <div className="h-6 w-full rounded-lg overflow-hidden flex border border-slate-800 shadow-inner">
                              {VESSEL_DATA[selectedVessel].cargoDistribution.map((cargo, cIdx) => (
                                <div 
                                  key={cIdx} 
                                  className={`${cargo.color} h-full transition-all duration-1000 flex items-center justify-center text-[8px] font-black text-white`}
                                  style={{ width: `${cargo.value}%` }}
                                  title={`${cargo.name}: ${cargo.value}%`}
                                >
                                  {cargo.value > 15 ? `${cargo.value}%` : ''}
                                </div>
                              ))}
                            </div>

                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400">
                              {VESSEL_DATA[selectedVessel].cargoDistribution.map((cargo, cIdx) => (
                                <div key={cIdx} className="flex items-center space-x-1.5">
                                  <span className={`w-2 h-2 rounded ${cargo.color}`}></span>
                                  <span className="truncate">{cargo.name} ({cargo.value}%)</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Port Clearances Checkbox telemetry */}
                          <div className="space-y-2 bg-slate-50 border border-slate-150 p-3 rounded-2xl text-[10px] text-slate-600">
                            <span className="font-bold text-slate-400 uppercase block mb-1">Pre-Arrival Port Clearances</span>
                            <div className="flex justify-between items-center border-b border-slate-100/50 pb-1.5">
                              <span className="font-semibold">Customs Manifest Declaration KYC</span>
                              <span className="text-emerald-600 font-black flex items-center gap-1">✓ PASSED</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-100/50 pb-1.5">
                              <span className="font-semibold">Quay Terminal Reservation</span>
                              <span className="text-emerald-600 font-black flex items-center gap-1">✓ SECURED</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Harbor Pilot & Tug Boat Dispatch</span>
                              <span className="text-amber-600 font-black flex items-center gap-1">⏱ PENDING APPROACH</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* Right Column: AIS Live Telemetry Logs & Capacity Gauges (4 Cols) */}
                  <div className="xl:col-span-4 space-y-6">
                    
                    {/* Live AIS Telemetry Stream Terminal */}
                    <div className="bg-slate-950 rounded-3xl border border-slate-900 shadow-2xl p-5 text-white h-[320px] flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                        <div className="flex items-center space-x-2 text-indigo-400">
                          <Activity size={14} className="animate-pulse" />
                          <h4 className="text-xs font-black uppercase tracking-wider">AIS Telemetry Stream</h4>
                        </div>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      </div>

                      {/* Log Screen */}
                      <div className="flex-1 my-3 overflow-y-auto space-y-2.5 pr-1 font-mono text-[9px] leading-normal text-left scrollbar-thin scrollbar-thumb-slate-800">
                        {aisLogs.map((log, idx) => (
                          <div key={idx} className="border-b border-slate-900/60 pb-1.5">
                            <span className="text-slate-500">[{log.time}]</span>{' '}
                            <span className={`px-1.5 py-0.2 rounded-[3px] text-[8px] font-black uppercase inline-block mr-1.5 ${
                              log.tag === 'AIS' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/50' :
                              log.tag === 'MET' ? 'bg-amber-950 text-amber-400 border border-amber-900/50' :
                              log.tag === 'PORT' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' :
                              'bg-purple-950 text-purple-400 border border-purple-900/50'
                            }`}>
                              {log.tag}
                            </span>
                            <span className="text-slate-300">{log.msg}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[8px] text-slate-500 font-mono text-center border-t border-slate-900 pt-2 font-bold uppercase tracking-wider">
                        SECURE AES-256 SATELLITE ENCRYPTION LOGS
                      </div>
                    </div>

                    {/* Interactive Telemetry Resource Capacity Gauges */}
                    <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm text-left space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Terminal Resource Capacity</h4>
                        <span className="text-[9px] font-bold text-slate-400">Click to detail</span>
                      </div>

                      {/* Three Horizontal gauges */}
                      <div className="space-y-4">
                        
                        {/* Terminal yard capacity */}
                        <div 
                          onClick={() => setActiveGaugeDetail(activeGaugeDetail === 'terminal' ? null : 'terminal')}
                          className={`p-3 border rounded-2xl cursor-pointer transition-all duration-150 ${
                            activeGaugeDetail === 'terminal' ? 'bg-indigo-50/50 border-indigo-300 shadow-sm' : 'bg-slate-50 hover:bg-slate-100/50 border-slate-150'
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                              <Anchor size={13} className="text-indigo-600" />
                              Yard Capacity
                            </span>
                            <span className="font-mono font-black text-indigo-600">74%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full mt-2 overflow-hidden border border-slate-300/30">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: '74%' }}></div>
                          </div>
                          
                          {activeGaugeDetail === 'terminal' && (
                            <div className="mt-2.5 pt-2 border-t border-indigo-200/50 text-[10px] text-slate-600 space-y-1 animate-fade-in leading-relaxed">
                              <div className="flex justify-between font-medium">
                                <span>Dry Container Slots Open:</span>
                                <span className="font-bold text-slate-800">1,240 TEU</span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span>Reefer Cargo Outlets Connected:</span>
                                <span className="font-bold text-slate-800">82% utilization</span>
                              </div>
                              <p className="text-[9px] text-slate-400 italic mt-1">Terminal yard congestion index: 2.1 (Low delay forecast).</p>
                            </div>
                          )}
                        </div>

                        {/* Deck Load Gauge */}
                        <div 
                          onClick={() => setActiveGaugeDetail(activeGaugeDetail === 'deck' ? null : 'deck')}
                          className={`p-3 border rounded-2xl cursor-pointer transition-all duration-150 ${
                            activeGaugeDetail === 'deck' ? 'bg-emerald-50/50 border-emerald-300 shadow-sm' : 'bg-slate-50 hover:bg-slate-100/50 border-slate-150'
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                              <Ship size={13} className="text-emerald-600" />
                              Fleet Cargo Weight
                            </span>
                            <span className="font-mono font-black text-emerald-600">89%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full mt-2 overflow-hidden border border-slate-300/30">
                            <div className="h-full bg-emerald-600 rounded-full" style={{ width: '89%' }}></div>
                          </div>
                          
                          {activeGaugeDetail === 'deck' && (
                            <div className="mt-2.5 pt-2 border-t border-emerald-200/50 text-[10px] text-slate-600 space-y-1 animate-fade-in leading-relaxed">
                              <div className="flex justify-between font-medium">
                                <span>Active Cargo Load Weight:</span>
                                <span className="font-bold text-slate-800">22,250 Metric Tons</span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span>Free Cargo Capacity Remaining:</span>
                                <span className="font-bold text-slate-800">2,750 Metric Tons</span>
                              </div>
                              <p className="text-[9px] text-slate-400 italic mt-1">Vessel draft compliance: 100% verified by port authority.</p>
                            </div>
                          )}
                        </div>

                        {/* Eco Green Index */}
                        <div 
                          onClick={() => setActiveGaugeDetail(activeGaugeDetail === 'eco' ? null : 'eco')}
                          className={`p-3 border rounded-2xl cursor-pointer transition-all duration-150 ${
                            activeGaugeDetail === 'eco' ? 'bg-teal-50/50 border-teal-300 shadow-sm' : 'bg-slate-50 hover:bg-slate-100/50 border-slate-150'
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                              <Globe size={13} className="text-teal-600" />
                              Eco-Routing Index
                            </span>
                            <span className="font-mono font-black text-teal-600">92%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full mt-2 overflow-hidden border border-slate-300/30">
                            <div className="h-full bg-teal-600 rounded-full" style={{ width: '92%' }}></div>
                          </div>
                          
                          {activeGaugeDetail === 'eco' && (
                            <div className="mt-2.5 pt-2 border-t border-teal-200/50 text-[10px] text-slate-600 space-y-1 animate-fade-in leading-relaxed">
                              <div className="flex justify-between font-medium">
                                <span>CO2 Emissions Prevented:</span>
                                <span className="font-bold text-teal-600">1,248 kg carbon offset</span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span>Optimal Flow Speed Factor:</span>
                                <span className="font-bold text-teal-600">96.4% compliance</span>
                              </div>
                              <p className="text-[9px] text-slate-400 italic mt-1">Routing optimization has saved equivalent of 52 mature trees this cycle.</p>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                  </div>

                </div>

                {/* Major Ocean Channels & Logistics leaderboard */}
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">Oceanic Transit Channel Performance</h3>
                      <p className="text-[10px] text-slate-400">Weekly performance and congestion tracking on major trade lanes</p>
                    </div>
                    <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md font-bold uppercase">Sea-lanes registry</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold">
                          <th className="pb-3.5">Ocean Transit Channel</th>
                          <th className="pb-3.5">TEU Allocation Capacity</th>
                          <th className="pb-3.5">Mean Transit Speed</th>
                          <th className="pb-3.5">Departure Freq.</th>
                          <th className="pb-3.5">Lane Congestion Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        <tr className="hover:bg-slate-50/40">
                          <td className="py-3.5 font-bold text-slate-800">Mumbai Port (IN) ➔ Dubai Port (UAE)</td>
                          <td className="py-3.5">14,200 TEU</td>
                          <td className="py-3.5 font-mono text-indigo-600">22.4 kn average</td>
                          <td className="py-3.5">4 vessels / week</td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">OPTIMAL RANGE</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/40">
                          <td className="py-3.5 font-bold text-slate-800">Cochin Terminal (IN) ➔ Singapore Port (SG)</td>
                          <td className="py-3.5">18,500 TEU</td>
                          <td className="py-3.5 font-mono text-indigo-600">19.5 kn average</td>
                          <td className="py-3.5">3 vessels / week</td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">OPTIMAL RANGE</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/40">
                          <td className="py-3.5 font-bold text-slate-800">Chennai Port (IN) ➔ Rotterdam Terminal (NL)</td>
                          <td className="py-3.5">22,000 TEU</td>
                          <td className="py-3.5 font-mono text-indigo-600">18.2 kn average</td>
                          <td className="py-3.5 font-normal text-slate-400">Bi-weekly dispatch</td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">MODERATE CLOG (+1.2d)</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
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
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Origin Country</label>
                        <select value={originCountry} onChange={(e) => handleOriginCountryChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800">
                          {Object.keys(COUNTRIES_AND_CITIES).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Destination Country</label>
                        <select value={destinationCountry} onChange={(e) => handleDestinationCountryChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800">
                          {Object.keys(COUNTRIES_AND_CITIES).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Origin City</label>
                        <select value={originCity} onChange={(e) => setOriginCity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800">
                          {(COUNTRIES_AND_CITIES[originCountry] || []).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Destination City</label>
                        <select value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800">
                          {(COUNTRIES_AND_CITIES[destinationCountry] || []).map(c => <option key={c} value={c}>{c}</option>)}
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
                          {(originCountry === destinationCountry ? DOMESTIC_TYPES : INTERNATIONAL_TYPES).map(t => <option key={t} value={getTypeMapping(t)}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Fleet Vehicle Selection for Air & Ocean */}
                    {(shipmentType === 'Air' || shipmentType === 'Ocean') && (
                      <div className="border border-indigo-200 bg-indigo-50/30 p-4 rounded-xl space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1 flex items-center gap-1.5">
                          {shipmentType === 'Air' ? <span>✈️</span> : <span>🚢</span>}
                          Select {shipmentType === 'Air' ? 'Aircraft / Cargo Plane' : 'Container Vessel / Ship'}
                        </label>
                        {fleetLoading ? (
                          <div className="text-xs text-slate-400 italic">Loading available fleet...</div>
                        ) : availableFleet.length === 0 ? (
                          <div className="text-xs text-amber-600 font-medium">No {shipmentType === 'Air' ? 'aircraft' : 'vessels'} available at the moment.</div>
                        ) : (
                          <select value={fleetVehicleId} onChange={(e) => setFleetVehicleId(e.target.value)} className="w-full bg-white border border-indigo-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                            {availableFleet.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.vehicleNumber} — {v.driverName} ({v.capacity} kg cap.) {v.status === 'In Transit' ? '🔴' : '🟢'}
                              </option>
                            ))}
                          </select>
                        )}
                        <p className="text-[9px] text-indigo-400 font-medium">
                          {shipmentType === 'Air' 
                            ? 'Select a cargo aircraft for your air shipment.' 
                            : 'Select a container vessel for your ocean freight.'}
                        </p>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-4">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">📦 Package Dimensions (cm)</label>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-400 mb-1 text-center">Length</label>
                          <input type="number" placeholder="e.g. 30" value={length} onChange={(e) => setLength(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-400 mb-1 text-center">Width</label>
                          <input type="number" placeholder="e.g. 20" value={width} onChange={(e) => setWidth(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-400 mb-1 text-center">Height</label>
                          <input type="number" placeholder="e.g. 10" value={height} onChange={(e) => setHeight(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
                        <Package size={12} className="text-indigo-500" />
                        <span>Content Details</span>
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-400 mb-1">Consignment Category</label>
                          <select 
                            value={consignmentCategory} 
                            onChange={(e) => setConsignmentCategory(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          >
                            <option value="Parcel">Apparel & Cloth</option>
                            <option value="Documents">Documents</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Books">Books & Printed Matter</option>
                            <option value="Household">Household / Personal Items</option>
                            <option value="Medicine">Medicine & Pharma</option>
                            <option value="Other">Other Category</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-400 mb-1">
                            Declared Parcel Value ({getCurrencySymbol(getCurrencyForCountries(originCountry, destinationCountry))})
                          </label>
                          <input 
                            type="number" 
                            min="1" 
                            value={declaredValue} 
                            onChange={(e) => setDeclaredValue(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300" 
                            required 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 mb-1">Item Description / Contents</label>
                        <input type="text" placeholder="e.g. Cotton clothing, Documents, Metal keychains, etc." value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
                      </div>
                      <div className="flex items-center space-x-3 bg-slate-50/50 p-2.5 border border-slate-200/50 rounded-xl">
                        <input type="checkbox" id="isMetal" checked={isMetal} onChange={(e) => setIsMetal(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                        <label htmlFor="isMetal" className="text-xs text-slate-700 font-semibold cursor-pointer select-none">
                          Contains Metal Items (Subject to magnetic scanner clearance)
                        </label>
                      </div>
                      {isMetal && (
                        <div className="bg-amber-50/60 border border-amber-200 text-amber-800 p-3 rounded-xl text-[11px] leading-relaxed flex items-start space-x-2">
                          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                          <span>
                            <strong>Metal Item Alert:</strong> Shipment contains metal. It will undergo magnetic signature scan at security checkpoints. Delayed routing may occur if non-compliant with standard air cargo policies.
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
                        <Clock size={12} className="text-indigo-500" />
                        <span>Schedule Pickup</span>
                      </label>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 mb-1">Pickup Date & Time (Future Date)</label>
                        <input 
                          type="datetime-local" 
                          value={pickupDate} 
                          onChange={(e) => setPickupDate(e.target.value)} 
                          min={new Date().toISOString().slice(0, 16)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" 
                          required 
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
                        <Clock size={12} className="text-indigo-500" />
                        <span>Sender Information</span>
                      </label>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 mb-1">Sender Phone Number</label>
                        <input type="text" placeholder="e.g. +91 9876543210" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
                        <MapPin size={12} className="text-indigo-500" />
                        <span>Recipient Details</span>
                      </label>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Recipient Name</label>
                        <input type="text" placeholder="e.g. Rahul Sharma" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Delivery Address</label>
                        <textarea placeholder="Full delivery address..." rows="3" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" required></textarea>
                      </div>
                    </div>
                     {/* KYC Conditions & Security Fields depending on Domestic vs International */}
                    {(originCountry !== 'India' || destinationCountry !== 'India') ? (
                      <div className="border-t border-slate-100 pt-4 space-y-3">
                        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-3">
                          <h5 className="text-xs font-bold text-indigo-800 flex items-center space-x-1.5">
                            <Globe size={14} className="text-indigo-600 animate-spin-slow" />
                            <span>International KYC & Customs Conditions</span>
                          </h5>
                          <ul className="list-disc pl-4 text-[11px] text-indigo-700/90 space-y-1">
                            <li><strong>KYC Compliance:</strong> A valid Passport or Government ID is required for customs verification.</li>
                            <li><strong>Customs Duties:</strong> Consignments may be subject to local import taxes/duties at the destination country.</li>
                            <li><strong>Commercial Invoice:</strong> An official declaration of item description and value must accompany the parcel.</li>
                            <li><strong>Dangerous Goods:</strong> Liquids, aerosol cans, lithium batteries, and hazardous materials are strictly prohibited.</li>
                          </ul>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
                              <Shield size={12} className="text-indigo-500" />
                              <span>Passport / Customs ID Number</span>
                            </label>
                            <input 
                              type="text" 
                              placeholder="e.g. Passport Number, SSN, EIN" 
                              value={govtIdProof} 
                              onChange={(e) => setGovtIdProof(e.target.value)} 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" 
                              required 
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
                              <Phone size={12} className="text-indigo-500" />
                              <span>Recipient Phone (Intl)</span>
                            </label>
                            <input 
                              type="text" 
                              placeholder="e.g. +1 555-0199" 
                              value={recipientPhone} 
                              onChange={(e) => setRecipientPhone(e.target.value)} 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" 
                              required 
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
                            <ClipboardList size={12} className="text-indigo-500" />
                            <span>Customs Declaration (Items Description)</span>
                          </label>
                          <textarea 
                            placeholder="Provide a detailed list of items being shipped (e.g. 2 cotton shirts, 1 set of headphones, etc.)" 
                            rows="2"
                            value={customsDescription} 
                            onChange={(e) => setCustomsDescription(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" 
                            required 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-slate-100 pt-4 space-y-3">
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl space-y-2">
                          <h5 className="text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
                            <Shield size={14} className="text-emerald-600" />
                            <span>Domestic Security Regulations</span>
                          </h5>
                          <p className="text-[11px] text-emerald-700/90 leading-relaxed">
                            Under domestic cargo transport acts, all parcels are scanned at airports and transit hubs. Please supply Aadhaar/PAN details for verification.
                          </p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
                            <User size={12} className="text-indigo-500" />
                            <span>Aadhaar Number / PAN Card / GSTIN</span>
                          </label>
                          <input 
                            type="text" 
                            placeholder="Enter 12-digit Aadhaar, 10-digit PAN or GSTIN" 
                            value={govtIdProof} 
                            onChange={(e) => setGovtIdProof(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" 
                            required 
                          />
                        </div>
                      </div>
                    )}

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
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm animate-fade-in text-left">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                      <Coins size={14} className="text-emerald-600" />
                      <span>Estimated Cost Quote</span>
                    </h4>
                    <div className="text-center py-4 space-y-2">
                      <span className="block text-3xl font-black text-emerald-600">
                        {(() => {
                          const basePrice = rates.base_fare || 150.0;
                          const perKgRate = rates.per_kg_fare || 50.0;
                          const taxPercent = rates.tax_rate || 18.0;

                          let multiplier = 1.0;
                          if (shipmentType === 'Express') multiplier = rates.express_multiplier || 1.5;
                          else if (shipmentType === 'Air') multiplier = rates.air_multiplier || 2.5;
                          else if (shipmentType === 'Ocean') multiplier = rates.ocean_multiplier || 0.8;
                          
                          let intlSurcharge = 1.0;
                          if (originCountry !== 'India' || destinationCountry !== 'India') {
                            intlSurcharge = 1.8;
                          }
                          const costBeforeTax = (basePrice + (weight * perKgRate)) * multiplier * intlSurcharge;
                          const costInINR = costBeforeTax * (1 + (taxPercent / 100));

                          const cur = getCurrencyForCountries(originCountry, destinationCountry);
                          const sym = getCurrencySymbol(cur);
                          let conv = 1.0;
                          if (cur === 'USD') conv = 0.012;
                          else if (cur === 'GBP') conv = 0.0095;
                          else if (cur === 'AED') conv = 0.044;
                          else if (cur === 'AUD') conv = 0.018;

                          const cost = costInINR * conv;
                          return `${sym} ${Number(cost).toFixed(2)}`;
                        })()}
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
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">From Country</label>
                        <select value={calcOriginCountry} onChange={(e) => setCalcOriginCountry(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs">
                          {Object.keys(COUNTRIES_AND_CITIES).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">To Country</label>
                        <select value={calcDestCountry} onChange={(e) => setCalcDestCountry(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs">
                          {Object.keys(COUNTRIES_AND_CITIES).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">From City</label>
                        <select value={calcOrigin} onChange={(e) => setCalcOrigin(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs">
                          {(COUNTRIES_AND_CITIES[calcOriginCountry] || []).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">To City</label>
                        <select value={calcDest} onChange={(e) => setCalcDest(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs">
                          {(COUNTRIES_AND_CITIES[calcDestCountry] || []).map(c => <option key={c} value={c}>{c}</option>)}
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
                          {(calcOriginCountry === calcDestCountry ? DOMESTIC_TYPES : INTERNATIONAL_TYPES).map(t => <option key={t} value={getTypeMapping(t)}>{t}</option>)}
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
                        <span className="text-xs font-bold text-emerald-600">
                          {(() => {
                            const cur = getCurrencyForCountries(calcOriginCountry, calcDestCountry);
                            const sym = getCurrencySymbol(cur);
                            let conv = 1.0;
                            if (cur === 'USD') conv = 0.012;
                            else if (cur === 'GBP') conv = 0.0095;
                            else if (cur === 'AED') conv = 0.044;
                            else if (cur === 'AUD') conv = 0.018;
                            return `${sym}${(calculatedCost * conv).toFixed(2)}`;
                          })()}
                        </span>
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
                            <td className="py-3.5 font-bold text-emerald-600">{getCurrencySymbol(invoice.currency)} {Number(invoice.amount || 0).toFixed(2)}</td>
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

            {/* TAB: PROFILE SETTINGS */}
            {activeTab === 'profile' && (
              <div className="animate-fade-in space-y-6 max-w-2xl">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5 flex items-center gap-2">
                    <Settings size={16} /> {t('profileSettings')}
                  </h3>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Name</label>
                      <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                      <input type="email" value={user?.email || ''} disabled
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone</label>
                      <input type="text" value={profilePhone} onChange={e => setProfilePhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition" />
                    </div>
                    <button type="submit" disabled={profileUpdating}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50">
                      {profileUpdating ? 'Updating...' : 'Update Profile'}
                    </button>
                  </form>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5">Change Password</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Password</label>
                      <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Password</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition" />
                    </div>
                    <button type="submit" disabled={changingPwd}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50">
                      {changingPwd ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB: REFERRALS & REWARDS */}
            {activeTab === 'referrals' && (
              <div className="animate-fade-in space-y-6 max-w-2xl">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Gift size={16} /> {t('referrals')}
                    </h3>
                    {referralData && (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200">
                        {referralData.totalPoints} Points
                      </span>
                    )}
                  </div>

                  {referralData && (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                        <label className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Your Referral Code</label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-indigo-700 tracking-widest">{referralData.referralCode}</span>
                          <button onClick={handleCopyReferralCode}
                            className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition">
                            {referralCopied ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                        <p className="text-[10px] text-indigo-500 mt-1">Share this code with friends. You both earn rewards!</p>
                      </div>

                      {/* Apply Referral */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Have a referral code?</label>
                        <div className="flex gap-2">
                          <input type="text" value={referralInput} onChange={e => setReferralInput(e.target.value)}
                            placeholder="Enter referral code..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition" />
                          <button onClick={handleApplyReferral} disabled={referralApplied}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50">
                            {referralApplied ? 'Applied!' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rewards History */}
                  {referralData?.rewards?.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Rewards History</h4>
                      <div className="space-y-2">
                        {referralData.rewards.map(r => (
                          <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2">
                              <Award size={14} className="text-amber-500" />
                              <div>
                                <p className="text-xs font-bold text-slate-700">{r.description}</p>
                                <span className="text-[9px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <span className="text-xs font-black text-amber-600">+{r.points} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Referral History */}
                  {referralData?.referrals?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">People You Referred</h4>
                      <div className="space-y-2">
                        {referralData.referrals.map(ref => (
                          <div key={ref.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                              <p className="text-xs font-bold text-slate-700">{ref.referred_name || 'New User'}</p>
                              <span className="text-[9px] text-slate-400">{ref.referred_email}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                              ref.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {ref.status} +{ref.reward_earned}pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: SCHEDULE CALENDAR */}
            {activeTab === 'schedule' && (
              <div className="animate-fade-in max-w-2xl">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5 flex items-center gap-2">
                    <Calendar size={16} /> {t('schedule')}
                  </h3>

                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={prevMonth} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition text-xs font-bold">&larr; Prev</button>
                    <h4 className="text-sm font-black text-slate-800">{monthNames[calendarMonth]} {calendarYear}</h4>
                    <button onClick={nextMonth} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition text-xs font-bold">Next &rarr;</button>
                  </div>

                  {/* Day Names */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(d => (
                      <div key={d} className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider py-1">{d}</div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: getFirstDayOfMonth(calendarMonth, calendarYear) }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-20 p-1 rounded-xl" />
                    ))}
                    {Array.from({ length: getDaysInMonth(calendarMonth, calendarYear) }).map((_, i) => {
                      const day = i + 1;
                      const dayShipments = getShipmentsForDay(day);
                      const isToday = day === new Date().getDate() && calendarMonth === new Date().getMonth() && calendarYear === new Date().getFullYear();
                      return (
                        <div key={day} className={`h-20 p-1 rounded-xl border transition relative ${
                          isToday ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                        }`}>
                          <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>{day}</span>
                          <div className="mt-1 space-y-0.5">
                            {dayShipments.slice(0, 2).map(s => (
                              <div key={s.id} className={`text-[7px] font-bold px-1 py-0.5 rounded truncate ${
                                s.status === 'Booked' ? 'bg-blue-100 text-blue-700' :
                                s.status === 'In Transit' ? 'bg-amber-100 text-amber-700' :
                                s.status === 'Out for Delivery' ? 'bg-green-100 text-green-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {s.trackingId?.slice(0, 8)}
                              </div>
                            ))}
                            {dayShipments.length > 2 && (
                              <span className="text-[7px] text-indigo-500 font-bold">+{dayShipments.length - 2} more</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                    {[{ label: 'Booked', color: 'bg-blue-100 text-blue-700' },
                      { label: 'In Transit', color: 'bg-amber-100 text-amber-700' },
                      { label: 'Out for Delivery', color: 'bg-green-100 text-green-700' }
                    ].map(l => (
                      <span key={l.label} className={`text-[9px] font-bold px-2 py-0.5 rounded ${l.color}`}>{l.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: RETURNS & REVERSE PICKUP */}
            {activeTab === 'returns' && (
              <div className="animate-fade-in space-y-6 max-w-2xl">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-5 flex items-center gap-2">
                    <Undo2 size={16} /> {t('returns')}
                  </h3>

                  <form onSubmit={handleSubmitReturn} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Delivered Shipment *</label>
                      <select value={returnShipmentId} onChange={e => setReturnShipmentId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition">
                        <option value="">-- Select Shipment --</option>
                        {shipments.filter(s => s.status === 'Delivered').map(s => (
                          <option key={s.id} value={s.id}>{s.trackingId} - {s.recipientName} ({s.destinationCity})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Reason for Return *</label>
                      <textarea value={returnReason} onChange={e => setReturnReason(e.target.value)} rows={3}
                        placeholder="Describe why you want to return this shipment..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pickup Address *</label>
                      <textarea value={returnPickupAddress} onChange={e => setReturnPickupAddress(e.target.value)} rows={2}
                        placeholder="Enter pickup address for the return..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Preferred Pickup Date</label>
                      <input type="date" value={returnPickupDate} onChange={e => setReturnPickupDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition" />
                    </div>
                    <button type="submit" disabled={returnSubmitting}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50">
                      {returnSubmitting ? 'Submitting...' : 'Submit Return Request'}
                    </button>
                  </form>
                </div>

                {/* Returns History */}
                {returns.length > 0 && (
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Your Return Requests</h4>
                    <div className="space-y-3">
                      {returns.map(r => (
                        <div key={r.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-800">{r.tracking_id}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                r.status === 'requested' ? 'bg-blue-50 text-blue-700' :
                                r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                                r.status === 'rejected' ? 'bg-red-50 text-red-700' :
                                r.status === 'picked_up' ? 'bg-amber-50 text-amber-700' :
                                'bg-green-50 text-green-700'
                              }`}>{r.status}</span>
                            </div>
                            <p className="text-[10px] text-slate-500">Reason: {r.reason}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">Requested: {new Date(r.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* Floating Widget Action Buttons Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Bug Report Panel */}
        {floatingBugOpen && (
          <div className="w-[340px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-1 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-500 p-4 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2">
                <Bug size={16} className="animate-pulse" />
                <span className="font-extrabold text-xs tracking-wider uppercase">Report System Bug</span>
              </div>
              <button 
                onClick={() => setFloatingBugOpen(false)}
                className="text-white hover:text-red-200 text-sm font-bold bg-white/10 rounded-full h-6 w-6 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendBugReport} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">What went wrong?</label>
                <textarea
                  value={bugInput}
                  onChange={(e) => setBugInput(e.target.value)}
                  placeholder="Describe the bug/problem here..."
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition"
                  required
                />
              </div>

              {/* Photo attachment field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attach Screenshot / Photo</label>
                <div className="flex items-center space-x-3">
                  <label className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-xl cursor-pointer transition text-xs text-slate-500">
                    <Camera size={14} className="text-slate-400" />
                    <span>{bugScreenshot ? 'Change Photo' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBugScreenshotChange}
                      className="hidden"
                    />
                  </label>
                  {bugScreenshot && (
                    <button
                      type="button"
                      onClick={() => setBugScreenshot(null)}
                      className="text-[10px] text-red-500 hover:underline font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {bugScreenshot && (
                  <div className="mt-2 relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-1 flex justify-center">
                    <img src={bugScreenshot} alt="Bug screenshot preview" className="max-h-[100px] object-contain rounded-md" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={bugLoading}
                className="w-full py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {bugLoading ? 'Submitting...' : 'Send Bug Report'}
              </button>
            </form>
          </div>
        )}

        {/* AI Chat Panel */}
        {floatingChatOpen && (
          <div className="w-[340px] h-[450px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-1 animate-fade-in">
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

        {/* Buttons Row */}
        <div className="flex space-x-3">
          {/* Bug Trigger Button */}
          <button
            onClick={() => {
              setFloatingBugOpen(prev => !prev);
              setFloatingChatOpen(false);
            }}
            className="h-12 w-12 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-white flex items-center justify-center shadow-lg hover:shadow-red-glow border border-red-400/20 hover:scale-105 active:scale-95 transition duration-150 relative"
            title="Report Bug"
          >
            {floatingBugOpen ? (
              <span className="text-lg font-bold">✕</span>
            ) : (
              <Bug size={20} className="animate-pulse" />
            )}
          </button>

          {/* AI Chatbot Trigger Button */}
          <button
            onClick={() => {
              setFloatingChatOpen(prev => !prev);
              setFloatingBugOpen(false);
            }}
            className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg hover:shadow-indigo-glow border border-indigo-400/20 hover:scale-105 active:scale-95 transition duration-150 relative"
            title="Ask AI"
          >
            {floatingChatOpen ? (
              <span className="text-lg font-bold">✕</span>
            ) : (
              <span className="text-xl animate-pulse">🤖</span>
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
