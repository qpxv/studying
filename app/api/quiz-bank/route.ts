import fs from 'fs';
import path from 'path';

export interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
  topic: string;
}

let cachedBank: QuizQuestion[] | null = null;

function loadBank(): QuizQuestion[] {
  if (cachedBank !== null) return cachedBank;
  const bankPath = path.join(process.cwd(), 'notes', 'quiz-bank.json');
  if (!fs.existsSync(bankPath)) {
    throw new Error('quiz-bank.json not found. Run: npm run generate-quiz-bank');
  }
  const raw = JSON.parse(fs.readFileSync(bankPath, 'utf-8')) as { questions: QuizQuestion[] };
  cachedBank = raw.questions;
  return cachedBank;
}

export async function GET() {
  try {
    const questions = loadBank();
    return Response.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load quiz bank';
    return Response.json({ error: message }, { status: 500 });
  }
}
