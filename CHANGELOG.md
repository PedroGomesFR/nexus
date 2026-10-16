# Journal des versions

Toutes les évolutions de NEXUS, de la plus récente à la plus ancienne. Sur le site, elles sont aussi
visibles dans la page **Nouveautés** (menu → Nouveautés, ou `#nouveautes`).

Pour publier une version : ajoutez-la en haut de [`js/changelog.js`](js/changelog.js) (c'est elle que
le site affiche, et son numéro devient la version en ligne), puis reportez-la ici et mettez à jour
le badge de version du README.

> Les versions 1.3 à 1.8 ont été numérotées après coup, d'après l'historique Git.

## [2.0] · 16 octobre 2026 · Recherche partout, alertes, lu / non lu, application

### Nouveau
- Rechercher partout (Ctrl K ou la loupe en haut) : articles de toutes les rubriques et favoris, projets GitHub, jeux, apps, modèles d'IA, pages et actions, avec les mots trouvés surlignés.
- Alertes : des mots surveillés sur tout le site. Chaque nouvel article qui en parle est signalé, marqué d'une étiquette sur sa carte et rassemblé dans la page Alertes ; notification du navigateur en option.
- Sujets du moment sur le Radar : les noms les plus cités dans les titres des dernières 24 h, par plusieurs sources ; un clic les cherche partout.
- Lu / non lu : un article ouvert s'estompe. Bouton « Non lus » pour masquer ceux déjà lus, et « Tout marquer comme lu » (annulable).
- Partager un article : menu de partage du téléphone, ou lien copié sur ordinateur.
- NEXUS s'installe comme une application (Android, iPhone, ordinateur) et reste lisible hors ligne avec les derniers articles enregistrés.

### Amélioré
- Démarrage immédiat : les polices ne bloquent plus l'affichage quand Google Fonts est lent ou injoignable.
- En-tête toujours sur une ligne, de 320 à 2560 px ; sur petit écran, Auto et la fréquence passent dans le menu dès 1100 px.
- Recherche plus précise : un mot court ne trouve que les mots qui commencent ainsi (« IA » ne trouve plus « fiabilité »).

### Corrigé
- Message des nouveaux articles : « +12 nouveaux articles » au lieu de « nouvels ». Relais local plus robuste quand beaucoup de fichiers sont demandés d'un coup.

## [1.10] · 14 octobre 2026 · Les pages perso suivent leurs mots-clés

### Nouveau
- Bandeau en haut de chaque page perso : les mots-clés suivis, le nombre d'articles masqués et un bouton « Tout afficher » pour couper le filtre.
- Option dans « Personnaliser » : filtrer ou non les sites de la page par ses mots-clés. Activée par défaut, y compris pour les pages existantes.

### Amélioré
- Pages perso : les sites de la page (médias du modèle, sites ajoutés) n'affichent plus que les articles qui parlent de vos mots-clés, en plus de la recherche Google Actualités.
- Correspondance souple : sans accents ni majuscules, dans n'importe quel ordre, « jeune » trouve « jeunes » ; « PS » ne trouve pas « PSG ».
- Nouveaux mots-clés appliqués tout de suite, sans faire passer les anciens articles pour des nouveautés.

## [1.9] · 14 octobre 2026 · Nouveautés et numéro de version

### Nouveau
- Page « Nouveautés » : l'historique des versions, avec ce qui a changé depuis votre dernière visite.
- Numéro de version dans le menu, en bas de page et dans « À propos ».
- Quand une nouvelle version est en ligne, une notification et une pastille dans le menu la signalent.
- Fichier CHANGELOG.md dans le dépôt GitHub.

### Amélioré
- Le menu s'intitule désormais « NEXUS ».

## [1.8] · 14 octobre 2026 · Apps rétro-ingéniérées à utiliser

