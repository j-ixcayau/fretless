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

Set your own Gemini API key in the app's Settings. It stays in memory for the current signed-in session and is cleared on sign-out, account changes, or reload. Do not put Gemini keys in Vite environment variables: those are bundled into the public client.

Song and setlist caches stay in memory while the tab is open. Offline edits can sync when connectivity returns, but keep the tab open until they finish; they do not survive reload. Older versions saved an offline cache on disk. It is retained to avoid deleting unsynced edits; Settings provides an explicit cleanup action after you have synced or exported any old edits and closed other tabs.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run deploy` — build and deploy to Firebase Hosting

## Firestore access rules

`firestore.rules` allows signed-in users to read and write only their own
`users/{uid}/tabs` and `users/{uid}/setlists` documents. Other paths are denied.
Writes validate allowed fields, scalar types and size limits; song import
validation also checks individual tag entries.

Run `npm run test:rules` with Node 20+ and Java 21+. This downloads Firebase CLI
and the Firestore emulator on first use and runs against `demo-chordly`, without
production credentials. The tests cover account isolation, queries, CRUD and
invalid writes. `npm test` runs the separate client unit tests.

Hosting deployment does **not** deploy database rules. After reviewing these rules
against existing data, deploy them separately with
`firebase deploy --only firestore:rules --project <your-project-id>`.
