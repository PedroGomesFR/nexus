/* NEXUS — catalogue des rubriques et des sources.
 *
 * Pour ajouter une source, copiez une ligne et adaptez-la :
 *   id      identifiant unique
 *   cat     rubrique : 'ia' | 'apps' | 'jeux' | 'info' | 'cyber'
 *   name    nom affiché          site   page d'accueil de la source
 *   url     flux RSS/Atom ou API (une chaîne, ou un tableau pour fusionner plusieurs requêtes)
 *   kind    'rss' (défaut) | 'hn' (API Hacker News) | 'github' (recherche GitHub)
 *   type    fiabilité, voir TYPES ci-dessous
 *   lang    'fr' | 'en'
 *   include / exclude   expression régulière testée sur titre + résumé (filtrage par mots-clés)
 *   minAge  délai minimal entre deux requêtes, en secondes (défaut 30)
 *   limit   nombre d'éléments conservés (défaut 25)
 *   tz      fuseau réel quand le flux annonce son heure locale comme du GMT (ex. 'Europe/Paris')
 */
window.NEXUS = (() => {
  const TYPES = {
    officiel: { label: 'Officiel', hint: "Publié directement par l'organisation concernée : laboratoire, éditeur, agence d'État." },
    presse: { label: 'Presse', hint: 'Rédaction professionnelle, avec ligne éditoriale et corrections publiques.' },
    recherche: { label: 'Recherche', hint: 'Équipe de recherche en sécurité reconnue, qui publie ses analyses techniques détaillées.' },
    expert: { label: 'Expert', hint: 'Auteur indépendant reconnu dans son domaine, qui signe ses articles.' },
    communaute: { label: 'Communauté', hint: 'Agrégateur communautaire modéré (votes, modération). Pertinent et rapide, mais à recouper.' },
    projet: { label: 'Projet', hint: 'Dépôt de code public : la source primaire, le travail est vérifiable directement.' },
    perso: { label: 'Perso', hint: 'Source que vous avez ajoutée vous-même : sa fiabilité n’a pas été vérifiée.' },
  };

  const CATEGORIES = [
    { id: 'ia', label: 'IA', long: 'Intelligence artificielle', icon: 'ai', color: '#d946ef',
      about: 'Annonces des laboratoires (OpenAI, DeepMind, Hugging Face…) et analyses de la presse spécialisée.' },
    { id: 'apps', label: 'Reverse Apps', long: 'Apps rétro-ingéniérées', icon: 'apps', color: '#00e5ff', projects: true,
      about: 'Applications, API et protocoles décortiqués : analyses de chercheurs, articles et projets open source.' },
    { id: 'jeux', label: 'Reverse Jeux', long: 'Jeux rétro-ingéniérés', icon: 'games', color: '#a3ff12', projects: true,
      about: 'Décompilations, recompilations et portages non officiels de jeux vidéo, et les équipes qui les mènent.' },
    { id: 'info', label: 'Informatique', long: 'Actualité informatique', icon: 'chip', color: '#4d8dff',
      about: 'Matériel, logiciels, Linux, web : l’actualité informatique en français et en anglais.' },
    { id: 'cyber', label: 'Cybersécurité', long: 'Cybersécurité', icon: 'shield', color: '#ff4d6d',
      about: 'Alertes officielles (CERT-FR, NCSC), failles, fuites de données et campagnes malveillantes.' },
  ];

  // Mots qui signalent un jeu vidéo (sert à séparer « Reverse Apps » et « Reverse Jeux »).
  const GAME = /\b(?:video ?games?|games?|gaming|gamers?|jeux? vid[ée]o|nintendo|playstation|ps[1-5]|psx|psp|gamecube|wii|n64|snes|famicom|nes|sega|mega ?drive|dreamcast|xbox|game ?boy|gba|nds|3ds|arcade|mario|zelda|pok[eé]mon|sonic|metroid|castlevania|doom|quake|half-life|counter-strike|gta|grand theft auto|minecraft|tetris|resident evil|silent hill|final fantasy|touhou|shooter|rpg|speedrun\w*|rom ?hack\w*)\b/i;

  // Dans la presse jeu vidéo généraliste, ne garder que ce qui touche à la rétro-ingénierie.
  const GAME_RE = /(?:decomp\w*|recomp\w*|reverse[- ]?engineer\w*|r[ée]tro-?ing[ée]ni\w*|rom ?hack\w*|source code|code source|pc port|native port|unofficial port|fan[- ]made|fan port|ported to (?:pc|windows|linux)|scummvm|emulat\w*|émulat\w*|homebrew|re-?implement\w*|open[- ]source|disassembl\w*|data-?min\w*|prototype|jailbreak|\bhack(?:ing|ed|ers?)\b|exploit\w*|modding|cheat codes?|preservation)/i;

  // Outils de décompilation génériques : exclus du catalogue « jeux ».
  const RE_TOOLS = /(?:decompiler|disassembler|binary ?ninja|ghidra|\bida\b|jadx|\bapk\b|\bjar\b|spring boot|\bllm\b|ai[- ]agent|agentic|agent-first|\bmcp\b)/i;

  const hn = (query, minPoints) =>
    `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story` +
    `&numericFilters=${encodeURIComponent(`points>${minPoints}`)}&hitsPerPage=40`;
  const gh = (query, sort) =>
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_page=40`;

  const SOURCES = [
    // ───────── IA ─────────
    { id: 'openai', cat: 'ia', name: 'OpenAI', site: 'https://openai.com/news/', url: 'https://openai.com/news/rss.xml', type: 'officiel', lang: 'en' },
    { id: 'deepmind', cat: 'ia', name: 'Google DeepMind', site: 'https://deepmind.google/discover/blog/', url: 'https://deepmind.google/blog/rss.xml', type: 'officiel', lang: 'en' },
    { id: 'google-ai', cat: 'ia', name: 'Google AI', site: 'https://blog.google/technology/ai/', url: 'https://blog.google/technology/ai/rss/', type: 'officiel', lang: 'en' },
    { id: 'huggingface', cat: 'ia', name: 'Hugging Face', site: 'https://huggingface.co/blog', url: 'https://huggingface.co/blog/feed.xml', type: 'officiel', lang: 'en' },
    { id: 'mittr-ai', cat: 'ia', name: 'MIT Technology Review', site: 'https://www.technologyreview.com/topic/artificial-intelligence/', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', type: 'presse', lang: 'en' },
    { id: 'ars-ai', cat: 'ia', name: 'Ars Technica', site: 'https://arstechnica.com/ai/', url: 'https://arstechnica.com/ai/feed/', type: 'presse', lang: 'en' },
    { id: 'verge-ai', cat: 'ia', name: 'The Verge', site: 'https://www.theverge.com/ai-artificial-intelligence', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', type: 'presse', lang: 'en' },
    { id: 'techcrunch-ai', cat: 'ia', name: 'TechCrunch', site: 'https://techcrunch.com/category/artificial-intelligence/', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', type: 'presse', lang: 'en' },
    { id: 'numerama-ia', cat: 'ia', name: 'Numerama', site: 'https://www.numerama.com/tech/intelligence-artificielle/', url: 'https://www.numerama.com/tech/intelligence-artificielle/feed/', type: 'presse', lang: 'fr' },
    { id: 'actuia', cat: 'ia', name: 'ActuIA', site: 'https://www.actuia.com/', url: 'https://www.actuia.com/feed/', type: 'presse', lang: 'fr' },
    { id: 'willison', cat: 'ia', name: 'Simon Willison', site: 'https://simonwillison.net/', url: 'https://simonwillison.net/atom/everything/', type: 'expert', lang: 'en' },

    // ───────── Reverse Apps ─────────
    { id: 'p0', cat: 'apps', name: 'Google Project Zero', site: 'https://googleprojectzero.blogspot.com/', url: 'https://googleprojectzero.blogspot.com/feeds/posts/default', type: 'recherche', lang: 'en' },
    { id: 'checkpoint', cat: 'apps', name: 'Check Point Research', site: 'https://research.checkpoint.com/', url: 'https://research.checkpoint.com/feed/', type: 'recherche', lang: 'en' },
    { id: 'trailofbits', cat: 'apps', name: 'Trail of Bits', site: 'https://blog.trailofbits.com/', url: 'https://blog.trailofbits.com/feed/', type: 'recherche', lang: 'en' },
    { id: 'objective-see', cat: 'apps', name: 'Objective-See', site: 'https://objective-see.org/blog.html', url: 'https://objective-see.org/rss.xml', type: 'recherche', lang: 'en' },
    { id: 'hackaday-re', cat: 'apps', name: 'Hackaday', site: 'https://hackaday.com/tag/reverse-engineering/', url: 'https://hackaday.com/tag/reverse-engineering/feed/', type: 'presse', lang: 'en', exclude: GAME },
    { id: 'hn-re', cat: 'apps', name: 'Hacker News', mono: 'HN', site: 'https://news.ycombinator.com/', kind: 'hn', type: 'communaute', lang: 'en', exclude: GAME,
      url: [hn('"reverse engineered"', 20), hn('"reverse engineering"', 20), hn('"reverse-engineered"', 20)] },
    { id: 'lobsters-re', cat: 'apps', name: 'Lobsters', site: 'https://lobste.rs/t/reversing', url: 'https://lobste.rs/t/reversing.rss', type: 'communaute', lang: 'en', exclude: GAME },
    { id: 'reddit-re', cat: 'apps', name: 'r/ReverseEngineering', mono: 'R/RE', site: 'https://www.reddit.com/r/ReverseEngineering/', url: 'https://www.reddit.com/r/ReverseEngineering/.rss', type: 'communaute', lang: 'en', exclude: GAME, minAge: 600 },
    { id: 'gh-apps', cat: 'apps', name: 'GitHub', mono: 'GH', site: 'https://github.com/topics/reverse-engineering', kind: 'github', type: 'projet', lang: 'en', exclude: GAME, minAge: 900, limit: 120,
      url: [gh('"reverse engineered" in:description stars:>200', 'updated'), gh('"unofficial api" in:description stars:>300', 'updated'), gh('topic:reverse-engineering topic:api stars:>100', 'updated')] },

    // ───────── Reverse Jeux ─────────
    { id: 'timeext', cat: 'jeux', name: 'Time Extension', site: 'https://www.timeextension.com/', url: 'https://www.timeextension.com/feeds/latest', type: 'presse', lang: 'en', include: GAME_RE },
    { id: 'ars-gaming', cat: 'jeux', name: 'Ars Technica', site: 'https://arstechnica.com/gaming/', url: 'https://feeds.arstechnica.com/arstechnica/gaming', type: 'presse', lang: 'en', include: GAME_RE },
    { id: 'hn-games', cat: 'jeux', name: 'Hacker News', mono: 'HN', site: 'https://news.ycombinator.com/', kind: 'hn', type: 'communaute', lang: 'en', include: GAME,
      url: [hn('decompilation', 10), hn('decompiled', 10), hn('recompilation', 10), hn('"reverse engineered"', 20), hn('"reverse engineering"', 20)] },
    { id: 'hackaday-games', cat: 'jeux', name: 'Hackaday', site: 'https://hackaday.com/tag/reverse-engineering/', url: 'https://hackaday.com/tag/reverse-engineering/feed/', type: 'presse', lang: 'en', include: GAME },
    { id: 'lobsters-games', cat: 'jeux', name: 'Lobsters', site: 'https://lobste.rs/t/reversing', url: 'https://lobste.rs/t/reversing.rss', type: 'communaute', lang: 'en', include: GAME },
    { id: 'gh-games', cat: 'jeux', name: 'GitHub', mono: 'GH', site: 'https://github.com/topics/decompilation', kind: 'github', type: 'projet', lang: 'en', exclude: RE_TOOLS, minAge: 900, limit: 150,
      url: [gh('topic:decompilation stars:>300', 'stars'), gh('topic:decompilation stars:>50', 'updated'), gh('topic:recompilation stars:>50', 'updated'), gh('topic:game topic:reverse-engineering stars:>50', 'updated')] },

    // ───────── Informatique ─────────
    { id: 'hn-front', cat: 'info', name: 'Hacker News', mono: 'HN', site: 'https://news.ycombinator.com/', kind: 'hn', type: 'communaute', lang: 'en', url: 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=40', limit: 40 },
    { id: 'ars', cat: 'info', name: 'Ars Technica', site: 'https://arstechnica.com/', url: 'https://feeds.arstechnica.com/arstechnica/index', type: 'presse', lang: 'en' },
    { id: 'verge', cat: 'info', name: 'The Verge', site: 'https://www.theverge.com/tech', url: 'https://www.theverge.com/rss/tech/index.xml', type: 'presse', lang: 'en' },
    { id: 'lwn', cat: 'info', name: 'LWN.net', site: 'https://lwn.net/', url: 'https://lwn.net/headlines/rss', type: 'presse', lang: 'en' },
    { id: 'tomshw', cat: 'info', name: "Tom's Hardware", site: 'https://www.tomshardware.com/', url: 'https://www.tomshardware.com/feeds/all', type: 'presse', lang: 'en' },
    { id: 'next', cat: 'info', name: 'Next', site: 'https://next.ink/', url: 'https://next.ink/feed/', type: 'presse', lang: 'fr' },
    { id: 'numerama', cat: 'info', name: 'Numerama', site: 'https://www.numerama.com/', url: 'https://www.numerama.com/feed/', type: 'presse', lang: 'fr' },
    { id: '01net', cat: 'info', name: '01net', mono: '01', site: 'https://www.01net.com/', url: 'https://www.01net.com/feed/', type: 'presse', lang: 'fr' },
    { id: 'zdnet-fr', cat: 'info', name: 'ZDNet France', site: 'https://www.zdnet.fr/', url: 'https://www.zdnet.fr/feeds/rss/actualites/', type: 'presse', lang: 'fr', tz: 'Europe/Paris' },
    { id: 'korben', cat: 'info', name: 'Korben', site: 'https://korben.info/', url: 'https://korben.info/feed', type: 'expert', lang: 'fr' },

    // ───────── Cybersécurité ─────────
    { id: 'certfr', cat: 'cyber', name: 'CERT-FR (ANSSI)', mono: 'CERT', site: 'https://www.cert.ssi.gouv.fr/', url: 'https://www.cert.ssi.gouv.fr/feed/', type: 'officiel', lang: 'fr' },
    { id: 'ncsc', cat: 'cyber', name: 'NCSC (Royaume-Uni)', mono: 'NCSC', site: 'https://www.ncsc.gov.uk/', url: 'https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml', type: 'officiel', lang: 'en' },
    { id: 'bleeping', cat: 'cyber', name: 'BleepingComputer', site: 'https://www.bleepingcomputer.com/', url: 'https://www.bleepingcomputer.com/feed/', type: 'presse', lang: 'en' },
    { id: 'thehackernews', cat: 'cyber', name: 'The Hacker News', mono: 'THN', site: 'https://thehackernews.com/', url: 'https://feeds.feedburner.com/TheHackersNews', type: 'presse', lang: 'en' },
    { id: 'zataz', cat: 'cyber', name: 'ZATAZ', site: 'https://www.zataz.com/', url: 'https://www.zataz.com/feed/', type: 'presse', lang: 'fr' },
    { id: 'krebs', cat: 'cyber', name: 'Krebs on Security', site: 'https://krebsonsecurity.com/', url: 'https://krebsonsecurity.com/feed/', type: 'expert', lang: 'en' },
  ];

  return { TYPES, CATEGORIES, SOURCES };
})();
