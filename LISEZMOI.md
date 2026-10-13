# NEXUS — veille tech en temps réel

Site de veille en HTML / CSS / JavaScript pur (ni Node, ni React, rien à compiler).

| Onglet | Contenu |
|---|---|
| Radar | Vue d'ensemble : derniers titres de chaque rubrique, bandeau « en direct », statistiques |
| IA | OpenAI, DeepMind, Google AI, Hugging Face, MIT Tech Review, Ars Technica, The Verge, TechCrunch, Numerama, ActuIA, Simon Willison |
| Reverse Apps | Actualités (Project Zero, Check Point, Trail of Bits, Objective-See, Hackaday, Hacker News, Lobsters, r/ReverseEngineering) + projets GitHub d'apps/API rétro-ingéniérées |
| Reverse Jeux | Actualités (Time Extension, Ars Technica, Hacker News, Hackaday, Lobsters, filtrées par mots-clés) + catalogue GitHub des décompilations de jeux |
| Informatique | Hacker News, Ars Technica, The Verge, LWN, Tom's Hardware, Next, Numerama, 01net, ZDNet, Korben |
| Cybersécurité | CERT-FR (ANSSI), NCSC, BleepingComputer, The Hacker News, ZATAZ, Krebs on Security |
| Sources | Chaque source, son type de fiabilité et son état en direct |

## Lancer

**Double-cliquez sur `lancer.bat`.** Le navigateur s'ouvre sur `http://127.0.0.1:8787/`.
Gardez la fenêtre noire ouverte, c'est le relais. Fermez-la pour arrêter.

Pourquoi un relais ? Les navigateurs interdisent à une page de lire les flux RSS des autres sites (CORS).
`serveur.py` les récupère à sa place. Il n'utilise que la bibliothèque standard de Python : rien à installer.
Il n'écoute que sur votre machine (127.0.0.1) et refuse toute adresse de réseau local.

Sans relais, vous pouvez ouvrir `index.html` directement : seules les sources compatibles s'affichent (Hacker News, GitHub, quelques blogs).

## Héberger en ligne sur Render (gratuit)

Le même `serveur.py` tourne sur Render : quand l'hébergeur fournit la variable `PORT`, il passe en mode hébergé.
Il n'y a aucune dépendance à installer, et `render.yaml` contient déjà toute la configuration.

1. Créez un dépôt **vide** sur GitHub : <https://github.com/new>, par exemple `nexus-veille`, sans README.
2. Envoyez le code depuis ce dossier :
   ```
   git remote add origin https://github.com/VOTRE-COMPTE/nexus-veille.git
   git push -u origin main
   ```
3. Sur <https://dashboard.render.com> : **New + → Blueprint**, connectez GitHub, choisissez le dépôt, puis **Apply**.
   Le site sera en ligne en 1 à 2 minutes sur une adresse du type `https://nexus-veille.onrender.com`.
4. Facultatif : dans Render, ouvrez **Environment** et ajoutez `GITHUB_TOKEN`. Utilisez un jeton GitHub « fine-grained » **sans aucune permission**.
   Il relève la limite de l'API GitHub pour les onglets Projets.

Chaque `git push` redéploie le site automatiquement.

À savoir :
- **Mise en veille** : l'offre gratuite endort le service après 15 minutes sans visite. La visite suivante prend environ une minute à démarrer. Tant qu'un onglet est ouvert, le rafraîchissement automatique le garde éveillé.
- **Sources bloquées** : certains sites bloquent les serveurs d'hébergement (Reddit notamment). Ces sources apparaissent en erreur dans l'onglet Sources, les autres fonctionnent normalement.
- **Sécurité** : en ligne, le relais ne contacte que les domaines présents dans `js/sources.js`, et ne sert que `index.html`, `css/` et `js/`.

## Utilisation

- Bouton rond en haut à droite : rafraîchir maintenant. L'anneau se remplit jusqu'au prochain rafraîchissement automatique.
- Interrupteur **Auto** et menu de fréquence : 30 s, 1 min (par défaut), 2, 5 ou 15 min.
- Raccourcis clavier : `R` rafraîchir, `A` auto, `/` rechercher, `1` à `7` changer d'onglet.
- Cliquez sur une puce de source pour la masquer ou l'afficher. Les filtres FR/EN, période et type de source se trouvent dans la barre d'outils.
- Les nouveaux articles sont marqués « NOUVEAU » pendant 30 minutes. Un compteur s'affiche sur l'onglet concerné.
- Sur les articles en anglais, **Traduire** ouvre la version traduite en français.

## Ajouter ou retirer une source

Tout se trouve dans `js/sources.js`. Copiez une ligne existante, changez `id`, `name`, `url`, `cat`, `type` et `lang`, puis rechargez la page.
Le format de chaque champ est décrit en tête du fichier.

Les sources limitées en requêtes (GitHub, Reddit) ne sont interrogées que toutes les 10 à 15 minutes, quel que soit le réglage du rafraîchissement automatique.
