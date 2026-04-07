import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { readAssetsFolder, readMimickFolder, type ContentBlock } from './lib/file-reader.js';

const ASSETS_DIR = path.resolve('./assets');
const MIMICK_DIR = path.resolve('./mimick');
const NOTES_DIR = path.resolve('./notes');
const NOTES_FILE = path.join(NOTES_DIR, 'generated-notes.md');
const PROGRESS_FILE = path.join(NOTES_DIR, '.progress.json');
const MODEL = 'claude-opus-4-6';

interface Progress {
  totalChunks: number;
  completedChunks: number[];
  chunkNotes: Record<number, string>;
}

const SYSTEM_PROMPT = `You are a study note writer. Your job is to create comprehensive, exhaustive study notes from lecture slides.

Rules:
- Match the student's EXACT personal writing style from the examples provided — copy their vocabulary, sentence rhythm, use of emphasis, abbreviations, and formatting habits.
- Cover EVERY concept, definition, model, framework, number, name, example, and detail from the slides. Do not skip anything.
- Include minor details, specific dates, names, exact numbers, exceptions, and edge cases — these appear on exams.
- Use clear structure: headers (##), sub-headers (###), bullet points, and **bold** for key terms.
- Write in the same language as the slides (likely German or English — match it).
- For every diagram, chart, graph, table, or image in the slides: describe it fully in text. Explain what it shows, what the axes/labels mean, what the key takeaway is, and any values or relationships visible. The student cannot see images in the notes, so every visual must be fully captured in words.
- Do NOT summarize. Be exhaustive. A student must be able to pass a strict oral or written exam using only these notes.
- Do not write meta-commentary like "here are the notes" — jump straight into the notes.`;

// ─── Progress helpers ────────────────────────────────────────────────────────

