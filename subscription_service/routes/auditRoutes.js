const express = require('express');
const router = express.Router();
const { tousAudits, statsAudits } = require('../controllers/auditController');

router.get('/', tousAudits);
router.get('/stats', statsAudits);

module.exports = router;
