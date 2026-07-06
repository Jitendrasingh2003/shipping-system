const express = require('express');
const router = express.Router();
const {
  registerTenant,
  checkSlug,
  getTenantConfig,
  updateTenantSettings,
  getTenantUsage
} = require('../controllers/tenantController');
const { protect, authorize } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenantMiddleware');

// ── Public Routes ──────────────────────────────────────────
// Naya tenant register karo (public — Landing page se)
router.post('/register', registerTenant);

// Slug availability check karo (public — signup form mein live check)
router.get('/check-slug/:slug', checkSlug);

// Tenant ka public branding config (logo, color, name)
router.get('/config', getTenantConfig);

// ── Protected Routes (Admin only) ──────────────────────────
// Tenant settings update karo (branding, SMTP, Razorpay)
router.put('/settings', protect, authorize('admin'), requireTenant, updateTenantSettings);

// Current month ka usage stats dekho
router.get('/usage', protect, requireTenant, getTenantUsage);

module.exports = router;
