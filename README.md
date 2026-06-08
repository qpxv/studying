# Lernhub

A personal exam-prep app for **Management Grundlagen** and **AP1** coursework. Built as a mobile-first Next.js app with AI-powered quiz feedback.

## What it does

**Management Grundlagen** — AI quiz mode using a pre-generated question bank from lecture PDFs. You type answers in a chat-style interface; Claude evaluates each response in real time (streaming) and serves the next question automatically. Topic filtering lets you focus on specific subtopics. Per-response API cost is shown in the UI.

**AP1** — Notes section with categorized Markdown topics (Kategorien + Themen), drag-and-drop reordering, and an inline Markdown editor with split-view preview. Flashcards section is in progress.

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
| `/ap1/karteikarten` | AP1 flashcards (in progress) |
| `/ap1/quiz` | AP1 quiz (in progress) |
| `/ap1/feedback` | Feedback form |
| `/sign-in` `/sign-up` | Auth pages |

## Scripts

These run against the live DB/API — requires a `.env` with the right secrets.

```bash
npm run create-notes        # Parse lecture PDFs → generate-notes.md
npm run generate            # Generate quiz bank JSON from notes
npm run improve-context     # Enrich quiz bank with extra context via Claude
```

## Local setup

```bash
npm install
# Set DATABASE_URL and ANTHROPIC_API_KEY in .env
npx prisma migrate dev
npm run dev
```

After adding new Prisma models, always `rm -rf .next` before restarting — Next.js caches the bundle and will otherwise serve stale Prisma types.
