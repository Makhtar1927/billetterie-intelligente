# 📋 Audit Complet — Système de Billetterie Intelligente

> **Légende :** ✅ Conforme | ⚠️ Partiellement conforme | ❌ Manquant / Non conforme

---

## 1. SERVICE UTILISATEURS (Backend + Frontend)

### 1.1 Modèle de données (`User.js`)

| Champ | Exigence | Statut |
|---|---|---|
| `nom`, `prenom`, `email`, `telephone` | Requis | ✅ |
| `role` (admin/agent/client) | Requis | ✅ |
| `photo` (optionnelle) | Requis | ✅ |
| `motDePasse` hashé (bcrypt) | Requis | ✅ |
| `statut` (actif/bloqué/supprimé/inactif) | Requis | ✅ |
| `premiereConnexion`, `motDePasseTemporaire` | Requis | ✅ |

### 1.2 Authentification (`authController.js`)

| Fonctionnalité | Statut | Remarque |
|---|---|---|
| Connexion avec email + mot de passe | ✅ | `POST /api/auth/login` |
| Déconnexion sécurisée | ⚠️ | Côté client uniquement (suppression token) — pas de blacklist JWT côté serveur |
| Consulter/modifier profil + photo | ✅ | `GET /auth/me` + `PUT /users/me/profile` |
| Changer mot de passe (confirmation ancien) | ✅ | `PUT /api/auth/change-password` |
| Première connexion → forcer changement mdp | ✅ | Détecté via `premiereConnexion: true` |

### 1.3 Gestion des Utilisateurs (`userController.js`)

| Fonctionnalité | Statut | Remarque |
|---|---|---|
| Créer un admin/agent/client individuellement | ✅ | `POST /api/users` |
| Importer plusieurs utilisateurs via CSV | ✅ | `POST /api/users/import-csv` |
| Lister les utilisateurs (admins/agents/clients) | ✅ | `GET /api/users` |
| Activer un compte (individuel) | ✅ | `PATCH /api/users/:id/activate` |
| Activer plusieurs comptes (groupé) | ✅ | `POST /api/users/activate-bulk` |
| Bloquer/supprimer un compte (individuel) | ✅ | `PATCH /api/users/:id/status` |
| Actions groupées (bloquer/supprimer) | ⚠️ | Le `bulkAction` utilise `updateMany` pour "supprimer" (marque `statut:'supprime'`), **mais le test unitaire détecte un bug 500** sur cette action |

> [!CAUTION]
> **Bug confirmé** dans `bulkAction` : le test `7. PATCH /bulk-action — suppression groupée` retourne 500 au lieu de 200. La logique `updateMany` pour `action='supprimer'` est pourtant présente dans le contrôleur mais un mock `User.deleteMany` dans le test (au lieu de `updateMany`) crée une incohérence. À corriger.

### 1.4 Recherche et Filtrage

| Fonctionnalité | Statut | Remarque |
|---|---|---|
| Filtrer par rôle (admin/agent/client) | ✅ | `?role=client` |
| Filtrer par statut (actif/bloqué/supprimé) | ✅ | `?statut=bloque` |
| Rechercher par email | ✅ | `?search=email@...` |
| Rechercher par téléphone | ✅ | `?search=0612345678` |
| Rechercher par identifiant unique | ✅ | `?search=<ObjectId>` |

### 1.5 Activation + Notification Email

| Fonctionnalité | Statut | Remarque |
|---|---|---|
| Génération mot de passe temporaire (8 chars) | ✅ | `User.generateTempPassword()` |
| Envoi email à l'activation | ✅ | `emailService.sendActivationEmail()` |
| Compte passe au statut Actif après activation | ✅ | |

### 1.6 Tableau de Bord Admin (Frontend)

| Fonctionnalité | Statut | Remarque |
|---|---|---|
| Stats admins (total, actifs, bloqués, supprimés) | ✅ | `GET /api/users/stats` |
| Stats agents (total, actifs, bloqués, supprimés) | ✅ | |
| Stats clients (total, actifs, bloqués, supprimés) | ✅ | |
| Statistiques globales | ✅ | |
| Graphiques d'activité récente | ❌ | Placeholder affiché mais pas implémenté |

