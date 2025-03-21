# Bioforce Assistant

Une application Electron pour l'équipe de communication de Bioforce, permettant de générer des réponses aux questions et commentaires des utilisateurs.

## Fonctionnalités

- **Génération de réponses**: Recherche automatique des réponses à partir d'une base de connaissances (FAQ)
- **Intégration avec ChatGPT**: Utilise l'API OpenAI pour générer des réponses contextuelles
- **Ajout à la base de connaissances**: Interface pour ajouter de nouvelles entrées à la FAQ
- **Mode test**: Permet de tester les fonctionnalités sans modifier la base de données principale

## Installation

### Prérequis

- Node.js (version 14 ou supérieure)
- npm (inclus avec Node.js)

### Étapes d'installation

1. Clonez le dépôt
```bash
git clone https://github.com/votre-compte/bioforce-assistant.git
cd bioforce-assistant
```

2. Installez les dépendances
```bash
npm install
```

3. Configuration des variables d'environnement
Créez un fichier `.env` à la racine du projet et ajoutez votre clé API OpenAI:
```
OPENAI_API_KEY=votre_clé_api_openai
```

4. Démarrez l'application
```bash
npm start
```

## Mode test

L'application dispose d'un mode test qui vous permet d'essayer les fonctionnalités sans impacter la base de données principale.

Pour lancer l'application en mode test:
```bash
NODE_ENV=test npm start
```

Le fichier de test se trouve à `data/bioforce-faq-test.json` et sera créé automatiquement s'il n'existe pas.

## Structure du projet

```
bioforce-assistant/
│
├── electron/                      # Code du processus principal Electron
│   ├── main.js                    # Point d'entrée d'Electron
│   └── preload.js                 # Script de préchargement (API sécurisée)
│
├── src/                           # Code du processus de rendu
│   ├── index.html                 # Interface utilisateur principale
│   ├── css/
│   │   └── styles.css             # Styles de l'application
│   ├── js/
│   │   └── app.js                 # Logique de l'application côté client
│   └── assets/                    # Images et ressources
│       └── bioforce-logo.png      # Logo de Bioforce
│
├── data/                          # Données de l'application
│   └── bioforce-faq.json          # Base de données FAQ en JSON
│
├── package.json                   # Configuration npm et electron-builder
└── README.md                      # Documentation (ce fichier)
```

## Fonctionnement détaillé

### Génération de réponse

1. L'utilisateur saisit une question ou un commentaire dans la zone de texte
2. En cliquant sur "Générer une réponse", l'application:
   - Recherche dans la base de connaissances existante
   - Utilise l'API ChatGPT pour contextualiser la réponse
   - Affiche la réponse générée avec des métadonnées utiles

### Ajout à la base de connaissances

1. Cliquez sur le bouton "Ajouter à la base de connaissances"
2. Remplissez le formulaire qui apparaît:
   - Catégorie (LEARN ou BUILD)
   - Sous-catégorie
   - Sous-catégorie secondaire (optionnelle)
   - Question
   - Réponse
   - Mots-clés (séparés par des virgules)
3. Validez pour enregistrer dans la base de données

### API exposées

L'application expose plusieurs API via le script de préchargement:

- `getFAQData()`: Récupère les données de la FAQ
- `addToFAQ(newEntry)`: Ajoute une entrée à la FAQ
- `callOpenAI(payload)`: Effectue un appel à l'API OpenAI

## Compilation pour la production

Pour créer une version exécutable de l'application:

```bash
npm run build
```

Cela générera des fichiers exécutables dans le dossier `dist/` selon votre système d'exploitation.

## Développements futurs

- Intégration avec d'autres réseaux sociaux
- Adaptation du format de réponse selon la plateforme (Twitter, LinkedIn, etc.)
- Statistiques d'utilisation et d'efficacité
- Interface d'édition des entrées existantes

## Licence

MIT © GB