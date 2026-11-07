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
    const bracketed = /^\s*\[([^\]]+)\]\s*$/.exec(code);

    let codeClass = null;
    if (code.trim() !== "") {
      if (bracketed)
        codeClass = isChordLine(bracketed[1])
          ? CHORD_CLASS
          : "text-secondary font-bold";
      else if (isTabLine(code)) codeClass = TAB_CLASS;
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
