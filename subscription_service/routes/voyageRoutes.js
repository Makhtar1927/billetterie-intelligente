const express = require('express');
const router = express.Router();
const { scanQRCode, monHistorique, tousVoyages, statsVoyages } = require('../controllers/voyageController');

router.post('/scan', scanQRCode);
router.get('/mon-historique', monHistorique);
router.get('/', tousVoyages);
router.get('/stats', statsVoyages);

module.exports = router;
