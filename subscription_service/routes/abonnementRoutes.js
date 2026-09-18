const express = require('express');
const router = express.Router();
const { souscrireAbonnement, mesAbonnements, tousAbonnements, statsAbonnements, updateStatutAbonnement } = require('../controllers/abonnementController');

router.post('/', souscrireAbonnement);
router.get('/mes-abonnements', mesAbonnements);
router.get('/stats', statsAbonnements);
router.get('/', tousAbonnements);
router.patch('/:id/statut', updateStatutAbonnement);

module.exports = router;

