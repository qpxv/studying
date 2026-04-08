import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const NOTES_FILE = path.resolve('./notes/generated-notes.md');
const BANK_FILE = path.resolve('./notes/quiz-bank.json');
const PROGRESS_FILE = path.resolve('./notes/.quiz-bank-progress.json');
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_SECTION_CHARS = 12000;

interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
  topic: string;
}

interface Progress {
  totalBatches: number;
  completedBatches: number[];
  batchQuestions: Record<number, QuizQuestion[]>;
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

// ─── Text splitting ───────────────────────────────────────────────────────────

function splitIntoSections(notes: string): Array<{ heading: string; content: string }> {
  const parts = notes.split(/^(## .+)$/m).filter(Boolean);
  const sections: Array<{ heading: string; content: string }> = [];

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('## ')) {
      const heading = parts[i].trim();
      const content = parts[i + 1]?.trim() ?? '';
      i++;

      // If section is too large, split further at ### boundaries
      if (content.length > MAX_SECTION_CHARS) {
        const subParts = content.split(/^(### .+)$/m).filter(Boolean);
        let currentHeading = heading;
        let currentContent = '';

        for (let j = 0; j < subParts.length; j++) {
          if (subParts[j].startsWith('### ')) {
            if (currentContent.trim()) {
              sections.push({ heading: currentHeading, content: currentContent.trim() });
            }
            currentHeading = `${heading} › ${subParts[j].trim()}`;
            currentContent = subParts[j + 1] ?? '';
            j++;
          } else {
            currentContent += subParts[j];
          }
        }
        if (currentContent.trim()) {
          sections.push({ heading: currentHeading, content: currentContent.trim() });
        }
      } else {
        sections.push({ heading, content });
      }
    }
  }

  // Fallback: if no ## headings found, treat entire notes as one section
  if (sections.length === 0) {
    sections.push({ heading: 'Management Grundlagen', content: notes.trim() });
  }

  return sections.filter(s => s.content.length > 50);
}

// ─── JSON parsing ─────────────────────────────────────────────────────────────

function parseJsonQuestions(raw: string): Array<{ question: string; answer: string }> {
  // Strip markdown fences
  const stripped = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
  const start = stripped.indexOf('[');
  const end = stripped.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array found');
  const json = stripped.slice(start, end + 1);
  const parsed = JSON.parse(json) as unknown[];
  return parsed
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .filter(item => typeof item['question'] === 'string' && typeof item['answer'] === 'string')
    .map(item => ({ question: item['question'] as string, answer: item['answer'] as string }));
}

// ─── Generation ───────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Du bist ein Quiz-Generator für einen deutschen Universitätskurs in Management Grundlagen.

Deine Aufgabe: Generiere 20–30 Frage-Antwort-Paare aus dem gegebenen Abschnitt der Vorlesungsnotizen.

Regeln:
- Decke JEDEN Begriff, jede Definition, jedes Modell, jede Zahl, jeden Namen, jedes Datum und jeden Randfall ab.
- Variiere die Fragetypen: Definitionen, Anwendung, Vergleich, Aufzählung, Zahlenabruf.
- Fragen und Antworten MÜSSEN auf Deutsch sein.
- Antworten: vollständig aber prägnant (2–4 Sätze).
- Keine doppelten Konzepte.
- Gib NUR gültiges JSON aus — keine Erklärungen, kein Markdown, kein Preamble.

Format (strikt einhalten):
[{"question": "...", "answer": "..."}, ...]`;

async function generateBatch(
  client: Anthropic,
  section: { heading: string; content: string },
  batchIndex: number,
  totalBatches: number
): Promise<{ questions: Array<{ question: string; answer: string }>; cents: number }> {
  console.log(`  Batch ${batchIndex + 1}/${totalBatches}: ${section.heading} (${section.content.length} chars)`);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Abschnitt: ${section.heading}\n\nNotizen:\n---\n${section.content}\n---\n\nGeneriere jetzt die JSON-Array mit Frage-Antwort-Paaren.`,
    }],
  });

  const raw = response.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');

  let questions: Array<{ question: string; answer: string }> = [];
  try {
    questions = parseJsonQuestions(raw);
    console.log(`    → ${questions.length} questions`);
  } catch (err) {
    console.error(`    ✗ JSON parse failed: ${err instanceof Error ? err.message : err}`);
    console.error(`    Raw (first 300 chars): ${raw.slice(0, 300)}`);
  }

  const cents = calcCostCents(response.usage as Parameters<typeof calcCostCents>[0]);
  console.log(`    → ${cents.toFixed(3)}¢`);
  return { questions, cents };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-YOUR_KEY_HERE') {
    console.error('Error: Set ANTHROPIC_API_KEY in your .env file.');
    process.exit(1);
  }

  if (!fs.existsSync(NOTES_FILE)) {
    console.error(`Notes file not found: ${NOTES_FILE}\nRun "npm run create-notes" first.`);
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  console.log('Reading notes...');
  const notes = fs.readFileSync(NOTES_FILE, 'utf-8').replace(/^<!--.*?-->\n\n/s, '').trim();

  console.log('Splitting into sections...');
  const sections = splitIntoSections(notes);
  console.log(`  Found ${sections.length} sections/batches\n`);

  let progress = loadProgress();
  if (progress && progress.totalBatches !== sections.length) {
    console.log('Section count changed — starting fresh.\n');
    progress = null;
  }
  if (!progress) {
    progress = { totalBatches: sections.length, completedBatches: [], batchQuestions: {} };
  } else if (progress.completedBatches.length > 0) {
    console.log(`Resuming: ${progress.completedBatches.length}/${sections.length} batches already done.\n`);
  }

  let totalCents = 0;

  for (let i = 0; i < sections.length; i++) {
    if (progress.completedBatches.includes(i)) {
      console.log(`  Skipping batch ${i + 1}/${sections.length} (already done)`);
      continue;
    }

    const { questions, cents } = await generateBatch(client, sections[i], i, sections.length);
    totalCents += cents;

    progress.batchQuestions[i] = questions.map(q => ({
      id: 'PLACEHOLDER',
      question: q.question,
      answer: q.answer,
      topic: sections[i].heading.replace(/^## /, '').replace(/^### /, ''),
    }));
    progress.completedBatches.push(i);
    saveProgress(progress);
  }

  // Flatten all batches and assign sequential IDs
  const allQuestions: QuizQuestion[] = [];
  for (let i = 0; i < sections.length; i++) {
    const batch = progress.batchQuestions[i] ?? [];
    for (const q of batch) {
      const id = `q${String(allQuestions.length + 1).padStart(3, '0')}`;
      allQuestions.push({ ...q, id });
    }
  }

  const bank = {
    generated: new Date().toISOString(),
    model: MODEL,
    totalQuestions: allQuestions.length,
    questions: allQuestions,
  };

  fs.writeFileSync(BANK_FILE, JSON.stringify(bank, null, 2), 'utf-8');
  clearProgress();

  console.log(`\n✓ Quiz bank saved: ${BANK_FILE}`);
  console.log(`  ${allQuestions.length} questions across ${sections.length} sections`);
  console.log(`  Total cost: ${totalCents.toFixed(2)}¢`);
}

main().catch(err => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
