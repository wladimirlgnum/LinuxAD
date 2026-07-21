// Contenu pedagogique des guides etape par etape.
// Statique cote client (c'est de la documentation) ; seules les checklists
// de fin d'etape sont persistees cote backend.
//
// Format d'une section : { title, blocks: [...] }
// Types de blocs : { type: 'text' | 'code' | 'note', ... }

export const GUIDES = {
  2: {
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
            code: `sudo apt install -y samba krb5-config krb5-user winbind smbclient`,
          },
          {
            type: 'note',
            content:
              "L'installeur krb5 demande le nom du royaume (realm). Saisissez LGNUM.LOCAL en MAJUSCULES : par convention Kerberos, le realm est la version majuscule du domaine. Cette valeur sera de toute façon réécrite par le provisionnement.",
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
  version: 2
  ethernets:
    ens18:
      addresses: [192.168.100.2/24]
      routes:
        - to: default
          via: 192.168.100.1
      nameservers:
        addresses: [127.0.0.1]
        search: [lgnum.local]`,
          },
          {
            type: 'note',
            content:
              "Adaptez ens18 au nom réel de l'interface (à récupérer avec `ip a`). Le champ search permet de résoudre les noms courts (srvad au lieu de srvad.lgnum.local).",
          },
          { type: 'code', code: `sudo netplan apply
resolvectl status` },
          { type: 'text', content: 'Vérification finale — la résolution du domaine doit fonctionner :' },
          { type: 'code', code: `host srvad.lgnum.local
ping -c2 google.com` },
        ],
      },
    ],
  },
};
