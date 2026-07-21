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

  // Progression globale : les etapes "en cours" comptent pour la moitie d'une etape terminee.
  const progress = (steps.reduce((sum, s) => sum + STATUS_WEIGHT[s.status], 0) / steps.length) * 100;
  const doneCount = steps.filter((s) => s.status === 'done').length;

  // Mise a jour optimiste : l'UI reagit tout de suite, le backend suit.
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
        title="Tableau de bord de progression"
        subtitle="Migration de l'infrastructure Windows vers Ubuntu 26.04 LTS + Samba AD DC"
      />

      <Card className="mb-8 p-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Progression globale</p>
            <p className="text-3xl font-bold tabular-nums text-slate-900">{Math.round(progress)} %</p>
          </div>
          <p className="text-sm text-slate-500">
            {doneCount} / {steps.length} étapes terminées
          </p>
        </div>
        <ProgressBar value={progress} label="Progression globale du projet" />
      </Card>

      <ol className="space-y-3">
        {steps.map((step) => (
          <li key={step.id}>
            <Card className="p-4 transition active:border-brand-300 lg:hover:border-brand-300 lg:hover:shadow-md">
              <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                  {step.id}
                </span>

                <button
                  type="button"
                  onClick={() => navigate(`/guides/${step.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="font-semibold text-slate-900">{step.title}</span>
                  <span className="mt-0.5 block text-sm text-slate-500">{step.summary}</span>
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
                    className="min-h-[44px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-700 sm:flex-none sm:text-sm"
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
