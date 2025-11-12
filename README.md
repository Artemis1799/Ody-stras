# T5-Back# T5-Back

API REST TypeScript avec Express et PrismaAPI REST TypeScript avec Express et Prisma

## 🚀 Setup initial## 📋 Prérequis

```````bash- **Node.js** (version 18 ou supérieure recommandée)

git clone https://git.unistra.fr/t5-nidhoggr/t5-back.git- **npm** ou **yarn**

cd t5-back- Un éditeur de code (VS Code recommandé)

npm install

cp .env.example .env## 🚀 Installation du projet

npx prisma generate

npx prisma migrate dev### 1️⃣ Cloner le repository

npm run dev

``````bash

git clone https://git.unistra.fr/t5-nidhoggr/t5-back.git

## 🔄 Après un `git pull`cd t5-back

```````

````bash

npm install                # Si package.json a changé### 2️⃣ Installer les dépendances

npx prisma generate        # Si schema.prisma a changé

npx prisma migrate dev     # Applique les nouvelles migrations```bash

```npm install

````

## 📝 Scripts

### 3️⃣ Configurer les variables d'environnement

| Commande | Description |

|----------|-------------|Copier le fichier `.env.example` vers `.env` :

| `npm run dev` | Dev server avec hot reload |

| `npm run build` | Compile TS → JS dans `/dist` |```bash

| `npm start` | Lance le build compilé |cp .env.example .env

| `npm run prisma:generate` | Génère le client Prisma |```

| `npm run prisma:migrate` | Applique/crée les migrations (dev) |

| `npm run prisma:studio` | Interface graphique BDD |Modifier le fichier `.env` si nécessaire (par défaut, SQLite est utilisé en local).

## 🗂️ Structure### 4️⃣ Initialiser la base de données

````Générer le client Prisma :

src/

├── index.ts        # Point d'entrée```bash

└── prisma.ts       # Client Prismanpm run prisma:generate

prisma/```

├── schema.prisma   # Schéma BDD

└── migrations/     # Historique migrationsCréer et appliquer les migrations :

````

```bash

## 🔌 Routesnpm run prisma:migrate

```

- **GET** `/` - Health check

- **GET** `/users` - Liste utilisateurs### 5️⃣ Lancer le serveur

- **POST** `/users` - Créer utilisateur `{ email, name }`

**En mode développement** (avec rechargement automatique) :

## 🗄️ Base de données

```bash

**Par défaut:** SQLite (`prisma/dev.db`)npm run dev

```

**Changer de BDD:** Modifier `prisma/schema.prisma` + `DATABASE_URL` dans `.env`

Le serveur démarre sur `http://localhost:3000` 🎉

## 🛠️ Workflow développement

## 📝 Scripts disponibles

### Modifier le schéma

````bash| Commande                  | Description                                                          |

# 1. Éditer prisma/schema.prisma| ------------------------- | -------------------------------------------------------------------- |

# 2. Créer la migration| `npm run dev`             | Lance le serveur en mode développement avec rechargement automatique |

npx prisma migrate dev --name nom_migration| `npm run build`           | Compile le TypeScript en JavaScript dans `/dist`                     |

```| `npm start`               | Lance le serveur compilé (production)                                |

| `npm run prisma:generate` | Génère le client Prisma                                              |

### Reset BDD| `npm run prisma:migrate`  | Crée et applique les migrations de base de données                   |

```bash| `npm run prisma:studio`   | Ouvre l'interface graphique Prisma Studio                            |

npx prisma migrate reset  # ⚠️ Supprime toutes les données

```## 🗂️ Structure du projet



## 📚 Stack```

t5-back/

TypeScript • Express • Prisma • SQLite├── src/

│   ├── index.ts        # Point d'entrée de l'application
│   └── prisma.ts       # Client Prisma
├── prisma/
│   ├── schema.prisma   # Schéma de la base de données
│   └── migrations/     # Historique des migrations
├── dist/               # Code compilé (non versionné)
├── .env                # Variables d'environnement (non versionné)
├── .env.example        # Exemple de configuration
└── tsconfig.json       # Configuration TypeScript
````

## 🔌 Routes API disponibles

### Routes de test

- **GET** `/` - Vérifier que l'API fonctionne

### Routes utilisateurs (exemples)

- **GET** `/users` - Liste tous les utilisateurs
- **POST** `/users` - Créer un nouvel utilisateur

**Exemple de requête POST** :

```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

## 🗄️ Base de données

### SQLite (par défaut en local)

Le projet utilise SQLite par défaut pour faciliter le développement local.
Le fichier de base de données (`dev.db`) est créé automatiquement dans le dossier `prisma/`.

### Changer de base de données

Pour utiliser PostgreSQL, MySQL ou autre :

1. Modifier `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "postgresql" // ou "mysql"
  url      = env("DATABASE_URL")
}
```

2. Modifier le `DATABASE_URL` dans `.env` :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

3. Regénérer le client et les migrations :

```bash
npm run prisma:generate
npm run prisma:migrate
```

## 🛠️ Développement

### Visualiser la base de données

```bash
npm run prisma:studio
```

Ouvre une interface graphique sur `http://localhost:5555`

### Créer une nouvelle migration

Après avoir modifié `schema.prisma` :

```bash
npm run prisma:migrate
```

## 🚢 Déploiement

### Build pour la production

```bash
npm run build
npm start
```

### Variables d'environnement en production

Assurez-vous de définir :

- `DATABASE_URL` - URL de votre base de données
- `PORT` - Port du serveur (défaut: 3000)
- `NODE_ENV=production`

## 📚 Technologies utilisées

- **TypeScript** - Langage
- **Express** - Framework web
- **Prisma** - ORM
- **Node.js** - Runtime
- **SQLite** - Base de données (par défaut)

## 🤝 Contribution

1. Créer une branche depuis `main`
2. Faire vos modifications
3. Créer une merge request

## 📞 Support

Pour toute question, contactez l'équipe T5-Nidhoggr.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name

Choose a self-explaining name for your project.

## Description

Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges

On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals

Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation

Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage

Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support

Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap

If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing

State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment

Show your appreciation to those who have contributed to the project.

## License

For open source projects, say how it is licensed.

## Project status

If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
