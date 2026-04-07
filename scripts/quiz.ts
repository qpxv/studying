import Anthropic from '@anthropic-ai/sdk';
import readline from 'readline';
import path from 'path';
import { readNotesFile } from './lib/file-reader.js';

const NOTES_FILE = path.resolve('./notes/generated-notes.md');
const MODEL = 'claude-opus-4-6';
const MAX_HISTORY = 40; // 20 Q&A pairs — sliding window to avoid context overflow

const QUIZ_INSTRUCTIONS = `You are a brutal exam examiner for a university management fundamentals course.

Your rules:
- Ask EXACTLY ONE question per turn. Never ask multiple questions at once.
- Do NOT ask the question in your very first response — wait for the user to say "ready" or similar, then start.
- Rotate randomly through ALL topics, subtopics, and minor details in the notes — specific names, dates, numbers, definitions, models, exceptions, edge cases.
- Never repeat a question you already asked in this session.
- After the student answers: evaluate strictly and specifically.
  * Correct: confirm in one sentence, then add any nuance they missed.
  * Partially correct: specify exactly what was right and what was wrong or missing.
  * Wrong: explain the correct answer clearly and directly. No sugarcoating.
- Do NOT give hints before the student answers.
- Do NOT be encouraging or gentle. Be direct and precise like a strict German professor.
- Always end your evaluation with "NEXT:" on its own line before asking the next question.

Example format:
  [Your evaluation of their answer]

  NEXT:
  [Your next question]`;

function buildSystemPrompt(notes: string): Anthropic.Messages.MessageParam['content'] {
  return [
    {
      type: 'text',
      text: QUIZ_INSTRUCTIONS,
    },
    {
      type: 'text',
      text: `Study notes — quiz the student on everything in here:\n\n---\n\n${notes}\n\n---`,
      // @ts-expect-error cache_control is a valid field in the API but not yet in all SDK type definitions
      cache_control: { type: 'ephemeral' },
    },
  ];
}

function ask(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer));
  });
}

function trimHistory(messages: Anthropic.Messages.MessageParam[]) {
  if (messages.length > MAX_HISTORY) {
    // Keep the initial user kick-off (index 0) and trim from index 1
    messages.splice(1, messages.length - MAX_HISTORY);
  }
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-YOUR_KEY_HERE') {
    console.error('Error: Set ANTHROPIC_API_KEY in your .env file.');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  console.log('\nLoading notes...');
  const notes = readNotesFile(NOTES_FILE);
  const systemPrompt = buildSystemPrompt(notes);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  let exiting = false;
  rl.on('close', () => {
    if (!exiting) {
      console.log('\n\nQuiz ended. Get back to studying.\n');
    }
    process.exit(0);
  });

  process.on('SIGINT', () => {
    exiting = true;
    console.log('\n\nQuiz ended. Get back to studying.\n');
    process.exit(0);
  });

  console.log('\n');
  console.log('═'.repeat(50));
  console.log('  MANAGEMENT GRUNDLAGEN — QUIZ');
  console.log('  Press Ctrl+C to exit');
  console.log('═'.repeat(50));
  console.log('\nNotes loaded. Type anything to begin.\n');

  await ask(rl, '> ');

  const messages: Anthropic.Messages.MessageParam[] = [
    { role: 'user', content: 'I am ready. Start the quiz. Ask me the first question.' },
  ];

  let questionCount = 0;

  while (true) {
    // Get question (or first question + subsequent ones)
    let responseText = '';

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt as Anthropic.Messages.MessageParam[],
      messages,
    });

    if (questionCount === 0) {
      process.stdout.write('\n');
    }

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        process.stdout.write(chunk.delta.text);
        responseText += chunk.delta.text;
      }
    }

    const finalMsg = await stream.finalMessage();
    messages.push({ role: 'assistant', content: finalMsg.content });

    questionCount++;

    console.log('\n');

    // Get user's answer
    const answer = await ask(rl, 'Your answer: ');

    if (!answer.trim()) {
      messages.push({ role: 'user', content: '(no answer provided — please evaluate as wrong and move on)' });
    } else {
      messages.push({ role: 'user', content: answer });
    }

    console.log('');
    trimHistory(messages);
  }
}

main().catch((err) => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
