import { useState } from 'react';
import { NETWORK } from '../data/network.js';
import { STEP_STATUS } from '../constants.js';
import { Card, Badge, PageHeader } from '../components/ui.jsx';

// Couleur d'accent des noeuds selon leur statut de configuration (tokens de la DA).
const STATUS_COLOR = {
  done: 'var(--success)', // teal = configuré
  in_progress: 'var(--accent)', // ambre = en cours
  todo: 'var(--neutral)', // gris = à faire
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
        title="reseau"
        subtitle="Survolez ou sélectionnez une machine pour afficher ses informations"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="p-4">
          <svg viewBox="0 0 800 560" className="h-auto w-full" role="img" aria-label="Architecture réseau de la maquette">
            {/* Liaisons animées entre les machines */}
            <g className="net-link" fill="none">
              <line x1="400" y1="80" x2="400" y2="150" />
              <line x1="400" y1="240" x2="400" y2="310" />
              <line x1="400" y1="400" x2="400" y2="460" />
            </g>
            <g fontSize="12" fontFamily="'JetBrains Mono', ui-monospace, monospace" style={{ fill: 'var(--muted)' }}>
              <text x="412" y="118">eno1 — 192.168.10.70</text>
              <text x="412" y="278">enx… — 192.168.100.1</text>
              <text x="412" y="435">192.168.100.0/24</text>
            </g>

            {nodes.map((node) => {
              const p = POS[node.id];
              const color = STATUS_COLOR[node.status];
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
                    strokeWidth={isActive ? 3 : 2}
                    style={{
                      fill: 'var(--surface-2)',
                      stroke: color,
                      filter: `drop-shadow(0 0 ${isActive ? 12 : 5}px ${color})`,
                      transition: 'filter 150ms ease',
                    }}
                  />
                  <text
                    x={p.x + p.w / 2}
                    y={p.y + p.h / 2 - 4}
                    textAnchor="middle"
                    fontSize="15"
                    fontWeight="600"
                    fontFamily="'JetBrains Mono', ui-monospace, monospace"
                    style={{ fill: 'var(--fg-strong)' }}
                  >
                    {node.label}
                  </text>
                  <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 16} textAnchor="middle" fontSize="12" style={{ fill: 'var(--muted)' }}>
                    {node.subtitle}
                  </text>
                  {/* Pastille de statut en haut à droite du noeud */}
                  <circle cx={p.x + p.w - 14} cy={p.y + 14} r="5" style={{ fill: color }} />
                </g>
              );
            })}
          </svg>
        </Card>

        {/* Panneau latéral : infos de la machine survolée ou sélectionnée */}
        <Card className="h-fit p-5">
          {active ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-mono font-semibold text-fg-strong">{active.label}</h2>
                <Badge config={STEP_STATUS[active.status]} />
              </div>
              <dl className="space-y-2 text-sm">
                {Object.entries(active.details).map(([key, value]) => (
                  <div key={key}>
                    <dt className="font-mono text-xs font-medium uppercase tracking-wide text-muted">{key}</dt>
                    <dd className="break-words font-mono text-fg">{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="text-sm text-muted">
              Sélectionnez une machine du schéma pour afficher son adresse IP, son rôle et ses services.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
