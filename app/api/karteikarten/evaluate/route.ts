import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      question: string;
      answer: string;
      userInput: string;
      includeExplanation?: boolean;
    };
    const { question, answer, userInput } = body;
    const inclExp = Boolean(body.includeExplanation);

    const system = `Du bist ein fairer AP1-Prüfer für Fachinformatiker. Antworte AUSSCHLIESSLICH mit validem JSON (kein Markdown, keine Codeblöcke, nur reines JSON).
Pflichtfelder: {"score":"gut"|"mittel"|"schlecht","reasoning":"string"${inclExp ? ',"explanation":"string"' : ''}}
Bewertungsregeln:
- "gut": Kernaussage korrekt erfasst, auch bei abweichender Formulierung
- "mittel": Teilweise richtig oder wichtige Aspekte fehlen
- "schlecht": Inhaltlich falsch, unvollständig oder leer`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system,
      messages: [
        {
          role: 'user',
          content: `Frage: ${question}\nMusterlösung: ${answer}\nAntwort des Lernenden: ${userInput}${inclExp ? '\nBitte auch eine ausführliche Erklärung der Musterlösung hinzufügen.' : ''}`,
        },
      ],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned) as {
      score: string;
      reasoning: string;
      explanation?: string;
    };

    return Response.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    return Response.json({ error: message }, { status: 500 });
  }
}
