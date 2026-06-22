import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-6';
const CONCURRENCY = 8;
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

const PRICING = { input: 3.0, output: 15.0 }; // sonnet per million tokens

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExtractedCard {
  karteikartenNr: number;
  side: 'question' | 'answer';
  text: string;
  difficulty?: number;
}

interface MergedCard {
  karteikartenNr: number;
  question: string;
  answer: string;
  difficulty: number;
}

interface IncompleteCard {
  karteikartenNr: number;
  missingSide: 'question' | 'answer';
  presentText: string;
  difficulty: number;
}

interface OutputFile {
  generated: string;
  model: string;
  totalCards: number;
  incomplete: IncompleteCard[];
  unmatched: ExtractedCard[];
  cards: MergedCard[];
}

// ─── Args ────────────────────────────────────────────────────────────────────

function parseArgs(): { imagePaths: string[]; outputPath: string } {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: npm run import-karteikarten -- <folder-or-files...> [--output <path>]');
    console.error('  npm run import-karteikarten -- ./images/');
    console.error('  npm run import-karteikarten -- img1.jpg img2.jpg --output ./out.json');
    process.exit(1);
  }

  let outputPath = './karteikarten-import.json';
  const rawPaths: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[++i];
    } else {
      rawPaths.push(args[i]);
    }
  }

  const imagePaths: string[] = [];
  for (const p of rawPaths) {
    const resolved = path.resolve(p);
    if (!fs.existsSync(resolved)) {
      console.error(`Path not found: ${resolved}`);
      process.exit(1);
    }
    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      const files = fs.readdirSync(resolved)
        .filter(f => !f.startsWith('.') && IMAGE_EXTS.includes(path.extname(f).toLowerCase()))
        .sort()
        .map(f => path.join(resolved, f));
      imagePaths.push(...files);
    } else {
      imagePaths.push(resolved);
    }
  }

  if (imagePaths.length === 0) {
    console.error('No image files found (.jpg .jpeg .png .webp).');
    process.exit(1);
  }

  return { imagePaths, outputPath };
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a strict OCR transcription tool for physical Karteikarten (flashcards).
Return ONLY a valid JSON array — no prose, no markdown fences, no explanation.`;

const USER_PROMPT = `This image shows one side of physical flashcards (Karteikarten).

First determine whether it shows QUESTION sides or ANSWER sides:
- Question sides: contain a task, problem, or question to answer
- Answer sides: contain explanations, solution steps, lists, tables, or answers

For EACH card visible in the image, return one JSON object in an array:
{
  "karteikartenNr": <integer printed on the card, or 0 if you cannot read it>,
  "side": "question" or "answer",
  "text": "<verbatim transcription of ALL text on this side — preserve line breaks as \\n>",
  "difficulty": <1, 2, or 3 — count the filled-in dots on the card; only include for question side, default 2>
}

