/**
 * ============================================================
 * TESTS COMPLETS — Service Utilisateurs (Supertest + Jest)
 * ============================================================
 * Supertest : bibliothèque qui permet de simuler des requêtes
 * HTTP (POST, GET, PATCH, DELETE) directement sur l'app Express
 * sans démarrer un vrai serveur réseau.
 *
 * Différence test de fonction vs test de route :
 *   - Test de fonction : on appelle directement une fonction JS
 *     et on vérifie ce qu'elle retourne (logique pure).
 *   - Test de route API : on envoie une vraie requête HTTP à
 *     l'app et on vérifie le code HTTP + le JSON retourné.
 * ============================================================
 */

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../server');

// ── Mocks ────────────────────────────────────────────────────
jest.mock('../models/User');
jest.mock('../config/db', () => jest.fn());
jest.mock('../services/emailService', () => ({
  sendActivationEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail:    jest.fn().mockResolvedValue(true),
}));

const User = require('../models/User');

// ── Helpers : fabrication de tokens ──────────────────────────
let adminToken;
let agentToken;
let clientToken;
let expiredToken;

beforeAll(() => {
  process.env.JWT_SECRET = 'testsecret';

  // Token admin valide
  adminToken  = jwt.sign({ id: 'adminId'  }, 'testsecret', { expiresIn: '1h' });
  // Token agent valide
  agentToken  = jwt.sign({ id: 'agentId'  }, 'testsecret', { expiresIn: '1h' });
  // Token client valide
  clientToken = jwt.sign({ id: 'clientId' }, 'testsecret', { expiresIn: '1h' });
  // Token expiré (invalide)
  expiredToken = jwt.sign({ id: 'anyId' }, 'testsecret', { expiresIn: '-1s' });
});

// Réinitialiser les mocks avant chaque test
beforeEach(() => {
  jest.clearAllMocks();
});

// ── Helper : configurer l'utilisateur retourné par le middleware ──
const mockAuthUser = (role = 'admin', statut = 'actif') => {
  User.findById.mockResolvedValue({ _id: `${role}Id`, role, statut });
};

// ─────────────────────────────────────────────────────────────────
// 1. TESTS UNITAIRES — logique pure (sans HTTP)
// ─────────────────────────────────────────────────────────────────
describe('1. Tests Unitaires', () => {

  /**
   * Qu'est-ce qu'un test unitaire ?
   * → On isole une petite fonction et on vérifie son comportement
   *   sans dépendance externe (pas de BDD, pas de HTTP).
   */

  it('génère un mot de passe temporaire de 8 caractères', () => {
    const generateTempPassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
      let pwd = '';
      for (let i = 0; i < 8; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
      return pwd;
    };

    const pwd = generateTempPassword();
    expect(typeof pwd).toBe('string');         // doit être une chaîne
    expect(pwd.length).toBe(8);                // doit faire exactement 8 chars
  });

  it('génère des mots de passe différents à chaque appel', () => {
    const generateTempPassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
      let pwd = '';
      for (let i = 0; i < 8; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
      return pwd;
    };
    expect(generateTempPassword()).not.toBe(generateTempPassword());
  });
});

