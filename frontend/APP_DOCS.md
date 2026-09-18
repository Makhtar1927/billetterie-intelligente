# 📚 Documentation Fonctionnelle — Système de Billetterie Intelligente

> **Projet :** CCAK L3 — Projet Intégrateur  
> **Stack :** Node.js / Express / MongoDB (Backend) · React / Vite (Frontend)  
> **URL locale :** `http://localhost:5000` (API) · `http://localhost:5173` (Web)  
> **URL réseau :** `http://192.168.2.108:5000` (API) · `http://192.168.2.108:5173` (Web)

---

## 1. Vue d'ensemble de l'application

Le **Système de Billetterie Intelligente** est une plateforme web complète de gestion de transports. Elle permet à une organisation de gérer ses utilisateurs (admins, agents, clients), de vendre des billets et abonnements, et de valider les voyages via des QR Codes.

### Trois rôles distincts

| Rôle | Accès | Description |
|---|---|---|
| **Admin** | Interface d'administration complète | Gère tous les utilisateurs, consulte les statistiques, supervise la billetterie |
| **Agent** | Page de scan uniquement | Valide les billets en scannant les QR Codes au départ |
| **Client** | Espace personnel | Achète des billets/abonnements, consulte son historique |

---

## 2. Frontend — Pages et fonctionnalités

### 2.1 Page de connexion (`/login`)

Accessible à tous, c'est le point d'entrée unique de l'application.

**Fonctionnalités :**
- Formulaire email + mot de passe avec affichage/masquage du mot de passe
- Détection automatique du rôle après connexion → redirection vers la bonne page
- Si première connexion ou mot de passe temporaire → redirection forcée vers `/change-password`
- Messages d'erreur explicites (compte bloqué, identifiants incorrects, etc.)

**Flux de redirection après connexion :**
```
Admin       → /dashboard
Agent       → /agent/scan
Client      → /mes-billets
1ère connex → /change-password  (quel que soit le rôle)
```

---

### 2.2 Page de changement de mot de passe (`/change-password`)

Page obligatoire pour tout utilisateur se connectant avec un mot de passe temporaire (reçu par email).

**Fonctionnalités :**
- Saisie du mot de passe temporaire reçu par email
- Définition d'un nouveau mot de passe personnel (minimum 6 caractères)
- Confirmation du nouveau mot de passe
- Redirection automatique vers l'espace approprié après validation

---

### 2.3 Tableau de bord Admin (`/dashboard`) 🔒 Admin

Page principale de l'administrateur avec des statistiques globales en temps réel.

**Fonctionnalités :**
- **Statistiques utilisateurs** : Total admins, agents, clients (actifs, bloqués, inactifs)
- **Statistiques tickets** : Nombre de billets valides, utilisés, expirés, annulés
- **Statistiques abonnements** : Abonnements actifs, expirés
- **Statistiques voyages** : Nombre de voyages validés aujourd'hui et au total
- Actualisation manuelle possible

---

### 2.4 Gestion des utilisateurs (`/admin/admins`, `/admin/agents`, `/admin/clients`) 🔒 Admin

Un seul composant `UserList` partagé entre les 3 pages selon le rôle cible.

**Fonctionnalités :**

#### Tableau de liste
- Affichage paginé (15 par page) avec navigation
- Avatar avec initiales ou photo de profil
- Badge de statut coloré : `Actif` (vert), `Inactif` (gris), `Bloqué` (orange)
- Filtrage en temps réel par statut et par recherche (email, téléphone, ID)

#### Actions individuelles (par ligne)
| Bouton | Condition d'affichage | Action |
|---|---|---|
| ✅ Activer | Compte non actif | Envoie un email avec mot de passe temporaire, active le compte |
| 🚫 Bloquer | Compte actif | Passe le statut à `bloqué` |
| 🔓 Débloquer | Compte bloqué | Repasse à `actif` |
| ✏️ Modifier | Toujours visible | Ouvre un modal pour modifier nom, prénom, téléphone |
| 🗑️ Supprimer | Compte non supprimé | **Suppression définitive** de la base de données |

#### Actions groupées (sélection multiple)
- **Sélectionner tout** via la case en en-tête
- **Activer en masse** : Active et envoie les emails à tous les sélectionnés
- **Bloquer en masse** : Bloque tous les sélectionnés
- **Supprimer en masse** : Supprime définitivement tous les sélectionnés

#### Création d'utilisateur
- Bouton **"Nouveau [rôle]"** → ouvre un modal de création
- Champs : Nom, Prénom, Email, Téléphone
- Si rôle = `client` : email envoyé automatiquement dès la création
- Si rôle = `admin/agent` : compte créé en `inactif`, activation manuelle requise

#### Import CSV (`Importer CSV`)
- Upload d'un fichier `.csv` avec colonnes : `nom, prenom, email, telephone`
- Rapport détaillé : nombre de créations réussies, lignes en erreur (doublon email, champs manquants)

