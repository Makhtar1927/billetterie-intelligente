# 📋 Documentation des Tests — Système de Billetterie Intelligente

> **Projet :** Backend_PI — Service Utilisateurs  
> **Auteur :** CCAK L3  
> **Outils :** Jest · Supertest  
> **Commande :** `npx jest --coverage`

---

## 1. Contexte et objectifs

Le service utilisateur est le cœur de l'application : il gère l'authentification, les rôles (admin, agent, client) et les statuts des comptes. Les tests visent à garantir que :

- Chaque endpoint répond correctement aux requêtes valides et invalides.
- La logique métier (activation, suppression définitive, première connexion) est fiable.
- Les accès non autorisés sont bloqués.

---

## 2. Architecture du projet de tests

```
Backend_PI/
├── tests/
│   └── user.test.js       ← Fichier de tests principal
├── package.json           ← Jest configuré en devDependencies
└── server.js              ← L'application Express exportée (module.exports = app)
```

### Dépendances de test

| Package | Version | Rôle |
|---|---|---|
| `jest` | ^30 | Framework de test (assertions, mocks, couverture) |
| `supertest` | ^7 | Simulation de requêtes HTTP sur l'app Express |
| `mongodb-memory-server` | ^11 | Base MongoDB en mémoire (optionnel, non utilisé ici) |

---

## 3. Stratégie de mock

Comme le service se connecte à MongoDB Atlas en production, les tests utilisent des **mocks Jest** pour isoler la logique sans base de données réelle.

| Ce qui est mocké | Pourquoi |
|---|---|
| `../models/User` | Évite toute connexion à MongoDB |
| `../config/db` | Empêche `connectDB()` d'être appelé au démarrage |
| `../services/emailService` | Évite d'envoyer de vrais emails pendant les tests |

### Token JWT de test

Un token admin est généré avant tous les tests via `JWT_SECRET=testsecret` pour simuler un utilisateur authentifié avec le rôle `admin`.

```js
adminToken = jwt.sign({ id: 'mockedAdminId' }, process.env.JWT_SECRET, { expiresIn: '1h' });
```

---

## 4. Exécution des tests

### Prérequis

Assurez-vous que les dépendances de développement sont installées :

```bash
cd Backend_PI
npm install
```

### Lancer tous les tests

```bash
npx jest
```

### Lancer avec rapport de couverture

```bash
npx jest --coverage
```

### Lancer un seul fichier de test

```bash
npx jest tests/user.test.js
```

### Lancer en mode "watch" (relance à chaque sauvegarde)

```bash
npx jest --watch
```

> **Important :** Le test de changement de statut (`PATCH /status`) ne couvre PAS la suppression définitive car elle utilise maintenant `findByIdAndDelete`. Voir la section 6 pour le test à ajouter.

---

## 5. Description des tests existants

### `describe : User Service - Tests Unitaires`

#### `devrait générer un mot de passe temporaire de 8 caractères`

| Propriété | Détail |
|---|---|
| **Type** | Unitaire (logique pure, sans HTTP) |
| **Ce qui est testé** | La fonction `generateTempPassword()` |
| **Entrée** | Aucune |
| **Assertions** | Le résultat est une `string` de longueur `8` |

---

### `describe : User Service - Tests API`

#### `devrait créer un nouvel utilisateur avec succès (POST /api/users)`

| Propriété | Détail |
|---|---|
| **Type** | API (intégration) |
| **Endpoint** | `POST /api/users` |
| **Auth** | Token admin requis |
| **Corps envoyé** | `{ nom, prenom, email, telephone, role: 'agent' }` |
| **Mocks** | `User.findOne → null`, `User.create → objet utilisateur` |
| **Assertions** | HTTP `201`, `body.success = true`, `body.data.statut = 'inactif'` |

**Cas nominal :** Un admin crée un agent. Le compte est créé avec le statut `inactif` et un mot de passe temporaire haché.

---

#### `devrait récupérer la liste des utilisateurs (GET /api/users)`

| Propriété | Détail |
|---|---|
| **Type** | API (intégration) |
| **Endpoint** | `GET /api/users` |
| **Auth** | Token admin requis |
| **Paramètres** | Aucun (page 1, limite 20 par défaut) |
| **Mocks** | `User.find → [{ nom: 'Doe', ... }]`, `User.countDocuments → 1` |
| **Assertions** | HTTP `200`, `body.data` est un tableau, `body.pagination.total = 1` |

**Cas nominal :** L'admin récupère la liste paginée des utilisateurs.

---

#### `devrait changer le statut d'un utilisateur (PATCH /api/users/:id/status)`

| Propriété | Détail |
|---|---|
| **Type** | API (intégration) |
| **Endpoint** | `PATCH /api/users/userId123/status` |
| **Auth** | Token admin requis |
| **Corps envoyé** | `{ statut: 'bloque' }` |
| **Mocks** | `User.findByIdAndUpdate → { statut: 'bloque' }` |
| **Assertions** | HTTP `200`, `body.data.statut = 'bloque'` |

**Cas nominal :** L'admin bloque un utilisateur. Son statut passe à `bloque`.

---

## 6. Tests complémentaires recommandés

