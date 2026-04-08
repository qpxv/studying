import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// claude-haiku-4-5 pricing (per million tokens)
const PRICING = {
  input: 0.80,
  output: 4.0,
  cacheWrite: 1.0,
  cacheRead: 0.08,
};

function calcCostCents(usage: {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}): number {
  const input = ((usage.input_tokens ?? 0) / 1_000_000) * PRICING.input;
  const output = ((usage.output_tokens ?? 0) / 1_000_000) * PRICING.output;
  const cacheWrite = ((usage.cache_creation_input_tokens ?? 0) / 1_000_000) * PRICING.cacheWrite;
  const cacheRead = ((usage.cache_read_input_tokens ?? 0) / 1_000_000) * PRICING.cacheRead;
  return (input + output + cacheWrite + cacheRead) * 100;
}

const QUIZ_INSTRUCTIONS = `You are a brutal exam examiner for a university management fundamentals course.

Your rules:
- Ask EXACTLY ONE question per turn. Never ask multiple questions at once.
- Rotate randomly through ALL topics, subtopics, and minor details in the notes — specific names, dates, numbers, definitions, models, exceptions, edge cases.
- Never repeat a question you already asked in this session.
- After the student answers: evaluate strictly and specifically.
  * Correct: confirm in one sentence, then add any nuance they missed.
  * Partially correct: specify exactly what was right and what was wrong or missing.
  * Wrong: explain the correct answer clearly and directly. No sugarcoating.
- Do NOT give hints before the student answers.
- Do NOT be encouraging or gentle. Be direct and precise like a strict German professor.
- Always end your evaluation with the next question immediately.
- On the very first message, just ask the first question directly with no preamble.
- ALWAYS respond in German, no matter what language the student writes in.`;

// Cache notes in memory
let cachedNotes: string | null = null;
function loadNotes(): string {
  if (cachedNotes !== null) return cachedNotes;
  const notesPath = path.join(process.cwd(), 'notes', 'generated-notes.md');
  if (!fs.existsSync(notesPath)) { cachedNotes = ''; return ''; }
  cachedNotes = fs.readFileSync(notesPath, 'utf-8').replace(/^<!--[\s\S]*?-->\n\n/, '').trim();
  return cachedNotes;
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const notes = loadNotes();

  const system: Anthropic.Messages.TextBlockParam[] = [
    { type: 'text', text: QUIZ_INSTRUCTIONS },
    ...(notes
      ? [{
          type: 'text' as const,
          text: `Study notes — quiz the student on everything in here:\n\n---\n\n${notes}\n\n---`,
          cache_control: { type: 'ephemeral' as const },
        }]
      : []),
  ];

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const stream = client.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system,
          messages,
        });
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(enc.encode(chunk.delta.text));
          }
        }
        const final = await stream.finalMessage();
        const cents = calcCostCents(final.usage as Parameters<typeof calcCostCents>[0]);
        controller.enqueue(enc.encode(`\n\x00USAGE:${cents.toFixed(4)}`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(enc.encode(`[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