function loadProgress(): Progress | null {
  if (!fs.existsSync(PROGRESS_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')) as Progress;
  } catch {
    return null;
  }
}

function saveProgress(progress: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
}

function clearProgress() {
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
}

// ─── Streaming helper ────────────────────────────────────────────────────────

async function streamResponse(
  client: Anthropic,
  params: Parameters<typeof client.messages.stream>[0],
  label: string
): Promise<string> {
  console.log(`\n${label}\n${'─'.repeat(60)}`);
  let fullText = '';

  const stream = client.messages.stream(params);
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      process.stdout.write(chunk.delta.text);
      fullText += chunk.delta.text;
    }
  }

  const finalMsg = await stream.finalMessage();
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Tokens — input: ${finalMsg.usage.input_tokens}, output: ${finalMsg.usage.output_tokens}`);
  return fullText;
}

// ─── Single-pass (PDF vision) ────────────────────────────────────────────────

function buildSinglePassMessage(
  styleExamples: string,
  assets: { contentBlocks: ContentBlock[]; textFallback: string },
  existingNotes?: string
): Anthropic.Messages.MessageParam {
  const content: ContentBlock[] = [];

  if (styleExamples.trim()) {
    content.push({
      type: 'text',
      text: `Here are examples of my personal writing style. Match this voice exactly:\n\n<style_examples>\n${styleExamples}\n</style_examples>`,
    });
  } else {
    content.push({ type: 'text', text: 'No style examples — use clear, concise academic style with structured bullets.' });
  }

  if (existingNotes) {
    content.push({
      type: 'text',
      text: `The note generation was interrupted earlier. Below are the notes already generated so far. CONTINUE from exactly where they cut off — do NOT repeat anything already written, just keep going with the remaining slides:\n\n<existing_notes>\n${existingNotes}\n</existing_notes>\n\nNow continue writing the notes for the remaining slides:`,
    });
  } else {
    content.push({ type: 'text', text: 'Here are the lecture slides. Generate comprehensive, exhaustive study notes in my style:\n' });
  }

  for (const block of assets.contentBlocks) content.push(block);

  if (assets.textFallback.trim()) {
    content.push({ type: 'text', text: `\nAdditional slide content (text extracted from large PDFs):\n${assets.textFallback}` });
  }

  return { role: 'user', content };
}

// ─── Chunked (large PDF text fallback) ──────────────────────────────────────

async function generateChunkNotes(
  client: Anthropic,
  styleExamples: string,
  chunkText: string,
  chunkIndex: number,
  totalChunks: number
): Promise<string> {
  return streamResponse(
    client,
    {
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: styleExamples.trim()
            ? `Personal writing style examples:\n<style_examples>\n${styleExamples}\n</style_examples>\n\nSlide content (chunk ${chunkIndex + 1} of ${totalChunks}):\n${chunkText}`
            : `Slide content (chunk ${chunkIndex + 1} of ${totalChunks}):\n${chunkText}`,
        },
      ],
    },
    `Generating notes — chunk ${chunkIndex + 1}/${totalChunks}...`
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-YOUR_KEY_HERE') {
    console.error('Error: Set ANTHROPIC_API_KEY in your .env file.');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  console.log('Reading assets/...');
  const assets = await readAssetsFolder(ASSETS_DIR);

  console.log('Reading mimick/...');
  const styleExamples = readMimickFolder(MIMICK_DIR);
  if (!styleExamples) console.log('  (No style examples found — proceeding without them)');

  if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });

  let notes: string;

  // ── Single-pass: PDF/image vision blocks ──────────────────────────────────
  if (assets.contentBlocks.length > 0) {
    const existingNotes = fs.existsSync(NOTES_FILE) ? fs.readFileSync(NOTES_FILE, 'utf-8').replace(/^<!--.*?-->\n\n/s, '').trim() : '';

    if (existingNotes) {
      console.log('\nPartial notes detected. Resuming from where generation stopped...');
      const userMessage = buildSinglePassMessage(styleExamples, assets, existingNotes);
      const continuation = await streamResponse(
        client,
        { model: MODEL, max_tokens: 16000, system: SYSTEM_PROMPT, messages: [userMessage] },
        'Continuing notes...'
      );
      notes = existingNotes + '\n\n' + continuation;
    } else {
      const userMessage = buildSinglePassMessage(styleExamples, assets);
      notes = await streamResponse(
        client,
        { model: MODEL, max_tokens: 16000, system: SYSTEM_PROMPT, messages: [userMessage] },
        'Sending to Claude (streaming)...'
      );
    }

  // ── Chunked: large PDF text fallback ─────────────────────────────────────
  } else if (assets.textFallback.trim()) {
    const CHUNK_SIZE = 30000;
    const text = assets.textFallback;
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) chunks.push(text.slice(i, i + CHUNK_SIZE));

    // Load or init progress
    let progress = loadProgress();
    if (progress && progress.totalChunks !== chunks.length) {
      console.log('Chunk count changed — starting fresh.');
      progress = null;
    }
    if (!progress) {
      progress = { totalChunks: chunks.length, completedChunks: [], chunkNotes: {} };
    }

    const skipped = progress.completedChunks.length;
    if (skipped > 0) {
      console.log(`\nResuming: ${skipped}/${chunks.length} chunks already done, continuing from chunk ${skipped + 1}...`);
    }

    for (let i = 0; i < chunks.length; i++) {
      if (progress.completedChunks.includes(i)) {
        console.log(`  Skipping chunk ${i + 1}/${chunks.length} (already done)`);
        continue;
      }

      const chunkNote = await generateChunkNotes(client, styleExamples, chunks[i], i, chunks.length);
      progress.chunkNotes[i] = chunkNote;
      progress.completedChunks.push(i);
      saveProgress(progress);
    }

    const allChunkNotes = chunks.map((_, i) => progress!.chunkNotes[i]);

    if (chunks.length === 1) {
      notes = allChunkNotes[0];
    } else {
      console.log('\nConsolidating all chunks into final notes...\n');
      const consolidated = await client.messages.create({
        model: MODEL,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Below are study notes generated in ${chunks.length} chunks. Merge into a single, well-structured, coherent set of notes. Remove duplicates but keep all content.\n\n${allChunkNotes.map((n, i) => `=== CHUNK ${i + 1} ===\n${n}`).join('\n\n')}`,
          },
        ],
      });
      notes = consolidated.content
        .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');
    }

    clearProgress();

  } else {
    console.error('No readable files found in assets/. Add a PDF or images.');
    process.exit(1);
  }

  const header = `<!-- Generated: ${new Date().toISOString()} | Model: ${MODEL} -->\n\n`;
  fs.writeFileSync(NOTES_FILE, header + notes, 'utf-8');
  console.log(`\nNotes saved to: ${NOTES_FILE}`);
}

main().catch((err) => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
