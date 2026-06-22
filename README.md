# Lernhub

A personal exam-prep app for **Management Grundlagen** and **AP1** coursework. Built as a mobile-first Next.js app with AI-powered quiz feedback.

## What it does

**Management Grundlagen** — AI quiz mode using a pre-generated question bank from lecture PDFs. You type answers in a chat-style interface; Claude evaluates each response in real time (streaming) and serves the next question automatically. Topic filtering lets you focus on specific subtopics. Per-response API cost is shown in the UI.

**AP1** — Notes section with categorized Markdown topics (Kategorien + Themen), drag-and-drop reordering, and an inline Markdown editor with split-view preview. Flashcards (Karteikarten) support Lernen mode (3D flip cards) and Abfragen mode (AI-evaluated typed answers). Both modes support markdown rendering, a persistent shuffle toggle, and optional on-demand AI explanations.

**Auth** — Email/password sign-up and sign-in via Better Auth.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Neon Postgres via Prisma 7 |
| Auth | Better Auth |
| AI | Anthropic SDK (`claude-*`) |
| Drag & drop | dnd-kit |
| Icons | lucide-react |

## Routes

| Path | Description |
|---|---|
| `/` | Hub — pick a study mode |
| `/management` | Management Grundlagen quiz |
| `/ap1/notizen` | AP1 notes (Kategorien + Markdown editor) |
| `/ap1/karteikarten` | AP1 flashcards — manage, Lernen (flip cards), Abfragen (AI quiz), Stats |
| `/ap1/quiz` | AP1 quiz |
| `/ap1/feedback` | Feedback form |
| `/sign-in` `/sign-up` | Auth pages |

## Scripts

These run against the live DB/API — requires a `.env` with the right secrets.

```bash
# Quiz bank pipeline (Management / SQL)
npm run create-notes -- <subject>      # Parse lecture PDFs → generated-notes.md
npm run generate -- <subject>          # notes → quiz-bank.json
npm run improve-context -- <subject>   # Enrich quiz bank answers via Claude
npm run curate -- <subject>            # Filter/improve quiz-bank.json (removes low-value Qs)
npm run quiz -- <subject>              # Interactive CLI quiz

# AP1 Karteikarten import pipeline
npm run import-karteikarten -- <folder>              # OCR card images → karteikarten-import.json
npm run validate-karteikarten                        # Remove mismatched pairs from the JSON
npm run rematch-karteikarten                         # Semantically pair leftover orphan Q/As (run after validate)
```

### Karteikarten import workflow

1. Drop all card photos (question sides + answer sides mixed) into a folder
2. `npm run import-karteikarten -- ./pictures-ap1/` — Claude vision OCRs every image (8 concurrent), auto-detects question vs answer side, pairs by printed card number → `karteikarten-import.json`
3. `npm run validate-karteikarten` — Claude Haiku checks every pair for topic match, removes mismatches
4. Paste the `cards` array from `karteikarten-import.json` into the JSON import field at `/ap1/karteikarten/erstellen`
5. (Optional) `npm run rematch-karteikarten` — semantically matches unpaired questions with unpaired answers and appends them to the JSON

## Local setup

```bash
npm install
# Set DATABASE_URL and ANTHROPIC_API_KEY in .env
npx prisma migrate dev
npm run dev
```

After adding new Prisma models, always `rm -rf .next` before restarting — Next.js caches the bundle and will otherwise serve stale Prisma types.