---

## 2. SERVICE BILLETTERIE / ABONNEMENTS (Backend)

> [!IMPORTANT]
> Le projet utilise une **architecture microservices** : le `abonnementController.js` actuel fait un **proxy HTTP** vers un service externe sur `http://localhost:5001`. Cela signifie qu'**un second service Node.js doit tourner** pour que les abonnements fonctionnent.

### 2.1 Ticket Simple (`Ticket.js` + `ticketController.js`)

| Exigence | Statut | Remarque |
|---|---|---|
| Un seul voyage autorisé | ✅ | `voyagesInitiaux: 1` par défaut |
| Utilisation unique | ✅ | Statut → `utilise` après scan |
| Durée de validité configurable | ⚠️ | Champ `dateExpiration` existe mais **non transmis à la création** via `acheterTicket` (`prix` seulement accepté) |
| Désactivation automatique après utilisation | ✅ | `voyageController.js` met `statut='utilise'` |
| Association obligatoire à un client | ✅ | `utilisateur: req.user._id` |
| Génération QR Code unique | ✅ | HMAC + QRCode.toFile |
| Suivi : voyages initiaux/utilisés/restants | ✅ | Ajouté dans `Ticket.js` |
| Suivi : date dernier voyage, ID validation | ✅ | `dateDernierVoyage`, `derniereValidationId` |
| Historique des consommations | ✅ | `historiqueConsommations[]` |

### 2.2 Abonnement Limité

| Exigence | Statut | Remarque |
|---|---|---|
| Nombre initial de voyages configurable | ✅ | `voyagesTotal` |
| Décrémentation après chaque voyage validé | ✅ | `voyageController.js` |
| Suivi voyages consommés / restants | ✅ | |
| Date de début | ✅ | `dateDebut` dans `Ticket.js` |
| Date d'expiration | ✅ | `dateExpiration` dans `Ticket.js` |
| Impossibilité si solde = 0 | ✅ | Vérifié avant scan |
| Impossibilité après expiration | ✅ | Vérifié avant scan |

### 2.3 Abonnement Illimité

| Exigence | Statut | Remarque |
|---|---|---|
| Pas de compteur à décrémenter | ✅ | Branch `abonnement_illimite` dans scanner |
| Date de début obligatoire | ✅ | `dateDebut: new Date()` à la création |
| Date d'expiration obligatoire | ✅ | Validation ajoutée dans `abonnementController.js` |
| Validation tant qu'actif | ✅ | |
| Blocage automatique après expiration | ✅ | Vérification `dateExpiration < now()` |
| Historique du nombre réel de voyages | ✅ | `voyagesUtilises` et `historiqueConsommations` |

### 2.4 Architecture Microservices Abonnement

| Exigence | Statut | Remarque |
|---|---|---|
| Service indépendant sur port 5001 | ❌ | **Le service sur :5001 n'existe pas dans le dossier du projet** — le `abonnementController.js` actuel est un proxy mais il n'y a pas de second projet Node.js pour le recevoir |
| Base de données MySQL propre | ❌ | L'exigence parle de MySQL mais tout est sur MongoDB |
| Ses propres tables / endpoints | ❌ | Non trouvé dans le workspace |
| Journalisation propre | ❌ | Non implémentée |

> [!WARNING]
> L'architecture microservices requise n'est **pas implémentée**. Actuellement, `abonnementController.js` appelle `http://localhost:5001` qui n'existe pas → toutes les requêtes abonnement échouent en production. Ce service doit être créé séparément.

---

## 3. SCAN QR CODE — AGENT (`voyageController.js`)

| Fonctionnalité | Statut | Remarque |
|---|---|---|
| Vérification signature HMAC | ✅ | |
| Vérification ticket simple (utilisation unique) | ✅ | |
| Vérification abonnement limité (solde + expiration) | ✅ | |
| Vérification abonnement illimité (expiration seule) | ✅ | |
| Enregistrement du voyage (Voyage model) | ✅ | |
| Suivi post-scan (voyagesRestants, historique) | ✅ | |
| Scan via caméra (Frontend agent) | ✅ | `html5-qrcode` intégré |
| Saisie manuelle de secours | ✅ | |
| Affichage résultat AUTORISÉ / REFUSÉ | ✅ | |

