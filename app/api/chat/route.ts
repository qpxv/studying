import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Cache notes in memory — loaded once per server process, not on every request
let cachedNotes: string | null = null;
function loadNotes(): string {
  if (cachedNotes !== null) return cachedNotes;
  const notesPath = path.join(process.cwd(), 'notes', 'generated-notes.md');
  if (!fs.existsSync(notesPath)) { cachedNotes = ''; return ''; }
  cachedNotes = fs.readFileSync(notesPath, 'utf-8').replace(/^<!--[\s\S]*?-->\n\n/, '').trim();
  return cachedNotes;
}

const SYSTEM_INSTRUCTIONS = `You are a helpful study assistant for a university management fundamentals course. Answer questions clearly and concisely. If the student asks about course material, use the provided notes as your primary source. ALWAYS respond in German, no matter what language the student writes in.`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const notes = loadNotes();

  // Split system into instructions + notes with cache_control on the notes block.
  // This means the notes (which are large) are only billed at cache-read price
  // (~8x cheaper) on every request after the first.
  const system: Anthropic.Messages.TextBlockParam[] = [
    { type: 'text', text: SYSTEM_INSTRUCTIONS },
    ...(notes
      ? [{
          type: 'text' as const,
          text: `Course notes:\n\n${notes}`,
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
          max_tokens: 2048,
          system,
          messages,
        });
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(enc.encode(chunk.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(enc.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
