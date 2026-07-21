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
    <div className="relative my-3 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
      <div className="flex items-center justify-between gap-2 border-b border-slate-700 px-3 py-2">
        <span className="font-mono text-xs text-slate-400">{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-[44px] items-center rounded-md bg-slate-700 px-4 text-sm font-semibold text-white transition active:bg-brand-600 lg:hover:bg-slate-600"
        >
          {copied ? '✓ Copié' : '📋 Copier'}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-sm leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
