# 🎫 Système de Billetterie Intelligente (TP 2 - Dockerisation & Déploiement)

Application web et API complète pour la gestion d'un système de billetterie de transport multimodal avec génération de QR Codes sécurisés, gestion des abonnements, contrôle des validations en temps réel et journalisation d'audit.

---

## 1. 🏗️ Architecture de la Solution

L'application repose sur une architecture moderne en couches / microservices :
- **Frontend SPA** : Interface utilisateur réactive développée avec React et Vite (port `5173`).
- **Backend API REST** : Serveur d'application Express.js orchestrant les flux métier, l'authentification JWT et la validation des billets (port `8000` ou `5000`).
- **Microservice Abonnements** : Service dédié à la gestion des cycles de vie des abonnements et audits (port `5001`).
- **Base de Données** : MongoDB (local sous conteneur Docker ou hébergé sur MongoDB Atlas).
- **Conteneurisation** : Docker & Docker Compose pour standardiser les environnements de développement et de production.

```
                  ┌───────────────────────┐
                  │      Client Web       │
                  │   React + Vite (SPA)  │
                  └───────────┬───────────┘
                              │ HTTP / REST
                              ▼
                  ┌───────────────────────┐
                  │      Backend API      │
                  │    Express / Node.js  │
                  └──────┬──────────┬─────┘
                         │          │
         ┌───────────────┘          └───────────────┐
         ▼                                          ▼
┌──────────────────┐                       ┌──────────────────┐
│  MongoDB (Atlas  │                       │  Microservice    │
│  ou Docker 7.0)  │                       │  Abonnements     │
└──────────────────┘                       └──────────────────┘
```

---

## 2. 🛠️ Technologies Utilisées

| Composant | Technologie / Outil | Rôle |
|---|---|---|
| **Frontend** | React 18, Vite, React Router, Lucide Icons, HTML5 QR Scanner | Interface utilisateur client, agent et administrateur |
| **Backend** | Node.js (v20+ / v22), Express.js | API REST, gestion métier, sécurité |
| **Base de Données** | MongoDB 7.0, Mongoose ODM | Persistance des données (utilisateurs, abonnements, tickets, logs) |
| **Sécurité** | JWT, bcryptjs, CORS | Authentification sans état et chiffrement des mots de passe |
| **Billetterie & QR** | qrcode, uuid | Génération d'empreintes uniques et de QR Codes sécurisés |
| **Tests Automatisés** | Jest, Supertest | Tests unitaires, d'intégration et couverture de code |
| **Conteneurisation** | Docker, Docker Compose | Création d'images optimisées Alpine et orchestration multi-services |
| **CI / CD** | GitHub Actions | Linting, tests automatisés et pipeline de validation continue |

---

## 3. ⚙️ Variables d'Environnement

### Backend (`backend/.env`)

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/billetterie
# Ou pour Docker Compose :
# MONGO_URI=mongodb://mongo:27017/billetterie
JWT_SECRET=votre_secret_jwt_super_securise
NODE_ENV=development
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_application
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000/api
```

---

## 4. 💻 Installation & Lancement en Local

### 1. Cloner le projet
```bash
git clone https://github.com/Makhtar1927/billetterie-intelligente.git
cd billetterie-intelligente
```

### 2. Backend
```bash
cd backend
npm install
npm run seed     # Initialise les utilisateurs de test
npm run dev      # Démarre l'API en mode développement
```

### 3. Frontend
```bash
cd ../frontend
npm install
npm run dev      # Démarre l'application Vite (http://localhost:5173)
```

---

## 5. 🧪 Exécution des Tests

Les tests unitaires et d'intégration couvrent l'authentification, les modèles utilisateurs, la validation et les permissions :
```bash
cd backend
npm test                 # Exécuter la suite Jest
npm run test:coverage    # Générer le rapport de couverture de code
```

---

## 6. 🐳 Utilisation de Docker

### Étape 1 : Construction de l'image Docker du Backend
Depuis le dossier `backend` :
```bash
cd backend
docker build -t billetterie-backend .
```

### Étape 2 : Exécution d'un conteneur Backend autonome
```bash
docker run -d -p 8000:8000 --name billetterie-backend-app --env-file .env billetterie-backend
```

### Vérifier l'état et les logs
```bash
docker ps
docker logs billetterie-backend-app
```

---

## 7. 🐙 Utilisation de Docker Compose

À la racine du projet, un fichier `docker-compose.yml` orchestre à la fois le serveur MongoDB et l'API Backend :

### Démarrage des services
```bash
docker compose up --build -d
```

### Consultation des logs
```bash
docker compose logs -f backend
```

### Arrêt des services
```bash
docker compose down        # Arrête les conteneurs
docker compose down -v     # Arrête et supprime les volumes persistants
```

---

## 8. 🔄 Pipeline CI/CD avec GitHub Actions

Le workflow `.github/workflows/ci.yml` s'exécute automatiquement sur chaque `push` et `pull_request` sur la branche `main` :
1. **Checkout du dépôt** : Récupération du code source.
2. **Setup Node.js** : Installation de la version 20 LTS.
3. **Installation des dépendances** : Exécution de `npm ci`.
4. **Exécution des tests** : Validation de l'intégrité de l'API avec Jest.

---

## 9. 🚀 Déploiement en Production

### Déploiement du Backend (ex: Render / Railway / VPS)
1. Créer un nouveau Web Service sur la plateforme choisie.
2. Lier le dépôt GitHub `Makhtar1927/billetterie-intelligente`.
3. Spécifier le Root Directory : `backend`.
4. Configurer les variables d'environnement de production :
   - `PORT=8000`
   - `NODE_ENV=production`
   - `MONGO_URI=<Chaine_Connexion_MongoDB_Atlas>`
   - `JWT_SECRET=<Cle_Secrete_Production>`
   - `FRONTEND_URL=<URL_Frontend_Deploye>`
5. Déployer et tester l'endpoint de diagnostic : `GET https://votre-backend.onrender.com/api/health`.

