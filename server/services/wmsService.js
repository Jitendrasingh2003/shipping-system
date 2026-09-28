/**
 * WMS Service — Business logic layer
 * All operations go through here, controllers are thin wrappers
 */
const { v4: uuidv4 } = require('uuid');
const {
  ProductCategory, Product, WarehouseZone, BinLocation,
  Inventory, InventoryMovement, Vendor, PurchaseOrder,
  GoodsReceiptNote, SalesOrder, PickList,
} = require('../models/wmsModels');
const { getMySQLPool } = require('../config/db.mysql');

// ═══════════════════════════════════════════════════════════════
// CATEGORY SERVICE
// ═══════════════════════════════════════════════════════════════
const categoryService = {
  async list(tenantId) {
    return ProductCategory.listWithCounts(tenantId);
  },

  async getTree(tenantId) {
    return ProductCategory.getTree(tenantId);
  },

  async create(tenantId, data) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return ProductCategory.create({
      id: uuidv4(),
      tenant_id: tenantId,
      name: data.name,
      slug,
      description: data.description,
      parent_id: data.parentId,
      icon: data.icon,
      color: data.color,
    });
  },

  async update(id, tenantId, data) {
    const existing = await ProductCategory.findById(id, tenantId);
    if (!existing) throw new Error('Category not found');

    const updateData = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.parentId !== undefined) updateData.parent_id = data.parentId;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.isActive !== undefined) updateData.is_active = data.isActive ? 1 : 0;

    return ProductCategory.update(id, updateData, tenantId);
  },

  async delete(id, tenantId) {
    const existing = await ProductCategory.findById(id, tenantId);
    if (!existing) throw new Error('Category not found');

    // Check if products exist under this category
    const count = await Product.count({ category_id: id, tenant_id: tenantId });
    if (count > 0) throw new Error(`Cannot delete category with ${count} product(s). Reassign products first.`);

    return ProductCategory.delete(id, tenantId);
  },
};

// ═══════════════════════════════════════════════════════════════
// PRODUCT SERVICE
// ═══════════════════════════════════════════════════════════════
const productService = {
  async list(tenantId, query) {
    return Product.listWithStock(tenantId, query);
  },

  async getById(id, tenantId) {
    const product = await Product.findById(id, tenantId);
    if (!product) throw new Error('Product not found');

    const stockDetails = await Product.getStockSummary(id, tenantId);
    const movementHistory = await InventoryMovement.getHistory(id, tenantId, { limit: 10 });

    return {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      tags: product.tags ? JSON.parse(product.tags) : [],
      attributes: product.attributes ? JSON.parse(product.attributes) : {},
      stockDetails,
      recentMovements: movementHistory.data,
    };
  },

  async create(tenantId, data) {
    // Check duplicate SKU
    const existing = await Product.findBySku(data.sku, tenantId);
    if (existing) throw new Error(`Product with SKU "${data.sku}" already exists`);

    if (data.barcode) {
      const existingBarcode = await Product.findByBarcode(data.barcode, tenantId);
      if (existingBarcode) throw new Error(`Barcode "${data.barcode}" is already assigned to another product`);
    }

    return Product.create({
      id: uuidv4(),
      tenant_id: tenantId,
      sku: data.sku.toUpperCase(),
      name: data.name,
      description: data.description,
      category_id: data.categoryId,
      unit_of_measure: data.unitOfMeasure,
      weight: data.weight,
      dim_length: data.dimLength,
      dim_width: data.dimWidth,
      dim_height: data.dimHeight,
      min_stock: data.minStock,
      max_stock: data.maxStock,
      reorder_point: data.reorderPoint,
      cost_price: data.costPrice,
      selling_price: data.sellingPrice,
      mrp: data.mrp,
      tax_rate: data.taxRate,
      hsn_code: data.hsnCode,
      barcode: data.barcode,
      images: JSON.stringify(data.images || []),
      tags: JSON.stringify(data.tags || []),
      attributes: JSON.stringify(data.attributes || {}),
      is_serialized: data.isSerialized ? 1 : 0,
      is_batch_tracked: data.isBatchTracked ? 1 : 0,
      is_perishable: data.isPerishable ? 1 : 0,
      shelf_life_days: data.shelfLifeDays,
    });
  },

  async update(id, tenantId, data) {
    const existing = await Product.findById(id, tenantId);
    if (!existing) throw new Error('Product not found');

    const updateData = {};
    const fieldMap = {
      name: 'name', description: 'description', categoryId: 'category_id',
      unitOfMeasure: 'unit_of_measure', weight: 'weight',
      dimLength: 'dim_length', dimWidth: 'dim_width', dimHeight: 'dim_height',
      minStock: 'min_stock', maxStock: 'max_stock', reorderPoint: 'reorder_point',
      costPrice: 'cost_price', sellingPrice: 'selling_price', mrp: 'mrp',
      taxRate: 'tax_rate', hsnCode: 'hsn_code', barcode: 'barcode',
      shelfLifeDays: 'shelf_life_days',
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (data[camel] !== undefined) updateData[snake] = data[camel];
    }
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
    if (data.attributes !== undefined) updateData.attributes = JSON.stringify(data.attributes);
    if (data.isSerialized !== undefined) updateData.is_serialized = data.isSerialized ? 1 : 0;
    if (data.isBatchTracked !== undefined) updateData.is_batch_tracked = data.isBatchTracked ? 1 : 0;
    if (data.isPerishable !== undefined) updateData.is_perishable = data.isPerishable ? 1 : 0;
    if (data.isActive !== undefined) updateData.is_active = data.isActive ? 1 : 0;

    return Product.update(id, updateData, tenantId);
  },

  async delete(id, tenantId) {
    const existing = await Product.findById(id, tenantId);
    if (!existing) throw new Error('Product not found');

    // Check if inventory exists
    const stockCount = await Inventory.count({ product_id: id, tenant_id: tenantId });
    if (stockCount > 0) {
      // Soft delete if stock exists
      return Product.update(id, { is_active: 0 }, tenantId);
    }
    return Product.delete(id, tenantId);
  },
};

