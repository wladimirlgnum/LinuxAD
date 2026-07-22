import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { Card, PageHeader, ProgressBar, StatCard, Loading, ErrorMessage } from '../components/ui.jsx';

const pct = (ws) => (ws.checklist.length ? (ws.checklist.filter((i) => i.done).length / ws.checklist.length) * 100 : 0);

// Styles de boutons réutilisés (accent = action principale, ghost = secondaire).
const BTN_ACCENT =
  'min-h-[44px] rounded-lg bg-accent px-4 font-mono text-sm font-semibold text-[#0a0a0f] transition active:brightness-95 lg:hover:brightness-110';
const BTN_GHOST =
  'min-h-[44px] rounded-lg border border-border px-4 font-mono text-sm font-medium text-fg transition active:bg-surface-hover lg:hover:border-border-strong lg:hover:text-accent';
const INPUT =
  'min-h-[44px] w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-base text-fg transition focus:border-border-strong';

export default function Workstations() {
  const { data: list, setData: setList, loading, error } = useApi(api.getWorkstations, []);
  const [activeId, setActiveId] = useState(null);
  const [adding, setAdding] = useState(false);

  // Selectionne le premier poste une fois les donnees chargees.
  useEffect(() => {
    if (list?.length && !activeId) setActiveId(list[0].id);
  }, [list, activeId]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const active = list.find((w) => w.id === activeId);
  const completed = list.filter((w) => pct(w) === 100).length;

  // Remplace un poste dans la liste et pousse la modification au backend.
  async function save(updated) {
    const previous = list;
    setList(list.map((w) => (w.id === updated.id ? updated : w)));
    try {
      await api.updateWorkstation(updated.id, updated);
    } catch {
      setList(previous);
    }
  }

  async function addWorkstation(name, role) {
    const ws = await api.createWorkstation({ name, role });
    setList([...list, ws]);
    setActiveId(ws.id);
    setAdding(false);
  }

  async function remove(id) {
    if (!confirm('Supprimer définitivement ce poste et sa checklist ?')) return;
    const previous = list;
    const remaining = list.filter((w) => w.id !== id);
    setList(remaining);
    setActiveId(remaining[0]?.id ?? null);
    try {
      await api.deleteWorkstation(id);
    } catch {
      setList(previous);
    }
  }

  return (
    <>
      <PageHeader
        title="postes"
        subtitle="Suivi poste par poste de la migration vers Ubuntu"
      >
        <button type="button" onClick={() => setAdding(true)} className={`w-full sm:w-auto ${BTN_ACCENT}`}>
          + Ajouter un poste
        </button>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Postes migrés" value={`${completed} / ${list.length}`} tone="bg-[var(--success-quiet)] text-success" />
        <StatCard label="En cours" value={list.filter((w) => pct(w) > 0 && pct(w) < 100).length} tone="bg-[var(--accent-quiet)] text-accent" />
        <StatCard label="Non démarrés" value={list.filter((w) => pct(w) === 0).length} tone="bg-[var(--neutral-quiet)] text-muted" />
      </div>

      {adding && <AddForm onCancel={() => setAdding(false)} onSubmit={addWorkstation} />}

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr] lg:items-start">
        {/* Onglets : defilement horizontal sur mobile, colonne verticale sur desktop */}
        <nav
          aria-label="Postes de travail"
          className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
        >
          {list.map((ws) => {
            const isActive = ws.id === activeId;
            return (
              <button
                key={ws.id}
                type="button"
                onClick={() => setActiveId(ws.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`relative min-w-[11rem] shrink-0 rounded-lg border px-4 py-3 text-left transition lg:w-full lg:min-w-0 ${
                  isActive
                    ? 'border-border-strong bg-[var(--accent-quiet)]'
                    : 'border-border bg-surface active:bg-surface-hover lg:hover:border-border-strong'
                }`}
              >
                {isActive && (
                  <span
                    className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent lg:inset-y-3 lg:left-0 lg:right-auto lg:h-auto lg:w-0.5"
                    style={{ boxShadow: 'var(--glow-accent)' }}
                    aria-hidden="true"
                  />
                )}
                <span className={`block font-mono font-medium ${isActive ? 'text-accent' : 'text-fg-strong'}`}>{ws.name}</span>
                <span className="block text-xs text-muted">{ws.role}</span>
                <ProgressBar className="mt-2" value={pct(ws)} label={`Progression du poste ${ws.name}`} />
                <span className="mt-1 block font-mono text-xs tabular-nums text-muted">{Math.round(pct(ws))} %</span>
              </button>
            );
          })}
        </nav>

        {active && <WorkstationPanel key={active.id} ws={active} onSave={save} onDelete={remove} />}
      </div>
    </>
  );
}

/** Detail d'un poste : checklist editable + notes libres. */
function WorkstationPanel({ ws, onSave, onDelete }) {
  const [newItem, setNewItem] = useState('');
  const [notes, setNotes] = useState(ws.notes);
  const notesTimer = useRef(null);

  const toggle = (itemId) =>
    onSave({ ...ws, checklist: ws.checklist.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) });

  const removeItem = (itemId) => onSave({ ...ws, checklist: ws.checklist.filter((i) => i.id !== itemId) });

  function addItem(e) {
    e.preventDefault();
    if (!newItem.trim()) return;
    const item = { id: `c${Date.now()}`, label: newItem.trim(), done: false };
    onSave({ ...ws, checklist: [...ws.checklist, item] });
    setNewItem('');
  }

  // Les notes sont sauvegardees avec un delai (debounce) pour ne pas appeler
  // l'API a chaque frappe.
  function onNotesChange(value) {
    setNotes(value);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => onSave({ ...ws, notes: value }), 600);
  }

  useEffect(() => () => clearTimeout(notesTimer.current), []);

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-mono text-lg font-semibold text-fg-strong">{ws.name}</h2>
          <p className="text-sm text-muted">{ws.role}</p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(ws.id)}
          className="min-h-[44px] rounded-lg border border-border px-3 font-mono text-sm text-muted transition active:bg-[var(--danger-quiet)] active:text-danger lg:hover:border-[var(--danger)] lg:hover:bg-[var(--danger-quiet)] lg:hover:text-danger"
        >
          Supprimer le poste
        </button>
      </div>

      <ProgressBar value={pct(ws)} label={`Progression du poste ${ws.name}`} />

      <ul className="mt-5 space-y-1">
        {ws.checklist.map((item) => (
          <li key={item.id} className="group flex items-center gap-2 rounded-lg px-1 transition active:bg-surface-hover lg:hover:bg-surface-hover">
            <label className="flex flex-1 cursor-pointer items-center gap-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggle(item.id)}
                className="h-5 w-5 shrink-0 rounded border-border accent-accent"
              />
              <span className={item.done ? 'text-muted line-through opacity-60' : 'text-fg'}>{item.label}</span>
            </label>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              aria-label={`Supprimer l'étape ${item.label}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded text-lg text-muted transition active:text-danger lg:opacity-0 lg:group-hover:opacity-100 lg:hover:text-danger lg:focus:opacity-100"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={addItem} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Ajouter une étape à la checklist…"
          aria-label="Nouvelle étape de checklist"
          className={`flex-1 ${INPUT}`}
        />
        <button type="submit" className={BTN_GHOST}>
          Ajouter
        </button>
      </form>

      <div className="mt-6">
        <label htmlFor="notes" className="font-mono text-xs font-bold uppercase tracking-wide text-muted">
          Notes (problèmes rencontrés, spécificités)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          className="mt-1.5 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-base text-fg transition focus:border-border-strong"
          placeholder="Ex. : imprimante Sharp à reconfigurer, dossier partagé spécifique…"
        />
      </div>
    </Card>
  );
}

/** Formulaire d'ajout d'un nouveau poste. */
function AddForm({ onCancel, onSubmit }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  return (
    <Card className="mb-6 p-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSubmit(name, role);
        }}
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <label className="w-full text-sm sm:w-auto">
          <span className="mb-1 block font-mono font-medium text-fg">Nom du poste / utilisateur</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus className={`sm:w-auto ${INPUT}`} />
        </label>
        <label className="w-full text-sm sm:w-auto">
          <span className="mb-1 block font-mono font-medium text-fg">Service / rôle</span>
          <input value={role} onChange={(e) => setRole(e.target.value)} className={`sm:w-auto ${INPUT}`} />
        </label>
        <button type="submit" className={`w-full sm:w-auto ${BTN_ACCENT}`}>
          Créer
        </button>
        <button type="button" onClick={onCancel} className={`w-full sm:w-auto ${BTN_GHOST}`}>
          Annuler
        </button>
      </form>
    </Card>
  );
}
