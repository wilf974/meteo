# Guide de Contribution

Merci de votre intérêt pour contribuer à MeteoProApp! Ce document fournit les directives pour contribuer au projet.

## Code de Conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite qui promeut un environnement accueillant et inclusif.

## Comment Contribuer

### Signaler des Bugs

1. Vérifiez que le bug n'a pas déjà été signalé dans les issues
2. Ouvrez une nouvelle issue avec:
   - Un titre clair et descriptif
   - Les étapes pour reproduire le bug
   - Le comportement attendu vs actuel
   - Votre environnement (OS, Node version, etc.)
   - Des captures d'écran si pertinent

### Proposer des Fonctionnalités

1. Ouvrez une issue pour discuter de la fonctionnalité
2. Décrivez clairement:
   - Le problème que cela résout
   - La solution proposée
   - Des alternatives considérées

### Pull Requests

1. **Fork** le repository
2. **Créez une branche** depuis `develop`:
   ```bash
   git checkout -b feature/ma-fonctionnalite
   ```
3. **Développez** votre fonctionnalité:
   - Respectez les conventions de code
   - Ajoutez des tests si applicable
   - Mettez à jour la documentation
4. **Testez** votre code:
   ```bash
   npm test
   npm run lint
   ```
5. **Commit** vos changements:
   ```bash
   git commit -m "feat: ajoute nouvelle fonctionnalité"
   ```
6. **Push** vers votre fork:
   ```bash
   git push origin feature/ma-fonctionnalite
   ```
7. **Ouvrez une Pull Request** vers `develop`

### Conventions de Commit

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation uniquement
- `style:` Formatage, points-virgules, etc.
- `refactor:` Refactoring du code
- `test:` Ajout de tests
- `chore:` Maintenance, dépendances

Exemples:
```
feat: ajoute support pour couche pollen
fix: corrige calcul d'opacité des couches
docs: met à jour README avec nouvelles APIs
```

## Standards de Code

### TypeScript

- Utilisez TypeScript strict mode
- Pas de `any` sauf cas exceptionnels documentés
- Types explicites pour les fonctions publiques
- Interfaces pour les objets complexes

### React

- Composants fonctionnels avec hooks
- Props typées avec TypeScript
- Décomposition des gros composants
- Noms de fichiers en PascalCase pour composants

### Styling

- TailwindCSS pour le styling
- Classes utilitaires plutôt que CSS custom
- Responsive design (mobile-first si applicable)
- Dark mode supporté

### Backend

- RESTful API conventions
- Validation des entrées
- Gestion d'erreurs appropriée
- Logging avec Winston
- Documentation des endpoints

## Tests

- Tests unitaires pour la logique métier
- Tests d'intégration pour les APIs
- Coverage minimum: 70%
- Tous les tests doivent passer avant merge

## Documentation

- README à jour
- JSDoc pour fonctions complexes
- Exemples d'utilisation
- API documentation

## Questions?

N'hésitez pas à:
- Ouvrir une issue
- Rejoindre nos discussions
- Contacter les mainteneurs

Merci de contribuer à MeteoProApp! 🌦️
