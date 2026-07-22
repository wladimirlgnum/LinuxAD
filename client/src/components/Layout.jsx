import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

// Les 5 sections de l'application.
// `label` = libellé complet (navbar desktop) ; `short` = libellé court (bottom bar mobile).
const NAV = [
  { to: '/', label: 'Tableau de bord', short: 'Dashboard', Icon: IconGauge, end: true },
  { to: '/reseau', label: 'Schéma réseau', short: 'Réseau', Icon: IconNetwork },
  { to: '/guides', label: 'Guides', short: 'Guides', Icon: IconBook },
  { to: '/logiciels', label: 'Matrice logiciels', short: 'Logiciels', Icon: IconGrid },
  { to: '/postes', label: 'Postes de travail', short: 'Postes', Icon: IconMonitor },
];

export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="glass sticky top-0 z-20 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-3">
            {/* Logo façon prompt terminal : chevron ambre + curseur clignotant */}
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border-strong bg-surface-2 font-mono text-base font-bold text-accent"
                style={{ boxShadow: 'var(--glow-accent)' }}
                aria-hidden="true"
              >
                &gt;_
              </span>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-bold leading-tight text-fg-strong">
                  <span className="text-accent">&gt;</span> migration-linux
                  <span className="cursor-blink">▋</span>
                </p>
                <p className="truncate font-mono text-[11px] leading-tight text-muted">
                  Lot-et-Garonne Numérique
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Navbar horizontale : desktop uniquement */}
              <nav aria-label="Navigation principale" className="hidden flex-wrap justify-end gap-1 lg:flex">
                {NAV.map(({ to, label, Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-sm font-medium transition ${
                        isActive
                          ? 'bg-accent/10 text-accent ring-1 ring-inset ring-border-strong'
                          : 'text-muted lg:hover:bg-surface-hover lg:hover:text-fg'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}
              </nav>

              {/* Toggle thème : navbar desktop + haut-droite mobile */}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* pb-24 : réserve la place de la bottom bar fixe sur mobile/tablette */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:py-8 lg:pb-8">
        <Outlet />
      </main>

      <footer className="hidden border-t border-border py-6 text-center font-mono text-xs text-muted lg:block">
        <span className="text-success">●</span> Ubuntu 26.04 LTS + Samba AD DC — support de suivi interne
      </footer>

      {/* Bottom navigation : mobile et tablette (accessible au pouce) */}
      <nav
        aria-label="Navigation principale"
        className="glass fixed inset-x-0 bottom-0 z-30 border-t border-border lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ to, short, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                `relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 font-mono text-[11px] font-medium transition active:bg-surface-hover ${
                  isActive ? 'text-accent' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-accent"
                      style={{ boxShadow: 'var(--glow-accent)' }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon className="h-5 w-5" />
                  <span className="leading-none">{short}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

/** Bouton soleil/lune : bascule dark/light, persiste dans localStorage. */
function ThemeToggle() {
  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'dark' : 'dark',
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // localStorage indisponible : on ignore, le thème reste appliqué pour la session
    }
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-muted transition lg:hover:border-border-strong lg:hover:text-accent"
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? <IconSun className="h-[18px] w-[18px]" /> : <IconMoon className="h-[18px] w-[18px]" />}
    </button>
  );
}

/* --------------------------------------------------------------------------
   Icônes SVG (trait 1.75, currentColor) — style cohérent, pas d'emoji.
   -------------------------------------------------------------------------- */

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function IconGauge({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="m13.4 10.6 3.6-3.6" />
      <path d="M4.5 18a9 9 0 1 1 15 0" />
    </svg>
  );
}

function IconNetwork({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <rect x="9" y="3" width="6" height="5" rx="1" />
      <rect x="3" y="16" width="6" height="5" rx="1" />
      <rect x="15" y="16" width="6" height="5" rx="1" />
      <path d="M12 8v4M6 16v-2h12v2M12 12v2" />
    </svg>
  );
}

function IconBook({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 0 4 20.5v-16Z" />
      <path d="M4 19.5A1.5 1.5 0 0 1 5.5 18H20" />
      <path d="M8 7h7M8 10.5h5" />
    </svg>
  );
}

function IconGrid({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconMonitor({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

function IconSun({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function IconMoon({ className }) {
  return (
    <svg className={className} {...svgProps}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}
