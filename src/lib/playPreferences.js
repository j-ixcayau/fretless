export const CHART_FONT_SIZE_KEY = "chordly.chart-font-size.v1";
export const DEFAULT_CHART_FONT_SIZE = 18;
export const MIN_CHART_FONT_SIZE = 12;
export const MAX_CHART_FONT_SIZE = 40;

function normalizeFontSize(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(
        MIN_CHART_FONT_SIZE,
        Math.min(MAX_CHART_FONT_SIZE, Math.round(value)),
      )
    : DEFAULT_CHART_FONT_SIZE;
}

export function readChartFontSize(storage) {
  try {
    const raw = (storage ?? globalThis.localStorage)?.getItem(
      CHART_FONT_SIZE_KEY,
    );
    return raw ? normalizeFontSize(JSON.parse(raw)) : DEFAULT_CHART_FONT_SIZE;
  } catch {
    return DEFAULT_CHART_FONT_SIZE;
  }
}

export function saveChartFontSize(value, storage) {
  try {
    (storage ?? globalThis.localStorage)?.setItem(
      CHART_FONT_SIZE_KEY,
      JSON.stringify(normalizeFontSize(value)),
    );
  } catch {
    // Reading remains usable when browser storage is blocked or full.
  }
}
