const express = require('express');
const router = express.Router();
const { acheterTicket, creerTicketAgent, mesTickets, tousTickets, statsTickets, changerStatutTicket } = require('../controllers/ticketController');

router.post('/', acheterTicket);
router.post('/agent', creerTicketAgent);
router.patch('/:id/statut', changerStatutTicket);
router.get('/mes-tickets', mesTickets);
router.get('/', tousTickets);
router.get('/stats', statsTickets);

module.exports = router;
