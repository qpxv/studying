'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, HelpCircle, Shuffle } from 'lucide-react';

interface Props {
  totalCards: number;
}

export function RangeSelector({ totalCards }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<'alle' | 'bereich'>('alle');
  const [von, setVon] = useState('');
  const [bis, setBis] = useState('');
  const [zufaellig, setZufaellig] = useState(false);

  useEffect(() => {
    setZufaellig(localStorage.getItem('karteikarten-zufaellig') === '1');
  }, []);

  function toggleZufaellig() {
    const next = !zufaellig;
    setZufaellig(next);
    localStorage.setItem('karteikarten-zufaellig', next ? '1' : '0');
  }

  function buildParams() {
    const params: string[] = [];
    if (mode === 'bereich' && von && bis) {
      params.push(`von=${von}`, `bis=${bis}`);
    }
    if (zufaellig) params.push('zufaellig=1');
    return params.length ? `?${params.join('&')}` : '';
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

      {/* Shuffle toggle */}
      <button
        onClick={toggleZufaellig}
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors text-sm font-medium ${
          zufaellig
            ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
            : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
        }`}
      >
        <Shuffle className="w-4 h-4 shrink-0" />
        Zufällige Reihenfolge
        <div className={`ml-auto w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${
          zufaellig ? 'bg-white/30 dark:bg-zinc-900/30' : 'bg-zinc-200 dark:bg-zinc-700'
        }`}>
          <div className={`w-3 h-3 rounded-full transition-transform ${
            zufaellig
              ? 'translate-x-4 bg-white dark:bg-zinc-900'
              : 'translate-x-0 bg-white dark:bg-zinc-400'
          }`} />
        </div>
      </button>

      {/* Mode cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            href: `/ap1/karteikarten/lernen`,
            icon: <Layers className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />,
            label: 'Lernen',
            description: 'Karte aufdecken und Antwort selbst bewerten',
          },
          {
            href: `/ap1/karteikarten/fragen`,
            icon: <HelpCircle className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />,
            label: 'Abfragen',
            description: 'Antwort tippen — KI bewertet sofort',
          },
        ].map(({ href, icon, label, description }) => {
          const disabled = mode === 'bereich' && (!von || !bis);
          return (
            <button
              key={label}
              onClick={() => router.push(`${href}${buildParams()}`)}
              disabled={disabled}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-3 text-left hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-zinc-200 disabled:hover:shadow-none"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                {icon}
              </div>
              <div>
                <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{label}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">{description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
