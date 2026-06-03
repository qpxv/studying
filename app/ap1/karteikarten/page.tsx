import Link from 'next/link';
import { Layers, HelpCircle, Plus, BarChart2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { RangeSelector } from './_components/range-selector';

export default async function KarteikartenPage() {
  const totalCards = await prisma.karteikarte.count();

  return (
    <div className="flex flex-col gap-6 px-4 py-6 w-full max-w-lg mx-auto">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Karteikarten</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">
            {totalCards} {totalCards === 1 ? 'Karte' : 'Karten'} verfügbar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/ap1/karteikarten/stats"
            className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Stats
          </Link>
          <Link
            href="/ap1/karteikarten/erstellen"
            className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors ml-3"
          >
            <Plus className="w-3.5 h-3.5" />
            Erstellen
          </Link>
        </div>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Layers className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Lernmodus</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
              Karteikarten umdrehen, Antworten selbst einschätzen
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Fragemodus</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
              Antwort eintippen, KI bewertet und erklärt
            </p>
          </div>
        </div>
      </div>

      {/* Range selector + mode navigation */}
      <RangeSelector totalCards={totalCards} />
    </div>
  );
}
