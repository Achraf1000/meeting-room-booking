# Politique de sécurité

## Configuration locale

- Ne versionnez jamais les fichiers `.env`.
- Utilisez un `JWT_SECRET` aléatoire d'au moins 32 caractères.
- Utilisez un mot de passe administrateur unique et robuste.
- En production, activez `COOKIE_SECURE=true` et utilisez HTTPS.
- Conservez `DB_ENCRYPT=true` et n'activez `DB_TRUST_SERVER_CERTIFICATE` que pour un environnement local maîtrisé.

## Checklist avant publication

1. Exécuter `git status --short --ignored` et vérifier chaque fichier non suivi ou ignoré.
2. Rechercher les secrets, adresses internes, emails réels et noms d'organisation.
3. Vérifier que seuls `.env.example` et des valeurs factices sont présents.
4. Contrôler les scripts SQL : aucun export, compte réel ou donnée de production.
5. Contrôler toutes les captures d'écran, y compris les métadonnées et notifications visibles.
6. Exécuter `npm audit`, `npm run lint`, `npm run build` et la compilation Python documentée dans le README.

## Signalement

Pour signaler une vulnérabilité, utilisez la fonctionnalité privée **Security advisories** du dépôt GitHub. N'ouvrez pas d'issue publique contenant un secret ou une procédure d'exploitation.
