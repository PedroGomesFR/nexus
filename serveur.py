#!/usr/bin/env python3
"""NEXUS - relais de la veille tech.

Sert le site (index.html, css/, js/) et relaie les flux RSS / API vers le
navigateur : la plupart des sites interdisent la lecture de leurs flux depuis
une autre page web (CORS). Bibliotheque standard uniquement, rien a installer.

En local     : python serveur.py [port] [--no-browser]   (port par defaut : 8787)
En ligne     : la variable d'environnement PORT (fournie par Render, Railway...)
               active le mode heberge : ecoute sur 0.0.0.0, pas de navigateur.
GITHUB_TOKEN : facultatif, releve la limite de l'API GitHub (jeton sans permission).
"""

import gzip
import ipaddress
import json
import os
import re
import socket
import sys
import threading
import time
import webbrowser
import zlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

ROOT = Path(__file__).resolve().parent
SOURCES_FILE = ROOT / "js" / "sources.js"
HOSTED = "PORT" in os.environ
HOST = os.environ.get("HOST", "0.0.0.0" if HOSTED else "127.0.0.1")
DEFAULT_PORT = int(os.environ.get("PORT", 8787))
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "").strip()
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/129.0 Safari/537.36 NexusVeille/1.0"
)
TIMEOUT = 20
MAX_BYTES = 10 * 1024 * 1024
FRESH_FOR = 20  # secondes : en dessous, on ressert la copie en cache sans recontacter la source

_cache = {}
_lock = threading.Lock()
_allowed = {"mtime": None, "hosts": frozenset()}


class RelayError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def allowed_hosts():
    """Domaines cites dans js/sources.js : le relais ne contacte qu'eux (relu quand le fichier change)."""
    try:
        mtime = SOURCES_FILE.stat().st_mtime
    except OSError:
        return frozenset()
    if mtime != _allowed["mtime"]:
        text = SOURCES_FILE.read_text(encoding="utf-8")
        hosts = frozenset(h.lower() for h in re.findall(r"https?://([a-z0-9.-]+)", text, re.IGNORECASE))
        _allowed.update(mtime=mtime, hosts=hosts)
    return _allowed["hosts"]


def check_url(url):
    """N'autorise que http(s) vers des adresses publiques : le relais ne doit pas ouvrir le reseau local."""
    parts = urlparse(url)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        raise RelayError(400, "URL invalide")
    try:
        infos = socket.getaddrinfo(parts.hostname, None)
    except (socket.gaierror, UnicodeError):
        raise RelayError(502, f"Domaine introuvable : {parts.hostname} (connexion internet ?)") from None
    for info in infos:
        if not ipaddress.ip_address(info[4][0].split("%")[0]).is_global:
            raise RelayError(403, "Adresse non publique refusee")


class SafeRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        check_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


_opener = build_opener(SafeRedirect)


def decode_body(raw, encoding):
    encoding = (encoding or "").lower()
    if encoding == "gzip":
        return gzip.decompress(raw)
    if encoding == "deflate":
        try:
            return zlib.decompress(raw)
        except zlib.error:
            return zlib.decompress(raw, -zlib.MAX_WBITS)
    return raw


def fetch(url):
    """Recupere une URL avec cache court et requetes conditionnelles (ETag / Last-Modified)."""
    hostname = (urlparse(url).hostname or "").lower()
    if hostname not in allowed_hosts():
        raise RelayError(403, f"Domaine absent de js/sources.js : {hostname or url[:60]}")

    now = time.time()
    with _lock:
        cached = _cache.get(url)
    if cached and now - cached["at"] < FRESH_FOR:
        return cached, "hit"

    check_url(url)
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/rss+xml, application/atom+xml, application/xml;q=0.9, "
        "text/xml;q=0.9, application/json;q=0.9, */*;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    }
    if cached and cached.get("etag"):
        headers["If-None-Match"] = cached["etag"]
    if cached and cached.get("modified"):
        headers["If-Modified-Since"] = cached["modified"]
    request = Request(url, headers=headers)
    if GITHUB_TOKEN and hostname == "api.github.com":
        # En-tete « non redirige » : le jeton n'est jamais transmis a un autre domaine.
        request.add_unredirected_header("Authorization", f"Bearer {GITHUB_TOKEN}")

    try:
        with _opener.open(request, timeout=TIMEOUT) as resp:
            raw = resp.read(MAX_BYTES + 1)
            if len(raw) > MAX_BYTES:
                raise RelayError(502, "Reponse trop volumineuse")
            if not raw.strip():
                # Typiquement un 202 vide : la source impose une verification anti-robot.
                raise RelayError(502, f"Reponse vide (HTTP {resp.status}) : protection anti-robot de la source, nouvel essai plus tard")
            entry = {
                "body": decode_body(raw, resp.headers.get("Content-Encoding")),
                "type": resp.headers.get("Content-Type") or "application/octet-stream",
                "etag": resp.headers.get("ETag"),
                "modified": resp.headers.get("Last-Modified"),
                "at": now,
            }
            state = "miss"
    except HTTPError as err:
        if err.code == 304 and cached:
            entry, state = dict(cached, at=now), "revalidated"
        else:
            raise RelayError(err.code, f"La source a repondu {err.code} {err.reason}") from None
    except (URLError, TimeoutError, ConnectionError) as err:
        raise RelayError(502, f"Source injoignable : {getattr(err, 'reason', err)}") from None

    with _lock:
        _cache[url] = entry
    return entry, state


