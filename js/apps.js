/* NEXUS — apps rétro-ingéniérées utilisables (onglet Reverse Apps → Utiliser).
 *
 * Uniquement des liens officiels (site ou dépôt du projet). Ces projets réimplémentent un protocole,
 * un pilote ou un format fermé pour qu'il fonctionne ailleurs ou sans le logiciel du fabricant.
 *
 *   domain  'device'  appareils : pilotes, firmwares et applis compagnons
 *           'service' services et protocoles : clients non officiels, streaming
 *           'system'  systèmes : faire tourner Windows ou macOS là où ils ne vont pas
 *           'file'    formats de fichiers fermés
 *   needs   'free'    rien à fournir
 *           'device'  votre appareil (montre, routeur, Mac…)
 *           'account' votre compte ou abonnement au service
 *   open    utilisable directement dans le navigateur
 *   steps   étapes d'installation ; `texte` entre accents graves = commande ou nom de fichier
 *   warn    avertissement affiché sur la fiche (root, garantie…)
 *   code    dépôts : 'propriétaire/projet' sur GitHub, ou adresse complète (Codeberg, GitLab…)
 */
window.NEXUS_APPS = [
  // ───────── Utilisables dans le navigateur ─────────
  {
    id: 'photopea', name: 'Photopea', original: 'Photoshop (PSD) · Illustrator · XD · Sketch',
    domain: 'file', kind: 'Format PSD reconstitué',
    desc: 'Éditeur d’images dans le navigateur qui ouvre et enregistre les fichiers Photoshop avec leurs calques, styles et objets dynamiques. Son auteur a reconstitué un format en grande partie non documenté.',
    needs: 'free', needsText: 'Rien : gratuit avec publicité, sans compte. Les fichiers sont traités sur votre ordinateur.',
    open: 'https://www.photopea.com/',
    platforms: ['Navigateur'],
    steps: [
      'Cliquez sur « Ouvrir en ligne » : l’éditeur se lance dans le navigateur, sans rien installer.',
      'Glissez un fichier `.psd`, `.ai`, `.xd`, `.sketch` ou une image dans la fenêtre.',
      'Enregistrez en PSD pour continuer dans Photoshop, ou exportez en PNG, JPG, SVG…',
    ],
  },
  {
    id: 'ruffle', name: 'Ruffle', original: 'Adobe Flash Player · fichiers .swf',
    domain: 'file', kind: 'Lecteur réimplémenté',
    desc: 'Émulateur de Flash Player écrit en Rust : les animations et jeux Flash revivent dans les navigateurs actuels, sans les failles de l’ancien plugin. Utilisé par Internet Archive pour ses collections Flash.',
    needs: 'free', needsText: 'Rien : ouvrez un fichier `.swf` ou visitez un site Flash avec l’extension.',
    open: 'https://ruffle.rs/demo/',
    download: 'https://ruffle.rs/downloads',
    site: 'https://ruffle.rs/',
    code: ['ruffle-rs/ruffle'], platforms: ['Navigateur', 'Windows', 'macOS', 'Linux'],
    steps: [
      'En ligne : « Ouvrir en ligne » lit un fichier `.swf` de votre ordinateur ou une adresse.',
      'Pour les sites qui utilisent encore Flash : installez l’extension Ruffle pour Chrome, Firefox, Edge ou Safari (page « Télécharger »).',
      'Hors ligne : téléchargez la version de bureau et ouvrez vos fichiers `.swf`.',
    ],
  },
  {
    id: 'tasmota', name: 'Tasmota', original: 'Prises, ampoules, interrupteurs · puces ESP',
    domain: 'device', kind: 'Firmware libre',
    desc: 'Firmware libre pour les prises, ampoules, interrupteurs et capteurs connectés à puce ESP : pilotage local par une page web, MQTT ou Home Assistant, sans cloud ni appli du fabricant.',
    needs: 'device', needsText: 'Un appareil à puce ESP8266 ou ESP32 (beaucoup de modèles récents utilisent d’autres puces) et, pour le premier flash, un adaptateur USB-série.',
    open: 'https://tasmota.github.io/install/',
    site: 'https://tasmota.github.io/docs/',
    code: ['arendst/Tasmota'], platforms: ['Navigateur', 'ESP8266', 'ESP32'],
    warn: 'Le premier flash demande souvent d’ouvrir l’appareil pour y brancher un adaptateur USB-série : toujours débranché du secteur.',
    steps: [
      'Vérifiez dans la documentation que votre appareil a bien une puce ESP8266 ou ESP32.',
      'Reliez l’appareil (ou son module ESP) à l’ordinateur avec l’adaptateur USB-série, en mode flash.',
      'Ouvrez l’installateur en ligne dans Chrome ou Edge sur ordinateur, cliquez sur « Connect » puis installez la variante proposée.',
      'Donnez-lui votre Wi-Fi (l’installateur le propose, sinon via le point d’accès « tasmota-… » de l’appareil), puis ouvrez son adresse IP.',
    ],
  },

  // ───────── Appareils ─────────
  {
    id: 'gadgetbridge', name: 'Gadgetbridge', original: 'Montres et bracelets · Amazfit, Xiaomi, Huawei, Garmin…',
    domain: 'device', kind: 'Protocoles Bluetooth rétro-ingéniérés',
    desc: 'Utilisez votre montre ou bracelet connecté sans l’appli du fabricant ni son cloud : notifications, pas, sommeil, fréquence cardiaque… tout reste sur le téléphone.',
    needs: 'device', needsText: 'Une montre ou un bracelet de la liste du site. Certains modèles (Amazfit, Xiaomi récents) demandent une clé d’appairage, récupérée une fois.',
    download: 'https://f-droid.org/packages/nodomain.freeyourgadget.gadgetbridge/',
    site: 'https://gadgetbridge.org/',
    code: ['https://codeberg.org/Freeyourgadget/Gadgetbridge'], platforms: ['Android'],
    steps: [
      'Installez Gadgetbridge depuis F-Droid (il n’est pas sur le Google Play Store).',
      'Sur le site, ouvrez la page de votre modèle : elle indique s’il faut une clé d’authentification et comment l’obtenir.',
      'Déconnectez la montre de l’appli officielle : deux applis ne peuvent pas la piloter en même temps.',
      'Dans Gadgetbridge, touchez « + », choisissez votre appareil et suivez l’appairage.',
    ],
  },
  {
    id: 'librepods', name: 'LibrePods', original: 'AirPods · fonctions réservées à l’iPhone',
    domain: 'device', kind: 'Protocole Apple rétro-ingéniéré',
    desc: 'Les fonctions des AirPods réservées aux appareils Apple, sur Android et Linux : contrôle du bruit, détection d’oreille, batterie précise, gestes de la tête, détection de conversation.',
    needs: 'device', needsText: 'Vos AirPods (les fonctions disponibles dépendent du modèle).',
    download: 'https://github.com/librepods-org/librepods/releases/latest',
    code: ['librepods-org/librepods'], platforms: ['Android', 'Linux'],
    warn: 'Sur la plupart des téléphones Android, il faut le root et Xposed (bug du Bluetooth d’Android, corrigé dans Android 17). Sans root : Pixel sous Android 16 QPR3, ColorOS/OxygenOS 16 et realme UI 7.',
    steps: [
      'Pixel sous Android 16 QPR3, ColorOS/OxygenOS 16 ou realme UI 7 : installez LibrePods depuis le Google Play Store, sans root.',
      'Autres téléphones : rootez-le, installez Xposed, puis l’APK de la page « Télécharger » et activez le module LibrePods.',
      'Sous Linux : suivez le README du dossier `linux` du dépôt.',
      'Appairez les AirPods en Bluetooth, puis ouvrez LibrePods pour régler le bruit et les gestes.',
    ],
  },
  {
    id: 'openrgb', name: 'OpenRGB', original: 'Remplace iCUE, Armoury Crate, Mystic Light, Synapse…',
    domain: 'device', kind: 'Protocoles RGB rétro-ingéniérés',
    desc: 'Un seul logiciel pour l’éclairage RGB de toutes les marques (carte mère, RAM, carte graphique, clavier, souris, ventilateurs), à la place des utilitaires lourds des fabricants.',
    needs: 'device', needsText: 'Des composants ou périphériques RGB compatibles (liste sur le site).',
    download: 'https://openrgb.org/releases.html',
    site: 'https://openrgb.org/',
    code: ['https://gitlab.com/CalcProgrammer1/OpenRGB'], platforms: ['Windows', 'macOS', 'Linux'],
    steps: [
      'Téléchargez la version de votre système sur la page des versions.',
      'Fermez ou désinstallez les logiciels RGB des fabricants : ils se disputent l’accès aux appareils.',
      'Lancez OpenRGB. Sous Windows, la RAM et la carte mère peuvent demander les droits administrateur ; sous Linux, installez les règles udev (voir la documentation).',
      'Réglez couleurs et effets par appareil, puis enregistrez un profil.',
    ],
  },
  {
    id: 'opentabletdriver', name: 'OpenTabletDriver', original: 'Tablettes graphiques · Wacom, Huion, XP-Pen…',
    domain: 'device', kind: 'Pilote réécrit',
    desc: 'Pilote libre pour des centaines de tablettes graphiques, identique sur les trois systèmes : faible latence, zone active réglable, filtres. Très apprécié des joueurs d’osu!.',
    needs: 'device', needsText: 'Une tablette graphique compatible (liste sur le site).',
    download: 'https://github.com/OpenTabletDriver/OpenTabletDriver/releases/latest',
    site: 'https://opentabletdriver.net/',
    code: ['OpenTabletDriver/OpenTabletDriver'], platforms: ['Windows', 'macOS', 'Linux'],
    steps: [
      'Désinstallez d’abord le pilote du fabricant : les deux pilotes entrent en conflit.',
      'Téléchargez l’archive de votre système (`OpenTabletDriver-…_win-x64.zip` sous Windows), décompressez-la et lancez OpenTabletDriver.',
      'Branchez la tablette : elle est détectée. Réglez la zone active et les boutons, puis enregistrez (« Save »).',
    ],
  },
  {
    id: 'solaar', name: 'Solaar', original: 'Claviers et souris Logitech · sous Linux',
    domain: 'device', kind: 'Protocole HID++ rétro-ingéniéré',
    desc: 'Gère les claviers et souris Logitech sous Linux : appairage avec les récepteurs Unifying, Bolt et Lightspeed, niveau de batterie, boutons, molette, sensibilité.',
    needs: 'device', needsText: 'Un clavier ou une souris Logitech (récepteur Unifying, Bolt, Lightspeed ou Bluetooth).',
    site: 'https://pwr-solaar.github.io/Solaar/',
    code: ['pwr-Solaar/Solaar'], platforms: ['Linux'],
    steps: [
      'Installez le paquet de votre distribution : `sudo apt install solaar` (Debian, Ubuntu) ou `sudo dnf install solaar` (Fedora).',
      'Lancez Solaar : il se place dans la zone de notification et affiche vos appareils Logitech.',
      'Pour un nouvel appareil, sélectionnez le récepteur puis « Pair new device ».',
    ],
  },
  {
    id: 'openrazer', name: 'OpenRazer', original: 'Périphériques Razer · sous Linux',
    domain: 'device', kind: 'Pilote rétro-ingéniéré',
    desc: 'Pilote et service pour les périphériques Razer sous Linux : éclairage, sensibilité, fréquence d’interrogation, batterie. Se règle avec Polychromatic ou RazerGenie.',
    needs: 'device', needsText: 'Un périphérique Razer (clavier, souris, casque, tapis…).',
    site: 'https://openrazer.github.io/',
    code: ['openrazer/openrazer'], platforms: ['Linux'],
    steps: [
      'Suivez la page d’installation de votre distribution sur le site officiel (Ubuntu, Fedora, Arch, openSUSE…).',
      'Ajoutez votre utilisateur au groupe `plugdev` comme indiqué, puis redémarrez.',
      'Installez une interface graphique, Polychromatic ou RazerGenie, pour régler l’éclairage et la souris.',
    ],
  },
  {
    id: 'liquidctl', name: 'liquidctl', original: 'Watercoolings AIO, ventilateurs, alimentations',
    domain: 'device', kind: 'Protocoles USB rétro-ingéniérés',
    desc: 'Contrôle en ligne de commande des watercoolings, contrôleurs de ventilateurs, alimentations et éclairages (Corsair, NZXT, Lian Li…) : vitesses, profils, températures.',
    needs: 'device', needsText: 'Un watercooling, un contrôleur de ventilateurs ou une alimentation de la liste du README.',
    code: ['liquidctl/liquidctl'], platforms: ['Windows', 'macOS', 'Linux'],
    steps: [
      'Sous Linux : installez le paquet `liquidctl` de votre distribution. Ailleurs : `pip install liquidctl` (Python requis, et libusb sous Windows).',
      'Dans un terminal, `liquidctl list` affiche les appareils détectés et `liquidctl initialize all` les prépare.',
      'Exemple : `liquidctl set pump speed 70` règle la pompe à 70 %. Le README détaille les réglages de chaque appareil.',
    ],
  },
  {
    id: 'valetudo', name: 'Valetudo', original: 'Robots aspirateurs · Dreame, Roborock, Xiaomi…',
    domain: 'device', kind: 'Cloud remplacé',
    desc: 'Votre robot aspirateur sans cloud ni compte : une interface web locale avec la carte, les zones et les horaires, et l’intégration à Home Assistant par MQTT.',
    needs: 'device', needsText: 'Un robot de la liste des modèles pris en charge, à rooter.',
    site: 'https://valetudo.cloud/',
    code: ['Hypfer/Valetudo'], platforms: ['Robot aspirateur'],
    warn: 'Il faut rooter le robot, souvent en le démontant : risque de le rendre inutilisable et perte probable de la garantie. Lisez le guide du débutant avant de commencer (ou d’acheter).',
    steps: [
      'Lisez le « newcomer guide » sur le site et vérifiez que votre modèle est dans la liste des robots pris en charge.',
      'Rootez le robot avec la méthode indiquée pour votre modèle.',
      'Installez Valetudo sur le robot, reliez-le à votre Wi-Fi, puis ouvrez son adresse IP dans un navigateur.',
    ],
  },
  {
    id: 'openwrt', name: 'OpenWrt', original: 'Routeurs et bornes Wi-Fi · firmware d’origine',
    domain: 'device', kind: 'Firmware libre',
    desc: 'Système Linux libre pour des centaines de routeurs : mises à jour de sécurité bien après l’abandon du fabricant, VPN, blocage des pubs, réseau invité, qualité de service.',
    needs: 'device', needsText: 'Un routeur pris en charge : vérifiez le modèle exact et sa révision matérielle.',
    download: 'https://firmware-selector.openwrt.org/',
    site: 'https://openwrt.org/',
    code: ['openwrt/openwrt'], platforms: ['Routeurs Wi-Fi'],
    warn: 'Un flash raté peut bloquer le routeur : suivez la page de votre modèle exact dans la table du matériel (« Table of Hardware »).',
    steps: [
      'Cherchez votre modèle dans le sélecteur de firmware (« Télécharger ») et lisez sa page dans la table du matériel.',
      'Téléchargez l’image « factory » pour une première installation (« sysupgrade » si OpenWrt est déjà installé).',
      'Installez-la depuis la page de mise à jour du firmware d’origine, ou avec la méthode décrite pour votre modèle.',
      'Ouvrez ensuite `http://192.168.1.1` : l’interface LuCI permet de tout configurer.',
    ],
  },
  {
    id: 'rockbox', name: 'Rockbox', original: 'Baladeurs audio · iPod, Sansa, iRiver…',
    domain: 'device', kind: 'Firmware libre',
    desc: 'Firmware libre pour baladeurs audio : FLAC et Opus, égaliseur, lecture sans blanc entre les pistes, thèmes, et même des jeux. Redonne vie aux iPod et Sansa.',
    needs: 'device', needsText: 'Un baladeur de la liste de la page de téléchargement.',
    download: 'https://www.rockbox.org/download/',
    site: 'https://www.rockbox.org/',
    code: ['Rockbox/rockbox'], platforms: ['Baladeurs audio'],
    steps: [
      'Vérifiez que votre baladeur figure sur la page de téléchargement.',
      'Téléchargez Rockbox Utility (Windows, macOS, Linux) et branchez le baladeur.',
      'Lancez l’installation complète : Rockbox Utility installe le chargeur de démarrage puis Rockbox.',
      'Débranchez et redémarrez le baladeur : Rockbox se lance, le firmware d’origine reste en général accessible.',
    ],
  },

  // ───────── Services et protocoles ─────────
  {
    id: 'newpipe', name: 'NewPipe', original: 'YouTube · SoundCloud · PeerTube · Bandcamp',
    domain: 'service', kind: 'Client non officiel',
    desc: 'Client YouTube léger et libre pour Android : sans publicité ni compte Google, lecture en arrière-plan, fenêtre flottante, téléchargement des vidéos et de l’audio.',
    needs: 'free', needsText: 'Rien : pas de compte Google.',
    download: 'https://github.com/TeamNewPipe/NewPipe/releases/latest',
    site: 'https://newpipe.net/',
    code: ['TeamNewPipe/NewPipe'], platforms: ['Android'],
    warn: 'Quand YouTube modifie son site, NewPipe peut cesser de fonctionner quelques jours, le temps d’une mise à jour.',
    steps: [
      'Installez NewPipe depuis F-Droid, ou l’APK de la page « Télécharger » (autorisez l’installation si Android le demande).',
      'Vos abonnements YouTube s’importent depuis un export Google Takeout (onglet Abonnements → Importer).',
    ],
  },
  {
    id: 'freetube', name: 'FreeTube', original: 'YouTube · sur ordinateur',
    domain: 'service', kind: 'Client non officiel',
    desc: 'YouTube sur ordinateur sans publicité ni pistage : abonnements, historique et listes gardés sur votre machine, sans compte Google.',
    needs: 'free', needsText: 'Rien : pas de compte Google.',
    download: 'https://github.com/FreeTubeApp/FreeTube/releases',
    site: 'https://freetubeapp.io/',
    code: ['FreeTubeApp/FreeTube'], platforms: ['Windows', 'macOS', 'Linux'],
    steps: [
      'Téléchargez l’installateur de votre système sur la page des versions.',
      'Importez vos abonnements YouTube depuis un export Google Takeout : Paramètres → Données → Importer les abonnements.',
    ],
  },
  {
    id: 'aurora-store', name: 'Aurora Store', original: 'Google Play Store',
    domain: 'service', kind: 'Client non officiel',
    desc: 'Client libre du Google Play Store : installez et mettez à jour les applis du Play Store sans les services Google, avec un compte anonyme, et voyez leurs pisteurs.',
    needs: 'free', needsText: 'Rien : un compte anonyme suffit pour les applis gratuites. Les applis achetées demandent votre compte Google.',
    download: 'https://f-droid.org/packages/com.aurora.store/',
    site: 'https://auroraoss.com/',
    code: ['https://gitlab.com/AuroraOSS/AuroraStore'], platforms: ['Android'],
    warn: 'Se connecter avec son propre compte Google dans une appli non officielle peut entraîner un blocage du compte : préférez le compte anonyme.',
    steps: [
      'Installez Aurora Store depuis F-Droid.',
      'Au premier lancement, choisissez la connexion anonyme.',
      'Cherchez une appli et installez-la comme sur le Play Store : Aurora signale aussi ses mises à jour.',
    ],
  },
  {
    id: 'moonlight', name: 'Moonlight', original: 'NVIDIA GameStream · Sunshine',
    domain: 'service', kind: 'Protocole rétro-ingéniéré',
    desc: 'Jouez aux jeux de votre PC depuis un autre écran (portable, téléphone, TV, Steam Deck), chez vous ou à distance, jusqu’en 4K à 120 images/s.',
    needs: 'device', needsText: 'Un PC de jeu avec Sunshine (gratuit, toutes cartes graphiques) : NVIDIA a abandonné son propre serveur GameStream.',
    download: 'https://github.com/moonlight-stream/moonlight-qt/releases/latest',
    site: 'https://moonlight-stream.org/',
    code: ['moonlight-stream/moonlight-qt', 'LizardByte/Sunshine'],
    platforms: ['Windows', 'macOS', 'Linux', 'Android', 'iOS', 'Apple TV', 'Raspberry Pi'],
    steps: [
      'Sur le PC de jeu : installez Sunshine, ouvrez son interface web et créez un identifiant.',
      'Sur l’autre appareil : installez Moonlight (le site liste toutes les versions et boutiques).',
      'Moonlight détecte le PC sur le réseau local : saisissez le code PIN qu’il affiche dans l’onglet « PIN » de Sunshine.',
      'Choisissez « Desktop » ou un jeu : le streaming démarre.',
    ],
  },
  {
    id: 'raspotify', name: 'Raspotify', original: 'Spotify Connect · librespot',
    domain: 'service', kind: 'Protocole rétro-ingéniéré',
    desc: 'Transforme un Raspberry Pi branché à une enceinte ou une chaîne hi-fi en haut-parleur Spotify Connect, qui apparaît dans la liste des appareils de l’appli Spotify.',
    needs: 'account', needsText: 'Un abonnement Spotify Premium et un Raspberry Pi (sauf Pi 1 et Pi Zero de 1re génération) ou un ordinateur sous Debian.',
    site: 'https://dtcooper.github.io/raspotify/',
    code: ['dtcooper/raspotify', 'librespot-org/librespot'], platforms: ['Raspberry Pi', 'Linux'],
    steps: [
      'Sur le Raspberry Pi (Raspberry Pi OS), ouvrez un terminal et lancez `curl -sL https://dtcooper.github.io/raspotify/install.sh | sh`.',
      'Ouvrez Spotify sur votre téléphone : l’appareil « raspotify » apparaît dans la liste des appareils.',
      'Pour changer son nom ou la qualité audio, modifiez `/etc/raspotify/conf` puis redémarrez le service (voir le wiki).',
    ],
  },

  // ───────── Systèmes ─────────
  {
    id: 'wine', name: 'Wine', original: 'Logiciels Windows · sous Linux et macOS',
    domain: 'system', kind: 'API Windows réimplémentée',
    desc: 'Fait tourner des logiciels Windows sous Linux et macOS en réimplémentant l’API de Windows, sans machine virtuelle ni licence Windows. C’est aussi le cœur de Proton, qui fait tourner les jeux Windows sur Steam Deck.',
    needs: 'free', needsText: 'Rien d’autre que les logiciels Windows que vous voulez lancer.',
    download: 'https://gitlab.winehq.org/wine/wine/-/wikis/Download',
    site: 'https://www.winehq.org/',
    code: ['https://gitlab.winehq.org/wine/wine'], platforms: ['Linux', 'macOS'],
    steps: [
      'Sous Linux : installez Wine avec votre distribution (`sudo apt install wine` sous Debian, Ubuntu) ou les paquets officiels de WineHQ (« Télécharger »).',
      'Sous macOS : utilisez les paquets de la communauté listés sur la page « Télécharger », ou CrossOver, la version commerciale.',
      'Lancez un programme avec `wine programme.exe`, ou double-cliquez sur le fichier.',
      'Avant d’installer un logiciel, consultez sa fiche dans l’AppDB de WineHQ : elle indique ce qui fonctionne.',
    ],
  },
  {
    id: 'reactos', name: 'ReactOS', original: 'Compatible pilotes et logiciels Windows',
    domain: 'system', kind: 'Système réécrit',
    desc: 'Système d’exploitation libre écrit de zéro pour faire tourner les logiciels et pilotes Windows. Encore en version alpha : à essayer dans une machine virtuelle.',
    needs: 'free', needsText: 'Rien : une machine virtuelle (VirtualBox, VMware, QEMU) suffit pour l’essayer.',
    download: 'https://reactos.org/download/',
    site: 'https://reactos.org/',
    code: ['reactos/reactos'], platforms: ['PC', 'Machine virtuelle'],
    warn: 'Version alpha : ne l’installez pas sur un ordinateur qui contient des données importantes.',
    steps: [
      'Téléchargez l’image « Boot CD » (installation) ou « Live CD » (essai sans installer).',
      'Créez une machine virtuelle dans VirtualBox, VMware ou QEMU et démarrez-la sur l’image ISO.',
      'Le Live CD démarre directement ; le Boot CD installe ReactOS sur le disque virtuel.',
    ],
  },
  {
    id: 'asahi-linux', name: 'Asahi Linux', original: 'Mac Apple Silicon · M1 et M2',
    domain: 'system', kind: 'Matériel Apple rétro-ingéniéré',
    desc: 'Linux sur les Mac Apple Silicon, avec des pilotes écrits en rétro-ingéniérant le matériel d’Apple, dont un pilote graphique OpenGL et Vulkan conforme. Distribution officielle : Fedora Asahi Remix.',
    needs: 'device', needsText: 'Un Mac M1 ou M2 (MacBook, Mac mini, iMac, Mac Studio, Mac Pro) et de l’espace libre. Les puces M3 et suivantes ne sont pas encore prises en charge.',
    download: 'https://asahilinux.org/fedora/',
    site: 'https://asahilinux.org/',
    code: ['https://github.com/AsahiLinux'], platforms: ['Mac M1 / M2'],
    warn: 'S’installe à côté de macOS, qu’il faut garder : c’est lui qui met à jour le firmware du Mac.',
    steps: [
      'Sous macOS, ouvrez le Terminal et lancez `curl https://alx.sh | sh`.',
      'L’installateur réduit la partition de macOS et installe Fedora Asahi Remix à côté : répondez à ses questions.',
      'Ensuite, maintenez le bouton d’alimentation au démarrage pour choisir entre macOS et Linux.',
    ],
  },
  {
    id: 'opencore-legacy-patcher', name: 'OpenCore Legacy Patcher', original: 'Mac Intel non mis à jour par Apple',
    domain: 'system', kind: 'Correctifs rétro-ingéniérés',
    desc: 'Installe les versions récentes de macOS (de Big Sur à Tahoe) sur les Mac Intel qu’Apple ne met plus à jour, avec les mises à jour automatiques et l’accélération graphique.',
    needs: 'device', needsText: 'Un Mac Intel (2008 ou plus récent) et une clé USB de 16 Go.',
    download: 'https://github.com/dortania/OpenCore-Legacy-Patcher/releases/latest',
    site: 'https://dortania.github.io/OpenCore-Legacy-Patcher/',
    code: ['dortania/OpenCore-Legacy-Patcher'], platforms: ['Mac Intel'],
    warn: 'Projet communautaire, sans soutien d’Apple : sauvegardez le Mac (Time Machine) avant de commencer.',
    steps: [
      'Sauvegardez le Mac, puis installez `OpenCore-Patcher.pkg` depuis « Télécharger ».',
      'Dans l’appli, « Create macOS Installer » prépare la clé USB, puis « Build and Install OpenCore ».',
      'Redémarrez en maintenant la touche Option (⌥), choisissez « EFI Boot », puis l’installateur de macOS.',
      'Une fois macOS installé, lancez « Post-Install Root Patch » pour réactiver le graphisme et le Wi-Fi.',
    ],
  },

  // ───────── Fichiers ─────────
  {
    id: 'libreoffice', name: 'LibreOffice', original: 'Word, Excel, PowerPoint, Publisher, Visio…',
    domain: 'file', kind: 'Formats de fichiers rétro-ingéniérés',
    desc: 'La suite bureautique libre ouvre les documents Microsoft Office, y compris les anciens formats binaires .doc, .xls et .ppt, mais aussi Publisher, Visio, CorelDRAW ou Pages, grâce au travail du Document Liberation Project.',
    needs: 'free', needsText: 'Rien.',
    download: 'https://www.libreoffice.org/download/download-libreoffice/',
    site: 'https://www.libreoffice.org/',
    code: ['LibreOffice/core'], platforms: ['Windows', 'macOS', 'Linux'],
    steps: [
      'Téléchargez LibreOffice pour votre système et installez-le.',
      'Ouvrez directement vos fichiers `.docx`, `.xlsx`, `.pptx`, `.doc`, `.pub`, `.vsd`, `.cdr`… : la conversion est automatique.',
      'Pour un destinataire sous Office, enregistrez au format Word, Excel ou PowerPoint quand LibreOffice le propose.',
    ],
  },
];
