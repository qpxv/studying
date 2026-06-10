import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { question, answer, userInput } = await req.json() as {
      question: string;
      answer: string;
      userInput: string;
    };

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: 'Du bist ein AP1-Lerncoach. Erkläre die Musterlösung klar und verständlich auf Deutsch. Antworte AUSSCHLIESSLICH mit validem JSON ohne Markdown-Codeblöcke: {"explanation":"string"}',
      messages: [
        {
          role: 'user',
          content: `Frage: ${question}\nMusterlösung: ${answer}\nAntwort des Lernenden: ${userInput}`,
        },
      ],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned) as { explanation: string };
    return Response.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    return Response.json({ error: message }, { status: 500 });
  }
}
