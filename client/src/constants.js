// Libelles et styles partages pour les differents systemes de statuts.

// Statuts des etapes macro et des machines du schema reseau
export const STEP_STATUS = {
  todo: { label: 'A faire', icon: '⏳', badge: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  in_progress: { label: 'En cours', icon: '🔄', badge: 'bg-amber-100 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  done: { label: 'Terminé', icon: '✅', badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
};

export const STEP_STATUS_ORDER = ['todo', 'in_progress', 'done'];

// Statuts de migration de la matrice logiciels
export const SOFTWARE_STATUS = {
  compatible: { label: 'Compatible', icon: '✅', badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  to_validate: { label: 'À valider', icon: '🔄', badge: 'bg-amber-100 text-amber-800 ring-amber-200' },
  to_check: { label: 'À vérifier', icon: '❓', badge: 'bg-sky-100 text-sky-800 ring-sky-200' },
  blocking: { label: 'Bloquant', icon: '⛔', badge: 'bg-rose-100 text-rose-800 ring-rose-200' },
};

export const SOFTWARE_STATUS_ORDER = ['compatible', 'to_validate', 'to_check', 'blocking'];

// Poids utilises pour calculer la progression globale : une etape en cours compte pour moitie.
export const STATUS_WEIGHT = { todo: 0, in_progress: 0.5, done: 1 };
