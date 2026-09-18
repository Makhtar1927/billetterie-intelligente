# 📖 Documentation Supertest — Système de Billetterie Intelligente

---

## 1. Qu'est-ce que Supertest ?

**Supertest** est une bibliothèque Node.js qui permet de tester des APIs HTTP directement depuis vos tests, **sans démarrer de vrai serveur**. Elle enveloppe votre application Express et vous laisse envoyer des requêtes simulées.

```bash
npm install --save-dev supertest
```

```js
const request = require('supertest');
const app     = require('../server'); // votre app Express

// Envoi d'une requête GET simulée
const res = await request(app).get('/api/users');
```

---

## 2. Pourquoi utiliser Supertest pour tester une API Express ?

| Sans Supertest | Avec Supertest |
|---|---|
| Démarrer le serveur manuellement | L'app est testée en mémoire |
| Tester dans le navigateur / Postman | Tests automatisés et reproductibles |
| Résultats non vérifiables en CI | Intégration Git/CI complète |
| Long et fastidieux | `npx jest` en une commande |

**Avantages concrets :**
- Teste le comportement réel de l'API (middleware, routage, corps JSON)
- Vérifie les codes HTTP, les headers et les réponses JSON
- S'intègre naturellement avec Jest (mocks, assertions, coverage)

---

## 3. Différence entre tester une fonction et tester une route API

### Test de fonction (unitaire)
On appelle directement une fonction JavaScript et on vérifie ce qu'elle retourne. Pas de HTTP, pas de base de données.

```js
// Test unitaire — logique pure
it('génère un mot de passe de 8 caractères', () => {
  const pwd = generateTempPassword();
  expect(pwd.length).toBe(8); // aucune requête HTTP
});
```

### Test de route API (intégration)
On envoie une vraie requête HTTP à l'application et on vérifie le **code de réponse** et le **corps JSON**.

```js
// Test de route — simule un appel réseau
it('crée un utilisateur', async () => {
  const res = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nom: 'Diallo', prenom: 'Ibra', email: 'ibra@test.com', role: 'agent' });

  expect(res.statusCode).toBe(201); // vérifie le code HTTP
  expect(res.body.success).toBe(true); // vérifie le JSON
});
```

---

## 4. Comment tester une route POST ?

```js
const res = await request(app)
  .post('/api/users')                           // méthode POST + chemin
  .set('Authorization', `Bearer ${adminToken}`) // en-tête JWT
  .send({                                       // corps de la requête (JSON)
    nom: 'Diallo', prenom: 'Ibra',
    email: 'ibra@test.com', role: 'agent'
  });

expect(res.statusCode).toBe(201); // 201 = Created
expect(res.body.data.email).toBe('ibra@test.com');
```

---

## 5. Comment tester une route GET ?

```js
const res = await request(app)
  .get('/api/users')                            // méthode GET + chemin
  .set('Authorization', `Bearer ${adminToken}`) // en-tête JWT

expect(res.statusCode).toBe(200); // 200 = OK
expect(Array.isArray(res.body.data)).toBe(true);
expect(res.body.pagination.total).toBeDefined();
```

**Avec paramètres de query :**
```js
const res = await request(app)
  .get('/api/users?role=client&statut=actif') // query string directement dans l'URL
  .set('Authorization', `Bearer ${adminToken}`);
```

---

## 6. Comment tester une route PATCH ?

```js
const res = await request(app)
  .patch('/api/users/userId123/status')         // méthode PATCH + chemin avec paramètre
  .set('Authorization', `Bearer ${adminToken}`)
  .send({ statut: 'bloque' });                  // corps partiel (modification partielle)

expect(res.statusCode).toBe(200);
expect(res.body.data.statut).toBe('bloque');
```

---

## 7. Comment tester une route DELETE ?

Dans ce projet, la suppression passe par `PATCH /bulk-action`. Voici la syntaxe générique pour DELETE :

