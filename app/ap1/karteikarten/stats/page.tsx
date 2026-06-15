import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ScoreBadge } from '../_components/score-badge';

export default async function StatsPage() {
  const cards = await prisma.karteikarte.findMany({
    include: { scores: { include: { user: true } } },
    orderBy: { karteikartenNr: 'asc' },
  });

  // Collect unique users across all scores
  const userMap = new Map<string, { id: string; name: string }>();
  for (const card of cards) {
    for (const s of card.scores) {
      if (!userMap.has(s.user.id)) {
        userMap.set(s.user.id, { id: s.user.id, name: s.user.name });
      }
    }
  }
  const users = Array.from(userMap.values());

  return (
    <div className="flex flex-col gap-6 px-4 py-6 w-full">
      <div className="flex items-center gap-2">
        <Link
          href="/ap1/karteikarten"
          className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Karteikarten
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Statistiken</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
          Bewertungen aller Nutzer auf einen Blick.
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 flex items-center justify-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
            Noch keine Karteikarten vorhanden.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 whitespace-nowrap">
                  Nr.
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 min-w-[200px]">
                  Frage
                </th>
                {users.map((u) => (
                  <th
                    key={u.id}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 whitespace-nowrap"
                  >
                    {u.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr
                  key={card.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-4 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    #{card.karteikartenNr}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                    {card.question.length > 60 ? `${card.question.slice(0, 60)}…` : card.question}
                  </td>
                  {users.map((u) => {
                    const score = card.scores.find((s) => s.userId === u.id)?.score ?? null;
                    return (
                      <td key={u.id} className="px-4 py-2.5 whitespace-nowrap">
                        {score ? <ScoreBadge score={score} size="sm" /> : (
                          <span className="text-xs text-zinc-300 dark:text-zinc-600">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {users.length === 0 && cards.length > 0 && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
          Noch keine Bewertungen abgegeben.
        </p>
      )}
    </div>
  );
}
