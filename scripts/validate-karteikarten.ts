import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const MODEL = 'claude-haiku-4-5-20251001';
const BATCH_SIZE = 20;
const PRICING = { input: 0.80, output: 4.0 };

interface MergedCard {
  id: number;
  question: string;
  answer: string;
  difficulty: number;
}

interface InputFile {
  cards: MergedCard[];
  incomplete: unknown[];
  unmatched: unknown[];
  [key: string]: unknown;
}

const INPUT_PATH = path.resolve('./karteikarten-import.json');
const OUTPUT_PATH = path.resolve('./karteikarten-import.json');

const SYSTEM_PROMPT = `You validate German flashcard pairs (Frage/Antwort) for correctness.
Return ONLY a valid JSON array — no prose, no markdown fences.`;

function buildBatchPrompt(cards: MergedCard[]): string {
  const pairs = cards.map(c => {
    const q = c.question.slice(0, 300).replace(/\n/g, ' ');
    const a = c.answer.slice(0, 300).replace(/\n/g, ' ');
    return `Nr ${c.id}:\nFRAGE: ${q}\nANTWORT: ${a}`;
  }).join('\n\n---\n\n');

  return `For each flashcard pair below, determine whether the ANTWORT (answer) actually answers the FRAGE (question).
Mark valid: false if they are clearly about different topics or do not belong together.

Return a JSON array with one object per pair:
[{ "id": <number>, "valid": <true|false> }]

Pairs to check:

${pairs}`;
}

async function validateBatch(
  client: Anthropic,
  cards: MergedCard[]
): Promise<Map<number, boolean>> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildBatchPrompt(cards) }],
  });

  const raw = response.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');

  const result = new Map<number, boolean>();
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (typeof item.id === 'number') {
          result.set(item.id, item.valid === true);
        }
      }
    }
  } catch {
    console.error('  Warning: could not parse validation response for this batch');
    // If parsing fails, conservatively mark all as invalid
    for (const c of cards) result.set(c.id, false);
  }

  return result;
}

function calcCostCents(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICING.input +
    (outputTokens / 1_000_000) * PRICING.output
  ) * 100;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-YOUR_KEY_HERE') {
    console.error('Error: Set ANTHROPIC_API_KEY in your .env file.');
    process.exit(1);
  }

  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Not found: ${INPUT_PATH}\nRun import-karteikarten first.`);
    process.exit(1);
  }

  const data: InputFile = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
  const cards = data.cards as MergedCard[];
  console.log(`Validating ${cards.length} complete pairs...\n`);

  const client = new Anthropic({ apiKey });
  const validMap = new Map<number, boolean>();
  let totalInput = 0;
  let totalOutput = 0;

  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(cards.length / BATCH_SIZE);
    process.stdout.write(`  Batch ${batchNum}/${totalBatches}...`);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildBatchPrompt(batch) }],
    });

    totalInput += response.usage.input_tokens;
    totalOutput += response.usage.output_tokens;

    const raw = response.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');

    try {
      const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item.id === 'number') {
            validMap.set(item.id, item.valid === true);
          }
        }
      }
    } catch {
      console.error('\n  Warning: parse error on batch — marking all invalid');
      for (const c of batch) validMap.set(c.id, false);
    }

    const batchValid = batch.filter(c => validMap.get(c.id) === true).length;
    console.log(` ${batchValid}/${batch.length} valid`);
  }

  const validCards = cards.filter(c => validMap.get(c.id) === true);
  const removedCards = cards.filter(c => validMap.get(c.id) !== true);

  console.log(`\nResults:`);
  console.log(`  Kept:    ${validCards.length} correctly paired cards`);
  console.log(`  Removed: ${removedCards.length} mismatched cards`);

  if (removedCards.length > 0) {
    console.log('\nRemoved card numbers:', removedCards.map(c => c.id).join(', '));
  }

  const cleaned = {
    ...data,
    generated: new Date().toISOString(),
    totalCards: validCards.length,
    cards: validCards,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cleaned, null, 2), 'utf-8');

  const cost = calcCostCents(totalInput, totalOutput);
  console.log(`\nSaved → ${OUTPUT_PATH}`);
  console.log(`Cost: ~${cost.toFixed(2)}¢`);
}

main().catch(err => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
