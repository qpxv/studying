import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import type Anthropic from '@anthropic-ai/sdk';

export type ContentBlock = Anthropic.Messages.ContentBlockParam;

export interface AssetFiles {
  contentBlocks: ContentBlock[];
  textFallback: string;
}

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const PDF_SIZE_LIMIT_MB = 20;

export async function readAssetsFolder(assetsDir: string): Promise<AssetFiles> {
  if (!fs.existsSync(assetsDir)) {
    throw new Error(`assets/ folder not found at: ${assetsDir}`);
  }

  const files = fs
    .readdirSync(assetsDir)
    .filter((f) => !f.startsWith('.'))
    .sort();

  if (files.length === 0) {
    throw new Error('No files found in assets/ — drop your PDF there first.');
  }

  const contentBlocks: ContentBlock[] = [];
  let textFallback = '';

  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const ext = path.extname(file).toLowerCase();

    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);
      const sizeMB = buffer.length / (1024 * 1024);

      if (sizeMB <= PDF_SIZE_LIMIT_MB) {
        console.log(`  Reading PDF (${sizeMB.toFixed(1)}MB): ${file}`);
        contentBlocks.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: buffer.toString('base64'),
          },
          title: path.basename(file, '.pdf'),
        } as ContentBlock);
      } else {
        // Large PDF — extract text instead
        console.log(`  PDF is ${sizeMB.toFixed(1)}MB > ${PDF_SIZE_LIMIT_MB}MB, extracting text: ${file}`);
        const parsed = await pdfParse(buffer);
        textFallback += `\n\n=== ${file} ===\n${parsed.text}`;
      }
    } else if (IMAGE_EXTS.includes(ext)) {
      const buffer = fs.readFileSync(filePath);
      const mediaType =
        ext === '.png' ? 'image/png' :
        ext === '.webp' ? 'image/webp' :
        ext === '.gif' ? 'image/gif' :
        'image/jpeg';

      console.log(`  Reading image: ${file}`);
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: buffer.toString('base64'),
        },
      } as ContentBlock);
    }
  }

  return { contentBlocks, textFallback };
}

export function readMimickFolder(mimickDir: string): string {
  if (!fs.existsSync(mimickDir)) return '';

  const files = fs
    .readdirSync(mimickDir)
    .filter((f) => /\.(txt|md)$/i.test(f))
    .sort();

  if (files.length === 0) return '';

  return files
    .map((f) => {
      const content = fs.readFileSync(path.join(mimickDir, f), 'utf-8');
      return `=== ${f} ===\n${content.trim()}`;
    })
    .join('\n\n---\n\n');
}

export function readNotesFile(notesFile: string): string {
  if (!fs.existsSync(notesFile)) {
    throw new Error(
      `notes/generated-notes.md not found. Run "npm run create-notes" first.`
    );
  }
  return fs.readFileSync(notesFile, 'utf-8');
}
