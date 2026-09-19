# 🎤 Guide de Présentation & Soutenance — Billetterie Intelligente (TP 2)

> **Projet** : Système de Billetterie Intelligente pour le Transport Urbain  
> **Niveau** : Licence 3 — CCAK (Projet Intégrateur)  
> **Objectif de la présentation** : Démontrer la maîtrise de la conteneurisation (Docker), de l'intégration continue (CI/CD), du déploiement en production (Render & Vercel) et du parcours métier complet.

---

## ⏱️ Structure & Timing Conseillé (10 à 15 minutes)

| Partie | Titre | Durée estimée |
|---|---|:---:|
| **1** | Introduction & Contexte du Projet | 2 min |
| **2** | Architecture Technique & Conteneurisation (Docker) | 3 min |
| **3** | Déploiement Cloud (Render & Vercel) | 3 min |
| **4** | Démonstration Live du Parcours Métier | 4 min |
| **5** | Conclusion & Perspectives d'Évolution | 1 min |
| **6** | Questions / Réponses (Q&A avec le Jury) | 2-5 min |

---

## 📑 Déroulé Diapo par Diapo avec Script Oral

---

### 🔹 Diapo 1 : Page de Garde & Introduction

#### 🖥️ Contenu sur le slide :
- **Titre** : Système de Billetterie Intelligente
- **Sous-titre** : TP 2 — Dockerisation, Orchestration et Déploiement en Production
- **Auteur(s)** : Pape Makhtar Aïdara (L3 CCAK)
- **Technologies clés** : Node.js/Express • React/Vite • Docker & Docker Compose • MongoDB Atlas • Render • Vercel

#### 🗣️ Ce qu'il faut dire à l'oral :
> *"Bonjour à tous et bienvenue à cette présentation de notre projet intégrateur de billetterie intelligente. Aujourd'hui, nous franchissons une étape décisive : après avoir conçu l'application et mis en place la chaîne d'intégration continue, nous présentons la phase de mise en production réelle, via la conteneurisation Docker, l'orchestration Docker Compose et le déploiement sur une architecture Cloud moderne alliant Render, Vercel et MongoDB Atlas."*

---

### 🔹 Diapo 2 : Problématique & Objectifs du TP 2

#### 🖥️ Contenu sur le slide :
- **Problématique** : Comment garantir qu'une application de billetterie fonctionne de façon identique sur la machine des développeurs, sur les serveurs de test et en production, tout en assurant une haute disponibilité ?
- **Objectifs pédagogiques validés** :
  1. Conteneuriser le backend avec un `Dockerfile` optimisé et sécurisé.
  2. Orchestrer les services avec `docker-compose` (MongoDB + Backend + Healthcheck).
  3. Déployer le backend sous forme de conteneur Docker sur **Render**.
  4. Déployer le frontend SPA moderne sur **Vercel**.
  5. Valider le parcours métier de bout en bout en conditions réelles (HTTPS).

#### 🗣️ Ce qu'il faut dire à l'oral :
> *"Le défi principal auquel nous avons répondu dans ce TP 2 est la reproductibilité et la fiabilité : éliminer le fameux 'ça marche sur ma machine'. Grâce à Docker, chaque dépendance et configuration est encapsulée. Nous avons ensuite poussé cette conteneurisation jusqu'en production, avec un backend résilient et un frontend hautement performant distribué à l'échelle mondiale."*

---

### 🔹 Diapo 3 : Architecture Technique Globale

#### 🖥️ Contenu sur le slide :
```text
┌─────────────────────────┐         HTTPS (CORS)        ┌─────────────────────────┐
│     FRONTEND (Vercel)   │ ──────────────────────────> │   BACKEND (Render)      │
│  - React 18 + Vite      │                             │  - Node.js / Express    │
│  - Tailwind / Dark UI   │                             │  - Docker Node:22-alpine│
│  - SPA Routing (vercel) │                             │  - JWT & bcrypt         │
└─────────────────────────┘                             └───────────┬─────────────┘
                                                                    │ Mongoose
                                                                    ▼
                                                        ┌─────────────────────────┐
                                                        │  BASE DE DONNÉES (Cloud)│
                                                        │  - MongoDB Atlas        │
                                                        │  - Whitelist 0.0.0.0/0  │
                                                        └─────────────────────────┘
```

