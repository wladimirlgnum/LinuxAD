// Libellés et styles partagés pour les différents systèmes de statuts.
// Les classes de couleur pointent vers les tokens de la DA (var(--...)),
// donc les pastilles suivent automatiquement le thème dark/light.

// Statuts des étapes macro et des machines du schéma réseau
export const STEP_STATUS = {
  todo: {
    label: 'À faire',
    icon: '○',
    badge: 'bg-[var(--neutral-quiet)] text-muted ring-[var(--neutral)]/30',
    dot: 'bg-[var(--neutral)]',
  },
  in_progress: {
    label: 'En cours',
    icon: '◐',
    badge: 'bg-[var(--accent-quiet)] text-accent ring-[var(--accent)]/30',
    dot: 'bg-[var(--accent)]',
  },
  done: {
    label: 'Terminé',
    icon: '●',
    badge: 'bg-[var(--success-quiet)] text-success ring-[var(--success)]/30',
    dot: 'bg-[var(--success)]',
  },
};

export const STEP_STATUS_ORDER = ['todo', 'in_progress', 'done'];

// Statuts de migration de la matrice logiciels
export const SOFTWARE_STATUS = {
  compatible: {
    label: 'Compatible',
    icon: '●',
    badge: 'bg-[var(--success-quiet)] text-success ring-[var(--success)]/30',
    dot: 'bg-[var(--success)]',
  },
  to_validate: {
    label: 'À valider',
    icon: '◐',
    badge: 'bg-[var(--accent-quiet)] text-accent ring-[var(--accent)]/30',
    dot: 'bg-[var(--accent)]',
  },
  to_check: {
    label: 'À vérifier',
    icon: '◌',
    badge: 'bg-[var(--info-quiet)] text-info ring-[var(--info)]/30',
    dot: 'bg-[var(--info)]',
  },
  blocking: {
    label: 'Bloquant',
    icon: '✕',
    badge: 'bg-[var(--danger-quiet)] text-danger ring-[var(--danger)]/30',
    dot: 'bg-[var(--danger)]',
  },
};

export const SOFTWARE_STATUS_ORDER = ['compatible', 'to_validate', 'to_check', 'blocking'];

// Poids utilisés pour calculer la progression globale : une étape en cours compte pour moitié.
export const STATUS_WEIGHT = { todo: 0, in_progress: 0.5, done: 1 };
