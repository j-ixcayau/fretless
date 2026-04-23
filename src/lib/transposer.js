const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Transposes a single note string.
 * @param {string} note - e.g. "C#", "Bb", "A"
 * @param {number} semitones - semitones to shift
 * @param {boolean} preferSharps - whether to return sharp or flat notation
 */
export function transposeNote(note, semitones, preferSharps = true) {
  let index = NOTES_SHARP.indexOf(note);
  if (index === -1) index = NOTES_FLAT.indexOf(note);
  if (index === -1) return note; // Not a note

  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  return preferSharps ? NOTES_SHARP[newIndex] : NOTES_FLAT[newIndex];
}

/**
 * Transposes a chord string (e.g. "Am7", "C#sus4/G#").
 */
export function transposeChord(chord, semitones, preferSharps = true) {
  // Regex to find notes in a chord string (including bass notes after /)
  // Matches A-G followed by optional # or b
  const noteRegex = /[A-G][#b]?/g;
  
  return chord.replace(noteRegex, (match) => {
    return transposeNote(match, semitones, preferSharps);
  });
}

/**
 * Transposes the entire ASCII tab content.
 * Only transposes chord/note annotations, leaves fret numbers alone.
 */
export function transposeTab(content, semitones, preferSharps = true) {
  if (semitones === 0) return content;

  const lines = content.split('\n');
  const transposedLines = lines.map(line => {
    // Check if the line is a "string" line (e.g. G|---)
    // We only transpose the string labels (the part before the |)
    if (line.includes('|')) {
      const parts = line.split('|');
      // Transpose the label part if it's a note
      const label = parts[0].trim();
      const transposedLabel = transposeChord(label, semitones, preferSharps);
      return transposedLabel + '|' + parts.slice(1).join('|');
    }

    // Check if the line looks like it contains chords (e.g. "Am   G   F")
    // A chord line usually doesn't have many numbers and contains note-like characters.
    // This is a heuristic.
    const chordRegex = /\b[A-G][#b]?(m|maj|min|dim|aug|sus|add|7|9|11|13)*(\/[A-G][#b]?)?\b/g;
    if (chordRegex.test(line)) {
      return line.replace(chordRegex, (match) => {
        return transposeChord(match, semitones, preferSharps);
      });
    }

    // Also handle "Key: E" style headers
    const keyMatch = line.match(/(Key:\s*)([A-G][#b]?)/i);
    if (keyMatch) {
      return line.replace(keyMatch[2], transposeNote(keyMatch[2], semitones, preferSharps));
    }

    return line;
  });

  return transposedLines.join('\n');
}
