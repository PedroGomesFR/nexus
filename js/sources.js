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
 *   include / exclude   filtre des articles : une expression régulière testée sur titre + résumé, ou un
 *           filtre construit avec les fonctions plus bas (anywhere, topic, inTitle, fromSites, all, some),
 *           dont le libellé s'affiche dans la page Sources
 *   minAge  délai minimal entre deux requêtes, en secondes (défaut 30)
 *   limit   nombre d'éléments conservés (défaut 25)
 *   tz      fuseau réel quand le flux annonce son heure locale comme du GMT (ex. 'Europe/Paris')
 */
window.NEXUS = (() => {
  // Informations affichées dans l'onglet « À propos ».
  // repo : adresse du dépôt GitHub une fois créé (ex. 'https://github.com/vous/nexus-veille'), vide sinon.
  // Le numéro de version est celui de la première entrée de js/changelog.js.
  const PROJECT = { license: 'MIT', repo: 'https://github.com/PedroGomesFR/nexus' };

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
    { id: 'ia', label: 'IA', long: 'Intelligence artificielle', icon: 'ai', color: '#d946ef', board: true,
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

  // ───────── Filtres ─────────
  // Un filtre a un libellé (affiché dans la page Sources) et un test(texte, article) :
  // texte = titre + résumé (+ sujets d'un dépôt GitHub). Une expression régulière seule convient aussi.
  const anywhere = (re, label) => ({ label, test: (text) => re.test(text) });
  const inTitle = (re, label) => ({ label, test: (text, it) => re.test(it.title) });
  // Terme fort n'importe où, terme faible dans le titre seulement : « décompilation » dans un résumé suffit,
  // mais « émulateur » cité en passant dans le test d'une console portable ne fait pas un article du sujet.
  const topic = (strong, weak, label) => ({ label, test: (text, it) => strong.test(text) || weak.test(it.title) });
  // Article trouvé par Google Actualités : seulement ceux des rédactions de la liste.
  const fromSites = (domains, label) => ({
    label, test: (text, it) => !!it.viaSite && domains.some((d) => it.viaSite === d || it.viaSite.endsWith(`.${d}`)),
  });
  const all = (...filters) => ({ label: filters.map((f) => f.label).join(', '), test: (text, it) => filters.every((f) => f.test(text, it)) });
  const some = (...filters) => ({ label: filters.map((f) => f.label).join(', '), test: (text, it) => filters.some((f) => f.test(text, it)) }); // pour exclude

  // Mots qui signalent un jeu vidéo (sert à séparer « Reverse Apps » et « Reverse Jeux »).
  // Pas de mot courant à double sens (« descent », « fallout » seul, « GB ») : la liste exclut aussi les jeux de Reverse Apps.
  const GAME = /\b(?:video ?games?|games?|gaming|gamers?|gameplay|jeux? vid[ée]o|jeux|nintendo|playstation|ps[1-5]|psx|psp|ps ?vita|gamecube|wii ?u?|n64|snes|famicom|nes|sega|mega ?drive|dreamcast|xbox|game ?boy|gba|nds|3ds|switch 2|steam deck|arcade|atari|neo ?geo|turbografx|pc engine|decomp\.(?:dev|me)|mario|zelda|majora|ocarina|twilight princess|pok[eé]mon|sonic|metroid|castlevania|kirby|star ?fox|donkey kong|yoshi|wario|smash bros\w*|animal crossing|fire emblem|banjo|goldeneye|perfect dark|doom\d?|quake\d?|wolfenstein|duke nukem|half-life|counter-strike|team fortress|deus ex|system shock|unreal tournament|heretic|hexen|commander keen|prince of persia|lemmings|monkey island|lucasarts|sierra on-?line|scumm|gta|grand theft auto|minecraft|tetris|resident evil|re4|silent hill|metal gear|final fantasy|dragon quest|chrono trigger|kingdom hearts|earthbound|touhou|street fighter|mortal kombat|tekken|mega ?man|metal slug|pac-?man|bomberman|spider-?man|spyro|crash bandicoot|tony hawk|need for speed|gran turismo|ridge racer|jak and daxter|ratchet (?:&|and) clank|sly cooper|tomb raider|diablo|starcraft|warcraft|command (?:&|and) conquer|age of empires|fallout (?:[1-4]|new vegas|76|tactics)|skyrim|elder scrolls|baldur'?s gate|x-?com|carmageddon|sim ?city|the sims|rollercoaster tycoon|transport tycoon|openttd|call of duty|modern warfare|mw2|lego (?:island|star wars|racers)|shooter|platformer|rpg|jrpg|roguelike|mmorpg|speedrun\w*|rom ?hack\w*|game cartridges?|game consoles?|retro consoles?|consoles? de jeu)\b/i;
  const IS_GAME = anywhere(GAME, 'jeux vidéo seulement');
  const NOT_GAME = anywhere(GAME, 'sujets « jeux » exclus');

  // Presse jeu vidéo : seulement la rétro-ingénierie (décompilation, portages de fans, émulation…).
  const GAME_STRONG = /decomps?\b|d[ée]compil\w*|recomps?\b|r[ée]compil\w*|reverse[- ]?engineer\w*|r[ée]tro-?ing[ée]ni\w*|disassembl\w*|d[ée]sassembl\w*|rom ?hack\w*|fan[- ]?(?:made|project|game|port|remake|translat\w*|patch)|traduction (?:amateur|de fans|par des fans)|source ports?\b|unofficial (?:pc |native )?ports?|native (?:pc )?ports?|portages? (?:non[- ]officiel|pc|natif)|ported to (?:the )?(?:pc|windows|linux|mac|browser|web|android|raspberry)|sans [ée]mulat\w*|without (?:an |the )?emulat\w*|homebrew|scummvm|re-?implement\w*|r[ée]impl[ée]ment\w*|data-?min\w*|byte-?(?:identical|matching)|leaked source|source code (?:leak|release)|open[- ]sourced/i;
  const GAME_WEAK = /[ée]mulat\w*|(?:pc|game|native|fan)[- ]ports?\b|prototype|pr[ée]servation|\bhack(?:s|ed|ing)?\b|exploit\w*|jailbr[eo]\w*|custom firmware|\bcfw\b|cheat codes?|source code|codes? sources?|en natif|nativement/i;
  const GAME_RE = topic(GAME_STRONG, GAME_WEAK, 'seulement la rétro-ingénierie, les portages et l’émulation');
  // Un studio piraté, une fuite de données : de la cybersécurité, pas de la rétro-ingénierie.
  const NO_BREACH = anywhere(/\b(?:ransomware|data breach|breach(?:ed)?|ddos|phishing|stolen accounts?)\b/i, 'piratages et fuites de données exclus');

  // Blogs d'éditeurs et d'équipes de recherche : sans leurs annonces (stages, tarifs, salons…).
  const NO_ADS = inTitle(/\b(?:internships?|hiring|job offers?|careers?|webinars?|pricing|licen[cs]es?|is heading to|summer camp|join us|meet us|offres? de stage|recrutement)\b/i, 'annonces commerciales exclues');
  // Forums Reddit : sans les fils réguliers (questions, offres d'emploi) ni les demandes d'aide.
  const NO_THREADS = inTitle(/questions? thread|hiring thread|\bweekly\b|\bhelp\b|\?\s*$/i, 'questions d’entraide exclues');

  // Outils de décompilation génériques : exclus du catalogue « jeux ».
  const RE_TOOLS = /(?:decompiler|disassembler|binary ?ninja|ghidra|\bida\b|jadx|\bapk\b|\bjar\b|spring boot|\bllm\b|ai[- ]agent|agentic|agent-first|\bmcp\b)/i;

  // Rédactions retenues dans les recherches Google Actualités. Sans les médias déjà lus directement
  // (Korben, Ars Technica, Time Extension) : un même article n'apparaît pas deux fois.
  const PRESS_FR = ['gamekult.com', 'jeuxvideo.com', 'millenium.org', 'numerama.com', 'frandroid.com', 'phonandroid.com', 'clubic.com', 'journaldugeek.com', '01net.com', 'next.ink', 'tomsguide.fr', 'presse-citron.net', 'programmez.com', 'lemonde.fr', 'lesoir.be', 'ouest-france.fr'];
  const PRESS_EN = ['theverge.com', '404media.co', 'pcgamer.com', 'videogameschronicle.com', 'eurogamer.net', 'ign.com', 'kotaku.com', 'polygon.com', 'gamesradar.com', 'rockpapershotgun.com', 'gamedeveloper.com', 'tomshardware.com', 'xda-developers.com', 'androidauthority.com', 'howtogeek.com', 'pcmag.com', 'techspot.com', 'theregister.com', 'wired.com', 'engadget.com'];

  const hn = (query, minPoints) =>
    `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story` +
    `&numericFilters=${encodeURIComponent(`points>${minPoints}`)}&hitsPerPage=40`;
  const gh = (query, sort) =>
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_page=40`;
  const gnews = (query, lang) => (lang === 'en'
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
    : `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`);
  const GNEWS_FR = 'décompilation OR décompilé OR recompilation OR recompilé OR "rétro-ingénierie" OR "portage non officiel" OR "sans émulateur" jeu';
  const GNEWS_EN = 'decompilation OR decompiled OR recompiled OR recomp OR "reverse engineered" OR "unofficial port" OR "fan-made port" OR "source port" game';

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
    { id: 'p0', cat: 'apps', name: 'Google Project Zero', site: 'https://projectzero.google/', url: 'https://projectzero.google/feed.xml', type: 'recherche', lang: 'en' },
    { id: 'checkpoint', cat: 'apps', name: 'Check Point Research', site: 'https://research.checkpoint.com/', url: 'https://research.checkpoint.com/feed/', type: 'recherche', lang: 'en',
      exclude: inTitle(/threat intelligence report|landscape digest/i, 'bilans périodiques exclus') },
    { id: 'quarkslab', cat: 'apps', name: 'Quarkslab', site: 'https://blog.quarkslab.com/', url: 'https://blog.quarkslab.com/feeds/all.atom.xml', type: 'recherche', lang: 'en', exclude: NO_ADS },
    { id: 'objective-see', cat: 'apps', name: 'Objective-See', site: 'https://objective-see.org/blog.html', url: 'https://objective-see.org/rss.xml', type: 'recherche', lang: 'en' },
    { id: 'hexrays', cat: 'apps', name: 'Hex-Rays (IDA)', mono: 'IDA', site: 'https://hex-rays.com/blog', url: 'https://hex-rays.com/blog/rss.xml', type: 'officiel', lang: 'en', exclude: NO_ADS },
    { id: 'binaryninja', cat: 'apps', name: 'Binary Ninja', site: 'https://binary.ninja/blog/', url: 'https://binary.ninja/feed.xml', type: 'officiel', lang: 'en', exclude: NO_ADS },
    { id: 'asahi', cat: 'apps', name: 'Asahi Linux', site: 'https://asahilinux.org/blog/', url: 'https://asahilinux.org/blog/index.xml', type: 'officiel', lang: 'en' },
    { id: 'shirriff', cat: 'apps', name: 'Ken Shirriff', site: 'https://www.righto.com/', url: 'https://www.righto.com/feeds/posts/default', type: 'expert', lang: 'en' },
    { id: 'hackaday-re', cat: 'apps', name: 'Hackaday', site: 'https://hackaday.com/tag/reverse-engineering/', url: 'https://hackaday.com/tag/reverse-engineering/feed/', type: 'presse', lang: 'en', exclude: NOT_GAME },
    { id: 'hn-re', cat: 'apps', name: 'Hacker News', mono: 'HN', site: 'https://news.ycombinator.com/', kind: 'hn', type: 'communaute', lang: 'en', exclude: NOT_GAME, minAge: 120,
      url: [hn('"reverse engineered"', 20), hn('"reverse engineering"', 20), hn('"reverse-engineered"', 20), hn('"unofficial API"', 10), hn('"undocumented API"', 10), hn('"custom firmware"', 10)] },
    { id: 'lobsters-re', cat: 'apps', name: 'Lobsters', site: 'https://lobste.rs/t/reversing', url: 'https://lobste.rs/t/reversing.rss', type: 'communaute', lang: 'en', exclude: NOT_GAME },
    { id: 'reddit-re', cat: 'apps', name: 'r/ReverseEngineering', mono: 'R/RE', site: 'https://www.reddit.com/r/ReverseEngineering/', url: 'https://www.reddit.com/r/ReverseEngineering/.rss', type: 'communaute', lang: 'en', exclude: some(NOT_GAME, NO_THREADS), minAge: 600 },
    { id: 'gh-apps', cat: 'apps', name: 'GitHub', mono: 'GH', site: 'https://github.com/topics/reverse-engineering', kind: 'github', type: 'projet', lang: 'en', exclude: GAME, minAge: 900, limit: 120,
      url: [gh('"reverse engineered" in:description stars:>200', 'updated'), gh('"unofficial api" in:description stars:>300', 'updated'), gh('topic:reverse-engineering topic:api stars:>100', 'updated')] },

    // ───────── Reverse Jeux ─────────
    { id: 'dolphin', cat: 'jeux', name: 'Dolphin', site: 'https://dolphin-emu.org/blog/', url: 'https://dolphin-emu.org/blog/feeds/', type: 'officiel', lang: 'en' },
    { id: 'rpcs3', cat: 'jeux', name: 'RPCS3', site: 'https://blog.rpcs3.net/', url: 'https://blog.rpcs3.net/feed/', type: 'officiel', lang: 'en' },
    { id: 'retroreversing', cat: 'jeux', name: 'RetroReversing', site: 'https://www.retroreversing.com/', url: 'https://www.retroreversing.com/atom.xml', type: 'expert', lang: 'en' },
    { id: 'nicole-express', cat: 'jeux', name: 'Nicole Express', site: 'https://nicole.express/', url: 'https://nicole.express/feed.xml', type: 'expert', lang: 'en' },
    { id: 'timeext', cat: 'jeux', name: 'Time Extension', site: 'https://www.timeextension.com/', url: 'https://www.timeextension.com/feeds/latest', type: 'presse', lang: 'en', include: GAME_RE, exclude: NO_BREACH },
    { id: 'ars-gaming', cat: 'jeux', name: 'Ars Technica', site: 'https://arstechnica.com/gaming/', url: 'https://feeds.arstechnica.com/arstechnica/gaming', type: 'presse', lang: 'en', include: GAME_RE, exclude: NO_BREACH },
    { id: 'gamingonlinux', cat: 'jeux', name: 'GamingOnLinux', site: 'https://www.gamingonlinux.com/', url: 'https://www.gamingonlinux.com/article_rss.php', type: 'presse', lang: 'en', include: GAME_RE, exclude: NO_BREACH },
    { id: 'korben-jeux', cat: 'jeux', name: 'Korben', site: 'https://korben.info/', url: 'https://korben.info/feed', type: 'expert', lang: 'fr', include: all(IS_GAME, GAME_RE) },
    { id: 'gnews-jeux-fr', cat: 'jeux', kind: 'news', name: 'Google Actualités · presse FR', site: `https://news.google.com/search?q=${encodeURIComponent(GNEWS_FR)}&hl=fr`,
      url: gnews(GNEWS_FR, 'fr'), type: 'presse', lang: 'fr', minAge: 600, include: all(GAME_RE, fromSites(PRESS_FR, 'rédactions reconnues seulement')) },
    { id: 'gnews-jeux-en', cat: 'jeux', kind: 'news', name: 'Google Actualités · presse EN', site: `https://news.google.com/search?q=${encodeURIComponent(GNEWS_EN)}&hl=en-US`,
      url: gnews(GNEWS_EN, 'en'), type: 'presse', lang: 'en', minAge: 600, include: all(GAME_RE, fromSites(PRESS_EN, 'rédactions reconnues seulement')) },
    { id: 'hn-games', cat: 'jeux', name: 'Hacker News', mono: 'HN', site: 'https://news.ycombinator.com/', kind: 'hn', type: 'communaute', lang: 'en', include: IS_GAME, minAge: 120,
      url: [hn('decompilation', 10), hn('decompiled', 10), hn('recompilation', 10), hn('recompiled', 10), hn('"reverse engineered"', 20), hn('"reverse engineering"', 20), hn('"source port"', 10), hn('emulator', 40), hn('homebrew', 20)] },
    { id: 'hackaday-games', cat: 'jeux', name: 'Hackaday', site: 'https://hackaday.com/tag/reverse-engineering/', type: 'presse', lang: 'en', include: IS_GAME,
      url: ['https://hackaday.com/tag/reverse-engineering/feed/', 'https://hackaday.com/tag/emulator/feed/', 'https://hackaday.com/tag/emulation/feed/'] },
    { id: 'lobsters-games', cat: 'jeux', name: 'Lobsters · reversing', site: 'https://lobste.rs/t/reversing', url: 'https://lobste.rs/t/reversing.rss', type: 'communaute', lang: 'en', include: IS_GAME },
    { id: 'lobsters-games-tag', cat: 'jeux', name: 'Lobsters · games', site: 'https://lobste.rs/t/games', url: 'https://lobste.rs/t/games.rss', type: 'communaute', lang: 'en', include: GAME_RE },
    { id: 'reddit-emulation', cat: 'jeux', name: 'r/emulation', mono: 'R/EMU', site: 'https://www.reddit.com/r/emulation/', url: 'https://www.reddit.com/r/emulation/.rss', type: 'communaute', lang: 'en', minAge: 600, exclude: NO_THREADS },
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
    // Recherche en sécurité au sens large (cryptographie, chaîne d'approvisionnement, IA) : peu de rétro-ingénierie.
    { id: 'trailofbits', cat: 'cyber', name: 'Trail of Bits', site: 'https://blog.trailofbits.com/', url: 'https://blog.trailofbits.com/feed/', type: 'recherche', lang: 'en' },
  ];

  // Classement des modèles d'IA (rubrique IA → Classement).
  //   models  catalogue public d'OpenRouter : prix, contexte, date, poids ouverts, et les indices
  //           d'Artificial Analysis (intelligence, code, agents) qu'il redistribue
  //   sizes   API Hugging Face : nombre de paramètres des modèles à poids ouverts
  const BOARD = {
    models: 'https://openrouter.ai/api/v1/models',
    sizes: 'https://huggingface.co/api/models/',
    minAge: 1800, // 30 min entre deux mises à jour du classement
  };

  return { PROJECT, TYPES, CATEGORIES, SOURCES, BOARD };
})();