### Nouveau
- Reverse Apps → Utiliser : 23 apps rétro-ingéniérées (Gadgetbridge, OpenRGB, Asahi Linux, Wine, Photopea…) avec leurs liens officiels, ce qu'il faut et la marche à suivre.
- Filtres par domaine (appareils, services, systèmes, fichiers) et par plateforme.

### Corrigé
- Téléphone : les sélecteurs trop larges défilent au doigt au lieu d'élargir la page, et les onglets tiennent sur une ligne jusqu'à 320 px.

## [1.7] · 14 octobre 2026 · Performances

### Amélioré
- Changement de page instantané (environ 80 ms au lieu d'une seconde), et les clics juste après ne sont plus perdus.
- Presque plus de calcul quand la page est ouverte sans rien faire, et un défilement plus fluide.
- Rafraîchissement léger : les flux inchangés ne sont ni retéléchargés ni réanalysés.
- Relais : flux trop lourds allégés (premier chargement de 16,9 à 4,2 Mo) et réponses compressées en ligne.

### Corrigé
- Images introuvables : plus de nouvel essai ni de clignotement. Nouvelle adresse du flux Project Zero.

## [1.6] · 14 octobre 2026 · Classement des IA

### Nouveau
- IA → Classement : les modèles évalués par Artificial Analysis, triables par intelligence, code, agents, prix, contexte, taille ou date de sortie.
- Filtres poids ouverts / propriétaires, capacités et créateur ; les meilleurs modèles de chaque catégorie en tête.
- Tableau à en-tête fixe sur ordinateur, cartes sur téléphone.

## [1.5] · 14 octobre 2026 · Pages perso

### Nouveau
- Menu → Créer une page : une page sur le sujet de votre choix, avec son nom, son icône et sa couleur.
- 13 modèles prêts à l'emploi (politique, F1, foot, voiture, sciences…) avec des médias vérifiés.
- Mots-clés suivis dans la presse via Google Actualités.
- Les pages perso sont incluses dans l'export / import.

## [1.4] · 14 octobre 2026 · Menu hamburger

### Nouveau
- Un menu latéral remplace la barre d'onglets, sur ordinateur comme sur téléphone, avec les badges de nouveaux articles et les touches 1 à 9.

### Amélioré
- En-tête sur une seule ligne, qui reste en haut de l'écran. Sur tablette et téléphone, « Auto » et la fréquence passent dans le menu.

## [1.3] · 13 octobre 2026 · Jouer

### Nouveau
- Reverse Jeux → Jouer : 25 jeux rétro-ingéniérés, avec les liens officiels pour jouer en ligne ou les télécharger, et la marche à suivre.
- Filtres : jouables en ligne, gratuits, avec votre copie du jeu.

## [1.2] · 13 octobre 2026 · À propos et animations

### Nouveau
- Retirez (et rétablissez) n'importe quelle source du catalogue.
- Page « À propos » : le but du site, son fonctionnement, vos données, une FAQ et le code source.
- Transitions animées entre les pages, cartes qui apparaissent en défilant, intro au chargement.
- Code publié sous licence MIT, avec un README complet.

### Amélioré
- 60 cartes à la fois, la suite en descendant.

### Corrigé
- Lien « Tout voir » du Radar et date des projets GitHub.

## [1.1] · 13 octobre 2026 · Favoris et sources perso

### Nouveau
- Favoris sur chaque article et projet, conservés même quand l'article disparaît des flux.
- Sources perso : un site (son flux est trouvé automatiquement), un flux RSS/Atom ou une recherche Hacker News, avec un aperçu avant l'ajout.
- Export / import de vos favoris et de vos sources pour changer d'appareil.

## [1.0] · 13 octobre 2026 · Première version

### Nouveau
- Veille tech en temps réel : IA, Reverse Apps, Reverse Jeux, Informatique et Cybersécurité, plus le Radar qui résume tout.
- Rafraîchissement automatique, recherche et filtres par langue, période et type de source.
- Relais Python sans dépendance, à lancer sur son PC ou à héberger sur Render.
