/**
 * WMS Routes — All WMS API endpoints with Joi validation
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const v = require('../validators/wmsValidators');
const wms = require('../controllers/wmsController');

// All WMS routes require authentication
router.use(protect);

// ═══════════════════════════════════════════════════════════════
// PRODUCT CATEGORIES
// ═══════════════════════════════════════════════════════════════
router.get('/categories', wms.getCategories);
router.get('/categories/tree', wms.getCategoryTree);
router.post('/categories', authorize('admin'), validate(v.createCategorySchema), wms.createCategory);
router.put('/categories/:id', authorize('admin'), validate(v.updateCategorySchema), wms.updateCategory);
router.delete('/categories/:id', authorize('admin'), wms.deleteCategory);

// ═══════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════
router.get('/products', validate(v.listProductsQuerySchema, 'query'), wms.getProducts);
router.get('/products/:id', wms.getProduct);
router.post('/products', authorize('admin', 'staff'), validate(v.createProductSchema), wms.createProduct);
router.put('/products/:id', authorize('admin', 'staff'), validate(v.updateProductSchema), wms.updateProduct);
router.delete('/products/:id', authorize('admin'), wms.deleteProduct);

// ═══════════════════════════════════════════════════════════════
// WAREHOUSE ZONES
// ═══════════════════════════════════════════════════════════════
router.get('/zones/warehouse/:warehouseId', wms.getZones);
router.post('/zones', authorize('admin'), validate(v.createZoneSchema), wms.createZone);
router.put('/zones/:id', authorize('admin'), validate(v.updateZoneSchema), wms.updateZone);
router.delete('/zones/:id', authorize('admin'), wms.deleteZone);

// ═══════════════════════════════════════════════════════════════
// BIN LOCATIONS
// ═══════════════════════════════════════════════════════════════
router.get('/bins/zone/:zoneId', wms.getBinsByZone);
router.get('/bins/warehouse/:warehouseId', wms.getBinsByWarehouse);
router.get('/bins/utilization/:warehouseId', wms.getBinUtilization);
router.post('/bins', authorize('admin'), validate(v.createBinSchema), wms.createBin);
router.post('/bins/bulk', authorize('admin'), validate(v.createBulkBinsSchema), wms.createBulkBins);
router.delete('/bins/:id', authorize('admin'), wms.deleteBin);

// ═══════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════
router.get('/inventory/dashboard', wms.getInventoryDashboard);
router.get('/inventory/warehouse/:warehouseId', wms.getWarehouseInventory);
router.get('/inventory/low-stock', wms.getLowStockItems);
router.get('/inventory/expiring', wms.getExpiringItems);
router.get('/inventory/movements/:productId', wms.getMovementHistory);
router.get('/inventory/activity', wms.getRecentActivity);
router.post('/inventory/adjust', authorize('admin', 'staff'), validate(v.adjustInventorySchema), wms.adjustStock);
router.post('/inventory/transfer', authorize('admin', 'staff'), validate(v.transferInventorySchema), wms.transferStock);

// ═══════════════════════════════════════════════════════════════
// VENDORS
// ═══════════════════════════════════════════════════════════════
router.get('/vendors', wms.getVendors);
router.get('/vendors/:id', wms.getVendor);
router.post('/vendors', authorize('admin'), validate(v.createVendorSchema), wms.createVendor);
router.put('/vendors/:id', authorize('admin'), validate(v.updateVendorSchema), wms.updateVendor);
router.delete('/vendors/:id', authorize('admin'), wms.deleteVendor);

// ═══════════════════════════════════════════════════════════════
// PURCHASE ORDERS
// ═══════════════════════════════════════════════════════════════
router.get('/purchase-orders', wms.getPurchaseOrders);
router.get('/purchase-orders/:id', wms.getPurchaseOrder);
router.post('/purchase-orders', authorize('admin'), validate(v.createPurchaseOrderSchema), wms.createPurchaseOrder);
router.put('/purchase-orders/:id/status', authorize('admin'), wms.updatePOStatus);

// ═══════════════════════════════════════════════════════════════
// GOODS RECEIPT NOTES (GRN)
// ═══════════════════════════════════════════════════════════════
router.get('/grn', wms.getGRNs);
router.get('/grn/:id', wms.getGRN);
router.post('/grn', authorize('admin', 'staff'), validate(v.createGRNSchema), wms.createGRN);
router.put('/grn/:id/complete', authorize('admin', 'staff'), wms.completeGRN);

// ═══════════════════════════════════════════════════════════════
// SALES ORDERS
// ═══════════════════════════════════════════════════════════════
router.get('/sales-orders', wms.getSalesOrders);
router.get('/sales-orders/:id', wms.getSalesOrder);
router.post('/sales-orders', authorize('admin', 'staff'), validate(v.createSalesOrderSchema), wms.createSalesOrder);
router.put('/sales-orders/:id/status', authorize('admin', 'staff'), wms.updateSOStatus);

module.exports = router;
