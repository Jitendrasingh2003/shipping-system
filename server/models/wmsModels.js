/**
 * WMS Models — Data access layer for all WMS entities
 * Each model extends BaseModel for shared CRUD operations
 */
const BaseModel = require('./BaseModel');

// ═══════════════════════════════════════════════════════════════
// PRODUCT CATEGORY MODEL
// ═══════════════════════════════════════════════════════════════
class ProductCategory extends BaseModel {
  constructor() { super('product_categories'); }

  async listWithCounts(tenantId) {
    return this.raw(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM product_categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.tenant_id = c.tenant_id
      WHERE c.tenant_id = ?
      GROUP BY c.id
      ORDER BY c.name ASC
    `, [tenantId]);
  }

  async getTree(tenantId) {
    const categories = await this.findWhere({ tenant_id: tenantId }, { orderBy: 'name', order: 'ASC' });
    return this._buildTree(categories, null);
  }

  _buildTree(items, parentId) {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: this._buildTree(items, item.id),
      }));
  }
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT MODEL
// ═══════════════════════════════════════════════════════════════
class Product extends BaseModel {
  constructor() { super('products'); }

  async findBySku(sku, tenantId) {
    const [rows] = await this.pool.query(
      'SELECT * FROM products WHERE sku = ? AND tenant_id = ? LIMIT 1',
      [sku, tenantId]
    );
    return rows[0] || null;
  }

  async findByBarcode(barcode, tenantId) {
    const [rows] = await this.pool.query(
      'SELECT * FROM products WHERE barcode = ? AND tenant_id = ? LIMIT 1',
      [barcode, tenantId]
    );
    return rows[0] || null;
  }

  async listWithStock(tenantId, options = {}) {
    const { page = 1, limit = 20, search = '', categoryId, isActive, lowStock } = options;
    const where = ['p.tenant_id = ?'];
    const params = [tenantId];

    if (search) {
      where.push('(p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (categoryId) { where.push('p.category_id = ?'); params.push(categoryId); }
    if (isActive === 'true') { where.push('p.is_active = 1'); }
    if (isActive === 'false') { where.push('p.is_active = 0'); }

    const whereClause = where.join(' AND ');
    const offset = (page - 1) * limit;

    // Count
    const [[{ total }]] = await this.pool.query(
      `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`, params
    );

    // Data with aggregated stock
    let havingClause = '';
    if (lowStock === 'true') {
      havingClause = 'HAVING total_stock <= p.reorder_point';
    }

    const [rows] = await this.pool.query(`
      SELECT p.*,
        c.name as category_name,
        COALESCE(SUM(i.quantity), 0) as total_stock,
        COALESCE(SUM(i.reserved_qty), 0) as total_reserved,
        COALESCE(SUM(i.available_qty), 0) as total_available,
        COUNT(DISTINCT i.warehouse_id) as warehouse_count
      FROM products p
      LEFT JOIN product_categories c ON c.id = p.category_id
      LEFT JOIN inventory i ON i.product_id = p.id AND i.tenant_id = p.tenant_id
      WHERE ${whereClause}
      GROUP BY p.id
      ${havingClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return {
      data: rows,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getStockSummary(productId, tenantId) {
    return this.raw(`
      SELECT 
        i.warehouse_id, w.name as warehouse_name,
        i.zone_id, wz.zone_name,
        i.bin_id, bl.bin_code,
        i.quantity, i.reserved_qty, i.available_qty,
        i.batch_number, i.lot_number, i.expiry_date,
        i.cost_price, i.updated_at
      FROM inventory i
      LEFT JOIN warehouses w ON w.id = i.warehouse_id
      LEFT JOIN warehouse_zones wz ON wz.id = i.zone_id
      LEFT JOIN bin_locations bl ON bl.id = i.bin_id
      WHERE i.product_id = ? AND i.tenant_id = ?
      ORDER BY w.name, wz.zone_name, bl.bin_code
    `, [productId, tenantId]);
  }
}

// ═══════════════════════════════════════════════════════════════
// WAREHOUSE ZONE MODEL
// ═══════════════════════════════════════════════════════════════
class WarehouseZone extends BaseModel {
  constructor() { super('warehouse_zones'); }

  async listByWarehouse(warehouseId, tenantId) {
    return this.raw(`
      SELECT z.*,
        COUNT(DISTINCT b.id) as total_bins,
        COALESCE(SUM(b.current_qty), 0) as total_items,
        COALESCE(SUM(b.max_capacity), 0) as total_capacity
      FROM warehouse_zones z
      LEFT JOIN bin_locations b ON b.zone_id = z.id AND b.is_active = 1
      WHERE z.warehouse_id = ? AND z.tenant_id = ?
      GROUP BY z.id
      ORDER BY z.sort_order ASC, z.zone_name ASC
    `, [warehouseId, tenantId]);
  }
}

// ═══════════════════════════════════════════════════════════════
// BIN LOCATION MODEL
// ═══════════════════════════════════════════════════════════════
class BinLocation extends BaseModel {
  constructor() { super('bin_locations'); }

  async listByZone(zoneId, tenantId) {
    return this.raw(`
      SELECT b.*,
        z.zone_name, z.zone_type,
        w.name as warehouse_name
      FROM bin_locations b
      JOIN warehouse_zones z ON z.id = b.zone_id
      JOIN warehouses w ON w.id = b.warehouse_id
      WHERE b.zone_id = ? AND b.tenant_id = ?
      ORDER BY b.aisle, b.rack, b.shelf, b.position
    `, [zoneId, tenantId]);
  }

  async listByWarehouse(warehouseId, tenantId) {
    return this.raw(`
      SELECT b.*,
        z.zone_name, z.zone_type, z.color as zone_color
      FROM bin_locations b
      JOIN warehouse_zones z ON z.id = b.zone_id
      WHERE b.warehouse_id = ? AND b.tenant_id = ?
      ORDER BY z.sort_order, b.aisle, b.rack, b.shelf
    `, [warehouseId, tenantId]);
  }

  async findByCode(binCode, warehouseId) {
    const [rows] = await this.pool.query(
      'SELECT * FROM bin_locations WHERE bin_code = ? AND warehouse_id = ? LIMIT 1',
      [binCode, warehouseId]
    );
    return rows[0] || null;
  }

  async getUtilizationStats(warehouseId, tenantId) {
    return this.raw(`
      SELECT 
        COUNT(*) as total_bins,
        SUM(CASE WHEN current_qty > 0 THEN 1 ELSE 0 END) as occupied_bins,
        SUM(CASE WHEN current_qty = 0 THEN 1 ELSE 0 END) as empty_bins,
        SUM(current_qty) as total_items_stored,
        SUM(max_capacity) as total_capacity,
        ROUND(SUM(current_qty) / NULLIF(SUM(max_capacity), 0) * 100, 1) as utilization_percent
      FROM bin_locations
      WHERE warehouse_id = ? AND tenant_id = ? AND is_active = 1
    `, [warehouseId, tenantId]);
  }
}

// ═══════════════════════════════════════════════════════════════
// INVENTORY MODEL
// ═══════════════════════════════════════════════════════════════
class Inventory extends BaseModel {
  constructor() { super('inventory'); }

  async getByProductAndLocation(productId, warehouseId, binId = null, tenantId) {
    const conditions = ['product_id = ?', 'warehouse_id = ?', 'tenant_id = ?'];
    const params = [productId, warehouseId, tenantId];
    if (binId) {
      conditions.push('bin_id = ?');
      params.push(binId);
    } else {
      conditions.push('bin_id IS NULL');
    }
    const [rows] = await this.pool.query(
      `SELECT * FROM inventory WHERE ${conditions.join(' AND ')} LIMIT 1`, params
    );
    return rows[0] || null;
  }

  async getWarehouseSummary(warehouseId, tenantId) {
    return this.raw(`
      SELECT 
        p.id as product_id, p.sku, p.name as product_name,
        p.category_id, pc.name as category_name,
        p.unit_of_measure, p.reorder_point, p.min_stock,
        p.cost_price as unit_cost, p.selling_price,
        SUM(i.quantity) as total_qty,
        SUM(i.reserved_qty) as reserved_qty,
        SUM(i.available_qty) as available_qty,
        SUM(i.damaged_qty) as damaged_qty,
        SUM(i.quantity * i.cost_price) as stock_value,
        MIN(i.expiry_date) as nearest_expiry,
        COUNT(DISTINCT i.bin_id) as bin_count
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      LEFT JOIN product_categories pc ON pc.id = p.category_id
      WHERE i.warehouse_id = ? AND i.tenant_id = ?
      GROUP BY p.id
      ORDER BY p.name
    `, [warehouseId, tenantId]);
  }

  async getLowStockItems(tenantId) {
    return this.raw(`
      SELECT 
        p.id, p.sku, p.name, p.reorder_point, p.min_stock,
        p.unit_of_measure, p.cost_price, p.selling_price,
        pc.name as category_name,
        COALESCE(SUM(i.available_qty), 0) as available_stock,
        GROUP_CONCAT(DISTINCT w.name) as warehouses
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id
      LEFT JOIN warehouses w ON w.id = i.warehouse_id
      LEFT JOIN product_categories pc ON pc.id = p.category_id
      WHERE p.tenant_id = ? AND p.is_active = 1
      GROUP BY p.id
      HAVING available_stock <= p.reorder_point
      ORDER BY available_stock ASC
    `, [tenantId]);
  }

  async getExpiringItems(tenantId, days = 30) {
    return this.raw(`
      SELECT 
        i.*, p.sku, p.name as product_name,
        w.name as warehouse_name,
        bl.bin_code,
        DATEDIFF(i.expiry_date, CURDATE()) as days_until_expiry
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      JOIN warehouses w ON w.id = i.warehouse_id
      LEFT JOIN bin_locations bl ON bl.id = i.bin_id
      WHERE i.tenant_id = ? 
        AND i.expiry_date IS NOT NULL 
        AND i.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND i.quantity > 0
      ORDER BY i.expiry_date ASC
    `, [tenantId, days]);
  }

  async getDashboardStats(tenantId) {
    const [stats] = await this.pool.query(`
      SELECT 
        COUNT(DISTINCT i.product_id) as unique_products,
        COALESCE(SUM(i.quantity), 0) as total_units,
        COALESCE(SUM(i.quantity * i.cost_price), 0) as total_stock_value,
        COALESCE(SUM(i.reserved_qty), 0) as total_reserved,
        COALESCE(SUM(i.damaged_qty), 0) as total_damaged,
        COUNT(DISTINCT i.warehouse_id) as active_warehouses
      FROM inventory i
      WHERE i.tenant_id = ? AND i.quantity > 0
    `, [tenantId]);

    const lowStock = await this.getLowStockItems(tenantId);
    const expiringSoon = await this.getExpiringItems(tenantId, 30);

    return {
      ...stats[0],
      lowStockCount: lowStock.length,
      expiringSoonCount: expiringSoon.length,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// INVENTORY MOVEMENT MODEL
// ═══════════════════════════════════════════════════════════════
class InventoryMovement extends BaseModel {
  constructor() { super('inventory_movements'); }

  async getHistory(productId, tenantId, options = {}) {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await this.pool.query(
      'SELECT COUNT(*) as total FROM inventory_movements WHERE product_id = ? AND tenant_id = ?',
      [productId, tenantId]
    );

    const rows = await this.raw(`
      SELECT m.*,
        p.sku, p.name as product_name,
        fb.bin_code as from_bin_code,
        tb.bin_code as to_bin_code,
        fw.name as from_warehouse_name,
        tw.name as to_warehouse_name
      FROM inventory_movements m
      JOIN products p ON p.id = m.product_id
      LEFT JOIN bin_locations fb ON fb.id = m.from_bin_id
      LEFT JOIN bin_locations tb ON tb.id = m.to_bin_id
      LEFT JOIN warehouses fw ON fw.id = m.from_warehouse_id
      LEFT JOIN warehouses tw ON tw.id = m.to_warehouse_id
      WHERE m.product_id = ? AND m.tenant_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [productId, tenantId, limit, offset]);

    return {
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getRecentActivity(tenantId, limit = 20) {
    return this.raw(`
      SELECT m.*,
        p.sku, p.name as product_name,
        w.name as warehouse_name,
        fb.bin_code as from_bin_code,
        tb.bin_code as to_bin_code
      FROM inventory_movements m
      JOIN products p ON p.id = m.product_id
      LEFT JOIN warehouses w ON w.id = m.warehouse_id
      LEFT JOIN bin_locations fb ON fb.id = m.from_bin_id
      LEFT JOIN bin_locations tb ON tb.id = m.to_bin_id
      WHERE m.tenant_id = ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `, [tenantId, limit]);
  }
}

// ═══════════════════════════════════════════════════════════════
// VENDOR MODEL
// ═══════════════════════════════════════════════════════════════
class Vendor extends BaseModel {
  constructor() { super('vendors'); }

  async listWithStats(tenantId, options = {}) {
    const { page = 1, limit = 20, search = '' } = options;
    const where = ['v.tenant_id = ?'];
    const params = [tenantId];

    if (search) {
      where.push('(v.name LIKE ? OR v.company LIKE ? OR v.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = where.join(' AND ');
    const offset = (page - 1) * limit;

    const [[{ total }]] = await this.pool.query(
      `SELECT COUNT(*) as total FROM vendors v WHERE ${whereClause}`, params
    );

    const [rows] = await this.pool.query(`
      SELECT v.*,
        COUNT(DISTINCT po.id) as total_orders,
        COALESCE(SUM(CASE WHEN po.status = 'received' THEN po.total_amount ELSE 0 END), 0) as total_spent,
        MAX(po.created_at) as last_order_date
      FROM vendors v
      LEFT JOIN purchase_orders po ON po.vendor_id = v.id
      WHERE ${whereClause}
      GROUP BY v.id
      ORDER BY v.name ASC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return {
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// PURCHASE ORDER MODEL
// ═══════════════════════════════════════════════════════════════
class PurchaseOrder extends BaseModel {
  constructor() { super('purchase_orders'); }

  async getWithItems(poId, tenantId) {
    const po = await this.findById(poId, tenantId);
    if (!po) return null;

    const items = await this.raw(`
      SELECT poi.*,
        p.sku, p.name as product_name, p.unit_of_measure,
        p.barcode
      FROM purchase_order_items poi
      JOIN products p ON p.id = poi.product_id
      WHERE poi.po_id = ?
      ORDER BY p.name
    `, [poId]);

    const vendor = await this.raw(
      'SELECT * FROM vendors WHERE id = ? LIMIT 1', [po.vendor_id]
    );

    return { ...po, items, vendor: vendor[0] || null };
  }

  async generatePoNumber(tenantId) {
    const [[{ count }]] = await this.pool.query(
      'SELECT COUNT(*) as count FROM purchase_orders WHERE tenant_id = ?', [tenantId]
    );
    const num = (count + 1).toString().padStart(5, '0');
    return `PO-${num}`;
  }
}

// ═══════════════════════════════════════════════════════════════
// GOODS RECEIPT NOTE MODEL
// ═══════════════════════════════════════════════════════════════
class GoodsReceiptNote extends BaseModel {
  constructor() { super('goods_receipt_notes'); }

  async getWithItems(grnId, tenantId) {
    const grn = await this.findById(grnId, tenantId);
    if (!grn) return null;

    const items = await this.raw(`
      SELECT gi.*,
        p.sku, p.name as product_name, p.unit_of_measure,
        bl.bin_code
      FROM grn_items gi
      JOIN products p ON p.id = gi.product_id
      LEFT JOIN bin_locations bl ON bl.id = gi.bin_id
      WHERE gi.grn_id = ?
    `, [grnId]);

    return { ...grn, items };
  }

  async generateGrnNumber(tenantId) {
    const [[{ count }]] = await this.pool.query(
      'SELECT COUNT(*) as count FROM goods_receipt_notes WHERE tenant_id = ?', [tenantId]
    );
    const num = (count + 1).toString().padStart(5, '0');
    return `GRN-${num}`;
  }
}

// ═══════════════════════════════════════════════════════════════
// SALES ORDER MODEL
// ═══════════════════════════════════════════════════════════════
class SalesOrder extends BaseModel {
  constructor() { super('sales_orders'); }

  async getWithItems(soId, tenantId) {
    const so = await this.findById(soId, tenantId);
    if (!so) return null;

    const items = await this.raw(`
      SELECT soi.*,
        p.sku, p.name as product_name, p.unit_of_measure,
        p.barcode, p.images
      FROM sales_order_items soi
      JOIN products p ON p.id = soi.product_id
      WHERE soi.so_id = ?
    `, [soId]);

    return { ...so, items };
  }

  async generateSoNumber(tenantId) {
    const [[{ count }]] = await this.pool.query(
      'SELECT COUNT(*) as count FROM sales_orders WHERE tenant_id = ?', [tenantId]
    );
    const num = (count + 1).toString().padStart(5, '0');
    return `SO-${num}`;
  }
}

// ═══════════════════════════════════════════════════════════════
// PICK LIST MODEL
// ═══════════════════════════════════════════════════════════════
class PickList extends BaseModel {
  constructor() { super('pick_lists'); }

  async getWithItems(pickId, tenantId) {
    const pick = await this.findById(pickId, tenantId);
    if (!pick) return null;

    const items = await this.raw(`
      SELECT pli.*,
        p.sku, p.name as product_name, p.unit_of_measure,
        bl.bin_code, bl.aisle, bl.rack, bl.shelf,
        z.zone_name
      FROM pick_list_items pli
      JOIN products p ON p.id = pli.product_id
      JOIN bin_locations bl ON bl.id = pli.bin_id
      LEFT JOIN warehouse_zones z ON z.id = bl.zone_id
      WHERE pli.pick_list_id = ?
      ORDER BY bl.aisle, bl.rack, bl.shelf
    `, [pickId]);

    return { ...pick, items };
  }

  async generatePickNumber(tenantId) {
    const [[{ count }]] = await this.pool.query(
      'SELECT COUNT(*) as count FROM pick_lists WHERE tenant_id = ?', [tenantId]
    );
    const num = (count + 1).toString().padStart(5, '0');
    return `PICK-${num}`;
  }
}

module.exports = {
  ProductCategory: new ProductCategory(),
  Product: new Product(),
  WarehouseZone: new WarehouseZone(),
  BinLocation: new BinLocation(),
  Inventory: new Inventory(),
  InventoryMovement: new InventoryMovement(),
  Vendor: new Vendor(),
  PurchaseOrder: new PurchaseOrder(),
  GoodsReceiptNote: new GoodsReceiptNote(),
  SalesOrder: new SalesOrder(),
  PickList: new PickList(),
};
