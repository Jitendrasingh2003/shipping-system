const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getMySQLPool } = require('../config/db.mysql');

// ============================================================
// TENANT REGISTRATION
// ============================================================
const registerTenant = async (req, res, next) => {
  const { companyName, slug, ownerName, ownerEmail, ownerPassword, ownerPhone = '' } = req.body;

  try {
    if (!companyName || !slug || !ownerName || !ownerEmail || !ownerPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Slug validation: only lowercase letters, numbers, hyphens
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({
        success: false,
        message: 'Slug can only contain lowercase letters, numbers, and hyphens.'
      });
    }

    const pool = getMySQLPool();

    // Check slug availability
    const [slugExists] = await pool.query('SELECT id FROM tenants WHERE slug = ?', [slug]);
    if (slugExists.length > 0) {
      return res.status(400).json({ success: false, message: 'This company subdomain is already taken. Try another.' });
    }

    // Check email not already a tenant owner
    const [emailExists] = await pool.query('SELECT id FROM tenants WHERE owner_email = ?', [ownerEmail.toLowerCase()]);
    if (emailExists.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const tenantId = uuidv4();
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days trial

    // Create tenant
    await pool.query(
      `INSERT INTO tenants 
       (id, name, slug, owner_email, plan, plan_status, trial_ends_at, is_active, created_at)
       VALUES (?, ?, ?, ?, 'trial', 'active', ?, 1, NOW())`,
      [tenantId, companyName, slug.toLowerCase(), ownerEmail.toLowerCase(), trialEndsAt]
    );

    // Create admin user for this tenant
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ownerPassword, salt);
    const adminUserId = uuidv4();

    await pool.query(
      `INSERT INTO users (id, name, email, password, role, phone, tenant_id)
       VALUES (?, ?, ?, ?, 'admin', ?, ?)`,
      [adminUserId, ownerName, ownerEmail.toLowerCase(), hashedPassword, ownerPhone, tenantId]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: adminUserId, role: 'admin', tenantId },
      process.env.JWT_SECRET || 'smartship_jwt_super_secret_signing_key_2026',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: `Welcome to SmartShip! Your company portal is ready at: ${slug}.smartship.io`,
      token,
      tenant: { id: tenantId, name: companyName, slug, plan: 'trial', trialEndsAt },
      user: { id: adminUserId, name: ownerName, email: ownerEmail.toLowerCase(), role: 'admin' }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CHECK SLUG AVAILABILITY
// ============================================================
const checkSlug = async (req, res, next) => {
  const { slug } = req.params;
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT id FROM tenants WHERE slug = ?', [slug.toLowerCase()]);
    res.json({ success: true, available: rows.length === 0 });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET TENANT PUBLIC CONFIG (for frontend branding)
// ============================================================
const getTenantConfig = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found.' });
    }
    res.json({
      success: true,
      config: {
        name: req.tenant.name,
        slug: req.tenant.slug,
        logo: req.tenant.logo_url,
        primaryColor: req.tenant.primary_color || '#6366f1',
        plan: req.tenant.plan
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE TENANT SETTINGS (Admin only)
// ============================================================
const updateTenantSettings = async (req, res, next) => {
  const { companyName, logoUrl, primaryColor, smtpHost, smtpPort, smtpUser, smtpPass, razorpayKeyId, razorpayKeySecret } = req.body;
  try {
    const pool = getMySQLPool();
    const tenantId = req.tenant.id;

    const updates = [];
    const values = [];

    if (companyName) { updates.push('name = ?'); values.push(companyName); }
    if (logoUrl !== undefined) { updates.push('logo_url = ?'); values.push(logoUrl); }
    if (primaryColor) { updates.push('primary_color = ?'); values.push(primaryColor); }
    if (smtpHost) { updates.push('smtp_host = ?'); values.push(smtpHost); }
    if (smtpPort) { updates.push('smtp_port = ?'); values.push(smtpPort); }
    if (smtpUser) { updates.push('smtp_user = ?'); values.push(smtpUser); }
    if (smtpPass) { updates.push('smtp_pass = ?'); values.push(smtpPass); }
    if (razorpayKeyId) { updates.push('razorpay_key_id = ?'); values.push(razorpayKeyId); }
    if (razorpayKeySecret) { updates.push('razorpay_key_secret = ?'); values.push(razorpayKeySecret); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(tenantId);
    await pool.query(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query(
      'SELECT id, name, slug, logo_url, primary_color, plan, plan_status FROM tenants WHERE id = ?',
      [tenantId]
    );

    res.json({ success: true, message: 'Settings updated successfully.', tenant: updated[0] });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET TENANT USAGE STATS
// ============================================================
const getTenantUsage = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    const tenantId = req.tenant.id;

    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const [shipmentCount] = await pool.query(
      'SELECT COUNT(*) as count FROM shipments WHERE tenant_id = ? AND created_at >= ?',
      [tenantId, firstOfMonth]
    );

    const [userCount] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND role != 'admin'",
      [tenantId]
    );

    res.json({
      success: true,
      usage: {
        shipmentsThisMonth: shipmentCount[0].count,
        maxShipments: req.tenant.max_shipments_per_month,
        users: userCount[0].count,
        maxUsers: req.tenant.max_users,
        plan: req.tenant.plan,
        planStatus: req.tenant.plan_status
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerTenant,
  checkSlug,
  getTenantConfig,
  updateTenantSettings,
  getTenantUsage
};
