import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { GUIDES } from '../data/guides.js';
import { STEP_STATUS } from '../constants.js';
import { Card, Badge, PageHeader, Loading, ErrorMessage } from '../components/ui.jsx';

// Couleur de la bordure gauche des cartes selon le statut (tokens de la DA).
const STATUS_COLOR = {
  done: 'var(--success)',
  in_progress: 'var(--accent)',
  todo: 'var(--neutral)',
};

export default function Guides() {
  const { data: steps, loading, error } = useApi(api.getProgress, []);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <>
      <PageHeader
        title="guides"
        subtitle="Commandes, explications et tests de validation pour chaque étape du projet"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step) => {
          const available = Boolean(GUIDES[step.id]);

          return (
            <Card
              key={step.id}
              className={`p-5 ${available ? 'transition active:border-border-strong lg:hover:border-border-strong' : 'opacity-60'}`}
            >
              <div
                className="-mx-5 -mt-5 mb-4 border-l-[3px] px-5 pt-5"
                style={{ borderLeftColor: STATUS_COLOR[step.status] }}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <span className="font-mono text-xs font-bold uppercase tracking-wide text-muted">
                    Étape {String(step.id).padStart(2, '0')}
                  </span>
                  <Badge config={STEP_STATUS[step.status]} />
                </div>

                <h2 className="font-mono font-semibold text-fg-strong">{step.title}</h2>
                <p className="mt-1 text-sm text-muted">{step.summary}</p>
              </div>

              {available ? (
                <Link
                  to={`/guides/${step.id}`}
                  className="inline-flex min-h-[44px] items-center rounded-lg bg-accent px-4 font-mono text-sm font-semibold text-[#0a0a0f] transition active:brightness-95 lg:hover:brightness-110"
                >
                  Ouvrir le guide →
                </Link>
              ) : (
                <p className="text-sm italic text-muted">Guide à rédiger</p>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