// ─────────────────────────────────────────────────────────────────
// 2. AUTHENTIFICATION — codes 401 et 403
// ─────────────────────────────────────────────────────────────────
describe('2. Authentification — routes protégées', () => {

  /**
   * Comment tester une erreur 401 ?
   * → Envoyer la requête SANS token dans l'en-tête Authorization.
   * → L'app doit répondre 401 Unauthorized.
   *
   * Comment envoyer un token JWT dans un test ?
   * → .set('Authorization', `Bearer ${token}`)
   */

  it('401 — accès refusé sans token JWT', async () => {
    const res = await request(app).get('/api/users');
    // Pas de .set('Authorization') → le middleware rejette la requête
    expect(res.statusCode).toBe(401);
  });

  it('401 — accès refusé avec un token expiré', async () => {
    mockAuthUser('admin');
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.statusCode).toBe(401);
  });

  it('401 — token malformé (chaîne aléatoire)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer ceci_nest_pas_un_token');
    expect(res.statusCode).toBe(401);
  });

  /**
   * Comment tester une erreur 403 ?
   * → Envoyer la requête avec un token valide MAIS d'un rôle
   *   qui n'a pas les droits sur cette route.
   * → L'app doit répondre 403 Forbidden.
   */

  it('403 — un agent ne peut pas accéder à GET /api/users', async () => {
    mockAuthUser('agent');
    const mockFind = {
      select: jest.fn().mockReturnThis(),
      sort:   jest.fn().mockReturnThis(),
      skip:   jest.fn().mockReturnThis(),
      limit:  jest.fn().mockResolvedValue([]),
    };
    User.find = jest.fn().mockReturnValue(mockFind);
    User.countDocuments = jest.fn().mockResolvedValue(0);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('403 — un client ne peut pas accéder à GET /api/users', async () => {
    mockAuthUser('client');
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────
// 3. ROUTE POST — Créer un utilisateur
// ─────────────────────────────────────────────────────────────────
describe('3. POST /api/users — Créer un utilisateur', () => {

  /**
   * Comment tester une route POST ?
   * → request(app).post('/chemin').send({ ... })
   * → On vérifie le statusCode (201 pour création) et le body JSON.
   *
   * Comment tester qu'un admin peut créer un utilisateur ?
   * → On mocke User.findById pour retourner un admin,
   *   puis on envoie la requête avec le token admin.
   */

  it('201 — un admin peut créer un agent avec succès', async () => {
    mockAuthUser('admin');
    User.findOne = jest.fn().mockResolvedValue(null); // pas de doublon
    User.generateTempPassword = jest.fn().mockReturnValue('Temp1234');
    User.create = jest.fn().mockResolvedValue({
      _id: 'newId', nom: 'Diallo', prenom: 'Ibra',
      email: 'ibra@test.com', role: 'agent', statut: 'inactif',
      toObject: () => ({ _id: 'newId', nom: 'Diallo', prenom: 'Ibra',
        email: 'ibra@test.com', role: 'agent', statut: 'inactif' }),
    });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nom: 'Diallo', prenom: 'Ibra', email: 'ibra@test.com', role: 'agent' });

    // Comment vérifier un code HTTP dans un test API ?
    expect(res.statusCode).toBe(201);

    // Comment vérifier le contenu de la réponse JSON ?
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('ibra@test.com');
    expect(res.body.data.statut).toBe('inactif');
    // Le mot de passe ne doit jamais être retourné
    expect(res.body.data.motDePasse).toBeUndefined();
  });

  /**
   * Comment tester une erreur 400 ?
   * → Envoyer des données incomplètes ou invalides.
   * → L'app doit répondre 400 Bad Request.
   */

  it('400 — champ "role" manquant', async () => {
    mockAuthUser('admin');
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nom: 'Test', prenom: 'User', email: 'test@test.com' }); // role manquant

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeTruthy(); // message d'erreur présent
  });

  it('400 — champ "email" manquant', async () => {
    mockAuthUser('admin');
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nom: 'Test', prenom: 'User', role: 'agent' }); // email manquant

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('409 — email déjà utilisé (doublon)', async () => {
    mockAuthUser('admin');
    // findOne retourne un utilisateur existant → doublon détecté
    User.findOne = jest.fn().mockResolvedValue({ email: 'doublon@test.com' });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nom: 'Test', prenom: 'User', email: 'doublon@test.com', role: 'agent' });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  /**
   * Comment tester qu'un agent ne peut pas créer un utilisateur ?
   * → On mocke l'utilisateur connecté avec role='agent',
   *   puis on vérifie qu'on reçoit un 403.
   */

  it('403 — un agent ne peut pas créer un utilisateur', async () => {
    mockAuthUser('agent');
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ nom: 'Test', prenom: 'User', email: 'test@test.com', role: 'client' });

    expect(res.statusCode).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────
// 4. ROUTE GET — Lister les utilisateurs
// ─────────────────────────────────────────────────────────────────
describe('4. GET /api/users — Lister les utilisateurs', () => {

  /**
   * Comment tester une route GET ?
   * → request(app).get('/chemin').set('Authorization', ...)
   * → On vérifie le statusCode (200) et la structure du body.
   */

  const setupFindMock = (data = [], total = 0) => {
    const mockFind = {
      select: jest.fn().mockReturnThis(),
      sort:   jest.fn().mockReturnThis(),
      skip:   jest.fn().mockReturnThis(),
      limit:  jest.fn().mockResolvedValue(data),
    };
    User.find = jest.fn().mockReturnValue(mockFind);
    User.countDocuments = jest.fn().mockResolvedValue(total);
  };

  it('200 — retourne la liste paginée', async () => {
    mockAuthUser('admin');
    setupFindMock(
      [{ nom: 'Diallo', prenom: 'Mamadou', role: 'client', statut: 'actif' }],
      1
    );

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    // Vérifier la structure de pagination
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.pagination.page).toBe(1);
  });

  it('200 — retourne un tableau vide si aucun utilisateur', async () => {
    mockAuthUser('admin');
    setupFindMock([], 0);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });

  /**
   * Comment tester le filtrage par rôle ?
   * → Envoyer ?role=client dans la query string et vérifier
   *   que User.find a bien été appelé avec le bon filtre.
   */

  it('filtre par rôle — GET /api/users?role=client', async () => {
    mockAuthUser('admin');
    setupFindMock(
      [{ nom: 'Client', prenom: 'Test', role: 'client' }],
      1
    );

    const res = await request(app)
      .get('/api/users?role=client')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    // Vérifier que User.find a été appelé avec le filtre role
    expect(User.find).toHaveBeenCalledWith(expect.objectContaining({ role: 'client' }));
  });

  it('filtre par statut — GET /api/users?statut=bloque', async () => {
    mockAuthUser('admin');
    setupFindMock([], 0);

    const res = await request(app)
      .get('/api/users?statut=bloque')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(User.find).toHaveBeenCalledWith(expect.objectContaining({ statut: 'bloque' }));
  });

  /**
   * Comment tester la recherche par email, téléphone ou matricule ?
   * → Envoyer ?search=valeur et vérifier que le filtre $or
   *   est bien transmis à User.find.
   */

  it('recherche par email — GET /api/users?search=test@mail.com', async () => {
    mockAuthUser('admin');
    setupFindMock([], 0);

    const res = await request(app)
      .get('/api/users?search=test@mail.com')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    // Le filtre $or est généré par buildFilter avec la valeur de search
    const callArg = User.find.mock.calls[0][0];
    expect(callArg.$or).toBeDefined();
  });

  it('recherche par téléphone — GET /api/users?search=0612345678', async () => {
    mockAuthUser('admin');
    setupFindMock([], 0);

    const res = await request(app)
      .get('/api/users?search=0612345678')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    const callArg = User.find.mock.calls[0][0];
    expect(callArg.$or).toBeDefined();
  });

  it('filtre combiné rôle + statut', async () => {
    mockAuthUser('admin');
    setupFindMock([], 0);

    const res = await request(app)
      .get('/api/users?role=agent&statut=actif')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(User.find).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'agent', statut: 'actif' })
    );
  });
});

