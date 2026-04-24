---
name: song-importer
description: Formats song lyrics and chords into the specific Bass Tab Manager format, including metadata and ASCII tab placeholders. Use when users provide a song and ask to "add it", "import it", or "format it for the app".
---

# Song Importer Skill

This skill ensures songs are formatted correctly for the **Bass Tab Manager** app, maximizing compatibility with the built-in transposer and the UI preview.

## Core Workflow

1.  **Extract Metadata**: Identify the Title, Artist, Base Key, and Tuning.
2.  **Add Transposer Hints**: Ensure the first few lines of the content include `Key: [BASE_KEY]` so the app can identify the original key.
3.  **Generate ASCII Preview**: Every song MUST have at least one section with ASCII tab lines (using `|` markers) so the `TabCard` preview isn't empty.
4.  **Format Sections**: Use bracketed headers (e.g., `[Intro]`, `[Verse 1]`, `[Chorus]`) for visual clarity.
5.  **Chord Alignment**: Ensure chords are placed directly above the lyrics they correspond to.

## Expected Format Template

```text
Key: E
Tuning: Standard

[Intro]
G |--------------------------------|
D |--------------------------------|
A |--------------------------------|
E |0-------0-------5-------5-------|
   E               A

[Verse 1]
E
Lyrics go here...
```

## JSON Structure for Firestore

When providing the final data for a "New Tab", use this structure:

```json
{
  "title": "Song Title",
  "artist": "Artist Name",
  "base_key": "E",
  "tuning": "Standard",
  "tags": ["tag1", "tag2"],
  "content": "Full formatted text including Key: header and ASCII sections"
}
```

## Best Practices

*   **Heuristics**: The app's transposer uses a regex to find chords. Avoid using ambiguous text that might be mistaken for a chord.
*   **Bass Tabs**: Since this is a *Bass* Tab Manager, always try to provide a simple root-note bass line in ASCII for the main hook of the song.
*   **Language**: Support both English (`[Chorus]`) and Spanish (`[Estribillo]`) section headers based on the input.
*   **Case Formatting**: Prefer Sentence Case (e.g., "Lyrics go here") over ALL CAPS, even if the source is capitalized, to improve readability in the app.
