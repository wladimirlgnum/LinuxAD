import { NavLink, Outlet } from 'react-router-dom';

// Les 5 sections de l'application.
const NAV = [
  { to: '/', label: 'Tableau de bord', icon: '📊', end: true },
  { to: '/reseau', label: 'Schéma réseau', icon: '🌐' },
  { to: '/guides', label: 'Guides', icon: '📖' },
  { to: '/logiciels', label: 'Matrice logiciels', icon: '🧩' },
  { to: '/postes', label: 'Postes de travail', icon: '💻' },
];

export default function Layout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-lg" aria-hidden="true">
                🐧
              </span>
              <div>
                <p className="text-sm font-bold leading-tight text-slate-900">Migration Linux</p>
                <p className="text-xs leading-tight text-slate-500">Lot-et-Garonne Numérique</p>
              </div>
            </div>

            <nav aria-label="Navigation principale" className="flex flex-1 flex-wrap gap-1">
              {NAV.map(({ to, label, icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Ubuntu 26.04 LTS + Samba AD DC — support de suivi interne
      </footer>
    </div>
  );
}
