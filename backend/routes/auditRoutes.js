const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { tousAudits, statsAudits } = require('../controllers/auditController');

router.use(protect);
router.use(authorize('admin'));

router.get('/', tousAudits);
router.get('/stats', statsAudits);

module.exports = router;
