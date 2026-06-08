import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SUBJECT = process.argv[2] ?? 'sql';
const BANK_PATH = path.join('subjects', SUBJECT, 'notes', 'quiz-bank.json');

interface Question {
  id: string;
  question: string;
  answer: string;
  topic: string;
}

interface Bank {
  generated: string;
  subject: string;
  model: string;
  totalQuestions: number;
  questions: Question[];
}

const SYSTEM = `Du bist Kurator einer SQL/Datenbank-Lernkartei für einen Studenten, der sich auf eine Prüfung vorbereitet.

Deine Aufgabe: Filtere und verbessere Fragen so, dass nur wirklich lernwerte Fragen übrig bleiben.

ENTFERNE Fragen, die:
- Nur spezifische Zahlen aus Beispiel-Ausgaben abfragen ("Wie viele Zeilen hat die parts-Tabelle?", "Wie viele Händler werden zurückgegeben?", "Welche Teile werden bei Abfrage X zurückgegeben?")
- Ein spezifisches Diagramm/Slide voraussetzen ohne eigenen Kontext ("Welche Komponenten gehören zur Ebene X", "Wie viele Ebenen hat das DBS-Blockdiagramm")
- Fast-Duplikate einer anderen Frage in der Liste sind
- Sehr spezifische Produktdetails abfragen die kein Konzept lehren (z.B. "Welcher EBCDIC-Wert haben die Buchstaben H, A, N?", "Wie viele Bit verwendet EBCDIC pro Zeichen?")
- Reine Trivia sind ("In welchem Jahr wurde IBM SQL/DS veröffentlicht?")
- Das konkrete Ergebnis eines konkreten Beispiel-Queries abfragen ohne das SQL-Konzept dahinter zu testen
- Sich auf "das Beispiel" / "die Abfrage oben" / "dem Diagramm" beziehen ohne genug Kontext im Fragetext selbst

BEHALTE und VERBESSERE Fragen, die:
- Echte SQL-Konzepte erklären (SELECT, WHERE, JOIN, GROUP BY, HAVING, Unterabfragen, Views, etc.)
- Datenbanktheorie testen (Normalformen, Schlüssel, Integrität, ER-Modell, ANSI-SPARC, etc.)
- Algorithmen/Datenstrukturen erklären (B-Baum, Hash, Index), wenn das Konzept erklärt wird (nicht nur Beispiel-Werte)
- Bei Fragen die "im Beispiel" / "im Diagramm" referenzieren: entweder den nötigen Kontext zur Frage hinzufügen ODER entfernen wenn das nicht möglich ist
- Wichtige Konzeptunterschiede erklären (z.B. WHERE vs HAVING, INNER vs OUTER JOIN, UNION vs UNION ALL)

Antworte NUR mit einem validen JSON-Array der behaltenen (und ggf. verbesserten) Fragen. Keine Erklärungen, kein Markdown.
Format: [{"id":"...","question":"...","answer":"...","topic":"..."}]`;

async function curateChunk(questions: Question[]): Promise<Question[]> {
  const input = JSON.stringify(questions, null, 0);
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    system: SYSTEM,
    messages: [{ role: 'user', content: input }],
  });

  const text = (msg.content[0] as { type: string; text: string }).text.trim();
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array in response');
  return JSON.parse(text.slice(start, end + 1)) as Question[];
}

async function main() {
  if (!fs.existsSync(BANK_PATH)) {
    console.error(`Not found: ${BANK_PATH}`);
    process.exit(1);
  }

  const bank: Bank = JSON.parse(fs.readFileSync(BANK_PATH, 'utf-8'));
  const questions = bank.questions;
  console.log(`Loaded ${questions.length} questions from ${BANK_PATH}`);

  const CHUNK_SIZE = 80;
  const chunks: Question[][] = [];
  for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
    chunks.push(questions.slice(i, i + CHUNK_SIZE));
  }

  console.log(`Processing ${chunks.length} chunks of up to ${CHUNK_SIZE} questions...`);

  const curated: Question[] = [];
  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`  Chunk ${i + 1}/${chunks.length} (${chunks[i].length} q)... `);
    const kept = await curateChunk(chunks[i]);
    curated.push(...kept);
    console.log(`kept ${kept.length}`);
  }

  // Re-number IDs
  const renumbered = curated.map((q, i) => ({
    ...q,
    id: `q${String(i + 1).padStart(3, '0')}`,
  }));

  const output: Bank = {
    ...bank,
    totalQuestions: renumbered.length,
    questions: renumbered,
  };

  fs.writeFileSync(BANK_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nDone. ${questions.length} → ${renumbered.length} questions saved to ${BANK_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
