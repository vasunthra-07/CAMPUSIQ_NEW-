/**
 * CampusIQ — Campus Brain Routes
 * ==============================
 * Thin routing layer. All logic lives in controllers/campusBrain.controller.js.
 *
 * Mounted at /api/brain in server.js:
 *   POST /api/brain/summary   → AI-narrated executive summary
 *   POST /api/brain/ask       → grounded natural-language Q&A
 *   GET  /api/brain/health    → which AI provider is configured
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { summary, ask, providerHealth } = require('../controllers/campusBrain.controller');

router.post('/summary', verifyToken, summary);
router.post('/ask', verifyToken, ask);
router.get('/health', verifyToken, providerHealth);

module.exports = router;
