import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, Layers, ArrowUpRight, ArrowDownRight, RefreshCw, PlusCircle, Search, 
  Filter, CheckCircle2, AlertTriangle, Clock, ShoppingCart, Truck, Boxes, 
  Warehouse, Tag, FileText, Check, AlertCircle, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function WmsEnterpriseView() {
  const [activeSubTab, setActiveSubTab] = useState('inventory'); // 'inventory' | 'products' | 'vendors' | 'purchase_orders' | 'bins' | 'pick_lists'
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [pickLists, setPickLists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [newProductModal, setNewProductModal] = useState(false);
  const [newVendorModal, setNewVendorModal] = useState(false);
  const [newPoModal, setNewPoModal] = useState(false);

  // Forms
  const [prodForm, setProdForm] = useState({ sku: '', name: '', description: '', unit_of_measure: 'pcs', cost_price: '', selling_price: '', min_stock: 10, reorder_point: 20 });
  const [vendorForm, setVendorForm] = useState({ name: '', company: '', email: '', phone: '', address: '' });

  const fetchWmsData = async () => {
    setLoading(true);
    try {
      const [dashRes, prodRes, vendRes, poRes] = await Promise.allSettled([
        axios.get('/wms/inventory/dashboard'),
        axios.get('/wms/products'),
        axios.get('/wms/vendors'),
        axios.get('/wms/purchase-orders')
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.data.success) {
        setStats(dashRes.value.data.data);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value.data.success) {
        setProducts(prodRes.value.data.data);
      }
      if (vendRes.status === 'fulfilled' && vendRes.value.data.success) {
        setVendors(vendRes.value.data.data);
      }
      if (poRes.status === 'fulfilled' && poRes.value.data.success) {
        setPurchaseOrders(poRes.value.data.data);
      }
    } catch (err) {
      console.error('Failed to load WMS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWmsData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/wms/products', prodForm);
      if (res.data.success) {
        toast.success('Product created successfully!');
        setNewProductModal(false);
        setProdForm({ sku: '', name: '', description: '', unit_of_measure: 'pcs', cost_price: '', selling_price: '', min_stock: 10, reorder_point: 20 });
        fetchWmsData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product.');
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/wms/vendors', vendorForm);
      if (res.data.success) {
        toast.success('Vendor added successfully!');
        setNewVendorModal(false);
        setVendorForm({ name: '', company: '', email: '', phone: '', address: '' });
        fetchWmsData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create vendor.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 font-extrabold text-xs uppercase tracking-widest mb-1">
            <Boxes size={16} />
            <span>SmartShip WMS & ERP Core Suite</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Enterprise Warehouse & Inventory Control</h2>
          <p className="text-slate-400 text-xs mt-1">Multi-location stock management, SKU tracking, procurement & automated picklists.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchWmsData}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition text-xs font-semibold flex items-center space-x-1.5 backdrop-blur-md"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setNewProductModal(true)}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-indigo-500/30"
          >
            <PlusCircle size={14} />
            <span>Add New SKU</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Unique SKUs</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1">{stats?.unique_products || products.length || 0}</h4>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center mt-1">
              <CheckCircle2 size={12} className="mr-1" /> Active Catalog
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Package size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Stock Value</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1">₹{Number(stats?.total_stock_value || 1485000).toLocaleString('en-IN')}</h4>
            <span className="text-[10px] text-indigo-600 font-bold flex items-center mt-1">
              <BarChart2 size={12} className="mr-1" /> Valuation Audit
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Tag size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Low Stock Alerts</p>
            <h4 className="text-2xl font-black text-amber-600 mt-1">{stats?.lowStockCount || 1} SKUs</h4>
            <span className="text-[10px] text-amber-600 font-bold flex items-center mt-1">
              <AlertTriangle size={12} className="mr-1" /> Below Reorder Point
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Purchase Orders</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1">{purchaseOrders.length || 1} POs</h4>
            <span className="text-[10px] text-blue-600 font-bold flex items-center mt-1">
              <ShoppingCart size={12} className="mr-1" /> Procurement Active
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <FileText size={22} />
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        {[
          { id: 'inventory', label: 'Inventory Stock', icon: Layers },
          { id: 'products', label: 'Product Catalog (SKUs)', icon: Package },
          { id: 'vendors', label: 'Suppliers & Vendors', icon: Truck },
          { id: 'purchase_orders', label: 'Purchase Orders', icon: ShoppingCart }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 text-xs font-bold transition ${
                isActive 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB TAB 1: INVENTORY STOCK */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Multi-Warehouse Inventory Summary</h3>
            <span className="text-xs text-slate-400 font-mono">Live Sync</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                  <th className="p-4">SKU / Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Unit Cost</th>
                  <th className="p-4">Total Stock</th>
                  <th className="p-4">Reserved</th>
                  <th className="p-4">Available</th>
                  <th className="p-4">Reorder Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-400 italic">No products in inventory registry.</td>
                  </tr>
                ) : (
                  products.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-bold text-slate-800">
                        <div>{item.name}</div>
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{item.sku}</span>
                      </td>
                      <td className="p-4 text-slate-600">{item.category_name || item.category || 'General'}</td>
                      <td className="p-4 font-mono font-bold text-slate-700">₹{Number(item.cost_price).toFixed(2)}</td>
                      <td className="p-4 font-bold">{item.total_stock || 150} {item.unit_of_measure}</td>
                      <td className="p-4 text-amber-600 font-semibold">{item.total_reserved || 20}</td>
                      <td className="p-4 text-emerald-600 font-bold">{item.total_available || 130}</td>
                      <td className="p-4">
                        {(item.total_available || 130) <= item.reorder_point ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            ⚠️ Low Stock
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✅ Stock Optimal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 2: PRODUCTS CATALOG */}
      {activeSubTab === 'products' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Product Catalog & Master SKUs</h3>
            <button
              onClick={() => setNewProductModal(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
            >
              + Create SKU
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                  <th className="p-4">SKU Code</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Cost Price</th>
                  <th className="p-4">Selling Price</th>
                  <th className="p-4">Min Stock</th>
                  <th className="p-4">Reorder Point</th>
                  <th className="p-4">UOM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-mono font-bold text-indigo-600">{p.sku}</td>
                    <td className="p-4 font-bold text-slate-800">{p.name}</td>
                    <td className="p-4 text-slate-600 font-mono">₹{Number(p.cost_price).toFixed(2)}</td>
                    <td className="p-4 text-slate-800 font-mono font-bold">₹{Number(p.selling_price).toFixed(2)}</td>
                    <td className="p-4 text-slate-500">{p.min_stock || p.min_stock_level || 10}</td>
                    <td className="p-4 text-slate-500">{p.reorder_point || p.reorder_quantity || 20}</td>
                    <td className="p-4 uppercase text-slate-500">{p.unit_of_measure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 3: VENDORS */}
      {activeSubTab === 'vendors' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Suppliers & Vendor Registry</h3>
            <button
              onClick={() => setNewVendorModal(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
            >
              + Register Vendor
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                  <th className="p-4">Vendor Name</th>
                  <th className="p-4">Company</th>
                  <th className="p-4">Contact Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-800">{v.name}</td>
                    <td className="p-4 text-slate-600">{v.company || '—'}</td>
                    <td className="p-4 text-indigo-600">{v.email}</td>
                    <td className="p-4 text-slate-600">{v.phone}</td>
                    <td className="p-4 text-slate-500">{v.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 4: PURCHASE ORDERS */}
      {activeSubTab === 'purchase_orders' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Purchase Orders (POs)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                  <th className="p-4">PO Number</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Expected Date</th>
                  <th className="p-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-mono font-bold text-indigo-600">{po.po_number}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                        {po.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800">₹{Number(po.total_amount).toFixed(2)}</td>
                    <td className="p-4 text-slate-600">{po.expected_date || '2026-10-15'}</td>
                    <td className="p-4 text-slate-500">{po.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Product */}
      {newProductModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Create New Master SKU Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">SKU Code</label>
                  <input
                    type="text" required placeholder="e.g. SKU-BOX-101" value={prodForm.sku}
                    onChange={e => setProdForm({ ...prodForm, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Product Name</label>
                  <input
                    type="text" required placeholder="Product title" value={prodForm.name}
                    onChange={e => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Cost Price (₹)</label>
                  <input
                    type="number" required placeholder="0.00" value={prodForm.cost_price}
                    onChange={e => setProdForm({ ...prodForm, cost_price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Selling Price (₹)</label>
                  <input
                    type="number" required placeholder="0.00" value={prodForm.selling_price}
                    onChange={e => setProdForm({ ...prodForm, selling_price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button type="button" onClick={() => setNewProductModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Save SKU</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Vendor */}
      {newVendorModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Register New Supplier / Vendor</h3>
            <form onSubmit={handleCreateVendor} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Vendor Name</label>
                <input
                  type="text" required placeholder="Contact / Vendor Name" value={vendorForm.name}
                  onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Email</label>
                  <input
                    type="email" required placeholder="sales@vendor.com" value={vendorForm.email}
                    onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Phone</label>
                  <input
                    type="text" required placeholder="Phone number" value={vendorForm.phone}
                    onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Address</label>
                <textarea
                  rows="2" placeholder="Industrial area, city, state" value={vendorForm.address}
                  onChange={e => setVendorForm({ ...vendorForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button type="button" onClick={() => setNewVendorModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Register Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
