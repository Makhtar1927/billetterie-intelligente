# Mini-TP : Service Utilisateurs

## 1. Fonctionnalités critiques du service
En analysant le `userController.js` et les autres composants du service utilisateur, nous avons identifié les fonctionnalités critiques suivantes :
- **Création d'utilisateurs et Import CSV** : Ajout d'un ou plusieurs utilisateurs avec validation, vérification des doublons (email) et génération d'un mot de passe temporaire.
- **Activation des comptes** : Activation d'un compte (individuelle ou groupée), génération et envoi par email d'un mot de passe temporaire, et gestion de la première connexion.
- **Gestion des rôles et statuts** : Modification du statut (actif, bloqué, supprimé) pour restreindre ou autoriser l'accès au système (actions unitaires ou groupées).
- **Modification de profil** : Mise à jour des informations personnelles et upload de photo de profil avec suppression de l'ancienne image.
- **Récupération, Filtrage et Statistiques** : Lister les utilisateurs avec pagination et recherche dynamique (par nom, email, rôle, statut) et agrégation de statistiques par rôle/statut.

## 2. Plan de tests
L'objectif du plan de tests est de s'assurer que chaque fonctionnalité critique se comporte correctement, gère bien les erreurs et préserve l'intégrité des données.

### Tests Unitaires
- **Objectif** : Valider la logique métier isolée (ex. filtres de recherche, génération de mots de passe, etc.).
- **Outils** : Jest.
- **Scénario prévu** : Tester la logique de `buildFilter` pour s'assurer que les requêtes MongoDB générées correspondent bien aux critères fournis par l'utilisateur (rôle, statut, recherche).

### Tests d'Intégration (API)
- **Objectif** : Vérifier que les points de terminaison (endpoints) du service utilisateur retournent les bons statuts HTTP et interagissent correctement avec la base de données.
- **Outils** : Jest, Supertest, MongoDB Memory Server.
- **Scénarios prévus** :
  1. `POST /api/users` : Vérifier la création d'un utilisateur et les erreurs si les données sont incomplètes.
  2. `GET /api/users` : Vérifier la récupération de la liste paginée d'utilisateurs.
  3. `PATCH /api/users/:id/status` : Vérifier le changement d'état d'un utilisateur existant (ex. passage à "bloque").

### 3. Tableau de synthèse

| Fonctionnalité | Type de test | Description | Résultat Attendu |
| --- | --- | --- | --- |
| Construction de filtre (`buildFilter`) | Unitaire | Vérifier que la fonction crée le bon objet MongoDB (ex. regex, rôles) | Un objet filtre valide pour Mongoose |
| Créer un utilisateur | API (Intégration) | `POST /api/users` avec un payload valide / invalide | 201 Created (succès) / 400 Bad Request (échec) |
| Lister les utilisateurs | API (Intégration) | `GET /api/users` avec pagination | 200 OK, retourne une structure `data` et `pagination` |
| Changer le statut | API (Intégration) | `PATCH /api/users/:id/status` | 200 OK, retourne le statut modifié pour l'utilisateur |

## 4. Scénario Fonctionnel Complet
**Nom du scénario : "Intégration et activation d'un nouvel agent"**

1. **Création (Administrateur)** : Un administrateur se connecte et navigue vers la page de gestion des utilisateurs. Il remplit le formulaire pour créer un agent (nom, prénom, email, téléphone, rôle=agent). L'API répond par un succès (201) et crée l'utilisateur avec un statut `inactif` et un mot de passe temporaire chiffré généré aléatoirement.
2. **Activation (Administrateur)** : L'administrateur clique sur "Activer" sur le profil du nouvel agent. L'API (`PATCH /api/users/:id/activate`) change le statut à `actif`, génère un nouveau mot de passe temporaire en clair, met à jour la BDD, et envoie un email à l'agent contenant ses identifiants.
3. **Première Connexion (Agent)** : L'agent reçoit l'email, se connecte avec le mot de passe temporaire fourni. Le système détecte `premiereConnexion: true` et l'oblige à définir un nouveau mot de passe définitif avant d'accéder au dashboard complet.
4. **Mise à jour du profil (Agent)** : L'agent accède à son profil et uploade sa photo, qui vient écraser l'éventuelle ancienne photo dans `/uploads/profiles/`.
5. **Désactivation (Administrateur)** : Quelques mois plus tard, l'agent quitte son poste. L'administrateur sélectionne son compte et applique une action groupée (ou individuelle) pour changer le statut à `bloque`. L'agent est immédiatement déconnecté et ne peut plus se connecter.
