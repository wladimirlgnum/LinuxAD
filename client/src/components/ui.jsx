// Petits composants de présentation réutilisés par toutes les pages.

/** Carte / panneau : surface avec glassmorphism subtil et bordure ambrée. */
export function Card({ children, className = '' }) {
  return (
    <div
      className={`glass rounded-xl border border-border ${className}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {children}
    </div>
  );
}

/** Pastille de statut (étape, machine, logiciel). */
export function Badge({ config, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-medium ring-1 ring-inset ${config.badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}

/** Barre de progression accessible (role progressbar + valeurs ARIA) avec glow ambré. */
export function ProgressBar({ value, label, tone = 'accent', className = '' }) {
  const pct = Math.round(value);
  const fill = tone === 'success' ? 'var(--success)' : 'var(--accent)';
  const glow = tone === 'success' ? 'var(--glow-success)' : 'var(--glow-accent)';
  return (
    <div className={className}>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full border border-border bg-surface-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, background: fill, boxShadow: pct > 0 ? glow : 'none' }}
        />
      </div>
    </div>
  );
}

/** En-tête de page : titre + sous-titre + actions optionnelles. */
export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-mono text-xl font-bold tracking-tight text-fg-strong sm:text-2xl">
          <span className="text-accent">$</span> {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

/** Compteur de synthèse (utilisé en haut de la matrice logiciels). */
export function StatCard({ label, value, tone = 'bg-neutral-quiet text-muted', className = '' }) {
  return (
    <div
      className={`glass rounded-xl border border-border px-4 py-3 ${className}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className={`inline-flex rounded-md px-2 py-0.5 font-mono text-xs font-medium ${tone}`}>{label}</div>
      <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-fg-strong">{value}</div>
    </div>
  );
}

/** États de chargement / erreur homogènes. */
export function Loading({ label = 'Chargement…' }) {
  return (
    <p className="py-12 text-center font-mono text-sm text-muted">
      <span className="text-accent">$</span> {label}
      <span className="cursor-blink">▋</span>
    </p>
  );
}

export function ErrorMessage({ error }) {
  return (
    <div
      role="alert"
      className="rounded-lg border px-4 py-3 font-mono text-sm"
      style={{ borderColor: 'var(--danger)', background: 'var(--danger-quiet)', color: 'var(--danger)' }}
    >
      <span className="font-bold">✗ Erreur :</span> {error.message}
    </div>
  );
}
