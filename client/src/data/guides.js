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
};