```js
// Syntaxe DELETE standard
const res = await request(app)
  .delete('/api/users/userId123')
  .set('Authorization', `Bearer ${adminToken}`);

expect(res.statusCode).toBe(200); // ou 204 No Content
```

**Dans ce projet (suppression via PATCH) :**
```js
const res = await request(app)
  .patch('/api/users/bulk-action')
  .set('Authorization', `Bearer ${adminToken}`)
  .send({ ids: ['id1', 'id2'], action: 'supprimer' });

expect(res.statusCode).toBe(200);
expect(User.deleteMany).toHaveBeenCalled(); // vérifie l'appel BDD
```

---

## 8. Comment vérifier un code HTTP dans un test API ?

```js
expect(res.statusCode).toBe(200); // OK
expect(res.statusCode).toBe(201); // Created
expect(res.statusCode).toBe(400); // Bad Request
expect(res.statusCode).toBe(401); // Unauthorized
expect(res.statusCode).toBe(403); // Forbidden
expect(res.statusCode).toBe(404); // Not Found
expect(res.statusCode).toBe(409); // Conflict (doublon)
expect(res.statusCode).toBe(500); // Internal Server Error
```

---

## 9. Comment vérifier le contenu de la réponse JSON ?

```js
const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);

// Vérifier un booléen
expect(res.body.success).toBe(true);

// Vérifier une valeur précise
expect(res.body.data.email).toBe('ibra@test.com');
expect(res.body.data.statut).toBe('inactif');

// Vérifier qu'un champ existe
expect(res.body.pagination).toBeDefined();

// Vérifier qu'un champ sensible est ABSENT
expect(res.body.data.motDePasse).toBeUndefined();

// Vérifier un tableau
expect(Array.isArray(res.body.data)).toBe(true);
expect(res.body.data).toHaveLength(1);

// Vérifier qu'un message contient un texte
expect(res.body.message).toContain('définitivement');
```

---

## 10. Comment tester une erreur 400 (Bad Request) ?

```js
it('400 — champ role manquant', async () => {
  User.findById.mockResolvedValue({ _id: 'adminId', role: 'admin', statut: 'actif' });

  const res = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nom: 'Test', prenom: 'User', email: 'test@test.com' }); // role manquant

  expect(res.statusCode).toBe(400);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toBeTruthy(); // message d'erreur présent
});
```

---

## 11. Comment tester une erreur 401 (Unauthorized) ?

```js
// 1. Sans token du tout
it('401 — pas de token', async () => {
  const res = await request(app).get('/api/users');
  // Pas de .set('Authorization') → le middleware rejette
  expect(res.statusCode).toBe(401);
});

// 2. Avec un token expiré
it('401 — token expiré', async () => {
  const expiredToken = jwt.sign({ id: 'anyId' }, 'testsecret', { expiresIn: '-1s' });
  const res = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${expiredToken}`);
  expect(res.statusCode).toBe(401);
});

