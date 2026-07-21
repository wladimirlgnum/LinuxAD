// Petits composants de presentation reutilises par toutes les pages.

/** Carte blanche standard. */
export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/** Pastille de statut (etape, machine, logiciel). */
export function Badge({ config, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${config.badge} ${className}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}

/** Barre de progression accessible (role progressbar + valeurs ARIA). */
export function ProgressBar({ value, label, className = '' }) {
  const pct = Math.round(value);
  return (
    <div className={className}>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** En-tete de page : titre + sous-titre + actions optionnelles. */
export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

/** Compteur de synthese (utilise en haut de la matrice logiciels). */
export function StatCard({ label, value, tone = 'bg-slate-100 text-slate-700' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}>{label}</div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900">{value}</div>
    </div>
  );
}

/** Etats de chargement / erreur homogenes. */
export function Loading({ label = 'Chargement…' }) {
  return <p className="py-12 text-center text-sm text-slate-500">{label}</p>;
}

export function ErrorMessage({ error }) {
  return (
    <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      Erreur : {error.message}
    </div>
  );
}