---

### 2.5 Gestion des tickets (`/admin/tickets`) 🔒 Admin

Vue de tous les billets achetés par tous les clients.

**Fonctionnalités :**
- Liste paginée avec informations client (nom, email)
- Filtrage par statut du ticket : `valide`, `utilisé`, `expiré`, `annulé`
- Affichage du QR Code associé à chaque ticket

---

### 2.6 Gestion des abonnements (`/admin/abonnements`) 🔒 Admin

Vue de tous les abonnements souscrits.

**Fonctionnalités :**
- Liste paginée avec informations client et type d'abonnement
- Filtrage par statut : `actif`, `expiré`

---

### 2.7 Gestion des voyages (`/admin/voyages`) 🔒 Admin

Historique de tous les voyages validés par les agents.

**Fonctionnalités :**
- Liste des scans effectués (ticket, agent, date, heure)
- Filtrage par date et par agent

---

### 2.8 Page de scan QR (`/agent/scan`) 🔒 Agent

Interface dédiée aux agents pour valider les billets à l'embarquement.

**Fonctionnalités :**
- Activation de la caméra pour lire les QR Codes
- Vérification de la validité du billet (signature HMAC)
- Enregistrement du voyage si le billet est valide
- Affichage immédiat du résultat : ✅ Valide / ❌ Invalide / ⚠️ Déjà utilisé

---

### 2.9 Mes Billets (`/mes-billets`) 🔒 Client

Espace du client pour gérer ses billets de transport.

**Fonctionnalités :**
- Achat de ticket simple avec saisie du prix
- Affichage de la liste de tous ses tickets avec leur QR Code
- Statut de chaque ticket : `valide`, `utilisé`, `expiré`, `annulé`
- Téléchargement ou affichage du QR Code pour présentation à l'agent

---

### 2.10 Mes Abonnements (`/mes-abonnements`) 🔒 Client

Espace du client pour ses abonnements.

**Fonctionnalités :**
- Souscription à un abonnement (mensuel, hebdomadaire, etc.)
- Liste de ses abonnements actifs et expirés
- Informations détaillées : date de début, date de fin, type

---

### 2.11 Mon Profil (`/profil`) 🔒 Tous les rôles

Page de gestion du compte personnel.

**Fonctionnalités :**
- Modification des informations personnelles (nom, prénom, téléphone)
- Upload de photo de profil (JPEG, PNG, WebP — 2 Mo max)
- Changement de mot de passe avec validation de l'ancien mot de passe
- Conseils de sécurité intégrés

---

## 3. Backend — API REST

**URL de base :** `http://localhost:5000/api`  
**Authentification :** Token JWT dans l'en-tête `Authorization: Bearer <token>`

### 3.1 Authentification (`/api/auth`)

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `POST` | `/login` | Public | Connexion — retourne un token JWT et les infos utilisateur |
| `GET` | `/me` | Connecté | Retourne le profil de l'utilisateur connecté |
| `PUT` | `/change-password` | Connecté | Change le mot de passe (désactive le flag `premiereConnexion`) |

**Comportement spécial de `/login` :**
- Si le compte client est `inactif` → **activé automatiquement** lors de la première connexion
- Si le compte est `bloqué` → erreur `403`
- Si le compte est `supprimé` → erreur `403`
- Retourne `premiereConnexion: true` si l'utilisateur doit changer son mot de passe

---

