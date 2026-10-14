/* NEXUS — historique des versions (page « Nouveautés »).
 *
 * La première entrée est la version en ligne : c'est elle qu'affichent le menu, le pied de page
 * et « À propos ». Pour publier une version, ajoutez une entrée EN HAUT de la liste, reportez-la
 * dans CHANGELOG.md (même contenu, pour GitHub) et mettez à jour le badge de version du README.
 *
 *   version  numéro affiché (« 1.10 », « 2.0 »…)
 *   date     date de mise en ligne, AAAA-MM-JJ
 *   title    résumé en quelques mots
 *   changes  [type, texte] — type : 'new' (nouveau) | 'better' (amélioré) | 'fix' (corrigé)
 */
window.NEXUS_CHANGELOG = [
  {
    version: '1.10', date: '2026-10-14', title: 'Les pages perso suivent leurs mots-clés',
    changes: [
      ['better', 'Pages perso : les sites de la page (médias du modèle, sites ajoutés) n’affichent plus que les articles qui parlent de vos mots-clés, en plus de la recherche Google Actualités.'],
      ['new', 'Bandeau en haut de chaque page perso : les mots-clés suivis, le nombre d’articles masqués et un bouton « Tout afficher » pour couper le filtre.'],
      ['new', 'Option dans « Personnaliser » : filtrer ou non les sites de la page par ses mots-clés. Activée par défaut, y compris pour les pages existantes.'],
      ['better', 'Correspondance souple : sans accents ni majuscules, dans n’importe quel ordre, « jeune » trouve « jeunes » ; « PS » ne trouve pas « PSG ».'],
      ['better', 'Nouveaux mots-clés appliqués tout de suite, sans faire passer les anciens articles pour des nouveautés.'],
    ],
  },
  {
    version: '1.9', date: '2026-10-14', title: 'Nouveautés et numéro de version',
    changes: [
      ['new', 'Page « Nouveautés » : l’historique des versions, avec ce qui a changé depuis votre dernière visite.'],
      ['new', 'Numéro de version dans le menu, en bas de page et dans « À propos ».'],
      ['new', 'Quand une nouvelle version est en ligne, une notification et une pastille dans le menu la signalent.'],
      ['better', 'Le menu s’intitule désormais « NEXUS ».'],
      ['new', 'Fichier CHANGELOG.md dans le dépôt GitHub.'],
    ],
  },
  {
    version: '1.8', date: '2026-10-14', title: 'Apps rétro-ingéniérées à utiliser',
    changes: [
      ['new', 'Reverse Apps → Utiliser : 23 apps rétro-ingéniérées (Gadgetbridge, OpenRGB, Asahi Linux, Wine, Photopea…) avec leurs liens officiels, ce qu’il faut et la marche à suivre.'],
      ['new', 'Filtres par domaine (appareils, services, systèmes, fichiers) et par plateforme.'],
      ['fix', 'Téléphone : les sélecteurs trop larges défilent au doigt au lieu d’élargir la page, et les onglets tiennent sur une ligne jusqu’à 320 px.'],
    ],
  },
  {
    version: '1.7', date: '2026-10-14', title: 'Performances',
    changes: [
      ['better', 'Changement de page instantané (environ 80 ms au lieu d’une seconde), et les clics juste après ne sont plus perdus.'],
      ['better', 'Presque plus de calcul quand la page est ouverte sans rien faire, et un défilement plus fluide.'],
      ['better', 'Rafraîchissement léger : les flux inchangés ne sont ni retéléchargés ni réanalysés.'],
      ['better', 'Relais : flux trop lourds allégés (premier chargement de 16,9 à 4,2 Mo) et réponses compressées en ligne.'],
      ['fix', 'Images introuvables : plus de nouvel essai ni de clignotement. Nouvelle adresse du flux Project Zero.'],
    ],
  },
  {
    version: '1.6', date: '2026-10-14', title: 'Classement des IA',
    changes: [
      ['new', 'IA → Classement : les modèles évalués par Artificial Analysis, triables par intelligence, code, agents, prix, contexte, taille ou date de sortie.'],
      ['new', 'Filtres poids ouverts / propriétaires, capacités et créateur ; les meilleurs modèles de chaque catégorie en tête.'],
      ['new', 'Tableau à en-tête fixe sur ordinateur, cartes sur téléphone.'],
    ],
  },
  {
    version: '1.5', date: '2026-10-14', title: 'Pages perso',
    changes: [
      ['new', 'Menu → Créer une page : une page sur le sujet de votre choix, avec son nom, son icône et sa couleur.'],
      ['new', '13 modèles prêts à l’emploi (politique, F1, foot, voiture, sciences…) avec des médias vérifiés.'],
      ['new', 'Mots-clés suivis dans la presse via Google Actualités.'],
      ['new', 'Les pages perso sont incluses dans l’export / import.'],
    ],
  },
  {
    version: '1.4', date: '2026-10-14', title: 'Menu hamburger',
    changes: [
      ['new', 'Un menu latéral remplace la barre d’onglets, sur ordinateur comme sur téléphone, avec les badges de nouveaux articles et les touches 1 à 9.'],
      ['better', 'En-tête sur une seule ligne, qui reste en haut de l’écran. Sur tablette et téléphone, « Auto » et la fréquence passent dans le menu.'],
    ],
  },
  {
    version: '1.3', date: '2026-10-13', title: 'Jouer',
    changes: [
      ['new', 'Reverse Jeux → Jouer : 25 jeux rétro-ingéniérés, avec les liens officiels pour jouer en ligne ou les télécharger, et la marche à suivre.'],
      ['new', 'Filtres : jouables en ligne, gratuits, avec votre copie du jeu.'],
    ],
  },
  {
    version: '1.2', date: '2026-10-13', title: 'À propos et animations',
    changes: [
      ['new', 'Retirez (et rétablissez) n’importe quelle source du catalogue.'],
      ['new', 'Page « À propos » : le but du site, son fonctionnement, vos données, une FAQ et le code source.'],
      ['new', 'Transitions animées entre les pages, cartes qui apparaissent en défilant, intro au chargement.'],
      ['better', '60 cartes à la fois, la suite en descendant.'],
      ['fix', 'Lien « Tout voir » du Radar et date des projets GitHub.'],
      ['new', 'Code publié sous licence MIT, avec un README complet.'],
    ],
  },
  {
    version: '1.1', date: '2026-10-13', title: 'Favoris et sources perso',
    changes: [
      ['new', 'Favoris sur chaque article et projet, conservés même quand l’article disparaît des flux.'],
      ['new', 'Sources perso : un site (son flux est trouvé automatiquement), un flux RSS/Atom ou une recherche Hacker News, avec un aperçu avant l’ajout.'],
      ['new', 'Export / import de vos favoris et de vos sources pour changer d’appareil.'],
    ],
  },
  {
    version: '1.0', date: '2026-10-13', title: 'Première version',
    changes: [
      ['new', 'Veille tech en temps réel : IA, Reverse Apps, Reverse Jeux, Informatique et Cybersécurité, plus le Radar qui résume tout.'],
      ['new', 'Rafraîchissement automatique, recherche et filtres par langue, période et type de source.'],
      ['new', 'Relais Python sans dépendance, à lancer sur son PC ou à héberger sur Render.'],
    ],
  },
];