// 3. Avec une chaîne invalide
it('401 — token malformé', async () => {
  const res = await request(app)
    .get('/api/users')
    .set('Authorization', 'Bearer ceci_nest_pas_un_token_valide');
  expect(res.statusCode).toBe(401);
});
```

---

## 12. Comment tester une erreur 403 (Forbidden) ?

```js
// Un agent tente d'accéder à une route admin
it('403 — un agent n\'a pas les droits admin', async () => {
  User.findById.mockResolvedValue({ _id: 'agentId', role: 'agent', statut: 'actif' });

  const agentToken = jwt.sign({ id: 'agentId' }, 'testsecret', { expiresIn: '1h' });

  const res = await request(app)
    .get('/api/users')               // route réservée aux admins
    .set('Authorization', `Bearer ${agentToken}`);

  expect(res.statusCode).toBe(403); // 403 Forbidden
});
```

---

## 13. Comment tester une erreur 404 (Not Found) ?

```js
// Simuler que la ressource n'existe pas → retourner null
it('404 — utilisateur introuvable', async () => {
  User.findById
    .mockResolvedValueOnce({ _id: 'adminId', role: 'admin', statut: 'actif' }) // middleware
    .mockReturnValue({ select: jest.fn().mockResolvedValue(null) });            // getUser → null

  const res = await request(app)
    .get('/api/users/idInexistant')
    .set('Authorization', `Bearer ${adminToken}`);

  expect(res.statusCode).toBe(404);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toContain('introuvable');
});
```

---

## 14. Comment tester une erreur 500 (Internal Server Error) ?

```js
// Simuler une exception dans la couche BDD
it('500 — erreur base de données', async () => {
  User.findById.mockResolvedValue({ _id: 'adminId', role: 'admin', statut: 'actif' });

  // Faire planter User.find pour simuler une panne MongoDB
  User.find = jest.fn().mockImplementation(() => {
    throw new Error('Connexion MongoDB perdue');
  });

  const res = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${adminToken}`);

  expect(res.statusCode).toBe(500);
  expect(res.body.success).toBe(false);
  expect(res.body.message).toBeTruthy();
});
```

---

## 15. Comment tester une route protégée par authentification ?

Deux niveaux de protection existent dans ce projet :
1. **`protect`** : vérifie que le token JWT est valide.
2. **`authorize('admin')`** : vérifie que le rôle est suffisant.

```js
// Niveau 1 : test de protect (token requis)
it('sans token → 401', async () => {
  const res = await request(app).get('/api/users'); // aucun header
  expect(res.statusCode).toBe(401);
});

// Niveau 2 : test de authorize (bon rôle requis)
it('mauvais rôle → 403', async () => {
  User.findById.mockResolvedValue({ _id: 'cId', role: 'client', statut: 'actif' });
  const clientToken = jwt.sign({ id: 'cId' }, 'testsecret', { expiresIn: '1h' });

  const res = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${clientToken}`);

  expect(res.statusCode).toBe(403);
});
```

---

## 16. Comment envoyer un token JWT dans un test API ?

```js
// 1. Générer le token (une seule fois dans beforeAll)
const adminToken = jwt.sign(
  { id: 'mockedAdminId' },   // payload
  process.env.JWT_SECRET,     // clé secrète (même que dans .env)
  { expiresIn: '1h' }
);

// 2. L'envoyer dans chaque requête
const res = await request(app)
  .get('/api/users')
  .set('Authorization', `Bearer ${adminToken}`); // format standard Bearer token
