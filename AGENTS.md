@AGENTS.md

# Design System

## Stack
- Tailwind CSS v4 (`@import "tailwindcss"` in globals.css)
- Fonts: Geist Sans (`--font-sans`) + Geist Mono (`--font-mono`)
- Icons: `lucide-react`
- Markdown rendering: `marked` (used in SQL Praxis bubbles and AP1 Karteikarten card faces via `dangerouslySetInnerHTML` + `.sql-markdown` CSS class in globals.css)
- Code editor: `codemirror` v6 + `@codemirror/lang-sql` (SQL Praxis editor panel)

## Color tokens (globals.css)
| Token | Light | Dark |
|---|---|---|
| `--background` | `#ffffff` | `#0a0a0a` |
| `--foreground` | `#171717` | `#ededed` |

Dark mode is **system-preference driven** via `@media (prefers-color-scheme: dark)` — no manual toggle, just `dark:` Tailwind variants everywhere.

## Zinc palette (used throughout)
All UI chrome lives in the zinc scale. Quick reference:
- **Backgrounds**: `bg-white dark:bg-zinc-950` (pages), `bg-white dark:bg-zinc-900` (cards), `bg-zinc-50 dark:bg-zinc-900` (subtle cards), `bg-zinc-100 dark:bg-zinc-800` (icon wells / chips)
- **Borders**: `border-zinc-200 dark:border-zinc-800` (default), `hover:border-zinc-300 dark:hover:border-zinc-700`
- **Text primary**: `text-zinc-900 dark:text-zinc-100`
- **Text secondary**: `text-zinc-400 dark:text-zinc-500`
- **Text muted/ghost**: `text-zinc-300 dark:text-zinc-600` or `text-zinc-300 dark:text-zinc-700`

## Status / accent colors
- **Online / green**: `text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50`, dot `bg-green-400`
- **Offline / neutral**: `text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800`, dot `bg-zinc-400`
- **Error**: `text-red-500`

## Card style
```
rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5
```
Subtle variant (slightly off-white): swap `bg-white` → `bg-zinc-50 dark:bg-zinc-900`.
Interactive cards also get: `hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all duration-150 active:scale-[0.98]`

## Icon wells
Small square container for icons:
```
w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center
```
Icon inside: `w-5 h-5 text-zinc-600 dark:text-zinc-400`
Smaller (header): `w-7 h-7 rounded-lg` with `w-4 h-4` icon.

## Typography scale
| Role | Classes |
|---|---|
| Page title | `text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100` |
| Section title | `font-semibold text-sm text-zinc-900 dark:text-zinc-100` |
| Body / description | `text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed` |
| Caption / meta | `text-xs text-zinc-400 dark:text-zinc-500` |
| Micro / ghost | `text-[11px]` or `text-[10px] text-zinc-300 dark:text-zinc-600` |
| Section label | `text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider` |

## Buttons
**Primary (filled):**
```
bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-80 active:scale-95 transition-all
```
Pill: `rounded-full` · Rounded: `rounded-xl`

**Ghost / text link:**
```
text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors
```

**Selected row (e.g. TopicRow):**
```
bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900
```
Unselected hover: `hover:bg-zinc-100 dark:hover:bg-zinc-800`

## Chat bubbles (quiz / praxis pages)
- **AI bubble**: `bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-2xl rounded-bl-sm`
- **User bubble**: `bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-2xl rounded-br-sm`
- Both: `px-4 py-3 text-sm leading-relaxed max-w-[85%]`
- AI bubbles that render markdown use the `.sql-markdown` CSS class + `dangerouslySetInnerHTML` with `marked.parse()`

## Layout patterns
- Full-height locked layout: `position: fixed` with `visualViewport` tracking (handles iOS keyboard)
- Centered single-column content: `flex flex-col items-center justify-center h-full gap-8 px-6`
- Max width for card stacks: `max-w-sm` (card column), `max-w-3xl` (chat/wide)
- Header: `flex-none flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm`
- `html, body { height: 100%; overflow: hidden; overscroll-behavior: none; }` — scroll is always inside a `<main>` with `overflow-y-auto overscroll-y-contain`

## Nav / back links
```
flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors
```
Uses `<ArrowLeft className="w-3 h-3" />` or `<Home className="w-3 h-3" />`

# App Structure

## Routes
| Path | Description |
|---|---|
| `/` | Hub — two sections: FOM (Management, SQL) and Advantage (AP1) |
| `/management` | Management Grundlagen theory quiz |
| `/sql` | SQL mode selector (Quiz / Praxis) |
| `/sql/quiz` | SQL theory quiz (same QuizPage component as management) |
| `/sql/praxis` | SQL Praxis — split layout: AI exercise left, CodeMirror editor right |
| `/ap1` | AP1 hub |
| `/ap1/notizen` | AP1 notes (Kategorien + Markdown editor) |
| `/ap1/karteikarten` | AP1 flashcards (Lernen / Fragen / Stats) |
| `/ap1/quiz` | AP1 quiz |
| `/ap1/feedback` | Feedback form |
| `/sign-in` `/sign-up` | Auth pages |

## Shared components
- `app/_components/quiz-page.tsx` — shared quiz UI used by `/management` and `/sql/quiz`. Subject-aware: fetches from `/api/<subject>/quiz-bank` and `/api/<subject>/quiz-evaluate`. Add new subjects to the `ICONS` map at the top.