Les tests suivants couvrent les fonctionnalités ajoutées récemment et doivent être ajoutés dans `tests/user.test.js` :

### 6.1 Suppression définitive d'un utilisateur

```js
it('devrait supprimer définitivement un utilisateur (PATCH /api/users/:id/status)', async () => {
  User.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: 'userId123', nom: 'Test' });

  const res = await request(app)
    .patch('/api/users/userId123/status')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ statut: 'supprime' });

  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.message).toContain('définitivement');
  expect(User.findByIdAndDelete).toHaveBeenCalledWith('userId123');
});
```

### 6.2 Refus de création si champs manquants

```js
it('devrait refuser si le rôle est manquant (POST /api/users)', async () => {
  const res = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nom: 'Test', prenom: 'User', email: 'test@test.com' }); // role manquant

  expect(res.statusCode).toBe(400);
  expect(res.body.success).toBe(false);
});
```

### 6.3 Activation automatique du client à la connexion

```js
it('devrait activer un client inactif lors de sa première connexion (POST /auth/login)', async () => {
  User.findOne = jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: 'clientId',
      role: 'client',
      statut: 'inactif',
      comparePassword: jest.fn().mockResolvedValue(true),
      nom: 'Client', prenom: 'Test', email: 'client@test.com',
      photo: null, premiereConnexion: true, motDePasseTemporaire: true,
    })
  });
  User.updateOne = jest.fn().mockResolvedValue({});

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'client@test.com', motDePasse: 'tempPass1' });

  expect(res.statusCode).toBe(200);
  expect(User.updateOne).toHaveBeenCalledWith(
    { _id: 'clientId' },
    { statut: 'actif' }
  );
});
```

### 6.4 Refus de connexion si statut bloqué

```js
it('devrait refuser la connexion si le compte est bloqué (POST /auth/login)', async () => {
  User.findOne = jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: 'userId', role: 'client', statut: 'bloque',
      comparePassword: jest.fn(),
    })
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'blocked@test.com', motDePasse: 'pass' });

  expect(res.statusCode).toBe(403);
  expect(res.body.message).toContain('bloqué');
});
```

---

## 7. Tableau de synthèse complet

| # | Fonctionnalité | Endpoint | Type | Statut |
|---|---|---|---|---|
| 1 | Génération mot de passe temporaire | — | Unitaire | ✅ Couvert |
| 2 | Créer un utilisateur (succès) | `POST /api/users` | API | ✅ Couvert |
| 3 | Créer un utilisateur (échec — champs manquants) | `POST /api/users` | API | 🔲 À ajouter |
| 4 | Lister les utilisateurs avec pagination | `GET /api/users` | API | ✅ Couvert |
| 5 | Bloquer un utilisateur | `PATCH /api/users/:id/status` | API | ✅ Couvert |
| 6 | Supprimer définitivement un utilisateur | `PATCH /api/users/:id/status` | API | 🔲 À ajouter |
| 7 | Activation automatique client (1ère connexion) | `POST /api/auth/login` | API | 🔲 À ajouter |
| 8 | Refus connexion — compte bloqué | `POST /api/auth/login` | API | 🔲 À ajouter |
| 9 | Refus accès sans token JWT | `GET /api/users` | API | 🔲 À ajouter |

---

## 8. Scénario fonctionnel complet — « Cycle de vie d'un client »

Ce scénario décrit le flux réel de bout en bout pour un client :

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. ADMIN crée le client via POST /api/users (role: 'client')       │
│     → Statut : inactif                                              │
│     → Email envoyé automatiquement avec mot de passe temporaire     │
├─────────────────────────────────────────────────────────────────────┤
│  2. CLIENT se connecte avec le mot de passe reçu par email          │
│     → POST /api/auth/login                                          │
│     → Mot de passe vérifié ✅                                       │
│     → Statut automatiquement passé à 'actif'                        │
│     → Réponse contient : premiereConnexion: true                    │
├─────────────────────────────────────────────────────────────────────┤
│  3. FRONTEND redirige vers /change-password                         │
│     → Le client saisit son mot de passe temporaire                  │
│     → Il définit un nouveau mot de passe personnel                  │
│     → PUT /api/auth/change-password                                 │
│     → premiereConnexion → false, motDePasseTemporaire → false       │
├─────────────────────────────────────────────────────────────────────┤
│  4. CLIENT accède à son espace /mes-billets                         │
├─────────────────────────────────────────────────────────────────────┤
│  5. ADMIN supprime le client                                        │
│     → PATCH /api/users/:id/status { statut: 'supprime' }           │
│     → findByIdAndDelete → suppression physique en BDD               │
│     → Le compte n'existe plus                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. Résultat attendu de `npx jest --coverage`

```
PASS  tests/user.test.js
  User Service - Tests Unitaires
    ✓ devrait générer un mot de passe temporaire de 8 caractères
  User Service - Tests API
    ✓ devrait créer un nouvel utilisateur avec succès (POST /api/users)
    ✓ devrait récupérer la liste des utilisateurs (GET /api/users)
    ✓ devrait changer le statut d'un utilisateur (PATCH /api/users/:id/status)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```
