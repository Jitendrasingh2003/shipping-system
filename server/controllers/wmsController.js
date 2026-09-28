/**
 * WMS Controller — Thin HTTP handlers
 * All business logic lives in services, controllers just handle req/res
 */
const {
  categoryService, productService, zoneService, binService,
  inventoryService, vendorService, purchaseOrderService,
  grnService, salesOrderService,
} = require('../services/wmsService');

// ── Helper: wrap async handlers ──────────────────────────────
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ═══════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════
const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.list(req.tenant.id);
  res.json({ success: true, categories });
});

const getCategoryTree = asyncHandler(async (req, res) => {
  const tree = await categoryService.getTree(req.tenant.id);
  res.json({ success: true, tree });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.create(req.tenant.id, req.body);
  res.status(201).json({ success: true, message: 'Category created successfully', category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.update(req.params.id, req.tenant.id, req.body);
  res.json({ success: true, message: 'Category updated successfully', category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.delete(req.params.id, req.tenant.id);
  res.json({ success: true, message: 'Category deleted successfully' });
});

// ═══════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════
const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.list(req.tenant.id, req.query);
  res.json({ success: true, ...result });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id, req.tenant.id);
  res.json({ success: true, product });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.create(req.tenant.id, req.body);
  res.status(201).json({ success: true, message: 'Product created successfully', product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.update(req.params.id, req.tenant.id, req.body);
  res.json({ success: true, message: 'Product updated successfully', product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.delete(req.params.id, req.tenant.id);
  res.json({ success: true, message: 'Product deleted successfully' });
});

// ═══════════════════════════════════════════════════════════════
// WAREHOUSE ZONES
// ═══════════════════════════════════════════════════════════════
const getZones = asyncHandler(async (req, res) => {
  const zones = await zoneService.listByWarehouse(req.params.warehouseId, req.tenant.id);
  res.json({ success: true, zones });
});

const createZone = asyncHandler(async (req, res) => {
  const zone = await zoneService.create(req.tenant.id, req.body);
  res.status(201).json({ success: true, message: 'Zone created successfully', zone });
});

const updateZone = asyncHandler(async (req, res) => {
  const zone = await zoneService.update(req.params.id, req.tenant.id, req.body);
  res.json({ success: true, message: 'Zone updated successfully', zone });
});

const deleteZone = asyncHandler(async (req, res) => {
  await zoneService.delete(req.params.id, req.tenant.id);
  res.json({ success: true, message: 'Zone deleted successfully' });
});

// ═══════════════════════════════════════════════════════════════
// BIN LOCATIONS
// ═══════════════════════════════════════════════════════════════
const getBinsByZone = asyncHandler(async (req, res) => {
  const bins = await binService.listByZone(req.params.zoneId, req.tenant.id);
  res.json({ success: true, bins });
});

const getBinsByWarehouse = asyncHandler(async (req, res) => {
  const bins = await binService.listByWarehouse(req.params.warehouseId, req.tenant.id);
  res.json({ success: true, bins });
});

const getBinUtilization = asyncHandler(async (req, res) => {
  const stats = await binService.getUtilization(req.params.warehouseId, req.tenant.id);
  res.json({ success: true, stats });
});

const createBin = asyncHandler(async (req, res) => {
  const bin = await binService.create(req.tenant.id, req.body);
  res.status(201).json({ success: true, message: 'Bin location created successfully', bin });
});

const createBulkBins = asyncHandler(async (req, res) => {
  const result = await binService.createBulk(req.tenant.id, req.body);
  res.status(201).json({ success: true, message: `${result.created} bins created successfully`, ...result });
});

const deleteBin = asyncHandler(async (req, res) => {
  await binService.delete(req.params.id, req.tenant.id);
  res.json({ success: true, message: 'Bin location deleted successfully' });
});

// ═══════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════
const getInventoryDashboard = asyncHandler(async (req, res) => {
  const stats = await inventoryService.getDashboardStats(req.tenant.id);
  res.json({ success: true, stats });
});

const getWarehouseInventory = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.getWarehouseSummary(req.params.warehouseId, req.tenant.id);
  res.json({ success: true, inventory });
});

const getLowStockItems = asyncHandler(async (req, res) => {
  const items = await inventoryService.getLowStock(req.tenant.id);
  res.json({ success: true, items, count: items.length });
});

const getExpiringItems = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const items = await inventoryService.getExpiring(req.tenant.id, days);
  res.json({ success: true, items, count: items.length });
});

const getMovementHistory = asyncHandler(async (req, res) => {
  const result = await inventoryService.getMovementHistory(req.params.productId, req.tenant.id, req.query);
  res.json({ success: true, ...result });
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const activity = await inventoryService.getRecentActivity(req.tenant.id, limit);
  res.json({ success: true, activity });
});

const adjustStock = asyncHandler(async (req, res) => {
  const result = await inventoryService.recordMovement(req.tenant.id, {
    productId: req.body.productId,
    warehouseId: req.body.warehouseId,
    binId: req.body.binId,
    quantity: req.body.quantity,
    movementType: req.body.adjustmentType,
    reason: req.body.reason,
    notes: req.body.notes,
    batchNumber: req.body.batchNumber,
    serialNumber: req.body.serialNumber,
    performedBy: req.user.id,
    performedByName: req.user.name,
    toBinId: req.body.binId,
  });
  res.json({ success: true, message: 'Stock adjusted successfully', ...result });
});

const transferStock = asyncHandler(async (req, res) => {
  const result = await inventoryService.recordMovement(req.tenant.id, {
    productId: req.body.productId,
    warehouseId: req.body.fromWarehouseId,
    quantity: req.body.quantity,
    movementType: 'transfer',
    fromWarehouseId: req.body.fromWarehouseId,
    toWarehouseId: req.body.toWarehouseId,
    fromBinId: req.body.fromBinId,
    toBinId: req.body.toBinId,
    batchNumber: req.body.batchNumber,
    notes: req.body.notes,
    reason: 'Stock transfer',
    performedBy: req.user.id,
    performedByName: req.user.name,
  });
  res.json({ success: true, message: 'Stock transferred successfully', ...result });
});

// ═══════════════════════════════════════════════════════════════
// VENDORS
// ═══════════════════════════════════════════════════════════════
const getVendors = asyncHandler(async (req, res) => {
  const result = await vendorService.list(req.tenant.id, req.query);
  res.json({ success: true, ...result });
});

const getVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getById(req.params.id, req.tenant.id);
  res.json({ success: true, vendor });
});

const createVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.create(req.tenant.id, req.body);
  res.status(201).json({ success: true, message: 'Vendor created successfully', vendor });
});

const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.update(req.params.id, req.tenant.id, req.body);
  res.json({ success: true, message: 'Vendor updated successfully', vendor });
});

const deleteVendor = asyncHandler(async (req, res) => {
  await vendorService.delete(req.params.id, req.tenant.id);
  res.json({ success: true, message: 'Vendor deactivated successfully' });
});

// ═══════════════════════════════════════════════════════════════
// PURCHASE ORDERS
// ═══════════════════════════════════════════════════════════════
const getPurchaseOrders = asyncHandler(async (req, res) => {
  const result = await purchaseOrderService.list(req.tenant.id, req.query);
  res.json({ success: true, ...result });
});

const getPurchaseOrder = asyncHandler(async (req, res) => {
  const po = await purchaseOrderService.getById(req.params.id, req.tenant.id);
  res.json({ success: true, purchaseOrder: po });
});

const createPurchaseOrder = asyncHandler(async (req, res) => {
  const po = await purchaseOrderService.create(req.tenant.id, req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Purchase order created successfully', purchaseOrder: po });
});

const updatePOStatus = asyncHandler(async (req, res) => {
  const po = await purchaseOrderService.updateStatus(req.params.id, req.tenant.id, req.body.status, req.user.id);
  res.json({ success: true, message: `Purchase order status updated to ${req.body.status}`, purchaseOrder: po });
});

// ═══════════════════════════════════════════════════════════════
// GOODS RECEIPT NOTES (GRN)
// ═══════════════════════════════════════════════════════════════
const getGRNs = asyncHandler(async (req, res) => {
  const result = await grnService.list(req.tenant.id, req.query);
  res.json({ success: true, ...result });
});

const getGRN = asyncHandler(async (req, res) => {
  const grn = await grnService.getById(req.params.id, req.tenant.id);
  res.json({ success: true, grn });
});

const createGRN = asyncHandler(async (req, res) => {
  const grn = await grnService.create(req.tenant.id, req.user.id, req.user.name, req.body);
  res.status(201).json({ success: true, message: 'GRN created successfully', grn });
});

const completeGRN = asyncHandler(async (req, res) => {
  const grn = await grnService.complete(req.params.id, req.tenant.id, req.user.id, req.user.name);
  res.json({ success: true, message: 'GRN completed — inventory updated', grn });
});

// ═══════════════════════════════════════════════════════════════
// SALES ORDERS
// ═══════════════════════════════════════════════════════════════
const getSalesOrders = asyncHandler(async (req, res) => {
  const result = await salesOrderService.list(req.tenant.id, req.query);
  res.json({ success: true, ...result });
});

const getSalesOrder = asyncHandler(async (req, res) => {
  const so = await salesOrderService.getById(req.params.id, req.tenant.id);
  res.json({ success: true, salesOrder: so });
});

const createSalesOrder = asyncHandler(async (req, res) => {
  const so = await salesOrderService.create(req.tenant.id, req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Sales order created successfully', salesOrder: so });
});

const updateSOStatus = asyncHandler(async (req, res) => {
  const so = await salesOrderService.updateStatus(req.params.id, req.tenant.id, req.body.status);
  res.json({ success: true, message: `Sales order status updated to ${req.body.status}`, salesOrder: so });
});

module.exports = {
  // Categories
  getCategories, getCategoryTree, createCategory, updateCategory, deleteCategory,
  // Products
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  // Zones
  getZones, createZone, updateZone, deleteZone,
  // Bins
  getBinsByZone, getBinsByWarehouse, getBinUtilization, createBin, createBulkBins, deleteBin,
  // Inventory
  getInventoryDashboard, getWarehouseInventory, getLowStockItems, getExpiringItems,
  getMovementHistory, getRecentActivity, adjustStock, transferStock,
  // Vendors
  getVendors, getVendor, createVendor, updateVendor, deleteVendor,
  // Purchase Orders
  getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePOStatus,
  // GRN
  getGRNs, getGRN, createGRN, completeGRN,
  // Sales Orders
  getSalesOrders, getSalesOrder, createSalesOrder, updateSOStatus,
};
