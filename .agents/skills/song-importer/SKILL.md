---
name: song-importer
description: Formats song lyrics and chords into the specific Chordly format, including metadata and ASCII tab placeholders. Use when users provide a song and ask to "add it", "import it", or "format it for the app".
---

# Song Importer Skill

This skill ensures songs are formatted correctly for the **Chordly** app, maximizing compatibility with the built-in transposer and the UI preview.

## Core Workflow

1.  **Extract Metadata**: Identify the Title, Artist, Base Key, and Tuning. These go in the top-level JSON fields — NOT in `content`.
2.  **Format Sections**: Use bracketed headers (e.g., `[Intro]`, `[Verso 1]`, `[Estribillo]`) for visual clarity. The `content` field starts directly with the first section header.
3.  **Chord Alignment**: Ensure chords are placed directly above the lyrics they correspond to.

## Expected Format Template

```text
[Intro]
G  Em  C  D

[Verso 1]
G             Em
Lyrics go here...
     C           D
More lyrics here...

[Estribillo]
G
Chorus lyrics...
```

> **Note**: Do NOT include `Key:`, `Tuning:`, or ASCII tab blocks in `content`. Those fields exist at the JSON level (`base_key`, `tuning`) and tab notation is not required in the content body.

## JSON Structure for Firestore

When providing the final data for a "New Tab", use this structure:

```json
{
  "title": "Song Title",
  "artist": "Artist Name",
  "base_key": "E",
  "tuning": "Standard",
  "duration": 210,
  "tags": ["tag1", "tag2"],
  "content": "Sections with chords and lyrics only, starting directly with the first [Section] header"
}
```

## Best Practices

- **Heuristics**: The app's transposer uses a regex to find chords. Avoid using ambiguous text that might be mistaken for a chord.
- **No headers in content**: `Key:` and `Tuning:` lines must NOT appear inside `content` — they are captured by the `base_key` and `tuning` JSON fields.
- **No ASCII tabs in content**: Do not add bass tab ASCII blocks to `content`. They are not required and clutter the lyrics view.
- **Language**: Support both English (`[Chorus]`) and Spanish (`[Estribillo]`) section headers based on the input.
- **Case Formatting**: Prefer Sentence Case (e.g., "Lyrics go here") over ALL CAPS, even if the source is capitalized, to improve readability in the app.
- **Duration**: The `duration` field is an **integer in seconds** (e.g., `210` for 3:30). Estimate from the song length if not explicitly known. The `TabEditor` stores and displays this as a numeric input labelled "Duration (s)".
- **Mobile Optimization**: Break down long lines of lyrics into shorter phrases (maximum 30-40 characters per line) so they are readable on mobile screens without horizontal scrolling. Avoid large horizontal spacing or tabs between sentences. Maintain correct chord alignment above each shorter phrase.
