# 🎫 Système de Billetterie Intelligente — Backend

Ce dossier contient l'API REST développée avec **NodeJS**, **Express** et **MongoDB (Mongoose)**. Cette API gère l'authentification, les abonnements, la génération de billets avec QR Codes, l'importation de fichiers CSV en masse, et l'envoi d'emails d'activation de comptes.

---

## 🛠️ Stack Technique

* **Framework principal** : NodeJS & Express
* **Base de données** : MongoDB via Mongoose (ODM)
* **Authentification** : JSON Web Tokens (JWT) & BcryptJS (hachage des mots de passe)
* **Validation des requêtes** : Express-validator
* **Traitement de fichiers** : Multer & CSV-Parser (pour l'importation d'utilisateurs par CSV)
* **Génération de QR Codes** : node-qrcode
* **Envoi de mails** : Nodemailer (via SMTP Gmail par défaut)
* **Serveur de développement** : Nodemon

---

## 📂 Structure du Projet

```
backend/
├── config/                 # Configurations externes (Base de données, etc.)
│   └── db.js               # Initialisation de la connexion MongoDB Mongoose
├── controllers/            # Logique métier et contrôleurs de routes
│   ├── authController.js   # Authentification (login, modification du premier mot de passe)
│   └── userController.js   # Gestion des utilisateurs (CRUD, importation CSV, statistiques)
├── middleware/             # Middlewares Express
│   └── auth.js             # Validation JWT et contrôle des rôles utilisateurs
├── models/                 # Modèles de données Mongoose (MongoDB)
│   ├── Abonnement.js       # Schéma des abonnements (nombre de voyages ou période)
│   ├── Ticket.js           # Schéma des tickets générés (statut, prix, QR code)
│   ├── User.js             # Schéma des utilisateurs (Admin, Agent, Client)
│   └── Voyage.js           # Schéma de suivi des scans et trajets validés
├── routes/                 # Définition des points d'accès API
│   ├── authRoutes.js       # Points d'accès d'authentification (/api/auth)
│   └── userRoutes.js       # Points d'accès de gestion des utilisateurs (/api/users)
├── services/               # Services tiers autonomes
│   └── emailService.js     # Logique d'envoi d'email d'activation avec Nodemailer
├── uploads/                # Répertoire de stockage des fichiers téléchargés (ex: CSV)
├── .env                    # Fichier de configuration local (secret)
├── .gitignore              # Fichiers exclus du suivi Git (.env, node_modules, uploads/)
├── package.json            # Dépendances et scripts de démarrage npm
└── server.js               # Fichier d'entrée de l'application (serveur Express)
```

---

## ⚙️ Configuration & Installation

### Prérequis
* **Node.js** (v18+)
* **MongoDB** (Local ou instance Atlas)

### 1. Installation des dépendances
Naviguez dans le dossier `backend` et installez les modules requis :
```bash
cd backend
npm install
```

### 2. Configuration de l'environnement (`.env`)
Créez un fichier `.env` à la racine du dossier `backend` et configurez les variables d'environnement nécessaires :
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/billetterie
JWT_SECRET=votre_cle_secrete_jwt
JWT_EXPIRE=7d

# Paramètres SMTP Email (Exemple Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_compte_gmail@gmail.com
EMAIL_PASS=votre_mot_de_passe_d_application

# URL du frontend pour autoriser les requêtes CORS
FRONTEND_URL=http://localhost:5173
```

---

## 🚀 Utilisation

### Mode Développement
Pour lancer le serveur avec **Nodemon** (rechargement automatique lors de modifications de code) :
```bash
npm run dev
```

### Mode Production
Pour démarrer le serveur en production :
```bash
npm start
```
L'API écoutera par défaut sur le port configuré (http://localhost:5000).

---

## 📋 Endpoints de l'API

### Authentification (`/api/auth`)
* `POST /login` : Connexion utilisateur et retour du token JWT.
* `PUT /change-password` : Obligation de changer le mot de passe temporaire lors de la première connexion.

### Utilisateurs (`/api/users`)
* `GET /stats` : Statistiques globales pour le Dashboard (réservé aux admins).
* `GET /` : Liste complète des utilisateurs avec pagination (réservé aux admins).
* `POST /` : Création manuelle d'un utilisateur avec envoi automatique d'un email d'activation (réservé aux admins).
* `POST /import-csv` : Importation groupée d'utilisateurs à partir d'un fichier CSV (réservé aux admins).
* `POST /activate-bulk` : Activation ou réactivation groupée de comptes (réservé aux admins).
* `PATCH /bulk-action` : Suppression ou blocage groupé (réservé aux admins).
* `PUT /me/profile` : Mise à jour du profil de l'utilisateur connecté.
* `GET /:id` : Obtenir un utilisateur spécifique (réservé aux admins).
* `PUT /:id` : Modifier un utilisateur spécifique (réservé aux admins).
* `PATCH /:id/status` : Activer/Désactiver le compte d'un utilisateur (réservé aux admins).
* `PATCH /:id/activate` : Forcer l'activation de compte et réenvoyer l'email d'identifiants (réservé aux admins).