// ═══════════════════════════════════════════════════════════════
// ZONE SERVICE
// ═══════════════════════════════════════════════════════════════
const zoneService = {
  async listByWarehouse(warehouseId, tenantId) {
    return WarehouseZone.listByWarehouse(warehouseId, tenantId);
  },

  async create(tenantId, data) {
    return WarehouseZone.create({
      id: uuidv4(),
      warehouse_id: data.warehouseId,
      tenant_id: tenantId,
      zone_name: data.zoneName,
      zone_code: data.zoneCode.toUpperCase(),
      zone_type: data.zoneType,
      temperature_min: data.temperatureMin,
      temperature_max: data.temperatureMax,
      description: data.description,
      color: data.color,
      sort_order: data.sortOrder,
    });
  },

  async update(id, tenantId, data) {
    const existing = await WarehouseZone.findById(id, tenantId);
    if (!existing) throw new Error('Zone not found');

    const updateData = {};
    if (data.zoneName !== undefined) updateData.zone_name = data.zoneName;
    if (data.zoneType !== undefined) updateData.zone_type = data.zoneType;
    if (data.temperatureMin !== undefined) updateData.temperature_min = data.temperatureMin;
    if (data.temperatureMax !== undefined) updateData.temperature_max = data.temperatureMax;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder;
    if (data.isActive !== undefined) updateData.is_active = data.isActive ? 1 : 0;

    return WarehouseZone.update(id, updateData, tenantId);
  },

  async delete(id, tenantId) {
    const bins = await BinLocation.count({ zone_id: id, tenant_id: tenantId });
    if (bins > 0) throw new Error(`Cannot delete zone with ${bins} bin location(s). Remove bins first.`);
    return WarehouseZone.delete(id, tenantId);
  },
};

