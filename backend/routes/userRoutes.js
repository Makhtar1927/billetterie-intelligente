const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getUsers,
  getStats,
  createUser,
  getUser,
  updateUser,
  updateStatus,
  bulkAction,
  activateUser,
  activateBulk,
  importCSV,
  updateProfile,
} = require('../controllers/userController');

// ─── Routes admin uniquement ─────────────────────────────────────────────────
router.use(protect);

// Stats
router.get('/stats', authorize('admin'), getStats);

// Lister / Créer
router.get('/',    authorize('admin'), getUsers);
router.post('/',   authorize('admin'), createUser);

// Import CSV
router.post('/import-csv',   authorize('admin'), importCSV);

// Actions groupées
router.patch('/bulk-action', authorize('admin'), bulkAction);
router.post('/activate-bulk', authorize('admin'), activateBulk);

// Profil de l'utilisateur connecté (multipart/form-data pour la photo)
router.put('/me/profile', upload.single('photo'), updateProfile);

// Un utilisateur spécifique
router.get('/:id',           authorize('admin'), getUser);
router.put('/:id',           authorize('admin'), updateUser);
router.patch('/:id/status',  authorize('admin'), updateStatus);
router.patch('/:id/activate', authorize('admin'), activateUser);

module.exports = router;
