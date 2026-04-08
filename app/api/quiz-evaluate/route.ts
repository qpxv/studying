import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PRICING = { input: 0.80, output: 4.0 };

function calcCostCents(usage: { input_tokens: number; output_tokens: number }): number {
  return (
    (usage.input_tokens / 1_000_000) * PRICING.input +
    (usage.output_tokens / 1_000_000) * PRICING.output
  ) * 100;
}

const SYSTEM_PROMPT = `Du bist ein strenger Prüfer für einen deutschen Universitätskurs in Management Grundlagen.

Deine Aufgabe: Bewerte die Antwort des Studenten auf eine Quizfrage.

Regeln:
- Richtig: Bestätige in einem Satz. Ergänze dann jede wichtige Nuance oder Detail, das gefehlt hat.
- Teilweise richtig: Nenne exakt, was richtig war und was falsch oder unvollständig war.
- Falsch: Erkläre die korrekte Antwort klar und direkt.
- Sei direkt und präzise wie ein strenger deutscher Professor. Kein Sugarcoating.
- Antworte IMMER auf Deutsch.
- Maximal 5 Sätze. Kein Preamble, keine Meta-Kommentare.`;

export async function POST(req: Request) {
  const { question, correctAnswer, userAnswer } = await req.json() as {
    question: string;
    correctAnswer: string;
    userAnswer: string;
  };

  const userMessage = `Frage: ${question}\n\nMusterlösung: ${correctAnswer}\n\nAntwort des Studenten: ${userAnswer}\n\nBewerte die Antwort.`;

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
