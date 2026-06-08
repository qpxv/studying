import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PRICING = { input: 0.80, output: 4.0 };

function calcCostCents(usage: { input_tokens: number; output_tokens: number }): number {
  return (
    (usage.input_tokens / 1_000_000) * PRICING.input +
    (usage.output_tokens / 1_000_000) * PRICING.output
  ) * 100;
}

const SYSTEM_PROMPT = `Du bist ein SQL-Tutor für einen deutschen Datenbankgrundlagen-Kurs.

Du bekommst eine Übungsaufgabe (Tabellen + Aufgabenstellung) sowie die SQL-Query des Studenten.

Regeln:
- Richtig: Kurze Bestätigung, optional ein Stil-Tipp.
- Teilweise richtig: Lob was stimmt, erkläre kurz was fehlt oder falsch ist.
- Falsch oder leer: Bleib nett, erkläre das Problem und zeige die korrekte Query.
- SQL immer in Markdown-Codeblöcken (\`\`\`sql).
- Maximal 5 Sätze. Nur auf Deutsch. Kein Preamble.`;

export async function POST(req: Request) {
  const { exercise, userQuery } = await req.json() as {
    exercise: string;
    userQuery: string;
  };

  const userMessage = `Übungsaufgabe:\n${exercise}\n\nQuery des Studenten:\n\`\`\`sql\n${userQuery}\n\`\`\`\n\nBewerte die Query.`;

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const stream = client.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        });
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(enc.encode(chunk.delta.text));
          }
        }
        const final = await stream.finalMessage();
        const cents = calcCostCents(final.usage);
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
