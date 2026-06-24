'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import { createKarteikarte, importKarteikarten } from '../actions';

const DIFFICULTY_LABELS: Record<number, string> = { 1: 'Leicht', 2: 'Mittel', 3: 'Schwer' };

const AI_PROMPT = `You are extracting flashcard data from an image. The image shows one or more flashcards (Karteikarten). For each card, identify:

1. **id** – the card number printed on the card (as a number, e.g. 42)
2. **question** – the full question text on the card
3. **answer** – the full answer text on the card
4. **difficulty** – determined by counting the filled-in dots shown on the card:
   - 1 filled dot → 1 (leicht / easy)
   - 2 filled dots → 2 (mittel / medium)
   - 3 filled dots → 3 (schwer / hard)
   - If no dots are visible or it is unclear → use 2

Return ONLY a valid JSON array — no explanation, no markdown prose, only the JSON code block. Example output:

\`\`\`json
[
  {
    "id": 1,
    "question": "Wie lautet das OSI-Modell?",
    "answer": "Ein Referenzmodell mit 7 Schichten: Physisch, Sicherung, Vermittlung, Transport, Sitzung, Darstellung, Anwendung.",
    "difficulty": 2
  },
  {
    "id": 2,
    "question": "Was ist eine IP-Adresse?",
    "answer": "Eine eindeutige numerische Adresse, die jedem Gerät in einem Netzwerk zugewiesen wird.",
    "difficulty": 1
  }
]
\`\`\`

If there is only one card, still return an array with one element. Preserve line breaks in question/answer text using \\n. Do not add any text before or after the JSON code block.`;

function DifficultyPills({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
      {[1, 2, 3].map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            value === level
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
          }`}
        >
          {DIFFICULTY_LABELS[level]}
        </button>
      ))}
    </div>
  );
}

// ── Manual Create Form ─────────────────────────────────────────────────────

function ManualCreateForm() {
  const [id, setId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [difficulty, setDifficulty] = useState(2);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await createKarteikarte(Number(id), question, answer, difficulty);
      if ('error' in result) {
        setFeedback({ type: 'error', message: result.error });
      } else {
        setFeedback({ type: 'success', message: 'Karte gespeichert' });
        setId('');
        setQuestion('');
        setAnswer('');
        setDifficulty(2);
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
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400 dark:text-zinc-500">Schwierigkeit</label>
          <DifficultyPills value={difficulty} onChange={setDifficulty} />
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

// Escapes literal newlines/tabs inside JSON string values (AIs often omit the backslash-n).
function fixJsonControlChars(str: string): string {
  let inString = false;
  let escaped = false;
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === '\\') { result += ch; escaped = true; continue; }
    if (ch === '"') { result += ch; inString = !inString; continue; }
    if (inString) {
      if (ch === '\n') { result += '\\n'; continue; }
      if (ch === '\r') { result += '\\r'; continue; }
      if (ch === '\t') { result += '\\t'; continue; }
    }
    result += ch;
  }
  return result;
}

function JsonImportForm() {
  const [raw, setRaw] = useState('');
  const [feedback, setFeedback] = useState<{ imported: number; errors: string[] } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCopyPrompt() {
    navigator.clipboard.writeText(AI_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setParseError(null);
    setFeedback(null);

    let cards: { id: number; question: string; answer: string; difficulty?: number }[];
    try {
      const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // AI sometimes puts literal newlines/tabs inside JSON strings — fix them and retry
        parsed = JSON.parse(fixJsonControlChars(cleaned));
      }
      if (
        !Array.isArray(parsed) &&
        parsed !== null &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as Record<string, unknown>).cards)
      ) {
        parsed = (parsed as Record<string, unknown>).cards;
      }
      cards = Array.isArray(parsed) ? parsed : [parsed as (typeof cards)[0]];
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
          {' '}und optional{' '}
          <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">difficulty</code>
          {' '}(1–3, Standard 2).
        </p>
      </div>
      <form onSubmit={handleImport} className="flex flex-col gap-3">
        <textarea
          value={raw}
          onChange={(e) => { setRaw(e.target.value); setParseError(null); }}
          rows={8}
          placeholder={`[\n  {\n    "id": 42,\n    "question": "Was ist das OSI-Modell?",\n    "answer": "Ein Referenzmodell mit 7 Schichten...",\n    "difficulty": 2\n  }\n]`}
          className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 px-3 py-2 text-sm font-mono outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Kopiert!' : 'KI-Prompt kopieren'}
          </button>
        </div>

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
