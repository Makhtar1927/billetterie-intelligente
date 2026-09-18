# 🎫 Système de Billetterie Intelligente

Application web complète pour la gestion d'un système de transport avec génération de billets QR Code, gestion des abonnements et suivi des voyages.

## 🛠️ Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | ReactJS + Vite |
| Backend | NodeJS + Express |
| Base de données | MongoDB (Atlas) |
| Auth | JWT (jsonwebtoken) |
| QR Code | qrcode (Node) + qrcode.react |
| Email | Nodemailer (Gmail) |

## 📂 Structure du projet

```
Projet Integrateur/
├── backend/     → API NodeJS/Express
└── frontend/    → Application ReactJS
```

## 🚀 Lancer le projet

### Backend
```bash
cd backend
npm run dev      # Démarrage avec nodemon
```

### Frontend
```bash
cd frontend
npm run dev      # Démarrage Vite
```

## ⚙️ Configuration

### Backend `.env`
```
PORT=5000
MONGODB_URI=<votre_uri_mongodb_atlas>
JWT_SECRET=<votre_secret_jwt>
EMAIL_USER=<votre_gmail>
EMAIL_PASS=<votre_app_password>
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
```

## 👥 Rôles utilisateurs

| Rôle | Description |
|------|-------------|
| `admin` | Accès complet à la gestion |
| `agent` | Scan et validation des QR Codes |
| `client` | Achat de billets et abonnements |

## 📋 Services

- **Service Utilisateurs** : CRUD admins/agents/clients, import CSV, activation par email
- **Service Billetterie** : Génération QR Code, validation des voyages
- **Service Abonnements** : Abonnements limités (nb voyages) et illimités (période)
