import fs from 'fs';
import path from 'path';
import { type NextRequest } from 'next/server';

export interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
  topic: string;
}

const cache: Record<string, QuizQuestion[]> = {};

function loadBank(subject: string): QuizQuestion[] {
  if (cache[subject]) return cache[subject];
  const bankPath = path.join(process.cwd(), 'subjects', subject, 'notes', 'quiz-bank.json');
  if (!fs.existsSync(bankPath)) {
    throw new Error(`quiz-bank.json not found for "${subject}". Run: npm run generate -- ${subject}`);
  }
  const raw = JSON.parse(fs.readFileSync(bankPath, 'utf-8')) as { questions: QuizQuestion[] };
  cache[subject] = raw.questions;
  return cache[subject];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ subject: string }> }
) {
  const { subject } = await params;
  try {
    const questions = loadBank(subject);
    return Response.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load quiz bank';
    return Response.json({ error: message }, { status: 500 });
  }
}