SPECIAL RULES:
- Tables → convert to valid HTML <table><tr><td>...</td></tr></table> inside the string
- Diagrams or images → insert [IMAGE: brief description] where the visual appears
- Transcribe VERBATIM — do NOT correct spelling, grammar, or formatting
- If a card is partially cut off or unreadable, do not include it in your output
- Return ONLY the JSON array, nothing else`;

// ─── Claude call ─────────────────────────────────────────────────────────────

async function processImage(
  client: Anthropic,
  imagePath: string
): Promise<{ cards: ExtractedCard[]; inputTokens: number; outputTokens: number }> {
  const ext = path.extname(imagePath).toLowerCase();
  const mediaType =
    ext === '.png' ? 'image/png' :
    ext === '.webp' ? 'image/webp' :
    'image/jpeg';

  const buffer = fs.readFileSync(imagePath);
  const base64 = buffer.toString('base64');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          { type: 'text', text: USER_PROMPT },
        ],
      },
    ],
  });

  const raw = response.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');

  let cards: ExtractedCard[] = [];
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      cards = parsed.map(c => ({
        karteikartenNr: typeof c.karteikartenNr === 'number' ? c.karteikartenNr : 0,
        side: c.side === 'answer' ? 'answer' : 'question',
        text: typeof c.text === 'string' ? c.text : '',
        difficulty: typeof c.difficulty === 'number' ? c.difficulty : 2,
      }));
    }
  } catch {
    console.error(`  Warning: could not parse JSON for ${path.basename(imagePath)}`);
  }

  return {
    cards,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// ─── Concurrency pool ────────────────────────────────────────────────────────

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
  onDone: (index: number, result: T) => void
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      const result = await tasks[i]();
      results[i] = result;
      onDone(i, result);
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ─── Merge ───────────────────────────────────────────────────────────────────

function mergeCards(all: ExtractedCard[]): {
  cards: MergedCard[];
  incomplete: IncompleteCard[];
  unmatched: ExtractedCard[];
} {
  const unmatched: ExtractedCard[] = [];
  const byNr = new Map<number, { questions: ExtractedCard[]; answers: ExtractedCard[] }>();

  for (const card of all) {
    if (card.karteikartenNr === 0) {
      unmatched.push(card);
      continue;
    }
    if (!byNr.has(card.karteikartenNr)) {
      byNr.set(card.karteikartenNr, { questions: [], answers: [] });
    }
    const bucket = byNr.get(card.karteikartenNr)!;
    if (card.side === 'question') bucket.questions.push(card);
    else bucket.answers.push(card);
  }

  const cards: MergedCard[] = [];
  const incomplete: IncompleteCard[] = [];

  const sortedNrs = [...byNr.keys()].sort((a, b) => a - b);

  for (const nr of sortedNrs) {
    const { questions, answers } = byNr.get(nr)!;
    const q = questions[0];
    const a = answers[0];

    if (q && a) {
      cards.push({
        karteikartenNr: nr,
        question: q.text,
        answer: a.text,
        difficulty: q.difficulty ?? 2,
      });
    } else if (q) {
      incomplete.push({ karteikartenNr: nr, missingSide: 'answer', presentText: q.text, difficulty: q.difficulty ?? 2 });
    } else if (a) {
      incomplete.push({ karteikartenNr: nr, missingSide: 'question', presentText: a.text, difficulty: 2 });
    }

    if (questions.length > 1 || answers.length > 1) {
      console.error(`  Warning: card #${nr} has ${questions.length} question(s) and ${answers.length} answer(s) — using first of each`);
    }
  }

  return { cards, incomplete, unmatched };
}

// ─── Cost ────────────────────────────────────────────────────────────────────

function calcCostCents(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICING.input +
    (outputTokens / 1_000_000) * PRICING.output
  ) * 100;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-YOUR_KEY_HERE') {
    console.error('Error: Set ANTHROPIC_API_KEY in your .env file.');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const { imagePaths, outputPath } = parseArgs();

  console.log(`Found ${imagePaths.length} images — processing with concurrency ${CONCURRENCY}...\n`);

  let completed = 0;
  let totalInput = 0;
  let totalOutput = 0;
  const allExtracted: ExtractedCard[] = [];

  const tasks = imagePaths.map((imgPath) => async () => {
    return processImage(client, imgPath);
  });

  const results = await runWithConcurrency(tasks, CONCURRENCY, (i, result) => {
    completed++;
    const fileName = path.basename(imagePaths[i]);
    const sides = result.cards.length > 0
      ? `${result.cards.length} cards (${result.cards[0].side} side)`
      : 'no cards extracted';
    const pad = String(completed).padStart(String(imagePaths.length).length, ' ');
    console.log(`  [${pad}/${imagePaths.length}] ${fileName} → ${sides}`);
  });

  for (const result of results) {
    allExtracted.push(...result.cards);
    totalInput += result.inputTokens;
    totalOutput += result.outputTokens;
  }

  console.log(`\nMerging ${allExtracted.length} extracted cards...`);

  const { cards, incomplete, unmatched } = mergeCards(allExtracted);

  console.log(`  Complete pairs:  ${cards.length}`);
  if (incomplete.length > 0) console.log(`  Incomplete:      ${incomplete.length} (missing one side)`);
  if (unmatched.length > 0)  console.log(`  Unmatched:       ${unmatched.length} (karteikartenNr = 0)`);

  const output: OutputFile = {
    generated: new Date().toISOString(),
    model: MODEL,
    totalCards: cards.length,
    incomplete,
    unmatched,
    cards,
  };

  const outResolved = path.resolve(outputPath);
  fs.writeFileSync(outResolved, JSON.stringify(output, null, 2), 'utf-8');

  const cost = calcCostCents(totalInput, totalOutput);
  console.log(`\nSaved → ${outResolved}`);
  console.log(`Tokens — input: ${totalInput.toLocaleString()}, output: ${totalOutput.toLocaleString()}`);
  console.log(`Cost: ~${cost.toFixed(2)}¢`);
}

main().catch((err) => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
