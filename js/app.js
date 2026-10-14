/* NEXUS — veille tech en temps réel.
 * JavaScript pur : aucun framework, aucune dépendance, aucune compilation.
 * Les flux passent par le relais (serveur.py, en local ou en ligne) quand il tourne ; sinon le
 * navigateur les lit directement, ce qui ne fonctionne que pour les sources
 * qui autorisent la lecture depuis une autre page (CORS).
 * Favoris et sources perso sont enregistrés dans le navigateur (localStorage),
 * avec export / import en fichier JSON pour les transférer.
 */
(() => {
  'use strict';

  const { PROJECT = {}, TYPES, CATEGORIES, SOURCES, BOARD = null } = window.NEXUS;
  const SRC = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
  const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const CHANGELOG = window.NEXUS_CHANGELOG || []; // historique des versions (js/changelog.js), la plus récente d'abord
  const VERSION = CHANGELOG[0]?.version || '';
  const TABS = [
    { id: 'radar', label: 'Radar', long: 'Radar', icon: 'radar', color: '#00e5ff', about: 'Les derniers titres de chaque rubrique, en un coup d’œil.' },
    ...CATEGORIES,
    { id: 'favoris', label: 'Favoris', long: 'Favoris', icon: 'bookmark', color: '#ffd34d', about: 'Vos articles et projets enregistrés. Ils restent ici même quand ils disparaissent des flux.' },
    { id: 'sources', label: 'Sources', long: 'Sources & fiabilité', icon: 'list', color: '#a5b4fc', about: 'D’où vient chaque information, son niveau de fiabilité et son état en direct. Retirez celles qui ne vous intéressent pas, ajoutez les vôtres.' },
    { id: 'apropos', label: 'À propos', long: 'À propos', icon: 'info', color: '#5eead4', about: 'Pourquoi NEXUS existe, comment il fonctionne et ce qu’il fait (et ne fait pas) de vos données.' },
    { id: 'nouveautes', label: 'Nouveautés', long: 'Nouveautés', icon: 'gift', color: '#f9a8d4', about: 'Ce qui a changé sur NEXUS, version par version. Les versions sorties depuis votre dernière visite sont signalées.' },
  ];
  const TAB = Object.fromEntries(TABS.map((t) => [t.id, t]));
  const MENU_HINTS = { // sous-titres du menu
    radar: 'Vue d’ensemble en direct',
    ia: 'Intelligence artificielle',
    apps: 'Apps et API · utiliser',
    jeux: 'Décompilations · jouer',
    info: 'Actualité informatique',
    cyber: 'Alertes et menaces',
    favoris: 'Vos articles enregistrés',
    sources: 'Fiabilité · sources perso',
    apropos: 'Sans compte, gratuit, open source',
    nouveautes: `Version ${VERSION} · ce qui a changé`,
  };
  const PROJECTS_ABOUT = 'Dépôts GitHub publics : le code est vérifiable. Classés par étoiles ou par activité récente.';
  const PLAY_ABOUT = 'Les jeux rétro-ingéniérés auxquels vous pouvez jouer : en ligne, ou à télécharger depuis leur page officielle, avec la marche à suivre.';
  const GAMES = window.NEXUS_GAMES || [];
  const USE_ABOUT = 'Les apps rétro-ingéniérées que vous pouvez utiliser : pilotes, firmwares et clients libres, avec leur page officielle et la marche à suivre.';
  const APPS = window.NEXUS_APPS || [];
  const RANK_ABOUT = 'Les modèles d’IA classés par intelligence, code, agents, prix, contexte, taille ou date de sortie, à partir de données publiques mises à jour en continu.';
  const SUBS = { news: '', rank: 'classement', projects: 'projets', play: 'jouer', use: 'utiliser' }; // sous-onglets et leur suffixe d'adresse (#jeux/jouer)
  const NEEDS = {
    free: { label: 'Rien à fournir', hint: 'Fonctionne avec des données libres ou offertes.' },
    demo: { label: 'Démo gratuite', hint: 'Jouable avec une version de démonstration ou shareware gratuite ; le jeu complet demande vos fichiers.' },
    files: { label: 'Vos fichiers du jeu', hint: 'Demande votre copie du jeu original (GOG, Steam ou CD).' },
    rom: { label: 'Votre ROM', hint: 'Demande la ROM de votre propre copie du jeu.' },
  };
  const APP_NEEDS = {
    free: { label: 'Rien à fournir', hint: 'S’installe et fonctionne seule, gratuitement.' },
    device: { label: 'Votre appareil', hint: 'Pilote ou libère un appareil que vous possédez (montre, routeur, Mac…).' },
    account: { label: 'Votre abonnement', hint: 'Se connecte au service avec votre propre compte ou abonnement.' },
  };
  const DOMAINS = { device: 'Appareils', service: 'Services', system: 'Systèmes', file: 'Fichiers' }; // vue « Utiliser »
  const INTERVALS = [[30, 'Toutes les 30 s'], [60, 'Chaque minute'], [120, 'Toutes les 2 min'], [300, 'Toutes les 5 min'], [900, 'Toutes les 15 min']];
  const PERIODS = { all: 'Toutes dates', day: '24 h', week: '7 jours', month: '30 jours' };
  const PERIOD_MS = { all: Infinity, day: 864e5, week: 6048e5, month: 2592e6 };
  const NEW_WINDOW = 30 * 60e3; // un article reste marqué « nouveau » 30 minutes
  const STORE_KEY = 'nexus.v1';
  const FAVS_KEY = 'nexus.favs';
  const CUSTOM_KEY = 'nexus.custom';
  const DISABLED_KEY = 'nexus.disabled'; // sources du catalogue retirées par l'utilisateur
  const PAGES_KEY = 'nexus.pages'; // pages perso (F1, Foot, Politique…)
  const BOARD_KEY = 'nexus.board'; // dernier classement des modèles d'IA reçu
  const SIZES_KEY = 'nexus.sizes'; // nombre de paramètres des modèles à poids ouverts (ne change pas)
  const SEEN_KEY = 'nexus.seen'; // dernière version vue dans « Nouveautés » et dernière version annoncée
  const THEMES = window.NEXUS_THEMES || []; // modèles de pages (js/themes.js)
  const PAGE_ICONS = ['news', 'landmark', 'vote', 'users', 'car', 'flag', 'ball', 'trophy', 'dumbbell', 'chart', 'briefcase', 'film', 'music', 'games', 'rocket', 'leaf', 'heart', 'book', 'globe', 'star', 'ai', 'chip', 'shield', 'chat'];
  const PAGE_COLORS = ['#00e5ff', '#4d8dff', '#8b5cf6', '#ff2bd6', '#ff4d6d', '#f97316', '#ffb020', '#ffd34d', '#a3ff12', '#5eead4'];
  const MAX_PAGES = 20;
  const RING = 2 * Math.PI * 23;
  const CONCURRENCY = 6;
  const PAGE = 60; // cartes affichées d'un coup ; les suivantes arrivent en approchant du bas
  let limit = PAGE;
  const GENERIC_TOPICS = new Set(['decompilation', 'decomp', 'reverse-engineering', 'recompilation', 'matching-decompilation', 'game', 'games', 'api']);

  // Icônes (tracés type Lucide, 24×24, trait).
  const ICONS = {
    radar: '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>',
    ai: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/><path d="M20 3v4M22 5h-4M4 17v2M5 18H3"/>',
    apps: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/><path d="m10 7-2 2.5 2 2.5M14 7l2 2.5-2 2.5"/>',
    games: '<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01"/><path d="M17.32 5H6.68a4 4 0 0 0-3.98 3.59C2.6 9.42 2 14.46 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.41-1.41A2 2 0 0 1 9.83 16h4.34a2 2 0 0 1 1.41.59L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.55-.6-6.58-.69-7.26A4 4 0 0 0 17.32 5z"/>',
    chip: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    list: '<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    minus: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    user: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 8 5 5M22 8l-5 5"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    fork: '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9M12 12v3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    up: '<path d="m5 12 7-7 7 7M12 19V5"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    translate: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    rows: '<path d="M3 5h18M3 12h18M3 19h18"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    // Icônes proposées pour les pages perso
    news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>',
    landmark: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l8 5H4z"/>',
    vote: '<path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7z"/><path d="M22 19H2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    ball: '<circle cx="12" cy="12" r="10"/><path d="m12 7 4 3-1.5 5h-5L8 10z"/><path d="M12 7V2M16 10l5-2M14.5 15l3 4.5M9.5 15l-3 4.5M8 10 3 8"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
    chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    film: '<rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    dumbbell: '<path d="m6.5 6.5 11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"/>',
  };
  const icon = (name) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  // ───────── Utilitaires ─────────
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const clip = (s, n) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const safeUrl = (u, base) => {
    try {
      const url = new URL(String(u).trim(), base);
      return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  };
  const hostOf = (u) => {
    try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; }
  };
  const hue = (s) => {
    let h = 0;
    for (const ch of String(s)) h = (h * 31 + ch.codePointAt(0)) % 360;
    return h;
  };
  const mono = (src) => {
    if (src.mono) return src.mono;
    const words = src.name.replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
    return (words.length > 1 ? words[0][0] + words[1][0] : src.name.slice(0, 2)).toUpperCase();
  };

  const htmlParser = new DOMParser();
  const decoder = document.createElement('textarea');
  /** Décode les entités HTML d'un texte sans interpréter de balises. */
  const decode = (s) => {
    if (!s || !s.includes('&')) return s || '';
    decoder.innerHTML = s;
    return decoder.value;
  };
  /** Texte brut d'un fragment HTML : balises retirées, entités décodées (rien n'est interprété ni exécuté).
   *  Volontairement sans DOMParser : appelé des centaines de fois par rafraîchissement. */
  const toText = (html) => (html
    ? decode(String(html).replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
    : '');
  const cleanSummary = (s) =>
    s
      .replace(/\s*submitted by\s+\/u\/\S+.*$/i, '')
      .replace(/\s*The post .{1,200} appeared first on .{1,80}$/i, '')
      .replace(/\s*(?:\[(?:…|\.\.\.)\]|Continue reading.*|Read more.*|Lire la suite.*|L’article .{1,200} est apparu en premier sur .*)$/i, '')
      .trim();

  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto', style: 'short' });
  const compactFmt = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });
  const compact = (n) => compactFmt.format(n || 0);
  const ago = (ts) => {
    if (!ts) return 'date inconnue';
    const s = Math.round((ts - Date.now()) / 1000);
    const a = Math.abs(s);
    if (a < 45) return 'à l’instant';
    if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
    if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
    if (a < 86400 * 30) return rtf.format(Math.round(s / 86400), 'day');
    return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  /** Version courte pour les colonnes étroites : « 15 min », « 3 h », « 2 j ». */
  const agoShort = (ts) => {
    if (!ts) return '—';
    const m = Math.round((Date.now() - ts) / 60e3);
    if (m < 1) return 'maintenant';
    if (m < 60) return `${m} min`;
    if (m < 1440) return `${Math.round(m / 60)} h`;
    if (m < 43200) return `${Math.round(m / 1440)} j`;
    return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };
  const fullDate = (ts) => (ts ? new Date(ts).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }) : '');
  const timeTag = (ts, short = false) => `<time data-ts="${ts || 0}"${short ? ' data-short' : ''} title="${esc(fullDate(ts))}">${short ? agoShort(ts) : ago(ts)}</time>`;

  function parseDate(s) {
    if (!s) return 0;
    let t = Date.parse(s);
    if (Number.isNaN(t)) t = Date.parse(s.replace(/(\d{1,2} \w{3}) (\d{2}) /, '$1 20$2 ')); // années sur 2 chiffres
    return Number.isNaN(t) ? 0 : t;
  }

  /** Décalage (ms) d'un fuseau horaire à un instant donné, ex. +2 h pour Europe/Paris l'été. */
  function tzOffset(timeZone, t) {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
        .formatToParts(new Date(t)).map((x) => [x.type, Number(x.value)]),
    );
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
  }

  // ───────── Stockage local ─────────
  const readJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const writeJSON = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  };

  // ───────── Pages perso (menu → « Créer une page ») ─────────
  // Une page perso est une rubrique comme les autres : ses sources (perso) l'alimentent,
  // elle apparaît dans le menu, le radar et le bandeau « en direct ».
  const RESERVED = new Set(TABS.map((t) => t.id));
  const isColor = (c) => /^#[0-9a-f]{6}$/i.test(String(c || ''));
  const slugify = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').slice(0, 24).replace(/-+$/, '') || 'page';

  /** Page lue du stockage ou d'une sauvegarde : seuls les champs connus, valeurs vérifiées. */
  function cleanPage(p) {
    const label = String(p?.label || '').replace(/\s+/g, ' ').trim().slice(0, 30);
    const id = String(p?.id || '');
    if (!label || !/^[a-z0-9-]{1,24}$/.test(id) || RESERVED.has(id)) return null;
    return {
      id, label,
      icon: PAGE_ICONS.includes(p.icon) ? p.icon : 'news',
      color: isColor(p.color) ? p.color.toLowerCase() : PAGE_COLORS[0],
      filter: p.filter !== false, // sites de la page limités aux articles qui parlent de ses mots-clés
      createdAt: Number(p.createdAt) || Date.now(),
    };
  }

  function registerPage(p) {
    const cat = { id: p.id, label: p.label, long: p.label, icon: p.icon, color: p.color, custom: true };
    CATEGORIES.push(cat);
    CAT[cat.id] = cat;
    TABS.splice(TABS.findIndex((t) => t.id === 'favoris'), 0, cat); // après les rubriques, avant Favoris
    TAB[cat.id] = cat;
  }

  function unregisterPage(id) {
    const cat = CAT[id];
    if (!cat?.custom) return;
    CATEGORIES.splice(CATEGORIES.indexOf(cat), 1);
    TABS.splice(TABS.indexOf(cat), 1);
    delete CAT[id];
    delete TAB[id];
  }

  let pagesRaw = readJSON(PAGES_KEY, []);
  if (!Array.isArray(pagesRaw)) pagesRaw = [];
  pagesRaw = pagesRaw.map(cleanPage).filter((p, i, all) => p && all.findIndex((q) => q?.id === p.id) === i).slice(0, MAX_PAGES);
  pagesRaw.forEach(registerPage);

  // ───────── Sources perso (page Sources, pages perso) ─────────
  const keywordsRe = (text) => {
    const words = String(text || '').split(',').map((w) => w.trim()).filter(Boolean);
    return words.length ? new RegExp(words.map(escapeRe).join('|'), 'i') : undefined;
  };
  const hnUrl = (query) =>
    `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story&numericFilters=${encodeURIComponent('points>5')}&hitsPerPage=40`;
  /** Recherche Google Actualités (flux RSS) : la presse qui parle de ces mots, en français ou en anglais. */
  const newsUrl = (q, lang) => (lang === 'en'
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`
    : `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=fr&gl=FR&ceid=FR:fr`);
  /** « F1, Formule 1 » → ['F1', 'Formule 1'] : une recherche par élément (l'un ou l'autre). */
  const splitQuery = (text) => String(text || '').split(',').map((w) => w.replace(/\s+/g, ' ').trim().slice(0, 60)).filter(Boolean).slice(0, 6);

  // Mots-clés d'une page perso appliqués à ses sites : un article est gardé s'il contient au moins un
  // mot-clé, c'est-à-dire tous les mots de ce mot-clé, dans n'importe quel ordre, sans accents ni majuscules.
  // « jeune » trouve aussi « jeunes » ; un mot de 3 lettres ou moins reste entier (« PS » ne trouve pas « PSG »).
  const STOPWORDS = new Set(['a', 'au', 'aux', 'de', 'des', 'du', 'en', 'et', 'la', 'le', 'les', 'un', 'une', 'pour', 'sur', 'and', 'for', 'in', 'of', 'on', 'the', 'to']);
  const matchers = new Map();
  function keywordMatcher(query) {
    if (!matchers.has(query)) {
      const terms = splitQuery(query)
        .map((t) => {
          const words = norm(t).split(/[^a-z0-9]+/).filter(Boolean);
          const kept = words.filter((w) => !STOPWORDS.has(w));
          return (kept.length ? kept : words).map((w) => new RegExp(`(?:^|[^a-z0-9])${escapeRe(w)}${w.length <= 3 ? '(?:s|x)?(?![a-z0-9])' : ''}`));
        })
        .filter((words) => words.length);
      matchers.set(query, terms.length ? (text) => { const h = norm(text); return terms.some((t) => t.every((re) => re.test(h))); } : null);
    }
    return matchers.get(query);
  }
  /** Mots-clés d'une page perso : ceux de sa recherche Google Actualités. */
  const pageQuery = (catId) => SOURCES.find((s) => s.cat === catId && s.kind === 'news')?.query || '';
  /** Pour un site d'une page perso dont le filtre est actif : le test « parle des mots-clés », sinon null.
   *  Les résultats Google Actualités ne sont pas refiltrés : ce sont déjà les recherches de ces mots-clés. */
  function pageFilter(src) {
    if (src.kind === 'news' || !CAT[src.cat]?.custom) return null;
    return pagesRaw.find((p) => p.id === src.cat)?.filter ? keywordMatcher(pageQuery(src.cat)) : null;
  }
  const itemText = (it) => `${it.title} ${it.summary || ''} ${(it.topics || []).join(' ')}`;
  let uidSeq = 0;
  const uid = () => `perso-${Date.now().toString(36)}-${(uidSeq++).toString(36)}`;

  let customRaw = readJSON(CUSTOM_KEY, []);
  if (!Array.isArray(customRaw)) customRaw = [];
  customRaw = customRaw.filter((r) => r && r.id && CAT[r.cat] && [].concat(r.url).length && [].concat(r.url).every((u) => safeUrl(u)));

  function registerSource(raw) {
    const kind = ['hn', 'news'].includes(raw.kind) ? raw.kind : 'rss';
    // Sources des modèles de pages : type vérifié (presse, officiel) ; sinon « perso ».
    const type = TYPES[raw.type] && raw.type !== 'projet' ? raw.type : 'perso';
    const src = { ...raw, kind, type, custom: true, include: keywordsRe(raw.keywords) };
    if (kind === 'news') Object.assign(src, { minAge: 300, limit: 40 }); // résultats de recherche : inutile d'interroger Google chaque minute
    SOURCES.push(src);
    SRC[src.id] = src;
    return src;
  }
  customRaw.forEach(registerSource);

  /** Source « mots-clés » d'une page : une recherche Google Actualités par mot-clé. */
  function newsSourceRaw(cat, query, lang) {
    const terms = splitQuery(query);
    if (!terms.length) return null;
    return {
      id: uid(), cat, kind: 'news', name: `Google Actualités · ${clip(terms.join(', '), 40)}`,
      site: `https://news.google.com/search?q=${encodeURIComponent(terms[0])}&hl=${lang === 'en' ? 'en-US' : 'fr'}`,
      url: terms.map((t) => newsUrl(t, lang)), query: terms.join(', '), lang: lang === 'en' ? 'en' : 'fr', keywords: '', addedAt: Date.now(),
    };
  }

  // Sources du catalogue retirées : ni affichées ni interrogées (toutes actives par défaut).
  const savedDisabled = readJSON(DISABLED_KEY, []);
  const disabled = new Set((Array.isArray(savedDisabled) ? savedDisabled : []).filter((id) => SRC[id] && !SRC[id].custom));
  const isActive = (s) => !disabled.has(s.id);
  const activeSources = () => SOURCES.filter(isActive);

  // ───────── Classement des modèles d'IA : données ─────────
  // Une ligne par modèle évalué par Artificial Analysis, d'après le catalogue public d'OpenRouter.
  const BOARD_SORTS = {
    intel: { label: 'Intelligence', dir: 'desc' },
    code: { label: 'Code', dir: 'desc' },
    agent: { label: 'Agents', dir: 'desc' },
    value: { label: 'Intelligence par dollar', dir: 'desc' },
    blend: { label: 'Prix mixte', dir: 'asc' },
    pin: { label: 'Prix en entrée', dir: 'asc' },
    pout: { label: 'Prix en sortie', dir: 'asc' },
    ctx: { label: 'Contexte', dir: 'desc' },
    params: { label: 'Taille (paramètres)', dir: 'desc' },
    created: { label: 'Date de sortie', dir: 'desc' },
    cutoff: { label: 'Date des connaissances', dir: 'desc' },
    name: { label: 'Nom', dir: 'asc' },
  };
  const BOARD_CAPS = { all: 'Toutes capacités', reasoning: 'Raisonnement', tools: 'Outils (appels de fonctions)', image: 'Images en entrée', audio: 'Audio en entrée', video: 'Vidéo en entrée', free: 'Version gratuite' };
  const CREATORS = { mistralai: 'Mistral', rekaai: 'Reka', qwen: 'Qwen', 'meta-llama': 'Meta', 'x-ai': 'xAI', openai: 'OpenAI' };
  const HF_RE = /^[\w.-]+\/[\w.-]+$/;
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

  /** Catalogue OpenRouter → lignes du classement (variantes :free / :batch regroupées). */
  function buildBoard(data) {
    const all = Array.isArray(data?.data) ? data.data : [];
    if (!all.length) throw new Error('Réponse inattendue du catalogue OpenRouter');
    const groups = new Map();
    for (const m of all) {
      if (!m?.id || m.alias_target) continue;
      const [base, variant = 'main'] = String(m.id).split(':');
      if (!groups.has(base)) groups.set(base, {});
      groups.get(base)[variant] = m;
    }
    const perM = (v) => { const n = Number(v); return v != null && Number.isFinite(n) && n >= 0 ? n * 1e6 : null; };
    const rows = [];
    for (const [base, g] of groups) {
      const m = g.main || g.free || Object.values(g)[0];
      const aa = m.benchmarks?.artificial_analysis;
      const intel = num(aa?.intelligence_index);
      const url = safeUrl(`https://openrouter.ai/${m.id}`);
      if (intel == null || !url) continue;
      const name = String(m.name || base);
      const cut = name.indexOf(': ');
      const slug = base.split('/')[0];
      const pin = perM(m.pricing?.prompt);
      const pout = perM(m.pricing?.completion);
      const blend = pin != null && pout != null ? (3 * pin + pout) / 4 : null; // 3 tokens lus pour 1 écrit
      const inputs = m.architecture?.input_modalities || [];
      const params = m.supported_parameters || [];
      rows.push({
        id: base, url,
        name: (cut > 0 ? name.slice(cut + 2) : name).replace(/\s*\((?:free|batch)\)\s*$/i, '').replace(/\s+/g, ' ').trim().slice(0, 80),
        creator: (cut > 0 ? name.slice(0, cut) : CREATORS[slug] || slug.charAt(0).toUpperCase() + slug.slice(1)).slice(0, 40),
        intel, code: num(aa?.coding_index), agent: num(aa?.agentic_index),
        pin, pout, blend, value: blend > 0 ? intel / blend : null,
        ctx: Number(m.context_length) || null,
        created: (Number(m.created) || 0) * 1000 || null,
        cutoff: parseDate(m.knowledge_cutoff) || null,
        hf: typeof m.hugging_face_id === 'string' && HF_RE.test(m.hugging_face_id) ? m.hugging_face_id : '',
        free: !!g.free || (pin === 0 && pout === 0),
        reasoning: params.includes('reasoning'),
        tools: params.includes('tools'),
        mods: ['image', 'audio', 'video'].filter((x) => inputs.includes(x)),
        desc: clip(String(m.description || '').replace(/\s+/g, ' ').trim(), 240),
      });
    }
    return rows;
  }

  function loadSavedBoard() {
    const saved = readJSON(BOARD_KEY, null);
    const rows = Array.isArray(saved?.rows)
      ? saved.rows.filter((r) => r && typeof r.id === 'string' && typeof r.name === 'string' && num(r.intel) != null && safeUrl(r.url))
        .map((r) => ({ ...r, hf: HF_RE.test(r.hf || '') ? r.hf : '', mods: Array.isArray(r.mods) ? r.mods : [] }))
      : [];
    return { at: rows.length ? Number(saved.at) || 0 : 0, rows, error: '', loading: false };
  }

  let sizes = readJSON(SIZES_KEY, {});
  if (!sizes || typeof sizes !== 'object' || Array.isArray(sizes)) sizes = {};
  /** Taille d'un modèle à poids ouverts : Hugging Face, sinon le nom (« 550B A55B » → 550 milliards). */
  const sizeOf = (r) => {
    if (!r.hf) return null;
    if (sizes[r.hf] > 0) return sizes[r.hf];
    const m = /(\d+(?:\.\d+)?)\s*([BT])\b/i.exec(`${r.name} ${r.hf}`.replace(/\bA\d+(?:\.\d+)?B\b/gi, ''));
    return m ? Number(m[1]) * (m[2].toUpperCase() === 'T' ? 1e12 : 1e9) : null;
  };

  // ───────── État ─────────
  const saved = readJSON(STORE_KEY, {}) || {};
  let favs = readJSON(FAVS_KEY, {});
  if (!favs || typeof favs !== 'object' || Array.isArray(favs)) favs = {};

  // Versions : `version` = dernière version vue dans « Nouveautés », `told` = dernière version annoncée.
  // Première visite : rien à annoncer. Visiteur d'avant la page Nouveautés : seule la dernière version est nouvelle.
  const seen = (() => {
    const s = readJSON(SEEN_KEY, null);
    if (typeof s?.version === 'string') return { version: s.version, told: typeof s.told === 'string' ? s.told : s.version };
    const first = !Object.keys(saved).length && !Object.keys(favs).length;
    return first ? { version: VERSION, told: VERSION } : { version: CHANGELOG[1]?.version || '', told: '' };
  })();
  writeJSON(SEEN_KEY, seen);
  /** Nombre de versions sorties depuis la dernière visite de « Nouveautés ». */
  function freshVersions() {
    const i = CHANGELOG.findIndex((r) => r.version === seen.version);
    return i < 0 ? Math.min(1, CHANGELOG.length) : i;
  }
  function markSeen() {
    Object.assign(seen, { version: VERSION, told: VERSION });
    writeJSON(SEEN_KEY, seen);
  }

  const state = {
    relay: false,
    hosted: false, // relais en ligne (Render…) plutôt que sur ce PC
    tab: 'radar',
    sub: 'news',
    q: '',
    type: 'all',
    lang: ['all', 'fr', 'en'].includes(saved.lang) ? saved.lang : 'all',
    period: saved.period in PERIODS ? saved.period : 'all',
    view: saved.view === 'list' ? 'list' : 'grid',
    projSort: saved.projSort === 'recent' ? 'recent' : 'stars',
    favSort: saved.favSort === 'date' ? 'date' : 'added',
    playFilter: 'all', // vue « Jouer » : all | online | free | own
    useFilter: 'all', // vue « Utiliser » : all | device | service | system | file
    usePlat: 'all', // vue « Utiliser » : plateforme
    board: loadSavedBoard(), // classement des modèles d'IA
    boardSort: BOARD_SORTS[saved.boardSort] ? saved.boardSort : 'intel',
    boardDir: saved.boardDir === 'asc' ? 'asc' : saved.boardDir === 'desc' ? 'desc' : BOARD_SORTS[saved.boardSort]?.dir || 'desc',
    boardWeights: 'all', // all | open | closed
    boardCap: 'all',
    boardCreator: 'all',
    hidden: new Set((saved.hidden || []).filter((id) => SRC[id])),
    auto: saved.auto ?? true,
    interval: INTERVALS.some(([v]) => v === saved.interval) ? saved.interval : 60,
    results: Object.fromEntries(Object.entries(saved.results || {}).filter(([id]) => SRC[id] && !disabled.has(id))),
    disabled,
    firstSeen: saved.firstSeen || {},
    lastVisit: saved.lastVisit || {},
    favs,
    addOpen: false, // formulaire « Ajouter une source » ouvert
    addCat: 'info',
    draft: null, // source testée, en attente de confirmation
    pending: new Set(),
    loading: false,
    nextAt: 0,
    lastSync: saved.lastSync || 0,
  };

  // Articles enregistrés avant le filtre des pages perso (ou avant un import) : filtrés dès l'ouverture.
  for (const s of SOURCES) {
    const keep = pageFilter(s);
    const r = state.results[s.id];
    if (keep && r) r.items = r.items.filter((it) => keep(itemText(it)));
  }

  function persist() {
    writeJSON(STORE_KEY, {
      lang: state.lang, period: state.period, view: state.view, projSort: state.projSort, favSort: state.favSort,
      boardSort: state.boardSort, boardDir: state.boardDir,
      hidden: [...state.hidden], auto: state.auto, interval: state.interval,
      results: state.results, firstSeen: state.firstSeen, lastVisit: state.lastVisit, lastSync: state.lastSync,
    });
  }
  let persistTimer = 0;
  const persistSoon = () => { clearTimeout(persistTimer); persistTimer = setTimeout(persist, 800); };
  const storageWarning = () => toast('Enregistrement impossible', 'Le navigateur bloque le stockage local (navigation privée ?).');
  const saveFavs = () => writeJSON(FAVS_KEY, state.favs) || storageWarning();
  const saveCustom = () => writeJSON(CUSTOM_KEY, customRaw) || storageWarning();
  const savePages = () => writeJSON(PAGES_KEY, pagesRaw) || storageWarning();
  const saveDisabled = () => writeJSON(DISABLED_KEY, [...state.disabled]) || storageWarning();

  // ───────── Récupération des flux ─────────
  const inflight = new Map(); // lectures en cours pendant un cycle de rafraîchissement

  function httpMessage(status, url, body) {
    if (status === 403 && url.includes('api.github.com')) return 'Limite de l’API GitHub atteinte, nouvel essai automatique plus tard';
    if (status === 429) return body && body.length < 300 ? body : 'La source limite le nombre de requêtes (429), nouvel essai plus tard';
    if (status === 404) return 'Introuvable (404) : l’adresse a peut-être changé';
    if (body && body.length < 300) return body;
    if (status === 401 || status === 403) return `Accès refusé par la source (${status})`;
    return `Erreur HTTP ${status}`;
  }

  async function readText(res) {
    const buf = await res.arrayBuffer();
    let charset = /charset=["']?([\w-]+)/i.exec(res.headers.get('content-type') || '')?.[1];
    if (!charset) charset = /encoding=["']([\w-]+)["']/i.exec(new TextDecoder('latin1').decode(buf.slice(0, 200)))?.[1];
    try { return new TextDecoder(charset || 'utf-8').decode(buf); } catch { return new TextDecoder().decode(buf); }
  }

  /** Requête via le relais s'il est là. tag : empreinte de la version déjà lue → le relais
   *  répond « 304 inchangé » sans rien renvoyer ({ text: null }). */
  function request(url, tag = '') {
    const target = state.relay ? `/api/proxy?url=${encodeURIComponent(url)}` : url;
    const headers = tag && state.relay ? { 'If-None-Match': tag } : undefined;
    return fetch(target, { cache: 'no-store', headers, signal: AbortSignal.timeout(25000) })
      .then(async (res) => {
        if (res.status === 304) return { text: null, tag };
        if (!res.ok) {
          const body = state.relay ? (await res.text().catch(() => '')).trim() : '';
          throw new Error(httpMessage(res.status, url, body));
        }
        return { text: await readText(res), tag: state.relay ? res.headers.get('ETag') || '' : '' };
      })
      .catch((err) => {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') throw new Error('Pas de réponse en 25 s');
        if (err instanceof TypeError) {
          throw state.relay
            ? new Error(state.hosted ? 'Serveur injoignable pour le moment, nouvel essai automatique' : 'Relais local injoignable : serveur.py est-il toujours lancé ?')
            : Object.assign(new Error('Lecture bloquée par le navigateur (CORS) : lancez lancer.bat pour cette source'), { blocked: true });
        }
        throw err;
      });
  }

  /** Télécharge une URL et renvoie son texte (ajout de source, classement des IA…). */
  const getText = (url) => request(url).then((r) => r.text);

  /** Articles d'un flux. Une URL partagée par plusieurs sources n'est lue qu'une fois par cycle, et un flux
   *  inchangé depuis la dernière lecture (304 du relais) n'est ni retéléchargé ni réanalysé. */
  const parsedFeeds = new Map(); // « type|url » → { tag, items } : dernière analyse de chaque flux
  function getItems(url, kind) {
    const key = `${kind}|${url}`;
    if (inflight.has(key)) return inflight.get(key);
    const known = parsedFeeds.get(key);
    const job = request(url, known?.tag).then(({ text, tag }) => {
      if (text === null && known) return known.items;
      const items = PARSERS[kind](text, url);
      if (tag) parsedFeeds.set(key, { tag, items });
      else parsedFeeds.delete(key);
      return items;
    });
    inflight.set(key, job);
    return job;
  }

  function parseXml(text) {
    const clean = text.replace(/^﻿/, '').trim();
    let doc = htmlParser.parseFromString(clean, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) {
      // Entités HTML (&nbsp;…) ou « & » nus, invalides en XML : on les neutralise puis on réessaie.
      const fixed = clean.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/gi, '&amp;');
      doc = htmlParser.parseFromString(fixed, 'application/xml');
      if (doc.getElementsByTagName('parsererror').length) throw new Error('Flux illisible : la réponse n’est pas du RSS/Atom valide');
    }
    return doc;
  }

  const kids = (el, name) => [...el.children].filter((c) => c.nodeName === name);
  const kidText = (el, ...names) => {
    for (const name of names) {
      for (const c of kids(el, name)) {
        const t = c.textContent.trim();
        if (t) return t;
      }
    }
    return '';
  };

  function entryLink(el) {
    for (const l of kids(el, 'link')) {
      const href = l.getAttribute('href');
      const rel = l.getAttribute('rel');
      if (href && (!rel || rel === 'alternate')) return href;
      if (!href && l.textContent.trim()) return l.textContent.trim();
    }
    const orig = kidText(el, 'feedburner:origLink');
    if (orig) return orig;
    const guid = kidText(el, 'guid', 'id');
    return /^https?:/.test(guid) ? guid : '';
  }

  function entryImage(el, html, base) {
    const candidates = [];
    for (const n of el.getElementsByTagName('media:thumbnail')) candidates.push(n.getAttribute('url'));
    for (const n of el.getElementsByTagName('media:content')) {
      const type = n.getAttribute('type') || '';
      const medium = n.getAttribute('medium') || '';
      if (medium === 'image' || type.startsWith('image') || (!type && !medium)) candidates.push(n.getAttribute('url'));
    }
    for (const n of kids(el, 'enclosure')) if ((n.getAttribute('type') || '').startsWith('image')) candidates.push(n.getAttribute('url'));
    const img = /<img[^>]+src=["']([^"']+)["']/i.exec(html || '');
    if (img) candidates.push(decode(img[1]));
    for (const c of candidates) {
      const url = c && safeUrl(c, base);
      if (url && !/feedburner|feeds\.feedblitz|pixel|\/1x1|gravatar\.com\/avatar/i.test(url)) return url;
    }
    return '';
  }

  function parseFeed(text, url) {
    const doc = parseXml(text);
    const all = [...doc.getElementsByTagName('item'), ...doc.getElementsByTagName('entry')];
    if (!all.length && !doc.querySelector('rss, feed, RDF, channel')) throw new Error('Aucun article trouvé dans la réponse');
    // Certains flux contiennent des centaines d'articles (OpenAI : plus de 1 000) : on ne détaille que les plus récents.
    const entries = all
      .map((el) => ({ el, date: parseDate(kidText(el, 'pubDate', 'published', 'updated', 'dc:date', 'a10:updated')) }))
      .sort((a, b) => b.date - a.date)
      .slice(0, 60);
    return entries.map(({ el, date }) => {
      const content = kidText(el, 'content:encoded', 'content');
      const desc = kidText(el, 'description', 'summary', 'media:description');
      const link = safeUrl(entryLink(el), url);
      const rawTitle = kidText(el, 'title');
      // <source> d'un item RSS : le média d'origine quand le flux est un agrégateur (Google Actualités…).
      const source = el.nodeName === 'item' ? decode(kidText(el, 'source')).replace(/\s+/g, ' ') : '';
      let title = (/<[a-z]/i.test(rawTitle) ? toText(rawTitle) : decode(rawTitle)).replace(/\s+/g, ' ').trim();
      if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
      const via = source.replace(/[\s\-–|·:]+$/, '').slice(0, 80); // « JP blog - » → « JP blog »
      let summary = clip(cleanSummary(toText(desc || content)), 280);
      if (summary && norm(summary).startsWith(norm(title)) && summary.length - title.length < 80) summary = ''; // simple redite du titre
      const it = { title, link, date, summary, image: entryImage(el, content || desc, link || url) };
      if (via) it.via = via;
      return it;
    });
  }

  /** Recherche Google Actualités : le résumé n'est qu'une liste de titres, on ne garde que l'article. */
  const parseNews = (text, url) => parseFeed(text, url).map((it) => ({ ...it, summary: '' }));

  /** Titre d'un flux RSS/Atom (pour nommer automatiquement une source perso). */
  function feedTitle(text) {
    try {
      const t = parseXml(text).querySelector('channel > title, feed > title');
      return t ? decode(t.textContent.trim()).replace(/\s+/g, ' ') : '';
    } catch {
      return '';
    }
  }

  /** Langue d'un flux : celle qu'il déclare, sinon devinée sur les mots les plus courants. */
  function guessLang(text, items) {
    const declared = /<(?:language|dc:language)>\s*([a-z]{2})/i.exec(text)?.[1] || /<feed[^>]+xml:lang=["']([a-z]{2})/i.exec(text)?.[1];
    if (declared) return declared.toLowerCase() === 'fr' ? 'fr' : 'en';
    const sample = ` ${items.slice(0, 15).map((it) => `${it.title} ${it.summary}`).join(' ').toLowerCase()} `;
    const count = (words) => words.reduce((n, w) => n + sample.split(` ${w} `).length - 1, 0);
    return count(['le', 'la', 'les', 'des', 'est', 'une', 'pour', 'et', 'dans']) > count(['the', 'and', 'is', 'of', 'to', 'in', 'for']) ? 'fr' : 'en';
  }

  function parseHN(text) {
    const data = JSON.parse(text);
    return (data.hits || []).filter((h) => h.title).map((h) => {
      const discuss = `https://news.ycombinator.com/item?id=${h.objectID}`;
      const link = safeUrl(h.url) || discuss;
      return {
        title: decode(h.title),
        link,
        date: (h.created_at_i || 0) * 1000,
        summary: h.story_text ? clip(toText(h.story_text), 280) : '',
        host: hostOf(link),
        points: h.points || 0,
        comments: h.num_comments || 0,
        discuss,
      };
    });
  }

  function parseGitHub(text) {
    const data = JSON.parse(text);
    if (!Array.isArray(data.items)) throw new Error(data.message ? `GitHub : ${data.message}` : 'Réponse GitHub inattendue');
    return data.items.map((r) => ({
      repo: true,
      title: r.full_name,
      link: r.html_url,
      date: Date.parse(r.pushed_at) || 0,
      summary: clip(r.description || '', 280),
      image: r.owner?.avatar_url ? `${r.owner.avatar_url}${r.owner.avatar_url.includes('?') ? '&' : '?'}s=88` : '',
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      language: r.language || '',
      topics: (r.topics || []).slice(0, 12),
      archived: !!r.archived,
    }));
  }

  const PARSERS = { rss: parseFeed, news: parseNews, hn: parseHN, github: parseGitHub };

  function normId(link) {
    try {
      const u = new URL(link);
      u.hash = '';
      for (const k of [...u.searchParams.keys()]) if (/^(utm_|fbclid|gclid|ref$|source$)/.test(k)) u.searchParams.delete(k);
      return u.host.replace(/^www\./, '') + u.pathname.replace(/\/$/, '') + u.search;
    } catch {
      return link;
    }
  }

  async function fetchSource(src) {
    const t0 = performance.now();
    const urls = [].concat(src.url);
    const settled = await Promise.allSettled(urls.map((u) => getItems(u, src.kind || 'rss')));
    const done = settled.filter((s) => s.status === 'fulfilled');
    if (!done.length) throw settled[0].reason;

    const now = Date.now();
    const prevDates = new Map((state.results[src.id]?.items || []).map((p) => [p.id, p.date]));
    const keep = pageFilter(src); // site d'une page perso : seulement ce qui parle de ses mots-clés
    const seen = new Set();
    const items = [];
    let skipped = 0;
    for (const raw of done.flatMap((s) => s.value)) {
      if (!raw.link || !raw.title) continue;
      const it = { ...raw }; // copie : l'analyse du flux est réutilisée telle quelle au prochain cycle
      const hay = itemText(it);
      if (src.include && !src.include.test(hay)) continue;
      if (src.exclude && src.exclude.test(hay)) continue;
      it.id = normId(it.link);
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      if (keep && !keep(hay)) { skipped++; continue; }
      it.src = src.id;
      // Flux qui annoncent l'heure locale comme du GMT (option tz dans sources.js).
      if (src.tz && it.date) it.date -= tzOffset(src.tz, it.date);
      // Date dans le futur : on garde la première date connue, sinon l'heure de découverte.
      if (it.date > now + 5 * 60e3) it.date = prevDates.get(it.id) || now;
      items.push(it);
    }
    items.sort((a, b) => b.date - a.date);
    const failed = settled.length - done.length;
    return {
      items: items.slice(0, src.limit || 25),
      skipped,
      ms: Math.round(performance.now() - t0),
      warn: failed ? `${failed} requête(s) sur ${settled.length} en échec : ${settled.find((s) => s.status === 'rejected').reason.message}` : '',
    };
  }

  async function pool(list, size, worker) {
    const queue = [...list];
    const runners = Array.from({ length: Math.min(size, queue.length) }, async () => {
      while (queue.length) await worker(queue.shift());
    });
    await Promise.all(runners);
  }

  async function refresh(manual = false) {
    // Classement affiché : le bouton le recharge aussi (au plus une fois par minute).
    if (manual && state.sub === 'rank') loadBoard(Date.now() - state.board.at > 60e3);
    if (state.loading) {
      state.again = true; // source ajoutée ou rétablie pendant un cycle : on relance juste après
      return;
    }
    const now = Date.now();
    const due = activeSources().filter((s) => state.results[s.id]?.rebase || now - (state.results[s.id]?.at || 0) >= (s.minAge ?? 30) * 1000 - 1500);
    if (!due.length) {
      if (manual) toast('Déjà à jour', 'Toutes les sources ont été interrogées il y a moins de 30 secondes.');
      schedule();
      return;
    }
    // La rubrique affichée passe en premier.
    due.sort((a, b) => (b.cat === state.tab) - (a.cat === state.tab));
    state.loading = true;
    state.dueTotal = due.length;
    due.forEach((s) => state.pending.add(s.id));
    setBusy(true);
    scheduleRender();

    const fresh = [];
    await pool(due, CONCURRENCY, async (src) => {
      const prev = state.results[src.id];
      try {
        const { items, skipped, ms, warn } = await fetchSource(src);
        // Première lecture, ou relecture après un changement de mots-clés : rien n'est « nouveau ».
        const baseline = prev?.rebase || (!prev?.ok && !prev?.items?.length);
        for (const it of items) {
          if (it.id in state.firstSeen) continue;
          state.firstSeen[it.id] = baseline ? 0 : Date.now();
          if (!baseline && !it.repo) fresh.push(it);
        }
        // La source a pu être supprimée ou retirée pendant le téléchargement.
        if (SRC[src.id] && isActive(src)) state.results[src.id] = { items, skipped, at: Date.now(), ok: true, ms, error: warn };
      } catch (err) {
        if (SRC[src.id] && isActive(src)) state.results[src.id] = { items: prev?.items || [], skipped: prev?.skipped || 0, at: Date.now(), ok: false, ms: 0, error: err.message, blocked: !!err.blocked };
      }
      state.pending.delete(src.id);
      scheduleRender();
    });

    inflight.clear();
    state.loading = false;
    state.lastSync = Date.now();
    pruneSeen();
    persist();
    setBusy(false);
    schedule();
    renderBody();
    updateChrome();
    pulseSync();
    if (fresh.length) notifyNew(fresh.filter((it) => SRC[it.src]));
    else if (manual) toast('Synchronisé', 'Aucun nouvel article depuis la dernière vérification.');
    if (state.again) {
      state.again = false;
      setTimeout(refresh, 50);
    }
  }

  function pruneSeen() {
    const keep = new Set();
    for (const r of Object.values(state.results)) for (const it of r.items || []) keep.add(it.id);
    for (const id of Object.keys(state.firstSeen)) if (!keep.has(id)) delete state.firstSeen[id];
  }

  // ───────── Sélection des articles ─────────
  const dedupe = (items) => {
    const seen = new Set();
    return items.filter((it) => !seen.has(it.id) && seen.add(it.id));
  };
  const newsSources = (catId) => activeSources().filter((s) => s.cat === catId && s.kind !== 'github');
  const projectSources = (catId) => activeSources().filter((s) => s.cat === catId && s.kind === 'github');
  const newsItems = (catId) => dedupe(newsSources(catId).flatMap((s) => state.results[s.id]?.items || [])).sort((a, b) => (b.date || 0) - (a.date || 0));
  const isNew = (it) => {
    const t = state.firstSeen[it.id];
    return t > 0 && Date.now() - t < NEW_WINDOW;
  };
  const unseen = (catId) => {
    const since = state.lastVisit[catId] || 0;
    return newsItems(catId).filter((it) => state.firstSeen[it.id] > since).length;
  };

  /** Source d'un élément ; pour un favori dont la source a été supprimée, on reconstruit l'essentiel. */
  function srcOf(it) {
    if (SRC[it.src]) return SRC[it.src];
    const info = it.srcInfo || {};
    return {
      id: it.src || 'inconnue',
      name: info.name || 'Source supprimée',
      cat: CAT[info.cat] ? info.cat : 'info',
      lang: info.lang === 'fr' ? 'fr' : 'en',
      type: TYPES[info.type] ? info.type : 'perso',
      mono: info.mono,
    };
  }

  function statusOf(src) {
    if (state.pending.has(src.id)) return 'wait';
    const r = state.results[src.id];
    if (!r) return 'idle';
    if (r.ok) return 'ok';
    return r.blocked ? 'blocked' : 'err';
  }

  /** mode : 'news' (tous les filtres), 'projects' (sources masquées + recherche), 'favs' (recherche seule). */
  function filterItems(items, mode = 'news') {
    const tokens = norm(state.q).split(/\s+/).filter(Boolean);
    const maxAge = PERIOD_MS[state.period];
    const now = Date.now();
    return items.filter((it) => {
      const src = srcOf(it);
      if (mode !== 'favs' && state.hidden.has(src.id)) return false;
      if (mode === 'news') {
        if (state.lang !== 'all' && src.lang !== state.lang) return false;
        if (state.type !== 'all' && src.type !== state.type) return false;
        if (maxAge !== Infinity && (!it.date || now - it.date > maxAge)) return false;
      }
      if (tokens.length) {
        const hay = norm(`${it.title} ${it.summary} ${src.name} ${it.via || ''} ${it.host || ''} ${(it.topics || []).join(' ')} ${it.language || ''}`);
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }

  // ───────── Favoris ─────────
  function findItem(id) {
    for (const r of Object.values(state.results)) for (const it of r.items || []) if (it.id === id) return it;
    return state.favs[id] || null;
  }

  const favButtons = (id) => [...document.querySelectorAll('.fav')].filter((b) => b.dataset.v === id);

  function toggleFav(id) {
    if (state.favs[id]) {
      const removed = state.favs[id];
      delete state.favs[id];
      saveFavs();
      toast('Retiré des favoris', 'Cliquez ici pour annuler.', () => {
        state.favs[id] = removed;
        saveFavs();
        renderBody();
        updateChrome();
      });
      // Dans l'onglet Favoris, la carte se dématérialise avant de disparaître.
      const card = state.tab === 'favoris' && !reduceMotion.matches ? favButtons(id)[0]?.closest('.card') : null;
      if (card) {
        card.classList.add('leaving');
        setTimeout(() => { renderBody(); updateChrome(); }, 340);
        return;
      }
    } else {
      const it = findItem(id);
      if (!it) return;
      const s = srcOf(it);
      state.favs[id] = { ...it, savedAt: Date.now(), srcInfo: { name: s.name, cat: s.cat, lang: s.lang, type: s.type, mono: s.mono } };
      saveFavs();
    }
    renderBody();
    updateChrome();
    if (state.favs[id]) favButtons(id).forEach((b) => b.classList.add('pop'));
  }

  /** Nettoie un favori venu d'un fichier importé : seuls les champs connus, liens http(s) uniquement. */
  function cleanFav(f) {
    const link = safeUrl(f.link);
    if (!f.id || !f.title || !link) return null;
    const info = f.srcInfo || {};
    return {
      id: String(f.id), title: String(f.title).slice(0, 300), link, date: Number(f.date) || 0,
      summary: String(f.summary || '').slice(0, 400), image: f.image ? safeUrl(f.image) : '',
      src: String(f.src || ''), savedAt: Number(f.savedAt) || Date.now(),
      srcInfo: { name: String(info.name || '').slice(0, 60), cat: CAT[info.cat] ? info.cat : 'info', lang: info.lang === 'fr' ? 'fr' : 'en', type: TYPES[info.type] ? info.type : 'perso', mono: info.mono ? String(info.mono).slice(0, 4) : undefined },
      repo: !!f.repo, stars: Number(f.stars) || 0, forks: Number(f.forks) || 0, language: String(f.language || ''),
      topics: Array.isArray(f.topics) ? f.topics.map(String).slice(0, 12) : [], archived: !!f.archived,
      host: String(f.host || ''), via: f.via ? String(f.via).slice(0, 80) : undefined, points: f.points == null ? undefined : Number(f.points) || 0,
      comments: Number(f.comments) || 0, discuss: f.discuss ? safeUrl(f.discuss) || undefined : undefined,
    };
  }

  function exportData() {
    const data = { app: 'nexus', version: 1, exportedAt: new Date().toISOString(), pages: pagesRaw, favorites: Object.values(state.favs), sources: customRaw, disabled: [...state.disabled] };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `nexus-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Sauvegarde exportée', `${data.pages.length ? `${data.pages.length} page(s) perso, ` : ''}${data.favorites.length} favori(s), ${data.sources.length} source(s) perso et ${data.disabled.length} source(s) retirée(s) dans le fichier téléchargé.`);
  }

  async function importData(file) {
    try {
      const data = JSON.parse(await file.text());
      if (data?.app !== 'nexus') throw new Error('Ce fichier n’est pas une sauvegarde NEXUS.');
      let np = 0;
      let nf = 0;
      let ns = 0;
      // Les pages d'abord : leurs sources s'y rattachent ensuite.
      for (const p of Array.isArray(data.pages) ? data.pages : []) {
        const page = cleanPage(p);
        if (!page || CAT[page.id] || pagesRaw.length >= MAX_PAGES) continue;
        pagesRaw.push(page);
        registerPage(page);
        np++;
      }
      for (const f of Array.isArray(data.favorites) ? data.favorites : []) {
        const fav = f && cleanFav(f);
        if (fav && !state.favs[fav.id]) { state.favs[fav.id] = fav; nf++; }
      }
      for (const r of Array.isArray(data.sources) ? data.sources : []) {
        if (!r || !CAT[r.cat]) continue;
        const kind = ['hn', 'news'].includes(r.kind) ? r.kind : 'rss';
        const urls = [].concat(r.url).map((u) => safeUrl(u)).filter(Boolean).slice(0, kind === 'news' ? 6 : 1);
        if (!urls.length || SOURCES.some((s) => s.cat === r.cat && [].concat(s.url).includes(urls[0]))) continue;
        const raw = {
          id: uid(), cat: r.cat, name: String(r.name || hostOf(urls[0])).slice(0, 60),
          site: safeUrl(r.site) || `${new URL(urls[0]).origin}/`, url: kind === 'news' ? urls : urls[0], kind,
          lang: r.lang === 'fr' ? 'fr' : 'en', keywords: String(r.keywords || '').slice(0, 300), addedAt: Date.now(),
        };
        if (kind === 'news') raw.query = splitQuery(r.query).join(', ');
        if (TYPES[r.type] && !['projet', 'perso'].includes(r.type)) raw.type = r.type;
        customRaw.push(raw);
        registerSource(raw);
        ns++;
      }
      let nd = 0;
      for (const id of Array.isArray(data.disabled) ? data.disabled : []) {
        if (!SRC[id] || SRC[id].custom || state.disabled.has(id)) continue;
        state.disabled.add(id);
        delete state.results[id];
        nd++;
      }
      saveFavs();
      savePages();
      saveCustom();
      saveDisabled();
      toast('Import terminé', `${np ? `${np} page(s) perso, ` : ''}${nf} favori(s), ${ns} source(s) perso et ${nd} source(s) retirée(s) ajoutés.`);
      buildMenu();
      renderHead();
      renderBody();
      updateChrome();
      if (ns) refresh();
    } catch (err) {
      toast('Import impossible', err instanceof SyntaxError ? 'Le fichier n’est pas un JSON valide.' : err.message);
    }
  }

  // ───────── Ajout / suppression de sources perso ─────────
  async function discoverFeeds(url) {
    const res = await fetch(`/api/discover?url=${encodeURIComponent(url)}`, { cache: 'no-store', signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(httpMessage(res.status, url, (await res.text().catch(() => '')).trim()));
    return (await res.json()).feeds || [];
  }

  async function testSource(form) {
    const data = Object.fromEntries(new FormData(form));
    const kind = form.dataset.kind === 'hn' ? 'hn' : 'rss';
    const status = $('#add-status');
    const preview = $('#add-preview');
    const button = form.querySelector('button[type="submit"]');
    state.draft = null;
    preview.innerHTML = '';
    status.className = 'add-status wait';
    status.textContent = kind === 'rss' && state.relay ? 'Recherche du flux sur le site…' : 'Test de la source…';
    button.disabled = true;
    try {
      let url;
      let site;
      let alternatives = [];
      const query = String(data.query || '').trim();
      if (kind === 'hn') {
        if (!query) throw new Error('Indiquez ce qu’il faut chercher sur Hacker News.');
        url = hnUrl(query);
        site = `https://hn.algolia.com/?q=${encodeURIComponent(query)}`;
      } else {
        const typed = String(data.url || '').trim();
        const input = typed && safeUrl(/^https?:\/\//i.test(typed) ? typed : `https://${typed}`);
        if (!input) throw new Error('Adresse invalide : collez l’adresse d’un site ou d’un flux RSS.');
        url = input;
        if (state.relay) {
          const found = await discoverFeeds(input);
          if (!found.length) throw new Error('Aucun flux RSS/Atom trouvé sur ce site. Essayez avec l’adresse exacte de son flux.');
          url = found[0].url;
          alternatives = found.slice(1);
        }
        site = `${new URL(input).origin}/`;
      }
      // Un même flux peut servir à plusieurs pages perso, mais pas deux fois à la même ; jamais en double du catalogue.
      const cat = CAT[data.cat] ? data.cat : 'info';
      const existing = SOURCES.find((s) => [].concat(s.url).includes(url) && (!s.custom || s.cat === cat));
      if (existing) {
        throw new Error(isActive(existing)
          ? `Cette source est déjà dans votre liste (${existing.name}).`
          : `${existing.name} fait partie du catalogue mais vous l’avez retirée : cliquez sur « Rétablir » plus bas.`);
      }
      const text = await getText(url);
      const items = (kind === 'hn' ? parseHN(text) : parseFeed(text, url)).filter((it) => it.title && it.link);
      const re = keywordsRe(data.keywords);
      const pageKeep = pageFilter({ cat, kind }); // page perso filtrée : l'aperçu compte ce qui parle de ses mots-clés
      const kept = items.filter((it) => (!re || re.test(`${it.title} ${it.summary}`)) && (!pageKeep || pageKeep(itemText(it))));
      const name = String(data.name || '').trim() || (kind === 'hn' ? `HN · ${query}` : feedTitle(text) || hostOf(url));
      const lang = data.lang === 'auto' ? (kind === 'hn' ? 'en' : guessLang(text, items)) : data.lang === 'fr' ? 'fr' : 'en';
      state.draft = { kind, url, site, cat, lang, name: clip(name, 60), keywords: String(data.keywords || '').trim(), filtered: !!(re || pageKeep) };
      status.className = 'add-status ok';
      status.textContent = 'Source valide';
      preview.innerHTML = previewHTML(state.draft, items, kept, alternatives);
    } catch (err) {
      status.className = 'add-status err';
      status.textContent = err.message;
    } finally {
      button.disabled = false;
    }
  }

  function confirmAdd() {
    const d = state.draft;
    if (!d) return;
    const raw = { id: uid(), cat: d.cat, name: d.name, site: d.site, url: d.url, kind: d.kind, lang: d.lang, keywords: d.keywords, addedAt: Date.now() };
    addSource(raw);
    saveCustom();
    state.draft = null;
    state.addOpen = false;
    buildMenu();
    renderHead();
    renderBody();
    updateChrome();
    toast('Source ajoutée', `« ${raw.name} » apparaît maintenant dans ${CAT[raw.cat].label}. Cliquez pour y aller.`, () => { location.hash = raw.cat; });
    refresh();
  }

  function addSource(raw) {
    if (!raw) return;
    customRaw.push(raw);
    registerSource(raw);
  }

  /** Retire une source perso de la mémoire (sans enregistrer ni redessiner). */
  function removeSource(id) {
    const src = SRC[id];
    if (!src?.custom) return;
    customRaw = customRaw.filter((r) => r.id !== id);
    SOURCES.splice(SOURCES.indexOf(src), 1);
    delete SRC[id];
    delete state.results[id];
    state.hidden.delete(id);
  }

  function deleteSource(id) {
    const src = SRC[id];
    if (!src?.custom || !confirm(`Supprimer la source « ${src.name} » ?\nVos favoris qui en proviennent sont conservés.`)) return;
    removeSource(id);
    saveCustom();
    pruneSeen();
    persist();
    buildMenu();
    renderBody();
    updateChrome();
    toast('Source supprimée', src.name);
  }

  /** Retire (ou rétablit) des sources du catalogue : une source retirée n'est ni affichée ni interrogée. */
  function setEnabled(ids, enabled) {
    const list = ids.map((id) => SRC[id]).filter((s) => s && !s.custom && isActive(s) !== enabled);
    if (!list.length) return;
    for (const s of list) {
      if (enabled) {
        state.disabled.delete(s.id);
      } else {
        state.disabled.add(s.id);
        delete state.results[s.id];
        state.hidden.delete(s.id);
      }
    }
    saveDisabled();
    pruneSeen();
    persist();
    renderBody();
    updateChrome();
    const label = list.length === 1 ? `« ${list[0].name} »` : `${list.length} sources`;
    if (enabled) {
      toast('Source rétablie', `${label} : chargement en cours.`);
      refresh();
    } else {
      toast('Source retirée', `${label} n’est plus affichée ni interrogée. Cliquez ici pour annuler.`, () => setEnabled(list.map((s) => s.id), true));
    }
  }

  // ───────── Rendu ─────────
  const phHTML = (src) => `<div class="ph" style="--h:${hue(src.name)}"><span>${esc(mono(src))}</span><em>${esc(src.name)}</em></div>`;
  const badImages = new Set(); // images en erreur (ou pixels de suivi) : remplacées par l'image générée
  const typeBadge = (type) => `<span class="type type-${type}" title="${esc(TYPES[type].hint)}">${esc(TYPES[type].label)}</span>`;
  const extLink = (href, inner, title = '') => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer"${title ? ` title="${esc(title)}"` : ''}>${inner}</a>`;
  const favBtn = (it) => {
    const on = !!state.favs[it.id];
    const label = on ? 'Retirer des favoris' : 'Ajouter aux favoris';
    return `<button class="fav${on ? ' on' : ''}" data-act="fav" data-v="${esc(it.id)}" title="${label}" aria-label="${label}" aria-pressed="${on}">${icon('bookmark')}</button>`;
  };

  function cardHTML(it, i) {
    const src = srcOf(it);
    const cat = CAT[src.cat];
    const fresh = isNew(it);
    const foot = [`<span class="lang">${src.lang.toUpperCase()}</span>`];
    if (it.host) foot.push(`<span>${esc(it.host)}</span>`);
    if (it.points != null) {
      foot.push(`<span class="pts" title="Points Hacker News">${icon('up')}${it.points}</span>`);
      if (it.discuss) foot.push(extLink(it.discuss, `${icon('chat')}${it.comments}`, 'Discussion sur Hacker News'));
    }
    if (src.lang === 'en') {
      foot.push(`<span class="push">${extLink(`https://translate.google.com/translate?sl=auto&tl=fr&u=${encodeURIComponent(it.link)}`, `${icon('translate')}Traduire`, 'Ouvrir l’article traduit en français')}</span>`);
    }
    foot.push(favBtn(it));
    const name = it.via || src.name; // article trouvé par Google Actualités : on affiche le vrai média
    return `<article class="card${fresh ? ' is-new' : ''}" data-src="${esc(src.id)}" data-key="${esc(it.id)}" style="--h:${hue(name)};--c:${cat.color};--i:${Math.min(i, 18)}">
      ${fresh ? '<span class="new-pill">NOUVEAU</span>' : ''}
      <div class="media">${it.image && !badImages.has(it.image) ? `<img src="${esc(it.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : phHTML(it.via ? { name } : src)}</div>
      <div class="body">
        <div class="meta"><span class="src"${it.via ? ` title="Trouvé via ${esc(src.name)}"` : ''}>${esc(name)}</span>${typeBadge(src.type)}${timeTag(it.date)}</div>
        <h3>${extLink(it.link, esc(it.title))}</h3>
        ${it.summary ? `<p class="sum">${esc(it.summary)}</p>` : ''}
        <div class="cf">${foot.join('')}</div>
      </div>
    </article>`;
  }

  function repoHTML(it, i) {
    const src = srcOf(it);
    const cat = CAT[src.cat];
    const [owner, name = it.title] = it.title.split('/');
    const active = Date.now() - it.date < 7 * 864e5;
    const topics = (it.topics || []).filter((t) => !GENERIC_TOPICS.has(t)).slice(0, 5);
    const tag = it.archived
      ? '<span class="tag-live tag-archived" title="Dépôt archivé : plus maintenu">ARCHIVÉ</span>'
      : active ? '<span class="tag-live" title="Code modifié cette semaine">ACTIF</span>' : '';
    return `<article class="card repo" data-src="${esc(src.id)}" data-key="${esc(it.id)}" style="--h:${hue(name)};--c:${cat.color};--i:${Math.min(i, 18)}">
      <div class="body">
        <div class="r-head">
          <img class="av" src="${esc(it.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"${badImages.has(it.image) ? ' style="visibility:hidden"' : ''}>
          <div><div class="r-owner">${esc(owner)}</div><h3>${extLink(it.link, esc(name))}</h3></div>
          ${tag}
        </div>
        ${it.summary ? `<p class="sum">${esc(it.summary)}</p>` : ''}
        ${topics.length ? `<div class="topics">${topics.map((t) => `<span class="topic">${esc(t)}</span>`).join('')}</div>` : ''}
        <div class="cf">
          <span class="stars" title="${it.stars} étoiles">${icon('star')}${compact(it.stars)}</span>
          <span title="${it.forks} forks">${icon('fork')}${compact(it.forks)}</span>
          ${it.language ? `<span class="lang-dot" style="--h:${hue(it.language)}">${esc(it.language)}</span>` : ''}
          <span class="push" title="Dernière modification du code">${icon('clock')}${timeTag(it.date, true)}</span>
          ${favBtn(it)}
        </div>
      </div>
    </article>`;
  }

  const skeletons = (n) => `<div class="grid">${'<div class="sk"></div>'.repeat(n)}</div>`;

  function emptyHTML(srcs, total, catId) {
    if (!srcs.length && !total && CAT[catId]?.custom) {
      return `<div class="empty">${icon('plus')}<b>Page vide pour l’instant</b>
        <p>Suivez des mots-clés dans la presse avec Google Actualités, ou ajoutez n’importe quel site ou flux RSS.</p>
        <div class="empty-actions"><button class="btn" data-act="edit-page">${icon('search')}Suivre des mots-clés</button>
        <button class="btn ghost" data-act="add-source" data-v="${esc(catId)}">${icon('plus')}Ajouter un site</button></div></div>`;
    }
    if (!srcs.length && !total) {
      return `<div class="empty">${icon('list')}<b>Aucune source active</b><p>Toutes les sources de cette rubrique ont été retirées.</p>
        <a class="btn" href="#sources">Gérer les sources</a></div>`;
    }
    if (srcs.some((s) => state.pending.has(s.id)) && !total) return skeletons(6);
    if (total) {
      return `<div class="empty">${icon('filter')}<b>Aucun résultat</b><p>Aucun élément ne correspond aux filtres actuels.</p>
        <button class="btn" data-act="reset-filters">Réinitialiser les filtres</button></div>`;
    }
    const blocked = srcs.filter((s) => statusOf(s) === 'blocked').length;
    if (blocked) {
      return `<div class="empty">${icon('alert')}<b>Sources bloquées par le navigateur</b>
        <p>Ces sites interdisent la lecture directe de leurs flux. Double-cliquez sur <code>lancer.bat</code> pour passer par le relais local : toutes les sources fonctionneront.</p></div>`;
    }
    return `<div class="empty">${icon('info')}<b>Rien pour l’instant</b><p>Les sources n’ont encore rien renvoyé. Essayez de rafraîchir (touche R).</p></div>`;
  }

  function chipsHTML(catId, srcs, all) {
    const counts = {};
    for (const it of all) counts[it.src] = (counts[it.src] || 0) + 1;
    const chips = srcs.map((s) => {
      const st = statusOf(s);
      const r = state.results[s.id];
      const title = `${TYPES[s.type].label} · ${s.lang.toUpperCase()}${r?.error ? ` · ${r.error}` : ''} — cliquer pour masquer / afficher`;
      return `<button class="chip ${st}${state.hidden.has(s.id) ? ' off' : ''}" data-act="chip" data-v="${s.id}" style="--h:${hue(s.name)}" title="${esc(title)}"><i></i>${esc(s.name)}<b>${counts[s.id] || 0}</b></button>`;
    });
    if (srcs.some((s) => state.hidden.has(s.id))) chips.push('<button class="chip reset" data-act="chips-reset">Tout afficher</button>');
    chips.push(`<button class="chip add" data-act="add-source" data-v="${catId}" title="Ajouter votre propre source à cette rubrique">${icon('plus')}Ajouter une source</button>`);
    chips.push(`<a class="chip add" href="#sources" title="Retirer ou rétablir des sources du catalogue">${icon('list')}Gérer</a>`);
    return `<div class="chips">${chips.join('')}</div>`;
  }

  /** Bandeau d'une page perso : ses mots-clés et ce que le filtre fait de ses sites. */
  function pageKeywordsHTML(catId) {
    const terms = splitQuery(pageQuery(catId));
    if (!terms.length) {
      return `<div class="kw-bar">${icon('search')}<span class="kw-status">Aucun mot-clé : la page affiche tout ce que publient ses sites.</span>
        <button type="button" class="link" data-act="edit-page">Ajouter des mots-clés</button></div>`;
    }
    const sites = newsSources(catId).filter((s) => s.kind !== 'news');
    const n = sites.length;
    const parts = ['Presse : Google Actualités'];
    if (n && pagesRaw.find((p) => p.id === catId)?.filter) {
      const skipped = sites.reduce((sum, s) => sum + (state.results[s.id]?.skipped || 0), 0);
      const s = skipped > 1 ? 's' : '';
      parts.push(`${n > 1 ? `vos ${n} sites` : 'votre site'} : seulement les articles qui en parlent${skipped ? ` (${skipped} autre${s} masqué${s})` : ''}
        <button type="button" class="link" data-act="page-filter" data-v="off">Tout afficher</button>`);
    } else if (n) {
      parts.push(`${n > 1 ? `vos ${n} sites affichent` : 'votre site affiche'} tous leurs articles
        <button type="button" class="link" data-act="page-filter" data-v="on">Seulement ceux qui en parlent</button>`);
    }
    return `<div class="kw-bar">${icon('search')}<span class="kw-label">Mots-clés suivis</span>${terms.map((t) => `<span class="kw">${esc(t)}</span>`).join('')}
      <span class="kw-status">${parts.join(' · ')}</span></div>`;
  }

  function newsHTML(catId) {
    const srcs = newsSources(catId);
    const all = newsItems(catId);
    const items = filterItems(all);
    const shown = items.slice(0, limit);
    return `${CAT[catId]?.custom ? pageKeywordsHTML(catId) : ''}${chipsHTML(catId, srcs, all)}
      <div class="count-line"><span><b>${items.length}</b> article${items.length > 1 ? 's' : ''}${items.length !== all.length ? ` sur ${all.length}` : ''}</span></div>
      ${shown.length ? `<div class="grid ${state.view}">${shown.map(cardHTML).join('')}</div>${moreHTML(items.length - shown.length)}` : emptyHTML(srcs, all.length, catId)}`;
  }

  function projectsHTML(catId) {
    const srcs = projectSources(catId);
    const all = dedupe(srcs.flatMap((s) => state.results[s.id]?.items || []));
    const items = filterItems(all, 'projects').sort(state.projSort === 'stars' ? (a, b) => b.stars - a.stars : (a, b) => b.date - a.date);
    const info = srcs.map((s) => {
      const r = state.results[s.id];
      if (!r) return '';
      const next = r.at + (s.minAge ?? 30) * 1000;
      return `GitHub interrogé ${ago(r.at)} · ${[].concat(s.url).length} recherches · prochaine mise à jour ${next > Date.now() ? ago(next) : 'au prochain cycle'}${r.error ? ` · ⚠ ${esc(r.error)}` : ''}`;
    }).join('');
    return `<div class="count-line"><span><b>${items.length}</b> projet${items.length > 1 ? 's' : ''}${info ? ` · ${info}` : ''}</span></div>
      ${items.length ? `<div class="grid">${items.slice(0, limit).map(repoHTML).join('')}</div>${moreHTML(items.length - limit)}` : emptyHTML(srcs, all.length)}`;
  }

  // ───────── Jouer et Utiliser : jeux (js/games.js) et apps (js/apps.js) rétro-ingéniérés ─────────
  /** `texte` → <code>texte</code>, après échappement. */
  const richText = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
  /** 'propriétaire/projet' → GitHub ; une adresse complète (Codeberg, GitLab…) reste telle quelle. */
  const repoUrl = (r) => (/^https?:\/\//.test(r) ? r : `https://github.com/${r}`);
  const searchTokens = () => norm(state.q).split(/\s+/).filter(Boolean);
  const matches = (tokens, text) => !tokens.length || tokens.every((t) => norm(text).includes(t));

  /** Fiche commune aux deux catalogues : f.launch = lien utilisable dans le navigateur. */
  function ficheHTML(f, i) {
    const link = (url, cls, body, title = '') => `<a class="${cls}" href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer"${title ? ` title="${esc(title)}"` : ''}>${body}</a>`;
    const links = [];
    if (f.launch) links.push(link(f.launch, 'btn play', `${icon('play')}${f.launchLabel}`));
    if (f.download) links.push(link(f.download, `btn${f.launch ? ' ghost' : ''}`, `${icon('download')}Télécharger`));
    (f.code || []).forEach((r, k) => {
      const url = repoUrl(r);
      links.push(link(url, 'btn ghost', `${icon('code')}${k === 0 ? 'Code source' : esc(url.split('/').pop())}`, url.replace(/^https?:\/\//, '')));
    });
    if (f.site) links.push(link(f.site, 'btn ghost', `${icon('globe')}Site officiel`));
    return `<article class="card game" data-key="${esc(f.key)}" style="--h:${hue(f.title)};--c:${f.color};--i:${Math.min(i, 18)}">
      <div class="g-body">
        <div class="g-head">
          <div><h3>${esc(f.title)}</h3><p class="g-orig">${esc(f.original)}</p></div>
          ${f.launch ? `<span class="tag-live" title="${f.liveHint}">EN LIGNE</span>` : ''}
        </div>
        <p class="g-proj"><b>${esc(f.label)}</b> · ${esc(f.kind)}</p>
        <p class="g-desc">${esc(f.desc)}</p>
        <div class="g-meta"><span class="need need-${esc(f.needs)}" title="${esc(f.need.hint)}">${f.need.label}</span>${(f.platforms || []).map((p) => `<span class="plat">${esc(p)}</span>`).join('')}</div>
        ${f.needsText ? `<p class="g-need"><b>Ce qu’il faut :</b> ${richText(f.needsText)}</p>` : ''}
        <div class="g-actions">${links.join('')}</div>
        ${f.warn ? `<p class="g-warn">${icon('alert')}${richText(f.warn)}</p>` : ''}
        <details class="howto"><summary>${f.howto}</summary><ol>${(f.steps || []).map((s) => `<li>${richText(s)}</li>`).join('')}</ol></details>
      </div>
    </article>`;
  }

  const gameHTML = (g, i) => ficheHTML({
    ...g, key: `game-${g.id}`, title: g.game, label: g.project, need: NEEDS[g.needs] || NEEDS.files, color: CAT.jeux.color,
    launch: g.play, launchLabel: 'Jouer en ligne', liveHint: 'Jouable directement dans le navigateur', howto: 'Comment le lancer',
  }, i);

  const appHTML = (a, i) => ficheHTML({
    ...a, key: `app-${a.id}`, title: a.name, label: DOMAINS[a.domain] || '', need: APP_NEEDS[a.needs] || APP_NEEDS.free, color: CAT.apps.color,
    launch: a.open, launchLabel: 'Ouvrir en ligne', liveHint: 'Utilisable directement dans le navigateur', howto: 'Comment l’installer',
  }, i);

  function playHTML() {
    const tokens = searchTokens();
    const list = GAMES.filter((g) => {
      if (state.playFilter === 'online' && !g.play) return false;
      if (state.playFilter === 'free' && !['free', 'demo'].includes(g.needs)) return false;
      if (state.playFilter === 'own' && !['files', 'rom'].includes(g.needs)) return false;
      return matches(tokens, `${g.game} ${g.project} ${g.original} ${g.kind} ${g.desc} ${(g.platforms || []).join(' ')}`);
    });
    const online = GAMES.filter((g) => g.play).length;
    const free = GAMES.filter((g) => ['free', 'demo'].includes(g.needs)).length;
    const note = `<div class="play-note">${icon('info')}<p><b>Aucun jeu n’est hébergé ici.</b> Ces projets recréent le code des jeux, pas leurs graphismes ni leur musique :
      la plupart demandent <b>votre propre copie</b> du jeu original (la ROM de votre cartouche, ou des fichiers achetés sur GOG ou Steam).
      Les liens mènent uniquement aux pages officielles des projets. Les jeux « Rien à fournir » et « Démo gratuite » se jouent sans rien acheter.</p></div>`;
    return `${note}
      <div class="count-line"><span><b>${list.length}</b> jeu${list.length > 1 ? 'x' : ''}${list.length !== GAMES.length ? ` sur ${GAMES.length}` : ''} · ${online} jouables en ligne · ${free} gratuits</span></div>
      ${list.length ? `<div class="grid games">${list.map(gameHTML).join('')}</div>` : `<div class="empty">${icon('filter')}<b>Aucun jeu</b><p>Aucun jeu ne correspond à ces filtres.</p></div>`}`;
  }

  /** Plateformes du catalogue d'apps, de la plus courante à la plus rare. */
  function appPlatforms() {
    const counts = new Map();
    for (const a of APPS) for (const p of a.platforms || []) counts.set(p, (counts.get(p) || 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'));
  }

  function useHTML() {
    const tokens = searchTokens();
    const list = APPS.filter((a) => {
      if (state.useFilter !== 'all' && a.domain !== state.useFilter) return false;
      if (state.usePlat !== 'all' && !(a.platforms || []).includes(state.usePlat)) return false;
      return matches(tokens, `${a.name} ${a.original} ${a.kind} ${a.desc} ${DOMAINS[a.domain] || ''} ${(a.platforms || []).join(' ')}`);
    });
    const online = APPS.filter((a) => a.open).length;
    const free = APPS.filter((a) => a.needs === 'free').length;
    const note = `<div class="play-note">${icon('info')}<p><b>Aucune app n’est hébergée ici.</b> Ces projets font fonctionner un appareil, un service ou un format fermé
      en réimplémentant son protocole : une rétro-ingénierie que le droit européen autorise, sous conditions, quand elle sert l’interopérabilité (directive 2009/24/CE, art. 6).
      Les liens mènent uniquement aux pages officielles. Les clients non officiels (YouTube, Google Play) peuvent aller contre les conditions d’utilisation de ces services,
      et rooter ou reflasher un appareil peut faire perdre sa garantie.</p></div>`;
    return `${note}
      <div class="count-line"><span><b>${list.length}</b> app${list.length > 1 ? 's' : ''}${list.length !== APPS.length ? ` sur ${APPS.length}` : ''} · ${online} utilisables en ligne · ${free} sans rien à fournir</span></div>
      ${list.length ? `<div class="grid games">${list.map(appHTML).join('')}</div>` : `<div class="empty">${icon('filter')}<b>Aucune app</b><p>Aucune app ne correspond à ces filtres.</p></div>`}`;
  }

  // ───────── Classement des modèles d'IA : chargement et affichage ─────────
  let boardJob = null;
  /** Recharge le classement s'il a plus de 30 min (ou tout de suite si force). */
  function loadBoard(force = false) {
    if (!BOARD || boardJob) return boardJob;
    const fresh = Date.now() - state.board.at < BOARD.minAge * 1000;
    if (!force && fresh && state.board.rows.length) return null;
    const first = !state.board.rows.length;
    state.board.loading = true;
    boardJob = (async () => {
      try {
        const rows = buildBoard(JSON.parse(await getText(BOARD.models)));
        state.board = { at: Date.now(), rows, error: '', loading: false };
        writeJSON(BOARD_KEY, { at: state.board.at, rows });
      } catch (err) {
        Object.assign(state.board, { loading: false, error: err instanceof SyntaxError ? 'Réponse illisible du catalogue OpenRouter' : err.message });
      }
      boardJob = null;
      if (state.sub === 'rank') {
        if (first) renderHead(); // la liste des créateurs arrive avec les données
        renderBody();
      }
      loadSizes();
    })();
    return boardJob;
  }

  let sizesJob = null;
  /** Nombre de paramètres des modèles à poids ouverts, demandé une seule fois par modèle. */
  function loadSizes() {
    if (!BOARD || sizesJob) return;
    const todo = [...new Set(state.board.rows.map((r) => r.hf).filter((hf) => hf && !(hf in sizes)))];
    if (!todo.length) return;
    sizesJob = pool(todo, CONCURRENCY, async (hf) => {
      try {
        const data = JSON.parse(await getText(`${BOARD.sizes}${hf}?expand%5B%5D=safetensors`));
        sizes[hf] = Number(data?.safetensors?.total) || 0; // 0 : taille non publiée (on se rabat sur le nom)
      } catch { /* dépôt privé ou retiré : nouvel essai au prochain chargement */ }
    }).then(() => {
      writeJSON(SIZES_KEY, sizes);
      sizesJob = null;
      if (state.sub === 'rank') renderBody();
    });
  }

  function boardRows() {
    const tokens = norm(state.q).split(/\s+/).filter(Boolean);
    const cap = state.boardCap;
    return state.board.rows.filter((r) => {
      if (state.boardWeights === 'open' && !r.hf) return false;
      if (state.boardWeights === 'closed' && r.hf) return false;
      if (state.boardCreator !== 'all' && r.creator !== state.boardCreator) return false;
      if ((cap === 'reasoning' && !r.reasoning) || (cap === 'tools' && !r.tools) || (cap === 'free' && !r.free)) return false;
      if (['image', 'audio', 'video'].includes(cap) && !r.mods.includes(cap)) return false;
      if (!tokens.length) return true;
      const hay = norm(`${r.name} ${r.creator} ${r.id}`);
      return tokens.every((t) => hay.includes(t));
    });
  }

  /** Tri : les valeurs inconnues vont toujours à la fin ; à égalité, le plus intelligent d'abord. */
  function sortBoard(list) {
    const key = state.boardSort;
    const dir = state.boardDir === 'asc' ? 1 : -1;
    const val = (r) => (key === 'params' ? sizeOf(r) : r[key]);
    return list.sort((a, b) => {
      if (key === 'name') return dir * a.name.localeCompare(b.name, 'fr');
      const x = val(a);
      const y = val(b);
      if (x == null || y == null) return (x == null) - (y == null) || b.intel - a.intel;
      return dir * (x - y) || b.intel - a.intel;
    });
  }

  const nf = (n, digits = 1) => n.toLocaleString('fr-FR', { maximumFractionDigits: digits });
  const fmtPrice = (p) => (p == null ? '—' : p === 0 ? 'Gratuit' : `${p.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: p < 0.1 ? 3 : 2 })} $`);
  const fmtCtx = (c) => (!c ? '—' : c >= 1e6 ? `${nf(c / 1e6)} M` : `${nf(c / 1e3, 0)} k`);
  const fmtSize = (n) => (!n ? '—' : n >= 1e12 ? `${nf(n / 1e12)} T` : n >= 1e9 ? `${nf(n / 1e9, n < 1e10 ? 1 : 0)} B` : `${nf(n / 1e6, 0)} M`);
  const fmtMonth = (t) => (t ? new Date(t).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '—');
  const dirLabel = () => (state.boardDir === 'asc' ? '↑ Croissant' : '↓ Décroissant');
  const MOD_ICONS = { image: ['eye', 'Images'], audio: ['music', 'Audio'], video: ['film', 'Vidéo'] };

  function boardRowHTML(r, i, max) {
    const key = state.boardSort;
    const td = (k, label, inner, extra = '') => `<td class="b-${k}${k === key ? ' on' : ''}" data-label="${label}"${extra}>${inner}</td>`;
    const size = sizeOf(r);
    const tags = [
      r.hf ? `<a class="b-tag open" href="https://huggingface.co/${esc(r.hf)}" target="_blank" rel="noopener noreferrer" title="Poids téléchargeables sur Hugging Face : ${esc(r.hf)}">Poids ouverts</a>` : '',
      r.reasoning ? '<span class="b-tag" title="Peut raisonner avant de répondre">Raisonnement</span>' : '',
      r.free ? '<span class="b-tag free" title="Une version gratuite existe sur OpenRouter (avec des limites d’usage)">Gratuit</span>' : '',
      r.mods.length ? `<span class="b-mods" title="Accepte aussi en entrée : ${r.mods.map((m) => MOD_ICONS[m][1].toLowerCase()).join(', ')}">${r.mods.map((m) => icon(MOD_ICONS[m][0])).join('')}</span>` : '',
    ].join('');
    return `<tr class="b-row${i < 3 ? ` m${i + 1}` : ''}" data-key="m:${esc(r.id)}" style="--h:${hue(r.creator)}">
      <td class="b-rank"><span>${i + 1}</span></td>
      <td class="b-model${key === 'name' ? ' on' : ''}"><a class="b-name" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" title="${esc(r.desc || r.name)}">${esc(r.name)}</a>
        <div class="b-sub"><span class="b-creator">${esc(r.creator)}</span>${tags}</div></td>
      ${td('intel', 'Intelligence', `<b>${nf(r.intel)}</b><span class="b-bar"><i style="width:${Math.max(2, (r.intel / max) * 100).toFixed(1)}%"></i></span>`)}
      ${td('code', 'Code', r.code == null ? '—' : nf(r.code))}
      ${td('agent', 'Agents', r.agent == null ? '—' : nf(r.agent))}
      ${td('pin', 'Entrée $/M', fmtPrice(r.pin))}
      ${td('pout', 'Sortie $/M', fmtPrice(r.pout))}
      ${td('value', 'Intel. / $', r.value == null ? '—' : nf(r.value, r.value < 10 ? 1 : 0), r.blend != null ? ` title="Prix mixte : ${fmtPrice(r.blend)} par million de tokens"` : '')}
      ${td('ctx', 'Contexte', fmtCtx(r.ctx), r.ctx ? ` title="${r.ctx.toLocaleString('fr-FR')} tokens"` : '')}
      ${td('params', 'Taille', size ? fmtSize(size) : '<span class="dim">—</span>', size ? ` title="${Math.round(size).toLocaleString('fr-FR')} paramètres"` : ' title="Taille non publiée par le créateur"')}
      ${td('created', 'Date de sortie', `${fmtMonth(r.created)}${r.cutoff ? `<small title="Date limite des connaissances">savoir : ${fmtMonth(r.cutoff)}</small>` : ''}`)}
    </tr>`;
  }

  function boardHTML() {
    loadBoard();
    const { rows, at, error, loading } = state.board;
    const ext = (href, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    const note = `<div class="play-note board-note">${icon('info')}<p><b>Index d’intelligence</b> : score de synthèse calculé par ${ext('https://artificialanalysis.ai/', 'Artificial Analysis')} sur une série de tests (raisonnement, connaissances, maths, code…), avec des indices dédiés au code et aux agents.
      Prix, contexte et dates : catalogue public d’${ext('https://openrouter.ai/models', 'OpenRouter')} ; taille des modèles à poids ouverts : Hugging Face.
      Prix en dollars par million de tokens. La vitesse et la latence ne sont pas publiées par ces sources ouvertes : voir le ${ext('https://artificialanalysis.ai/leaderboards/models', 'classement complet d’Artificial Analysis')}.</p></div>`;
    if (!rows.length) {
      if (error) {
        return `${note}<div class="empty">${icon('alert')}<b>Classement indisponible</b><p>${esc(error)}</p>
          <button class="btn" data-act="board-retry">${icon('undo')}Réessayer</button></div>`;
      }
      return `${note}<div class="board-wrap"><div class="sk-row"></div>${'<div class="sk-row"></div>'.repeat(9)}</div>`;
    }
    const max = Math.max(...rows.map((r) => r.intel));
    const best = (list, f) => list.filter((r) => f(r) != null).reduce((a, b) => (a && f(a) >= f(b) ? a : b), null);
    const highlights = [
      ['trophy', 'Le plus intelligent', best(rows, (r) => r.intel), (r) => `indice ${nf(r.intel)}`],
      ['code', 'Le meilleur en code', best(rows, (r) => r.code), (r) => `indice code ${nf(r.code)}`],
      ['download', 'Meilleur à poids ouverts', best(rows.filter((r) => r.hf), (r) => r.intel), (r) => `indice ${nf(r.intel)}${sizeOf(r) ? ` · ${fmtSize(sizeOf(r))}` : ''}`],
      ['star', 'Meilleur rapport qualité / prix', best(rows.filter((r) => r.intel >= max * 0.75), (r) => r.value), (r) => `indice ${nf(r.intel)} · ${fmtPrice(r.blend)}/M mixte`],
    ].filter(([, , r]) => r).map(([ic, label, r, detail]) => `<a class="b-hi" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" style="--h:${hue(r.creator)}">
        <span class="b-hi-k">${icon(ic)}${label}</span><b>${esc(r.name)}</b><em>${esc(r.creator)} · ${detail(r)}</em></a>`).join('');
    const list = sortBoard(boardRows());
    const key = state.boardSort;
    const th = (k, label, cls = '') => `<th class="b-${cls || k}${k === key ? ' on' : ''}"${k === key ? ` aria-sort="${state.boardDir === 'asc' ? 'ascending' : 'descending'}"` : ''}>
      <button type="button" data-act="bsort" data-v="${k}" title="Trier par ${esc(BOARD_SORTS[k].label.toLowerCase())}">${label}${k === key ? `<i>${state.boardDir === 'asc' ? '↑' : '↓'}</i>` : ''}</button></th>`;
    const table = list.length ? `<div class="board-wrap"><table class="board">
        <thead><tr><th class="b-rank">#</th>${th('name', 'Modèle', 'model')}${th('intel', 'Intelligence')}${th('code', 'Code')}${th('agent', 'Agents')}${th('pin', 'Entrée $/M')}${th('pout', 'Sortie $/M')}${th('value', 'Intel. / $')}${th('ctx', 'Contexte')}${th('params', 'Taille')}${th('created', 'Date')}</tr></thead>
        <tbody>${list.slice(0, limit).map((r, i) => boardRowHTML(r, i, max)).join('')}</tbody></table>${moreHTML(list.length - limit)}</div>`
      : `<div class="empty">${icon('filter')}<b>Aucun modèle</b><p>Aucun modèle ne correspond à ces filtres.</p></div>`;
    const open = rows.filter((r) => r.hf).length;
    return `${note}<div class="b-his">${highlights}</div>
      <div class="count-line"><span><b>${list.length}</b> modèle${list.length > 1 ? 's' : ''}${list.length !== rows.length ? ` sur ${rows.length}` : ''} · ${open} à poids ouverts · mis à jour ${timeTag(at)}${loading ? ' · actualisation…' : ''}${error ? ` · ⚠ ${esc(error)}` : ''}</span></div>
      ${table}`;
  }

  /** Bouton « Afficher plus » ; il se déclenche aussi tout seul en approchant du bas (voir setupReveal). */
  const moreHTML = (left) => (left > 0
    ? `<div id="more" class="load-more"><button type="button" class="btn ghost" data-act="more">${icon('plus')}Afficher plus <span>(${left} restant${left > 1 ? 's' : ''})</span></button></div>`
    : '');

  function favoritesHTML() {
    const all = Object.values(state.favs);
    if (!all.length) {
      return `<div class="empty">${icon('bookmark')}<b>Aucun favori pour l’instant</b>
        <p>Cliquez sur l’icône signet en bas d’un article ou d’un projet pour le retrouver ici, même quand il aura disparu des flux.</p></div>`;
    }
    const items = filterItems(all, 'favs').sort(state.favSort === 'date' ? (a, b) => (b.date || 0) - (a.date || 0) : (a, b) => b.savedAt - a.savedAt);
    return `<div class="count-line"><span><b>${items.length}</b> favori${items.length > 1 ? 's' : ''}${items.length !== all.length ? ` sur ${all.length}` : ''} · enregistrés dans ce navigateur</span></div>
      ${items.length ? `<div class="grid">${items.slice(0, limit).map((it, i) => (it.repo ? repoHTML(it, i) : cardHTML(it, i))).join('')}</div>${moreHTML(items.length - limit)}` : emptyHTML([], all.length)}`;
  }

  function radarHTML() {
    const now = Date.now();
    const perCat = CATEGORIES.map((c) => ({ c, items: newsItems(c.id) }));
    const everything = dedupe(perCat.flatMap((p) => p.items));
    const active = activeSources();
    const repos = dedupe(active.filter((s) => s.kind === 'github').flatMap((s) => state.results[s.id]?.items || []));
    const online = active.filter((s) => state.results[s.id]?.ok).length;
    const stats = [
      ['Articles des dernières 24 h', everything.filter((it) => now - it.date < 864e5).length, '#00e5ff'],
      ['Nouveaux (30 min)', everything.filter(isNew).length, '#ff2bd6'],
      ['Sources en ligne', `${online}<small>/${active.length}</small>`, '#a3ff12'],
      ['Projets GitHub suivis', repos.length, '#ffb020'],
    ];
    const panels = perCat.map(({ c, items }) => {
      const n = unseen(c.id);
      const rows = items.slice(0, 7).map((it) => {
        const name = it.via || SRC[it.src].name;
        return `<a class="row${isNew(it) ? ' is-new' : ''}" href="${esc(it.link)}" target="_blank" rel="noopener noreferrer" style="--h:${hue(name)}">
          ${timeTag(it.date, true)}<span><span class="s">${esc(name)}</span><span class="t">${esc(it.title)}</span></span></a>`;
      }).join('');
      const srcs = newsSources(c.id);
      const waiting = srcs.some((s) => state.pending.has(s.id));
      const none = srcs.length ? 'Aucun article pour le moment.'
        : c.custom ? `Page vide : <a href="#${c.id}">ajoutez-lui des sources</a>.` : 'Aucune source active : <a href="#sources">gérer les sources</a>.';
      return `<section class="panel" style="--c:${c.color}">
        <header class="panel-h">${icon(c.icon)}<h2>${esc(c.label)}</h2>${n ? `<b class="badge">+${n}</b>` : ''}<a class="more" href="#${c.id}">Tout voir →</a></header>
        ${rows || (waiting ? '<div class="sk-row"></div>'.repeat(5) : `<div class="empty" style="margin:16px;padding:30px 16px"><p>${none}</p></div>`)}
      </section>`;
    }).join('');
    return `<div class="stats">${stats.map(([label, value, color]) => `<div class="stat" style="--sc:${color}"><b>${value}</b><span>${label}</span></div>`).join('')}</div>
      <div class="panels">${panels}</div>`;
  }

  const SOURCE_LABELS = { ok: 'En ligne', err: 'Erreur', blocked: 'Bloquée (CORS)', wait: 'Chargement…', idle: 'Pas encore interrogée' };

  function sourceRowHTML(s) {
    const off = !isActive(s);
    const r = off ? null : state.results[s.id];
    const st = off ? 'idle' : statusOf(s);
    const urls = [].concat(s.url);
    const sub = [off ? 'Retirée : ni affichée ni interrogée' : SOURCE_LABELS[st]];
    if (r?.at) sub.push(`interrogée ${ago(r.at)}`);
    if ((s.minAge ?? 30) >= 300) sub.push(`au plus toutes les ${Math.round(s.minAge / 60)} min`);
    if (s.include) sub.push(s.custom ? `filtre : ${s.keywords}` : 'filtrée par mots-clés');
    if (pageFilter(s)) sub.push(`filtrée par les mots-clés de la page : ${pageQuery(s.cat)}`);
    if (s.exclude && s.kind !== 'github') sub.push('sujets « jeux » exclus');
    const cat = CAT[s.cat];
    const name = esc(s.name);
    let action;
    if (s.custom) action = `<button class="si-del" data-act="del-source" data-v="${esc(s.id)}" title="Supprimer cette source" aria-label="Supprimer ${name}">${icon('trash')}</button>`;
    else if (off) action = `<button class="si-toggle restore" data-act="enable-source" data-v="${esc(s.id)}" title="Remettre cette source" aria-label="Rétablir ${name}">${icon('undo')}Rétablir</button>`;
    else action = `<button class="si-toggle" data-act="disable-source" data-v="${esc(s.id)}" title="Ne plus afficher ni interroger cette source" aria-label="Retirer ${name}">${icon('minus')}Retirer</button>`;
    return `<article class="src-item${off ? ' off' : ''}" style="--h:${hue(s.name)}">
      <span class="dot ${st}" title="${off ? 'Retirée' : SOURCE_LABELS[st]}"></span>
      <div class="si-main">${extLink(s.site, name).replace('<a ', '<a class="si-name" ')}${typeBadge(s.type)}<span class="lang">${s.lang.toUpperCase()}</span>${s.custom ? `<span class="cat-tag" style="--c:${cat.color}">${esc(cat.label)}</span>` : ''}</div>
      <div class="si-stats">${r ? `${r.items.length} élém.${r.ms ? ` · ${r.ms} ms` : ''}` : ''}${action}</div>
      <div class="si-sub">${esc(sub.join(' · '))}${r && !r.ok ? ` · <button class="si-retry" data-act="retry" data-v="${esc(s.id)}">réessayer</button>` : ''}</div>
      ${r?.error ? `<div class="si-err">${esc(r.error)}</div>` : ''}
      <div class="si-urls">${urls.slice(0, 2).map((u) => extLink(u, esc(u))).join('')}${urls.length > 2 ? `<span class="si-sub">+ ${urls.length - 2} autre(s) requête(s)</span>` : ''}</div>
    </article>`;
  }

  function sourcesHTML() {
    const note = state.relay
      ? `<div class="mode-note">${icon('info')}<p>Relais actif : les flux sont lus par <code>serveur.py</code> ${state.hosted ? 'sur le serveur qui héberge ce site' : 'sur votre machine'}, puis analysés dans votre navigateur. Aucun service tiers entre vous et les sources.</p></div>`
      : `<div class="mode-note">${icon('alert')}<p>Mode direct : la page est ouverte sans relais, seules les sources qui autorisent la lecture depuis une autre page répondent. Lancez <code>lancer.bat</code> pour activer toutes les sources.</p></div>`;
    const custom = SOURCES.filter((s) => s.custom);
    const mine = `<section class="src-cat" style="--c:#ffd34d"><h2>${icon('plus')}Vos sources perso (${custom.length})</h2>
      ${custom.length ? `<div class="src-list">${custom.map(sourceRowHTML).join('')}</div>` : '<p class="src-empty">Aucune pour l’instant : utilisez « Ajouter une source » ci-dessus.</p>'}</section>`;
    const legend = `<div class="legend">${Object.entries(TYPES).map(([k, t]) => `<div class="lg"><span class="type type-${k}">${esc(t.label)}</span><p>${esc(t.hint)}</p></div>`).join('')}</div>`;
    const catalog = SOURCES.filter((s) => !s.custom);
    const removed = catalog.filter((s) => !isActive(s)).length;
    const bar = `<div class="catalog-bar">${icon('list')}<p><b>Catalogue :</b> ${catalog.length - removed} source${catalog.length - removed > 1 ? 's' : ''} active${catalog.length - removed > 1 ? 's' : ''} sur ${catalog.length}.
      ${removed ? '' : 'Toutes sont actives par défaut : « Retirer » masque une source partout et arrête de l’interroger.'}</p>
      ${removed ? `<button type="button" class="btn ghost" data-act="enable-all">${icon('undo')}Tout rétablir (${removed})</button>` : ''}</div>`;
    const groups = CATEGORIES.filter((c) => !c.custom).map((c) => { // les pages perso n'ont que des sources perso, listées plus haut
      const list = catalog.filter((s) => s.cat === c.id);
      const off = list.filter((s) => !isActive(s)).length;
      return `<section class="src-cat" style="--c:${c.color}"><h2>${icon(c.icon)}${esc(c.long)}<small>${list.length - off}/${list.length} actives</small></h2>
        <div class="src-list">${list.map(sourceRowHTML).join('')}</div></section>`;
    }).join('');
    return note + mine + legend + bar + groups;
  }

  // ───────── Nouveautés : historique des versions (js/changelog.js) ─────────
  const CHANGE_TYPES = { new: 'Nouveau', better: 'Amélioré', fix: 'Corrigé' };
  const longDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  let clFresh = 0; // versions encore jamais vues à l'ouverture de la page : elles restent signalées tant qu'on y est

  function releaseHTML(r, i) {
    const fresh = i < clFresh;
    return `<li class="cl-rel${fresh ? ' fresh' : ''}" data-key="v${esc(r.version)}" style="--i:${Math.min(i, 12)}">
      <article class="cl-card">
        <header class="cl-head">
          <span class="cl-ver">v${esc(r.version)}</span>
          <h3>${esc(r.title)}</h3>
          <time datetime="${esc(r.date)}">${longDate(r.date)}</time>
          ${i === 0 ? '<span class="cl-tag cl-now">En ligne</span>' : ''}${fresh ? '<span class="cl-tag cl-fresh">Nouveau pour vous</span>' : ''}
        </header>
        <ul class="cl-changes">${(r.changes || []).map(([type, text]) => `<li><span class="cl-type t-${esc(type)}">${CHANGE_TYPES[type] || ''}</span><span>${esc(text)}</span></li>`).join('')}</ul>
      </article>
    </li>`;
  }

  function changelogHTML() {
    if (!CHANGELOG.length) return `<div class="empty">${icon('gift')}<b>Aucune version</b><p>L’historique des versions (js/changelog.js) est introuvable.</p></div>`;
    const [now] = CHANGELOG;
    const first = CHANGELOG[CHANGELOG.length - 1];
    const changes = CHANGELOG.reduce((n, r) => n + (r.changes || []).length, 0);
    const repo = safeUrl(PROJECT.repo || '');
    const s = clFresh > 1 ? 's' : '';
    const status = clFresh
      ? `<b>${clFresh} nouvelle${s} version${s}</b> depuis votre dernière visite, signalée${s} ci-dessous.`
      : 'Vous êtes à jour : vous avez déjà vu toutes les nouveautés.';
    return `<section class="cl-hero">
        <p class="kicker">// version en ligne</p>
        <h2>NEXUS <span>v${esc(now.version)}</span></h2>
        <p class="cl-meta">${longDate(now.date)} · ${esc(now.title)}</p>
        <p class="cl-status">${icon(clFresh ? 'gift' : 'check')}<span>${status}</span></p>
        ${repo ? `<a class="btn ghost" href="${esc(repo)}/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer">${icon('code')}CHANGELOG.md sur GitHub</a>` : ''}
      </section>
      <div class="count-line"><span><b>${CHANGELOG.length}</b> versions · ${changes} changements depuis le ${longDate(first.date)}</span></div>
      <ol class="cl-list">${CHANGELOG.map(releaseHTML).join('')}</ol>`;
  }

  function aboutHTML() {
    const catalog = SOURCES.filter((s) => !s.custom);
    const solid = catalog.filter((s) => ['officiel', 'presse', 'recherche'].includes(s.type)).length;
    const license = esc(PROJECT.license || 'MIT');
    const pillars = [
      ['user', 'Sans compte', 'Aucune inscription, aucun identifiant, aucune adresse e-mail. Vous arrivez, vous lisez.'],
      ['gift', 'Gratuit', 'Pas d’abonnement, pas de publicité, pas de version premium. Chaque article renvoie vers son site d’origine (certains éditeurs ont leur propre accès payant).'],
      ['code', 'Open source', `Tout le code est ouvert sous licence ${license} : vous pouvez le lire, le modifier et héberger votre propre NEXUS.`],
      ['eye', 'Sources visibles', `${catalog.length} sources sélectionnées, dont ${solid} officielles, de presse ou de recherche. Chaque article affiche d’où il vient et le type de sa source.`],
      ['lock', 'Vos données restent chez vous', 'Favoris, sources perso et réglages sont enregistrés dans votre navigateur. Aucun pisteur, aucune statistique de visite.'],
    ];
    const features = [
      'L’actualité IA, informatique et cybersécurité, en français et en anglais',
      'Le classement des modèles d’IA : intelligence, code, agents, prix, contexte, taille, date de sortie',
      'Les apps et jeux rétro-ingéniérés : articles, projets GitHub, jeux jouables et apps à installer, avec la marche à suivre',
      'Un rafraîchissement automatique, jusqu’à toutes les 30 secondes',
      'La recherche et des filtres par langue, date et type de source',
      'Des favoris conservés même quand l’article disparaît des flux',
      'Vos propres sources : un site, un flux RSS ou une recherche Hacker News',
      'Vos propres pages sur n’importe quel sujet (F1, foot, politique…), avec des modèles prêts à l’emploi',
      'Le retrait des sources du catalogue qui ne vous intéressent pas',
      'La traduction en un clic des articles en anglais',
      'L’export et l’import de vos réglages pour changer d’appareil',
      'Les nouveautés de chaque version, signalées quand une nouvelle version sort',
    ];
    const faq = [
      ['Pourquoi n’y a-t-il pas de compte ?', 'Parce qu’il n’en faut pas : tout ce qui vous est propre (favoris, sources, réglages) reste dans votre navigateur. Pour le retrouver ailleurs, utilisez « Exporter » puis « Importer ».'],
      ['NEXUS écrit-il les articles ?', 'Non. Comme un lecteur RSS, il affiche le titre, un court extrait et le lien de chaque article. Le contenu appartient à ses auteurs : cliquez pour le lire sur le site d’origine.'],
      ['Qu’est-ce qui est chargé depuis d’autres sites ?', 'Les images des articles (depuis leurs sites), les polices de caractères (Google Fonts) et, seulement si vous cliquez sur « Traduire », Google Traduction. Rien d’autre.'],
      ['Pourquoi un petit serveur ?', 'Les navigateurs interdisent à une page de lire directement les flux des autres sites. Le relais serveur.py les lit à sa place et garde une copie 20 secondes, sans rien enregistrer d’autre.'],
      ['Comment changer les sources ?', 'Page Sources : retirez une source du catalogue ou ajoutez la vôtre. Pour modifier le catalogue de tout le monde, éditez le fichier js/sources.js.'],
      ['Puis-je suivre autre chose que la tech ?', 'Oui : menu → « Créer une page ». Partez d’un modèle (politique, F1, foot, voiture…) ou d’une page vide, choisissez son icône et sa couleur, puis suivez des mots-clés dans la presse (Google Actualités) ou ajoutez vos sites. Par défaut, les sites de la page n’affichent que les articles qui parlent de vos mots-clés. La page reste dans votre navigateur.'],
    ];
    const files = [['js/app.js', 'l’application'], ['js/sources.js', 'le catalogue des sources'], ['css/style.css', 'le style'], ['serveur.py', 'le relais'], ['CHANGELOG.md', 'le journal des versions'], ['LICENSE', 'la licence']];
    const repo = safeUrl(PROJECT.repo || '');
    return `<div class="about">
      <section class="about-hero">
        <p class="kicker">// le projet</p>
        <h2>L’actu tech, <span>sans compte</span>, gratuite et open source.</h2>
        <p class="lead">NEXUS rassemble au même endroit les dernières infos sur l’intelligence artificielle, les applications et jeux rétro-ingéniérés, l’informatique et la cybersécurité. Les articles viennent directement de sources reconnues et se mettent à jour toutes les minutes. Il suffit d’ouvrir la page.</p>
        <div class="about-cta"><a class="btn" href="#radar">${icon('radar')}Voir le radar</a><a class="btn ghost" href="#sources">${icon('list')}Voir les sources</a></div>
      </section>
      <div class="pillars">${pillars.map(([ic, title, text]) => `<div class="pillar">${icon(ic)}<h3>${title}</h3><p>${text}</p></div>`).join('')}</div>
      <div class="about-grid">
        <section class="about-card">
          <h3>Comment ça marche</h3>
          <ol class="flow">
            <li><b>Les sources</b><span>${catalog.length} flux RSS et API publiques : laboratoires, presse, chercheurs en sécurité, GitHub, Hacker News.</span></li>
            <li><b>Le relais</b><span><code>serveur.py</code> récupère les flux à la place du navigateur, puisque celui-ci n’a pas le droit de les lire lui-même.</span></li>
            <li><b>Votre navigateur</b><span>Il trie, filtre et affiche les articles. Vos favoris et réglages ne quittent pas votre appareil.</span></li>
          </ol>
        </section>
        <section class="about-card">
          <h3>Ce que vous pouvez faire</h3>
          <ul class="checks">${features.map((f) => `<li>${icon('check')}<span>${f}</span></li>`).join('')}</ul>
        </section>
      </div>
      <section class="about-card">
        <h3>Questions fréquentes</h3>
        <div class="faq">${faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
      </section>
      <section class="about-card">
        <h3>${icon('code')}Code source</h3>
        <p>NEXUS est écrit en HTML, CSS et JavaScript, sans framework, avec un relais Python sans dépendance. Il est publié sous licence ${license} : vous pouvez le réutiliser librement, y compris pour héberger votre propre version. Le code exécuté par cette page est lisible ici :</p>
        <div class="code-links">${files.map(([file, what]) => `<a href="${file}" target="_blank" rel="noopener"><code>${file}</code><span>${what}</span></a>`).join('')}${repo ? `<a href="${esc(repo)}" target="_blank" rel="noopener noreferrer"><code>GitHub</code><span>le dépôt du projet</span></a>` : ''}</div>
      </section>
      <p class="about-foot">NEXUS <a href="#nouveautes" title="Nouveautés de cette version">v${esc(VERSION)}</a> · ${activeSources().length} sources actives · aucune donnée personnelle collectée</p>
    </div>`;
  }

  function seg(act, current, options, titles = []) {
    return `<div class="seg">${options.map(([v, label], i) => `<button type="button" data-act="${act}" data-v="${v}" class="${v === current ? 'on' : ''}"${titles[i] ? ` title="${titles[i]}" aria-label="${titles[i]}"` : ''}>${label}</button>`).join('')}</div>`;
  }

  const searchHTML = (placeholder) => `<label class="search">${icon('search')}<input id="q" type="search" placeholder="${esc(placeholder)}" value="${esc(state.q)}" autocomplete="off" spellcheck="false"><kbd>/</kbd></label>`;
  const backupHTML = () => `<div class="backup">
      <button type="button" class="btn ghost" data-act="export" title="Télécharger vos favoris et vos sources perso dans un fichier">${icon('download')}Exporter</button>
      <button type="button" class="btn ghost" data-act="import" title="Recharger une sauvegarde (autre navigateur, autre appareil)">${icon('upload')}Importer</button>
    </div>`;

  function toolbarHTML() {
    const select = (act, label, options, current) => `<select class="ctl" data-act="${act}" aria-label="${label}">${options.map(([v, l]) => `<option value="${esc(v)}"${v === current ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    if (state.sub === 'rank') {
      const counts = new Map();
      for (const r of state.board.rows) counts.set(r.creator, (counts.get(r.creator) || 0) + 1);
      const creators = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'));
      return `<div class="toolbar">${searchHTML('Rechercher un modèle, un créateur…')}
        ${select('boardSort', 'Trier par', Object.entries(BOARD_SORTS).map(([k, s]) => [k, `Trier : ${s.label}`]), state.boardSort)}
        <button type="button" class="btn ghost b-dir" data-act="bdir" title="Inverser l’ordre">${dirLabel()}</button>
        ${seg('bweights', state.boardWeights, [['all', 'Tous'], ['open', `${icon('download')}Poids ouverts`], ['closed', `${icon('lock')}Propriétaires`]])}
        ${select('boardCap', 'Capacités', Object.entries(BOARD_CAPS), state.boardCap)}
        ${select('boardCreator', 'Créateur', [['all', 'Tous les créateurs'], ...creators.map(([c, n]) => [c, `${c} (${n})`])], state.boardCreator)}
      </div>`;
    }
    if (state.sub === 'play') {
      return `<div class="toolbar">${searchHTML('Rechercher un jeu, une console…')}
        ${seg('playf', state.playFilter, [['all', 'Tous'], ['online', `${icon('play')}Jouables en ligne`], ['free', 'Gratuits'], ['own', 'Avec votre copie']])}</div>`;
    }
    if (state.sub === 'use') {
      return `<div class="toolbar">${searchHTML('Rechercher une app, un appareil, une marque…')}
        ${seg('usef', state.useFilter, [['all', 'Tous'], ...Object.entries(DOMAINS)])}
        ${select('usePlat', 'Plateforme', [['all', 'Toutes les plateformes'], ...appPlatforms().map(([p, n]) => [p, `${p} (${n})`])], state.usePlat)}</div>`;
    }
    const search = searchHTML('Rechercher dans cette rubrique…');
    if (state.sub === 'projects') {
      return `<div class="toolbar">${search}${seg('sort', state.projSort, [['stars', `${icon('star')}Populaires`], ['recent', `${icon('clock')}Récemment actifs`]])}</div>`;
    }
    const period = `<select class="ctl" data-act="period" aria-label="Période">${Object.entries(PERIODS).map(([k, l]) => `<option value="${k}"${k === state.period ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
    const type = `<select class="ctl" data-act="type" aria-label="Type de source"><option value="all">Tous types de sources</option>${Object.entries(TYPES).filter(([k]) => k !== 'projet').map(([k, t]) => `<option value="${k}"${k === state.type ? ' selected' : ''}>${t.label}</option>`).join('')}</select>`;
    return `<div class="toolbar">${search}
      ${seg('lang', state.lang, [['all', 'FR + EN'], ['fr', 'FR'], ['en', 'EN']])}
      ${period}${type}
      ${seg('view', state.view, [['grid', icon('grid')], ['list', icon('rows')]], ['Vue cartes', 'Vue liste'])}
    </div>`;
  }

  function addFormHTML() {
    const cats = CATEGORIES.map((c) => `<option value="${c.id}"${c.id === state.addCat ? ' selected' : ''}>${esc(c.label)}</option>`).join('');
    return `<section class="mysrc">
      <div class="mysrc-h">
        <div>
          <h2>${icon('plus')}Mes sources</h2>
          <p>Ajoutez n’importe quel site ou flux RSS/Atom, ou une recherche Hacker News. Vos sources sont enregistrées dans ce navigateur.</p>
        </div>
        <div class="mysrc-actions">
          <button type="button" class="btn" data-act="toggle-add" aria-expanded="${state.addOpen}">${icon('plus')}Ajouter une source</button>
          ${backupHTML()}
        </div>
      </div>
      <form id="add-form" class="add-form" data-kind="rss" autocomplete="off"${state.addOpen ? '' : ' hidden'}>
        ${seg('add-kind', 'rss', [['rss', 'Site ou flux RSS'], ['hn', 'Recherche Hacker News']])}
        <label class="field f-rss wide"><span>Adresse du site ou de son flux</span>
          <input name="url" type="text" inputmode="url" spellcheck="false" placeholder="ex. https://www.lemonde.fr/pixels ou https://exemple.com/feed"></label>
        <label class="field f-hn wide"><span>Recherche sur Hacker News</span>
          <input name="query" type="text" spellcheck="false" placeholder="ex. reverse engineering, rust, nintendo"></label>
        <label class="field"><span>Rubrique</span><select name="cat" class="ctl">${cats}</select></label>
        <label class="field"><span>Langue</span><select name="lang" class="ctl"><option value="auto">Détection auto</option><option value="fr">Français</option><option value="en">Anglais</option></select></label>
        <label class="field"><span>Nom affiché <em>(facultatif)</em></span><input name="name" type="text" maxlength="60" placeholder="Rempli automatiquement"></label>
        <label class="field"><span>Filtre mots-clés <em>(facultatif)</em></span><input name="keywords" type="text" placeholder="mots séparés par des virgules"></label>
        ${state.relay ? '' : '<p class="note-direct">Sans relais, il faut l’adresse exacte du flux, et seuls les flux qui autorisent la lecture directe (CORS) fonctionnent.</p>'}
        <div class="add-actions wide"><button type="submit" class="btn">${icon('search')}Tester la source</button><span id="add-status" class="add-status" role="status"></span></div>
        <div id="add-preview" class="wide"></div>
      </form>
    </section>`;
  }

  function previewHTML(d, items, kept, alternatives) {
    const latest = kept.slice(0, 3).map((it) => `<li>${esc(it.title)} <time>${ago(it.date)}</time></li>`).join('');
    const count = `${items.length} article${items.length > 1 ? 's' : ''}${d.filtered ? ` · ${kept.length} après filtre` : ''}`;
    return `<div class="preview">
      <div class="pv-h">${icon('check')}<b>${esc(d.name)}</b><span>${count} · ${esc(hostOf(d.url))} · ${d.lang.toUpperCase()}</span></div>
      ${latest ? `<ul>${latest}</ul>` : '<p class="pv-alt">Aucun article ne correspond pour le moment : la source sera surveillée.</p>'}
      ${alternatives.length ? `<p class="pv-alt">Autres flux trouvés sur ce site : ${alternatives.map((a) => `<button type="button" class="link" data-act="pick-feed" data-v="${esc(a.url)}">${esc(a.title || a.url)}</button>`).join(' · ')}</p>` : ''}
      <button type="button" class="btn" data-act="confirm-add">${icon('plus')}Ajouter à « ${esc(CAT[d.cat].label)} »</button>
    </div>`;
  }

  let tickerSig = '';
  function updateTicker() {
    const el = $('#ticker');
    if (!el) return;
    const items = dedupe(CATEGORIES.flatMap((c) => newsItems(c.id))).sort((a, b) => b.date - a.date).slice(0, 18);
    const sig = items.map((it) => it.id).join('|');
    if (sig === tickerSig && el.firstChild) return;
    tickerSig = sig;
    if (!items.length) { el.innerHTML = ''; return; }
    const run = (hidden) => items.map((it) => {
      const c = CAT[SRC[it.src].cat];
      return `<a href="${esc(it.link)}" target="_blank" rel="noopener noreferrer" style="--c:${c.color}"${hidden ? ' tabindex="-1"' : ''}><em>${esc(c.label)}</em><span>${esc(it.title)}</span></a>`;
    }).join('');
    el.innerHTML = `<span class="ticker-label"><i></i>En direct</span>
      <div class="ticker-view"><div class="ticker-track" style="--dur:${items.length * 7}s"><div class="ticker-run">${run(false)}</div><div class="ticker-run" aria-hidden="true">${run(true)}</div></div></div>`;
  }

  function renderHead() {
    const t = TAB[state.tab];
    const cat = CAT[state.tab];
    document.documentElement.style.setProperty('--c', t.color);
    const about = { projects: PROJECTS_ABOUT, play: PLAY_ABOUT, use: USE_ABOUT, rank: RANK_ABOUT }[state.sub]
      || (cat?.custom ? 'Votre page perso, enregistrée dans ce navigateur. Ses sources apparaissent ci-dessous ; « Personnaliser » change son nom, son icône, sa couleur et ses mots-clés.' : t.about);
    const edit = cat?.custom ? `<button type="button" class="btn ghost v-edit" data-act="edit-page">${icon('edit')}Personnaliser</button>` : '';
    let html = `<div class="v-title"><span class="ico">${icon(t.icon)}</span><div><h1>${esc(t.long)}</h1><p class="v-sub">${esc(about)}</p></div>${edit}</div>`;
    if (cat?.projects || cat?.board) {
      const subs = [['news', 'Actualités']];
      if (cat.board) subs.push(['rank', `${icon('trophy')}Classement`]);
      if (cat.projects) subs.push(['projects', 'Projets GitHub']);
      if (state.tab === 'jeux') subs.push(['play', `${icon('play')}Jouer`]);
      if (state.tab === 'apps') subs.push(['use', `${icon('rocket')}Utiliser`]);
      html += `<div class="subnav" role="tablist">${subs.map(([v, label]) => `<button data-act="sub" data-v="${v}" class="${state.sub === v ? 'on' : ''}" role="tab" aria-selected="${state.sub === v}">${label}</button>`).join('')}</div>`;
    }
    if (cat) html += toolbarHTML();
    if (state.tab === 'favoris') {
      html += `<div class="toolbar">${searchHTML('Rechercher dans vos favoris…')}
        ${seg('favsort', state.favSort, [['added', `${icon('clock')}Ajoutés récemment`], ['date', `${icon('rows')}Date de publication`]])}
        ${backupHTML()}</div>`;
    }
    if (state.tab === 'sources') html += addFormHTML();
    if (state.tab === 'radar') html += '<div id="ticker" class="ticker"></div>';
    $('#head').innerHTML = html;
    tickerSig = '';
    syncPills($('#head'));
  }

  // ───────── Mise à jour ciblée du DOM ─────────
  // Au rafraîchissement, une recherche ou un filtre, on ne remplace pas toute la page : les nœuds existants
  // sont gardés et seuls les changements sont appliqués. Les images ne se rechargent pas, le survol, le focus
  // et la position de défilement sont conservés, et un clic en cours n'est pas perdu.
  // Les éléments sont appariés par data-key (cartes, lignes) ou id, sinon par position et type.
  const morphTpl = document.createElement('template');
  const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute('data-key') || n.id || null : null);

  function morph(root, html) {
    morphTpl.innerHTML = html;
    morphChildren(root, morphTpl.content);
  }

  function morphNode(from, to) {
    if (from.nodeType !== 1) {
      if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue;
      return;
    }
    for (const { name } of [...from.attributes]) {
      if (!to.hasAttribute(name) && !(name === 'open' && from.nodeName === 'DETAILS')) from.removeAttribute(name); // « Comment le lancer » reste ouvert
    }
    for (const { name, value } of to.attributes) if (from.getAttribute(name) !== value) from.setAttribute(name, value);
    morphChildren(from, to);
  }

  function morphChildren(parent, next) {
    const keyed = new Map();
    for (let n = parent.firstChild; n; n = n.nextSibling) {
      const k = keyOf(n);
      if (k) keyed.set(k, n);
    }
    let cur = parent.firstChild; // prochain ancien nœud pas encore utilisé
    for (let nn = next.firstChild; nn;) {
      const after = nn.nextSibling;
      const k = keyOf(nn);
      let match = null;
      if (k) {
        match = keyed.get(k) || null;
        if (match && match.nodeName !== nn.nodeName) match = null;
        if (match) keyed.delete(k);
      } else if (cur && !keyOf(cur) && cur.nodeType === nn.nodeType && cur.nodeName === nn.nodeName) {
        match = cur;
      }
      if (match) {
        if (match === cur) cur = cur.nextSibling;
        else parent.insertBefore(match, cur); // élément déplacé (nouvel ordre de tri…)
        morphNode(match, nn);
      } else {
        parent.insertBefore(nn, cur); // nouvel élément
      }
      nn = after;
    }
    while (cur) { // anciens éléments absents de la nouvelle version
      const after = cur.nextSibling;
      cur.remove();
      cur = after;
    }
  }

  let lastBody = '';
  function renderBody(enter = false) {
    if (enter) limit = PAGE; // nouvel onglet ou nouveaux filtres : on repart des premières cartes
    let html;
    if (state.tab === 'radar') html = radarHTML();
    else if (state.tab === 'sources') html = sourcesHTML();
    else if (state.tab === 'favoris') html = favoritesHTML();
    else if (state.tab === 'apropos') html = aboutHTML();
    else if (state.tab === 'nouveautes') {
      if (enter) { clFresh = freshVersions(); markSeen(); } // signalées pendant la visite, vues ensuite
      html = changelogHTML();
    }
    else if (state.sub === 'projects') html = projectsHTML(state.tab);
    else if (state.sub === 'play') html = playHTML();
    else if (state.sub === 'use') html = useHTML();
    else if (state.sub === 'rank') html = boardHTML();
    else html = newsHTML(state.tab);
    if (state.tab === 'radar') updateTicker();
    if (CAT[state.tab] && !document.hidden) {
      state.lastVisit[state.tab] = Date.now();
      persistSoon();
    }
    if (html === lastBody && !enter) return;
    lastBody = html;
    const body = $('#body');
    body.classList.toggle('enter', enter);
    if (enter) body.innerHTML = html; // nouvelle page : tout est neuf
    else morph(body, html);
    setupReveal(enter);
  }

  let renderTimer = 0;
  function scheduleRender() {
    if (renderTimer) return;
    renderTimer = setTimeout(() => {
      renderTimer = 0;
      renderBody();
      updateChrome();
    }, 300);
  }

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // ───────── Menu ─────────
  const menu = $('#menu');
  const menuBtn = $('#menu-btn');
  let menuTimer = 0;

  function buildMenu() {
    let n = 0; // ordre d'apparition en cascade
    const item = (t) => {
      const i = TABS.indexOf(t);
      const key = i < 9 ? i + 1 : 0; // touches 1 à 9 : les neuf premières pages
      const count = t.custom ? SOURCES.filter((s) => s.cat === t.id).length : 0;
      const hint = t.custom ? `Page perso · ${count ? `${count} source${count > 1 ? 's' : ''}` : 'vide'}` : MENU_HINTS[t.id] || t.long;
      return `<a class="nav-item" href="#${t.id}" data-tab="${t.id}" style="--tc:${t.color};--n:${n++}" title="${esc(t.long)}${key ? ` (touche ${key})` : ''}">
        <span class="ni-ico">${icon(t.icon)}</span>
        <span class="ni-text"><span class="ni-label">${esc(t.label)}</span><span class="ni-hint">${esc(hint)}</span></span>
        <b class="badge" hidden></b>${key ? `<kbd class="ni-key">${key}</kbd>` : ''}
      </a>`;
    };
    const group = (label) => `<p class="nav-group" style="--n:${n++}">${label}</p>`;
    const pages = TABS.filter((t) => t.custom);
    $('#nav').innerHTML = group('Rubriques') + TABS.filter((t) => t.id === 'radar' || (CAT[t.id] && !t.custom)).map(item).join('')
      + group('Mes pages') + pages.map(item).join('')
      + `<button type="button" class="nav-item nav-add" data-act="new-page" style="--n:${n++}"${pages.length >= MAX_PAGES ? ' disabled' : ''}>
          <span class="ni-ico">${icon('plus')}</span>
          <span class="ni-text"><span class="ni-label">Créer une page</span><span class="ni-hint">${pages.length ? 'Un autre sujet à suivre' : 'F1, foot, politique… le sujet de votre choix'}</span></span>
        </button>`
      + group('Et aussi') + TABS.filter((t) => ['favoris', 'sources', 'apropos', 'nouveautes'].includes(t.id)).map(item).join('');
    $('#menu-meta').innerHTML = `// ${VERSION ? `<a href="#nouveautes" title="Nouveautés de la version ${esc(VERSION)}">v${esc(VERSION)}</a> · ` : ''}${TABS.length} pages`;
    updateChrome();
  }

  function openMenu() {
    clearTimeout(menuTimer);
    menu.classList.remove('closing');
    if (!menu.open) menu.showModal();
    menuBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('menu-open');
    menu.querySelector('.nav-item[aria-current="page"]')?.focus();
  }

  /** Ferme le menu : le tiroir repart vers la gauche, puis la promesse se résout. */
  function closeMenu(instant = false) {
    return new Promise((resolve) => {
      if (!menu.open) { resolve(); return; }
      clearTimeout(menuTimer);
      const done = () => { menu.close(); resolve(); };
      if (instant || reduceMotion.matches) { done(); return; }
      menu.classList.add('closing');
      menuTimer = setTimeout(done, 240);
    });
  }

  menu.addEventListener('close', () => {
    menu.classList.remove('closing');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-open');
  });
  menu.addEventListener('cancel', (e) => { e.preventDefault(); closeMenu(); }); // Échap : fermeture animée
  menu.addEventListener('click', (e) => { if (e.target === menu) closeMenu(); }); // clic sur le voile
  menuBtn.addEventListener('click', () => (menu.open ? closeMenu() : openMenu()));
  $('#nav').addEventListener('click', (e) => {
    const link = e.target.closest('a.nav-item');
    if (!link || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return; // nouvel onglet du navigateur : comportement normal
    e.preventDefault();
    closeMenu().then(() => { location.hash = link.dataset.tab; });
  });

  // Sur tablette et téléphone, l'en-tête tient sur une ligne : Auto et la fréquence passent dans le menu.
  const narrow = matchMedia('(max-width: 860px)');
  function placeControls() {
    const ctl = $('#auto-ctl');
    const slot = $('#menu-auto');
    if (narrow.matches) slot.append(ctl);
    else $('.controls').insertBefore(ctl, $('.refresh-wrap'));
    slot.hidden = !narrow.matches;
  }
  narrow.addEventListener('change', placeControls);

  // ───────── Création / modification d'une page perso ─────────
  const editor = $('#page-editor');
  let editing = null; // id de la page modifiée ; null pour une nouvelle page
  let editorTimer = 0;
  let downOnVeil = false;

  function editorHTML(page, theme) {
    const isNew = !page;
    const label = page?.label ?? theme?.label ?? '';
    const ic = page?.icon ?? theme?.icon ?? 'news';
    const color = page?.color ?? theme?.color ?? PAGE_COLORS[pagesRaw.length % PAGE_COLORS.length];
    const news = page && SOURCES.find((s) => s.cat === page.id && s.kind === 'news');
    const query = news?.query ?? theme?.query ?? '';
    const qlang = news?.lang ?? 'fr';
    // Filtre des sites : actif par défaut ; pas pour un modèle qui fournit ses propres mots-clés,
    // dont les médias sont déjà choisis pour le sujet (ses mots-clés servent à chercher dans la presse).
    const strict = page ? page.filter : !theme?.query;
    const others = page ? SOURCES.filter((s) => s.cat === page.id && s.kind !== 'news') : [];
    const presets = isNew ? `<section class="pe-sec">
        <h3>${icon('star')}Partir d’un modèle</h3>
        <div class="presets">${THEMES.map((t) => `<button type="button" class="preset${theme?.id === t.id ? ' on' : ''}" data-act="pick-preset" data-v="${t.id}" style="--pc:${t.color}" aria-pressed="${theme?.id === t.id}">${icon(t.icon)}${esc(t.label)}</button>`).join('')}
          <button type="button" class="preset blank${theme ? '' : ' on'}" data-act="pick-preset" data-v="" aria-pressed="${!theme}">${icon('plus')}Page vide</button></div>
      </section>` : '';
    const recommended = isNew && theme?.sources?.length ? `<section class="pe-sec">
        <h3>${icon('list')}Sources recommandées <em>${theme.sources.length} médias vérifiés</em></h3>
        <div class="pe-srcs">${theme.sources.map((s, i) => `<label class="pe-src"><input type="checkbox" name="src" value="${i}" checked>
          <span><b>${esc(s.name)}</b><small>${esc(hostOf(s.site || s.url))} · ${(s.lang || 'fr').toUpperCase()}${s.keywords ? ` · filtrée : ${esc(s.keywords)}` : ''}</small></span>${typeBadge(s.type || 'presse')}</label>`).join('')}</div>
      </section>` : '';
    const current = page ? `<section class="pe-sec">
        <h3>${icon('list')}Sites suivis <em>${others.length}</em></h3>
        <p class="pe-help">${others.length ? esc(others.map((s) => s.name).join(' · ')) : 'Aucun site pour l’instant.'}</p>
        <div class="pe-row"><button type="button" class="btn ghost" data-act="add-source" data-v="${page.id}">${icon('plus')}Ajouter un site</button>
        ${others.length ? `<a class="btn ghost" href="#sources">${icon('list')}Gérer dans Sources</a>` : ''}</div>
      </section>` : '';
    const custom = PAGE_COLORS.includes(color) ? '#ffffff' : color;
    return `<header class="sheet-h">
        <span class="pe-ico">${icon(ic)}</span>
        <div class="pe-titles"><p class="kicker">${isNew ? '// nouvelle page' : '// personnaliser'}</p><h2 id="pe-title">${esc(label || 'Nouvelle page')}</h2></div>
        <button type="button" class="sheet-x" data-act="close-editor" aria-label="Fermer">${icon('x')}</button>
      </header>
      <div class="sheet-body">
        ${presets}
        <label class="field"><span>Nom de la page</span>
          <input name="label" maxlength="30" value="${esc(label)}" placeholder="ex. F1, Foot, Politique jeunes…" required></label>
        <fieldset class="pe-icons"><legend>Icône</legend>${PAGE_ICONS.map((n) => `<label class="pe-icon" title="${n}"><input type="radio" name="icon" value="${n}"${n === ic ? ' checked' : ''} aria-label="Icône ${n}"><span>${icon(n)}</span></label>`).join('')}</fieldset>
        <fieldset class="pe-colors"><legend>Couleur</legend>${PAGE_COLORS.map((c) => `<label class="pe-color" style="--sw:${c}"><input type="radio" name="color" value="${c}"${c === color ? ' checked' : ''} aria-label="Couleur ${c}"><span></span></label>`).join('')}
          <label class="pe-color pe-custom" style="--sw:${custom}" title="Autre couleur"><input type="radio" name="color" value="${custom}" class="pe-custom-radio"${PAGE_COLORS.includes(color) ? '' : ' checked'} aria-label="Autre couleur"><span>${icon('plus')}</span><input type="color" class="pe-picker" value="${custom}" tabindex="-1" aria-hidden="true"></label></fieldset>
        <section class="pe-sec">
          <h3>${icon('search')}Mots-clés suivis <em>Google Actualités</em></h3>
          <p class="pe-help">La page cherche ces mots dans la presse, en continu. Une virgule sépare deux mots-clés : « PSG, Mbappé ». Un mot-clé de plusieurs mots les veut tous : « voiture électrique ».${isNew && !theme ? ' Rempli avec le nom de la page, modifiable.' : ''}</p>
          <div class="pe-row"><label class="field grow"><span class="sr-only">Mots-clés</span><input name="query" maxlength="300" value="${esc(query)}" placeholder="ex. PSG, Mbappé" data-auto="${isNew && !theme ? '1' : '0'}"></label>
            <select name="qlang" class="ctl" aria-label="Langue de la presse"><option value="fr"${qlang === 'fr' ? ' selected' : ''}>Presse française</option><option value="en"${qlang === 'en' ? ' selected' : ''}>Presse anglophone</option></select></div>
          <label class="pe-check"><input type="checkbox" name="strict"${strict ? ' checked' : ''}>
            <span><b>Les sites de la page aussi : seulement les articles qui parlent de ces mots-clés</b><small>Sans mot-clé, rien n’est filtré.</small></span></label>
        </section>
        ${recommended}${current}
        ${isNew ? `<p class="pe-note">${icon('info')}<span>Ensuite, ajoutez n’importe quel site ou flux RSS depuis la page, avec « Ajouter une source ». Tout reste dans ce navigateur.</span></p>` : ''}
      </div>
      <footer class="sheet-f">
        ${isNew ? '' : `<button type="button" class="btn danger" data-act="delete-page">${icon('trash')}Supprimer</button>`}
        <span class="pe-err" role="alert"></span>
        <button type="button" class="btn ghost" data-act="close-editor">Annuler</button>
        <button type="submit" class="btn">${isNew ? `${icon('plus')}Créer la page` : `${icon('check')}Enregistrer`}</button>
      </footer>`;
  }

  /** Aperçu en direct : l'en-tête et la couleur de la fenêtre suivent le nom, l'icône et la couleur choisis. */
  function syncEditor() {
    const form = $('#page-form');
    if (!form) return;
    const data = new FormData(form);
    const color = isColor(data.get('color')) ? data.get('color') : PAGE_COLORS[0];
    editor.style.setProperty('--c', color);
    $('.pe-ico', editor).innerHTML = icon(PAGE_ICONS.includes(data.get('icon')) ? data.get('icon') : 'news');
    $('#pe-title').textContent = String(data.get('label') || '').trim() || 'Nouvelle page';
  }

  function openEditor(pageId = null, themeId = '') {
    const page = pageId ? pagesRaw.find((p) => p.id === pageId) : null;
    if (!page && pagesRaw.length >= MAX_PAGES) {
      toast('Limite atteinte', `${MAX_PAGES} pages perso au maximum : supprimez-en une pour en créer une autre.`);
      return;
    }
    const theme = page ? null : THEMES.find((t) => t.id === themeId) || null;
    editing = page?.id || null;
    editor.innerHTML = `<form id="page-form" class="sheet-in" data-theme="${theme?.id || ''}" autocomplete="off" novalidate>${editorHTML(page, theme)}</form>`;
    clearTimeout(editorTimer);
    editor.classList.remove('closing');
    if (!editor.open) {
      editor.showModal();
      document.documentElement.classList.add('modal-open');
    }
    syncEditor();
    const name = $('#page-form').elements.label;
    if (!themeId) name.focus();
    if (page) name.select();
  }

  function closeEditor(instant = false) {
    return new Promise((resolve) => {
      if (!editor.open) { resolve(); return; }
      clearTimeout(editorTimer);
      const done = () => { editor.close(); resolve(); };
      if (instant || reduceMotion.matches) { done(); return; }
      editor.classList.add('closing');
      editorTimer = setTimeout(done, 220);
    });
  }

  editor.addEventListener('close', () => {
    editor.classList.remove('closing');
    document.documentElement.classList.remove('modal-open');
    editing = null;
  });
  editor.addEventListener('cancel', (e) => { e.preventDefault(); closeEditor(); });
  // Clic sur le voile (pas un glisser commencé dans la fenêtre, comme une sélection de texte).
  editor.addEventListener('pointerdown', (e) => { downOnVeil = e.target === editor; });
  editor.addEventListener('click', (e) => { if (e.target === editor && downOnVeil) closeEditor(); });
  editor.addEventListener('input', (e) => {
    const form = $('#page-form');
    const query = form.elements.query;
    if (e.target.name === 'label' && query.dataset.auto === '1') query.value = e.target.value; // les mots-clés suivent le nom tant qu'on n'y touche pas
    if (e.target === query) query.dataset.auto = '0';
    if (e.target.classList.contains('pe-picker')) {
      const radio = $('.pe-custom-radio', editor);
      radio.value = e.target.value;
      radio.checked = true;
      radio.parentElement.style.setProperty('--sw', e.target.value);
    }
    $('.pe-err', editor).textContent = '';
    syncEditor();
  });
  editor.addEventListener('submit', (e) => {
    e.preventDefault();
    savePage(e.target);
  });

  /** Les mots-clés ou le filtre d'une page ont changé : ses sites sont refiltrés tout de suite, puis relus
   *  au prochain cycle (depuis le cache, sans tout retélécharger) pour retrouver ce qui correspond désormais. */
  function refilterPage(catId) {
    for (const s of SOURCES) {
      const r = state.results[s.id];
      if (s.cat !== catId || s.kind === 'news' || !r) continue;
      const keep = pageFilter(s);
      if (keep) r.items = r.items.filter((it) => keep(itemText(it)));
      r.rebase = true;
    }
  }

  function savePage(form) {
    const data = new FormData(form);
    const label = String(data.get('label') || '').replace(/\s+/g, ' ').trim().slice(0, 30);
    if (!label) {
      $('.pe-err', editor).textContent = 'Donnez un nom à la page.';
      form.elements.label.focus();
      return;
    }
    const ic = PAGE_ICONS.includes(data.get('icon')) ? data.get('icon') : 'news';
    const color = isColor(data.get('color')) ? String(data.get('color')).toLowerCase() : PAGE_COLORS[0];
    const query = splitQuery(data.get('query')).join(', ');
    const qlang = data.get('qlang') === 'en' ? 'en' : 'fr';
    const strict = data.get('strict') === 'on';
    const created = !editing;
    let page = pagesRaw.find((p) => p.id === editing);
    const filterChanged = !!page && page.filter !== strict;
    if (page) {
      Object.assign(page, { label, icon: ic, color, filter: strict });
      Object.assign(CAT[page.id], { label, long: label, icon: ic, color });
    } else {
      const base = slugify(label);
      let id = base;
      for (let k = 2; RESERVED.has(id) || CAT[id]; k++) id = `${base.slice(0, 20)}-${k}`;
      page = { id, label, icon: ic, color, filter: strict, createdAt: Date.now() };
      pagesRaw.push(page);
      registerPage(page);
      const theme = THEMES.find((t) => t.id === form.dataset.theme);
      for (const i of data.getAll('src').map(Number)) {
        const s = theme?.sources[i];
        if (!s) continue;
        addSource({
          id: uid(), cat: id, kind: 'rss', name: s.name, site: s.site, url: s.url, lang: s.lang === 'en' ? 'en' : 'fr',
          type: s.type || 'presse', keywords: s.keywords || '', addedAt: Date.now(),
        });
      }
    }
    // Mots-clés : la source Google Actualités de la page est créée, remplacée ou retirée.
    const news = SOURCES.find((s) => s.cat === page.id && s.kind === 'news');
    const keywordsChanged = (news?.query || '') !== query;
    if (!news || news.query !== query || news.lang !== qlang) {
      if (news) removeSource(news.id);
      if (query) addSource(newsSourceRaw(page.id, query, qlang));
    }
    if (keywordsChanged || filterChanged) refilterPage(page.id); // les sites de la page suivent les nouveaux mots-clés
    savePages();
    saveCustom();
    pruneSeen();
    persist();
    buildMenu();
    const n = SOURCES.filter((s) => s.cat === page.id).length;
    closeEditor().then(() => {
      if (state.tab === page.id) go(false);
      else location.hash = page.id;
    });
    toast(created ? 'Page créée' : 'Page enregistrée', created
      ? `« ${label} » est dans le menu${n ? ` avec ${n} source${n > 1 ? 's' : ''} : chargement des articles…` : ' : ajoutez-lui des sources.'}`
      : `« ${label} » est à jour.`);
    refresh();
  }

  function deletePage(id) {
    const cat = CAT[id];
    if (!cat?.custom) return;
    const srcs = SOURCES.filter((s) => s.cat === id);
    if (!confirm(`Supprimer la page « ${cat.label} »${srcs.length ? ` et ses ${srcs.length} source(s)` : ''} ?\nVos favoris sont conservés.`)) return;
    srcs.forEach((s) => removeSource(s.id));
    pagesRaw = pagesRaw.filter((p) => p.id !== id);
    unregisterPage(id);
    delete state.lastVisit[id];
    if (state.addCat === id) state.addCat = 'info';
    savePages();
    saveCustom();
    pruneSeen();
    persist();
    buildMenu();
    closeEditor(true);
    toast('Page supprimée', `« ${cat.label} » a été retirée du menu.`);
    if (state.tab === id) location.hash = 'radar';
    else go(false);
  }

  // ───────── Transitions ─────────

  /** Repère glissant des sélecteurs (FR / EN, tri, vue…). */
  function syncPills(root = document) {
    for (const group of root.querySelectorAll('.seg, .subnav')) {
      let pill = group.querySelector(':scope > .pill');
      if (!pill) {
        pill = document.createElement('span');
        pill.className = 'pill';
        pill.setAttribute('aria-hidden', 'true');
        group.prepend(pill);
      }
      const on = group.querySelector(':scope > button.on');
      if (!on || !on.offsetWidth) { pill.style.opacity = '0'; continue; }
      pill.style.opacity = '1';
      pill.style.width = `${on.offsetWidth}px`;
      pill.style.transform = `translateX(${on.offsetLeft}px)`;
      if (!pill.classList.contains('ready')) requestAnimationFrame(() => pill.classList.add('ready'));
    }
  }

  /** Relance une animation CSS déjà jouée, sans forcer de recalcul de la mise en page. */
  function replay(el, cls, name) {
    if (!el.classList.contains(cls)) { el.classList.add(cls); return; }
    for (const a of el.getAnimations({ subtree: true })) if (a.animationName === name) { a.cancel(); a.play(); }
  }

  /** Bande néon qui balaie l'écran pendant un changement de page. */
  function warp() {
    if (!reduceMotion.matches) replay($('#warp'), 'run', 'warp');
  }

  /** Change de page : la nouvelle page s'affiche tout de suite et glisse du côté de la page choisie.
   *  Seuls opacity et transform sont animés, et la page reste cliquable pendant l'animation
   *  (l'API View Transitions, utilisée avant, figeait l'écran et perdait les clics). */
  const main = $('main.wrap');
  let pageAnim = null;
  function transition(dir, update) {
    warp();
    update();
    if (reduceMotion.matches || document.hidden) return;
    pageAnim?.cancel();
    pageAnim = main.animate(
      [{ opacity: 0, transform: `translateX(${dir === 'prev' ? -40 : 40}px)` }, { opacity: 1, transform: 'none' }],
      { duration: 360, easing: 'cubic-bezier(.2, .8, .2, 1)' },
    );
  }

  /** Éclair le long de l'en-tête quand une synchronisation se termine. */
  function pulseSync() {
    replay($('.top'), 'synced', 'sync-sweep');
  }

  // Les cartes se matérialisent quand elles entrent à l'écran ; celles déjà vues restent en place
  // quand la liste est redessinée (nouvelles données, recherche…).
  const revealed = new Set();
  let revealer = null;
  let moreWatcher = null;
  function setupReveal(reset) {
    if (reset) revealed.clear();
    revealer?.disconnect();
    moreWatcher?.disconnect();
    const more = $('#more');
    if (more && 'IntersectionObserver' in window) {
      moreWatcher = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        moreWatcher.disconnect();
        limit += PAGE;
        renderBody();
      }, { rootMargin: '0px 0px 700px 0px' });
      moreWatcher.observe(more);
    }
    const cards = document.querySelectorAll('#body .card[data-key]');
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      cards.forEach((c) => c.classList.add('in', 'static'));
      return;
    }
    revealer = new IntersectionObserver((entries) => {
      let k = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const card = e.target;
        card.style.setProperty('--d', `${Math.min(k++, 12) * 55}ms`);
        card.classList.add('in');
        revealed.add(card.dataset.key);
        revealer.unobserve(card);
      }
    }, { rootMargin: '0px 0px -30px 0px' });
    for (const card of cards) {
      if (revealed.has(card.dataset.key)) card.classList.add('in', 'static');
      else revealer.observe(card);
    }
  }

  function updateChrome() {
    let total = 0;
    const count = (n) => (n > 99 ? '99+' : String(n));
    for (const el of document.querySelectorAll('.nav-item[data-tab]')) {
      const id = el.dataset.tab;
      const selected = id === state.tab;
      if (selected) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
      const isFavTab = id === 'favoris';
      const isNews = id === 'nouveautes'; // versions sorties depuis la dernière visite, pas des articles
      const n = isFavTab ? Object.keys(state.favs).length : isNews ? freshVersions() : CAT[id] && !selected ? unseen(id) : 0;
      if (!isFavTab && !isNews) total += n;
      const badge = el.querySelector('.badge');
      badge.hidden = !n;
      badge.classList.toggle('soft', isFavTab);
      badge.textContent = count(n);
    }
    // Le bouton du menu signale les nouveautés des rubriques qu'on ne regarde pas.
    const menuBadge = $('#menu-badge');
    menuBadge.hidden = !total;
    menuBadge.textContent = count(total);
    menuBtn.setAttribute('aria-label', `Ouvrir le menu${total ? `, ${total} nouveaux articles` : ''} (touche M)`);
    document.title = `${total ? `(${total}) ` : ''}NEXUS · Veille tech`;
    const active = activeSources();
    const online = active.filter((s) => state.results[s.id]?.ok).length;
    const sync = state.lastSync
      ? `Synchro <b>${new Date(state.lastSync).toLocaleTimeString('fr-FR')}</b> · ${online}/${active.length} sources`
      : 'Synchro —';
    $('#sync').innerHTML = sync;
    $('#menu-sync').innerHTML = sync;
  }

  function setBusy(busy) {
    $('#refresh').classList.toggle('busy', busy);
    updateRing();
  }

  function updateRing() {
    const ring = $('#ring');
    const count = $('#count');
    const btn = $('#refresh');
    if (state.loading) {
      ring.style.strokeDashoffset = '0';
      count.textContent = `${state.dueTotal - state.pending.size}/${state.dueTotal}`;
      count.classList.remove('off');
      btn.title = 'Synchronisation en cours…';
      return;
    }
    if (!state.auto || !state.nextAt) {
      ring.style.strokeDashoffset = String(RING);
      count.textContent = 'OFF';
      count.classList.add('off');
      btn.title = 'Rafraîchir maintenant (R) — rafraîchissement automatique désactivé';
      return;
    }
    const left = Math.max(0, state.nextAt - Date.now());
    ring.style.strokeDashoffset = String(RING * (left / (state.interval * 1000)));
    const secs = Math.ceil(left / 1000);
    count.textContent = secs >= 60 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : `${secs} s`;
    count.classList.remove('off');
    btn.title = `Rafraîchir maintenant (R) — prochain rafraîchissement dans ${secs} s`;
  }

  function schedule() {
    state.nextAt = state.auto ? Date.now() + state.interval * 1000 : 0;
    updateRing();
  }

  function toast(title, text, onClick) {
    const el = document.createElement('div');
    el.className = `toast${onClick ? ' click' : ''}`;
    el.innerHTML = `<b>${esc(title)}</b><span>${esc(text)}</span>`;
    const close = () => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 320);
    };
    el.addEventListener('click', () => { onClick?.(); close(); });
    $('#toasts').append(el);
    setTimeout(close, 6500);
  }

  function notifyNew(fresh) {
    if (!fresh.length) return;
    const byCat = {};
    for (const it of fresh) {
      const c = SRC[it.src].cat;
      byCat[c] = (byCat[c] || 0) + 1;
    }
    const parts = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const latest = fresh.reduce((a, b) => (b.date > a.date ? b : a));
    const n = fresh.length;
    toast(
      `+${n} nouvel${n > 1 ? 's' : ''} article${n > 1 ? 's' : ''}`,
      `${parts.map(([c, k]) => `${CAT[c].label} ${k}`).join(' · ')} — « ${latest.title} »`,
      () => { location.hash = parts[0][0]; },
    );
  }

  function showMode() {
    const mode = $('#mode');
    mode.className = `mode ${state.relay ? 'live' : 'direct'}`;
    mode.querySelector('span').textContent = state.relay ? (state.hosted ? 'Live · en ligne' : 'Live · relais local') : 'Mode direct';
    mode.title = state.relay
      ? 'Relais actif : toutes les sources sont accessibles.'
      : 'Page ouverte sans relais : seules les sources compatibles CORS répondent. Lancez lancer.bat.';
    let dismissed = false;
    try { dismissed = sessionStorage.getItem('nexus.banner') === '1'; } catch { /* stockage bloqué */ }
    $('#banner').innerHTML = state.relay || dismissed ? '' : `<div class="banner"><div class="banner-in">${icon('alert')}
      <p><b>Mode direct.</b> Les navigateurs bloquent la lecture de la plupart des flux RSS depuis une page locale : seule une partie des sources s’affiche.
      Double-cliquez sur <code>lancer.bat</code> (Python, rien à installer) pour toutes les activer.</p>
      <button data-act="banner-close" aria-label="Masquer ce message">Masquer</button></div></div>`;
  }

  /** Renvoie les infos du relais ({ relay, hosted }) s'il sert cette page, sinon null. */
  async function detectRelay() {
    if (!location.protocol.startsWith('http')) return null;
    try {
      const res = await fetch('/api/ping', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      const data = res.ok ? await res.json() : null;
      return data?.relay === 'nexus' ? data : null;
    } catch {
      return null;
    }
  }

  // ───────── Navigation ─────────
  function parseHash() {
    const [tab, sub] = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
    state.tab = TAB[tab] ? tab : 'radar';
    state.sub = 'news';
    if (sub === 'projets' && CAT[state.tab]?.projects) state.sub = 'projects';
    if (sub === 'jouer' && state.tab === 'jeux') state.sub = 'play';
    if (sub === 'utiliser' && state.tab === 'apps') state.sub = 'use';
    if (sub === 'classement' && CAT[state.tab]?.board) state.sub = 'rank';
  }

  function go(enter = true) {
    renderHead();
    renderBody(enter);
    updateChrome();
  }

  function focusAddForm() {
    const form = $('#add-form');
    if (!form || form.hidden) return;
    form.scrollIntoView({ block: 'center', behavior: 'smooth' });
    form.querySelector(form.dataset.kind === 'hn' ? '[name="query"]' : '[name="url"]').focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', () => {
    closeMenu(true); // touche 1–9 menu ouvert, bouton Précédent…
    closeEditor(true);
    const before = state.tab;
    const beforeSub = state.sub;
    parseHash();
    if (state.tab !== before) state.q = '';
    const order = (id) => TABS.findIndex((t) => t.id === id);
    const subOrder = Object.keys(SUBS);
    const forward = order(state.tab) > order(before) || (state.tab === before && subOrder.indexOf(state.sub) > subOrder.indexOf(beforeSub));
    transition(forward ? 'next' : 'prev', () => {
      go();
      window.scrollTo({ top: 0 });
      if (state.tab === 'sources' && state.addOpen) focusAddForm();
    });
  });

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const { act, v } = el.dataset;
    const markSeg = () => {
      el.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === el));
      syncPills(el.parentElement.parentElement);
    };
    switch (act) {
      case 'menu-close': closeMenu(); return;
      case 'new-page': closeMenu().then(() => openEditor()); return;
      case 'edit-page': openEditor(state.tab); return;
      case 'page-filter': { // bandeau de la page : filtre des sites activé / coupé sans ouvrir l'éditeur
        const page = pagesRaw.find((p) => p.id === state.tab);
        if (!page) return;
        page.filter = v === 'on';
        savePages();
        refilterPage(page.id);
        persist();
        renderBody();
        refresh();
        return;
      }
      case 'pick-preset': openEditor(null, v); return;
      case 'close-editor': closeEditor(); return;
      case 'delete-page': deletePage(editing); return;
      case 'sub':
        markSeg(); // le repère glisse, puis la page change
        setTimeout(() => { location.hash = SUBS[v] ? `${state.tab}/${SUBS[v]}` : state.tab; }, reduceMotion.matches ? 0 : 170);
        return;
      case 'playf': state.playFilter = v; markSeg(); break;
      case 'usef': state.useFilter = v; markSeg(); break;
      case 'bweights': state.boardWeights = v; markSeg(); break;
      case 'bsort': { // en-tête de colonne : même colonne → ordre inversé
        if (state.boardSort === v) state.boardDir = state.boardDir === 'asc' ? 'desc' : 'asc';
        else Object.assign(state, { boardSort: v, boardDir: BOARD_SORTS[v].dir });
        const select = $('#head select[data-act="boardSort"]');
        if (select) select.value = v;
        const dir = $('#head [data-act="bdir"]');
        if (dir) dir.textContent = dirLabel();
        break;
      }
      case 'bdir':
        state.boardDir = state.boardDir === 'asc' ? 'desc' : 'asc';
        el.textContent = dirLabel();
        break;
      case 'board-retry':
        loadBoard(true);
        renderBody();
        return;
      case 'lang': state.lang = v; markSeg(); break;
      case 'view': state.view = v; markSeg(); break;
      case 'sort': state.projSort = v; markSeg(); break;
      case 'favsort': state.favSort = v; markSeg(); break;
      case 'chip':
        if (state.hidden.has(v)) state.hidden.delete(v);
        else state.hidden.add(v);
        break;
      case 'chips-reset':
        SOURCES.forEach((s) => s.cat === state.tab && state.hidden.delete(s.id));
        break;
      case 'reset-filters':
        Object.assign(state, { q: '', lang: 'all', period: 'all', type: 'all' });
        SOURCES.forEach((s) => s.cat === state.tab && state.hidden.delete(s.id));
        renderHead();
        break;
      case 'fav':
        toggleFav(v);
        return;
      case 'export':
        exportData();
        return;
      case 'import':
        $('#import-file').click();
        return;
      case 'add-source':
        closeEditor(true);
        state.addOpen = true;
        state.addCat = v;
        if (state.tab === 'sources') { renderHead(); focusAddForm(); } else location.hash = 'sources';
        return;
      case 'toggle-add': {
        const form = $('#add-form');
        form.hidden = !form.hidden;
        state.addOpen = !form.hidden;
        el.setAttribute('aria-expanded', String(state.addOpen));
        syncPills(form);
        focusAddForm();
        return;
      }
      case 'add-kind': {
        const form = el.closest('form');
        form.dataset.kind = v;
        markSeg();
        focusAddForm();
        return;
      }
      case 'pick-feed': {
        const form = $('#add-form');
        form.dataset.kind = 'rss';
        form.querySelector('[name="url"]').value = v;
        form.requestSubmit();
        return;
      }
      case 'confirm-add':
        confirmAdd();
        return;
      case 'del-source':
        deleteSource(v);
        return;
      case 'disable-source':
        setEnabled([v], false);
        return;
      case 'enable-source':
        setEnabled([v], true);
        return;
      case 'enable-all':
        setEnabled([...state.disabled], true);
        return;
      case 'more':
        limit += PAGE;
        renderBody();
        return;
      case 'retry':
        if (state.results[v]) state.results[v].at = 0;
        refresh();
        return;
      case 'banner-close':
        try { sessionStorage.setItem('nexus.banner', '1'); } catch { /* stockage bloqué */ }
        $('#banner').innerHTML = '';
        return;
      default:
        return;
    }
    persistSoon();
    renderBody(act === 'view' || act === 'sort' || act === 'favsort');
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'add-form') return;
    e.preventDefault();
    testSource(e.target);
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'import-file') {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (file) importData(file);
      return;
    }
    const el = e.target.closest('select[data-act]');
    if (!el) return;
    state[el.dataset.act] = el.value;
    if (el.dataset.act === 'boardSort') { // nouveau critère : son ordre naturel (prix croissant, score décroissant…)
      state.boardDir = BOARD_SORTS[el.value]?.dir || 'desc';
      const dir = $('#head [data-act="bdir"]');
      if (dir) dir.textContent = dirLabel();
    }
    persistSoon();
    renderBody(true);
  });

  document.addEventListener('input', (e) => {
    if (e.target.id !== 'q') return;
    state.q = e.target.value;
    renderBody();
  });

  // Image cassée → image générée ; image minuscule (pixel de suivi) → idem.
  // L'adresse est retenue : les rendus suivants affichent directement l'image générée (pas de nouvel essai, pas de clignotement).
  const swapImage = (img) => {
    badImages.add(img.getAttribute('src'));
    if (img.classList.contains('av')) { img.style.visibility = 'hidden'; return; }
    const card = img.closest('.card');
    if (!card) return;
    const shown = card.querySelector('.src')?.textContent;
    const s = SRC[card.dataset.src];
    img.outerHTML = phHTML(s && s.name === shown ? s : { name: shown || '?' });
  };
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') swapImage(e.target); }, true);
  document.addEventListener('load', (e) => {
    const img = e.target;
    if (img.tagName === 'IMG' && img.closest('.media') && img.naturalWidth < 60) swapImage(img);
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || editor.open) return; // pas de raccourcis pendant l'édition d'une page
    const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName);
    if (typing) {
      if (e.key === 'Escape') document.activeElement.blur();
      return;
    }
    const key = e.key.toLowerCase();
    if (key === 'm') { e.preventDefault(); if (menu.open) closeMenu(); else openMenu(); }
    else if (key === 'r') { e.preventDefault(); refresh(true); }
    else if (key === 'a') { const auto = $('#auto'); auto.checked = !auto.checked; auto.dispatchEvent(new Event('change')); }
    else if (key === '/') { const q = $('#q'); if (q) { e.preventDefault(); closeMenu(true); q.focus(); } }
    else if (/^[1-9]$/.test(key) && TABS[+key - 1]) location.hash = TABS[+key - 1].id;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (state.auto && !state.loading && Date.now() >= state.nextAt) refresh();
    else { renderBody(); updateChrome(); }
  });

  // ───────── Démarrage ─────────
  function setupControls() {
    const auto = $('#auto');
    const interval = $('#interval');
    interval.innerHTML = INTERVALS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    interval.value = String(state.interval);
    auto.checked = state.auto;
    auto.addEventListener('change', () => {
      state.auto = auto.checked;
      schedule();
      persistSoon();
      const every = INTERVALS.find(([v]) => v === state.interval)[1].toLowerCase();
      toast(state.auto ? 'Auto activé' : 'Auto désactivé', state.auto ? `Rafraîchissement automatique : ${every}.` : 'Utilisez le bouton ou la touche R pour rafraîchir.');
    });
    interval.addEventListener('change', () => {
      state.interval = Number(interval.value);
      schedule();
      persistSoon();
    });
    $('#refresh').addEventListener('click', () => refresh(true));
  }

  async function init() {
    parseHash();
    buildMenu();
    setupControls();
    placeControls();
    go(true); // affiche tout de suite le dernier état connu
    $('#version').textContent = VERSION ? `v${VERSION}` : '';
    if (seen.told !== VERSION && freshVersions()) { // nouvelle version depuis la dernière visite : annoncée une seule fois
      Object.assign(seen, { told: VERSION });
      writeJSON(SEEN_KEY, seen);
      const latest = CHANGELOG[0];
      setTimeout(() => toast(`Nouvelle version : NEXUS ${latest.version}`, `${latest.title}. Cliquez pour voir les nouveautés.`, () => { location.hash = 'nouveautes'; }), 1500);
    }
    // Les repères des sélecteurs suivent la mise en page : redimensionnement, polices chargées.
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => syncPills(), 120);
    });
    document.fonts?.ready.then(() => syncPills());
    const relay = await detectRelay();
    state.relay = !!relay;
    state.hosted = !!relay?.hosted;
    showMode();
    if (state.tab === 'sources' && !state.addOpen) renderHead(); // texte du formulaire selon le mode
    setInterval(() => {
      $('#clock').textContent = new Date().toLocaleTimeString('fr-FR');
      updateRing();
      if (state.auto && !state.loading && state.nextAt && Date.now() >= state.nextAt && !document.hidden) refresh();
    }, 500);
    setInterval(() => {
      for (const t of document.querySelectorAll('time[data-ts]')) t.textContent = 'short' in t.dataset ? agoShort(Number(t.dataset.ts)) : ago(Number(t.dataset.ts));
    }, 30e3);
    refresh();
  }

  init();
})();