```

> **Important :** Le middleware `protect` décode le token puis appelle `User.findById(decoded.id)`.
> Il faut donc aussi mocker `User.findById` pour retourner l'utilisateur simulé.

```js
// Mock du middleware auth
User.findById.mockResolvedValue({
  _id: 'mockedAdminId',
  role: 'admin',
  statut: 'actif'
});
```

---

## 17. Comment tester qu'un admin peut créer un utilisateur ?

```js
it('201 — un admin crée un agent', async () => {
  // Simuler un admin connecté
  User.findById.mockResolvedValue({ _id: 'adminId', role: 'admin', statut: 'actif' });

  // Simuler la BDD : pas de doublon, création réussie
  User.findOne = jest.fn().mockResolvedValue(null);
  User.generateTempPassword = jest.fn().mockReturnValue('Temp1234');
  User.create = jest.fn().mockResolvedValue({
    _id: 'newId', email: 'agent@test.com', role: 'agent', statut: 'inactif',
    toObject: () => ({ _id: 'newId', email: 'agent@test.com', role: 'agent', statut: 'inactif' }),
  });

  const adminToken = jwt.sign({ id: 'adminId' }, 'testsecret', { expiresIn: '1h' });

  const res = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nom: 'Sow', prenom: 'Fatou', email: 'agent@test.com', role: 'agent' });

  expect(res.statusCode).toBe(201);
  expect(res.body.data.role).toBe('agent');
  expect(res.body.data.statut).toBe('inactif'); // compte inactif par défaut
});
```

---

## 18. Comment tester qu'un agent ne peut pas supprimer un utilisateur ?

```js
it('403 — un agent ne peut pas supprimer un utilisateur', async () => {
  // Simuler un AGENT connecté (pas un admin)
  User.findById.mockResolvedValue({ _id: 'agentId', role: 'agent', statut: 'actif' });

  const agentToken = jwt.sign({ id: 'agentId' }, 'testsecret', { expiresIn: '1h' });

  // Tenter d'accéder à une route admin
  const res = await request(app)
    .patch('/api/users/quelconque/status')
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ statut: 'supprime' });

  // Le middleware authorize('admin') bloque → 403
  expect(res.statusCode).toBe(403);
});
```

---

## 19. Comment tester le filtrage par rôle ?

```js
it('filtre par rôle client', async () => {
  User.findById.mockResolvedValue({ _id: 'adminId', role: 'admin', statut: 'actif' });

  // Mocker find avec la chaîne de méthodes Mongoose
  const mockFind = {
    select: jest.fn().mockReturnThis(),
    sort:   jest.fn().mockReturnThis(),
    skip:   jest.fn().mockReturnThis(),
    limit:  jest.fn().mockResolvedValue([{ nom: 'Client', role: 'client' }]),
  };
  User.find = jest.fn().mockReturnValue(mockFind);
  User.countDocuments = jest.fn().mockResolvedValue(1);

  const res = await request(app)
    .get('/api/users?role=client')           // filtre dans la query string
    .set('Authorization', `Bearer ${adminToken}`);

  expect(res.statusCode).toBe(200);

  // Vérifier que User.find a été appelé avec le bon filtre
  expect(User.find).toHaveBeenCalledWith(
    expect.objectContaining({ role: 'client' })
  );
});
```

---

## 20. Comment tester la recherche par email, téléphone ou matricule ?

```js
it('recherche par email', async () => {
  User.findById.mockResolvedValue({ _id: 'adminId', role: 'admin', statut: 'actif' });

  const mockFind = {
    select: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(),
    skip:   jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([]),
  };
  User.find = jest.fn().mockReturnValue(mockFind);
  User.countDocuments = jest.fn().mockResolvedValue(0);

  await request(app)
    .get('/api/users?search=fatou@gmail.com')  // valeur à rechercher
    .set('Authorization', `Bearer ${adminToken}`);

  // buildFilter() génère $or avec email + telephone + _id
  const filterArg = User.find.mock.calls[0][0];
  expect(filterArg.$or).toBeDefined();        // le filtre $or est présent
  expect(filterArg.$or).toBeInstanceOf(Array);
});

it('recherche par téléphone', async () => {
  // Même structure, la valeur est un numéro de téléphone
  User.find = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(),
    skip:   jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([]),
  });
  User.countDocuments = jest.fn().mockResolvedValue(0);

  await request(app)
    .get('/api/users?search=0612345678')
    .set('Authorization', `Bearer ${adminToken}`);

  const filterArg = User.find.mock.calls[0][0];
  expect(filterArg.$or).toBeDefined();
});
```

---

## Récapitulatif des méthodes Supertest

| Méthode | Usage |
|---|---|
| `request(app).get(url)` | Requête GET |
| `request(app).post(url).send({...})` | Requête POST avec corps JSON |
| `request(app).patch(url).send({...})` | Requête PATCH |
| `request(app).put(url).send({...})` | Requête PUT |
| `request(app).delete(url)` | Requête DELETE |
| `.set('Authorization', 'Bearer token')` | Ajouter un en-tête HTTP |
| `.set('Content-Type', 'application/json')` | Forcer le type de contenu |
| `.query({ role: 'client' })` | Ajouter des paramètres de query |
| `res.statusCode` | Code de réponse HTTP |
| `res.body` | Corps de la réponse JSON (déjà parsé) |
| `res.headers` | En-têtes de la réponse |

## Lancer les tests

```bash
# Lancer tous les tests
npm run test

# Avec rapport de couverture
npm run test:coverage

# Un seul fichier
npx jest tests/user.test.js

# Mode watch (relance à chaque sauvegarde)
npm run test:watch
```
