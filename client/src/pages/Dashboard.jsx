import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { STEP_STATUS, STEP_STATUS_ORDER, STATUS_WEIGHT } from '../constants.js';
import { Card, Badge, ProgressBar, PageHeader, Loading, ErrorMessage } from '../components/ui.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: steps, setData: setSteps, loading, error } = useApi(api.getProgress, []);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  // Progression globale : les étapes "en cours" comptent pour la moitié d'une étape terminée.
  const progress = (steps.reduce((sum, s) => sum + STATUS_WEIGHT[s.status], 0) / steps.length) * 100;
  const doneCount = steps.filter((s) => s.status === 'done').length;
  const inProgressCount = steps.filter((s) => s.status === 'in_progress').length;
  const todoCount = steps.filter((s) => s.status === 'todo').length;

  // Mise à jour optimiste : l'UI réagit tout de suite, le backend suit.
  async function changeStatus(step, status) {
    const previous = steps;
    setSteps(steps.map((s) => (s.id === step.id ? { ...s, status } : s)));
    try {
      await api.setStepStatus(step.id, status);
    } catch {
      setSteps(previous); // rollback si le backend refuse
    }
  }

  return (
    <>
      <PageHeader
        title="progression"
        subtitle="Migration de l'infrastructure Windows vers Ubuntu 26.04 LTS + Samba AD DC"
      />

      {/* Panneau de synthèse principal, façon jauge de monitoring */}
      <Card className="mb-8 overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="shrink-0">
            <p className="font-mono text-xs uppercase tracking-wider text-muted">Progression globale</p>
            <p
              className="font-mono text-5xl font-bold tabular-nums text-accent"
              style={{ textShadow: 'var(--glow-accent)' }}
            >
              {Math.round(progress)}
              <span className="text-2xl text-muted">%</span>
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between font-mono text-xs text-muted">
              <span>uptime du projet</span>
              <span className="tabular-nums">
                {doneCount} / {steps.length} étapes terminées
              </span>
            </div>
            <ProgressBar value={progress} label="Progression globale du projet" />

            {/* Compteurs par statut : lecture rapide type Grafana */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <StatChip label="Terminées" value={doneCount} color="var(--success)" />
              <StatChip label="En cours" value={inProgressCount} color="var(--accent)" />
              <StatChip label="À faire" value={todoCount} color="var(--neutral)" />
            </div>
          </div>
        </div>
      </Card>

      <ol className="space-y-3">
        {steps.map((step) => (
          <li key={step.id}>
            <Card className="p-4 transition active:border-border-strong lg:hover:border-border-strong">
              <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
                <span className="grid h-9 w-11 shrink-0 place-items-center rounded-md border border-border bg-surface-2 font-mono text-sm font-bold text-accent">
                  {String(step.id).padStart(2, '0')}
                </span>

                <button
                  type="button"
                  onClick={() => navigate(`/guides/${step.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="font-mono font-semibold text-fg-strong">{step.title}</span>
                  <span className="mt-0.5 block text-sm text-muted">{step.summary}</span>
                </button>

                <div className="flex w-full items-center gap-3 sm:w-auto">
                  <Badge config={STEP_STATUS[step.status]} />
                  <label className="sr-only" htmlFor={`status-${step.id}`}>
                    Statut de l'étape {step.id}
                  </label>
                  <select
                    id={`status-${step.id}`}
                    value={step.status}
                    onChange={(e) => changeStatus(step, e.target.value)}
                    className="min-h-[44px] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-base text-fg transition focus:border-border-strong sm:flex-none sm:text-sm"
                  >
                    {STEP_STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STEP_STATUS[s].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </>
  );
}

/** Petit compteur coloré sous la barre de progression. */
function StatChip({ label, value, color }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted">{label}</span>
      </div>
      <p className="mt-1 font-mono text-xl font-bold tabular-nums text-fg-strong">{value}</p>
    </div>
  );
}