class Handler(SimpleHTTPRequestHandler):
    # Types explicites : sous Windows, le registre associe parfois .js a text/plain.
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".ico": "image/x-icon",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        pass  # console silencieuse : seules les erreurs de sources sont affichees

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def list_directory(self, path):
        self.send_error(404, "Not found")
        return None

    def do_GET(self):
        # En local, protection contre le DNS rebinding : seules les pages servies par 127.0.0.1 parlent au relais.
        host = (self.headers.get("Host") or "").rsplit(":", 1)[0]
        if not HOSTED and host not in ("127.0.0.1", "localhost"):
            self.send_error(403, "Host refused")
            return
        route = urlparse(self.path)
        if route.path == "/api/ping":
            body = json.dumps({"relay": "nexus", "ok": True, "hosted": HOSTED}).encode()
            self.reply(200, body, "application/json")
        elif route.path == "/api/proxy":
            self.proxy(parse_qs(route.query).get("url", [""])[0])
        elif route.path in ("/", "/index.html") or route.path.startswith(("/css/", "/js/")):
            super().do_GET()  # seul le site est servi, pas le reste du dossier
        else:
            self.send_error(404, "Not found")

    def proxy(self, url):
        try:
            entry, state = fetch(url)
        except RelayError as err:
            print(f"  [!] {err.status}  {url[:100]}\n      {err}")
            self.reply(err.status, str(err).encode("utf-8"), "text/plain; charset=utf-8")
            return
        except Exception as err:  # flux corrompu, decompression impossible...
            print(f"  [!] 502  {url[:100]}\n      {err!r}")
            self.reply(502, f"Erreur du relais : {err}".encode("utf-8"), "text/plain; charset=utf-8")
            return
        self.reply(200, entry["body"], entry["type"], {"X-Nexus-Cache": state})

    def reply(self, status, body, ctype, extra=None):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        for key, value in (extra or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)


class Server(ThreadingHTTPServer):
    # Sous Windows, SO_REUSEADDR laisserait deux serveurs partager le meme port.
    allow_reuse_address = sys.platform != "win32"

    def handle_error(self, request, client_address):
        if isinstance(sys.exc_info()[1], (ConnectionError, TimeoutError)):
            return  # onglet ferme pendant une reponse : sans importance
        super().handle_error(request, client_address)


def main():
    sys.stdout.reconfigure(line_buffering=True)  # messages visibles tout de suite, meme sans console
    args = sys.argv[1:]
    port = next((int(a) for a in args if a.isdigit()), DEFAULT_PORT)
    # En ligne, l'hebergeur impose le port ; en local, on cherche le premier port libre.
    for candidate in [port] if HOSTED else range(port, port + 20):
        try:
            server = Server((HOST, candidate), Handler)
            break
        except OSError:
            continue
    else:
        sys.exit(f"Impossible d'ecouter sur le port {port}.")

    url = f"http://{'127.0.0.1' if HOST == '0.0.0.0' else HOST}:{server.server_address[1]}/"
    print()
    print("  =====================================================")
    print("   N E X U S  //  veille tech temps reel")
    print("  =====================================================")
    if HOSTED:
        print(f"   Mode heberge : ecoute sur {HOST}:{server.server_address[1]}")
        print(f"   Jeton GitHub : {'oui' if GITHUB_TOKEN else 'non (limite publique de l API)'}")
        print(f"   Domaines autorises : {len(allowed_hosts())}")
    else:
        print(f"   Site    : {url}")
        print("   Arret   : Ctrl+C  (ou fermez cette fenetre)")
    print("  -----------------------------------------------------")
    print()
    if not HOSTED and "--no-browser" not in args:
        threading.Timer(0.6, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Arret de NEXUS.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
