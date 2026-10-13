/* NEXUS — jeux rétro-ingéniérés jouables (onglet Reverse Jeux → Jouer).
 *
 * Uniquement des liens officiels (site ou dépôt du projet). Aucun de ces projets ne contient
 * les graphismes ni la musique des jeux : sauf mention « free » ou « demo », il faut sa propre copie.
 *
 *   needs   'free'  rien à fournir (données libres ou offertes)
 *           'demo'  jouable avec une version de démonstration / shareware gratuite
 *           'files' fichiers du jeu original (GOG, Steam, CD)
 *           'rom'   ROM de votre propre copie du jeu
 *   steps   étapes de lancement ; `texte` entre accents graves = nom de fichier
 *   warn    avertissement affiché sur la fiche (site instable…)
 *   code    dépôts GitHub (le premier est le principal)
 */
window.NEXUS_GAMES = [
  // ───────── Jouables dans le navigateur ─────────
  {
    id: 'pikachu-volleyball', game: 'Pikachu Volleyball', original: 'Windows · 1997 · freeware',
    project: 'pikachu-volleyball', kind: 'Réécrit en JavaScript',
    desc: 'Le célèbre jeu de volley japonais, reconstitué fidèlement en JavaScript à partir du code machine de l’original.',
    needs: 'free', needsText: 'Rien : le jeu se joue directement en ligne.',
    play: 'https://gorisanson.github.io/pikachu-volleyball/en/',
    code: ['gorisanson/pikachu-volleyball'], platforms: ['Navigateur'],
    steps: [
      'Cliquez sur « Jouer en ligne » : le jeu se lance dans le navigateur, sans rien installer.',
      'Jouez seul contre l’ordinateur ou à deux sur le même clavier.',
    ],
  },
  {
    id: 'diablo', game: 'Diablo', original: 'PC · 1996',
    project: 'diabloweb · DevilutionX', kind: 'Code reconstitué',
    desc: 'Diablo dans le navigateur (même sur mobile), ou en version PC moderne avec DevilutionX : haute résolution, manette, multijoueur.',
    needs: 'demo', needsText: 'La version shareware est gratuite. Pour le jeu complet : votre fichier `DIABDAT.MPQ` (CD ou GOG).',
    play: 'https://d07riv.github.io/diabloweb/',
    download: 'https://github.com/diasurgical/devilutionX/releases/latest',
    code: ['diasurgical/devilutionX', 'd07RiV/diabloweb'],
    platforms: ['Navigateur', 'Windows', 'Linux', 'macOS', 'Android', 'iOS'],
    steps: [
      'En ligne : ouvrez « Jouer en ligne » et choisissez la version shareware gratuite, ou chargez votre fichier `DIABDAT.MPQ` pour le jeu complet.',
      'Sur PC : téléchargez DevilutionX et décompressez l’archive.',
      'Copiez `DIABDAT.MPQ` depuis votre CD ou votre installation GOG dans le dossier de DevilutionX, puis lancez `devilutionx.exe`.',
      'Pour l’extension Hellfire, copiez aussi `hellfire.mpq`, `hfmonk.mpq`, `hfmusic.mpq` et `hfvoice.mpq`.',
    ],
  },
  {
    id: 'jazz2', game: 'Jazz Jackrabbit 2', original: 'PC · 1998',
    project: 'Jazz² Resurrection', kind: 'Moteur réécrit',
    desc: 'Réimplémentation complète en C++ : haute résolution, manette, multijoueur et versions pour de nombreuses plateformes, navigateur compris.',
    needs: 'demo', needsText: 'La démo shareware suffit. Pour le jeu complet : les fichiers de votre Jazz Jackrabbit 2.',
    play: 'https://de4th.dev/jazz2/wasm/',
    download: 'https://github.com/deathkiller/jazz2-native/releases',
    site: 'https://de4th.dev/jazz2/',
    code: ['deathkiller/jazz2-native'], platforms: ['Navigateur', 'Windows', 'Linux', 'macOS', 'Android', 'Switch'],
    steps: [
      'En ligne : « Jouer en ligne » lance le jeu dans le navigateur (WebAssembly et WebGL 2 requis).',
      'Sur PC : téléchargez Jazz² Resurrection et décompressez-le ailleurs que dans « Program Files ».',
      'Copiez le contenu de votre dossier Jazz Jackrabbit 2 (ou de la démo shareware) dans le sous-dossier `Source`.',
      'Lancez le jeu : au premier démarrage, le cache est préparé pendant la cinématique d’introduction.',
    ],
  },
  {
    id: 'openlara', game: 'Tomb Raider', original: 'PlayStation, Saturn, PC · 1996',
    project: 'OpenLara', kind: 'Moteur réécrit',
    desc: 'Moteur libre du premier Tomb Raider, avec une démo WebGL jouable dans le navigateur et des versions pour de nombreuses plateformes.',
    needs: 'demo', needsText: 'La démo en ligne est gratuite. Pour le jeu complet : les fichiers de votre Tomb Raider.',
    play: 'http://xproger.info/projects/OpenLara/',
    warn: 'Le site de la démo en ligne est souvent lent ou indisponible : en cas d’échec, réessayez un peu plus tard.',
    download: 'https://github.com/XProger/OpenLara/releases/latest',
    code: ['XProger/OpenLara'], platforms: ['Navigateur', 'Windows', 'Android', 'et bien d’autres'],
    steps: [
      'En ligne : « Jouer en ligne » lance un niveau de démonstration en WebGL.',
      'Pour le jeu complet, téléchargez la version de votre plateforme et suivez le README du projet pour y ajouter les fichiers de votre Tomb Raider.',
    ],
  },

  // ───────── Gratuits à télécharger ─────────
  {
    id: 'openttd', game: 'Transport Tycoon Deluxe', original: 'PC · 1995',
    project: 'OpenTTD', kind: 'Moteur réécrit',
    desc: 'Le jeu de gestion de transports de Chris Sawyer, réécrit et enrichi depuis 2004 : parties en ligne, cartes géantes, milliers de mods.',
    needs: 'free', needsText: 'Rien : OpenTTD télécharge des graphismes, sons et musiques libres.',
    download: 'https://www.openttd.org/downloads/openttd-releases/latest', site: 'https://www.openttd.org/',
    code: ['OpenTTD/OpenTTD'], platforms: ['Windows', 'Linux', 'macOS'],
    steps: [
      'Téléchargez et installez OpenTTD (il est aussi disponible gratuitement sur Steam).',
      'Au premier lancement, acceptez le téléchargement des graphismes, sons et musiques libres (OpenGFX, OpenSFX, OpenMSX).',
      'Lancez une partie : aucun fichier du jeu original n’est nécessaire.',
    ],
  },
  {
    id: 'openra', game: 'Command & Conquer · Red Alert · Dune 2000', original: 'PC · 1995 – 1998',
    project: 'OpenRA', kind: 'Moteur réécrit',
    desc: 'Les classiques de la stratégie de Westwood sur un moteur moderne : multijoueur en ligne, résolutions actuelles, équilibrage revu.',
    needs: 'free', needsText: 'Red Alert et Tiberian Dawn : fichiers offerts par EA, téléchargés par OpenRA. Dune 2000 : vos propres fichiers.',
    download: 'https://www.openra.net/download/', site: 'https://www.openra.net/',
    code: ['OpenRA/OpenRA'], platforms: ['Windows', 'Linux', 'macOS'],
    steps: [
      'Téléchargez OpenRA pour votre système et installez-le.',
      'Lancez le jeu voulu : Red Alert, Tiberian Dawn ou Dune 2000.',
      'Au premier lancement, laissez OpenRA télécharger les fichiers du jeu (gratuits pour Red Alert et Tiberian Dawn). Pour Dune 2000, indiquez vos fichiers d’origine.',
    ],
  },
  {
    id: 'scummvm', game: 'Jeux d’aventure point & click', original: 'LucasArts, Sierra, Revolution… · 1987 – 2000',
    project: 'ScummVM', kind: 'Moteurs réécrits',
    desc: 'Plus de 300 jeux d’aventure classiques (Monkey Island, Day of the Tentacle, Broken Sword…) sur les systèmes actuels, grâce à leurs moteurs reconstitués.',
    needs: 'free', needsText: 'Gratuit avec les jeux offerts sur le site (Beneath a Steel Sky, Flight of the Amazon Queen…). Les autres : vos propres fichiers.',
    download: 'https://www.scummvm.org/downloads/', site: 'https://www.scummvm.org/games/',
    code: ['scummvm/scummvm'], platforms: ['Windows', 'Linux', 'macOS', 'Android', 'iOS'],
    steps: [
      'Installez ScummVM.',
      'Pour jouer gratuitement, téléchargez un jeu offert (Beneath a Steel Sky, Flight of the Amazon Queen, Lure of the Temptress…) depuis le lien « Site officiel ».',
      'Dans ScummVM, cliquez sur « Ajouter un jeu… », choisissez le dossier du jeu, puis « Démarrer ».',
    ],
  },
  {
    id: 'rigelengine', game: 'Duke Nukem II', original: 'MS-DOS · 1993',
    project: 'RigelEngine', kind: 'Moteur réécrit',
    desc: 'Remplace l’exécutable d’origine : même jeu, mais en écran large, avec un défilement fluide et des commandes modernes.',
    needs: 'demo', needsText: 'La version shareware gratuite suffit. Le jeu complet fonctionne aussi.',
    download: 'https://github.com/lethal-guitar/RigelEngine/releases/latest',
    code: ['lethal-guitar/RigelEngine'], platforms: ['Windows', 'Linux', 'macOS'],
    steps: [
      'Téléchargez RigelEngine et décompressez-le.',
      'Procurez-vous les fichiers de Duke Nukem II : la version shareware gratuite ou votre version complète.',
      'Au premier lancement, RigelEngine vous demande où se trouve le jeu : sélectionnez son dossier, il s’en souviendra.',
    ],
  },
  {
    id: 'fheroes2', game: 'Heroes of Might and Magic II', original: 'PC · 1996',
    project: 'fheroes2', kind: 'Moteur réécrit',
    desc: 'Le jeu de stratégie au tour par tour recréé de zéro, en haute résolution, avec de nombreuses améliorations d’interface.',
    needs: 'demo', needsText: 'Jouable avec la démo gratuite (en anglais), téléchargée par un script fourni. Le jeu complet : votre copie GOG ou Ubisoft.',
    download: 'https://github.com/ihhub/fheroes2/releases/latest',
    code: ['ihhub/fheroes2'], platforms: ['Windows', 'Linux', 'macOS', 'Android', 'Switch'],
    steps: [
      'Téléchargez l’installateur Windows (ou l’archive de votre système) et installez fheroes2.',
      'Avec le jeu original : lancez le raccourci « Extract game resources from the original distribution of HoMM2 », ou copiez les dossiers `ANIM`, `DATA`, `MAPS` et `MUSIC`.',
      'Sans le jeu : utilisez le script fourni pour télécharger la démo gratuite.',
    ],
  },
  {
    id: 'trx', game: 'Tomb Raider I, II et III', original: 'PC · 1996 – 1998',
    project: 'TRX', kind: 'Moteur réécrit',
    desc: 'Réimplémentation des trois premiers Tomb Raider avec de nombreuses améliorations : graphismes, commandes, confort de jeu.',
    needs: 'demo', needsText: 'Vos jeux Steam, GOG ou CD. Gratuitement : la démo PC de Tomb Raider et les extensions Unfinished Business et Golden Mask.',
    download: 'https://github.com/LostArtefacts/TRX/releases/latest',
    code: ['LostArtefacts/TRX'], platforms: ['Windows', 'Linux', 'macOS'],
    steps: [
      'Téléchargez l’installateur TRX (`TRX-…-Windows_Installer.exe`), ou l’archive de votre système.',
      'Indiquez vos jeux d’origine (Steam, GOG ou CD) : l’installateur copie et range les fichiers nécessaires.',
      'Sans les jeux, l’installateur peut télécharger directement la démo PC de Tomb Raider et les extensions gratuites.',
    ],
  },

  // ───────── Avec vos fichiers du jeu (GOG, Steam, CD) ─────────
  {
    id: 'openrct2', game: 'RollerCoaster Tycoon 2', original: 'PC · 2002',
    project: 'OpenRCT2', kind: 'Moteur réécrit',
    desc: 'Le jeu de parcs d’attractions réimplémenté et étendu : multijoueur, écran large, nouveaux outils, compatible avec les scénarios de RCT1.',
    needs: 'files', needsText: 'Votre RollerCoaster Tycoon 2 (GOG, Steam ou CD).',
    download: 'https://github.com/OpenRCT2/OpenRCT2/releases/latest', site: 'https://openrct2.io/',
    code: ['OpenRCT2/OpenRCT2'], platforms: ['Windows', 'Linux', 'macOS', 'Android'],
    steps: [
      'Téléchargez OpenRCT2 pour votre système.',
      'Au premier lancement, indiquez le dossier d’installation de RollerCoaster Tycoon 2.',
      'Facultatif : ajoutez aussi RollerCoaster Tycoon 1 pour jouer à ses scénarios.',
    ],
  },
  {
    id: 'openxcom', game: 'X-COM: UFO Defense', original: 'PC · 1994',
    project: 'OpenXcom', kind: 'Moteur réécrit',
    desc: 'Le classique de la stratégie, corrigé et modernisé, avec une immense scène de mods (The X-Com Files, X-Piratez…).',
    needs: 'files', needsText: 'Les fichiers d’UFO Defense et/ou Terror from the Deep (Steam, GOG ou CD).',
    download: 'https://openxcom.org/download/', site: 'https://openxcom.org/',
    code: ['OpenXcom/OpenXcom'], platforms: ['Windows', 'Linux', 'macOS'],
    steps: [
      'Téléchargez OpenXcom (les versions « nightly » sont recommandées par le projet).',
      'Sous Windows, si vous avez le jeu sur Steam, l’installateur détecte et copie automatiquement les fichiers.',
      'Sinon, copiez les sous-dossiers du jeu d’origine dans le dossier `UFO` (ou `TFTD`) des données d’OpenXcom.',
    ],
  },
  {
    id: 'julius', game: 'Caesar III', original: 'PC · 1998',
    project: 'Julius', kind: 'Moteur réécrit',
    desc: 'Le jeu de construction de villes romaines, à l’identique mais en haute résolution et sur les systèmes actuels (Augustus en est une variante enrichie).',
    needs: 'files', needsText: 'Votre Caesar III (GOG, Steam ou CD).',
    download: 'https://github.com/bvschaik/julius/releases/latest',
    code: ['bvschaik/julius'], platforms: ['Windows', 'Linux', 'macOS', 'Android', 'Switch'],
    steps: [
      'Téléchargez Julius pour votre système (sur Android, il est aussi sur Google Play).',
      'Copiez Julius dans le dossier de Caesar III, ou lancez-le depuis un autre dossier : il vous demandera alors où se trouve le jeu.',
    ],
  },
  {
    id: 'corsixth', game: 'Theme Hospital', original: 'PC · 1997',
    project: 'CorsixTH', kind: 'Moteur réécrit',
    desc: 'Le jeu de gestion d’hôpital de Bullfrog, avec des résolutions modernes, des niveaux personnalisés et de nombreuses corrections.',
    needs: 'files', needsText: 'Votre Theme Hospital (GOG, EA ou CD).',
    download: 'https://github.com/CorsixTH/CorsixTH/releases/latest', site: 'https://corsixth.com/',
    code: ['CorsixTH/CorsixTH'], platforms: ['Windows', 'Linux', 'macOS'],
    steps: [
      'Téléchargez l’installateur (`CorsixTHInstaller.exe`) ou l’archive de votre système.',
      'Au premier lancement, indiquez le dossier de votre Theme Hospital.',
    ],
  },
  {
    id: 'openmw', game: 'The Elder Scrolls III: Morrowind', original: 'PC, Xbox · 2002',
    project: 'OpenMW', kind: 'Moteur réécrit',
    desc: 'Le moteur de Morrowind entièrement réécrit : distance d’affichage étendue, ombres, compatibilité avec la plupart des mods.',
    needs: 'files', needsText: 'Votre Morrowind (GOG, Steam ou CD).',
    download: 'https://openmw.org/downloads/', site: 'https://openmw.org/',
    code: ['OpenMW/openmw'], platforms: ['Windows', 'Linux', 'macOS'],
    steps: [
      'Téléchargez et installez OpenMW.',
      'Lancez l’assistant d’installation : il repère les fichiers de Morrowind (GOG, Steam ou CD) ou les importe.',
      'Ouvrez le lanceur OpenMW et cliquez sur « Jouer ».',
    ],
  },
  {
    id: 'sonic-mania', game: 'Sonic Mania', original: 'PC, consoles · 2017',
    project: 'Sonic Mania Decompilation', kind: 'Décompilation',
    desc: 'Décompilation complète de Sonic Mania et de son moteur (RSDKv5), qui permet de le porter et de le modifier librement.',
    needs: 'files', needsText: 'Le fichier `Data.rsdk` de votre Sonic Mania officiel (Steam, Epic, consoles). La version Netflix n’est pas prise en charge.',
    download: 'https://github.com/RSDKModding/Sonic-Mania-Decompilation/releases/latest',
    code: ['RSDKModding/Sonic-Mania-Decompilation'], platforms: ['Windows', 'Linux'],
    steps: [
      'Téléchargez la dernière version (Windows ou Linux) et décompressez-la.',
      'Copiez le fichier `Data.rsdk` de votre Sonic Mania dans le dossier décompressé.',
      'Lancez l’exécutable. Vos sauvegardes PC peuvent être copiées dans le même dossier.',
    ],
  },

  // ───────── Avec votre ROM (consoles Nintendo) ─────────
  {
    id: 'soh', game: 'The Legend of Zelda: Ocarina of Time', original: 'Nintendo 64 · 1998',
    project: 'Ship of Harkinian', kind: 'Décompilation → portage PC',
    desc: 'Portage PC natif issu de la décompilation : 60 images/s et plus, écran large, randomizer, mods et textures HD.',
    needs: 'rom', needsText: 'Une ROM compatible de votre Ocarina of Time (vérifiable sur ship.equipment).',
    download: 'https://github.com/HarbourMasters/Shipwright/releases/latest', site: 'https://www.shipofharkinian.com/',
    code: ['HarbourMasters/Shipwright'], platforms: ['Windows', 'Linux', 'macOS'],
    steps: [
      'Vérifiez que votre ROM est prise en charge sur https://ship.equipment/.',
      'Téléchargez la dernière version pour votre système et décompressez-la.',
      'Lancez Ship of Harkinian (`soh.exe` sous Windows) et sélectionnez votre ROM quand il la demande : les ressources sont extraites dans `oot.o2r`, puis le jeu démarre.',
    ],
  },
  {
    id: '2ship', game: 'The Legend of Zelda: Majora’s Mask', original: 'Nintendo 64 · 2000',
    project: '2 Ship 2 Harkinian', kind: 'Décompilation → portage PC',
    desc: 'L’équivalent de Ship of Harkinian pour Majora’s Mask : portage PC natif, améliorations et mods.',
    needs: 'rom', needsText: 'Une ROM compatible de votre Majora’s Mask (vérifiable sur 2ship.equipment).',
    download: 'https://github.com/2ship2harkinian/2ship2harkinian/releases/latest',
    code: ['2ship2harkinian/2ship2harkinian'], platforms: ['Windows', 'Linux', 'macOS'],
    steps: [
      'Vérifiez que votre ROM est prise en charge sur https://2ship.equipment/.',
      'Téléchargez la dernière version pour votre système et décompressez-la.',
      'Lancez le jeu et sélectionnez votre ROM quand il la demande.',
    ],
  },
  {
    id: 'zelda64recomp', game: 'The Legend of Zelda: Majora’s Mask', original: 'Nintendo 64 · 2000',
    project: 'Zelda64Recomp', kind: 'Recompilation statique',
    desc: 'Le code N64 recompilé automatiquement en programme PC : latence minimale, n’importe quelle fréquence d’images, ray tracing, écran large.',
    needs: 'rom', needsText: 'Votre ROM de Majora’s Mask, version N64 américaine (US) uniquement.',
    download: 'https://github.com/Zelda64Recomp/Zelda64Recomp/releases/latest',
    code: ['Zelda64Recomp/Zelda64Recomp'], platforms: ['Windows', 'Linux', 'macOS'],
    steps: [
      'Téléchargez la dernière version pour votre système et décompressez-la.',
      'Lancez `Zelda64Recompiled` et indiquez votre ROM US de Majora’s Mask dans le menu principal (les formats autres que .z64 sont convertis automatiquement).',
      'Le jeu charge ses ressources directement depuis la ROM : aucune extraction à faire.',
    ],
  },
  {
    id: 'starship', game: 'Star Fox 64', original: 'Nintendo 64 · 1997',
    project: 'Starship', kind: 'Décompilation → portage PC',
    desc: 'Portage PC natif de Star Fox 64 issu de sa décompilation, avec améliorations graphiques et mods.',
    needs: 'rom', needsText: 'Votre ROM US (1.0 ou 1.1) au format .z64.',
    download: 'https://github.com/HarbourMasters/Starship/releases/latest',
    code: ['HarbourMasters/Starship'], platforms: ['Windows', 'Linux', 'Switch'],
    steps: [
      'Votre ROM doit être la version US 1.0 ou 1.1, au format .z64 (le README indique comment convertir une ROM .n64).',
      'Décompressez l’archive dans un dossier de votre choix.',
      'Lancez `starship.exe` et sélectionnez votre ROM : le fichier `sf64.o2r` est généré, puis le jeu démarre.',
    ],
  },
  {
    id: 'spaghettikart', game: 'Mario Kart 64', original: 'Nintendo 64 · 1996',
    project: 'SpaghettiKart', kind: 'Décompilation → portage PC',
    desc: 'Portage PC natif de Mario Kart 64 : haute résolution, écran large, circuits personnalisés.',
    needs: 'rom', needsText: 'Votre ROM US au format .z64 (seule version prise en charge).',
    download: 'https://github.com/HarbourMasters/SpaghettiKart/releases/latest',
    code: ['HarbourMasters/SpaghettiKart'], platforms: ['Windows', 'Linux', 'macOS'],
    steps: [
      'Votre ROM doit être la version US, au format .z64.',
      'Décompressez l’archive dans un dossier de votre choix.',
      'Lancez `Spaghettify.exe` (ou l’AppImage sous Linux) et sélectionnez votre ROM : le fichier `mk64.o2r` est généré, puis le jeu démarre.',
    ],
  },
  {
    id: 'sm64coopdx', game: 'Super Mario 64', original: 'Nintendo 64 · 1996',
    project: 'sm64coopdx', kind: 'Décompilation → portage PC',
    desc: 'Portage PC issu de la décompilation de Super Mario 64, jouable à plusieurs en ligne, avec une grande scène de mods en Lua.',
    needs: 'rom', needsText: 'Votre ROM US de Super Mario 64 au format .z64.',
    download: 'https://github.com/coop-deluxe/sm64coopdx/releases/latest',
    code: ['coop-deluxe/sm64coopdx'], platforms: ['Windows', 'Linux', 'macOS'],
    steps: [
      'Téléchargez l’archive de votre système (`sm64coopdx_Windows.zip`…) et décompressez-la.',
      'Lancez sm64coopdx et fournissez votre ROM US de Super Mario 64 quand le jeu la demande.',
      'Pour jouer en ligne : consultez la page « Hosting and joining » du wiki du projet.',
    ],
  },
  {
    id: 'perfect-dark', game: 'Perfect Dark', original: 'Nintendo 64 · 2000',
    project: 'Perfect Dark PC port', kind: 'Décompilation → portage PC',
    desc: 'Le FPS de Rare porté sur PC grâce à sa décompilation : souris et clavier, haute résolution, 60 images/s.',
    needs: 'rom', needsText: 'Votre ROM de Perfect Dark (NTSC recommandée ; PAL et JPN possibles).',
    download: 'https://github.com/perfect-dark-pc-port/perfect_dark/releases/latest',
    code: ['perfect-dark-pc-port/perfect_dark'], platforms: ['Windows', 'Linux', 'macOS', 'Switch'],
    steps: [
      'Téléchargez la dernière version automatique pour votre système et décompressez-la.',
      'Placez votre ROM NTSC, renommée `pd.ntsc-final.z64`, dans le dossier `data` (PAL : `pd.pal-final.z64`, JPN : `pd.jpn-final.z64`).',
      'Lancez l’exécutable qui correspond à la version de votre ROM.',
    ],
  },
  {
    id: 'zelda3', game: 'The Legend of Zelda: A Link to the Past', original: 'Super Nintendo · 1991',
    project: 'zelda3', kind: 'Code réécrit en C',
    desc: 'Le jeu entier réécrit en C à partir de son code SNES : écran large, plus de pixels, correctifs, et il reste fidèle à l’image près.',
    needs: 'rom', needsText: 'Votre ROM USA, nommée `zelda3.sfc` (seulement pour extraire les ressources).',
    download: 'https://github.com/snesrev/zelda3/releases/latest',
    code: ['snesrev/zelda3'], platforms: ['À compiler : Windows, Linux, macOS'],
    steps: [
      'Il faut compiler le jeu soi-même. Sous Windows : installez Python en cochant « Add to PATH ».',
      'Téléchargez le code (« Code → Download ZIP ») et décompressez-le, puis placez votre ROM USA nommée `zelda3.sfc` dans le dossier.',
      'Téléchargez TCC et SDL2 (liens dans le README) et décompressez-les dans le sous-dossier `third-party`.',
      'Double-cliquez sur `extract_assets.bat` : il crée `zelda3_assets.dat` (la ROM n’est ensuite plus nécessaire), puis terminez la compilation comme indiqué dans le README.',
    ],
  },
  {
    id: 'super-metroid', game: 'Super Metroid', original: 'Super Nintendo · 1994',
    project: 'sm', kind: 'Code réécrit en C',
    desc: 'Même approche que zelda3, par la même équipe, appliquée à Super Metroid. Projet encore expérimental.',
    needs: 'rom', needsText: 'Votre ROM, nommée `sm.smc`.',
    code: ['snesrev/sm'], platforms: ['À compiler'],
    steps: [
      'Projet expérimental : il faut compiler soi-même, en suivant le README.',
      'Placez votre ROM nommée `sm.smc` à la racine du dossier, puis lancez le programme compilé.',
    ],
  },
];