#### 🗣️ Ce qu'il faut dire à l'oral :
> *"Notre architecture sépare strictement les responsabilités :*
> - *Le **Frontend**, hébergé sur Vercel, est une Single Page Application compilée avec Vite pour un temps de chargement instantané.*
> - *Le **Backend**, hébergé sur Render, est un conteneur Docker exécutant notre API REST Express.*
> - *La **Base de Données**, hébergée sur MongoDB Atlas en cluster managé, garantit la persistance des utilisateurs, abonnements et historiques de voyage.*
> - *Les échanges sont 100% sécurisés en HTTPS, avec gestion rigoureuse des en-têtes CORS et authentification par token JWT porteur."*

---

### 🔹 Diapo 4 : Stratégie de Conteneurisation (Dockerfile & Docker Compose)

#### 🖥️ Contenu sur le slide :
- **Dockerfile optimisé** :
  - Image de base : `node:22-alpine` (légère, surface d'attaque réduite).
  - Gestion du cache Docker : copie de `package*.json` avant le code source.
  - Production clean : `npm ci --omit=dev` (aucune dépendance de test/dev embarquée).
  - Taille finale maîtrisée : **~299 Mo** (contre plus de 1 Go avec une image Debian classique).
- **Fichier `.dockerignore`** :
  - Exclusion stricte de `node_modules`, `.env`, `.git` et fichiers de tests.
- **Docker Compose** :
  - Orchestration locale intégrant MongoDB 7.0 et le backend.
  - Utilisation d'un `healthcheck` pour s'assurer que MongoDB est prêt avant de lancer l'API.

#### 🗣️ Ce qu'il faut dire à l'oral :
> *"Pour le conteneur backend, nous n'avons pas pris une image lourde par défaut. Nous avons choisi Alpine Linux, ce qui nous permet de diviser la taille de l'image par trois. Nous avons également soigné la sécurité en excluant les secrets grâce à `.dockerignore` et en injectant les variables sensibles uniquement au runtime. En local, `docker compose up --build` démarre tout l'écosystème en une seule commande."*

---

### 🔹 Diapo 5 : Déploiement en Production (Render & Vercel)

#### 🖥️ Contenu sur le slide :
- **Backend sur Render** :
  - URL : `https://billetterie-backend-8l7r.onrender.com`
  - Mode d'exécution : Détection native du `Dockerfile` (`Language: Docker`).
  - Variables d'environnement de production injectées (`MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`).
- **Frontend sur Vercel** :
  - URL : `https://billetterie-frontend.vercel.app`
  - Framework : Vite (preset optimisé).
  - Gestion du routage SPA : fichier `vercel.json` avec règles de réécriture pour éviter les erreurs 404 lors du rafraîchissement d'une page.
  - Variable de liaison : `VITE_API_URL` pointant sur l'API Render.

#### 🗣️ Ce qu'il faut dire à l'oral :
> *"Le déploiement est entièrement automatisé et relié à notre dépôt GitHub. Dès qu'un commit arrive sur la branche principale, Vercel et Render reconstruisent automatiquement le service. Nous avons résolu les contraintes spécifiques au déploiement distribué : la configuration fine du CORS pour autoriser le domaine Vercel, et la gestion des réécritures d'URL via vercel.json pour préserver le routeur React."*

---

### 🔹 Diapo 6 : Démonstration Live (Le Parcours Métier)

#### 🖥️ Contenu sur le slide :
- **Scénario de démonstration** :
  1. 🔑 **Authentification** : Connexion Administrateur / Utilisateur via JWT.
  2. 💳 **Souscription** : Choix et validation d'une formule d'abonnement / titre de transport.
  3. 📱 **Génération de QR Code** : Production du QR Code sécurisé infalsifiable.
  4. 🛡️ **Contrôle & Validation** : Scan du QR Code, décrémentation automatique du solde et enregistrement dans l'historique de voyage.
  5. 📊 **Audit & Logs** : Visualisation en direct des logs techniques sur le dashboard Render.

#### 🗣️ Ce qu'il faut dire à l'oral :
> *(Passez sur votre navigateur pour montrer le site réel :)*  
> *"Passons maintenant à la démonstration en direct sur l'environnement de production. Je me rends sur https://billetterie-frontend.vercel.app..."* *(Voir section Scénario Live ci-dessous)*

---

### 🔹 Diapo 7 : Bilan, Bonnes Pratiques & Perspectives

#### 🖥️ Contenu sur le slide :
- **Ce qui a été accompli** :
  - ✅ Conteneurisation complète et validée.
  - ✅ CI/CD connectée à GitHub.
  - ✅ Déploiement multi-cloud (Render + Vercel + Atlas).
  - ✅ Respect strict des critères de sécurité (secrets protégés, CORS, HTTPS).
  - ✅ Documentation exhaustive (`README.md`, `GUIDE_DEPLOIEMENT.md`, `CHECKLIST_DEPLOIEMENT.md`).
- **Perspectives futures** :
  - Migration vers Kubernetes pour la montée en charge horizontale.
  - Intégration d'un cache Redis pour les vérifications ultra-rapides de QR Codes à la volée.
  - Mise en place d'un monitoring avancé avec Prometheus et Grafana.

#### 🗣️ Ce qu'il faut dire à l'oral :
> *"En conclusion, ce TP 2 a permis de transformer un projet académique en une solution logicielle industrielle prête pour le monde réel. L'application est autonome, testée, documentée et accessible publiquement. Je vous remercie pour votre attention et je suis disponible pour répondre à vos questions."*

---

## 🎬 Guide Pratique : Scénario Démo Live (Pas-à-pas devant le jury)

Pour que votre démo soit fluide et sans accroc :

1. **Préparation des onglets avant la soutenance** :
   - Onglet 1 : `https://billetterie-frontend.vercel.app` (page de login ouverte).
   - Onglet 2 : `https://dashboard.render.com` (page Logs de votre backend `billetterie-backend-8l7r`).
   - Onglet 3 : `https://github.com/Makhtar1927/billetterie-intelligente` (montrer la propreté du repo).

2. **Actions à réaliser pendant la démo** :
   - **Étape 1** : Connectez-vous avec `admin@billetterie.com` / `admin123`.
     > *"Vous voyez ici que l'authentification communique directement avec notre API Render et stocke le token JWT."*
   - **Étape 2** : Allez sur les abonnements ou la gestion des billets.
     > *"Les données proviennent en direct de notre cluster MongoDB Atlas."*
   - **Étape 3** : Montrez la génération du QR Code.
     > *"Chaque billet génère un QR code unique associé au compte."*
   - **Étape 4** : Ouvrez l'onglet Render Logs.
     > *"On constate ici en temps réel les requêtes HTTP `POST /api/auth/login 200 OK` et `GET /api/abonnements 200 OK` tracées par notre middleware de journalisation."*

---

## 💡 Anticipation des Questions du Jury (Q&A)

### Q1 : *"Pourquoi avoir utilisé Render et Vercel plutôt qu'une seule machine ou un VPS unique ?"*
> **Réponse modèle** :  
> *"La séparation Frontend (Vercel) et Backend (Render) respecte le paradigme moderne Jamstack / Cloud-Native. Vercel excelle dans la distribution des actifs statiques via un réseau CDN mondial ultra-rapide, tandis que Render fournit un environnement conteneurisé Docker robuste pour notre API Node.js. Cela permet aussi d'échelonner indépendamment le frontend et le backend selon la charge."*

### Q2 : *"Pourquoi utiliser Alpine Linux dans le Dockerfile ?"*
> **Réponse modèle** :  
> *"L'image `node:22-alpine` est construite sur une distribution minimale d'environ 5 Mo. Cela réduit la surface de vulnérabilités (moins de paquets inutiles installés), accélère le temps de téléchargement et de build, et maintient l'image finale à moins de 300 Mo."*

### Q3 : *"Comment avez-vous géré la sécurité des identifiants et clés d'API ?"*
> **Réponse modèle** :  
> *"Aucun fichier `.env` n'est versionné sur Git grâce à notre `.gitignore` et `.dockerignore`. En production, les variables d'environnement (`MONGO_URI`, `JWT_SECRET`, etc.) sont injectées de manière chiffrée via l'interface sécurisée de Render et Vercel."*

### Q4 : *"À quoi sert le fichier `vercel.json` que vous avez ajouté ?"*
> **Réponse modèle** :  
> *"Dans une Single Page Application React utilisant React Router, si l'utilisateur actualise une page comme `/dashboard` ou `/login`, le serveur web cherche un fichier physique à cet emplacement et renvoie une erreur 404. La règle de réécriture dans `vercel.json` redirige toutes les routes vers `/index.html`, laissant le routeur JavaScript côté client afficher la bonne vue."*
