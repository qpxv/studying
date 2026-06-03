'use client';

import { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { createKarteikarte, importKarteikarten } from '../actions';

// ── Manual Create Form ─────────────────────────────────────────────────────

function ManualCreateForm() {
  const [id, setId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await createKarteikarte(Number(id), question, answer);
      if ('error' in result) {
        setFeedback({ type: 'error', message: result.error });
      } else {
        setFeedback({ type: 'success', message: 'Karte gespeichert' });
        setId('');
        setQuestion('');
        setAnswer('');
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-4">
      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Manuelle Eingabe</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400 dark:text-zinc-500">Karten-Nummer</label>
          <input
            type="number"
            min={1}
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            placeholder="z.B. 42"
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400 dark:text-zinc-500">Frage</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            rows={3}
            placeholder="Was ist das OSI-Modell?"
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400 dark:text-zinc-500">Antwort</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
            rows={3}
            placeholder="Ein Referenzmodell mit 7 Schichten..."
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {feedback ? (
            <span className={`text-xs flex items-center gap-1 ${feedback.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              {feedback.type === 'success' && <Check className="w-3 h-3" />}
              {feedback.message}
            </span>
          ) : <span />}
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 active:scale-95 transition-all disabled:opacity-40"
          >
            {isPending ? 'Speichern…' : 'Karte speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── JSON Import Form ───────────────────────────────────────────────────────

function JsonImportForm() {
  const [raw, setRaw] = useState('');
  const [feedback, setFeedback] = useState<{ imported: number; errors: string[] } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setParseError(null);
    setFeedback(null);

    let cards: { id: number; question: string; answer: string }[];
    try {
      const parsed = JSON.parse(raw);
      cards = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      setParseError('Ungültiges JSON – bitte überprüfen');
      return;
    }

    startTransition(async () => {
      const result = await importKarteikarten(cards);
      setFeedback(result);
      if (result.errors.length === 0) {
        setRaw('');
        setTimeout(() => setFeedback(null), 5000);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-4">
      <div>
        <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">JSON-Import</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
          Einzelnes Objekt oder Array mit{' '}
          <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">id</code>,{' '}
          <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">question</code>,{' '}
          <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">answer</code>
        </p>
      </div>
      <form onSubmit={handleImport} className="flex flex-col gap-3">
        <textarea
          value={raw}
          onChange={(e) => { setRaw(e.target.value); setParseError(null); }}
          rows={8}
          placeholder={`[\n  {\n    "id": 42,\n    "question": "Was ist das OSI-Modell?",\n    "answer": "Ein Referenzmodell mit 7 Schichten..."\n  }\n]`}
          className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none"
        />

        {parseError && (
          <p className="text-xs text-red-500">{parseError}</p>
        )}

        {feedback && (
          <div className="flex flex-col gap-1">
            <p className={`text-xs flex items-center gap-1 ${feedback.imported > 0 ? 'text-green-600 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
              {feedback.imported > 0 && <Check className="w-3 h-3" />}
              {feedback.imported} {feedback.imported === 1 ? 'Karte' : 'Karten'} importiert
            </p>
            {feedback.errors.map((err, i) => (
              <p key={i} className="text-xs text-red-500">{err}</p>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !raw.trim()}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 active:scale-95 transition-all disabled:opacity-40"
          >
            {isPending ? 'Importieren…' : 'Importieren'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ErstellenPage() {
  return (
    <div className="flex flex-col gap-6 px-4 py-6 w-full max-w-2xl mx-auto">
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
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Karte erstellen</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
          Füge neue Karteikarten manuell hinzu oder importiere mehrere auf einmal via JSON.
        </p>
      </div>

      <ManualCreateForm />
      <JsonImportForm />
    </div>
  );
}
