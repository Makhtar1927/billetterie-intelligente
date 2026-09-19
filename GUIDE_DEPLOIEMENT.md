# 🚀 Guide Complet de Déploiement — Billetterie Intelligente

> Déploiement du **Backend** sur **Render.com** (gratuit) + **Frontend** sur **Vercel** (gratuit)
> MongoDB : **Atlas** (déjà configuré dans votre `.env`)

---

## AVANT DE COMMENCER — Informations

| Élément | Valeur |
|---|---|
| **Dépôt GitHub** | `https://github.com/Makhtar1927/billetterie-intelligente` |
| **MongoDB Atlas** | `mongodb+srv://papemakhtaraidara_db_user:...@cluster0.7cozh2k.mongodb.net` |
| **Dossier backend** | `backend/` |
| **Dossier frontend** | `frontend/` |

---

## PARTIE 1 — Déploiement du Backend sur Render.com

### Étape 1.1 — Créer un compte Render

1. Aller sur **https://render.com**
2. Cliquer sur **"Get Started for Free"**
3. Choisir **"Continue with GitHub"** → autoriser Render à accéder à votre compte GitHub

---

### Étape 1.2 — Créer un nouveau Web Service

1. Dans le dashboard Render, cliquer **"+ New"** → **"Web Service"**
2. Choisir **"Build and deploy from a Git repository"**
3. Cliquer **"Connect"** à côté de `Makhtar1927/billetterie-intelligente`
4. Si le dépôt n'apparaît pas → cliquer **"Configure account"** et autoriser le repo

---

### Étape 1.3 — Configurer le service backend

| Champ | Valeur à saisir |
|---|---|
| **Name** | `billetterie-backend` |
| **Region** | `Frankfurt (EU Central)` |
| **Branch** | `main` |
| **Root Directory** | `backend` ← IMPORTANT |
| **Runtime** | `Node` |
| **Build Command** | `npm ci --omit=dev` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

> Le champ **Root Directory** est crucial. Render ne doit voir que `backend/`, pas la racine du projet.

---

### Étape 1.4 — Configurer les variables d'environnement

Dans la section **"Environment Variables"**, ajouter chaque ligne :

| Clé | Valeur |
|---|---|
| `PORT` | `8000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://papemakhtaraidara_db_user:makhtarpape@cluster0.7cozh2k.mongodb.net/?appName=Cluster0` |
| `JWT_SECRET` | `billetterie_jwt_secret_key_2024_super_secure` |
| `JWT_EXPIRE` | `7d` |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | `papemakhtaraidara@gmail.com` |
| `EMAIL_PASS` | `yonexntwbvvvtmyv` |
| `FRONTEND_URL` | *(laisser vide — à compléter après le frontend)* |

> Ces variables sont privées sur Render et ne sont jamais exposées dans le code source.

---

### Étape 1.5 — Lancer le déploiement

1. Faire défiler vers le bas
2. Cliquer **"Create Web Service"**
3. Render lance le build (3-5 minutes)
4. Suivre les logs dans l'onglet **"Logs"**

Logs attendus :
```
> billetterie-backend@1.0.0 start
> node server.js

🚀 Serveur démarré :
   ➜ Local   : http://localhost:8000
✅ MongoDB connecté : ac-ad8d1sq-shard-00-00.7cozh2k.mongodb.net
```

---

### Étape 1.6 — Vérifier le backend en ligne

Copier l'URL publique (ex: `https://billetterie-backend.onrender.com`)
et tester dans le navigateur :

```
https://billetterie-backend.onrender.com/api/health
```

Réponse attendue :
```json
{"success": true, "message": "🎫 API Billetterie intelligente — Opérationnelle"}
```

> Notez cette URL — elle sera utilisée pour configurer le frontend.

---

### Étape 1.7 — Autoriser Render dans MongoDB Atlas

1. Aller sur **https://cloud.mongodb.com**
2. Cliquer sur votre cluster → **"Network Access"**
3. Cliquer **"+ Add IP Address"**
4. Choisir **"Allow Access from Anywhere"** (`0.0.0.0/0`)
5. Cliquer **"Confirm"**

> Sans cette étape, Render ne peut pas se connecter à Atlas.

---

### Étape 1.8 — Initialiser la base de données (Seed)

