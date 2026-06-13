'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import { Terminal, Play, ArrowLeft, Home, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import SqlEditor, { type SqlEditorHandle } from './sql-editor';

type Phase = 'idle' | 'generating' | 'ready' | 'evaluating' | 'evaluated';
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy', label: 'Einfach', desc: '1 Tabelle · SELECT/WHERE' },
  { value: 'medium', label: 'Mittel', desc: '2 Tabellen · JOIN · GROUP BY' },
  { value: 'hard', label: 'Schwer', desc: '2–3 Tabellen · JOINs · Subqueries' },
];

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Einfach',
  medium: 'Mittel',
  hard: 'Schwer',
};

const USAGE_MARKER = '\x00USAGE:';

function extractUsage(text: string): { clean: string; cents?: number } {
  const idx = text.indexOf(USAGE_MARKER);
  if (idx === -1) return { clean: text };
  const clean = text.slice(0, idx).replace(/\n$/, '');
  const cents = parseFloat(text.slice(idx + USAGE_MARKER.length));
  return { clean, cents: isNaN(cents) ? undefined : cents };
}

async function streamToState(
  url: string,
  body: Record<string, string>,
  onChunk: (text: string) => void
): Promise<number> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.body) throw new Error('No response body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let cents = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value);
    const { clean, cents: c } = extractUsage(accumulated);
    onChunk(clean);
    if (c !== undefined) cents = c;
  }
  return cents;
}

function MarkdownBubble({ content }: { content: string }) {
  const html = marked.parse(content) as string;
  return (
    <div
      className="sql-markdown bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function TypingDots() {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function PraxisSession() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [exercise, setExercise] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [feedback, setFeedback] = useState('');
  const [totalCents, setTotalCents] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [vp, setVp] = useState<{ height: number; top: number } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<SqlEditorHandle>(null);

  useEffect(() => {
    const update = () => {
      const vv = window.visualViewport;
      setVp({ height: vv ? vv.height : window.innerHeight, top: vv ? vv.offsetTop : 0 });
    };
    update();
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [exercise, feedback, phase]);

  const submitQuery = useCallback(async () => {
    if (phase !== 'ready') return;
    const q = editorRef.current?.getValue().trim() ?? '';
    if (!q) return;
    setSubmittedQuery(q);
    editorRef.current?.clear();
    setFeedback('');
    setPhase('evaluating');
    try {
      const cents = await streamToState(
        '/api/sql/praxis-evaluate',
        { exercise, userQuery: q },
        (text) => setFeedback(text)
      );
      setTotalCents((t) => t + cents);
      setPhase('evaluated');
    } catch (err) {
      setFeedback(`Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
      setPhase('evaluated');
    }
  }, [phase, exercise]);

  const generateExercise = useCallback(async () => {
    setExercise('');
    setFeedback('');
    setSubmittedQuery('');
    editorRef.current?.clear();
    setPhase('generating');
    setRoundCount((n) => n + 1);
    try {
      const cents = await streamToState('/api/sql/praxis-generate', { difficulty }, (text) => setExercise(text));
      setTotalCents((t) => t + cents);
      setPhase('ready');
      setTimeout(() => editorRef.current?.focus(), 50);
    } catch (err) {
      setExercise(`Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
      setPhase('ready');
    }
  }, [difficulty]);

  const headerSub = roundCount > 0 ? `Runde ${roundCount} · ${DIFFICULTY_LABEL[difficulty]} · ${totalCents.toFixed(2)}¢` : undefined;
  const isActive = phase !== 'idle';

  return (
    <div
      className="flex flex-col bg-white dark:bg-zinc-950"
      style={{
        position: 'fixed',
        top: vp ? vp.top : 0,
        left: 0,
        right: 0,
        height: vp ? vp.height : '100dvh',
      }}
    >
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">SQL Praxis</span>
            {headerSub && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500 leading-tight">{headerSub}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isActive && (
            <Link
              href="/sql"
              className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Zurück
            </Link>
          )}
          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <Home className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Idle start screen */}
      {!isActive && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">SQL Praxis</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              KI generiert frische Tabellen und eine Aufgabe
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-center">Schwierigkeitsgrad</p>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => {
                const selected = difficulty === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl px-2 py-3 border text-center transition-all active:scale-95 ${
                      selected
                        ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-semibold leading-tight">{d.label}</span>
                    <span className={`text-[10px] leading-tight ${selected ? 'opacity-70' : 'text-zinc-400 dark:text-zinc-500'}`}>{d.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={generateExercise}
            className="px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 active:scale-95 transition-all"
          >
            Los geht&apos;s
          </button>
        </div>
      )}

      {/* Active split layout */}
      {isActive && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: conversation */}
          <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 flex flex-col gap-3">
            {phase === 'generating' && !exercise ? (
              <TypingDots />
            ) : (
              exercise && <MarkdownBubble content={exercise} />
            )}

            {submittedQuery && (
              <div className="self-end max-w-[85%] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-2xl rounded-br-sm px-4 py-3">
                <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">
                  {submittedQuery}
                </pre>
              </div>
            )}

            {phase === 'evaluating' && !feedback && <TypingDots />}
            {feedback && <MarkdownBubble content={feedback} />}

            {phase === 'evaluated' && (
              <button
                onClick={generateExercise}
                className="self-start flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Nächste Aufgabe <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Right: editor panel */}
          <div className="flex-none md:w-[420px] w-full h-56 md:h-auto border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="flex-1 overflow-hidden">
              <SqlEditor
                ref={editorRef}
                onSubmit={submitQuery}
                disabled={phase !== 'ready'}
              />
            </div>
            <div className="flex-none border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between bg-[#21252b]">
              <span className="text-xs text-zinc-500">Cmd+Enter</span>
              <button
                onClick={submitQuery}
                disabled={phase !== 'ready'}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-700 text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-600 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