---

## 4. FRONTEND — PAGES ET NAVIGATION

| Page | Rôle | Statut | Remarque |
|---|---|---|---|
| `Login.jsx` | Public | ✅ | |
| `ChangePassword.jsx` | Tous | ✅ | |
| `Dashboard.jsx` | Admin | ✅ | Statistiques complètes |
| `AdminsPage.jsx` | Admin | ✅ | Via `UserList` |
| `AgentsPage.jsx` | Admin | ✅ | Via `UserList` |
| `ClientsPage.jsx` | Admin | ✅ | Via `UserList` |
| `UserList.jsx` | Admin | ✅ | Filtres, création, CSV, bulk |
| `TicketList.jsx` | Admin | ✅ | |
| `AbonnementList.jsx` | Admin | ✅ | Dépend du service :5001 |
| `VoyageList.jsx` | Admin | ✅ | |
| `ScanPage.jsx` | Agent | ✅ | |
| `MesBillets.jsx` | Client | ✅ | |
| `MesAbonnements.jsx` | Client | ✅ | Dépend du service :5001 |
| `Profil.jsx` | Tous | ✅ | |
| Historique voyages client | Client | ❌ | La route `/voyages/mon-historique` existe en backend mais **aucune page frontend** ne l'affiche pour le client |

---

## 5. TESTS

| Suite de test | Statut | Résultat |
|---|---|---|
| Tests unitaires (mdp, buildFilter) | ✅ | 2 tests passent |
| Auth (401, 403) | ✅ | 4 tests passent |
| POST /api/users | ✅ | 4 tests passent |
| GET /api/users | ✅ | 6 tests passent |
| GET /api/users/:id | ✅ | 2 tests passent |
| PATCH statut | ⚠️ | 4/5 passent — 1 échoue (message "définitivement" vs "supprimé") |
| PATCH bulk-action | ⚠️ | 2/4 passent — 1 échoue (500 au lieu 200 pour suppression) |
| Erreur 500 | ✅ | 2 tests passent |
| Stats | ✅ | 1 test passe |
| **Tests voyage (billetterie)** | ✅ | **6/6 tests passent** |
| Tests abonnements | ❌ | Non écrits |
| Tests tickets (acheter) | ❌ | Non écrits |

---

## 6. RÉCAPITULATIF PRIORITAIRE

### ✅ Ce qui est conforme
- Service Utilisateurs complet (CRUD, CSV, filtres, stats, email, gestion groupée)
- Modèle de données `Ticket.js` avec tous les champs de suivi requis
- Logique de scan QR (3 types validés et testés)
- Frontend avec toutes les pages pour chaque rôle
- Tests de voyage (6/6 ✅)

### ⚠️ Ce qui est partiellement conforme
1. **Test `bulkAction` (suppression)** : bug dans le test (mock `deleteMany` vs logique `updateMany`) — à corriger
2. **Test `updateStatus` (supprimé)** : message retourné ne contient pas "définitivement" — corriger le test ou le message
3. **`dateExpiration` du ticket simple** : le frontend ne permet pas de configurer la durée de validité à l'achat
4. **Déconnexion** : pas de blacklist JWT côté serveur (token reste valide jusqu'à expiration)

### ❌ Ce qui reste à faire
1. **Créer le microservice Abonnement** (Node.js sur port 5001, avec MySQL) — PRIORITÉ HAUTE
2. **Page historique des voyages pour le client** (la route backend `/voyages/mon-historique` existe mais pas de page frontend)
3. **Graphiques d'activité dans le Dashboard** (actuellement placeholder)
4. **Recherche/filtrage Billetterie** : stats tickets + voyages (abonnements actifs, voyages du jour, etc.) dans le dashboard admin
5. **Tests manquants** : abonnements, tickets (acheterTicket), authController
