# 🎫 Système de Billetterie Intelligente — Frontend

Ce dossier contient l'interface utilisateur (Client Web) développée en **ReactJS** et construite avec **Vite**. L'application propose un tableau de bord moderne, des pages de gestion pour les utilisateurs, et des outils de génération et d'affichage de QR Codes.

---

## 🛠️ Stack Technique

* **Framework principal** : ReactJS (v18)
* **Outil de build & Dev server** : Vite (v8)
* **Routage** : React Router DOM (v7)
* **Appels API** : Axios
* **Visualisation de données** : Recharts (pour les graphiques du tableau de bord)
* **Composants d'importation** : React Dropzone & PapaParse (pour le traitement des fichiers CSV)
* **Notifications** : React Hot Toast
* **Génération de QR Codes** : `qrcode.react`

---

## 📂 Structure du Projet

```
frontend/
├── public/                 # Fichiers statiques publics (icons, favicon, etc.)
├── src/
│   ├── api/                # Configuration Axios et services API
│   │   ├── axios.js        # Instance Axios configurée avec les intercepteurs
│   │   └── userService.js  # Appels API liés aux utilisateurs et statistiques
│   ├── assets/             # Images et logos
│   ├── components/         # Composants réutilisables
│   │   ├── layout/         # Éléments de structure (Sidebar, etc.)
│   │   └── users/          # Modales d'édition et d'import CSV
│   ├── context/            # Fournisseurs de contexte (AuthContext pour l'authentification)
│   ├── layouts/            # Mises en page globales (AppLayout)
│   ├── pages/              # Pages de l'application
│   │   ├── users/          # Pages de gestion (AdminsPage, AgentsPage, ClientsPage)
│   │   ├── Dashboard.jsx   # Tableau de bord principal avec statistiques
│   │   ├── Login.jsx       # Formulaire de connexion
│   │   └── Unauthorized.jsx# Page d'erreur d'autorisation
│   ├── routes/             # Configuration des routes de l'application
│   │   └── PrivateRoute.jsx# Garde de routage pour la protection des rôles
│   ├── App.jsx             # Composant racine de l'application
│   ├── index.css           # Styles globaux (Design moderne sombre/glassmorphism)
│   └── main.jsx            # Point d'entrée de l'application React
├── .env                    # Fichier de configuration des variables d'environnement
├── .gitignore              # Fichiers et dossiers ignorés par Git
├── index.html              # Fichier HTML principal
├── jsconfig.json           # Configuration des alias d'importation
└── package.json            # Scripts de build et dépendances
```

---

## ⚙️ Configuration & Installation

### Prérequis
* **Node.js** (v18+)
* **npm** ou **yarn**

### 1. Installation des dépendances
Naviguez dans le dossier `frontend` et installez les dépendances requises :
```bash
cd frontend
npm install
```

### 2. Configuration de l'environnement (`.env`)
Créez un fichier `.env` à la racine du dossier `frontend` (si ce n'est pas déjà fait) et configurez l'URL de votre API :
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Utilisation

### Mode Développement
Pour lancer le serveur de développement local avec rechargement à chaud (HMR) :
```bash
npm run dev
```
Par défaut, l'application est accessible à l'adresse : [http://localhost:5173](http://localhost:5173).

### Mode Production
Pour compiler et optimiser l'application pour la mise en production :
```bash
npm run build
```
Les fichiers générés se trouveront dans le dossier `dist/`.

Pour tester localement la version de production construite :
```bash
npm run preview
```

---

## 👥 Rôles et Autorisations supportés

* **Administrateur** (`admin`) : Accès complet à tous les tableaux de bord, statistiques de ventes et de scans, gestion des utilisateurs, importation en masse (CSV) et configuration.
* **Agent** (`agent`) : Interface simplifiée pour le scan des billets et la validation des abonnements.
* **Client** (`client`) : Achat de billets/abonnements et consultation de son historique de voyages.
