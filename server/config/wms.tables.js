/**
 * WMS (Warehouse Management System) — Database Table Definitions
 * Phase 1: Products, Zones, Bins, Inventory, Movements, GRN, Pick Lists
 */

const initWMSTables = async (connection) => {
  console.log('\n🏭 WMS Module: Initializing tables...');

  // ── PRODUCT CATEGORIES ─────────────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS product_categories (
      id VARCHAR(36) PRIMARY KEY,
      tenant_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      parent_id VARCHAR(36) DEFAULT NULL,
      icon VARCHAR(100) DEFAULT 'package',
      color VARCHAR(20) DEFAULT '#6366f1',
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tenant (tenant_id),
      INDEX idx_parent (parent_id)
    )
  `);
  console.log('  ✅ product_categories');

  // ── PRODUCTS / SKUs ────────────────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY,
      tenant_id VARCHAR(36) NOT NULL,
      sku VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      category_id VARCHAR(36) DEFAULT NULL,
      unit_of_measure VARCHAR(50) DEFAULT 'pcs',
      weight DOUBLE DEFAULT 0,
      dim_length DOUBLE DEFAULT 0,
      dim_width DOUBLE DEFAULT 0,
      dim_height DOUBLE DEFAULT 0,
      min_stock INT DEFAULT 0,
      max_stock INT DEFAULT 0,
      reorder_point INT DEFAULT 10,
      cost_price DECIMAL(12, 2) DEFAULT 0.00,
      selling_price DECIMAL(12, 2) DEFAULT 0.00,
      mrp DECIMAL(12, 2) DEFAULT 0.00,
      tax_rate DECIMAL(5, 2) DEFAULT 18.00,
      hsn_code VARCHAR(20) DEFAULT NULL,
      barcode VARCHAR(100) DEFAULT NULL,
      images JSON DEFAULT NULL,
      tags JSON DEFAULT NULL,
      attributes JSON DEFAULT NULL,
      is_serialized TINYINT(1) DEFAULT 0,
      is_batch_tracked TINYINT(1) DEFAULT 0,
      is_perishable TINYINT(1) DEFAULT 0,
      shelf_life_days INT DEFAULT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_tenant_sku (tenant_id, sku),
      INDEX idx_tenant (tenant_id),
      INDEX idx_category (category_id),
      INDEX idx_barcode (barcode)
    )
  `);
  console.log('  ✅ products');

  // ── WAREHOUSE ZONES ────────────────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS warehouse_zones (
      id VARCHAR(36) PRIMARY KEY,
      warehouse_id VARCHAR(36) NOT NULL,
      tenant_id VARCHAR(36) NOT NULL,
      zone_name VARCHAR(100) NOT NULL,
      zone_code VARCHAR(20) NOT NULL,
      zone_type ENUM('storage', 'receiving', 'shipping', 'staging', 'returns', 'cold_storage', 'hazardous', 'bulk') DEFAULT 'storage',
      temperature_min DOUBLE DEFAULT NULL,
      temperature_max DOUBLE DEFAULT NULL,
      description TEXT DEFAULT NULL,
      color VARCHAR(20) DEFAULT '#3b82f6',
      sort_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_warehouse_code (warehouse_id, zone_code),
      INDEX idx_tenant (tenant_id),
      INDEX idx_warehouse (warehouse_id)
    )
  `);
  console.log('  ✅ warehouse_zones');

  // ── BIN LOCATIONS ──────────────────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS bin_locations (
      id VARCHAR(36) PRIMARY KEY,
      zone_id VARCHAR(36) NOT NULL,
      warehouse_id VARCHAR(36) NOT NULL,
      tenant_id VARCHAR(36) NOT NULL,
      bin_code VARCHAR(50) NOT NULL,
      aisle VARCHAR(10) DEFAULT NULL,
      rack VARCHAR(10) DEFAULT NULL,
      shelf VARCHAR(10) DEFAULT NULL,
      position VARCHAR(10) DEFAULT NULL,
      bin_type ENUM('standard', 'bulk', 'pallet', 'cold', 'hazmat', 'returns') DEFAULT 'standard',
      max_capacity DOUBLE DEFAULT 100,
      max_weight DOUBLE DEFAULT 500,
      current_qty DOUBLE DEFAULT 0,
      current_weight DOUBLE DEFAULT 0,
      is_pickable TINYINT(1) DEFAULT 1,
      is_receivable TINYINT(1) DEFAULT 1,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_warehouse_bin (warehouse_id, bin_code),
      INDEX idx_tenant (tenant_id),
      INDEX idx_zone (zone_id),
      INDEX idx_warehouse (warehouse_id)
    )
  `);
  console.log('  ✅ bin_locations');

  // ── INVENTORY (Stock per Location) ─────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS inventory (
      id VARCHAR(36) PRIMARY KEY,
      product_id VARCHAR(36) NOT NULL,
      warehouse_id VARCHAR(36) NOT NULL,
      zone_id VARCHAR(36) DEFAULT NULL,
      bin_id VARCHAR(36) DEFAULT NULL,
      tenant_id VARCHAR(36) NOT NULL,
      quantity DOUBLE DEFAULT 0,
      reserved_qty DOUBLE DEFAULT 0,
      damaged_qty DOUBLE DEFAULT 0,
      available_qty DOUBLE GENERATED ALWAYS AS (quantity - reserved_qty - damaged_qty) STORED,
      batch_number VARCHAR(100) DEFAULT NULL,
      lot_number VARCHAR(100) DEFAULT NULL,
      serial_number VARCHAR(100) DEFAULT NULL,
      expiry_date DATE DEFAULT NULL,
      manufacturing_date DATE DEFAULT NULL,
      cost_price DECIMAL(12, 2) DEFAULT 0.00,
      last_counted_at TIMESTAMP DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tenant (tenant_id),
      INDEX idx_product (product_id),
      INDEX idx_warehouse (warehouse_id),
      INDEX idx_bin (bin_id),
      INDEX idx_batch (batch_number),
      INDEX idx_expiry (expiry_date)
    )
  `);
  console.log('  ✅ inventory');

  // ── INVENTORY MOVEMENTS (Full Audit Trail) ─────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id VARCHAR(36) PRIMARY KEY,
      product_id VARCHAR(36) NOT NULL,
      warehouse_id VARCHAR(36) NOT NULL,
      tenant_id VARCHAR(36) NOT NULL,
      from_bin_id VARCHAR(36) DEFAULT NULL,
      to_bin_id VARCHAR(36) DEFAULT NULL,
      from_warehouse_id VARCHAR(36) DEFAULT NULL,
      to_warehouse_id VARCHAR(36) DEFAULT NULL,
      quantity DOUBLE NOT NULL,
      movement_type ENUM(
        'receive', 'putaway', 'pick', 'pack', 'ship',
        'transfer', 'adjustment_in', 'adjustment_out',
        'return_in', 'return_out', 'damage', 'cycle_count',
        'scrap', 'production_in', 'production_out'
      ) NOT NULL,
      reference_id VARCHAR(36) DEFAULT NULL,
      reference_type VARCHAR(50) DEFAULT NULL,
      reference_number VARCHAR(100) DEFAULT NULL,
      batch_number VARCHAR(100) DEFAULT NULL,
      serial_number VARCHAR(100) DEFAULT NULL,
      cost_price DECIMAL(12, 2) DEFAULT 0.00,
      reason VARCHAR(255) DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      performed_by VARCHAR(36) NOT NULL,
      performed_by_name VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tenant (tenant_id),
      INDEX idx_product (product_id),
      INDEX idx_warehouse (warehouse_id),
      INDEX idx_type (movement_type),
      INDEX idx_reference (reference_id, reference_type),
      INDEX idx_date (created_at)
    )
  `);
  console.log('  ✅ inventory_movements');

  // ── VENDORS / SUPPLIERS ────────────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      id VARCHAR(36) PRIMARY KEY,
      tenant_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      company VARCHAR(255) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      phone VARCHAR(50) DEFAULT NULL,
      address TEXT DEFAULT NULL,
      city VARCHAR(100) DEFAULT NULL,
      state VARCHAR(100) DEFAULT NULL,
      pincode VARCHAR(20) DEFAULT NULL,
      country VARCHAR(100) DEFAULT 'India',
      gst_number VARCHAR(20) DEFAULT NULL,
      pan_number VARCHAR(20) DEFAULT NULL,
      payment_terms INT DEFAULT 30,
      bank_details JSON DEFAULT NULL,
      rating DECIMAL(3, 1) DEFAULT 0.0,
      total_orders INT DEFAULT 0,
      notes TEXT DEFAULT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tenant (tenant_id)
    )
  `);
  console.log('  ✅ vendors');

  // ── PURCHASE ORDERS ────────────────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id VARCHAR(36) PRIMARY KEY,
      tenant_id VARCHAR(36) NOT NULL,
      po_number VARCHAR(50) NOT NULL,
      vendor_id VARCHAR(36) NOT NULL,
      warehouse_id VARCHAR(36) NOT NULL,
      status ENUM('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled') DEFAULT 'draft',
      subtotal DECIMAL(14, 2) DEFAULT 0.00,
      tax_amount DECIMAL(14, 2) DEFAULT 0.00,
      discount_amount DECIMAL(14, 2) DEFAULT 0.00,
      shipping_cost DECIMAL(14, 2) DEFAULT 0.00,
      total_amount DECIMAL(14, 2) DEFAULT 0.00,
      currency VARCHAR(10) DEFAULT 'INR',
      payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
      expected_date DATE DEFAULT NULL,
      received_date DATE DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      terms TEXT DEFAULT NULL,
      approved_by VARCHAR(36) DEFAULT NULL,
      approved_at TIMESTAMP DEFAULT NULL,
      created_by VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_tenant_po (tenant_id, po_number),
      INDEX idx_tenant (tenant_id),
      INDEX idx_vendor (vendor_id),
      INDEX idx_status (status)
    )
  `);
  console.log('  ✅ purchase_orders');

  // ── PURCHASE ORDER ITEMS ───────────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id VARCHAR(36) PRIMARY KEY,
      po_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(36) NOT NULL,
      tenant_id VARCHAR(36) NOT NULL,
      quantity DOUBLE NOT NULL,
      received_qty DOUBLE DEFAULT 0,
      rejected_qty DOUBLE DEFAULT 0,
      unit_price DECIMAL(12, 2) NOT NULL,
      tax_rate DECIMAL(5, 2) DEFAULT 18.00,
      tax_amount DECIMAL(12, 2) DEFAULT 0.00,
      discount_percent DECIMAL(5, 2) DEFAULT 0.00,
      total DECIMAL(14, 2) DEFAULT 0.00,
      notes TEXT DEFAULT NULL,
      INDEX idx_po (po_id),
      INDEX idx_product (product_id)
    )
  `);
  console.log('  ✅ purchase_order_items');

  // ── GOODS RECEIPT NOTES (GRN) ──────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS goods_receipt_notes (
      id VARCHAR(36) PRIMARY KEY,
      tenant_id VARCHAR(36) NOT NULL,
      grn_number VARCHAR(50) NOT NULL,
      po_id VARCHAR(36) DEFAULT NULL,
      vendor_id VARCHAR(36) DEFAULT NULL,
      warehouse_id VARCHAR(36) NOT NULL,
      status ENUM('draft', 'inspecting', 'completed', 'cancelled') DEFAULT 'draft',
      total_items INT DEFAULT 0,
      total_received INT DEFAULT 0,
      total_rejected INT DEFAULT 0,
      notes TEXT DEFAULT NULL,
      received_by VARCHAR(36) NOT NULL,
      received_by_name VARCHAR(255) DEFAULT NULL,
      inspected_by VARCHAR(36) DEFAULT NULL,
      completed_at TIMESTAMP DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_tenant_grn (tenant_id, grn_number),
      INDEX idx_tenant (tenant_id),
      INDEX idx_po (po_id)
    )
  `);
  console.log('  ✅ goods_receipt_notes');

  // ── GRN ITEMS ──────────────────────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS grn_items (
      id VARCHAR(36) PRIMARY KEY,
      grn_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(36) NOT NULL,
      tenant_id VARCHAR(36) NOT NULL,
      expected_qty DOUBLE DEFAULT 0,
      received_qty DOUBLE DEFAULT 0,
      rejected_qty DOUBLE DEFAULT 0,
      accepted_qty DOUBLE GENERATED ALWAYS AS (received_qty - rejected_qty) STORED,
      bin_id VARCHAR(36) DEFAULT NULL,
      batch_number VARCHAR(100) DEFAULT NULL,
      serial_numbers JSON DEFAULT NULL,
      expiry_date DATE DEFAULT NULL,
      quality_status ENUM('pending', 'passed', 'failed', 'partial') DEFAULT 'pending',
      quality_notes TEXT DEFAULT NULL,
      unit_cost DECIMAL(12, 2) DEFAULT 0.00,
      INDEX idx_grn (grn_id),
      INDEX idx_product (product_id)
    )
  `);
  console.log('  ✅ grn_items');

  // ── PICK LISTS ─────────────────────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS pick_lists (
      id VARCHAR(36) PRIMARY KEY,
      tenant_id VARCHAR(36) NOT NULL,
      pick_number VARCHAR(50) NOT NULL,
      warehouse_id VARCHAR(36) NOT NULL,
      shipment_id VARCHAR(36) DEFAULT NULL,
      sales_order_id VARCHAR(36) DEFAULT NULL,
      pick_type ENUM('single', 'batch', 'wave', 'zone') DEFAULT 'single',
      status ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
      priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
      total_items INT DEFAULT 0,
      picked_items INT DEFAULT 0,
      assigned_to VARCHAR(36) DEFAULT NULL,
      assigned_to_name VARCHAR(255) DEFAULT NULL,
      started_at TIMESTAMP DEFAULT NULL,
      completed_at TIMESTAMP DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_by VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_tenant_pick (tenant_id, pick_number),
      INDEX idx_tenant (tenant_id),
      INDEX idx_status (status),
      INDEX idx_assigned (assigned_to)
    )
  `);
  console.log('  ✅ pick_lists');

  // ── PICK LIST ITEMS ────────────────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS pick_list_items (
      id VARCHAR(36) PRIMARY KEY,
      pick_list_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(36) NOT NULL,
      tenant_id VARCHAR(36) NOT NULL,
      bin_id VARCHAR(36) NOT NULL,
      quantity DOUBLE NOT NULL,
      picked_qty DOUBLE DEFAULT 0,
      status ENUM('pending', 'picked', 'short', 'skipped') DEFAULT 'pending',
      picked_at TIMESTAMP DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      INDEX idx_pick (pick_list_id),
      INDEX idx_product (product_id),
      INDEX idx_bin (bin_id)
    )
  `);
  console.log('  ✅ pick_list_items');

  // ── STOCK ADJUSTMENTS ──────────────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS stock_adjustments (
      id VARCHAR(36) PRIMARY KEY,
      tenant_id VARCHAR(36) NOT NULL,
      adjustment_number VARCHAR(50) NOT NULL,
      warehouse_id VARCHAR(36) NOT NULL,
      adjustment_type ENUM('cycle_count', 'damage', 'correction', 'write_off', 'found', 'other') NOT NULL,
      status ENUM('draft', 'approved', 'completed', 'rejected') DEFAULT 'draft',
      total_items INT DEFAULT 0,
      reason TEXT DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      approved_by VARCHAR(36) DEFAULT NULL,
      approved_at TIMESTAMP DEFAULT NULL,
      created_by VARCHAR(36) NOT NULL,
      created_by_name VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_tenant_adj (tenant_id, adjustment_number),
      INDEX idx_tenant (tenant_id)
    )
  `);
  console.log('  ✅ stock_adjustments');

  // ── STOCK ADJUSTMENT ITEMS ─────────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS stock_adjustment_items (
      id VARCHAR(36) PRIMARY KEY,
      adjustment_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(36) NOT NULL,
      bin_id VARCHAR(36) DEFAULT NULL,
      tenant_id VARCHAR(36) NOT NULL,
      system_qty DOUBLE DEFAULT 0,
      actual_qty DOUBLE DEFAULT 0,
      variance DOUBLE GENERATED ALWAYS AS (actual_qty - system_qty) STORED,
      reason VARCHAR(255) DEFAULT NULL,
      INDEX idx_adjustment (adjustment_id),
      INDEX idx_product (product_id)
    )
  `);
  console.log('  ✅ stock_adjustment_items');

  // ── SALES ORDERS ───────────────────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS sales_orders (
      id VARCHAR(36) PRIMARY KEY,
      tenant_id VARCHAR(36) NOT NULL,
      so_number VARCHAR(50) NOT NULL,
      customer_id VARCHAR(36) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      warehouse_id VARCHAR(36) DEFAULT NULL,
      status ENUM('draft', 'confirmed', 'processing', 'picking', 'packing', 'shipped', 'delivered', 'cancelled', 'returned') DEFAULT 'draft',
      subtotal DECIMAL(14, 2) DEFAULT 0.00,
      tax_amount DECIMAL(14, 2) DEFAULT 0.00,
      discount_amount DECIMAL(14, 2) DEFAULT 0.00,
      shipping_cost DECIMAL(14, 2) DEFAULT 0.00,
      total_amount DECIMAL(14, 2) DEFAULT 0.00,
      currency VARCHAR(10) DEFAULT 'INR',
      payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') DEFAULT 'unpaid',
      payment_method VARCHAR(50) DEFAULT NULL,
      shipping_address TEXT DEFAULT NULL,
      shipping_city VARCHAR(100) DEFAULT NULL,
      shipping_pincode VARCHAR(20) DEFAULT NULL,
      shipping_phone VARCHAR(50) DEFAULT NULL,
      shipment_id VARCHAR(36) DEFAULT NULL,
      expected_delivery DATE DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_by VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_tenant_so (tenant_id, so_number),
      INDEX idx_tenant (tenant_id),
      INDEX idx_customer (customer_id),
      INDEX idx_status (status)
    )
  `);
  console.log('  ✅ sales_orders');

  // ── SALES ORDER ITEMS ──────────────────────────────────────
  await connection.query(`
    CREATE TABLE IF NOT EXISTS sales_order_items (
      id VARCHAR(36) PRIMARY KEY,
      so_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(36) NOT NULL,
      tenant_id VARCHAR(36) NOT NULL,
      sku VARCHAR(100) DEFAULT NULL,
      product_name VARCHAR(255) DEFAULT NULL,
      quantity DOUBLE NOT NULL,
      fulfilled_qty DOUBLE DEFAULT 0,
      unit_price DECIMAL(12, 2) NOT NULL,
      discount_percent DECIMAL(5, 2) DEFAULT 0.00,
      tax_rate DECIMAL(5, 2) DEFAULT 18.00,
      tax_amount DECIMAL(12, 2) DEFAULT 0.00,
      total DECIMAL(14, 2) DEFAULT 0.00,
      INDEX idx_so (so_id),
      INDEX idx_product (product_id)
    )
  `);
  console.log('  ✅ sales_order_items');

  console.log('🏭 WMS Module: All tables created successfully!\n');
};

module.exports = { initWMSTables };
