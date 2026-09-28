/**
 * WMS Joi Validation Schemas
 * All validation rules for WMS module endpoints
 */
const Joi = require('joi');

// ── Shared field patterns ────────────────────────────────────
const uuid = Joi.string().uuid({ version: 'uuidv4' });
const trimmedString = Joi.string().trim();
const positiveNumber = Joi.number().positive();
const nonNegativeNumber = Joi.number().min(0);
const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: trimmedString.allow('').default(''),
  sortBy: trimmedString.default('created_at'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
};

// ═══════════════════════════════════════════════════════════════
// PRODUCT CATEGORY SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createCategorySchema = Joi.object({
  name: trimmedString.min(2).max(255).required()
    .messages({ 'any.required': 'Category name is required' }),
  description: trimmedString.max(500).allow('', null).default(null),
  parentId: uuid.allow(null).default(null),
  icon: trimmedString.max(100).default('package'),
  color: trimmedString.pattern(/^#[0-9a-fA-F]{6}$/).default('#6366f1')
    .messages({ 'string.pattern.base': 'Color must be a valid hex code like #6366f1' }),
});

const updateCategorySchema = Joi.object({
  name: trimmedString.min(2).max(255),
  description: trimmedString.max(500).allow('', null),
  parentId: uuid.allow(null),
  icon: trimmedString.max(100),
  color: trimmedString.pattern(/^#[0-9a-fA-F]{6}$/),
  isActive: Joi.boolean(),
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

// ═══════════════════════════════════════════════════════════════
// PRODUCT SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createProductSchema = Joi.object({
  sku: trimmedString.min(2).max(100).required()
    .messages({ 'any.required': 'SKU is required' }),
  name: trimmedString.min(2).max(255).required()
    .messages({ 'any.required': 'Product name is required' }),
  description: trimmedString.max(2000).allow('', null).default(null),
  categoryId: uuid.allow(null).default(null),
  unitOfMeasure: trimmedString.valid('pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'carton', 'pallet', 'bundle', 'set', 'pair', 'dozen', 'meter', 'sqft', 'unit').default('pcs'),
  weight: nonNegativeNumber.default(0),
  dimLength: nonNegativeNumber.default(0),
  dimWidth: nonNegativeNumber.default(0),
  dimHeight: nonNegativeNumber.default(0),
  minStock: Joi.number().integer().min(0).default(0),
  maxStock: Joi.number().integer().min(0).default(0),
  reorderPoint: Joi.number().integer().min(0).default(10),
  costPrice: nonNegativeNumber.precision(2).default(0),
  sellingPrice: nonNegativeNumber.precision(2).default(0),
  mrp: nonNegativeNumber.precision(2).default(0),
  taxRate: nonNegativeNumber.precision(2).max(100).default(18),
  hsnCode: trimmedString.max(20).allow('', null).default(null),
  barcode: trimmedString.max(100).allow('', null).default(null),
  tags: Joi.array().items(trimmedString.max(50)).max(20).default([]),
  attributes: Joi.object().pattern(Joi.string(), Joi.string().max(255)).default({}),
  isSerialized: Joi.boolean().default(false),
  isBatchTracked: Joi.boolean().default(false),
  isPerishable: Joi.boolean().default(false),
  shelfLifeDays: Joi.number().integer().positive().allow(null).default(null),
});

const updateProductSchema = Joi.object({
  name: trimmedString.min(2).max(255),
  description: trimmedString.max(2000).allow('', null),
  categoryId: uuid.allow(null),
  unitOfMeasure: trimmedString.valid('pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'carton', 'pallet', 'bundle', 'set', 'pair', 'dozen', 'meter', 'sqft', 'unit'),
  weight: nonNegativeNumber,
  dimLength: nonNegativeNumber,
  dimWidth: nonNegativeNumber,
  dimHeight: nonNegativeNumber,
  minStock: Joi.number().integer().min(0),
  maxStock: Joi.number().integer().min(0),
  reorderPoint: Joi.number().integer().min(0),
  costPrice: nonNegativeNumber.precision(2),
  sellingPrice: nonNegativeNumber.precision(2),
  mrp: nonNegativeNumber.precision(2),
  taxRate: nonNegativeNumber.precision(2).max(100),
  hsnCode: trimmedString.max(20).allow('', null),
  barcode: trimmedString.max(100).allow('', null),
  tags: Joi.array().items(trimmedString.max(50)).max(20),
  attributes: Joi.object().pattern(Joi.string(), Joi.string().max(255)),
  isSerialized: Joi.boolean(),
  isBatchTracked: Joi.boolean(),
  isPerishable: Joi.boolean(),
  shelfLifeDays: Joi.number().integer().positive().allow(null),
  isActive: Joi.boolean(),
}).min(1);

const listProductsQuerySchema = Joi.object({
  ...pagination,
  categoryId: uuid.allow(''),
  isActive: Joi.string().valid('true', 'false', ''),
  lowStock: Joi.string().valid('true', 'false', ''),
});

// ═══════════════════════════════════════════════════════════════
// WAREHOUSE ZONE SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createZoneSchema = Joi.object({
  warehouseId: uuid.required()
    .messages({ 'any.required': 'Warehouse ID is required' }),
  zoneName: trimmedString.min(2).max(100).required()
    .messages({ 'any.required': 'Zone name is required' }),
  zoneCode: trimmedString.min(1).max(20).uppercase().required()
    .messages({ 'any.required': 'Zone code is required' }),
  zoneType: Joi.string().valid('storage', 'receiving', 'shipping', 'staging', 'returns', 'cold_storage', 'hazardous', 'bulk').default('storage'),
  temperatureMin: Joi.number().allow(null).default(null),
  temperatureMax: Joi.number().allow(null).default(null),
  description: trimmedString.max(500).allow('', null).default(null),
  color: trimmedString.pattern(/^#[0-9a-fA-F]{6}$/).default('#3b82f6'),
  sortOrder: Joi.number().integer().min(0).default(0),
});

const updateZoneSchema = Joi.object({
  zoneName: trimmedString.min(2).max(100),
  zoneType: Joi.string().valid('storage', 'receiving', 'shipping', 'staging', 'returns', 'cold_storage', 'hazardous', 'bulk'),
  temperatureMin: Joi.number().allow(null),
  temperatureMax: Joi.number().allow(null),
  description: trimmedString.max(500).allow('', null),
  color: trimmedString.pattern(/^#[0-9a-fA-F]{6}$/),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
}).min(1);

// ═══════════════════════════════════════════════════════════════
// BIN LOCATION SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createBinSchema = Joi.object({
  zoneId: uuid.required()
    .messages({ 'any.required': 'Zone ID is required' }),
  warehouseId: uuid.required()
    .messages({ 'any.required': 'Warehouse ID is required' }),
  binCode: trimmedString.min(1).max(50).uppercase().required()
    .messages({ 'any.required': 'Bin code is required' }),
  aisle: trimmedString.max(10).allow('', null).default(null),
  rack: trimmedString.max(10).allow('', null).default(null),
  shelf: trimmedString.max(10).allow('', null).default(null),
  position: trimmedString.max(10).allow('', null).default(null),
  binType: Joi.string().valid('standard', 'bulk', 'pallet', 'cold', 'hazmat', 'returns').default('standard'),
  maxCapacity: positiveNumber.default(100),
  maxWeight: positiveNumber.default(500),
  isPickable: Joi.boolean().default(true),
  isReceivable: Joi.boolean().default(true),
});

const createBulkBinsSchema = Joi.object({
  zoneId: uuid.required(),
  warehouseId: uuid.required(),
  aisles: Joi.number().integer().min(1).max(26).required()
    .messages({ 'any.required': 'Number of aisles is required' }),
  racksPerAisle: Joi.number().integer().min(1).max(50).required(),
  shelvesPerRack: Joi.number().integer().min(1).max(20).required(),
  binType: Joi.string().valid('standard', 'bulk', 'pallet', 'cold', 'hazmat', 'returns').default('standard'),
  maxCapacity: positiveNumber.default(100),
  maxWeight: positiveNumber.default(500),
});

// ═══════════════════════════════════════════════════════════════
// INVENTORY SCHEMAS
// ═══════════════════════════════════════════════════════════════

const adjustInventorySchema = Joi.object({
  productId: uuid.required(),
  warehouseId: uuid.required(),
  binId: uuid.allow(null).default(null),
  quantity: Joi.number().required()
    .messages({ 'any.required': 'Quantity is required' }),
  adjustmentType: Joi.string().valid('cycle_count', 'damage', 'correction', 'write_off', 'found', 'other').required(),
  reason: trimmedString.max(255).required()
    .messages({ 'any.required': 'Reason is required for stock adjustment' }),
  batchNumber: trimmedString.max(100).allow('', null).default(null),
  serialNumber: trimmedString.max(100).allow('', null).default(null),
  notes: trimmedString.max(1000).allow('', null).default(null),
});

const transferInventorySchema = Joi.object({
  productId: uuid.required(),
  fromWarehouseId: uuid.required(),
  fromBinId: uuid.allow(null).default(null),
  toWarehouseId: uuid.required(),
  toBinId: uuid.allow(null).default(null),
  quantity: positiveNumber.required()
    .messages({ 'any.required': 'Transfer quantity is required' }),
  batchNumber: trimmedString.max(100).allow('', null).default(null),
  notes: trimmedString.max(1000).allow('', null).default(null),
});

const listInventoryQuerySchema = Joi.object({
  ...pagination,
  warehouseId: uuid.allow(''),
  zoneId: uuid.allow(''),
  productId: uuid.allow(''),
  lowStock: Joi.string().valid('true', 'false', ''),
  expiringSoon: Joi.string().valid('true', 'false', ''),
  expiryDays: Joi.number().integer().min(1).default(30),
});

// ═══════════════════════════════════════════════════════════════
// VENDOR SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createVendorSchema = Joi.object({
  name: trimmedString.min(2).max(255).required()
    .messages({ 'any.required': 'Vendor name is required' }),
  company: trimmedString.max(255).allow('', null).default(null),
  email: trimmedString.email().allow('', null).default(null),
  phone: trimmedString.max(50).allow('', null).default(null),
  address: trimmedString.max(500).allow('', null).default(null),
  city: trimmedString.max(100).allow('', null).default(null),
  state: trimmedString.max(100).allow('', null).default(null),
  pincode: trimmedString.max(20).allow('', null).default(null),
  country: trimmedString.max(100).default('India'),
  gstNumber: trimmedString.max(20).allow('', null).default(null),
  panNumber: trimmedString.max(20).allow('', null).default(null),
  paymentTerms: Joi.number().integer().min(0).max(365).default(30),
  notes: trimmedString.max(1000).allow('', null).default(null),
});

