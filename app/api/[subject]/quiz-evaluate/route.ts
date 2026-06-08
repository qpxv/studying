import Anthropic from '@anthropic-ai/sdk';
import { type NextRequest } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PRICING = { input: 0.80, output: 4.0 };

function calcCostCents(usage: { input_tokens: number; output_tokens: number }): number {
  return (
    (usage.input_tokens / 1_000_000) * PRICING.input +
    (usage.output_tokens / 1_000_000) * PRICING.output
  ) * 100;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  management: `Du bist ein motivierender Lernbegleiter für einen deutschen Universitätskurs in Management Grundlagen.

Deine Aufgabe: Bewerte die Antwort des Studenten — wohlwollend, ermutigend und fair.

Regeln:
- Bewerte den Kern der Antwort, nicht die exakte Wortwahl. Wer die Idee verstanden hat, hat Recht.
- Richtig oder im Wesentlichen richtig: Freu dich mit dem Studenten! Ergänze locker ein wichtiges Detail, falls etwas fehlt.
- Teilweise richtig: Lob was gut war, erkläre kurz und freundlich was noch fehlt oder leicht daneben lag.
- Falsch: Bleib nett, mach keine große Sache draus — erkläre einfach verständlich die richtige Antwort.
- Kein Demütigen, kein Meckern, keine Punktabzüge für fehlende Buzzwords.
- Antworte IMMER auf Deutsch.
- Maximal 4 Sätze. Kein Preamble, keine Meta-Kommentare.`,

  sql: `Du bist ein motivierender Lernbegleiter für einen deutschen Datenbankgrundlagen-Kurs (SQL).

Deine Aufgabe: Bewerte die Antwort des Studenten — wohlwollend, ermutigend und fair.

Regeln:
- Bewerte den Kern der Antwort, nicht die exakte Wortwahl. Wer das Konzept verstanden hat, hat Recht.
- Richtig oder im Wesentlichen richtig: Freu dich mit dem Studenten! Ergänze locker ein wichtiges Detail, falls etwas fehlt.
- Teilweise richtig: Lob was gut war, erkläre kurz und freundlich was noch fehlt oder leicht daneben lag.
- Falsch: Bleib nett, mach keine große Sache draus — erkläre einfach verständlich die richtige Antwort.
- Bei SQL-Syntax-Fragen: zeige die korrekte Schreibweise kurz und klar.
- Antworte IMMER auf Deutsch.
- Maximal 4 Sätze. Kein Preamble, keine Meta-Kommentare.`,
};

const DEFAULT_SYSTEM_PROMPT = `Du bist ein motivierender Lernbegleiter für einen deutschen Universitätskurs.

Deine Aufgabe: Bewerte die Antwort des Studenten — wohlwollend, ermutigend und fair.

Regeln:
- Bewerte den Kern der Antwort, nicht die exakte Wortwahl.
- Richtig oder im Wesentlichen richtig: Freu dich mit dem Studenten! Ergänze locker ein wichtiges Detail, falls etwas fehlt.
- Teilweise richtig: Lob was gut war, erkläre kurz und freundlich was noch fehlt.
- Falsch: Bleib nett — erkläre einfach verständlich die richtige Antwort.
- Antworte IMMER auf Deutsch.
- Maximal 4 Sätze. Kein Preamble, keine Meta-Kommentare.`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ subject: string }> }
) {
  const { subject } = await params;
  const { question, correctAnswer, userAnswer } = await req.json() as {
    question: string;
    correctAnswer: string;
    userAnswer: string;
  };

  const systemPrompt = SYSTEM_PROMPTS[subject] ?? DEFAULT_SYSTEM_PROMPT;
  const userMessage = `Frage: ${question}\n\nMusterlösung: ${correctAnswer}\n\nAntwort des Studenten: ${userAnswer}\n\nBewerte die Antwort.`;

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        const stream = client.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          system: systemPrompt,
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
