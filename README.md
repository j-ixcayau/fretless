# Chordly

Organize, transpose, and practice your songs and chord charts — with setlists, auto-scroll, and AI-powered smart import.

## Features

- **Song library** — store lyrics and above-line chord charts, optimized for mobile display.
- **Transpose** — shift any song to your preferred key on the fly.
- **Setlists** — group songs into ordered setlists and play through them.
- **Smart Import** — paste text or drop an image of a chord sheet and let Gemini format it automatically.
- **Auto-scroll & playback** — hands-free practice with custom scroll speed.

## Tech stack

React 19 + Vite, Firebase (Auth + Firestore), Tailwind CSS, Framer Motion, and the Google Gemini API.

## Getting started

```bash
npm install
npm run dev
```

Set your Gemini API key in the app's Settings, or provide `VITE_GEMINI_API_KEY` in `.env.local`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run deploy` — build and deploy to Firebase Hosting