const updateVendorSchema = Joi.object({
  name: trimmedString.min(2).max(255),
  company: trimmedString.max(255).allow('', null),
  email: trimmedString.email().allow('', null),
  phone: trimmedString.max(50).allow('', null),
  address: trimmedString.max(500).allow('', null),
  city: trimmedString.max(100).allow('', null),
  state: trimmedString.max(100).allow('', null),
  pincode: trimmedString.max(20).allow('', null),
  country: trimmedString.max(100),
  gstNumber: trimmedString.max(20).allow('', null),
  panNumber: trimmedString.max(20).allow('', null),
  paymentTerms: Joi.number().integer().min(0).max(365),
  notes: trimmedString.max(1000).allow('', null),
  isActive: Joi.boolean(),
}).min(1);

// ═══════════════════════════════════════════════════════════════
// PURCHASE ORDER SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createPurchaseOrderSchema = Joi.object({
  vendorId: uuid.required()
    .messages({ 'any.required': 'Vendor is required' }),
  warehouseId: uuid.required()
    .messages({ 'any.required': 'Destination warehouse is required' }),
  expectedDate: Joi.date().iso().min('now').allow(null).default(null),
  notes: trimmedString.max(1000).allow('', null).default(null),
  terms: trimmedString.max(2000).allow('', null).default(null),
  items: Joi.array().items(Joi.object({
    productId: uuid.required(),
    quantity: positiveNumber.required(),
    unitPrice: nonNegativeNumber.precision(2).required(),
    taxRate: nonNegativeNumber.precision(2).max(100).default(18),
    discountPercent: nonNegativeNumber.precision(2).max(100).default(0),
    notes: trimmedString.max(255).allow('', null).default(null),
  })).min(1).required()
    .messages({ 'array.min': 'At least one item is required in the purchase order' }),
  shippingCost: nonNegativeNumber.precision(2).default(0),
  discountAmount: nonNegativeNumber.precision(2).default(0),
});

