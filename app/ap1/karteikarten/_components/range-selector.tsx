'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, HelpCircle } from 'lucide-react';

interface Props {
  totalCards: number;
}

export function RangeSelector({ totalCards }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<'alle' | 'bereich'>('alle');
  const [von, setVon] = useState('');
  const [bis, setBis] = useState('');

  function buildParams() {
    if (mode === 'bereich' && von && bis) {
      return `?von=${von}&bis=${bis}`;
    }
    return '';
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-4">
      <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
        Kartenauswahl
      </p>

      {/* Mode toggle */}
      <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        {(['alle', 'bereich'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            {m === 'alle' ? `Alle Karten (${totalCards})` : 'Bereich wählen'}
          </button>
        ))}
      </div>

      {/* Range inputs */}
      {mode === 'bereich' && (
        <div className="flex items-center gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-zinc-400 dark:text-zinc-500">Von Karten-Nr.</label>
            <input
              type="number"
              min={1}
              value={von}
              onChange={(e) => setVon(e.target.value)}
              placeholder="1"
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
          </div>
          <span className="text-zinc-400 dark:text-zinc-500 mt-5">–</span>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-zinc-400 dark:text-zinc-500">Bis Karten-Nr.</label>
            <input
              type="number"
              min={1}
              value={bis}
              onChange={(e) => setBis(e.target.value)}
              placeholder={String(totalCards)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Mode navigation buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push(`/ap1/karteikarten/lernen${buildParams()}`)}
          disabled={mode === 'bereich' && (!von || !bis)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Layers className="w-4 h-4" />
          Lernen
        </button>
        <button
          onClick={() => router.push(`/ap1/karteikarten/fragen${buildParams()}`)}
          disabled={mode === 'bereich' && (!von || !bis)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <HelpCircle className="w-4 h-4" />
          Fragen
        </button>
      </div>
    </div>
  );
}
