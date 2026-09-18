const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const {
  scanQRCode,
  monHistorique,
  tousVoyages,
  statsVoyages,
} = require('../controllers/voyageController');

router.use(protect);

// Agent — scanner (avec limitation anti-abus / anti-flood)
const scanLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Trop de scans consécutifs détectés. Veuillez patienter quelques secondes avant de scanner à nouveau.',
});
router.post('/scan', authorize('agent'), scanLimiter, scanQRCode);

// Client — son historique
router.get('/mon-historique', monHistorique);

// Admin — tous les voyages
router.get('/stats', authorize('admin'), statsVoyages);
router.get('/',      authorize('admin'), tousVoyages);

module.exports = router;
