import { splitComment, isChordLine, isTabLine } from "./transposer";

// Chord lines → light indigo; tablature → amber; "--- comment" → green.
const CHORD_CLASS = "text-[#a5b4fc]";
const TAB_CLASS = "text-[#e6be6a]";
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

    let codeClass = null;
    if (code.trim() !== "") {
      if (isTabLine(code)) codeClass = TAB_CLASS;
      else if (isChordLine(code)) codeClass = CHORD_CLASS;
    }

    if (!codeClass && !comment) return line + nl;

    return (
      <span key={i}>
        {codeClass ? <span className={codeClass}>{code}</span> : code}
        {comment && <span className={COMMENT_CLASS}>{comment}</span>}
        {nl}
      </span>
    );
  });
}
