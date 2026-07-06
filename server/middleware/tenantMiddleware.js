const { getMySQLPool } = require('../config/db.mysql');

/**
 * Tenant Resolver Middleware
 * 
 * Tenant ko 3 tarike se identify karta hai (priority order):
 * 1. x-tenant-slug header (development/testing ke liye)
 * 2. Subdomain from Host header (e.g., dtdc.smartship.io → "dtdc")
 * 3. Default tenant (agar koi tenant nahi mila toh "default" use karo)
 */
const resolveTenant = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    if (!pool) return next(); // DB not ready yet

    let slug = null;

    // Method 1: Custom header (for local dev / API testing)
    if (req.headers['x-tenant-slug']) {
      slug = req.headers['x-tenant-slug'].toLowerCase().trim();
    }

    // Method 2: Subdomain extraction
    if (!slug) {
      const host = req.headers.host || '';
      const parts = host.split('.');
      // e.g., dtdc.smartship.io → parts = ['dtdc', 'smartship', 'io']
      // Ignore 'www', 'localhost', and single-part hosts
      if (parts.length >= 3 && parts[0] !== 'www') {
        slug = parts[0].toLowerCase();
      }
    }

    if (slug && slug !== 'localhost') {
      const [rows] = await pool.query(
        'SELECT id, name, slug, plan, plan_status, primary_color, logo_url, max_users, max_shipments_per_month, trial_ends_at FROM tenants WHERE slug = ? AND is_active = 1',
        [slug]
      );

      if (rows.length > 0) {
        const tenant = rows[0];

        // Check agar plan suspended hai
        if (tenant.plan_status === 'suspended') {
          return res.status(403).json({
            success: false,
            message: 'Tenant account is suspended. Please contact support or renew your subscription.',
            code: 'TENANT_SUSPENDED'
          });
        }

        // Check trial expiry
        if (tenant.plan === 'trial' && tenant.trial_ends_at) {
          const trialEnd = new Date(tenant.trial_ends_at);
          if (new Date() > trialEnd) {
            await pool.query(
              "UPDATE tenants SET plan_status = 'trial_expired' WHERE id = ?",
              [tenant.id]
            );
            return res.status(403).json({
              success: false,
              message: 'Your free trial has expired. Please upgrade to continue.',
              code: 'TRIAL_EXPIRED'
            });
          }
        }

        req.tenant = tenant;
        return next();
      }
    }

    // Method 3: Fallback — default tenant (localhost development)
    const [defaultRows] = await pool.query(
      "SELECT id, name, slug, plan, plan_status, primary_color, logo_url, max_users, max_shipments_per_month FROM tenants WHERE slug = 'default' LIMIT 1"
    );

    if (defaultRows.length > 0) {
      req.tenant = defaultRows[0];
    } else {
      // Koi tenant nahi mila — public route allow karo
      req.tenant = null;
    }

    next();
  } catch (err) {
    console.error('Tenant middleware error:', err.message);
    next(); // Don't block request on tenant error
  }
};

/**
 * Require Tenant Middleware
 * Use this on routes that MUST have a tenant context
 */
const requireTenant = (req, res, next) => {
  if (!req.tenant) {
    return res.status(400).json({
      success: false,
      message: 'No tenant context found. Please access via your company subdomain.',
      code: 'NO_TENANT'
    });
  }
  next();
};

module.exports = { resolveTenant, requireTenant };
