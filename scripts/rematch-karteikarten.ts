import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

// Usage: npm run rematch-karteikarten
// Reads karteikarten-import.json, takes all incomplete + unmatched cards,
// and uses Claude to semantically match questions with answers by topic/content.
// Appends newly matched pairs to the cards array and saves back.

const MODEL = 'claude-sonnet-4-6';
const PRICING = { input: 3.0, output: 15.0 };

interface ExtractedCard {
  karteikartenNr: number;
  side: 'question' | 'answer';
  text: string;
  difficulty?: number;
}

interface IncompleteCard {
  karteikartenNr: number;
  missingSide: 'question' | 'answer';
  presentText: string;
  difficulty: number;
}

interface MergedCard {
  karteikartenNr: number;
  question: string;
  answer: string;
  difficulty: number;
}

interface InputFile {
  cards: MergedCard[];
  incomplete: IncompleteCard[];
  unmatched: ExtractedCard[];
  [key: string]: unknown;
}

interface MatchResult {
  questionIndex: number;
  answerIndex: number;
  confidence: 'high' | 'medium' | 'low';
}

const FILE_PATH = path.resolve('./karteikarten-import.json');

const SYSTEM_PROMPT = `You are a semantic matching tool for German AP1 IT exam flashcards.
Return ONLY a valid JSON array — no prose, no markdown fences.`;

function buildMatchPrompt(questions: string[], answers: string[]): string {
  const qList = questions.map((q, i) =>
    `Q${i}: ${q.slice(0, 250).replace(/\n/g, ' ')}`
  ).join('\n');

  const aList = answers.map((a, i) =>
    `A${i}: ${a.slice(0, 250).replace(/\n/g, ' ')}`
  ).join('\n');

  return `Match each question to its correct answer based on topic and content.
These are German AP1 IT exam flashcards — questions and answers must be about the SAME topic.

Return a JSON array of matches:
[{ "questionIndex": <number>, "answerIndex": <number>, "confidence": "high"|"medium"|"low" }]

Only include matches you are reasonably confident about. Skip questions that have no clear matching answer.
A question can match at most one answer and vice versa.

QUESTIONS:
${qList}

ANSWERS:
${aList}`;
}

function calcCostCents(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICING.input +
    (outputTokens / 1_000_000) * PRICING.output
  ) * 100;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-YOUR_KEY_HERE') {
    console.error('Error: Set ANTHROPIC_API_KEY in your .env file.');
    process.exit(1);
  }

  if (!fs.existsSync(FILE_PATH)) {
    console.error(`Not found: ${FILE_PATH}\nRun import-karteikarten first.`);
    process.exit(1);
  }

  const data: InputFile = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
  const client = new Anthropic({ apiKey });

  // ── Collect all unpaired questions and answers ───────────────────────────

  // From incomplete: questions that have no answer, and answers that have no question
  const orphanQuestions: Array<{ text: string; nr: number; difficulty: number }> = [];
  const orphanAnswers: Array<{ text: string; nr: number }> = [];

  for (const card of data.incomplete) {
    if (card.missingSide === 'answer') {
      orphanQuestions.push({ text: card.presentText, nr: card.karteikartenNr, difficulty: card.difficulty });
    } else {
      orphanAnswers.push({ text: card.presentText, nr: card.karteikartenNr });
    }
  }

  // From unmatched: side === 'question' or 'answer', karteikartenNr === 0
  for (const card of data.unmatched) {
    if (card.side === 'question') {
      orphanQuestions.push({ text: card.text, nr: 0, difficulty: card.difficulty ?? 2 });
    } else {
      orphanAnswers.push({ text: card.text, nr: 0 });
    }
  }

  console.log(`Orphan questions: ${orphanQuestions.length}`);
  console.log(`Orphan answers:   ${orphanAnswers.length}`);

  if (orphanQuestions.length === 0 || orphanAnswers.length === 0) {
    console.log('Nothing to match.');
    return;
  }

  // ── Run semantic matching in chunks (Claude context limit) ───────────────
  // Process in chunks of 30 questions × 30 answers to stay within limits
  const CHUNK_Q = 30;
  const CHUNK_A = 40;

  const newPairs: MergedCard[] = [];
  const usedQIndices = new Set<number>();
  const usedAIndices = new Set<number>();
  let totalInput = 0;
  let totalOutput = 0;
  let nextNr = Math.max(0, ...data.cards.map(c => c.karteikartenNr)) + 1;

  for (let qi = 0; qi < orphanQuestions.length; qi += CHUNK_Q) {
    const qChunk = orphanQuestions.slice(qi, qi + CHUNK_Q);
    const availableAnswers = orphanAnswers
      .map((a, idx) => ({ ...a, globalIdx: idx }))
      .filter(a => !usedAIndices.has(a.globalIdx));

    for (let ai = 0; ai < availableAnswers.length; ai += CHUNK_A) {
      const aChunk = availableAnswers.slice(ai, ai + CHUNK_A);

      console.log(`\nMatching Q[${qi}–${qi + qChunk.length - 1}] vs A[${ai}–${ai + aChunk.length - 1}]...`);

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: buildMatchPrompt(
            qChunk.map(q => q.text),
            aChunk.map(a => a.text)
          ),
        }],
      });

      totalInput += response.usage.input_tokens;
      totalOutput += response.usage.output_tokens;

      const raw = response.content
        .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('');

      try {
        const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/, '').trim();
        const matches: MatchResult[] = JSON.parse(cleaned);

        for (const match of matches) {
          if (match.confidence === 'low') continue;

          const globalQIdx = qi + match.questionIndex;
          const globalAIdx = aChunk[match.answerIndex]?.globalIdx;

          if (globalQIdx === undefined || globalAIdx === undefined) continue;
          if (usedQIndices.has(globalQIdx) || usedAIndices.has(globalAIdx)) continue;

          usedQIndices.add(globalQIdx);
          usedAIndices.add(globalAIdx);

          const q = orphanQuestions[globalQIdx];
          const a = orphanAnswers[globalAIdx];

          // Use existing karteikartenNr if available, else assign a new one
          const nr = q.nr !== 0 ? q.nr : a.nr !== 0 ? a.nr : nextNr++;

          newPairs.push({
            karteikartenNr: nr,
            question: q.text,
            answer: a.text,
            difficulty: q.difficulty,
          });

          console.log(`  Matched: Q"${q.text.slice(0, 60).replace(/\n/g, ' ')}" → A"${a.text.slice(0, 60).replace(/\n/g, ' ')}" [${match.confidence}]`);
        }
      } catch {
        console.error('  Warning: could not parse match results for this chunk');
      }
    }
  }

  // ── Merge and save ───────────────────────────────────────────────────────
  const allCards = [...data.cards, ...newPairs].sort((a, b) => a.karteikartenNr - b.karteikartenNr);

  const output = {
    ...data,
    generated: new Date().toISOString(),
    totalCards: allCards.length,
    cards: allCards,
  };

  fs.writeFileSync(FILE_PATH, JSON.stringify(output, null, 2), 'utf-8');

  const cost = calcCostCents(totalInput, totalOutput);
  console.log(`\nNew pairs found: ${newPairs.length}`);
  console.log(`Total cards now: ${allCards.length}`);
  console.log(`Saved → ${FILE_PATH}`);
  console.log(`Cost: ~${cost.toFixed(2)}¢`);
}

main().catch(err => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