### 3.2 Utilisateurs (`/api/users`) 🔒 Admin

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/stats` | Statistiques globales par rôle et par statut |
| `GET` | `/` | Liste paginée avec filtres (rôle, statut, recherche, page) |
| `POST` | `/` | Crée un utilisateur — envoie automatiquement un email si rôle `client` |
| `POST` | `/import-csv` | Import groupé depuis un tableau JSON parsé côté frontend |
| `POST` | `/activate-bulk` | Active plusieurs comptes + envoie les emails en masse |
| `PATCH` | `/bulk-action` | Action groupée : `activer`, `bloquer`, ou `supprimer` (définitif) |
| `GET` | `/:id` | Détails d'un utilisateur |
| `PUT` | `/:id` | Modifie nom, prénom, téléphone |
| `PATCH` | `/:id/status` | Change le statut — si `supprime` → **suppression définitive** (`findByIdAndDelete`) |
| `PATCH` | `/:id/activate` | Force l'activation + génère nouveau mot de passe + renvoie l'email |
| `PUT` | `/me/profile` | Met à jour le profil et la photo de l'utilisateur connecté |

---

### 3.3 Tickets (`/api/tickets`)

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `POST` | `/` | Client | Achète un ticket — génère un QR Code signé (HMAC SHA-256) |
| `GET` | `/mes-tickets` | Client | Liste les tickets de l'utilisateur connecté |
| `GET` | `/` | Admin | Liste tous les tickets avec pagination et filtres |
| `GET` | `/stats` | Admin | Statistiques par statut (valide, utilisé, expiré, annulé) |

**Sécurité QR Code :**  
Chaque ticket contient un identifiant UUID unique et une **signature HMAC SHA-256** générée avec le `JWT_SECRET`. Cela empêche la falsification des QR Codes.

---

### 3.4 Abonnements (`/api/abonnements`)

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `POST` | `/` | Client | Souscrit à un abonnement |
| `GET` | `/mes-abonnements` | Client | Liste les abonnements de l'utilisateur connecté |
| `GET` | `/` | Admin | Liste tous les abonnements avec pagination |
| `GET` | `/stats` | Admin | Statistiques des abonnements |

---

### 3.5 Voyages (`/api/voyages`)

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `POST` | `/scan` | Agent | Scanne un QR Code — vérifie la signature, marque le ticket comme utilisé |
| `GET` | `/mon-historique` | Client | Historique des voyages du client connecté |
| `GET` | `/` | Admin | Tous les voyages enregistrés |
| `GET` | `/stats` | Admin | Statistiques des voyages |

---

## 4. Modèles de données

### Utilisateur (`User`)
| Champ | Type | Description |
|---|---|---|
| `nom` | String | Nom de famille |
| `prenom` | String | Prénom |
| `email` | String | Email unique (identifiant de connexion) |
| `telephone` | String | Numéro de téléphone (optionnel) |
| `role` | Enum | `admin` · `agent` · `client` |
| `statut` | Enum | `actif` · `inactif` · `bloque` |
| `motDePasse` | String | Haché avec bcrypt (jamais retourné dans les réponses) |
| `photo` | String | Chemin vers la photo de profil |
| `premiereConnexion` | Boolean | `true` si l'utilisateur n'a pas encore changé son mot de passe temporaire |
| `motDePasseTemporaire` | Boolean | `true` si le mot de passe actuel est temporaire |

### Ticket (`Ticket`)
| Champ | Type | Description |
|---|---|---|
| `_id` | UUID | Identifiant unique du ticket |
| `utilisateur` | ObjectId | Référence vers l'utilisateur (client) |
| `type` | String | `simple` (extensible) |
| `statut` | Enum | `valide` · `utilise` · `expire` · `annule` |
| `qrCode` | String | Chemin vers l'image PNG du QR Code |
| `qrCodeData` | String | Données encodées dans le QR Code (JSON) |
| `signature` | String | HMAC SHA-256 pour vérification d'authenticité |
| `prix` | Number | Prix payé par le client |

---

## 5. Emails automatiques

Le service `emailService.js` envoie des emails via **Nodemailer + SMTP Gmail**.

| Déclencheur | Destinataire | Contenu |
|---|---|---|
| Création d'un client par l'admin | Le client | Email de bienvenue avec mot de passe temporaire |
| Activation manuelle par l'admin (`/activate`) | L'utilisateur activé | Email avec identifiants (email + mot de passe temporaire) |
| Activation groupée (`/activate-bulk`) | Chaque utilisateur activé | Idem, envoyé en parallèle |

> **Configuration requise :** Un **mot de passe d'application** Gmail (pas le mot de passe du compte) dans la variable `EMAIL_PASS` du fichier `.env`.

---

## 6. Sécurité

| Mécanisme | Implémentation |
|---|---|
| **Authentification** | JWT signé avec `JWT_SECRET`, expire selon `JWT_EXPIRE` (défaut 7j) |
| **Hachage des mots de passe** | bcryptjs avec un salt de 12 rounds |
| **Autorisation par rôle** | Middleware `authorize('admin')` sur chaque route sensible |
| **Anti-falsification QR** | Signature HMAC SHA-256 sur chaque ticket |
| **CORS** | Configuré pour accepter uniquement les origines autorisées |
| **Mots de passe temporaires** | Générés aléatoirement (8 chars, alphanumérique + symboles) |

---

## 7. Variables d'environnement

### Backend (`Backend_PI/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://...        # Connexion MongoDB Atlas
JWT_SECRET=...                       # Clé secrète JWT
JWT_EXPIRE=7d                        # Durée de validité des tokens

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx       # Mot de passe d'application Google

FRONTEND_URL=http://localhost:5173   # Pour CORS
```

### Frontend (`Frontend_PI/.env`)
```env
VITE_API_URL=http://192.168.2.108:5000/api  # URL de l'API backend
```

---

## 8. Démarrage du projet

```bash
# Terminal 1 — Backend
cd Backend_PI
npm install
npm run dev        # Serveur sur http://localhost:5000

# Terminal 2 — Frontend
cd Frontend_PI
npm install
npm run dev        # Interface sur http://localhost:5173
                   # Accessible aussi sur http://192.168.2.108:5173
```
