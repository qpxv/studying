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
npm run create-notes -- <subject>      # Parse lecture PDFs → generated-notes.md
npm run generate -- <subject>          # notes → quiz-bank.json
npm run improve-context -- <subject>   # Enrich quiz bank answers via Claude
npm run curate -- <subject>            # Filter/improve quiz-bank.json (removes low-value Qs)
npm run quiz -- <subject>              # Interactive CLI quiz
```

## Local setup

```bash
npm install
# Set DATABASE_URL and ANTHROPIC_API_KEY in .env
npx prisma migrate dev
npm run dev
```

After adding new Prisma models, always `rm -rf .next` before restarting — Next.js caches the bundle and will otherwise serve stale Prisma types.
