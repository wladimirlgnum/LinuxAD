import { useState } from 'react';

/**
 * Bloc de commande shell avec bouton "Copier".
 * Utilise dans les guides etape par etape.
 */
export default function CodeBlock({ code, lang = 'bash' }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard indisponible (contexte non securise) : on ignore silencieusement
    }
  }

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-1.5">
        <span className="font-mono text-xs text-slate-400">{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
        >
          {copied ? '✓ Copié' : 'Copier'}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-sm leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
