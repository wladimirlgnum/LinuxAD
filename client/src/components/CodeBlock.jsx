import { useState } from 'react';

/**
 * Bloc de commande shell façon vrai terminal.
 * Header avec les 3 points macOS + libellé + bouton « Copier ».
 * Le fond reste très sombre dans les deux thèmes (identité terminal).
 */
export default function CodeBlock({ code, lang = 'bash' }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard indisponible (contexte non sécurisé) : on ignore silencieusement
    }
  }

  return (
    <div
      className="my-4 overflow-hidden rounded-lg border"
      style={{ borderColor: 'var(--border-strong)', background: '#0d0d0d' }}
    >
      {/* Header terminal : pastilles macOS + titre + copier */}
      <div
        className="flex items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#161616' }}
      >
        <span className="flex shrink-0 gap-1.5" aria-hidden="true">
          <span className="h-3 w-3 rounded-full" style={{ background: '#ff5f56' }} />
          <span className="h-3 w-3 rounded-full" style={{ background: '#ffbd2e' }} />
          <span className="h-3 w-3 rounded-full" style={{ background: '#27c93f' }} />
        </span>
        <span className="ml-1 min-w-0 flex-1 truncate font-mono text-xs" style={{ color: '#8a8a94' }}>
          {lang}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-md px-3 font-mono text-xs font-semibold transition"
          style={{
            color: copied ? '#27c93f' : '#ff9d00',
            background: 'rgba(255,255,255,0.06)',
          }}
        >
          {copied ? '✓ Copié' : '⧉ Copier'}
        </button>
      </div>

      <pre className="overflow-x-auto px-4 py-3 font-mono text-sm leading-relaxed">
        <code style={{ color: '#e6e6e6' }}>
          <span style={{ color: '#27c93f', userSelect: 'none' }} aria-hidden="true">
            ${' '}
          </span>
          {code}
        </code>
      </pre>
    </div>
  );
}
