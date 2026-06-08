# Lernhub

A personal exam-prep app for **Management Grundlagen**, **AP1**, and **SQL** coursework. Built as a mobile-first Next.js app with AI-powered quiz feedback and SQL practice.

## What it does

**Management Grundlagen** — AI quiz mode using a pre-generated question bank from lecture PDFs. Type answers in a chat-style interface; Claude evaluates each response in real time (streaming) and serves the next question automatically. Topic filtering lets you focus on specific subtopics. Per-response API cost shown in UI.

**AP1** — Notes section with categorized Markdown topics (Kategorien + Themen), drag-and-drop reordering, and inline Markdown editor. Flashcards section with 3D flip card learning mode, AI-evaluated answer mode (auth-gated, saves scores), shared stats table, and bulk JSON import.

**SQL** — Two modes:
- *Quiz* — AI quiz from a generated question bank, same chat-style interface as Management Grundlagen.
- *SQL Praxis* — AI generates fresh markdown tables + a task each round. Write your SQL query, submit, Claude evaluates and shows the correct query if needed. No static exercises — every round is a new scenario.

**Auth** — Email/password sign-up and sign-in via Better Auth.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Neon Postgres via Prisma 7 |
| Auth | Better Auth |
| AI | Anthropic SDK (`claude-sonnet-4-6` for notes, `claude-haiku-4-5` for quiz/practice) |
| Markdown | marked |
| Drag & drop | dnd-kit |
| Icons | lucide-react |

## Routes

| Path | Description |
|---|---|
| `/` | Hub — pick a subject |
| `/management` | Management Grundlagen quiz |
| `/ap1` | AP1 hub |
| `/ap1/notizen` | AP1 notes (Kategorien + Markdown editor) |
| `/ap1/karteikarten` | AP1 flashcards (Lernen / Fragen / Stats) |
| `/ap1/karteikarten/erstellen` | Create / bulk-import flashcards |
| `/ap1/feedback` | Feedback form |
| `/sql` | SQL hub (Quiz / Praxis) |
| `/sql/quiz` | SQL theory quiz |
| `/sql/praxis` | SQL practice — AI-generated tables + task |
| `/sign-in` `/sign-up` | Auth pages |

## Subject folder structure

Each subject lives under `subjects/<subject>/`:

```
subjects/
  management/
    assets/     ← drop lecture PDFs here
    notes/      ← generated-notes.md + quiz-bank.json (output)
  sql/
    assets/     ← drop lecture PDFs here
    notes/      ← generated output
  mimick/       ← shared writing style examples (used by all subjects)
```

## Scripts

All scripts require `.env` with `ANTHROPIC_API_KEY`. Pass the subject name as the first argument.

```bash
# 1. Drop PDF(s) into subjects/<subject>/assets/
# 2. Generate study notes from PDFs (Sonnet)
npm run create-notes -- management
npm run create-notes -- sql

# 3. Generate quiz bank JSON from notes (Haiku)
npm run generate -- management
npm run generate -- sql

# 4. Optional: enrich quiz bank answers with more context (Haiku)
npm run improve-context -- management

# 5. Optional: interactive terminal quiz against the notes (Opus)
npm run quiz -- management
```

## Adding a new subject

1. Create `subjects/<subject>/assets/` and drop PDFs in
2. Run `npm run create-notes -- <subject>` then `npm run generate -- <subject>`
3. Add a route `app/<subject>/page.tsx` wrapping the shared `QuizPage` component
4. Add the subject to `ROUTES` in `app/page.tsx` and `ICONS` in `app/_components/quiz-page.tsx`

## Local setup

```bash
npm install
# Set DATABASE_URL and ANTHROPIC_API_KEY in .env
npx prisma migrate dev
npm run dev
```

> After adding new Prisma models, always `rm -rf .next` before restarting — Next.js caches the bundle and will otherwise serve stale Prisma types.
