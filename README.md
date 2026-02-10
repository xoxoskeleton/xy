# Strength Pulse

A phone-first strength tracker built with Next.js.

## Features

- Log workouts directly in-app with a quick mobile form.
- Paste workout logs from chat history into a single text box.
- Parses common formats like `Squat 3x5 @ 100kg`, `Bench Press - 65kg x 8`, and `Deadlift: 265lb x 4`.
- Tracks progression with estimated 1RM trend per exercise.
- Shows estimated percentile ranking (`Top X%`) using interpolation from lifting-standard style reference data.
- Saves your workout log in local storage so it stays available on your phone.
- Mobile-first UI with a non-traditional neon aesthetic.

## Percentile notes

Percentiles are estimates, not medical/performance certification.
They are derived from publicly available lifting-standard style charts (StrengthLevel-style aggregates) mapped to percentile buckets, then interpolated.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.


## Deploy

```bash
vercel --prod
```
