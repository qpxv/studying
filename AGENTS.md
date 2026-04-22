<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design System

## Stack
- Tailwind CSS v4 (`@import "tailwindcss"` in globals.css)
- Fonts: Geist Sans (`--font-sans`) + Geist Mono (`--font-mono`)
- Icons: `lucide-react`

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

## Chat bubbles (management quiz page)
- **AI bubble**: `bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-2xl rounded-bl-sm`
- **User bubble**: `bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-2xl rounded-br-sm`
- Both: `px-4 py-3 text-sm leading-relaxed max-w-[85%]`

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

# Prisma + Next.js Gotchas

## Stale build cache after adding new models
After running `npx prisma migrate dev` + `npx prisma generate` to add new models, Next.js can serve a cached bundle that only knows about the models that existed when the cache was last built. Symptoms: Prisma adapter errors like "Model X does not exist in the database" even though `prisma generate` succeeded and the model is in the schema.

**Fix:** `rm -rf .next` then restart the dev server. Always do this after adding new Prisma models mid-project.

