import { useState } from 'react';
import { NETWORK } from '../data/network.js';
import { STEP_STATUS } from '../constants.js';
import { Card, Badge, PageHeader } from '../components/ui.jsx';

// Couleurs de remplissage des noeuds selon leur statut de configuration.
const FILL = {
  done: { box: '#ecfdf5', stroke: '#10b981' },
  in_progress: { box: '#fffbeb', stroke: '#f59e0b' },
  todo: { box: '#f8fafc', stroke: '#94a3b8' },
};

// Positions des noeuds dans le viewBox SVG (800 x 560).
const POS = {
  internet: { x: 300, y: 20, w: 200, h: 60 },
  gateway: { x: 300, y: 150, w: 200, h: 90 },
  srvad: { x: 300, y: 310, w: 200, h: 90 },
  clients: { x: 300, y: 460, w: 200, h: 70 },
};

export default function Network() {
  const [selected, setSelected] = useState(null);

  const nodes = NETWORK.nodes;
  const active = nodes.find((n) => n.id === selected) ?? null;

  return (
    <>
      <PageHeader
        title="Schéma réseau"
        subtitle="Survolez ou sélectionnez une machine pour afficher ses informations"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="p-4">
          <svg viewBox="0 0 800 560" className="h-auto w-full" role="img" aria-label="Architecture réseau de la maquette">
            {/* Liaisons entre les machines, avec les adresses d'interface */}
            <g stroke="#cbd5e1" strokeWidth="2">
              <line x1="400" y1="80" x2="400" y2="150" />
              <line x1="400" y1="240" x2="400" y2="310" />
              <line x1="400" y1="400" x2="400" y2="460" />
            </g>
            <g fontSize="12" fill="#64748b" fontFamily="ui-monospace, monospace">
              <text x="412" y="118">eno1 — 192.168.10.70</text>
              <text x="412" y="278">enx… — 192.168.100.1</text>
              <text x="412" y="435">192.168.100.0/24</text>
            </g>

            {nodes.map((node) => {
              const p = POS[node.id];
              const c = FILL[node.status];
              const isActive = selected === node.id;

              return (
                <g
                  key={node.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`${node.label} — ${STEP_STATUS[node.status].label}`}
                  className="cursor-pointer focus:outline-none"
                  onMouseEnter={() => setSelected(node.id)}
                  onFocus={() => setSelected(node.id)}
                  onClick={() => setSelected(node.id)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelected(node.id)}
                >
                  <rect
                    x={p.x}
                    y={p.y}
                    width={p.w}
                    height={p.h}
                    rx="12"
                    fill={c.box}
                    stroke={isActive ? '#4f46e5' : c.stroke}
                    strokeWidth={isActive ? 3 : 2}
                  />
                  <text x={p.x + p.w / 2} y={p.y + p.h / 2 - 4} textAnchor="middle" fontSize="15" fontWeight="600" fill="#0f172a">
                    {node.label}
                  </text>
                  <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 16} textAnchor="middle" fontSize="12" fill="#64748b">
                    {node.subtitle}
                  </text>
                  {/* Pastille de statut en haut a droite du noeud */}
                  <circle cx={p.x + p.w - 14} cy={p.y + 14} r="5" fill={c.stroke} />
                </g>
              );
            })}
          </svg>
        </Card>

        {/* Panneau lateral : infos de la machine survolee ou selectionnee */}
        <Card className="h-fit p-5">
          {active ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{active.label}</h2>
                <Badge config={STEP_STATUS[active.status]} />
              </div>
              <dl className="space-y-2 text-sm">
                {Object.entries(active.details).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{key}</dt>
                    <dd className="font-mono text-slate-700">{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Sélectionnez une machine du schéma pour afficher son adresse IP, son rôle et ses services.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
