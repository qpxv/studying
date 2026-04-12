import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const BANK_FILE = path.resolve('./notes/quiz-bank.json');
const NOTES_FILE = path.resolve('./notes/generated-notes.md');
const PROGRESS_FILE = path.resolve('./notes/.improve-context-progress.json');
const MODEL = 'claude-haiku-4-5-20251001';
const BATCH_SIZE = 15;

interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
  topic: string;
}

interface QuizBank {
  generated: string;
  model: string;
  totalQuestions: number;
  questions: QuizQuestion[];
}

interface Progress {
  completedBatches: number[];
  improved: Record<string, { question: string; answer: string }>; // id -> improved q+a
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

const PRICING = { input: 0.80, output: 4.0, cacheWrite: 1.0, cacheRead: 0.08 };

function calcCostCents(usage: {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}): number {
  return (
    ((usage.input_tokens ?? 0) / 1_000_000) * PRICING.input +
    ((usage.output_tokens ?? 0) / 1_000_000) * PRICING.output +
    ((usage.cache_creation_input_tokens ?? 0) / 1_000_000) * PRICING.cacheWrite +
    ((usage.cache_read_input_tokens ?? 0) / 1_000_000) * PRICING.cacheRead
  ) * 100;
}

// ─── Progress helpers ─────────────────────────────────────────────────────────

function loadProgress(): Progress | null {
  if (!fs.existsSync(PROGRESS_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')); } catch { return null; }
}
function saveProgress(p: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2), 'utf-8');
}
function clearProgress() {
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
}

// ─── JSON parsing ─────────────────────────────────────────────────────────────

function parseImproved(raw: string): Array<{ id: string; question: string; answer: string }> {
  const stripped = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
  const start = stripped.indexOf('[');
  const end = stripped.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array found');
  const json = stripped.slice(start, end + 1);
  const parsed = JSON.parse(json) as unknown[];
  return parsed
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .filter(item => typeof item['id'] === 'string' && typeof item['question'] === 'string' && typeof item['answer'] === 'string')
    .map(item => ({ id: item['id'] as string, question: item['question'] as string, answer: item['answer'] as string }));
}

// ─── Processing ───────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Du bist ein Lernmaterial-Verbesserer für einen deutschen Universitätskurs in Management Grundlagen.

AUFGABE: Verbessere sowohl die FRAGE als auch die ANTWORT jedes Eintrags, damit ein Studierender den Inhalt ohne Vorwissen verstehen kann.

FRAGEN verbessern wenn:
- Die Frage zu allgemein ist und ohne Kontext nicht einordbar ("Welche Beispiele werden genannt?" → besser: "Welche konkreten Beispiele für politische Risiken wie Enteignung oder Kapitaltransfer werden im Risikomanagement genannt?")
- Der Bezug zum Thema fehlt ("Was sind die vier Stufen?" → besser: "Was sind die vier Stufen der risikopolitischen Gegenmaßnahmen im Risikomanagement?")
- Abkürzungen oder Fachbegriffe in der Frage nicht erklärt sind

ANTWORTEN verbessern wenn:
- Fachbegriffe ohne Erklärung stehen (z.B. "Enteignungsrisiko", "Transferrisiko", "Avalkredit")
- Beispiele kontextlos wirken (z.B. "z.B. Russland" ohne Erklärung was dort passierte)
- Statistiken ohne Hintergrund stehen (z.B. warum sanken Insolvenzen 2020-2022?)
- Gesetze/Paragraphen erwähnt werden ohne kurze Erklärung was sie bedeuten
- Historische Ereignisse oder Personen ohne Hintergrund referenziert werden

ÄNDERE NICHTS wenn Frage oder Antwort bereits vollständig und selbsterklärend ist.

REGELN:
- Fragen bleiben als Fragen formuliert, prägnant (1-2 Sätze)
- Antworten bleiben prägnant: max. 4-5 Sätze
- Nur auf Deutsch
- Gib NUR gültiges JSON zurück — kein Markdown, keine Erklärungen

FORMAT (strikt einhalten):
[{"id": "q001", "question": "...", "answer": "..."}, ...]

Falls ein Feld keine Verbesserung braucht, gib es unverändert zurück.`;

async function processBatch(
  client: Anthropic,
  questions: QuizQuestion[],
  notes: string,
  batchIndex: number,
  totalBatches: number
): Promise<{ improved: Array<{ id: string; question: string; answer: string }>; cents: number }> {
  const topic = questions[0]?.topic ?? 'Unbekannt';
  console.log(`  Batch ${batchIndex + 1}/${totalBatches}: ${topic} (${questions.length} Fragen)`);

  const questionsJson = JSON.stringify(
    questions.map(q => ({ id: q.id, question: q.question, answer: q.answer })),
    null, 2
  );

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Hier sind die Vorlesungsnotizen als Referenz:\n\n---\n${notes}\n---`,
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: `Verbessere nun folgende Frage-Antwort-Paare:\n\n${questionsJson}\n\nGib das Ergebnis als JSON-Array zurück.`,
          },
        ],
      },
    ],
  });

  const raw = response.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');

  let improved: Array<{ id: string; question: string; answer: string }> = [];
  try {
    improved = parseImproved(raw);
    const changedQ = improved.filter((imp, i) => imp.question !== questions[i]?.question).length;
    const changedA = improved.filter((imp, i) => imp.answer !== questions[i]?.answer).length;
    console.log(`    → ${improved.length} verarbeitet, ${changedQ} Fragen + ${changedA} Antworten verbessert`);
  } catch (err) {
    console.error(`    ✗ JSON parse fehlgeschlagen: ${err instanceof Error ? err.message : err}`);
    console.error(`    Raw (erste 300 Zeichen): ${raw.slice(0, 300)}`);
    // Fallback: return originals unchanged
    improved = questions.map(q => ({ id: q.id, question: q.question, answer: q.answer }));
  }

  const cents = calcCostCents(response.usage as Parameters<typeof calcCostCents>[0]);
  console.log(`    → ${cents.toFixed(3)}¢`);
  return { improved, cents };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-YOUR_KEY_HERE') {
    console.error('Fehler: Setze ANTHROPIC_API_KEY in der .env Datei.');
    process.exit(1);
  }

  if (!fs.existsSync(BANK_FILE)) {
    console.error(`Quiz-Bank nicht gefunden: ${BANK_FILE}\nFühre zuerst "npm run generate" aus.`);
    process.exit(1);
  }

  if (!fs.existsSync(NOTES_FILE)) {
    console.error(`Notizen-Datei nicht gefunden: ${NOTES_FILE}\nFühre zuerst "npm run create-notes" aus.`);
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  console.log('Lade Quiz-Bank...');
  const bank: QuizBank = JSON.parse(fs.readFileSync(BANK_FILE, 'utf-8'));
  console.log(`  ${bank.questions.length} Fragen geladen\n`);

  console.log('Lade Vorlesungsnotizen...');
  const notes = fs.readFileSync(NOTES_FILE, 'utf-8').replace(/^<!--.*?-->\n\n/s, '').trim();
  console.log(`  ${notes.length} Zeichen\n`);

  // Group questions by topic into batches
  const batches: QuizQuestion[][] = [];
  let currentBatch: QuizQuestion[] = [];
  let currentTopic = '';

  for (const q of bank.questions) {
    if (q.topic !== currentTopic && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
    }
    currentTopic = q.topic;
    currentBatch.push(q);

    if (currentBatch.length >= BATCH_SIZE) {
      batches.push(currentBatch);
      currentBatch = [];
    }
  }
  if (currentBatch.length > 0) batches.push(currentBatch);

  console.log(`${batches.length} Batches zu verarbeiten\n`);

  let progress: Progress = loadProgress() ?? { completedBatches: [], improved: {} };
  if (progress.completedBatches.length > 0) {
    console.log(`Fortschritt wiederhergestellt: ${progress.completedBatches.length}/${batches.length} Batches bereits fertig.\n`);
  }

  let totalCents = 0;

  for (let i = 0; i < batches.length; i++) {
    if (progress.completedBatches.includes(i)) {
      console.log(`  Batch ${i + 1}/${batches.length} überspringen (bereits fertig)`);
      continue;
    }

    const { improved, cents } = await processBatch(client, batches[i], notes, i, batches.length);
    totalCents += cents;

    for (const item of improved) {
      progress.improved[item.id] = { question: item.question, answer: item.answer };
    }
    progress.completedBatches.push(i);
    saveProgress(progress);
  }

  // Apply improvements back to the bank
  const updatedQuestions = bank.questions.map(q => ({
    ...q,
    question: progress.improved[q.id]?.question ?? q.question,
    answer: progress.improved[q.id]?.answer ?? q.answer,
  }));

  const updatedBank: QuizBank = {
    ...bank,
    generated: new Date().toISOString(),
    questions: updatedQuestions,
  };

  fs.writeFileSync(BANK_FILE, JSON.stringify(updatedBank, null, 2), 'utf-8');
  clearProgress();

  const changedQ = updatedQuestions.filter((q, i) => q.question !== bank.questions[i]?.question).length;
  const changedA = updatedQuestions.filter((q, i) => q.answer !== bank.questions[i]?.answer).length;

  console.log(`\n✓ Quiz-Bank gespeichert: ${BANK_FILE}`);
  console.log(`  ${changedQ} Fragen + ${changedA} Antworten verbessert (von ${updatedQuestions.length})`);
  console.log(`  Gesamtkosten: ${totalCents.toFixed(2)}¢`);
}

main().catch(err => {
  console.error('Fehler:', err.message ?? err);
  process.exit(1);
});
