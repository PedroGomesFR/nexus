# Règles pour les agents IA

NEXUS est un site de veille tech : une page en HTML / CSS / JavaScript pur et un petit relais Python
(`serveur.py`) qui récupère les flux RSS à la place du navigateur. Le [README](README.md) décrit les
fonctionnalités ; ce fichier dit comment travailler dessus sans rien casser.

## Ce qui ne se négocie pas

- **Zéro dépendance, zéro compilation.** Pas de npm, pas de pip, pas de framework, pas de bibliothèque
  chargée depuis un CDN, pas d'étape de build. `serveur.py` n'utilise que la bibliothèque standard.
  Si une tâche semble demander une dépendance, demandez d'abord.
- **Python 3.8 minimum.** La machine de développement a une version plus récente : n'en profitez pas.
  Interdits : `match`, `str.removeprefix()`, `dict | dict`, `list[str]` évalué à l'exécution, `zoneinfo`.
- **Scripts classiques, pas de modules.** `index.html` doit aussi fonctionner ouvert directement
  (`file://`, « mode direct »), où `type="module"` et `import` ne marchent pas. Les fichiers de données
  exposent des globales (`window.NEXUS`, `window.NEXUS_GAMES`…) chargées **avant** `js/app.js`.
- **Vie privée.** Aucun compte, aucun cookie de suivi, aucune statistique, aucun appel vers un service
  tiers en plus de ceux listés dans le README (images des articles, Google Fonts, Google Traduction au
  clic, Google Actualités via le relais). Les données de l'utilisateur restent dans son navigateur.
- **Lecteur RSS, pas copieur.** On affiche un titre, un extrait et un lien vers l'article d'origine,
  jamais le texte intégral.

## Où modifier quoi

| Pour… | Fichier |
|---|---|
| Ajouter / retirer une source d'une rubrique | `js/sources.js` (champs documentés en tête du fichier) |
| Un modèle de page perso (F1, foot…) | `js/themes.js` |
| Un jeu de la vue « Jouer » / une app de « Utiliser » | `js/games.js` / `js/apps.js` |
| Une version et ses nouveautés | `js/changelog.js` + `CHANGELOG.md` + badge du README |
| Le comportement de l'interface | `js/app.js` (sections `// ───────── Titre ─────────`) |
| L'apparence | `css/style.css` (couleurs dans `:root`, `--c` = couleur de la rubrique active) |
| Le relais, le cache, les fichiers servis | `serveur.py` |
| Hors ligne, installation | `sw.js`, `manifest.webmanifest`, `icons/` |

**Nouveau fichier JS** : l'ajouter dans `index.html` (avant `app.js` si c'est des données) **et** dans la
liste `SITE` de `sw.js`. **Nouveau fichier à la racine** à rendre public : l'ajouter à `PUBLIC_FILES`
dans `serveur.py`, sinon il répond 404 (voulu : seul le site est servi, pas `.git` ni la configuration).

## Sécurité

- **Tout contenu externe est hostile** : flux, API, `localStorage`, fichier importé. Avant un
  `innerHTML`, passez chaque texte par `esc()` et chaque lien ou image par `safeUrl()` (n'accepte que
  `http(s)`). N'insérez jamais le HTML d'un flux tel quel.
- **Les données importées ou relues sont nettoyées** (`cleanFav`, `cleanPage`, `safeUrl`, longueurs
  bornées). Faites pareil pour tout nouveau champ.
- **Le relais n'est pas un proxy ouvert.** Ne retirez ni n'affaiblissez : `check_url()` sur chaque
  requête et chaque redirection (`SafeRedirect`), le refus des adresses non publiques, la limite de
  débit et le filtre « flux RSS/Atom uniquement » pour les domaines hors catalogue, la liste blanche
  des fichiers servis, la vérification de l'en-tête `Host` en local (DNS rebinding), `MAX_BYTES`.
- **Le catalogue élargit la confiance.** `allowed_hosts()` considère comme sûr tout domaine écrit en
  `https://…` dans `js/sources.js` et `js/themes.js`, **commentaires compris**. N'y écrivez donc que des
  adresses de vraies sources.
- **Secrets** : `GITHUB_TOKEN` vient uniquement de l'environnement et part en en-tête non redirigé.
  Aucun jeton, clé ou mot de passe dans le dépôt.
- `sw.js` ne met jamais en cache `/api/…`.

## Données du navigateur

- Clés `localStorage` préfixées `nexus.` (liste en tête de `js/app.js`). Lecture et écriture par
  `readJSON(clé, valeurDéfaut)` / `writeJSON()`, qui tolèrent un stockage absent, plein ou corrompu.
- **Des visiteurs ont déjà des données enregistrées.** Ne renommez pas une clé et ne changez pas la
  forme d'une valeur sans relire l'ancienne forme. Une nouvelle option doit avoir une valeur par défaut
  sensée pour les pages et réglages existants.
- Une donnée qui doit suivre l'utilisateur d'un appareil à l'autre va dans `exportData()` **et**
  `importData()`. Une ancienne sauvegarde doit toujours s'importer.