// ═══════════════════════════════════════════════════════════════
// GRN SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createGRNSchema = Joi.object({
  poId: uuid.allow(null).default(null),
  vendorId: uuid.allow(null).default(null),
  warehouseId: uuid.required()
    .messages({ 'any.required': 'Warehouse is required' }),
  notes: trimmedString.max(1000).allow('', null).default(null),
  items: Joi.array().items(Joi.object({
    productId: uuid.required(),
    expectedQty: nonNegativeNumber.default(0),
    receivedQty: positiveNumber.required(),
    rejectedQty: nonNegativeNumber.default(0),
    binId: uuid.allow(null).default(null),
    batchNumber: trimmedString.max(100).allow('', null).default(null),
    expiryDate: Joi.date().iso().allow(null).default(null),
    unitCost: nonNegativeNumber.precision(2).default(0),
    qualityNotes: trimmedString.max(500).allow('', null).default(null),
  })).min(1).required(),
});

// ═══════════════════════════════════════════════════════════════
// SALES ORDER SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createSalesOrderSchema = Joi.object({
  customerId: uuid.required()
    .messages({ 'any.required': 'Customer is required' }),
  customerName: trimmedString.min(2).max(255).required(),
  warehouseId: uuid.allow(null).default(null),
  shippingAddress: trimmedString.max(500).allow('', null).default(null),
  shippingCity: trimmedString.max(100).allow('', null).default(null),
  shippingPincode: trimmedString.max(20).allow('', null).default(null),
  shippingPhone: trimmedString.max(50).allow('', null).default(null),
  paymentMethod: Joi.string().valid('cod', 'prepaid', 'credit', 'upi', 'bank_transfer').default('prepaid'),
  expectedDelivery: Joi.date().iso().allow(null).default(null),
  notes: trimmedString.max(1000).allow('', null).default(null),
  items: Joi.array().items(Joi.object({
    productId: uuid.required(),
    quantity: positiveNumber.required(),
    unitPrice: nonNegativeNumber.precision(2).required(),
    discountPercent: nonNegativeNumber.precision(2).max(100).default(0),
    taxRate: nonNegativeNumber.precision(2).max(100).default(18),
  })).min(1).required()
    .messages({ 'array.min': 'At least one item is required' }),
  shippingCost: nonNegativeNumber.precision(2).default(0),
  discountAmount: nonNegativeNumber.precision(2).default(0),
});

