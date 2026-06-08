import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PRICING = { input: 0.80, output: 4.0 };

function calcCostCents(usage: { input_tokens: number; output_tokens: number }): number {
  return (
    (usage.input_tokens / 1_000_000) * PRICING.input +
    (usage.output_tokens / 1_000_000) * PRICING.output
  ) * 100;
}

const SYSTEM_PROMPT = `Du bist ein SQL-Übungsgenerator für einen deutschen Datenbankgrundlagen-Kurs.

Erstelle eine neue SQL-Übungsaufgabe. Variiere das Szenario bei jeder Aufgabe (z.B. Online-Shop, Bibliothek, Schule, HR-System, Krankenhaus, Videoverleih, Restaurant, Flughafen, Sportstudio, etc.) und den SQL-Schwerpunkt (SELECT/WHERE, JOINs, GROUP BY/HAVING, Aggregatfunktionen, Subqueries, ORDER BY/LIMIT, etc.).

Format (strikt einhalten):
- 1–3 zusammenhängende Markdown-Tabellen mit je 5–7 realistischen Datenzeilen
- Danach eine Zeile: **Aufgabe:** [klare Aufgabenstellung auf Deutsch]

Kein Preamble, keine Erklärungen, keine Überschriften außer den Tabellennamen — nur Tabellen und Aufgabe.`;

export async function POST() {
  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const stream = client.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: 'Generiere eine neue Aufgabe.' }],
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
