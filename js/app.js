/* NEXUS — veille tech en temps réel.
 * JavaScript pur : aucun framework, aucune dépendance, aucune compilation.
 * Les flux passent par le relais (serveur.py, en local ou en ligne) quand il tourne ; sinon le
 * navigateur les lit directement, ce qui ne fonctionne que pour les sources
 * qui autorisent la lecture depuis une autre page (CORS).
 */
(() => {
  'use strict';

  const { TYPES, CATEGORIES, SOURCES } = window.NEXUS;
  const SRC = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
  const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const TABS = [
    { id: 'radar', label: 'Radar', long: 'Radar', icon: 'radar', color: '#00e5ff', about: 'Les derniers titres de chaque rubrique, en un coup d’œil.' },
    ...CATEGORIES,
    { id: 'sources', label: 'Sources', long: 'Sources & fiabilité', icon: 'list', color: '#ffb020', about: 'D’où vient chaque information, son niveau de fiabilité et son état en direct.' },
  ];
  const TAB = Object.fromEntries(TABS.map((t) => [t.id, t]));
  const PROJECTS_ABOUT = 'Dépôts GitHub publics : le code est vérifiable. Classés par étoiles ou par activité récente.';
  const INTERVALS = [[30, 'Toutes les 30 s'], [60, 'Chaque minute'], [120, 'Toutes les 2 min'], [300, 'Toutes les 5 min'], [900, 'Toutes les 15 min']];
  const PERIODS = { all: 'Toutes dates', day: '24 h', week: '7 jours', month: '30 jours' };
  const PERIOD_MS = { all: Infinity, day: 864e5, week: 6048e5, month: 2592e6 };
  const NEW_WINDOW = 30 * 60e3; // un article reste marqué « nouveau » 30 minutes
  const STORE_KEY = 'nexus.v1';
  const RING = 2 * Math.PI * 23;
  const CONCURRENCY = 6;
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
  };
  const icon = (name) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  // ───────── Utilitaires ─────────
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const clip = (s, n) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);
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
  /** Texte brut d'un fragment HTML (les balises et scripts ne sont jamais exécutés). */
  const toText = (html) => (html ? (htmlParser.parseFromString(html, 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim() : '');
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

  // ───────── Stockage local (préférences + dernier état, pour un affichage instantané) ─────────
  const store = {
    load() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
    },
    save(data) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* stockage plein ou bloqué */ }
    },
  };

  const saved = store.load();
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
    hidden: new Set((saved.hidden || []).filter((id) => SRC[id])),
    auto: saved.auto ?? true,
    interval: INTERVALS.some(([v]) => v === saved.interval) ? saved.interval : 60,
    results: Object.fromEntries(Object.entries(saved.results || {}).filter(([id]) => SRC[id])),
    firstSeen: saved.firstSeen || {},
    lastVisit: saved.lastVisit || {},
    pending: new Set(),
    loading: false,
    nextAt: 0,
    lastSync: saved.lastSync || 0,
  };

  function persist() {
    store.save({
      lang: state.lang, period: state.period, view: state.view, projSort: state.projSort,
      hidden: [...state.hidden], auto: state.auto, interval: state.interval,
      results: state.results, firstSeen: state.firstSeen, lastVisit: state.lastVisit, lastSync: state.lastSync,
    });
  }
  let persistTimer = 0;
  const persistSoon = () => { clearTimeout(persistTimer); persistTimer = setTimeout(persist, 800); };

  // ───────── Récupération des flux ─────────
  const inflight = new Map(); // une même URL partagée par plusieurs sources n'est téléchargée qu'une fois par cycle

  function httpMessage(status, url, body) {
    if (status === 403 && url.includes('api.github.com')) return 'Limite de l’API GitHub atteinte, nouvel essai automatique plus tard';
    if (status === 429) return 'La source limite le nombre de requêtes (429), nouvel essai plus tard';
    if (status === 404) return 'Flux introuvable (404) : l’adresse a peut-être changé';
    if (status === 401 || status === 403) return `Accès refusé par la source (${status})`;
    if (body && body.length < 300) return body;
    return `Erreur HTTP ${status}`;
  }

  async function readText(res) {
    const buf = await res.arrayBuffer();
    let charset = /charset=["']?([\w-]+)/i.exec(res.headers.get('content-type') || '')?.[1];
    if (!charset) charset = /encoding=["']([\w-]+)["']/i.exec(new TextDecoder('latin1').decode(buf.slice(0, 200)))?.[1];
    try { return new TextDecoder(charset || 'utf-8').decode(buf); } catch { return new TextDecoder().decode(buf); }
  }

  function getText(url) {
    if (inflight.has(url)) return inflight.get(url);
    const target = state.relay ? `/api/proxy?url=${encodeURIComponent(url)}` : url;
    const job = fetch(target, { cache: 'no-store', signal: AbortSignal.timeout(25000) })
      .then(async (res) => {
        if (!res.ok) {
          const body = state.relay ? (await res.text().catch(() => '')).trim() : '';
          throw new Error(httpMessage(res.status, url, body));
        }
        return readText(res);
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
    inflight.set(url, job);
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
    const entries = [...doc.getElementsByTagName('item'), ...doc.getElementsByTagName('entry')];
    if (!entries.length && !doc.querySelector('rss, feed, RDF, channel')) throw new Error('Aucun article trouvé dans la réponse');
    return entries.map((el) => {
      const content = kidText(el, 'content:encoded', 'content');
      const desc = kidText(el, 'description', 'summary', 'media:description');
      const link = safeUrl(entryLink(el), url);
      const rawTitle = kidText(el, 'title');
      return {
        title: (/<[a-z]/i.test(rawTitle) ? toText(rawTitle) : decode(rawTitle)).replace(/\s+/g, ' ').trim(),
        link,
        date: parseDate(kidText(el, 'pubDate', 'published', 'updated', 'dc:date', 'a10:updated')),
        summary: clip(cleanSummary(toText(desc || content)), 280),
        image: entryImage(el, content || desc, link || url),
      };
    });
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

  const PARSERS = { rss: parseFeed, hn: parseHN, github: parseGitHub };

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
    const parse = PARSERS[src.kind || 'rss'];
    const settled = await Promise.allSettled(urls.map((u) => getText(u).then((text) => parse(text, u))));
    const done = settled.filter((s) => s.status === 'fulfilled');
    if (!done.length) throw settled[0].reason;

    const now = Date.now();
    const prevDates = new Map((state.results[src.id]?.items || []).map((p) => [p.id, p.date]));
    const seen = new Set();
    const items = [];
    for (const it of done.flatMap((s) => s.value)) {
      if (!it.link || !it.title) continue;
      const hay = `${it.title} ${it.summary} ${(it.topics || []).join(' ')}`;
      if (src.include && !src.include.test(hay)) continue;
      if (src.exclude && src.exclude.test(hay)) continue;
      it.id = normId(it.link);
      if (seen.has(it.id)) continue;
      seen.add(it.id);
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
    if (state.loading) return;
    const now = Date.now();
    const due = SOURCES.filter((s) => now - (state.results[s.id]?.at || 0) >= (s.minAge ?? 30) * 1000 - 1500);
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
        const { items, ms, warn } = await fetchSource(src);
        const baseline = !prev?.ok && !prev?.items?.length; // première lecture : rien n'est « nouveau »
        for (const it of items) {
          if (it.id in state.firstSeen) continue;
          state.firstSeen[it.id] = baseline ? 0 : Date.now();
          if (!baseline && !it.repo) fresh.push(it);
        }
        state.results[src.id] = { items, at: Date.now(), ok: true, ms, error: warn };
      } catch (err) {
        state.results[src.id] = { items: prev?.items || [], at: Date.now(), ok: false, ms: 0, error: err.message, blocked: !!err.blocked };
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
    if (fresh.length) notifyNew(fresh);
    else if (manual) toast('Synchronisé', 'Aucun nouvel article depuis la dernière vérification.');
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
  const newsSources = (catId) => SOURCES.filter((s) => s.cat === catId && s.kind !== 'github');
  const projectSources = (catId) => SOURCES.filter((s) => s.cat === catId && s.kind === 'github');
  const newsItems = (catId) => dedupe(newsSources(catId).flatMap((s) => state.results[s.id]?.items || [])).sort((a, b) => (b.date || 0) - (a.date || 0));
  const isNew = (it) => {
    const t = state.firstSeen[it.id];
    return t > 0 && Date.now() - t < NEW_WINDOW;
  };
  const unseen = (catId) => {
    const since = state.lastVisit[catId] || 0;
    return newsItems(catId).filter((it) => state.firstSeen[it.id] > since).length;
  };

  function statusOf(src) {
    if (state.pending.has(src.id)) return 'wait';
    const r = state.results[src.id];
    if (!r) return 'idle';
    if (r.ok) return 'ok';
    return r.blocked ? 'blocked' : 'err';
  }

  function filterItems(items, projects = false) {
    const tokens = norm(state.q).split(/\s+/).filter(Boolean);
    const maxAge = PERIOD_MS[state.period];
    const now = Date.now();
    return items.filter((it) => {
      const src = SRC[it.src];
      if (state.hidden.has(src.id)) return false;
      if (!projects) {
        if (state.lang !== 'all' && src.lang !== state.lang) return false;
        if (state.type !== 'all' && src.type !== state.type) return false;
        if (maxAge !== Infinity && (!it.date || now - it.date > maxAge)) return false;
      }
      if (tokens.length) {
        const hay = norm(`${it.title} ${it.summary} ${src.name} ${it.host || ''} ${(it.topics || []).join(' ')} ${it.language || ''}`);
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }

  // ───────── Rendu ─────────
  const phHTML = (src) => `<div class="ph" style="--h:${hue(src.name)}"><span>${esc(mono(src))}</span><em>${esc(src.name)}</em></div>`;
  const typeBadge = (type) => `<span class="type type-${type}" title="${esc(TYPES[type].hint)}">${esc(TYPES[type].label)}</span>`;
  const extLink = (href, inner, title = '') => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer"${title ? ` title="${esc(title)}"` : ''}>${inner}</a>`;

  function cardHTML(it, i) {
    const src = SRC[it.src];
    const cat = CAT[src.cat];
    const fresh = isNew(it);
    const foot = [`<span class="lang">${src.lang.toUpperCase()}</span>`];
    if (it.host) foot.push(`<span>${esc(it.host)}</span>`);
    if (it.points != null) {
      foot.push(`<span class="pts" title="Points Hacker News">${icon('up')}${it.points}</span>`);
      foot.push(extLink(it.discuss, `${icon('chat')}${it.comments}`, 'Discussion sur Hacker News'));
    }
    if (src.lang === 'en') {
      foot.push(`<span class="push">${extLink(`https://translate.google.com/translate?sl=auto&tl=fr&u=${encodeURIComponent(it.link)}`, `${icon('translate')}Traduire`, 'Ouvrir l’article traduit en français')}</span>`);
    }
    return `<article class="card${fresh ? ' is-new' : ''}" data-src="${src.id}" style="--h:${hue(src.name)};--c:${cat.color};--i:${Math.min(i, 18)}">
      ${fresh ? '<span class="new-pill">NOUVEAU</span>' : ''}
      <div class="media">${it.image ? `<img src="${esc(it.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : phHTML(src)}</div>
      <div class="body">
        <div class="meta"><span class="src">${esc(src.name)}</span>${typeBadge(src.type)}${timeTag(it.date)}</div>
        <h3>${extLink(it.link, esc(it.title))}</h3>
        ${it.summary ? `<p class="sum">${esc(it.summary)}</p>` : ''}
        <div class="cf">${foot.join('')}</div>
      </div>
    </article>`;
  }

  function repoHTML(it, i) {
    const src = SRC[it.src];
    const cat = CAT[src.cat];
    const [owner, name = it.title] = it.title.split('/');
    const active = Date.now() - it.date < 7 * 864e5;
    const topics = it.topics.filter((t) => !GENERIC_TOPICS.has(t)).slice(0, 5);
    const tag = it.archived
      ? '<span class="tag-live tag-archived" title="Dépôt archivé : plus maintenu">ARCHIVÉ</span>'
      : active ? '<span class="tag-live" title="Code modifié cette semaine">ACTIF</span>' : '';
    return `<article class="card repo" data-src="${src.id}" style="--h:${hue(name)};--c:${cat.color};--i:${Math.min(i, 18)}">
      <div class="body">
        <div class="r-head">
          <img class="av" src="${esc(it.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">
          <div><div class="r-owner">${esc(owner)}</div><h3>${extLink(it.link, esc(name))}</h3></div>
          ${tag}
        </div>
        ${it.summary ? `<p class="sum">${esc(it.summary)}</p>` : ''}
        ${topics.length ? `<div class="topics">${topics.map((t) => `<span class="topic">${esc(t)}</span>`).join('')}</div>` : ''}
        <div class="cf">
          <span class="stars" title="${it.stars} étoiles">${icon('star')}${compact(it.stars)}</span>
          <span title="${it.forks} forks">${icon('fork')}${compact(it.forks)}</span>
          ${it.language ? `<span class="lang-dot" style="--h:${hue(it.language)}">${esc(it.language)}</span>` : ''}
          <span class="push" title="Dernière modification du code">${icon('clock')}${timeTag(it.date)}</span>
        </div>
      </div>
    </article>`;
  }

  const skeletons = (n) => `<div class="grid">${'<div class="sk"></div>'.repeat(n)}</div>`;

  function emptyHTML(srcs, total) {
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

  function chipsHTML(srcs, all) {
    const counts = {};
    for (const it of all) counts[it.src] = (counts[it.src] || 0) + 1;
    const chips = srcs.map((s) => {
      const st = statusOf(s);
      const r = state.results[s.id];
      const title = `${TYPES[s.type].label} · ${s.lang.toUpperCase()}${r?.error ? ` · ${r.error}` : ''} — cliquer pour masquer / afficher`;
      return `<button class="chip ${st}${state.hidden.has(s.id) ? ' off' : ''}" data-act="chip" data-v="${s.id}" style="--h:${hue(s.name)}" title="${esc(title)}"><i></i>${esc(s.name)}<b>${counts[s.id] || 0}</b></button>`;
    });
    if (srcs.some((s) => state.hidden.has(s.id))) chips.push('<button class="chip reset" data-act="chips-reset">Tout afficher</button>');
    return `<div class="chips">${chips.join('')}</div>`;
  }

  function newsHTML(catId) {
    const srcs = newsSources(catId);
    const all = newsItems(catId);
    const items = filterItems(all);
    const shown = items.slice(0, 200);
    return `${chipsHTML(srcs, all)}
      <div class="count-line"><span><b>${items.length}</b> article${items.length > 1 ? 's' : ''}${items.length !== all.length ? ` sur ${all.length}` : ''}</span></div>
      ${shown.length ? `<div class="grid ${state.view}">${shown.map(cardHTML).join('')}</div>` : emptyHTML(srcs, all.length)}`;
  }

  function projectsHTML(catId) {
    const srcs = projectSources(catId);
    const all = dedupe(srcs.flatMap((s) => state.results[s.id]?.items || []));
    const items = filterItems(all, true).sort(state.projSort === 'stars' ? (a, b) => b.stars - a.stars : (a, b) => b.date - a.date);
    const info = srcs.map((s) => {
      const r = state.results[s.id];
      if (!r) return '';
      const next = r.at + (s.minAge ?? 30) * 1000;
      return `GitHub interrogé ${ago(r.at)} · ${[].concat(s.url).length} recherches · prochaine mise à jour ${next > Date.now() ? ago(next) : 'au prochain cycle'}${r.error ? ` · ⚠ ${esc(r.error)}` : ''}`;
    }).join('');
    return `<div class="count-line"><span><b>${items.length}</b> projet${items.length > 1 ? 's' : ''}${info ? ` · ${info}` : ''}</span></div>
      ${items.length ? `<div class="grid">${items.map(repoHTML).join('')}</div>` : emptyHTML(srcs, all.length)}`;
  }

  function radarHTML() {
    const now = Date.now();
    const perCat = CATEGORIES.map((c) => ({ c, items: newsItems(c.id) }));
    const everything = dedupe(perCat.flatMap((p) => p.items));
    const repos = dedupe(SOURCES.filter((s) => s.kind === 'github').flatMap((s) => state.results[s.id]?.items || []));
    const online = SOURCES.filter((s) => state.results[s.id]?.ok).length;
    const stats = [
      ['Articles des dernières 24 h', everything.filter((it) => now - it.date < 864e5).length, '#00e5ff'],
      ['Nouveaux (30 min)', everything.filter(isNew).length, '#ff2bd6'],
      ['Sources en ligne', `${online}<small>/${SOURCES.length}</small>`, '#a3ff12'],
      ['Projets GitHub suivis', repos.length, '#ffb020'],
    ];
    const panels = perCat.map(({ c, items }) => {
      const n = unseen(c.id);
      const rows = items.slice(0, 7).map((it) => {
        const s = SRC[it.src];
        return `<a class="row${isNew(it) ? ' is-new' : ''}" href="${esc(it.link)}" target="_blank" rel="noopener noreferrer" style="--h:${hue(s.name)}">
          ${timeTag(it.date, true)}<span><span class="s">${esc(s.name)}</span><span class="t">${esc(it.title)}</span></span></a>`;
      }).join('');
      const waiting = newsSources(c.id).some((s) => state.pending.has(s.id));
      return `<section class="panel" style="--c:${c.color}">
        <header class="panel-h">${icon(c.icon)}<h2>${esc(c.label)}</h2>${n ? `<b class="badge">+${n}</b>` : ''}<a class="more" href="#${c.id}">Tout voir →</a></header>
        ${rows || (waiting ? '<div class="sk-row"></div>'.repeat(5) : '<div class="empty" style="margin:16px;padding:30px 16px"><p>Aucun article pour le moment.</p></div>')}
      </section>`;
    }).join('');
    return `<div class="stats">${stats.map(([label, value, color]) => `<div class="stat" style="--sc:${color}"><b>${value}</b><span>${label}</span></div>`).join('')}</div>
      <div class="panels">${panels}</div>`;
  }

  function sourcesHTML() {
    const note = state.relay
      ? `<div class="mode-note">${icon('info')}<p>Relais actif : les flux sont lus par <code>serveur.py</code> ${state.hosted ? 'sur le serveur qui héberge ce site' : 'sur votre machine'}, puis analysés dans votre navigateur. Aucun service tiers entre vous et les sources.</p></div>`
      : `<div class="mode-note">${icon('alert')}<p>Mode direct : la page est ouverte sans relais, seules les sources qui autorisent la lecture depuis une autre page répondent. Lancez <code>lancer.bat</code> pour activer toutes les sources.</p></div>`;
    const legend = `<div class="legend">${Object.entries(TYPES).map(([k, t]) => `<div class="lg"><span class="type type-${k}">${esc(t.label)}</span><p>${esc(t.hint)}</p></div>`).join('')}</div>`;
    const labels = { ok: 'En ligne', err: 'Erreur', blocked: 'Bloquée (CORS)', wait: 'Chargement…', idle: 'Pas encore interrogée' };
    const groups = CATEGORIES.map((c) => {
      const rows = SOURCES.filter((s) => s.cat === c.id).map((s) => {
        const r = state.results[s.id];
        const st = statusOf(s);
        const urls = [].concat(s.url);
        const sub = [labels[st]];
        if (r?.at) sub.push(`interrogée ${ago(r.at)}`);
        if ((s.minAge ?? 30) >= 300) sub.push(`au plus toutes les ${Math.round(s.minAge / 60)} min`);
        if (s.include) sub.push('filtrée par mots-clés');
        if (s.exclude && s.kind !== 'github') sub.push('sujets « jeux » exclus');
        return `<article class="src-item" style="--h:${hue(s.name)}">
          <span class="dot ${st}" title="${labels[st]}"></span>
          <div class="si-main">${extLink(s.site, esc(s.name)).replace('<a ', '<a class="si-name" ')}${typeBadge(s.type)}<span class="lang">${s.lang.toUpperCase()}</span></div>
          <div class="si-stats">${r ? `${r.items.length} élém.${r.ms ? ` · ${r.ms} ms` : ''}` : ''}</div>
          <div class="si-sub">${esc(sub.join(' · '))}${r && !r.ok ? ` · <button class="si-retry" data-act="retry" data-v="${s.id}">réessayer</button>` : ''}</div>
          ${r?.error ? `<div class="si-err">${esc(r.error)}</div>` : ''}
          <div class="si-urls">${urls.slice(0, 2).map((u) => extLink(u, esc(u))).join('')}${urls.length > 2 ? `<span class="si-sub">+ ${urls.length - 2} autre(s) requête(s)</span>` : ''}</div>
        </article>`;
      }).join('');
      return `<section class="src-cat" style="--c:${c.color}"><h2>${icon(c.icon)}${esc(c.long)}</h2><div class="src-list">${rows}</div></section>`;
    }).join('');
    return note + legend + groups;
  }

  function seg(act, current, options, titles = []) {
    return `<div class="seg">${options.map(([v, label], i) => `<button data-act="${act}" data-v="${v}" class="${v === current ? 'on' : ''}"${titles[i] ? ` title="${titles[i]}" aria-label="${titles[i]}"` : ''}>${label}</button>`).join('')}</div>`;
  }

  function toolbarHTML() {
    const search = `<label class="search">${icon('search')}<input id="q" type="search" placeholder="Rechercher dans cette rubrique…" value="${esc(state.q)}" autocomplete="off" spellcheck="false"><kbd>/</kbd></label>`;
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
    let html = `<div class="v-title"><span class="ico">${icon(t.icon)}</span><div><h1>${esc(t.long)}</h1><p class="v-sub">${esc(state.sub === 'projects' ? PROJECTS_ABOUT : t.about)}</p></div></div>`;
    if (cat?.projects) {
      html += `<div class="subnav" role="tablist">
        <button data-act="sub" data-v="news" class="${state.sub === 'news' ? 'on' : ''}" role="tab" aria-selected="${state.sub === 'news'}">Actualités</button>
        <button data-act="sub" data-v="projects" class="${state.sub === 'projects' ? 'on' : ''}" role="tab" aria-selected="${state.sub === 'projects'}">Projets GitHub</button>
      </div>`;
    }
    if (cat) html += toolbarHTML();
    if (state.tab === 'radar') html += '<div id="ticker" class="ticker"></div>';
    $('#head').innerHTML = html;
    tickerSig = '';
  }

  let lastBody = '';
  function renderBody(enter = false) {
    let html;
    if (state.tab === 'radar') html = radarHTML();
    else if (state.tab === 'sources') html = sourcesHTML();
    else if (state.sub === 'projects') html = projectsHTML(state.tab);
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
    body.innerHTML = html;
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

  function buildTabs() {
    $('#tabs').innerHTML = TABS.map((t, i) => `<a class="tab" href="#${t.id}" role="tab" data-tab="${t.id}" style="--tc:${t.color}" title="${esc(t.long)} (touche ${i + 1})">${icon(t.icon)}<span>${esc(t.label)}</span><b class="badge" hidden></b></a>`).join('');
  }

  function updateChrome() {
    let total = 0;
    for (const el of document.querySelectorAll('.tab')) {
      const id = el.dataset.tab;
      const selected = id === state.tab;
      el.setAttribute('aria-selected', String(selected));
      const n = CAT[id] && !selected ? unseen(id) : 0;
      total += n;
      const badge = el.querySelector('.badge');
      badge.hidden = !n;
      badge.textContent = n > 99 ? '99+' : String(n);
    }
    document.title = `${total ? `(${total}) ` : ''}NEXUS · Veille tech`;
    const online = SOURCES.filter((s) => state.results[s.id]?.ok).length;
    $('#sync').innerHTML = state.lastSync
      ? `Synchro <b>${new Date(state.lastSync).toLocaleTimeString('fr-FR')}</b> · ${online}/${SOURCES.length} sources`
      : 'Synchro —';
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
    state.sub = sub === 'projets' && CAT[state.tab]?.projects ? 'projects' : 'news';
  }

  function go(enter = true) {
    renderHead();
    renderBody(enter);
    updateChrome();
  }

  window.addEventListener('hashchange', () => {
    const before = state.tab;
    parseHash();
    if (state.tab !== before) state.q = '';
    go();
    window.scrollTo({ top: 0 });
  });

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const { act, v } = el.dataset;
    const markSeg = () => el.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === el));
    switch (act) {
      case 'sub':
        location.hash = v === 'projects' ? `${state.tab}/projets` : state.tab;
        return;
      case 'lang': state.lang = v; markSeg(); break;
      case 'view': state.view = v; markSeg(); break;
      case 'sort': state.projSort = v; markSeg(); break;
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
    renderBody(act === 'view' || act === 'sort');
  });

  document.addEventListener('change', (e) => {
    const el = e.target.closest('select[data-act]');
    if (!el) return;
    state[el.dataset.act] = el.value;
    persistSoon();
    renderBody(true);
  });

  document.addEventListener('input', (e) => {
    if (e.target.id !== 'q') return;
    state.q = e.target.value;
    renderBody();
  });

  // Image cassée → image générée ; image minuscule (pixel de suivi) → idem.
  const swapImage = (img) => {
    const card = img.closest('.card');
    if (img.classList.contains('av')) { img.style.visibility = 'hidden'; return; }
    if (card && SRC[card.dataset.src]) img.outerHTML = phHTML(SRC[card.dataset.src]);
  };
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') swapImage(e.target); }, true);
  document.addEventListener('load', (e) => {
    const img = e.target;
    if (img.tagName === 'IMG' && img.closest('.media') && img.naturalWidth < 60) swapImage(img);
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName);
    if (typing) {
      if (e.key === 'Escape') document.activeElement.blur();
      return;
    }
    const key = e.key.toLowerCase();
    if (key === 'r') { e.preventDefault(); refresh(true); }
    else if (key === 'a') { const auto = $('#auto'); auto.checked = !auto.checked; auto.dispatchEvent(new Event('change')); }
    else if (key === '/') { const q = $('#q'); if (q) { e.preventDefault(); q.focus(); } }
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
    buildTabs();
    setupControls();
    go(true); // affiche tout de suite le dernier état connu
    const relay = await detectRelay();
    state.relay = !!relay;
    state.hosted = !!relay?.hosted;
    showMode();
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
