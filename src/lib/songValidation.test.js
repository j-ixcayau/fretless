import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_IMPORT_BYTES,
  parseSongImport,
  validateSong,
  validateSongs,
} from "./songValidation.js";

const song = { title: "A song", content: "G\nLyrics", tags: ["worship"] };

test("exported songs round trip while document metadata is discarded", () => {
  const [imported] = parseSongImport(
    JSON.stringify({
      ...song,
      id: "old-document",
      created_at: { seconds: 123 },
      last_played_at: { seconds: 456 },
      duration: 240,
      preferred_key: "Bm",
      arbitrary: "not persisted",
    }),
  );
  assert.deepEqual(imported, {
    title: "A song",
    content: "G\nLyrics",
    artist: "",
    base_key: "",
    preferred_key: "Bm",
    tuning: "Standard",
    tags: ["worship"],
    duration: "240",
  });
});

test("rejects malformed fields that would crash song rendering", () => {
  for (const invalid of [
    null,
    "a song",
    [],
    {},
    { ...song, tags: "oops" },
    { ...song, tags: [{}] },
    { ...song, title: {} },
    { ...song, title: "   " },
    { ...song, content: 42 },
    { ...song, base_key: [] },
  ])
    assert.throws(() => validateSong(invalid));
});

test("validates the entire batch rather than accepting its valid prefix", () => {
  assert.throws(() =>
    parseSongImport(JSON.stringify([song, { ...song, tags: false }])),
  );
  assert.equal(validateSongs([song, song]).length, 2);
});

test("caps import count and total bytes before writing", () => {
  assert.throws(() => validateSongs([]));
  assert.throws(() => validateSongs(Array(101).fill(song)));
  assert.throws(() => parseSongImport(" ".repeat(MAX_IMPORT_BYTES + 1)));
  assert.throws(() =>
    validateSongs(Array(30).fill({ ...song, content: "a".repeat(200_000) })),
  );
});

test("caps text and tags while preserving empty chart drafts", () => {
  assert.equal(validateSong({ ...song, content: "" }).content, "");
  assert.throws(() => validateSong({ ...song, title: "a".repeat(201) }));
  assert.throws(() => validateSong({ ...song, content: "a".repeat(200_001) }));
  assert.throws(() => validateSong({ ...song, tags: Array(31).fill("tag") }));
  assert.throws(() => validateSong({ ...song, tags: ["a".repeat(51)] }));
});

test("supports editor and AI durations but rejects nonfinite or invalid values", () => {
  for (const duration of ["", 0, "240", 240, 86400]) {
    assert.equal(
      validateSong({ ...song, duration }).duration,
      String(duration),
    );
  }
  for (const duration of [-1, 86401, Infinity, NaN, "1.5", {}, "12 seconds"]) {
    assert.throws(() => validateSong({ ...song, duration }));
  }
});

test("malformed JSON produces a usable error", () => {
  assert.throws(() => parseSongImport("{"), /Invalid JSON format/);
});
