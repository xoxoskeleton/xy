# TrayLearn

TrayLearn is a mastery-first UK phonics spaced repetition app for short parent-child sessions (3–5 minutes). It uses a Leitner-style tray model (Frequent, Growing, Strong, Mastered), stage gating, and local-first storage.

## Why this differs from timed phonics tools

- No speed trials, timers, or streak pressure.
- Session builder starts with easy wins and ends on a win.
- Stage progression is gated by mastery and parent readiness checks.
- Missed days are handled gently: due cards simply remain due.

## Tech

- Next.js + TypeScript + Tailwind
- IndexedDB via Dexie (offline-first local persistence)
- Local profiles (multi-child)
- Optional sync flag stub in `lib/sync.ts`

## Run

```bash
pnpm i
pnpm dev
```

Open `http://localhost:3000`.

## Features in V1

- Landing explainer
- Child profile picker + add child
- Dashboard with due counts, tray summary, stage status
- Readiness check and stage gating
- Session runner with card flipping, mascot feedback, ratings (fast/slow/missed)
- One celebration per session and sticker-book (1/session)
- Settings for session length and max new cards
- Parent-created cards with whole-word safeguards in Stage 1/2
- Export JSON backup and printable deck (`window.print()`)

## Scheduling logic

- Review movement: `lib/srs.ts`
- Session selection (3 wins first, due pull, new cards, end on win): `lib/session.ts`
- Stage gating checks: `lib/gating.ts`

## Adding card packs

1. Add cards to `starterCards` in `lib/content.ts`.
2. Set `stage`, `type`, `prompt`, and optional `graphemes/tip`.
3. Keep Stage 1/2 entries decodable and avoid whole-word cards unless `isTricky` in Stage 4.
4. Existing children can import/export data, or you can seed new children from updated starter content.

## Tests

```bash
pnpm test
```

Tests cover tray movement and session selection rules.
