import Link from 'next/link';
import { Plus, BarChart2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { RangeSelector } from './_components/range-selector';
import { KartenVerwaltung } from './_components/karten-verwaltung';

export default async function KarteikartenPage() {
  const cards = await prisma.karteikarte.findMany({
    select: { id: true, karteikartenNr: true, question: true, answer: true, difficulty: true },
    orderBy: { karteikartenNr: 'asc' },
  });

  return (
    <div className="flex flex-col gap-6 px-4 py-6 w-full max-w-lg mx-auto">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Karteikarten</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">
            {cards.length} {cards.length === 1 ? 'Karte' : 'Karten'} verfügbar
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

      <RangeSelector totalCards={cards.length} />
      <KartenVerwaltung cards={cards} />
    </div>
  );
}
