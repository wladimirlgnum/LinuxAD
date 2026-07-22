import { useCallback, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { GUIDES } from '../data/guides.js';
import CodeBlock from '../components/CodeBlock.jsx';
import { Card, PageHeader, ProgressBar, Loading, ErrorMessage } from '../components/ui.jsx';

export default function GuideDetail() {
  const { stepId } = useParams();
  const guide = GUIDES[stepId];

  const fetchGuide = useCallback(() => api.getGuide(stepId), [stepId]);
  const { data: state, setData: setState, loading, error } = useApi(fetchGuide, [stepId]);

  // Etat d'ouverture du drawer de checklist sur mobile (sur desktop, la sidebar est toujours visible).
  const [checklistOpen, setChecklistOpen] = useState(false);

  if (!guide) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">Le guide de l'étape {stepId} n'a pas encore été rédigé.</p>
        <Link to="/guides" className="mt-2 inline-block font-mono text-sm text-accent underline">
          ← Retour aux guides
        </Link>
      </div>
    );
  }

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const checklist = state.checklist;
  const doneCount = checklist.filter((i) => i.done).length;

  // Mise a jour optimiste de la case cochee.
  async function toggle(item) {
    const previous = checklist;
    setState({ ...state, checklist: checklist.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)) });
    try {
      await api.setGuideItem(stepId, item.id, !item.done);
    } catch {
      setState({ ...state, checklist: previous });
    }
  }

  // Barre de progression + liste des items : partagee entre la sidebar desktop et le drawer mobile.
  const progressAndList = (
    <>
      <ProgressBar
        className="mt-3"
        value={(doneCount / checklist.length) * 100}
        label="Progression de la checklist"
      />

      <ul className="mt-4 space-y-1">
        {checklist.map((item) => (
          <li key={item.id}>
            <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg py-2 text-base transition active:bg-surface-hover lg:text-sm">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggle(item)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-border accent-accent"
              />
              <span className={item.done ? 'text-muted line-through opacity-60' : 'text-fg'}>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <>
      <Link to="/guides" className="mb-4 inline-block font-mono text-sm text-accent lg:hover:underline">
        ← Tous les guides
      </Link>

      <PageHeader title={`étape ${stepId} — ${guide.title}`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-start">
        {/* min-w-0 : indispensable pour que les <pre> defilent au lieu d'elargir la colonne */}
        <div className="min-w-0 space-y-6">
          {/* Objectif et prerequis */}
          <Card className="p-5">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wide text-accent">Objectif</h2>
            <p className="mt-1.5 break-words text-fg">{guide.objective}</p>

            <h2 className="mt-5 font-mono text-xs font-bold uppercase tracking-wide text-accent">Prérequis</h2>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-base text-muted lg:text-sm">
              {guide.prerequisites.map((p) => (
                <li key={p} className="break-words">{p}</li>
              ))}
            </ul>
          </Card>

          {/* Sections du guide */}
          {guide.sections.map((section) => (
            <Card key={section.title} className="p-5">
              <h2 className="mb-3 break-words font-mono text-lg font-semibold text-fg-strong">{section.title}</h2>
              {section.blocks.map((block, i) => {
                if (block.type === 'code') return <CodeBlock key={i} code={block.code} lang={block.lang} />;
                if (block.type === 'note')
                  return (
                    <p
                      key={i}
                      className="glass my-3 break-words rounded-lg border-l-4 border-accent px-4 py-3 text-base text-fg lg:text-sm"
                      style={{ background: 'var(--accent-quiet)' }}
                    >
                      <strong className="font-semibold text-accent">À noter — </strong>
                      {block.content}
                    </p>
                  );
                return (
                  <p key={i} className="my-2 break-words leading-relaxed text-fg">
                    {block.content}
                  </p>
                );
              })}
            </Card>
          ))}
        </div>

        {/* Checklist — desktop : sidebar collante (comportement d'origine, masquee sous lg) */}
        <Card className="hidden p-5 lg:sticky lg:top-24 lg:block">
          <span className="block font-mono font-semibold text-fg-strong">Checklist de fin d'étape</span>
          <span className="mt-1 block text-sm text-muted">
            {doneCount} / {checklist.length} validés
          </span>
          {progressAndList}
        </Card>
      </div>

      {/* Checklist — mobile : bouton flottant + drawer slide-up (masque a partir de lg) */}
      <div className="lg:hidden">
        {/* Bouton flottant, ancre au-dessus de la bottom nav bar (z-30) */}
        <button
          type="button"
          onClick={() => setChecklistOpen(true)}
          aria-label="Ouvrir la checklist de fin d'étape"
          className="fixed right-4 z-40 flex min-h-[48px] items-center gap-2 rounded-full bg-accent px-5 font-mono font-semibold text-[#0a0a0f] transition active:scale-95"
          style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))', boxShadow: 'var(--glow-accent)' }}
        >
          <span>Checklist</span>
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-sm tabular-nums">
            {doneCount}/{checklist.length} ✓
          </span>
        </button>

        {/* Overlay semi-transparent (scrim) */}
        <div
          onClick={() => setChecklistOpen(false)}
          aria-hidden="true"
          className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
            checklistOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />

        {/* Drawer slide-up */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Checklist de fin d'étape"
          className={`glass fixed inset-x-0 bottom-0 z-50 flex max-h-[60vh] flex-col rounded-t-2xl border-t border-border transition-transform duration-300 ease-out ${
            checklistOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <div>
              <span className="block font-mono font-semibold text-fg-strong">Checklist</span>
              <span className="mt-0.5 block text-sm text-muted">
                {doneCount} / {checklist.length} validés
              </span>
            </div>
            <button
              type="button"
              onClick={() => setChecklistOpen(false)}
              aria-label="Fermer la checklist"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xl text-muted transition active:bg-surface-hover"
            >
              ✕
            </button>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            {progressAndList}
          </div>
        </div>
      </div>
    </>
  );
}
