const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  acheterTicket,
  creerTicketAgent,
  mesTickets,
  tousTickets,
  statsTickets,
  changerStatutTicket,
} = require('../controllers/ticketController');

router.use(protect);

// Client
router.post('/',            authorize('client'), acheterTicket);
router.get('/mes-tickets',  mesTickets);

// Agent
router.post('/agent',       authorize('agent'), creerTicketAgent);

// Admin
router.get('/stats',         authorize('admin'), statsTickets);
router.patch('/:id/statut',  authorize('admin'), changerStatutTicket);
router.get('/',              authorize('admin'), tousTickets);

module.exports = router;