## AP1 Karteikarten components
- `app/ap1/karteikarten/_components/range-selector.tsx` — Kartenauswahl card: Alle/Bereich toggle, range inputs, shuffle toggle (persisted to `localStorage` under `karteikarten-zufaellig`). Appends `?zufaellig=1` to the lernen/fragen URL when active.
- `app/ap1/karteikarten/_components/karten-verwaltung.tsx` — collapsible card list with inline edit/delete. Delete first wipes `KarteikarteBewertung` rows then deletes the card to avoid FK constraint failures.
- `app/ap1/karteikarten/lernen/_components/lern-session.tsx` — flip-card session. Uses CSS grid stacking (`row-start-1 col-start-1`) on both faces so card height is dynamic. Both question and answer render markdown via `.sql-markdown`. Accepts `shuffle` prop; applies Fisher-Yates in `useEffect` after hydration (avoids SSR mismatch from `Math.random()`).
- `app/ap1/karteikarten/fragen/_components/fragen-session.tsx` — AI quiz session. Question and Musterlösung render markdown. "Erklärung anzeigen" button fetches from `/api/karteikarten/explain` on first click only (on-demand, not bundled with evaluation). Same `shuffle` + `useEffect` pattern as LernSession.

## SQL Praxis components
- `app/sql/praxis/_components/praxis-session.tsx` — split layout (`flex-1 flex flex-col md:flex-row`). Left panel: scrollable AI conversation (exercise bubble, submitted SQL bubble, feedback bubble, next-round button). Right panel: `w-[420px]` CodeMirror editor + submit bar.
- `app/sql/praxis/_components/sql-editor.tsx` — CodeMirror 6 wrapper with `forwardRef`. Exposes `SqlEditorHandle` (`getValue`, `clear`, `focus`). Uses `basicSetup` + `sql()` + custom `tal7aouy` theme + `Mod-Enter` keymap. `Compartment` disables editing during generate/evaluate phases.
- `app/sql/praxis/_components/theme-tal7aouy.ts` — CodeMirror 6 theme built from the exact hex values in `Theme.json` by Mhammed Talhaouy (tal7aouy.theme v3.1.0). Exports `tal7aouy: Extension[]`.

## API routes
| Route | Method | Description |
|---|---|---|
| `/api/[subject]/quiz-bank` | GET | Serves `subjects/<subject>/notes/quiz-bank.json` |
| `/api/[subject]/quiz-evaluate` | POST | Streams Claude evaluation for a quiz answer |
| `/api/sql/praxis-generate` | POST | Streams AI-generated markdown tables + task |
| `/api/sql/praxis-evaluate` | POST | Streams Claude evaluation of a SQL query |
| `/api/karteikarten/evaluate` | POST | Haiku evaluation (score + reasoning) for AP1 flashcard answers |
| `/api/karteikarten/explain` | POST | Haiku on-demand explanation of a flashcard answer — called only when user clicks "Erklärung anzeigen" |
| `/api/auth/[...all]` | * | Better Auth handler |

# Subject / Content Pipeline

## Folder structure
```
subjects/
  mimick/              ← shared writing style examples (used by all subjects)
  management/
    assets/            ← drop lecture PDFs here
    notes/
      generated-notes.md
      quiz-bank.json
  sql/
    assets/            ← drop lecture PDFs here
    notes/
      generated-notes.md
      quiz-bank.json
```
To add a new subject: create `subjects/<name>/assets/` and `subjects/<name>/notes/`, add its icon to `ICONS` in `quiz-page.tsx`, add a route entry in `app/page.tsx`.

## Scripts (all require `.env` with `ANTHROPIC_API_KEY`)
```bash
npm run create-notes -- <subject>      # PDF → generated-notes.md  (Sonnet)
npm run generate -- <subject>          # notes → quiz-bank.json     (Haiku)
npm run improve-context -- <subject>   # enrich quiz bank answers   (Haiku)
npm run curate -- <subject>            # filter/improve quiz-bank.json (Sonnet)
npm run quiz -- <subject>              # interactive CLI quiz        (Opus)
```
Pass subject as a positional arg after `--`, e.g. `npm run create-notes -- sql`.

`create-notes` uses **claude-sonnet-4-6** (heavy PDF vision work).
`generate` and `improve-context` use **claude-haiku-4-5-20251001** (cheap structured JSON).
`curate` uses **claude-sonnet-4-6** — reads the existing quiz-bank.json, removes low-value questions (slide-specific trivia, diagram-dependent questions, near-duplicates, example-output memorization) and improves question context. Processes in chunks of 80.

## SQL Praxis mode (no static files)
`/sql/praxis` requires no pre-generated content. Each round:
1. `POST /api/sql/praxis-generate` → Haiku streams markdown tables + task
2. User writes SQL in the CodeMirror editor (right panel) — SQL syntax highlighting, auto-close brackets, Cmd+X cut line, Cmd+Enter to submit
3. `POST /api/sql/praxis-evaluate` → Haiku evaluates the query, renders markdown feedback in left panel

# Prisma + Next.js Gotchas

## Stale build cache after adding new models
After running `npx prisma migrate dev` + `npx prisma generate` to add new models, Next.js can serve a cached bundle that only knows about the models that existed when the cache was last built. Symptoms: Prisma adapter errors like "Model X does not exist in the database" even though `prisma generate` succeeded and the model is in the schema.

**Fix:** `rm -rf .next` then restart the dev server. Always do this after adding new Prisma models mid-project.
