import { useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { SOFTWARE_STATUS, SOFTWARE_STATUS_ORDER } from '../constants.js';
import { Card, PageHeader, StatCard, Loading, ErrorMessage } from '../components/ui.jsx';

export default function Software() {
  const { data: software, setData: setSoftware, loading, error } = useApi(api.getSoftware, []);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [user, setUser] = useState('all');
  const [status, setStatus] = useState('all');

  // Listes de filtres derivees des donnees (pas de liste codee en dur).
  const categories = useMemo(
    () => [...new Set(software?.map((s) => s.category) ?? [])].sort(),
    [software]
  );
  const users = useMemo(
    () => [...new Set(software?.flatMap((s) => s.users) ?? [])].sort(),
    [software]
  );

  const filtered = useMemo(() => {
    if (!software) return [];
    const q = search.trim().toLowerCase();

    return software.filter(
      (s) =>
        (category === 'all' || s.category === category) &&
        (user === 'all' || s.users.includes(user)) &&
        (status === 'all' || s.status === status) &&
        (!q || `${s.windows} ${s.vendor} ${s.linux}`.toLowerCase().includes(q))
    );
  }, [software, search, category, user, status]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  // Compteurs calcules sur l'ensemble de la matrice, pas sur le filtre courant.
  const counts = SOFTWARE_STATUS_ORDER.map((key) => ({
    key,
    ...SOFTWARE_STATUS[key],
    value: software.filter((s) => s.status === key).length,
  }));

  async function changeStatus(entry, newStatus) {
    const previous = software;
    setSoftware(software.map((s) => (s.id === entry.id ? { ...s, status: newStatus } : s)));
    try {
      await api.updateSoftware(entry.id, { status: newStatus });
    } catch {
      setSoftware(previous);
    }
  }

  return (
    <>
      <PageHeader
        title="Matrice logiciels Windows → Linux"
        subtitle={`${software.length} logiciels issus de l'audit du parc`}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map((c) => (
          <StatCard key={c.key} label={`${c.icon} ${c.label}`} value={c.value} tone={c.badge} />
        ))}
      </div>

      {/* Barre de filtres */}
      <Card className="mb-4 flex flex-wrap gap-3 p-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un logiciel…"
          aria-label="Rechercher un logiciel"
          className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <Select label="Catégorie" value={category} onChange={setCategory} options={categories} />
        <Select label="Utilisateur" value={user} onChange={setUser} options={users} />
        <Select
          label="Statut"
          value={status}
          onChange={setStatus}
          options={SOFTWARE_STATUS_ORDER.map((k) => [k, SOFTWARE_STATUS[k].label])}
        />
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-3xl text-sm">
          <caption className="sr-only">Correspondance des logiciels Windows vers leurs alternatives Linux</caption>
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Logiciel Windows</th>
              <th scope="col" className="px-4 py-3 font-semibold">Éditeur</th>
              <th scope="col" className="px-4 py-3 font-semibold">Catégorie</th>
              <th scope="col" className="px-4 py-3 font-semibold">Utilisateurs</th>
              <th scope="col" className="px-4 py-3 font-semibold">Critique</th>
              <th scope="col" className="px-4 py-3 font-semibold">Alternative Linux</th>
              <th scope="col" className="px-4 py-3 font-semibold">Statut migration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{s.windows}</td>
                <td className="px-4 py-3 text-slate-500">{s.vendor}</td>
                <td className="px-4 py-3 text-slate-600">{s.category}</td>
                <td className="px-4 py-3 text-slate-600">{s.users.join(', ')}</td>
                <td className="px-4 py-3">
                  {s.critical ? (
                    <span className="text-rose-600" title="Usage critique">●</span>
                  ) : (
                    <span className="text-slate-300">○</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">{s.linux}</td>
                <td className="px-4 py-3">
                  <label className="sr-only" htmlFor={`st-${s.id}`}>
                    Statut de migration de {s.windows}
                  </label>
                  <select
                    id={`st-${s.id}`}
                    value={s.status}
                    onChange={(e) => changeStatus(s, e.target.value)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${SOFTWARE_STATUS[s.status].badge}`}
                  >
                    {SOFTWARE_STATUS_ORDER.map((k) => (
                      <option key={k} value={k}>
                        {SOFTWARE_STATUS[k].icon} {SOFTWARE_STATUS[k].label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Aucun logiciel ne correspond aux filtres.</p>
        )}
      </Card>
    </>
  );
}

/** Menu deroulant de filtre, avec une option « tous » en tete. */
function Select({ label, value, onChange, options }) {
  // options accepte soit des chaines, soit des paires [valeur, libelle].
  const items = options.map((o) => (Array.isArray(o) ? o : [o, o]));

  return (
    <label className="text-sm">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
      >
        <option value="all">{label} : toutes</option>
        {items.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
