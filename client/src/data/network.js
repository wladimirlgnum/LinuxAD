// Schema reseau de la maquette : donnees statiques (topologie d'infrastructure).
// La page Reseau est en lecture seule ; ces donnees ne sont jamais modifiees
// depuis l'interface, elles vivent donc cote client (comme le contenu des guides).
export const NETWORK = {
  nodes: [
    {
      id: 'internet',
      type: 'cloud',
      label: 'Reseau entreprise',
      subtitle: '192.168.10.0/24',
      status: 'done',
      details: {
        Role: 'Reseau amont / acces Internet',
        'Sous-reseau': '192.168.10.0/24',
      },
    },
    {
      id: 'gateway',
      type: 'server',
      label: 'ubuntu-usr',
      subtitle: 'Passerelle NAT',
      status: 'done',
      details: {
        Machine: 'Machine 1 - ubuntu-usr',
        OS: 'Ubuntu 26.04 LTS',
        'IP WAN': '192.168.10.70 (eno1)',
        'IP LAN': '192.168.100.1 (enx...)',
        Services: 'nftables NAT, ip_forward',
      },
    },
    {
      id: 'srvad',
      type: 'server',
      label: 'srvad',
      subtitle: 'Samba AD DC / DNS',
      status: 'in_progress',
      details: {
        Machine: 'Machine 2 - srvad',
        OS: 'Ubuntu Server 26.04 LTS',
        IP: '192.168.100.2',
        Role: 'Domain Controller + DNS',
        Services: 'samba-ad-dc, krb5, DNS interne',
      },
    },
    {
      id: 'clients',
      type: 'clients',
      label: 'Postes clients',
      subtitle: 'a venir',
      status: 'todo',
      details: {
        Role: 'Postes de travail migres',
        'Sous-reseau': '192.168.100.0/24',
        Jonction: 'realm join (a faire)',
      },
    },
  ],
};
