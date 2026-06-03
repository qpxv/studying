'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface Card {
  id: number;
  question: string;
  answer: string;
}

interface Props {
  cards: Card[];
}

export function LernSession({ cards }: Props) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const card = cards[index];
  const total = cards.length;

  function goTo(next: number) {
    setFlipped(false);
    // Small delay so the card resets before switching content
    setTimeout(() => setIndex(next), 150);
  }

  function prev() {
    if (index > 0) goTo(index - 1);
  }

  function next() {
    if (index < total - 1) {
      goTo(index + 1);
    } else {
      setDone(true);
    }
  }

  function restart() {
    setFlipped(false);
    setIndex(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 gap-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8">
          <p className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Ende erreicht</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
            Du hast alle {total} {total === 1 ? 'Karte' : 'Karten'} durchgearbeitet.
          </p>
          <button
            onClick={restart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Neustart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full px-4 py-6 gap-6">
      {/* Progress */}
      <div className="w-full max-w-sm flex items-center justify-between">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Karte {index + 1} / {total}
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {flipped ? 'Antwort' : 'Frage'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* Flip card */}
      <div
        className="w-full max-w-sm [perspective:1000px] cursor-pointer"
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className={`relative min-h-60 [transform-style:preserve-3d] transition-transform duration-500 ${
            flipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* Front */}
          <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col">
            <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-none">
              #{card.id}
            </span>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 text-center leading-relaxed">
                {card.question}
              </p>
            </div>
            <span className="text-[11px] text-zinc-300 dark:text-zinc-600 text-center flex-none">
              Tippen zum Umdrehen
            </span>
          </div>

          {/* Back */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 flex flex-col">
            <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-none">
              Antwort
            </span>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-zinc-700 dark:text-zinc-300 text-center leading-relaxed">
                {card.answer}
              </p>
            </div>
            <span className="text-[11px] text-zinc-300 dark:text-zinc-600 text-center flex-none">
              Tippen zum Umdrehen
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="w-full max-w-sm flex items-center gap-3">
        <button
          onClick={prev}
          disabled={index === 0}
          className="flex-none flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Zurück
        </button>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all"
        >
          Umdrehen
        </button>
        <button
          onClick={next}
          className="flex-none flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 active:scale-95 transition-all"
        >
          {index === total - 1 ? 'Fertig' : 'Weiter'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