Dans Render → onglet **"Shell"** de votre service :
```bash
npm run seed
```

Résultat :
```
✅ Administrateur créé : admin@billetterie.com / admin123
✅ Agent de contrôle créé : agent@billetterie.com / agent123
✅ Client créé : client@billetterie.com / client123
🎉 Base de données initialisée avec succès !
```

---

## PARTIE 2 — Déploiement du Frontend sur Vercel

### Étape 2.1 — Créer un compte Vercel

1. Aller sur **https://vercel.com**
2. Cliquer **"Sign Up"** → **"Continue with GitHub"**
3. Autoriser Vercel à accéder à votre compte GitHub

---

### Étape 2.2 — Importer le projet

1. Dans le dashboard Vercel → **"Add New..."** → **"Project"**
2. Chercher `billetterie-intelligente`
3. Cliquer **"Import"**

---

### Étape 2.3 — Configurer le projet

| Champ | Valeur |
|---|---|
| **Project Name** | `billetterie-frontend` |
| **Framework Preset** | `Vite` (auto-détecté) |
| **Root Directory** | `frontend` ← cliquer "Edit" |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

> Cliquer **"Edit"** à côté de "Root Directory" et taper `frontend`

---

### Étape 2.4 — Ajouter la variable d'environnement

Dans **"Environment Variables"** :

| Clé | Valeur |
|---|---|
| `VITE_API_URL` | `https://billetterie-backend.onrender.com/api` |

> Remplacer l'URL par celle copiée à l'étape 1.6

---

### Étape 2.5 — Déployer

1. Cliquer **"Deploy"**
2. Vercel build (1-2 minutes)
3. URL publique générée : `https://billetterie-frontend.vercel.app`

---

### Étape 2.6 — Finaliser CORS sur Render

Revenir sur Render → **"Environment"** → modifier :
```
FRONTEND_URL = https://billetterie-frontend.vercel.app
```
Render redéploie automatiquement.

---

## PARTIE 3 — Tests Post-Déploiement

| Test | URL / Action | Résultat attendu |
|---|---|---|
| **Backend santé** | `GET /api/health` | `{"success": true}` |
| **Frontend accessible** | Ouvrir l'URL Vercel | Page de connexion visible |
| **Login admin** | `admin@billetterie.com` / `admin123` | Dashboard admin |
| **Login agent** | `agent@billetterie.com` / `agent123` | Interface scan QR |
| **Login client** | `client@billetterie.com` / `client123` | Interface abonnements |
| **Création abonnement** | Via interface client | Abonnement créé |
| **Génération QR** | Via interface client | QR Code affiché |
| **Scan QR valide** | Via interface agent | Voyage validé |
| **Double scan refusé** | Rescanner le même QR | Erreur retournée |

---

## PARTIE 4 — Problèmes fréquents

### Render — Build failed
- **Cause** : Root Directory mal configuré
- **Solution** : Settings → Root Directory → `backend`

### API 500 après déploiement
- **Cause** : MONGODB_URI incorrect ou Atlas bloque l'IP
- **Solution** : Atlas → Network Access → ajouter `0.0.0.0/0`

### Frontend ne parle pas au backend (CORS)
- **Cause** : Variables mal configurées
- **Solution** :
  - Render : `FRONTEND_URL=https://billetterie-frontend.vercel.app`
  - Vercel : `VITE_API_URL=https://billetterie-backend.onrender.com/api`

### Vercel — "Failed to compile"
- **Cause** : Root Directory non défini sur `frontend`
- **Solution** : Project Settings → General → Root Directory → `frontend`

### Render s'endort (plan gratuit)
- **Cause** : Cold start de ~30 secondes après 15 min d'inactivité
- **Solution** : Inscrire sur UptimeRobot (gratuit) pour pinger `/api/health` toutes les 14 min

---

## RÉCAPITULATIF FINAL

| Service | URL |
|---|---|
| **GitHub** | `https://github.com/Makhtar1927/billetterie-intelligente` |
| **Backend** | `https://billetterie-backend.onrender.com` |
| **Health** | `https://billetterie-backend.onrender.com/api/health` |
| **Frontend** | `https://billetterie-frontend.vercel.app` |
| **MongoDB** | `https://cloud.mongodb.com` |