## Relais (`serveur.py`)

- Il tourne sur l'offre gratuite de Render : mémoire limitée, mise en veille. Toute structure gardée en
  mémoire doit être bornée (comme `CACHE_MAX` et `_hits`).
- **Ménagez les sources.** Ne baissez pas `FRESH_FOR_HOST`, `minAge` ni les durées de cache des sources à
  quota (GitHub, Reddit, Google Actualités, OpenRouter) ; gardez les requêtes conditionnelles (ETag).
- Style du fichier : commentaires et messages **sans accents**, comme le reste du fichier.
- `python serveur.py` ouvre un navigateur : en agent, lancez `python serveur.py --no-browser`.

## Interface et textes

- **Tout ce que voit l'utilisateur est en français**, en phrases simples, sans jargon. Dans les chaînes
  de l'interface (`js/*.js`) : apostrophe typographique `’` et guillemets `« »`.
- **Mobile d'abord** : la page doit tenir sans défilement horizontal de 320 px à 2560 px, l'en-tête sur
  une ligne. Respectez `prefers-reduced-motion` pour toute nouvelle animation.
- **Performances** (travaillées en 1.7) : mettez à jour le DOM de façon ciblée plutôt que de tout
  redessiner, gardez l'affichage par lots (`PAGE = 60`) et la limite de requêtes simultanées
  (`CONCURRENCY`). Page ouverte sans rien faire : pas de calcul en dehors du rafraîchissement des flux.
- Couleurs : utilisez les variables de `:root` plutôt que de nouvelles valeurs en dur.
- Commentaires en français, qui expliquent le *pourquoi*. Quand vous ajoutez un champ à un fichier de
  données, documentez-le dans le commentaire en tête du fichier.

## Contenu : sources, jeux, apps

- **Une source doit être fiable** (éditeur reconnu, équipe de recherche, publication officielle) et
  son `type` honnête (`officiel`, `presse`, `recherche`, `expert`, `communaute`, `projet`).
- **Vérifiez chaque flux avant de l'ajouter** : il répond, ses articles sont datés et récents. Ne
  devinez jamais une adresse de flux. Si vous ne pouvez pas la vérifier, dites-le.
- **Jeux et apps : liens officiels uniquement** (site ou dépôt du projet). Jamais de ROM, de fichiers de
  jeu ou de logiciel piraté, ni de lien qui y mène. Le champ `needs` dit honnêtement ce qu'il faut fournir.
- **Une source généraliste se filtre** pour coller à sa rubrique, avec les filtres de `js/sources.js`
  (`topic`, `inTitle`, `fromSites`, `all`, `some`) plutôt qu'une regex ad hoc. Avant de modifier un filtre,
  regardez sur le flux réel ce qu'il garde **et** ce qu'il rejette : la liste `GAME` sert aussi à exclure
  les jeux de Reverse Apps, un mot à double sens (« descent », « GB ») y fait des dégâts.
- Les nombres affichés dans le README (57 sources, 25 jeux, 23 apps, 13 modèles) et son tableau des
  sources doivent suivre le catalogue.

## Publier une version

Ne créez pas de version de votre propre chef. Quand on vous le demande :

1. nouvelle entrée **en haut** de `js/changelog.js` (`version`, `date` en AAAA-MM-JJ, `title`,
   `changes` de type `new` / `better` / `fix`) ; c'est elle qui devient la version affichée sur le site ;
2. même contenu dans `CHANGELOG.md` (date en toutes lettres, sections Nouveau / Amélioré / Corrigé) ;
3. badge de version en haut du `README.md`.

Les textes de version s'adressent aux visiteurs : ce qui change pour eux, pas comment c'est codé.

## Vérifier avant de rendre la main

Il n'y a pas de suite de tests. Au minimum :

```bash
node --check js/app.js            # pour chaque fichier JS modifié, si Node est installé
python -m py_compile serveur.py   # si serveur.py a changé
python serveur.py --no-browser    # puis http://127.0.0.1:8787/ (port suivant si 8787 est pris)
```

Ensuite, dans le navigateur : console sans erreur, la page touchée fonctionne sur ordinateur et à
320 px de large, `/api/ping` répond. Si vous n'avez pas pu tester dans un vrai navigateur, dites-le
plutôt que d'affirmer que ça marche.

## Fichiers et Git

- Fichiers en UTF-8 sans BOM, fins de ligne LF ; `lancer.bat` reste en CRLF (`.gitattributes`). Sous
  Windows PowerShell 5.1, n'écrivez pas de fichiers avec `Set-Content` / `Out-File` (encodage ANSI ou BOM).
- Ne modifiez pas `LICENSE`. Les captures de `docs/` ne se régénèrent pas seules : signalez celles
  qu'un changement d'interface rend fausses.
- Messages de commit en français, au format `Sujet : ce qui change`
  (ex. `Pages perso : une page sur le sujet de son choix`).
- **Un `git push` sur `main` met le site en ligne** (Render, `autoDeploy: true`). Ne poussez jamais sans
  qu'on vous l'ait demandé.
