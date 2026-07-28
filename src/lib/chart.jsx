import { splitComment, isChordLine } from "./transposer";

// Chord lines render in a light indigo; "--- comment" annotations in green.
const CHORD_CLASS = "text-[#a5b4fc]";
const COMMENT_CLASS = "text-secondary font-bold";

/**
 * Renders chart text into React nodes for a <pre>, colouring chord lines and
 * `--- comment` annotations. Shared by the song view, Play Mode and the editor
 * so highlighting is consistent everywhere.
 */
export function renderChart(text) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const nl = i < lines.length - 1 ? "\n" : "";
    const [code, comment] = splitComment(line);
    const chords = code.trim() !== "" && isChordLine(code);

    if (!chords && !comment) return line + nl;

    return (
      <span key={i}>
        {chords ? <span className={CHORD_CLASS}>{code}</span> : code}
        {comment && <span className={COMMENT_CLASS}>{comment}</span>}
        {nl}
      </span>
    );
  });
}
