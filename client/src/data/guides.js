// Contenu pedagogique des guides etape par etape.
// Statique cote client (c'est de la documentation) ; seules les checklists
// de fin d'etape sont persistees cote backend.
//
// Format d'une section : { title, blocks: [...] }
// Types de blocs : { type: 'text' | 'code' | 'note', ... }

export const GUIDES = {
  2: {
    title: 'Installation du serveur Samba AD DC',
    objective:
      "Installer et provisionner un contrôleur de domaine Active Directory avec Samba sur le serveur srvad (192.168.100.2).",
    prerequisites: [
      "Étape 1 terminée : la passerelle NAT route bien le réseau 192.168.100.0/24 vers Internet.",
      "Ubuntu Server 26.04 LTS installé sur la machine srvad avec un accès sudo.",
      "IP statique 192.168.100.2 configurée et accès Internet fonctionnel (pour apt).",
      "Nom de domaine choisi pour l'AD — ici lgnum.local (domaine interne, non routable).",
    ],
    sections: [
      {
        title: '1. Préparation du système',
        blocks: [
          {
            type: 'text',
            content:
              "Le contrôleur de domaine doit connaître son propre nom de façon stable : Kerberos et le DNS AD s'appuient sur le FQDN. On fixe donc le hostname et on l'inscrit dans /etc/hosts avant toute installation.",
          },
          {
            type: 'code',
            code: `sudo hostnamectl set-hostname srvad
sudo nano /etc/hosts`,
          },
          {
            type: 'text',
            content:
              "Dans /etc/hosts, la ligne doit faire pointer l'IP réelle du serveur vers le FQDN puis le nom court (dans cet ordre — c'est ce que Samba lit pour se résoudre lui-même) :",
          },
          { type: 'code', lang: 'conf', code: `127.0.0.1       localhost
192.168.100.2   srvad.lgnum.local   srvad` },
          {
            type: 'note',
            content:
              "Ne laissez pas srvad associé à 127.0.1.1 (ligne par défaut d'Ubuntu) : le provisionnement échouerait ou publierait une mauvaise adresse dans le DNS du domaine.",
          },
          { type: 'text', content: 'On met ensuite le système à jour :' },
          { type: 'code', code: `sudo apt update && sudo apt upgrade -y` },
        ],
      },
      {
        title: '2. Installation des paquets',
        blocks: [
          {
            type: 'text',
            content:
              "samba fournit le service AD DC lui-même. krb5-config / krb5-user apportent le client Kerberos (l'authentification AD repose entièrement dessus). winbind fait le lien entre les identités du domaine et les utilisateurs/groupes Unix. smbclient sert à tester les partages depuis le serveur.",
          },
          {
            type: 'code',
            code: `sudo apt install -y samba samba-ad-dc krb5-config krb5-user winbind smbclient`,
          },
          {
            type: 'text',
            content:
              "Pendant l'installation, krb5-config pose trois questions interactives. Répondez ainsi :",
          },
          {
            type: 'note',
            content:
              'Royaume Kerberos par défaut → LGNUM.LOCAL (en majuscules, convention Kerberos)\nServeur Kerberos → srvad.lgnum.local\nServeur administratif Kerberos → srvad.lgnum.local',
          },
          {
            type: 'note',
            content:
              'Le realm LGNUM.LOCAL se saisit en MAJUSCULES : par convention Kerberos, le realm est la version majuscule du domaine. Cette valeur sera de toute façon réécrite par le provisionnement.',
          },
        ],
      },
      {
        title: '3. Désactivation des services Samba classiques',
        blocks: [
          {
            type: 'text',
            content:
              "Un contrôleur de domaine tourne comme un service unique : samba-ad-dc. Les démons du mode « serveur de fichiers simple » (smbd, nmbd, winbind) entreraient en conflit avec lui sur les mêmes ports. On les arrête et on les désactive, puis on démasque samba-ad-dc qui est masqué par défaut à l'installation.",
          },
          {
            type: 'code',
            code: `sudo systemctl disable --now smbd nmbd winbind
sudo systemctl unmask samba-ad-dc`,
          },
        ],
      },
      {
        title: '4. Sauvegarde de la configuration par défaut',
        blocks: [
          {
            type: 'text',
            content:
              "Le provisionnement génère un smb.conf entièrement nouveau. Samba refuse de démarrer en mode DC si un ancien fichier traîne, on le met donc de côté (plutôt que de le supprimer, pour pouvoir y revenir).",
          },
          { type: 'code', code: `sudo mv /etc/samba/smb.conf /etc/samba/smb.conf.orig` },
        ],
      },
      {
        title: '5. Provisionnement du domaine',
        blocks: [
          {
            type: 'text',
            content:
              "C'est l'étape centrale : elle crée la base de l'annuaire, le realm Kerberos, le SYSVOL et le compte Administrator. Le mode interactif pose chaque question et affiche les valeurs par défaut.",
          },
          {
            type: 'code',
            code: `sudo samba-tool domain provision --use-rfc2307 --interactive`,
          },
          {
            type: 'text',
            content:
              "Réponses attendues : Realm = LGNUM.LOCAL, Domain = LGNUM, Server Role = dc, DNS backend = SAMBA_INTERNAL, DNS forwarder = 192.168.100.1 (la passerelle, pour résoudre les noms externes). L'option --use-rfc2307 ajoute les attributs POSIX (uid, gid, shell) aux objets de l'annuaire : indispensable pour que les postes Linux joints au domaine puissent mapper les comptes AD sur de vrais utilisateurs Unix.",
          },
          {
            type: 'note',
            content:
              "Le mot de passe Administrator doit respecter la politique de complexité AD (8 caractères minimum, majuscules, minuscules, chiffres). Notez-le dans KeePassXC immédiatement — il n'est pas récupérable.",
          },
        ],
      },
      {
        title: '6. Configuration de Kerberos',
        blocks: [
          {
            type: 'text',
            content:
              "Le provisionnement a généré un krb5.conf cohérent avec le domaine créé. On remplace le fichier système par celui-ci pour que les commandes Kerberos (kinit, klist) visent le bon KDC.",
          },
          {
            type: 'code',
            code: `sudo cp /var/lib/samba/private/krb5.conf /etc/krb5.conf`,
          },
        ],
      },
      {
        title: '7. Démarrage du service',
        blocks: [
          {
            type: 'text',
            content:
              "On démarre samba-ad-dc et on l'active au démarrage pour que le DC remonte automatiquement après un redémarrage du serveur.",
          },
          {
            type: 'code',
            code: `sudo systemctl enable --now samba-ad-dc
sudo systemctl status samba-ad-dc`,
          },
          {
            type: 'text',
            content: "Le statut doit afficher active (running). En cas d'échec, consultez le journal :",
          },
          { type: 'code', code: `sudo journalctl -u samba-ad-dc -n 50 --no-pager` },
        ],
      },
      {
        title: '8. Résolution du conflit DNS avec systemd-resolved',
        blocks: [
          {
            type: 'text',
            content: 'Objectif : libérer le port 53 en IPv4 pour que le DNS Samba puisse écouter.',
          },
          {
            type: 'text',
            content:
              "Ubuntu utilise systemd-resolved comme résolveur DNS local, qui occupe le port 53. Samba a besoin de ce port pour son propre service DNS intégré. Sans cette étape, le DNS Samba n'écoute qu'en IPv6 et les requêtes DNS échouent.",
          },
          { type: 'code', code: `sudo nano /etc/systemd/resolved.conf` },
          {
            type: 'note',
            content: 'Dans ce fichier, changez `#DNSStubListener=yes` en `DNSStubListener=no`.',
          },
          {
            type: 'code',
            code: `sudo rm /etc/resolv.conf
echo -e "nameserver 127.0.0.1\\nsearch lgnum.local" | sudo tee /etc/resolv.conf
sudo systemctl restart systemd-resolved
sudo systemctl restart samba-ad-dc`,
          },
          { type: 'text', content: 'Test de validation :' },
          { type: 'code', code: `sudo ss -tlnp | grep 53` },
          {
            type: 'note',
            content: 'On doit voir dns[master] sur 0.0.0.0:53.',
          },
        ],
      },
      {
        title: '9. Tests de validation',
        blocks: [
          {
            type: 'text',
            content:
              "Trois vérifications à faire dans l'ordre : le DNS publie-t-il les enregistrements du domaine, Kerberos délivre-t-il un ticket, et l'annuaire répond-il ?",
          },
          {
            type: 'text',
            content:
              "a) DNS — l'enregistrement SRV _ldap._tcp indique aux clients où trouver le contrôleur de domaine. C'est le mécanisme par lequel un poste découvre le DC.",
          },
          { type: 'code', code: `host -t SRV _ldap._tcp.lgnum.local. 127.0.0.1` },
          {
            type: 'note',
            content: 'Résultat attendu : _ldap._tcp.lgnum.local has SRV record 0 100 389 srvad.lgnum.local',
          },
          {
            type: 'text',
            content:
              "b) Kerberos — kinit demande un ticket TGT au KDC. S'il aboutit, l'authentification du domaine fonctionne. klist affiche le ticket obtenu et sa date d'expiration.",
          },
          { type: 'code', code: `kinit administrator@LGNUM.LOCAL
klist` },
          {
            type: 'note',
            content:
              "Le realm doit être saisi en MAJUSCULES. Une erreur « Clock skew too great » signifie que l'horloge du serveur dérive : ce sera réglé à l'étape 3 (NTP).",
          },
          { type: 'text', content: "c) Annuaire — on vérifie que le domaine répond et on liste les comptes créés :" },
          { type: 'code', code: `sudo samba-tool domain level show
sudo samba-tool user list` },
          {
            type: 'text',
            content:
              "d) Résolution DNS du domaine — on vérifie que l'enregistrement A du domaine pointe bien sur l'adresse du serveur :",
          },
          { type: 'code', code: `host -t A lgnum.local 127.0.0.1` },
          { type: 'note', content: 'Résultat attendu : lgnum.local has address 192.168.100.2' },
          {
            type: 'text',
            content:
              "e) Résolution via le resolver système — sans préciser le serveur, la requête doit aussi aboutir : c'est la preuve que le resolv.conf est correctement configuré.",
          },
          { type: 'code', code: `host lgnum.local` },
          { type: 'note', content: 'Doit également retourner 192.168.100.2.' },
          { type: 'text', content: 'f) Routage internet — on vérifie que la sortie internet fonctionne toujours après tous les changements :' },
          { type: 'code', code: `ping -c 2 1.1.1.1` },
        ],
      },
      {
        title: '10. Configuration du DNS local',
        blocks: [
          {
            type: 'text',
            content:
              "Le serveur doit interroger son propre service DNS (celui de Samba) pour résoudre les noms du domaine, sinon il ne se retrouve pas lui-même. On pointe donc le resolver sur 127.0.0.1 via Netplan.",
          },
          { type: 'code', code: `sudo nano /etc/netplan/00-installer-config.yaml` },
          {
            type: 'code',
            lang: 'yaml',
            code: `network:
  ethernets:
    eno1:
      addresses:
      - 192.168.100.2/24
      match:
        macaddress: 40:b0:34:1a:3e:4c
      nameservers:
        addresses:
        - 127.0.0.1
        search:
        - lgnum.local
      routes:
      - to: default
        via: 192.168.100.1
      set-name: eno1
  version: 2`,
          },
          {
            type: 'note',
            content:
              "Adaptez eno1 et l'adresse MAC au nom réel de l'interface (à récupérer avec `ip a`). Le champ search permet de résoudre les noms courts (srvad au lieu de srvad.lgnum.local).",
          },
          { type: 'code', code: `sudo netplan apply` },
          { type: 'text', content: 'Vérification finale — la résolution du domaine et le routage internet doivent fonctionner :' },
          { type: 'code', code: `host lgnum.local
ping -c 2 1.1.1.1` },
          {
            type: 'note',
            content:
              'host lgnum.local doit retourner lgnum.local has address 192.168.100.2, et le ping vers 1.1.1.1 doit passer (routage internet toujours fonctionnel).',
          },
        ],
      },
    ],
  },
  3: {
    title: 'NTP + durcissement serveur',
    objective:
      "Configurer la synchronisation horaire du contrôleur de domaine et sécuriser le serveur avec un firewall.",
    prerequisites: [
      'Étape 2 terminée : le serveur Samba AD DC est opérationnel.',
    ],
    sections: [
      {
        title: '1. Configuration du fuseau horaire',
        blocks: [
          {
            type: 'text',
            content: 'Objectif : passer le serveur en heure française.',
          },
          {
            type: 'code',
            code: `sudo timedatectl set-timezone Europe/Paris
timedatectl`,
          },
          {
            type: 'note',
            content: 'Résultat attendu : Time zone: Europe/Paris (CEST, +0200)',
          },
          {
            type: 'text',
            content:
              'Par défaut Ubuntu Server est en UTC. On le passe en Europe/Paris pour que les logs et les tickets Kerberos soient en heure locale.',
          },
        ],
      },
      {
        title: '2. Vérification de Chrony',
        blocks: [
          {
            type: 'text',
            content:
              "Objectif : vérifier que chrony est déjà installé et actif (c'est le cas par défaut sur Ubuntu 26.04).",
          },
          { type: 'code', code: `systemctl status chrony` },
          { type: 'note', content: 'Résultat attendu : active (running)' },
          {
            type: 'text',
            content:
              "chrony est le service NTP par défaut sur Ubuntu 26.04. Il remplace systemd-timesyncd. Il peut à la fois synchroniser l'horloge locale ET servir de serveur NTP pour les postes clients — c'est pour ça qu'il est préféré sur un DC.",
          },
        ],
      },
      {
        title: '3. Configuration de Chrony comme serveur NTP',
        blocks: [
          {
            type: 'text',
            content:
              'Objectif : autoriser les postes du réseau maquette à se synchroniser sur le DC.',
          },
          { type: 'code', code: `sudo nano /etc/chrony/chrony.conf` },
          { type: 'text', content: 'Ajouter à la fin du fichier :' },
          {
            type: 'code',
            lang: 'conf',
            code: `# Autoriser les postes du réseau maquette à se synchroniser sur ce serveur
allow 192.168.100.0/24

# Servir l'heure même si chrony n'est pas encore synchronisé (utile au boot)
local stratum 10`,
          },
          {
            type: 'code',
            code: `sudo systemctl restart chrony
chronyc sources -v`,
          },
          {
            type: 'note',
            content:
              'Résultat attendu : plusieurs lignes avec des serveurs NTP Ubuntu, une étoile * devant la meilleure source.',
          },
          {
            type: 'text',
            content:
              "`allow 192.168.100.0/24` autorise tous les postes du réseau à utiliser ce serveur comme source NTP. `local stratum 10` fait que le serveur se déclare comme source de temps même s'il perd sa synchro internet, pour que les clients ne restent jamais sans référence.",
          },
          {
            type: 'note',
            content:
              "Si chronyc sources est vide après le restart, c'est un problème de résolution DNS. Vérifier que le forwarder DNS de Samba pointe vers un DNS public (1.1.1.1) et pas vers la gateway.",
          },
        ],
      },
      {
        title: '4. Correction du forwarder DNS (piège rencontré)',
        blocks: [
          {
            type: 'text',
            content:
              'Objectif : corriger le DNS forwarder de Samba si la résolution externe ne fonctionne pas.',
          },
          {
            type: 'text',
            content:
              "Lors du provisionnement (étape 2), on avait mis 192.168.100.1 (la gateway) comme forwarder DNS. Mais la gateway ne fait pas tourner de serveur DNS — elle résout pour elle-même via systemd-resolved mais n'expose pas ce service sur le réseau. Résultat : le DNS Samba ne peut pas résoudre les noms externes (comme les pools NTP). La solution est de pointer directement vers un DNS public.",
          },
          { type: 'code', code: `sudo nano /etc/samba/smb.conf` },
          {
            type: 'note',
            content:
              'Changer la ligne : `dns forwarder = 192.168.100.1` en `dns forwarder = 1.1.1.1`',
          },
          {
            type: 'code',
            code: `sudo systemctl restart samba-ad-dc
host 2.ntp.ubuntu.com`,
          },
          {
            type: 'note',
            content: 'host 2.ntp.ubuntu.com doit résoudre vers une IP.',
          },
          {
            type: 'text',
            content:
              "C'est un piège courant. La gateway fait du NAT (couche 3) mais ne fait pas office de résolveur DNS pour les autres machines. Pour que ça marche avec la gateway comme forwarder, il faudrait y installer un résolveur DNS (comme dnsmasq) qui écoute sur 192.168.100.1 — mais pointer vers 1.1.1.1 est plus simple et fiable.",
          },
        ],
      },
      {
        title: '5. Installation et configuration du firewall (ufw)',
        blocks: [
          {
            type: 'text',
            content:
              'Objectif : n\'autoriser que les ports nécessaires au fonctionnement du DC.',
          },
          {
            type: 'code',
            code: `sudo apt install ufw -y
sudo ufw allow from 192.168.100.0/24 to any port 53    # DNS
sudo ufw allow from 192.168.100.0/24 to any port 88    # Kerberos
sudo ufw allow from 192.168.100.0/24 to any port 135   # RPC
sudo ufw allow from 192.168.100.0/24 to any port 139   # SMB/NetBIOS
sudo ufw allow from 192.168.100.0/24 to any port 389   # LDAP
sudo ufw allow from 192.168.100.0/24 to any port 445   # SMB
sudo ufw allow from 192.168.100.0/24 to any port 464   # Kerberos password change
sudo ufw allow from 192.168.100.0/24 to any port 636   # LDAPS
sudo ufw allow from 192.168.100.0/24 to any port 3268  # Global Catalog
sudo ufw allow from 192.168.100.0/24 to any port 3269  # Global Catalog SSL
sudo ufw allow from 192.168.100.0/24 to any port 123   # NTP
sudo ufw allow ssh                                     # SSH depuis n'importe où
sudo ufw enable`,
          },
          {
            type: 'text',
            content:
              'On ouvre uniquement les ports nécessaires au DC (DNS, Kerberos, LDAP, SMB, NTP, RPC, Global Catalog), restreints au réseau maquette 192.168.100.0/24. SSH est ouvert plus largement pour l\'administration à distance.',
          },
          {
            type: 'note',
            content:
              "ufw et iptables-persistent sont incompatibles. Si iptables-persistent était installé, ufw l'a remplacé. Les règles NAT sur la gateway doivent être gérées séparément.",
          },
        ],
      },
      {
        title: '6. Tests de validation',
        blocks: [
          {
            type: 'text',
            content:
              'a) DNS toujours fonctionnel après le firewall :',
          },
          { type: 'code', code: `host lgnum.local` },
          { type: 'note', content: 'Doit retourner 192.168.100.2.' },
          { type: 'text', content: 'b) Sources NTP :' },
          { type: 'code', code: `chronyc sources -v` },
          {
            type: 'note',
            content: 'Doit afficher les sources NTP avec une * sur la meilleure.',
          },
          { type: 'text', content: 'c) Fuseau horaire et synchronisation :' },
          { type: 'code', code: `timedatectl` },
          {
            type: 'note',
            content:
              'Doit afficher Europe/Paris et System clock synchronized: yes.',
          },
          { type: 'text', content: 'd) Règles du firewall :' },
          { type: 'code', code: `sudo ufw status verbose` },
          {
            type: 'note',
            content: 'Doit lister toutes les règles configurées.',
          },
        ],
      },
    ],
  },
  4: {
    title: 'Création des comptes et groupes AD',
    objective:
      "Créer les utilisateurs et groupes dans l'annuaire Active Directory pour refléter l'organigramme de Lot-et-Garonne Numérique.",
    prerequisites: [
      'Étape 3 terminée : le serveur Samba AD DC est opérationnel avec DNS et NTP fonctionnels.',
    ],
    sections: [
      {
        title: '1. Création des groupes',
        blocks: [
          {
            type: 'text',
            content: 'Objectif : créer les groupes correspondant aux services de la structure.',
          },
          {
            type: 'code',
            code: `sudo samba-tool group add "Direction"
sudo samba-tool group add "Compta-Administration"
sudo samba-tool group add "Conseillers-Numeriques"
sudo samba-tool group add "RH"
sudo samba-tool group add "Informatique"`,
          },
          {
            type: 'text',
            content:
              "Les groupes AD permettent de gérer les permissions de façon centralisée. Plutôt que d'attribuer des droits utilisateur par utilisateur, on les affecte au groupe et tous les membres en héritent. C'est le même principe que sous Windows Server.",
          },
        ],
      },
      {
        title: '2. Création des utilisateurs',
        blocks: [
          {
            type: 'text',
            content: "Objectif : créer les comptes de chaque employé dans l'annuaire.",
          },
          {
            type: 'code',
            code: `sudo samba-tool user add myriam --given-name=Myriam --surname=Maraval --mail-address=myriam.maraval@lgnum.fr
sudo samba-tool user add fabrice --given-name=Fabrice --surname=Lalanne --mail-address=fabrice.lalanne@lgnum.fr
sudo samba-tool user add nathalie --given-name=Nathalie --surname=Payen --mail-address=nathalie.payen@lgnum.fr
sudo samba-tool user add geoffroy --given-name=Geoffroy --surname=Gaillard --mail-address=geoffroy.gaillard@lgnum.fr
sudo samba-tool user add asmaa --given-name=Asmaa --surname=Assila --mail-address=asmaa.assila@lgnum.fr
sudo samba-tool user add wladimir --given-name=Wladimir --surname=Bigand --mail-address=wladimir.bigand@lgnum.fr`,
          },
          {
            type: 'text',
            content:
              "Chaque commande demande un mot de passe interactivement. Le mot de passe doit respecter la politique de complexité AD (8+ caractères, majuscule, minuscule, chiffre ou spécial). Les attributs --given-name, --surname et --mail-address remplissent les champs de l'annuaire consultables par les applications (client mail, intranet, etc.).",
          },
          {
            type: 'note',
            content:
              'Noter immédiatement chaque mot de passe dans KeePassXC. Ils ne sont pas récupérables.',
          },
        ],
      },
      {
        title: '3. Affectation aux groupes',
        blocks: [
          {
            type: 'text',
            content: 'Objectif : rattacher chaque utilisateur à son ou ses groupes.',
          },
          {
            type: 'code',
            code: `sudo samba-tool group addmembers "Direction" myriam
sudo samba-tool group addmembers "Compta-Administration" fabrice,nathalie
sudo samba-tool group addmembers "RH" nathalie
sudo samba-tool group addmembers "Conseillers-Numeriques" asmaa,geoffroy
sudo samba-tool group addmembers "Informatique" wladimir`,
          },
          {
            type: 'text',
            content:
              "Un utilisateur peut appartenir à plusieurs groupes (Nathalie est dans Compta-Administration ET RH). Les virgules permettent d'ajouter plusieurs membres d'un coup.",
          },
        ],
      },
      {
        title: '4. Vérification',
        blocks: [
          {
            type: 'text',
            content: "Objectif : s'assurer que tous les comptes et groupes sont correctement créés.",
          },
          { type: 'code', code: `sudo samba-tool user list` },
          {
            type: 'note',
            content: 'Doit lister les 6 utilisateurs + Administrator, Guest, krbtgt.',
          },
          {
            type: 'code',
            code: `sudo samba-tool group listmembers "Direction"
sudo samba-tool group listmembers "Compta-Administration"
sudo samba-tool group listmembers "RH"
sudo samba-tool group listmembers "Conseillers-Numeriques"
sudo samba-tool group listmembers "Informatique"`,
          },
          {
            type: 'note',
            content:
              'Résultats attendus : Direction → myriam ; Compta-Administration → fabrice, nathalie ; RH → nathalie ; Conseillers-Numeriques → asmaa, geoffroy ; Informatique → wladimir.',
          },
        ],
      },
    ],
  },
  5: {
    title: 'Partages de fichiers réseau',
    objective:
      "Créer les partages Samba sur le DC pour reproduire l'arborescence de fichiers existante (lecteurs Z: et Y: sous Windows).",
    prerequisites: [
      'Étape 4 terminée : les comptes et groupes AD sont créés.',
    ],
    sections: [
      {
        title: '1. Installation de libnss-winbind',
        blocks: [
          {
            type: 'text',
            content:
              'Objectif : permettre à Linux de voir les groupes et utilisateurs AD pour gérer les permissions fichiers.',
          },
          { type: 'code', code: `sudo apt install libnss-winbind -y` },
          { type: 'text', content: 'Puis éditer /etc/nsswitch.conf :' },
          { type: 'code', code: `sudo nano /etc/nsswitch.conf` },
          {
            type: 'note',
            content:
              'Remplacer `passwd: files systemd` par `passwd: files systemd winbind` et `group: files systemd` par `group: files systemd winbind`.',
          },
          {
            type: 'text',
            content: 'Ajouter dans la section [global] de /etc/samba/smb.conf :',
          },
          {
            type: 'code',
            lang: 'conf',
            code: `idmap_ldb:use rfc2307 = yes
winbind nss info = rfc2307
winbind enum users = yes
winbind enum groups = yes`,
          },
          { type: 'code', code: `sudo systemctl restart samba-ad-dc` },
          { type: 'text', content: 'Validation :' },
          { type: 'code', code: `getent group "Domain Users"` },
          { type: 'note', content: 'Doit retourner le groupe avec son GID.' },
          {
            type: 'text',
            content:
              'Sans libnss-winbind, Linux ne sait pas résoudre les noms de groupes AD. Les commandes chown avec des groupes comme "Domain Users" échoueraient avec "groupe invalide". Le module NSS fait le pont entre le système Linux et l\'annuaire Samba.',
          },
          {
            type: 'note',
            content:
              "Le service winbind standalone ne démarre pas en mode AD DC (status: inactive, exec-condition) — c'est normal. Winbind tourne à l'intérieur du processus samba lui-même. wbinfo -g fonctionne quand même.",
          },
        ],
      },
      {
        title: "2. Création de l'arborescence",
        blocks: [
          {
            type: 'text',
            content: 'Objectif : créer les dossiers qui hébergeront les partages.',
          },
          {
            type: 'code',
            code: `sudo mkdir -p /srv/samba/lgnum
sudo mkdir -p /srv/samba/rh
sudo mkdir -p /srv/samba/si
sudo mkdir -p /srv/samba/homes`,
          },
          {
            type: 'text',
            content:
              '/srv/samba est le répertoire standard pour les données servies. On crée un dossier par partage.',
          },
        ],
      },
      {
        title: '3. Permissions des dossiers',
        blocks: [
          {
            type: 'text',
            content: 'Objectif : attribuer les bons groupes propriétaires avec héritage.',
          },
          {
            type: 'code',
            code: `sudo chown -R root:"LGNUM\\domain users" /srv/samba/lgnum
sudo chmod -R 2770 /srv/samba/lgnum
sudo chown -R root:"LGNUM\\rh" /srv/samba/rh
sudo chmod -R 2770 /srv/samba/rh
sudo chown -R root:"LGNUM\\informatique" /srv/samba/si
sudo chmod -R 2770 /srv/samba/si
sudo chown -R root:"LGNUM\\domain users" /srv/samba/homes
sudo chmod -R 2770 /srv/samba/homes`,
          },
          {
            type: 'text',
            content:
              'Le 2770 active le bit setgid — tous les fichiers créés dans le dossier hériteront du groupe du dossier parent. Ça évite les problèmes de permissions quand un utilisateur crée un fichier : les collègues du même groupe pourront y accéder. Les noms de groupes AD doivent être préfixés par "LGNUM\\" pour que Linux les résolve correctement via Winbind.',
          },
          { type: 'text', content: 'Validation :' },
          { type: 'code', code: `ls -la /srv/samba/` },
          {
            type: 'note',
            content: 'Chaque dossier doit afficher le bon groupe propriétaire.',
          },
        ],
      },
      {
        title: '4. Configuration des partages dans smb.conf',
        blocks: [
          {
            type: 'text',
            content: 'Objectif : déclarer les partages réseau dans Samba.',
          },
          { type: 'code', code: `sudo nano /etc/samba/smb.conf` },
          {
            type: 'text',
            content: 'Ajouter à la fin du fichier après [sysvol] :',
          },
          {
            type: 'code',
            lang: 'conf',
            code: `[LGNUM]
path = /srv/samba/lgnum
read only = no
browseable = yes
valid users = @"LGNUM\\domain users"
create mask = 0660
directory mask = 2770
comment = Partage commun Lot-et-Garonne Numerique

[RH]
path = /srv/samba/rh
read only = no
browseable = yes
valid users = @"LGNUM\\rh"
create mask = 0660
directory mask = 2770
comment = Partage RH

[SI]
path = /srv/samba/si
read only = no
browseable = yes
valid users = @"LGNUM\\informatique"
create mask = 0660
directory mask = 2770
comment = Partage Service Informatique

[homes]
path = /srv/samba/homes/%U
read only = no
browseable = no
valid users = %U
create mask = 0600
directory mask = 0700
comment = Dossier personnel`,
          },
          {
            type: 'text',
            content:
              'Le @ devant un nom de groupe signifie "tous les membres de ce groupe". %U est remplacé automatiquement par le login de l\'utilisateur connecté. Le partage homes crée un dossier personnel par utilisateur, non visible dans la liste mais accessible directement.',
          },
        ],
      },
      {
        title: '5. Validation et test',
        blocks: [
          { type: 'code', code: `sudo testparm` },
          {
            type: 'note',
            content: 'Doit afficher "Loaded services file OK" et lister tous les partages.',
          },
          { type: 'code', code: `sudo systemctl restart samba-ad-dc` },
          { type: 'code', code: `smbclient -L //srvad.lgnum.local -U wladimir` },
          {
            type: 'note',
            content: 'Doit lister LGNUM, RH, SI et le dossier personnel.',
          },
          {
            type: 'code',
            code: `smbclient //srvad.lgnum.local/SI -U wladimir -c "mkdir test; ls; rmdir test"`,
          },
          {
            type: 'note',
            content: 'Doit créer, lister et supprimer un dossier sans erreur.',
          },
          {
            type: 'note',
            content:
              'Le message "SMB1 disabled -- no workgroup available" en fin de listing est normal et sans conséquence — SMB1 est désactivé par sécurité.',
          },
        ],
      },
    ],
  },
  6: {
    title: 'Jonction du premier poste client au domaine',
    objective:
      "Joindre la machine ubuntu-usr (192.168.100.1) au domaine lgnum.local et valider l'authentification avec un compte AD.",
    prerequisites: [
      'Étapes 1 à 5 terminées : le DC Samba tourne, le DNS résout lgnum.local, les comptes et groupes sont créés, les partages sont configurés.',
    ],
    sections: [
      {
        title: '1. Configuration DNS du poste client',
        blocks: [
          {
            type: 'text',
            content:
              'Objectif : faire pointer le DNS du poste vers le serveur AD pour qu\'il puisse découvrir le domaine.',
          },
          { type: 'code', code: `sudo nano /etc/netplan/00-installer-config.yaml` },
          {
            type: 'text',
            content: 'Ajouter sur l\'interface du réseau maquette (enx3ce1a1bbbd74) :',
          },
          {
            type: 'code',
            lang: 'yaml',
            code: `      nameservers:
        addresses:
          - 192.168.100.2
        search:
          - lgnum.local`,
          },
          { type: 'code', code: `sudo netplan apply` },
          {
            type: 'text',
            content: 'Puis forcer la résolution si systemd-resolved intercepte :',
          },
          {
            type: 'code',
            code: `sudo resolvectl dns enx3ce1a1bbbd74 192.168.100.2
sudo resolvectl domain enx3ce1a1bbbd74 lgnum.local ~local`,
          },
          { type: 'text', content: 'Validation :' },
          { type: 'code', code: `host srvad.lgnum.local` },
          { type: 'note', content: 'Doit retourner 192.168.100.2.' },
          {
            type: 'text',
            content:
              "Le poste client doit interroger le DNS Samba pour trouver le contrôleur de domaine. Sans ça, la découverte du domaine (realm discover) échouera. Sur cette machine, l'interface eno1 reste en DHCP pour l'accès internet via le réseau entreprise, et l'interface maquette utilise le DNS AD.",
          },
          {
            type: 'note',
            content:
              "systemd-resolved peut intercepter les requêtes DNS et les envoyer au mauvais serveur (celui de l'entreprise sur eno1). La commande resolvectl force la résolution du domaine lgnum.local via l'interface maquette. On peut vérifier avec `resolvectl status` que l'interface maquette utilise bien 192.168.100.2.",
          },
        ],
      },
      {
        title: '2. Installation des paquets',
        blocks: [
          {
            type: 'text',
            content: 'Objectif : installer les outils nécessaires à la jonction au domaine.',
          },
          {
            type: 'code',
            code: `sudo apt install -y sssd sssd-ad sssd-tools realmd adcli krb5-user packagekit samba-common-bin`,
          },
          {
            type: 'note',
            content:
              'krb5-user pose 3 questions interactives :\n1. Royaume Kerberos → LGNUM.LOCAL (en majuscules)\n2. Serveur Kerberos → srvad.lgnum.local\n3. Serveur administratif → srvad.lgnum.local',
          },
          {
            type: 'text',
            content:
              "realmd simplifie la jonction au domaine. sssd gère l'authentification des utilisateurs AD sur le poste Linux (il met en cache les identités et permet la connexion même si le DC est temporairement injoignable). adcli communique avec l'AD pour enregistrer la machine. krb5-user fournit le client Kerberos.",
          },
        ],
      },
      {
        title: '3. Découverte du domaine',
        blocks: [
          {
            type: 'text',
            content: 'Objectif : vérifier que le poste voit le domaine avant de tenter la jonction.',
          },
          { type: 'code', code: `realm discover lgnum.local` },
          {
            type: 'note',
            content:
              'Résultat attendu : type: kerberos, realm-name: LGNUM.LOCAL, domain-name: lgnum.local, configured: no, server-software: active-directory',
          },
          {
            type: 'text',
            content:
              "realm discover interroge le DNS pour trouver les enregistrements SRV du domaine, puis contacte le DC pour récupérer les informations. Si ça échoue, c'est un problème DNS.",
          },
        ],
      },
      {
        title: '4. Jonction au domaine',
        blocks: [
          {
            type: 'text',
            content: 'Objectif : enregistrer la machine dans l\'annuaire AD.',
          },
          { type: 'code', code: `sudo realm join -U administrator lgnum.local` },
          { type: 'text', content: 'Saisir le mot de passe Administrator du domaine.' },
          { type: 'text', content: 'Validation :' },
          { type: 'code', code: `realm list` },
          { type: 'note', content: 'Doit afficher configured: kerberos-member.' },
          {
            type: 'text',
            content:
              'Cette commande fait plusieurs choses automatiquement — elle obtient un ticket Kerberos pour l\'administrateur, crée un compte machine dans l\'AD, configure SSSD pour l\'authentification, et met à jour PAM et NSS. C\'est l\'équivalent du "Joindre un domaine" de Windows.',
          },
        ],
      },
      {
        title: '5. Activation du home automatique',
        blocks: [
          {
            type: 'text',
            content:
              'Objectif : créer automatiquement le répertoire personnel à la première connexion d\'un utilisateur AD.',
          },
          { type: 'code', code: `sudo pam-auth-update --enable mkhomedir` },
          {
            type: 'text',
            content:
              "Sans cette étape, la connexion d'un utilisateur AD échouerait car son répertoire home n'existe pas sur le poste. Cette commande ajoute un module PAM qui crée le dossier /home/utilisateur@lgnum.local à la volée.",
          },
        ],
      },
      {
        title: '6. Test de connexion',
        blocks: [
          {
            type: 'text',
            content: 'Objectif : valider qu\'un utilisateur AD peut se connecter sur le poste.',
          },
          {
            type: 'code',
            code: `su - wladimir@lgnum.local
whoami
pwd
id wladimir@lgnum.local
exit`,
          },
          {
            type: 'note',
            content:
              'Résultats attendus : whoami → wladimir@lgnum.local ; pwd → /home/wladimir@lgnum.local ; id → affiche l\'uid, le gid (domain users) et les groupes (informatique) ; exit → retour au compte local.',
          },
          {
            type: 'text',
            content:
              'Résultat attendu : connexion réussie, home créé automatiquement dans /home/wladimir@lgnum.local, groupes AD visibles.',
          },
        ],
      },
    ],
  },
};
