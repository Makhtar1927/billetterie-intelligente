# 📋 Checklist Post-Déploiement — Billetterie Intelligente (TP 2)

Ce document récapitule les vérifications effectuées après la dockerisation et le déploiement de la solution Billetterie Intelligente.

---

## 1. Tableau de Vérification Post-Déploiement

| Élément à vérifier | État | Commentaire / Preuve technique |
|---|:---:|---|
| **Frontend accessible en ligne** | ✅ Oui | Déployé sur Vercel / Netlify avec certificat HTTPS actif. |
| **Backend accessible en ligne** | ✅ Oui | API Express accessible via URL publique (Render / Railway / VPS). |
| **MongoDB connecté** | ✅ Oui | Connexion établie avec succès à la base MongoDB (Atlas en prod / conteneur Mongo en local). |
| **Connexion utilisateur fonctionnelle** | ✅ Oui | Authentification JWT fonctionnelle (génération et validation de token Bearer). |
| **Création utilisateur fonctionnelle** | ✅ Oui | Création de compte (client, agent, admin) avec hashage de mot de passe bcrypt. |
| **Création abonnement fonctionnelle** | ✅ Oui | Souscription à des formules (carnet de voyages ou illimité mensuel/hebdomadaire). |
| **Génération QR Code fonctionnelle** | ✅ Oui | Génération de QR Code sécurisé avec payload chiffré/signé et stockage de l'image. |
| **Scan QR Code valide accepté** | ✅ Oui | Validation du voyage par un agent avec statut HTTP 200 et billet valide. |
| **Double scan refusé** | ✅ Oui | Protection anti-rejeu : un QR Code déjà scanné récemment ou utilisé est refusé (HTTP 400). |
| **Solde insuffisant refusé** | ✅ Oui | Billet/abonnement à 0 trajet restant rejeté lors du scan. |
| **Abonnement expiré refusé** | ✅ Oui | Abonnement dont la date de fin est dépassée rejeté lors du scan. |
| **Utilisateur bloqué refusé** | ✅ Oui | Compte désactivé ou suspendu impossible de scanner ou de voyager. |
| **Historique enregistré** | ✅ Oui | Chaque scan ou validation est tracé dans la collection des voyages (`Voyage`). |
| **Logs disponibles** | ✅ Oui | Journalisation structurée des requêtes HTTP et logs d'audit des actions critiques. |
| **Variables sensibles non exposées** | ✅ Oui | `.env` exclu via `.gitignore` et `.dockerignore`, secrets configurés sur la plateforme d'hébergement. |
| **README mis à jour** | ✅ Oui | Documentation complète des commandes Docker, variables d'environnement, endpoints et tests. |

---

## 2. Parcours Métier Validé

```text
Création utilisateur
        ↓
    Connexion (JWT)
        ↓
  Création abonnement
        ↓
  Génération QR Code
        ↓
    Scan QR Code
        ↓
Décrémentation du solde (si limité)
        ↓
Historique de validation
        ↓
   Logs & Audit
```

---

## 3. Informations d'Hébergement et d'Environnement

- **URL Backend de production** : `https://billetterie-backend-8l7r.onrender.com`
- **URL Frontend de production** : `https://billetterie-frontend.vercel.app`
- **Plateforme Backend** : Render (Docker runtime)
- **Plateforme Frontend** : Vercel (Vite SPA)
- **Base de données** : MongoDB Atlas (Production) / Docker Mongo 7 (Local)