// ─────────────────────────────────────────────────────────────────
// 5. ROUTE GET par ID
// ─────────────────────────────────────────────────────────────────
describe('5. GET /api/users/:id — Obtenir un utilisateur', () => {

  it('200 — retourne un utilisateur existant', async () => {
    User.findById = jest.fn()
      .mockResolvedValueOnce({ _id: 'adminId', role: 'admin', statut: 'actif' }) // middleware
      .mockReturnValueOnce({                                                            // getUser
        select: jest.fn().mockResolvedValue({
          _id: 'userId1', nom: 'Sow', prenom: 'Fatou', email: 'fatou@test.com', role: 'agent',
        }),
      });

    const res = await request(app)
      .get('/api/users/userId1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('fatou@test.com');
  });

  /**
   * Comment tester une erreur 404 ?
   * → Simuler que la ressource n'existe pas en retournant null.
   */

  it('404 — utilisateur introuvable', async () => {
    User.findById = jest.fn()
      .mockResolvedValueOnce({ _id: 'adminId', role: 'admin', statut: 'actif' })
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) });

    const res = await request(app)
      .get('/api/users/idInexistant')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// 6. ROUTE PATCH — Changer le statut
// ─────────────────────────────────────────────────────────────────
describe('6. PATCH /api/users/:id/status — Changer le statut', () => {

  /**
   * Comment tester une route PATCH ?
   * → request(app).patch('/chemin').send({ clé: valeur })
   */

  it('200 — bloquer un utilisateur', async () => {
    mockAuthUser('admin');
    User.findByIdAndUpdate = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'u1', statut: 'bloque' }),
    });

    const res = await request(app)
      .patch('/api/users/u1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ statut: 'bloque' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.statut).toBe('bloque');
  });

  it('200 — activer un utilisateur (statut actif)', async () => {
    mockAuthUser('admin');
    User.findByIdAndUpdate = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'u1', statut: 'actif' }),
    });

    const res = await request(app)
      .patch('/api/users/u1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ statut: 'actif' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.statut).toBe('actif');
  });

  it('200 — supprimer définitivement (statut supprime)', async () => {
    mockAuthUser('admin');
    User.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: 'u1', nom: 'Test' });

    const res = await request(app)
      .patch('/api/users/u1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ statut: 'supprime' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('définitivement');
    // Vérifier que la suppression physique a bien été appelée
    expect(User.findByIdAndDelete).toHaveBeenCalledWith('u1');
  });

  it('400 — statut invalide (valeur inconnue)', async () => {
    mockAuthUser('admin');
    const res = await request(app)
      .patch('/api/users/u1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ statut: 'statut_inexistant' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  /**
   * Comment tester qu'un agent ne peut pas supprimer un utilisateur ?
   * → Configurer le mock pour renvoyer un user avec role='agent',
   *   puis appeler la route admin. Le middleware doit refuser.
   */

  it('403 — un agent ne peut pas changer le statut (route admin)', async () => {
    mockAuthUser('agent');
    const res = await request(app)
      .patch('/api/users/u1/status')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ statut: 'bloque' });

    expect(res.statusCode).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────
// 7. ROUTE DELETE (via bulk-action)
// ─────────────────────────────────────────────────────────────────
describe('7. PATCH /api/users/bulk-action — Actions groupées', () => {

  /**
   * Comment tester une route DELETE / suppression groupée ?
   * → Ici la suppression passe par PATCH /bulk-action avec action='supprimer'.
   * → On vérifie que deleteMany est bien appelé.
   */

  it('200 — suppression groupée de plusieurs utilisateurs', async () => {
    mockAuthUser('admin');
    User.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 3 });

    const res = await request(app)
      .patch('/api/users/bulk-action')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ids: ['id1', 'id2', 'id3'], action: 'supprimer' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('3');
    expect(User.deleteMany).toHaveBeenCalledWith({ _id: { $in: ['id1', 'id2', 'id3'] } });
  });

  it('200 — blocage groupé de plusieurs utilisateurs', async () => {
    mockAuthUser('admin');
    User.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 2 });

    const res = await request(app)
      .patch('/api/users/bulk-action')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ids: ['id1', 'id2'], action: 'bloquer' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(User.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['id1', 'id2'] } },
      { statut: 'bloque' }
    );
  });

  it('400 — aucun ID fourni', async () => {
    mockAuthUser('admin');
    const res = await request(app)
      .patch('/api/users/bulk-action')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ids: [], action: 'bloquer' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('400 — action inconnue', async () => {
    mockAuthUser('admin');
    const res = await request(app)
      .patch('/api/users/bulk-action')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ids: ['id1'], action: 'action_inconnue' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// 8. ERREUR 500 — Erreur serveur inattendue
// ─────────────────────────────────────────────────────────────────
describe('8. Erreur 500 — Erreur serveur', () => {

  /**
   * Comment tester une erreur 500 ?
   * → Faire en sorte qu'une méthode du modèle lève une exception.
   * → L'app doit répondre 500 Internal Server Error.
   */

  it('500 — erreur BDD lors de GET /api/users', async () => {
    mockAuthUser('admin');
    // Simuler une erreur MongoDB
    User.find = jest.fn().mockImplementation(() => {
      throw new Error('Connexion MongoDB perdue');
    });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('500 — erreur BDD lors de POST /api/users', async () => {
    mockAuthUser('admin');
    User.findOne = jest.fn().mockResolvedValue(null);
    User.generateTempPassword = jest.fn().mockReturnValue('Temp1234');
    User.create = jest.fn().mockRejectedValue(new Error('Erreur BDD'));

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nom: 'Test', prenom: 'User', email: 'err@test.com', role: 'agent' });

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// 9. STATISTIQUES
// ─────────────────────────────────────────────────────────────────
describe('9. GET /api/users/stats — Statistiques', () => {

  it('200 — retourne les statistiques par rôle et statut', async () => {
    mockAuthUser('admin');
    // L'endpoint utilise aggregate()
    User.aggregate = jest.fn()
      .mockResolvedValueOnce([{ _id: 'actif', count: 2 }, { _id: 'bloque', count: 1 }]) // admins
      .mockResolvedValueOnce([{ _id: 'actif', count: 5 }])                               // agents
      .mockResolvedValueOnce([{ _id: 'actif', count: 10 }, { _id: 'inactif', count: 3 }]); // clients

    const res = await request(app)
      .get('/api/users/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.admins).toBeDefined();
    expect(res.body.data.agents).toBeDefined();
    expect(res.body.data.clients).toBeDefined();
    expect(res.body.data.global).toBeDefined();
    // Vérifier les totaux calculés
    expect(res.body.data.admins.actif).toBe(2);
    expect(res.body.data.admins.bloque).toBe(1);
    expect(res.body.data.admins.total).toBe(3);
  });
});
