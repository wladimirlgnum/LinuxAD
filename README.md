# Dashboard de suivi de migration Linux

Tableau de bord interne de suivi du projet de migration Windows → Ubuntu 26.04 LTS + Samba AD DC
(Lot-et-Garonne Numérique).

## Démarrage

```bash
npm run install:all   # installe racine + server + client (à faire une seule fois)
npm run dev           # lance le backend (3001) et le frontend (5173) ensemble
```

L'interface est ensuite disponible sur **http://localhost:5173**.
En dev, Vite proxifie automatiquement `/api` vers le backend Express.

### Mode « déploiement local » (un seul process)

```bash
npm run build   # génère client/dist
npm start       # Express sert l'API + le build statique sur http://localhost:3001
```

## Stack

| Élément  | Choix                                   |
| -------- | --------------------------------------- |
| Frontend | React 19 + Vite 6 + React Router 7      |
| Style    | Tailwind CSS 4 (thème clair)            |
| Backend  | Node.js + Express 4                     |
| Stockage | Fichier JSON (`server/data/db.json`)    |

## Structure

```
├── client/                 # Frontend React (Vite)
│   ├── src/
│   │   ├── api/            # client.js (appels REST) + useApi.js (hook de chargement)
│   │   ├── components/     # Layout, CodeBlock, composants UI partagés
│   │   ├── data/guides.js  # Contenu pédagogique des guides (statique)
│   │   ├── pages/          # Les 5 sections de l'application
│   │   ├── constants.js    # Libellés et styles des statuts
│   │   └── App.jsx         # Routing
│   └── index.html
├── server/                 # Backend Express
│   ├── routes/             # progress, guides, software, workstations, network
│   ├── data/db.json        # Données persistées (pré-remplies avec l'audit)
│   ├── db.js               # Lecture/écriture atomique du JSON
│   └── server.js
└── README.md
```

## Les 5 sections

| Route         | Section                                                          |
| ------------- | ---------------------------------------------------------------- |
| `/`           | Tableau de bord — 9 étapes macro + barre de progression globale   |
| `/reseau`     | Schéma réseau interactif en SVG (survol → infos machine)          |
| `/guides`     | Guides étape par étape (commandes copiables + explications)       |
| `/logiciels`  | Matrice logiciels Windows → Linux, filtrable et modifiable        |
| `/postes`     | Checklists de déploiement, un onglet par poste de travail         |

## API REST

| Méthode      | Endpoint                          | Rôle                                |
| ------------ | --------------------------------- | ----------------------------------- |
| GET          | `/api/progress`                   | Les 9 étapes macro                  |
| PUT          | `/api/progress/:stepId`           | Change le statut d'une étape        |
| GET          | `/api/guides/:stepId`             | Checklist d'un guide                |
| PUT          | `/api/guides/:stepId/items/:id`   | Coche/décoche un item               |
| GET          | `/api/network`                    | Nœuds du schéma réseau              |
| PUT          | `/api/network/nodes/:nodeId`      | Change le statut d'une machine      |
| GET          | `/api/software`                   | Matrice logiciels                   |
| PUT          | `/api/software/:id`               | Change statut / alternative Linux   |
| GET / POST   | `/api/workstations`               | Liste / ajout d'un poste            |
| GET/PUT/DEL  | `/api/workstations/:id`           | Détail, mise à jour, suppression    |

Statuts acceptés : étapes et machines → `todo`, `in_progress`, `done` ;
logiciels → `compatible`, `to_validate`, `to_check`, `blocking`.

## Ajouter un guide

Le contenu des guides est dans `client/src/data/guides.js`, indexé par numéro d'étape.
Un guide se compose d'un `objective`, d'une liste de `prerequisites` et de `sections`,
chaque section contenant des blocs de type `text`, `code` ou `note`.

La checklist de fin d'étape correspondante s'ajoute dans `server/data/db.json`
sous `guides.<numéro>.checklist`.

Seule l'étape 2 (Installation Samba AD DC) est rédigée à ce stade ; les autres
s'ajouteront au fur et à mesure de l'avancement du projet.

## Données

Toutes les données de l'audit sont pré-remplies dans `server/data/db.json` :
9 étapes, 27 logiciels, 4 postes de travail, 4 nœuds réseau.
Les écritures sont atomiques et sérialisées — sauvegardez simplement ce fichier
pour conserver l'état du suivi.
