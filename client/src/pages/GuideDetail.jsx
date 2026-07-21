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

  // Accordeon de la checklist : replie sur mobile, toujours ouvert sur desktop (via CSS).
  const [checklistOpen, setChecklistOpen] = useState(false);

  if (!guide) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-600">Le guide de l'étape {stepId} n'a pas encore été rédigé.</p>
        <Link to="/guides" className="mt-2 inline-block text-sm text-brand-600 underline">
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

  return (
    <>
      <Link to="/guides" className="mb-4 inline-block text-sm text-brand-600 lg:hover:underline">
        ← Tous les guides
      </Link>

      <PageHeader title={`Étape ${stepId} — Installation du serveur Samba AD DC`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-start">
        {/* min-w-0 : indispensable pour que les <pre> defilent au lieu d'elargir la colonne */}
        <div className="min-w-0 space-y-6">
          {/* Objectif et prerequis */}
          <Card className="p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-brand-600">Objectif</h2>
            <p className="mt-1.5 break-words text-slate-700">{guide.objective}</p>

            <h2 className="mt-5 text-xs font-bold uppercase tracking-wide text-brand-600">Prérequis</h2>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-base text-slate-600 lg:text-sm">
              {guide.prerequisites.map((p) => (
                <li key={p} className="break-words">{p}</li>
              ))}
            </ul>
          </Card>

          {/* Sections du guide */}
          {guide.sections.map((section) => (
            <Card key={section.title} className="p-5">
              <h2 className="mb-3 break-words text-lg font-semibold text-slate-900">{section.title}</h2>
              {section.blocks.map((block, i) => {
                if (block.type === 'code') return <CodeBlock key={i} code={block.code} lang={block.lang} />;
                if (block.type === 'note')
                  return (
                    <p key={i} className="my-3 break-words rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-base text-amber-900 lg:text-sm">
                      <strong className="font-semibold">À noter — </strong>
                      {block.content}
                    </p>
                  );
                return (
                  <p key={i} className="my-2 break-words leading-relaxed text-slate-700">
                    {block.content}
                  </p>
                );
              })}
            </Card>
          ))}
        </div>

        {/* Checklist de fin d'etape : accordeon sur mobile, sidebar collante sur desktop */}
        <Card className="p-5 lg:sticky lg:top-24">
          <button
            type="button"
            onClick={() => setChecklistOpen((o) => !o)}
            aria-expanded={checklistOpen}
            className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left lg:pointer-events-none lg:min-h-0"
          >
            <span>
              <span className="block font-semibold text-slate-900">Checklist de fin d'étape</span>
              <span className="mt-1 block text-sm text-slate-500">
                {doneCount} / {checklist.length} validés
              </span>
            </span>
            <span
              aria-hidden="true"
              className={`text-slate-400 transition-transform lg:hidden ${checklistOpen ? 'rotate-180' : ''}`}
            >
              ▾
            </span>
          </button>

          <div className={`${checklistOpen ? 'block' : 'hidden'} lg:block`}>
            <ProgressBar
              className="mt-3"
              value={(doneCount / checklist.length) * 100}
              label="Progression de la checklist"
            />

            <ul className="mt-4 space-y-1">
              {checklist.map((item) => (
                <li key={item.id}>
                  <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg py-2 text-base active:bg-slate-50 lg:text-sm">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggle(item)}
                      className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-brand-600"
                    />
                    <span className={item.done ? 'text-slate-400 line-through' : 'text-slate-700'}>{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </>
  );
}
