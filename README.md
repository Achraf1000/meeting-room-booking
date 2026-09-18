# Meeting Room Booking

Application web full-stack de réservation de salles de réunion, avec circuit de validation, gestion des conflits horaires et administration des salles.

> Ce dépôt est une version portfolio anonymisée. Les marques, identités, infrastructures, documents et données métier de l'organisation d'origine ont été supprimés ou remplacés par des exemples synthétiques.

## Aperçu

L'application centralise les demandes de réservation et donne une visibilité commune sur l'occupation des salles. Elle sépare les parcours collaborateur et administrateur afin de couvrir la demande, l'approbation et la gestion du parc de salles dans une seule interface.

### Fonctionnalités

- inscription et authentification avec access token JWT et refresh token en cookie `HttpOnly` ;
- planification partagée avec filtres par date, salle et statut ;
- détection des chevauchements et contrôle des horaires autorisés ;
- suivi et annulation des demandes par l'utilisateur ;
- approbation ou rejet motivé par un administrateur ;
- gestion des salles, capacités et équipements ;
- profil utilisateur et changement de mot de passe ;
- documentation interactive OpenAPI avec Swagger UI.

## Architecture

```text
React + Vite
     │  API REST / JWT
     ▼
FastAPI
     │  pyodbc + requêtes paramétrées
     ▼
Microsoft SQL Server
```

Le frontend conserve l'access token en mémoire. Le refresh token est transmis dans un cookie `HttpOnly`. Le backend applique le contrôle des rôles et centralise les règles de disponibilité.

## Stack technique

| Couche | Technologies |
|---|---|
| Frontend | React 19, React Router, Axios, Vite, Lucide |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| Sécurité | JWT, Argon2, cookies `HttpOnly`, CORS explicite |
| Données | Microsoft SQL Server, T-SQL, pyodbc |
| Qualité | Oxlint, build Vite, compilation Python |

## Démarrage local

### Prérequis

- Node.js 20 ou version ultérieure ;
- Python 3.11 ou version ultérieure ;
- Microsoft SQL Server ;
- ODBC Driver 18 for SQL Server.

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Remplacez dans `backend/.env` les valeurs `JWT_SECRET` et `DEFAULT_ADMIN_PASSWORD`. Un secret JWT peut être généré ainsi :

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Initialisez ensuite la base et démarrez l'API :

```powershell
python init_db.py
uvicorn main:app --reload --port 8000
```

La documentation Swagger est disponible sur [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend

Dans un second terminal :

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

L'interface est disponible sur [http://localhost:5173](http://localhost:5173).

## Vérifications locales

```powershell
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd ..\backend
python -m compileall -q auth reservations rooms users config.py database.py init_db.py main.py
```

Avant toute publication, vérifiez également que les fichiers `.env`, sauvegardes SQL, exports, journaux, certificats et données réelles ne figurent pas dans `git status`.

## Structure

```text
backend/
├── auth/             # Authentification et autorisation
├── reservations/     # Règles et API des réservations
├── rooms/            # Gestion des salles et équipements
├── users/            # Profils et comptes
├── sql/              # Schéma T-SQL et requêtes nommées
├── config.py         # Configuration par environnement
├── database.py       # Accès SQL Server
└── main.py           # Application FastAPI

frontend/
├── src/api/          # Client Axios et renouvellement du token
├── src/components/   # Composants partagés et planning
├── src/context/      # État d'authentification
└── src/pages/        # Parcours utilisateur et administrateur

docs/screenshots/     # Captures portfolio anonymisées
```

## Captures d'écran

Les captures ne sont pas encore publiées afin d'éviter toute donnée réelle. Le guide [docs/screenshots/README.md](docs/screenshots/README.md) décrit les vues à capturer, les noms de fichiers et les contrôles d'anonymisation.

## Sécurité et confidentialité

- aucune valeur sensible n'est incluse dans le dépôt ;
- les secrets sont chargés depuis `backend/.env`, ignoré par Git ;
- les origines CORS sont configurées explicitement ;
- les connexions SQL chiffrées sont activées par défaut ;
- les mots de passe sont hachés avec Argon2 ;
- les exemples utilisent uniquement des identités et données fictives.

Consultez [SECURITY.md](SECURITY.md) avant une mise en ligne publique.

## Améliorations prévues

- tests automatisés des services et routes API ;
- tests end-to-end des parcours critiques ;
- limitation du débit sur les routes d'authentification ;
- révocation persistante des refresh tokens ;
- conteneurisation de l'environnement de développement.

## Auteur

[Achraf — achraf1000](https://github.com/achraf1000)

Ce projet est présenté à des fins de portfolio. Aucun contenu interne ou donnée de production n'est inclus.
