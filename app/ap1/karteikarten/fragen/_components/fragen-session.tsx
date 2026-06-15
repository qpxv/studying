'use client';

import { useState, useTransition, useEffect } from 'react';
import { ChevronRight, ChevronDown, RotateCcw } from 'lucide-react';
import { marked } from 'marked';
import { ScoreBadge } from '../../_components/score-badge';
import { DifficultyDots } from '../../_components/difficulty-dots';
import { saveScore } from '../../actions';

function fisherYates<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function MarkdownContent({ text, className }: { text: string; className?: string }) {
  const html = marked.parse(text) as string;
  return (
    <div
      className={`sql-markdown text-sm leading-relaxed${className ? ` ${className}` : ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

interface CardWithScore {
  id: number;
  karteikartenNr: number;
  question: string;
  answer: string;
  difficulty: number;
  existingScore: string | null;
}

interface Props {
  cards: CardWithScore[];
  shuffle?: boolean;
}

type Phase = 'idle' | 'loading' | 'evaluated' | 'saving';

interface EvalResult {
  score: string;
  reasoning: string;
}

const SCORES = ['gut', 'mittel', 'schlecht'] as const;

const SCORE_BTN: Record<string, string> = {
  gut:      'border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50',
  mittel:   'border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50',
  schlecht: 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50',
};

const SCORE_BTN_ACTIVE: Record<string, string> = {
  gut:      'bg-green-50 dark:bg-green-950/50 border-green-400 dark:border-green-600 text-green-600 dark:text-green-400',
  mittel:   'bg-amber-50 dark:bg-amber-950/50 border-amber-400 dark:border-amber-600 text-amber-600 dark:text-amber-400',
  schlecht: 'bg-red-50 dark:bg-red-950/50 border-red-400 dark:border-red-600 text-red-600 dark:text-red-400',
};

export function FragenSession({ cards, shuffle }: Props) {
  const [orderedCards, setOrderedCards] = useState(cards);
  const [index, setIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [selectedScore, setSelectedScore] = useState<string | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [sessionScores, setSessionScores] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (shuffle) setOrderedCards(fisherYates([...cards]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const card = orderedCards[index];
  const total = orderedCards.length;

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!userInput.trim()) return;
    setEvalError(null);
    setPhase('loading');
    setExplanationText(null);
    setShowExplanation(false);

    try {
      const res = await fetch('/api/karteikarten/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: card.question,
          answer: card.answer,
          userInput: userInput.trim(),
        }),
      });
      const data = await res.json() as EvalResult & { error?: string };
      if (data.error) throw new Error(data.error);
      setEvalResult(data);
      setSelectedScore(data.score);
      setPhase('evaluated');
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : 'Bewertung fehlgeschlagen');
      setPhase('idle');
    }
  }

  function handleConfirmScore() {
    if (!selectedScore) return;
    setPhase('saving');
    setSessionScores((prev) => ({ ...prev, [card.id]: selectedScore }));
    startTransition(async () => {
      await saveScore(card.id, selectedScore);
      advanceCard();
    });
  }

  async function handleLoadExplanation() {
    if (explanationText !== null) {
      setShowExplanation((v) => !v);
      return;
    }
    setExplanationLoading(true);
    try {
      const res = await fetch('/api/karteikarten/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: card.question,
          answer: card.answer,
          userInput,
        }),
      });
      const data = await res.json() as { explanation?: string; error?: string };
      if (data.error) throw new Error(data.error);
      setExplanationText(data.explanation ?? '');
      setShowExplanation(true);
    } catch (e) {
      console.error('[erklärung] error=', e);
    } finally {
      setExplanationLoading(false);
    }
  }

  function advanceCard() {
    if (index < total - 1) {
      setIndex((i) => i + 1);
      setUserInput('');
      setEvalResult(null);
      setSelectedScore(null);
      setEvalError(null);
      setExplanationText(null);
      setExplanationLoading(false);
      setShowExplanation(false);
      setPhase('idle');
    } else {
      setFinished(true);
    }
  }

  function restart() {
    setIndex(0);
    setUserInput('');
    setEvalResult(null);
    setSelectedScore(null);
    setEvalError(null);
    setExplanationText(null);
    setExplanationLoading(false);
    setShowExplanation(false);
    setPhase('idle');
    setSessionScores({});
    setFinished(false);
  }

  // ── End summary ────────────────────────────────────────────────────────────
  if (finished) {
    const counts = { gut: 0, mittel: 0, schlecht: 0 };
    Object.values(sessionScores).forEach((s) => {
      if (s in counts) counts[s as keyof typeof counts]++;
    });

    return (
      <div className="flex flex-col items-center justify-center h-full px-4 gap-6">
        <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col gap-5">
          <p className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Sitzung abgeschlossen</p>
          <div className="flex gap-3">
            {SCORES.map((s) => (
              <div key={s} className="flex-1 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3 flex flex-col items-center gap-1.5">
                <ScoreBadge score={s} />
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{counts[s]}</span>
              </div>
            ))}
          </div>
          <button
            onClick={restart}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Nochmal
          </button>
        </div>
      </div>
    );
  }

  // ── Main card view ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col px-4 py-6 gap-5 w-full mx-auto">
      {/* Progress */}
      <div className="w-full flex items-center justify-between">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Karte {index + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">#{card.karteikartenNr}</span>
          <DifficultyDots difficulty={card.difficulty} />
        </div>
        <MarkdownContent text={card.question} className="font-medium text-zinc-900 dark:text-zinc-100" />
      </div>

      {/* Answer input (only in idle/loading) */}
      {(phase === 'idle' || phase === 'loading') && (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={phase === 'loading'}
            rows={4}
            placeholder="Deine Antwort… (Enter zum Bestätigen)"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none disabled:opacity-50"
          />
          {evalError && (
            <p className="text-xs text-red-500">{evalError}</p>
          )}
          <button
            type="submit"
            disabled={phase === 'loading' || !userInput.trim()}
            className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 active:scale-95 transition-all disabled:opacity-40"
          >
            {phase === 'loading' ? 'Bewerte…' : 'Bestätigen'}
          </button>
        </form>
      )}

      {/* Evaluation result */}
      {(phase === 'evaluated' || phase === 'saving') && evalResult && (
        <div className="w-full flex flex-col gap-4">
          {/* AI verdict */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ScoreBadge score={evalResult.score} />
              <span className="text-xs text-zinc-400 dark:text-zinc-500">KI-Vorschlag</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{evalResult.reasoning}</p>
          </div>

          {/* Correct answer */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Musterlösung</p>
            <MarkdownContent text={card.answer} className="text-zinc-700 dark:text-zinc-300" />
          </div>

          {/* On-demand explanation */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <button
              onClick={handleLoadExplanation}
              disabled={explanationLoading || phase === 'saving'}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <span>{explanationLoading ? 'Generieren…' : 'Erklärung anzeigen'}</span>
              {explanationText !== null ? (
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${showExplanation ? 'rotate-180' : ''}`} />
              ) : (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{explanationLoading ? '' : 'auf Anfrage'}</span>
              )}
            </button>
            {showExplanation && explanationText !== null && (
              <div className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <MarkdownContent text={explanationText} className="text-zinc-600 dark:text-zinc-300" />
              </div>
            )}
          </div>

          {/* Score confirmation */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Bewertung bestätigen:</p>
            <div className="flex gap-2">
              {SCORES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedScore(s)}
                  disabled={phase === 'saving'}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all active:scale-95 disabled:opacity-40 ${
                    selectedScore === s ? SCORE_BTN_ACTIVE[s] : `border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 ${SCORE_BTN[s]}`
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={handleConfirmScore}
              disabled={!selectedScore || phase === 'saving'}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 active:scale-95 transition-all disabled:opacity-40 mt-1"
            >
              {phase === 'saving' ? 'Speichern…' : (
                <>
                  Nächste Karte
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