// ═══════════════════════════════════════════════════════════════
// BIN SERVICE
// ═══════════════════════════════════════════════════════════════
const binService = {
  async listByZone(zoneId, tenantId) {
    return BinLocation.listByZone(zoneId, tenantId);
  },

  async listByWarehouse(warehouseId, tenantId) {
    return BinLocation.listByWarehouse(warehouseId, tenantId);
  },

  async getUtilization(warehouseId, tenantId) {
    const [stats] = await BinLocation.getUtilizationStats(warehouseId, tenantId);
    return stats;
  },

  async create(tenantId, data) {
    const existing = await BinLocation.findByCode(data.binCode.toUpperCase(), data.warehouseId);
    if (existing) throw new Error(`Bin code "${data.binCode}" already exists in this warehouse`);

    return BinLocation.create({
      id: uuidv4(),
      zone_id: data.zoneId,
      warehouse_id: data.warehouseId,
      tenant_id: tenantId,
      bin_code: data.binCode.toUpperCase(),
      aisle: data.aisle,
      rack: data.rack,
      shelf: data.shelf,
      position: data.position,
      bin_type: data.binType,
      max_capacity: data.maxCapacity,
      max_weight: data.maxWeight,
      is_pickable: data.isPickable ? 1 : 0,
      is_receivable: data.isReceivable ? 1 : 0,
    });
  },

  async createBulk(tenantId, data) {
    const bins = [];
    const aisleLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let a = 0; a < data.aisles; a++) {
      for (let r = 1; r <= data.racksPerAisle; r++) {
        for (let s = 1; s <= data.shelvesPerRack; s++) {
          const aisle = aisleLetters[a];
          const rack = r.toString().padStart(2, '0');
          const shelf = s.toString().padStart(2, '0');
          const binCode = `${aisle}-${rack}-${shelf}`;

          const existing = await BinLocation.findByCode(binCode, data.warehouseId);
          if (!existing) {
            bins.push({
              id: uuidv4(),
              zone_id: data.zoneId,
              warehouse_id: data.warehouseId,
              tenant_id: tenantId,
              bin_code: binCode,
              aisle, rack, shelf, position: '01',
              bin_type: data.binType,
              max_capacity: data.maxCapacity,
              max_weight: data.maxWeight,
              is_pickable: 1,
              is_receivable: 1,
            });
          }
        }
      }
    }

    if (bins.length === 0) throw new Error('All bin codes already exist');

    const pool = getMySQLPool();
    for (const bin of bins) {
      await pool.query(
        `INSERT INTO bin_locations (id, zone_id, warehouse_id, tenant_id, bin_code, aisle, rack, shelf, position, bin_type, max_capacity, max_weight, is_pickable, is_receivable) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [bin.id, bin.zone_id, bin.warehouse_id, bin.tenant_id, bin.bin_code, bin.aisle, bin.rack, bin.shelf, bin.position, bin.bin_type, bin.max_capacity, bin.max_weight, bin.is_pickable, bin.is_receivable]
      );
    }

    return { created: bins.length, bins };
  },

  async delete(id, tenantId) {
    const bin = await BinLocation.findById(id, tenantId);
    if (!bin) throw new Error('Bin not found');
    if (bin.current_qty > 0) throw new Error('Cannot delete bin with stock. Move items first.');
    return BinLocation.delete(id, tenantId);
  },
};

// ═══════════════════════════════════════════════════════════════
// INVENTORY SERVICE
// ═══════════════════════════════════════════════════════════════
const inventoryService = {
  async getWarehouseSummary(warehouseId, tenantId) {
    return Inventory.getWarehouseSummary(warehouseId, tenantId);
  },

  async getDashboardStats(tenantId) {
    return Inventory.getDashboardStats(tenantId);
  },

  async getLowStock(tenantId) {
    return Inventory.getLowStockItems(tenantId);
  },

  async getExpiring(tenantId, days = 30) {
    return Inventory.getExpiringItems(tenantId, days);
  },

  async getMovementHistory(productId, tenantId, options) {
    return InventoryMovement.getHistory(productId, tenantId, options);
  },

  async getRecentActivity(tenantId, limit = 20) {
    return InventoryMovement.getRecentActivity(tenantId, limit);
  },

  /**
   * Record stock movement and update inventory
   * This is the core function — all stock changes go through here
   */
  async recordMovement(tenantId, { productId, warehouseId, binId, quantity, movementType, referenceId, referenceType, referenceNumber, batchNumber, serialNumber, costPrice, reason, notes, performedBy, performedByName, fromBinId, toBinId, fromWarehouseId, toWarehouseId }) {
    const pool = getMySQLPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Record the movement
      const movementId = uuidv4();
      await connection.query(
        `INSERT INTO inventory_movements 
         (id, product_id, warehouse_id, tenant_id, from_bin_id, to_bin_id, from_warehouse_id, to_warehouse_id, quantity, movement_type, reference_id, reference_type, reference_number, batch_number, serial_number, cost_price, reason, notes, performed_by, performed_by_name) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [movementId, productId, warehouseId, tenantId, fromBinId, toBinId, fromWarehouseId, toWarehouseId, quantity, movementType, referenceId, referenceType, referenceNumber, batchNumber, serialNumber, costPrice || 0, reason, notes, performedBy, performedByName]
      );

      // 2. Update inventory based on movement type
      const inboundTypes = ['receive', 'putaway', 'return_in', 'adjustment_in', 'found', 'production_in'];
      const outboundTypes = ['pick', 'ship', 'return_out', 'adjustment_out', 'damage', 'scrap', 'production_out'];

      if (inboundTypes.includes(movementType)) {
        await this._addStock(connection, { productId, warehouseId, binId: toBinId || binId, tenantId, quantity, batchNumber, serialNumber, costPrice });
      } else if (outboundTypes.includes(movementType)) {
        await this._removeStock(connection, { productId, warehouseId, binId: fromBinId || binId, tenantId, quantity });
      } else if (movementType === 'transfer') {
        await this._removeStock(connection, { productId, warehouseId: fromWarehouseId || warehouseId, binId: fromBinId, tenantId, quantity });
        await this._addStock(connection, { productId, warehouseId: toWarehouseId || warehouseId, binId: toBinId, tenantId, quantity, batchNumber, serialNumber, costPrice });
      } else if (movementType === 'cycle_count') {
        // For cycle count, set absolute quantity
        await this._setStock(connection, { productId, warehouseId, binId, tenantId, quantity, batchNumber, costPrice });
      }

      // 3. Update bin current_qty
      if (toBinId || binId) {
        const targetBin = toBinId || binId;
        const [binStock] = await connection.query(
          'SELECT COALESCE(SUM(quantity), 0) as total FROM inventory WHERE bin_id = ? AND tenant_id = ?',
          [targetBin, tenantId]
        );
        await connection.query(
          'UPDATE bin_locations SET current_qty = ? WHERE id = ?',
          [binStock[0].total, targetBin]
        );
      }
      if (fromBinId) {
        const [binStock] = await connection.query(
          'SELECT COALESCE(SUM(quantity), 0) as total FROM inventory WHERE bin_id = ? AND tenant_id = ?',
          [fromBinId, tenantId]
        );
        await connection.query(
          'UPDATE bin_locations SET current_qty = ? WHERE id = ?',
          [binStock[0].total, fromBinId]
        );
      }

      await connection.commit();
      return { movementId, success: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async _addStock(connection, { productId, warehouseId, binId, tenantId, quantity, batchNumber, serialNumber, costPrice }) {
    // Check if inventory record exists for this product-location combo
    const conditions = ['product_id = ?', 'warehouse_id = ?', 'tenant_id = ?'];
    const params = [productId, warehouseId, tenantId];
    if (binId) { conditions.push('bin_id = ?'); params.push(binId); }
    else { conditions.push('bin_id IS NULL'); }
    if (batchNumber) { conditions.push('batch_number = ?'); params.push(batchNumber); }

    const [existing] = await connection.query(
      `SELECT * FROM inventory WHERE ${conditions.join(' AND ')} LIMIT 1`, params
    );

    if (existing.length > 0) {
      await connection.query(
        'UPDATE inventory SET quantity = quantity + ?, cost_price = ?, updated_at = NOW() WHERE id = ?',
        [quantity, costPrice || existing[0].cost_price, existing[0].id]
      );
    } else {
      await connection.query(
        `INSERT INTO inventory (id, product_id, warehouse_id, bin_id, tenant_id, quantity, batch_number, serial_number, cost_price) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), productId, warehouseId, binId, tenantId, quantity, batchNumber, serialNumber, costPrice || 0]
      );
    }
  },

  async _removeStock(connection, { productId, warehouseId, binId, tenantId, quantity }) {
    const conditions = ['product_id = ?', 'warehouse_id = ?', 'tenant_id = ?'];
    const params = [productId, warehouseId, tenantId];
    if (binId) { conditions.push('bin_id = ?'); params.push(binId); }
    else { conditions.push('bin_id IS NULL'); }

    const [existing] = await connection.query(
      `SELECT * FROM inventory WHERE ${conditions.join(' AND ')} AND quantity >= ? LIMIT 1`,
      [...params, quantity]
    );

    if (existing.length === 0) throw new Error('Insufficient stock for this operation');

    const newQty = existing[0].quantity - quantity;
    if (newQty <= 0) {
      await connection.query('DELETE FROM inventory WHERE id = ?', [existing[0].id]);
    } else {
      await connection.query(
        'UPDATE inventory SET quantity = ?, updated_at = NOW() WHERE id = ?',
        [newQty, existing[0].id]
      );
    }
  },

  async _setStock(connection, { productId, warehouseId, binId, tenantId, quantity, batchNumber, costPrice }) {
    const conditions = ['product_id = ?', 'warehouse_id = ?', 'tenant_id = ?'];
    const params = [productId, warehouseId, tenantId];
    if (binId) { conditions.push('bin_id = ?'); params.push(binId); }
    else { conditions.push('bin_id IS NULL'); }

    const [existing] = await connection.query(
      `SELECT * FROM inventory WHERE ${conditions.join(' AND ')} LIMIT 1`, params
    );

    if (existing.length > 0) {
      await connection.query(
        'UPDATE inventory SET quantity = ?, cost_price = ?, updated_at = NOW() WHERE id = ?',
        [quantity, costPrice || existing[0].cost_price, existing[0].id]
      );
    } else if (quantity > 0) {
      await connection.query(
        `INSERT INTO inventory (id, product_id, warehouse_id, bin_id, tenant_id, quantity, batch_number, cost_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), productId, warehouseId, binId, tenantId, quantity, batchNumber, costPrice || 0]
      );
    }
  },
};

// ═══════════════════════════════════════════════════════════════
// VENDOR SERVICE
// ═══════════════════════════════════════════════════════════════
const vendorService = {
  async list(tenantId, query) {
    return Vendor.listWithStats(tenantId, query);
  },

  async getById(id, tenantId) {
    const vendor = await Vendor.findById(id, tenantId);
    if (!vendor) throw new Error('Vendor not found');
    return vendor;
  },

  async create(tenantId, data) {
    return Vendor.create({
      id: uuidv4(),
      tenant_id: tenantId,
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      country: data.country,
      gst_number: data.gstNumber,
      pan_number: data.panNumber,
      payment_terms: data.paymentTerms,
      notes: data.notes,
    });
  },

  async update(id, tenantId, data) {
    const existing = await Vendor.findById(id, tenantId);
    if (!existing) throw new Error('Vendor not found');

    const updateData = {};
    const fields = ['name', 'company', 'email', 'phone', 'address', 'city', 'state', 'pincode', 'country', 'notes'];
    fields.forEach(f => { if (data[f] !== undefined) updateData[f] = data[f]; });
    if (data.gstNumber !== undefined) updateData.gst_number = data.gstNumber;
    if (data.panNumber !== undefined) updateData.pan_number = data.panNumber;
    if (data.paymentTerms !== undefined) updateData.payment_terms = data.paymentTerms;
    if (data.isActive !== undefined) updateData.is_active = data.isActive ? 1 : 0;

    return Vendor.update(id, updateData, tenantId);
  },

  async delete(id, tenantId) {
    const existing = await Vendor.findById(id, tenantId);
    if (!existing) throw new Error('Vendor not found');
    return Vendor.delete(id, tenantId, true); // Soft delete
  },
};

// ═══════════════════════════════════════════════════════════════
// PURCHASE ORDER SERVICE
// ═══════════════════════════════════════════════════════════════
const purchaseOrderService = {
  async list(tenantId, query) {
    return PurchaseOrder.paginate(tenantId, {
      ...query,
      searchFields: ['po_number'],
      filters: query.status ? { status: query.status } : {},
    });
  },

  async getById(id, tenantId) {
    const po = await PurchaseOrder.getWithItems(id, tenantId);
    if (!po) throw new Error('Purchase order not found');
    return po;
  },

  async create(tenantId, userId, data) {
    const pool = getMySQLPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const poNumber = await PurchaseOrder.generatePoNumber(tenantId);
      const poId = uuidv4();

      let subtotal = 0;
      let taxAmount = 0;

      // Calculate totals
      const itemsToInsert = data.items.map(item => {
        const itemTotal = item.quantity * item.unitPrice;
        const discount = itemTotal * (item.discountPercent / 100);
        const taxable = itemTotal - discount;
        const tax = taxable * (item.taxRate / 100);
        subtotal += taxable;
        taxAmount += tax;

        return {
          id: uuidv4(),
          po_id: poId,
          product_id: item.productId,
          tenant_id: tenantId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate,
          tax_amount: tax,
          discount_percent: item.discountPercent,
          total: taxable + tax,
          notes: item.notes,
        };
      });

      const totalAmount = subtotal + taxAmount + (data.shippingCost || 0) - (data.discountAmount || 0);

      // Insert PO
      await connection.query(
        `INSERT INTO purchase_orders 
         (id, tenant_id, po_number, vendor_id, warehouse_id, status, subtotal, tax_amount, discount_amount, shipping_cost, total_amount, expected_date, notes, terms, created_by) 
         VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [poId, tenantId, poNumber, data.vendorId, data.warehouseId, subtotal, taxAmount, data.discountAmount || 0, data.shippingCost || 0, totalAmount, data.expectedDate, data.notes, data.terms, userId]
      );

      // Insert items
      for (const item of itemsToInsert) {
        await connection.query(
          `INSERT INTO purchase_order_items 
           (id, po_id, product_id, tenant_id, quantity, unit_price, tax_rate, tax_amount, discount_percent, total, notes) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [item.id, item.po_id, item.product_id, item.tenant_id, item.quantity, item.unit_price, item.tax_rate, item.tax_amount, item.discount_percent, item.total, item.notes]
        );
      }

      await connection.commit();
      return PurchaseOrder.getWithItems(poId, tenantId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateStatus(id, tenantId, status, userId) {
    const po = await PurchaseOrder.findById(id, tenantId);
    if (!po) throw new Error('Purchase order not found');

    const updateData = { status };
    if (status === 'confirmed' && !po.approved_by) {
      updateData.approved_by = userId;
      updateData.approved_at = new Date();
    }
    if (status === 'received') {
      updateData.received_date = new Date();
    }

    return PurchaseOrder.update(id, updateData, tenantId);
  },
};

// ═══════════════════════════════════════════════════════════════
// GRN SERVICE
// ═══════════════════════════════════════════════════════════════
const grnService = {
  async list(tenantId, query) {
    return GoodsReceiptNote.paginate(tenantId, {
      ...query,
      searchFields: ['grn_number'],
    });
  },

  async getById(id, tenantId) {
    const grn = await GoodsReceiptNote.getWithItems(id, tenantId);
    if (!grn) throw new Error('GRN not found');
    return grn;
  },

  async create(tenantId, userId, userName, data) {
    const pool = getMySQLPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const grnNumber = await GoodsReceiptNote.generateGrnNumber(tenantId);
      const grnId = uuidv4();
      let totalReceived = 0;
      let totalRejected = 0;

      // Insert GRN
      await connection.query(
        `INSERT INTO goods_receipt_notes 
         (id, tenant_id, grn_number, po_id, vendor_id, warehouse_id, status, total_items, received_by, received_by_name, notes) 
         VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)`,
        [grnId, tenantId, grnNumber, data.poId, data.vendorId, data.warehouseId, data.items.length, userId, userName, data.notes]
      );

      // Insert items & update inventory
      for (const item of data.items) {
        const itemId = uuidv4();
        totalReceived += item.receivedQty;
        totalRejected += (item.rejectedQty || 0);

        await connection.query(
          `INSERT INTO grn_items 
           (id, grn_id, product_id, tenant_id, expected_qty, received_qty, rejected_qty, bin_id, batch_number, expiry_date, quality_status, quality_notes, unit_cost) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
          [itemId, grnId, item.productId, tenantId, item.expectedQty, item.receivedQty, item.rejectedQty || 0, item.binId, item.batchNumber, item.expiryDate, item.qualityNotes, item.unitCost]
        );
      }

      // Update totals
      await connection.query(
        'UPDATE goods_receipt_notes SET total_received = ?, total_rejected = ? WHERE id = ?',
        [totalReceived, totalRejected, grnId]
      );

      await connection.commit();
      return GoodsReceiptNote.getWithItems(grnId, tenantId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async complete(id, tenantId, userId, userName) {
    const grn = await GoodsReceiptNote.getWithItems(id, tenantId);
    if (!grn) throw new Error('GRN not found');
    if (grn.status === 'completed') throw new Error('GRN is already completed');

    // Add received items to inventory
    for (const item of grn.items) {
      const acceptedQty = item.received_qty - item.rejected_qty;
      if (acceptedQty > 0) {
        await inventoryService.recordMovement(tenantId, {
          productId: item.product_id,
          warehouseId: grn.warehouse_id,
          binId: item.bin_id,
          quantity: acceptedQty,
          movementType: 'receive',
          referenceId: grn.id,
          referenceType: 'grn',
          referenceNumber: grn.grn_number,
          batchNumber: item.batch_number,
          costPrice: item.unit_cost,
          reason: 'Goods received via GRN',
          performedBy: userId,
          performedByName: userName,
          toBinId: item.bin_id,
        });
      }
    }

    // Update PO status if linked
    if (grn.po_id) {
      await purchaseOrderService.updateStatus(grn.po_id, tenantId, 'received', userId);
    }

    return GoodsReceiptNote.update(id, {
      status: 'completed',
      inspected_by: userId,
      completed_at: new Date(),
    }, tenantId);
  },
};

// ═══════════════════════════════════════════════════════════════
// SALES ORDER SERVICE
// ═══════════════════════════════════════════════════════════════
const salesOrderService = {
  async list(tenantId, query) {
    return SalesOrder.paginate(tenantId, {
      ...query,
      searchFields: ['so_number', 'customer_name'],
      filters: query.status ? { status: query.status } : {},
    });
  },

  async getById(id, tenantId) {
    const so = await SalesOrder.getWithItems(id, tenantId);
    if (!so) throw new Error('Sales order not found');
    return so;
  },

  async create(tenantId, userId, data) {
    const pool = getMySQLPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const soNumber = await SalesOrder.generateSoNumber(tenantId);
      const soId = uuidv4();
      let subtotal = 0;
      let taxAmount = 0;

      const itemsToInsert = data.items.map(item => {
        const product = item; // Product details should be fetched, but keeping simple
        const itemTotal = item.quantity * item.unitPrice;
        const discount = itemTotal * (item.discountPercent / 100);
        const taxable = itemTotal - discount;
        const tax = taxable * (item.taxRate / 100);
        subtotal += taxable;
        taxAmount += tax;

        return {
          id: uuidv4(),
          so_id: soId,
          product_id: item.productId,
          tenant_id: tenantId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_percent: item.discountPercent,
          tax_rate: item.taxRate,
          tax_amount: tax,
          total: taxable + tax,
        };
      });

      const totalAmount = subtotal + taxAmount + (data.shippingCost || 0) - (data.discountAmount || 0);

      await connection.query(
        `INSERT INTO sales_orders 
         (id, tenant_id, so_number, customer_id, customer_name, warehouse_id, status, subtotal, tax_amount, discount_amount, shipping_cost, total_amount, payment_method, shipping_address, shipping_city, shipping_pincode, shipping_phone, expected_delivery, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [soId, tenantId, soNumber, data.customerId, data.customerName, data.warehouseId, subtotal, taxAmount, data.discountAmount || 0, data.shippingCost || 0, totalAmount, data.paymentMethod, data.shippingAddress, data.shippingCity, data.shippingPincode, data.shippingPhone, data.expectedDelivery, data.notes, userId]
      );

      for (const item of itemsToInsert) {
        await connection.query(
          `INSERT INTO sales_order_items 
           (id, so_id, product_id, tenant_id, quantity, unit_price, discount_percent, tax_rate, tax_amount, total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [item.id, item.so_id, item.product_id, item.tenant_id, item.quantity, item.unit_price, item.discount_percent, item.tax_rate, item.tax_amount, item.total]
        );
      }

      await connection.commit();
      return SalesOrder.getWithItems(soId, tenantId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateStatus(id, tenantId, status) {
    const so = await SalesOrder.findById(id, tenantId);
    if (!so) throw new Error('Sales order not found');
    return SalesOrder.update(id, { status }, tenantId);
  },
};

module.exports = {
  categoryService,
  productService,
  zoneService,
  binService,
  inventoryService,
  vendorService,
  purchaseOrderService,
  grnService,
  salesOrderService,
};