### Déploiement du Frontend (ex: Vercel / Netlify)
1. Importer le dépôt sur Vercel ou Netlify.
2. Définir le Root Directory : `frontend`.
3. Configurer la variable d'environnement :
   - `VITE_API_URL=https://votre-backend.onrender.com/api`
4. Lancer le déploiement et accéder à l'application en ligne.

---

## 10. 🛣️ Routes Principales de l'API

| Méthode | Route | Description | Accès |
|---|---|---|---|
| `GET` | `/api/health` | Vérification de l'état de l'API | Public |
| `POST` | `/api/auth/login` | Connexion utilisateur (retourne le token JWT) | Public |
| `POST` | `/api/auth/register` | Inscription d'un nouveau client | Public |
| `GET` | `/api/users/profile` | Récupération du profil connecté | Authentifié |
| `GET` | `/api/abonnements` | Liste des formules et abonnements de l'utilisateur | Authentifié |
| `POST` | `/api/abonnements` | Souscription d'un abonnement | Client |
| `POST` | `/api/tickets/generate` | Génération d'un billet avec QR Code | Client |
| `POST` | `/api/voyages/valider` | Validation et scan d'un QR Code | Agent / Admin |
| `GET` | `/api/voyages/historique`| Historique des voyages et validations | Authentifié |
| `GET` | `/api/audits` | Consultation des journaux d'audit de sécurité | Admin |

---

## 11. 👤 Comptes de Test (Pré-remplis via `npm run seed`)

| Rôle | Email | Mot de passe | Permissions |
|---|---|---|---|
| **Admin** | `admin@billetterie.com` | `admin123` | Gestion globale, utilisateurs, formules, audits |
| **Agent** | `agent@billetterie.com` | `agent123` | Scan de QR Codes et validation des voyages |
| **Client** | `client@billetterie.com` | `client123` | Achat de billets/abonnements, consultation des QR |

---

## 12. ⚠️ Problèmes Rencontrés & Solutions

1. **Différences de nommage de variable d'environnement MongoDB (`MONGODB_URI` vs `MONGO_URI`)** :
   - *Solution* : Mise en place d'un fallback `process.env.MONGODB_URI || process.env.MONGO_URI` dans la configuration Mongoose (`config/db.js`) et dans le script de seed.
2. **Délai d'initialisation de MongoDB dans Docker Compose** :
   - *Solution* : Ajout d'une stratégie de reconnexion automatique avec retries dans `config/db.js` pour tolérer le temps de démarrage du conteneur `mongo`.
3. **CORS & Multi-origines en production** :
   - *Solution* : Configuration dynamique des origines CORS dans Express pour accepter les requêtes de l'URL du frontend déployé ainsi que de localhost en environnement de dev.

---

## 13. 🔮 Améliorations Possibles

- Ajout de certificats SSL avec reverse proxy Nginx ou Traefik en conteneur.
- Mise en place d'un cache Redis pour stocker les scans de billets et accélérer le contrôle anti-rejeu.
- Notifications push et alertes SMS lors de l'expiration d'un abonnement.
- Application mobile Flutter / React Native pour le terminal de contrôle des agents.
