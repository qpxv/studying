import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { LernSession } from './_components/lern-session';

export default async function LernenPage({
  searchParams,
}: {
  searchParams: Promise<{ von?: string; bis?: string; zufaellig?: string }>;
}) {
  const { von, bis, zufaellig } = await searchParams;
  const vonN = von ? parseInt(von) : undefined;
  const bisN = bis ? parseInt(bis) : undefined;

  const cards = await prisma.karteikarte.findMany({
    where: vonN !== undefined && bisN !== undefined
      ? { id: { gte: vonN, lte: bisN } }
      : undefined,
    orderBy: { id: 'asc' },
    select: { id: true, question: true, answer: true, difficulty: true },
  });

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-4 py-10">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Layers className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Keine Karten gefunden</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {vonN && bisN ? `Bereich ${vonN}–${bisN}` : 'Alle Karten'}
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Für diesen Bereich sind noch keine Karteikarten vorhanden.
          </p>
          <Link
            href="/ap1/karteikarten"
            className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    );
  }

  return <LernSession cards={cards} shuffle={zufaellig === '1'} />;
}
