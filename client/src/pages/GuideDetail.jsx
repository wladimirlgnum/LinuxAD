import { useCallback } from 'react';
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
      <Link to="/guides" className="mb-4 inline-block text-sm text-brand-600 hover:underline">
        ← Tous les guides
      </Link>

      <PageHeader title={`Étape ${stepId} — Installation du serveur Samba AD DC`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-start">
        <div className="space-y-6">
          {/* Objectif et prerequis */}
          <Card className="p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-brand-600">Objectif</h2>
            <p className="mt-1.5 text-slate-700">{guide.objective}</p>

            <h2 className="mt-5 text-xs font-bold uppercase tracking-wide text-brand-600">Prérequis</h2>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {guide.prerequisites.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Card>

          {/* Sections du guide */}
          {guide.sections.map((section) => (
            <Card key={section.title} className="p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">{section.title}</h2>
              {section.blocks.map((block, i) => {
                if (block.type === 'code') return <CodeBlock key={i} code={block.code} lang={block.lang} />;
                if (block.type === 'note')
                  return (
                    <p key={i} className="my-3 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
                      <strong className="font-semibold">À noter — </strong>
                      {block.content}
                    </p>
                  );
                return (
                  <p key={i} className="my-2 leading-relaxed text-slate-700">
                    {block.content}
                  </p>
                );
              })}
            </Card>
          ))}
        </div>

        {/* Checklist de fin d'etape, collante au scroll */}
        <Card className="p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold text-slate-900">Checklist de fin d'étape</h2>
          <p className="mt-1 text-sm text-slate-500">
            {doneCount} / {checklist.length} validés
          </p>
          <ProgressBar
            className="mt-2"
            value={(doneCount / checklist.length) * 100}
            label="Progression de la checklist"
          />

          <ul className="mt-4 space-y-1">
            {checklist.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg py-2 text-sm active:bg-slate-50">
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
        </Card>
      </div>
    </>
  );
}
