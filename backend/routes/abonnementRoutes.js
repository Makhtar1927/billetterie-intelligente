const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  souscrireAbonnement,
  mesAbonnements,
  tousAbonnements,
  statsAbonnements,
  updateStatutAbonnement,
} = require('../controllers/abonnementController');

router.use(protect);

// Client
router.post('/',                   authorize('client'), souscrireAbonnement);
router.get('/mes-abonnements',     mesAbonnements);

// Admin
router.get('/stats',               authorize('admin'), statsAbonnements);
router.get('/',                    authorize('admin'), tousAbonnements);
router.patch('/:id/statut',        authorize('admin'), updateStatutAbonnement);

module.exports = router;

