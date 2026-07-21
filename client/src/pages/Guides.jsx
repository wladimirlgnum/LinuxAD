import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { GUIDES } from '../data/guides.js';
import { STEP_STATUS } from '../constants.js';
import { Card, Badge, PageHeader, Loading, ErrorMessage } from '../components/ui.jsx';

export default function Guides() {
  const { data: steps, loading, error } = useApi(api.getProgress, []);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <>
      <PageHeader
        title="Guides étape par étape"
        subtitle="Commandes, explications et tests de validation pour chaque étape du projet"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step) => {
          const available = Boolean(GUIDES[step.id]);

          return (
            <Card key={step.id} className={`p-5 ${available ? 'transition active:border-brand-300 lg:hover:border-brand-300 lg:hover:shadow-md' : 'opacity-60'}`}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Étape {step.id}</span>
                <Badge config={STEP_STATUS[step.status]} />
              </div>

              <h2 className="font-semibold text-slate-900">{step.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{step.summary}</p>

              {available ? (
                <Link
                  to={`/guides/${step.id}`}
                  className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition active:bg-brand-700 lg:hover:bg-brand-700"
                >
                  Ouvrir le guide →
                </Link>
              ) : (
                <p className="mt-4 text-sm italic text-slate-400">Guide à rédiger</p>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
