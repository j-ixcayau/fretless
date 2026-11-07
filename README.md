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

Song and setlist data loaded on this device is cached in IndexedDB, so it remains available when reopening the installed app offline. Pending offline edits also survive reload and sync when connectivity returns. Use Chordly on a trusted device: signing out hides account data but does not erase its disk cache. To remove cached data, connect to the internet, let edits sync, close other Chordly tabs, and use **Clear saved offline data** in Settings. The app reloads after cleanup, and you must load songs online again to cache them. Browser or device storage cleanup can also remove offline data.

On iPhone, open Chordly from its Home Screen icon while online, sign in, and wait for the library to load before going offline. Do this again after an app update so the service worker can download the new app files. Keep the account signed in for offline use; signing in and Smart Import require a connection. The build generates a versioned service worker that precaches the app's HTML, JavaScript, CSS, and icons.

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
