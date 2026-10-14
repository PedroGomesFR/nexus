/* NEXUS — modèles de pages perso (bouton « Créer une page » du menu).
 * Un modèle préremplit une page : nom, icône, couleur, mots-clés Google Actualités et sources recommandées.
 * Les flux ont été vérifiés (en ligne, articles datés et récents). Le relais (serveur.py) relaie aussi
 * les domaines cités dans ce fichier.
 * keywords : filtre facultatif d'une source (mots séparés par des virgules, l'un ou l'autre suffit).
 */
window.NEXUS_THEMES = [
  {
    id: 'politique', label: 'Politique', icon: 'landmark', color: '#4d8dff', query: '',
    sources: [
      { name: 'Le Monde · Politique', site: 'https://www.lemonde.fr/politique/', url: 'https://www.lemonde.fr/politique/rss_full.xml' },
      { name: 'Le Figaro · Politique', site: 'https://www.lefigaro.fr/politique', url: 'https://www.lefigaro.fr/rss/figaro_politique.xml' },
      { name: 'Libération · Politique', site: 'https://www.liberation.fr/politique/', url: 'https://www.liberation.fr/arc/outboundfeeds/rss-all/category/politique/?outputType=xml' },
      { name: 'franceinfo · Politique', site: 'https://www.francetvinfo.fr/politique/', url: 'https://www.francetvinfo.fr/politique.rss' },
      { name: 'LCP · Assemblée nationale', site: 'https://www.lcp.fr/', url: 'https://www.lcp.fr/rss.xml' },
    ],
  },
  {
    id: 'politique-jeunes', label: 'Politique jeunes', icon: 'users', color: '#ff2bd6',
    query: 'jeunes politique, jeunesse élections, génération Z politique',
    sources: [
      { name: 'Le Monde · Jeunesses', site: 'https://www.lemonde.fr/campus/', url: 'https://www.lemonde.fr/campus/rss_full.xml' },
      { name: 'Le Monde · Politique (jeunes)', site: 'https://www.lemonde.fr/politique/', url: 'https://www.lemonde.fr/politique/rss_full.xml', keywords: 'jeune, étudiant, lycéen, génération, gen z, primo-votant' },
      { name: 'franceinfo · Politique (jeunes)', site: 'https://www.francetvinfo.fr/politique/', url: 'https://www.francetvinfo.fr/politique.rss', keywords: 'jeune, étudiant, lycéen, génération, gen z, primo-votant' },
      { name: 'franceinfo · Éducation', site: 'https://www.francetvinfo.fr/societe/education/', url: 'https://www.francetvinfo.fr/societe/education.rss' },
    ],
  },
  {
    id: 'voiture', label: 'Voiture', icon: 'car', color: '#ffb020', query: '',
    sources: [
      { name: 'L’Auto-Journal', site: 'https://www.autojournal.fr/', url: 'https://www.autojournal.fr/feed' },
      { name: 'Auto Plus', site: 'https://www.autoplus.fr/', url: 'https://www.autoplus.fr/feed' },
      { name: 'Motor1 France', site: 'https://fr.motor1.com/', url: 'https://fr.motor1.com/rss/news/all/' },
      { name: 'Automobile Propre', site: 'https://www.automobile-propre.com/', url: 'https://www.automobile-propre.com/feed/' },
      { name: 'Le Monde · Automobile', site: 'https://www.lemonde.fr/automobile/', url: 'https://www.lemonde.fr/automobile/rss_full.xml' },
    ],
  },
  {
    id: 'f1', label: 'F1', icon: 'flag', color: '#ff4d6d', query: '',
    sources: [
      { name: 'L’Équipe · Formule 1', site: 'https://www.lequipe.fr/Formule-1/', url: 'https://dwh.lequipe.fr/api/edito/rss?path=/Formule-1/' },
      { name: 'Motorsport.com · F1', site: 'https://fr.motorsport.com/f1/', url: 'https://fr.motorsport.com/rss/f1/news/' },
      { name: 'f1i', site: 'https://f1i.autojournal.fr/', url: 'https://www.f1i.fr/feed' },
      { name: 'Autosport · F1', site: 'https://www.autosport.com/f1/', url: 'https://www.autosport.com/rss/f1/news/', lang: 'en' },
    ],
  },
  {
    id: 'foot', label: 'Foot', icon: 'ball', color: '#a3ff12', query: '',
    sources: [
      { name: 'L’Équipe · Football', site: 'https://www.lequipe.fr/Football/', url: 'https://dwh.lequipe.fr/api/edito/rss?path=/Football/' },
      { name: 'RMC Sport · Football', site: 'https://rmcsport.bfmtv.com/football/', url: 'https://rmcsport.bfmtv.com/rss/football/' },
      { name: 'franceinfo · Foot', site: 'https://www.francetvinfo.fr/sports/foot/', url: 'https://www.francetvinfo.fr/sports/foot.rss' },
      { name: 'Foot Mercato', site: 'https://www.footmercato.net/', url: 'https://www.footmercato.net/flux-rss' },
      { name: 'BBC Sport · Football', site: 'https://www.bbc.com/sport/football', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', lang: 'en' },
    ],
  },
  {
    id: 'rugby', label: 'Rugby', icon: 'trophy', color: '#22c55e', query: '',
    sources: [
      { name: 'L’Équipe · Rugby', site: 'https://www.lequipe.fr/Rugby/', url: 'https://dwh.lequipe.fr/api/edito/rss?path=/Rugby/' },
      { name: 'RMC Sport · Rugby', site: 'https://rmcsport.bfmtv.com/rugby/', url: 'https://rmcsport.bfmtv.com/rss/rugby/' },
      { name: 'franceinfo · Rugby', site: 'https://www.francetvinfo.fr/sports/rugby/', url: 'https://www.francetvinfo.fr/sports/rugby.rss' },
    ],
  },
  {
    id: 'tennis', label: 'Tennis', icon: 'trophy', color: '#d9f99d', query: '',
    sources: [
      { name: 'L’Équipe · Tennis', site: 'https://www.lequipe.fr/Tennis/', url: 'https://dwh.lequipe.fr/api/edito/rss?path=/Tennis/' },
      { name: 'franceinfo · Tennis', site: 'https://www.francetvinfo.fr/sports/tennis/', url: 'https://www.francetvinfo.fr/sports/tennis.rss' },
    ],
  },
  {
    id: 'basket', label: 'Basket', icon: 'ball', color: '#f97316', query: 'NBA, basket Betclic Élite',
    sources: [
      { name: 'L’Équipe · Basket', site: 'https://www.lequipe.fr/Basket/', url: 'https://dwh.lequipe.fr/api/edito/rss?path=/Basket/' },
    ],
  },
  {
    id: 'economie', label: 'Économie', icon: 'chart', color: '#5eead4', query: '',
    sources: [
      { name: 'Le Monde · Économie', site: 'https://www.lemonde.fr/economie/', url: 'https://www.lemonde.fr/economie/rss_full.xml' },
      { name: 'franceinfo · Éco / Conso', site: 'https://www.francetvinfo.fr/economie/', url: 'https://www.francetvinfo.fr/economie.rss' },
      { name: 'La Tribune', site: 'https://www.latribune.fr/', url: 'https://www.latribune.fr/feed.xml' },
    ],
  },
  {
    id: 'sciences', label: 'Sciences', icon: 'leaf', color: '#4ade80', query: '',
    sources: [
      { name: 'Le Monde · Sciences', site: 'https://www.lemonde.fr/sciences/', url: 'https://www.lemonde.fr/sciences/rss_full.xml' },
      { name: 'Sciences et Avenir', site: 'https://www.sciencesetavenir.fr/', url: 'https://www.sciencesetavenir.fr/rss.xml' },
      { name: 'Numerama · Sciences', site: 'https://www.numerama.com/sciences/', url: 'https://www.numerama.com/sciences/feed/' },
    ],
  },
  {
    id: 'espace', label: 'Espace', icon: 'rocket', color: '#8b5cf6', query: '',
    sources: [
      { name: 'Ciel et Espace', site: 'https://www.cieletespace.fr/', url: 'https://www.cieletespace.fr/rss' },
      { name: 'NASA', site: 'https://www.nasa.gov/news/', url: 'https://www.nasa.gov/news-release/feed/', lang: 'en', type: 'officiel' },
      { name: 'ESA', site: 'https://www.esa.int/', url: 'https://www.esa.int/rssfeed/Our_Activities/Space_News', lang: 'en', type: 'officiel' },
    ],
  },
  {
    id: 'cinema', label: 'Cinéma & séries', icon: 'film', color: '#fb7185', query: '',
    sources: [
      { name: 'AlloCiné', site: 'https://www.allocine.fr/', url: 'https://www.allocine.fr/rss/news.xml' },
      { name: 'Écran Large', site: 'https://www.ecranlarge.com/', url: 'https://www.ecranlarge.com/rss' },
      { name: 'Le Monde · Cinéma', site: 'https://www.lemonde.fr/cinema/', url: 'https://www.lemonde.fr/cinema/rss_full.xml' },
    ],
  },
  {
    id: 'jeux-video', label: 'Jeux vidéo', icon: 'games', color: '#c084fc', query: '',
    sources: [
      { name: 'Jeuxvideo.com', site: 'https://www.jeuxvideo.com/', url: 'https://www.jeuxvideo.com/rss/rss.xml' },
      { name: 'Gamekult', site: 'https://www.gamekult.com/', url: 'https://www.gamekult.com/feed.xml' },
      { name: 'Numerama · Jeux vidéo', site: 'https://www.numerama.com/tech/jeux-video/', url: 'https://www.numerama.com/tech/jeux-video/feed/' },
    ],
  },
];
