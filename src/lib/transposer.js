const NOTES_SHARP = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const NOTES_FLAT = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

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
 * Splits a line into [code, comment] at a user comment marker: a "---"
 * token at the start of the line or preceded by whitespace, followed by a
 * space or end of line. The comment runs from "---" to the end of the line.
 * Returns ["<line>", ""] when there is no comment.
 *
 * Examples:
 *   "--- Silencio bajo"                 -> ["", "--- Silencio bajo"]
 *   "[Estribillo Final] --- Silencio"   -> ["[Estribillo Final] ", "--- Silencio"]
 *   "E|----5---3|"                       -> ["E|----5---3|", ""]  (dashes in tab)
 */
export function splitComment(line) {
  const m = line.match(/(^|\s)---(\s|$)/);
  if (!m) return [line, ""];
  const idx = m.index + m[1].length;
  return [line.slice(0, idx), line.slice(idx)];
}

// A chord "core": C, Am, D, F#m7, Csus4, Dadd9, Bb, D4…
const CHORD_CORE =
  "[A-G][#b]?(?:maj|min|dim|aug|sus|add|M|m|°|ø|\\+)?\\d{0,2}(?:sus\\d|add\\d)?";
// A chord token: one or more cores joined by "/" (slash bass) or "-" (e.g. D-G).
const CHORD_TOKEN_RE = new RegExp(`^${CHORD_CORE}(?:[/-]${CHORD_CORE})*$`);

/**
 * True when every whitespace-separated token on a line is a chord — i.e. it's
 * a chord line sitting above the lyrics, not a lyric or a section header.
 */
export function isChordLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return trimmed.split(/\s+/).every((t) => CHORD_TOKEN_RE.test(t));
}

// Transposes a single line of chart "code" (no trailing comment).
function transposeCodeSegment(line, semitones, preferSharps) {
  // String/tab line (e.g. "G|---"): only the label before "|" is a note.
  if (line.includes("|")) {
    const parts = line.split("|");
    const label = parts[0].trim();
    const transposedLabel = transposeChord(label, semitones, preferSharps);
    return transposedLabel + "|" + parts.slice(1).join("|");
  }

  // Chord line heuristic (e.g. "Am   G   F").
  const chordRegex =
    /\b[A-G][#b]?(m|maj|min|dim|aug|sus|add|7|9|11|13)*(\/[A-G][#b]?)?(?=$|\s|[-.,\])])/g;
  if (chordRegex.test(line)) {
    chordRegex.lastIndex = 0;
    return line.replace(chordRegex, (match) =>
      transposeChord(match, semitones, preferSharps),
    );
  }

  // "Key: E" style header.
  const keyMatch = line.match(/(Key:\s*)([A-G][#b]?)/i);
  if (keyMatch) {
    return line.replace(
      keyMatch[2],
      transposeNote(keyMatch[2], semitones, preferSharps),
    );
  }

  return line;
}

/**
 * Transposes the entire ASCII tab content.
 * Only transposes chord/note annotations, leaves fret numbers alone.
 */
export function transposeTab(content, semitones, preferSharps = true) {
  if (semitones === 0) return content;

  const lines = content.split("\n");
  const transposedLines = lines.map((rawLine) => {
    // Never transpose inside a user comment; only the part before "---".
    const [code, comment] = splitComment(rawLine);
    if (!code.trim()) return rawLine;

    const transposed = transposeCodeSegment(code, semitones, preferSharps);
    return transposed + comment;
  });

  return transposedLines.join("\n");
}
/**
 * Calculates the semitone interval between two notes.
 * Returns the number of semitones needed to go from 'fromNote' to 'toNote' (0-11).
 */
export function getInterval(fromNote, toNote) {
  if (!fromNote || !toNote) return 0;

  // Strip any trailing chord quality (e.g. "Bm" -> "B", "Cmaj7" -> "C") so
  // keys like minor chords still resolve to a root note.
  const fromRoot = fromNote.match(/^[A-G][#b]?/)?.[0];
  const toRoot = toNote.match(/^[A-G][#b]?/)?.[0];
  if (!fromRoot || !toRoot) return 0;

  let fromIndex = NOTES_SHARP.indexOf(fromRoot);
  if (fromIndex === -1) fromIndex = NOTES_FLAT.indexOf(fromRoot);

  let toIndex = NOTES_SHARP.indexOf(toRoot);
  if (toIndex === -1) toIndex = NOTES_FLAT.indexOf(toRoot);

  if (fromIndex === -1 || toIndex === -1) return 0;

  let diff = toIndex - fromIndex;
  // We want the shortest path or always positive?
  // Let's just return the positive distance 0-11.
  if (diff < 0) diff += 12;
  return diff;
}