// ═══════════════════════════════════════════════════════════════
// PICK LIST SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createPickListSchema = Joi.object({
  warehouseId: uuid.required(),
  salesOrderId: uuid.allow(null).default(null),
  shipmentId: uuid.allow(null).default(null),
  pickType: Joi.string().valid('single', 'batch', 'wave', 'zone').default('single'),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  assignedTo: uuid.allow(null).default(null),
  notes: trimmedString.max(1000).allow('', null).default(null),
  items: Joi.array().items(Joi.object({
    productId: uuid.required(),
    binId: uuid.required(),
    quantity: positiveNumber.required(),
  })).min(1).required(),
});

// ═══════════════════════════════════════════════════════════════
// PARAM SCHEMAS
// ═══════════════════════════════════════════════════════════════

const idParamSchema = Joi.object({
  id: uuid.required().messages({ 'any.required': 'ID parameter is required' }),
});

const warehouseIdParamSchema = Joi.object({
  warehouseId: uuid.required(),
});

module.exports = {
  // Categories
  createCategorySchema,
  updateCategorySchema,
  // Products
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  // Zones
  createZoneSchema,
  updateZoneSchema,
  // Bins
  createBinSchema,
  createBulkBinsSchema,
  // Inventory
  adjustInventorySchema,
  transferInventorySchema,
  listInventoryQuerySchema,
  // Vendors
  createVendorSchema,
  updateVendorSchema,
  // Purchase Orders
  createPurchaseOrderSchema,
  // GRN
  createGRNSchema,
  // Sales Orders
  createSalesOrderSchema,
  // Pick Lists
  createPickListSchema,
  // Params
  idParamSchema,
  warehouseIdParamSchema,
  // Shared
  pagination,
};
