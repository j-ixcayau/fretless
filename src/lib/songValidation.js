export const MAX_IMPORT_BYTES = 5_000_000;
export const MAX_IMPORT_SONGS = 100;

function text(value, name, max, fallback = "") {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || value.length > max) {
    throw new Error(`${name} must be text with at most ${max} characters.`);
  }
  return value;
}

export function validateSong(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Each song must be a JSON object.");
  }
  const title = text(value.title, "Title", 200).trim();
  if (!title) throw new Error("Each song needs a title.");
  if (typeof value.content !== "string") {
    throw new Error("Each song needs text content.");
  }
  const tags = value.tags ?? [];
  if (!Array.isArray(tags) || tags.length > 30) {
    throw new Error("Tags must be a list of at most 30 text values.");
  }
  const duration = value.duration ?? "";
  if (
    !["string", "number"].includes(typeof duration) ||
    (duration !== "" &&
      (!/^\d+$/.test(String(duration)) ||
        !Number.isSafeInteger(Number(duration)) ||
        Number(duration) > 86400))
  ) {
    throw new Error("Duration must be whole seconds between 0 and 86400.");
  }
  return {
    title,
    artist: text(value.artist, "Artist", 200),
    base_key: text(value.base_key, "Base key", 20),
    preferred_key: text(value.preferred_key, "Preferred key", 20),
    tuning: text(value.tuning, "Tuning", 100, "Standard"),
    tags: tags.map((tag) => text(tag, "Tag", 50)),
    duration: duration === "" ? "" : String(Number(duration)),
    content: text(value.content, "Content", 200_000),
  };
}

export function validateSongs(values) {
  if (
    !Array.isArray(values) ||
    !values.length ||
    values.length > MAX_IMPORT_SONGS
  ) {
    throw new Error(
      `Import between 1 and ${MAX_IMPORT_SONGS} songs at a time.`,
    );
  }
  const songs = values.map(validateSong);
  if (
    new TextEncoder().encode(JSON.stringify(songs)).length > MAX_IMPORT_BYTES
  ) {
    throw new Error("Import must be smaller than 5 MB.");
  }
  return songs;
}

export function parseSongImport(json) {
  if (new TextEncoder().encode(json).length > MAX_IMPORT_BYTES) {
    throw new Error("Import must be smaller than 5 MB.");
  }
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON format.");
  }
  return validateSongs(Array.isArray(data) ? data : [data]);
}
