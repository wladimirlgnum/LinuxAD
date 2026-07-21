import { NavLink, Outlet } from 'react-router-dom';

// Les 5 sections de l'application.
// `label` = libelle complet (navbar desktop) ; `short` = libelle court (bottom bar mobile).
const NAV = [
  { to: '/', label: 'Tableau de bord', short: 'Dashboard', icon: '📊', end: true },
  { to: '/reseau', label: 'Schéma réseau', short: 'Réseau', icon: '🌐' },
  { to: '/guides', label: 'Guides', short: 'Guides', icon: '📖' },
  { to: '/logiciels', label: 'Matrice logiciels', short: 'Logiciels', icon: '🧩' },
  { to: '/postes', label: 'Postes de travail', short: 'Postes', icon: '💻' },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-lg" aria-hidden="true">
                🐧
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight text-slate-900">Migration Linux</p>
                <p className="truncate text-xs leading-tight text-slate-500">Lot-et-Garonne Numérique</p>
              </div>
            </div>

            {/* Navbar horizontale : desktop uniquement */}
            <nav aria-label="Navigation principale" className="hidden flex-wrap justify-end gap-1 lg:flex">
              {NAV.map(({ to, label, icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 lg:hover:bg-slate-100 lg:hover:text-slate-900'
                    }`
                  }
                >
                  <span className="mr-1.5" aria-hidden="true">
                    {icon}
                  </span>
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* pb-24 : reserve la place de la bottom bar fixe sur mobile/tablette */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:py-8 lg:pb-8">
        <Outlet />
      </main>

      <footer className="hidden border-t border-slate-200 py-6 text-center text-xs text-slate-400 lg:block">
        Ubuntu 26.04 LTS + Samba AD DC — support de suivi interne
      </footer>

      {/* Bottom navigation : mobile et tablette (accessible au pouce) */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ to, short, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                `flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition active:bg-slate-100 ${
                  isActive ? 'text-brand-700' : 'text-slate-500'
                }`
              }
            >
              <span className="text-xl leading-none" aria-hidden="true">
                {icon}
              </span>
              <span className="leading-none">{short}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
