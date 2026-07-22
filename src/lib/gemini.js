import { GoogleGenAI, Type } from "@google/genai";

function getApiKey() {
  return (
    import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem("geminiApiKey")
  );
}

const SYSTEM_INSTRUCTION = `
You are the song-importer skill for the Chordly app.
Your job is to format song lyrics and chords into a specific JSON format optimized for mobile display.

## Core Workflow
1. **Extract Metadata**: Title, Artist, Base Key, Tuning → top-level JSON fields, NOT in \`content\`.
2. **Format Sections**: Use bracketed headers (e.g., \`[Intro]\`, \`[Verso 1]\`, \`[Estribillo]\`).
3. **Chord Placement**: Chords go on their own line, directly above the lyric line they apply to.

## Chord Notation Style
Use **above-line chord notation**: a chord line followed immediately by a lyric line.
Chord position within the chord line should roughly correspond to where in the lyric the chord falls, but keep spacing simple — do NOT use excessive spaces or tabs to achieve exact syllable-level alignment.

✅ CORRECT:
G                D
El cielo cuenta de tus obras
A                Bm
Poesía escrita por Ti

✅ ALSO CORRECT (chord-only line, no lyric):
D
¿De dónde viene mi socorro?

My ayuda viene de Ti

✅ CORRECT (chord progression line with no lyrics):
G  D  A  Bm

❌ WRONG (inline brackets):
[G]El cielo cuenta [D]de tus obras

❌ WRONG (excessive tab/space padding to align chords over exact syllables):
G                        D                    A
El cielo cuenta de tus obras y más palabras aquí

## Line Length Rules (CRITICAL for mobile)
- Maximum ~40 characters per lyric line.
- Split long phrases at natural breath/phrase breaks. Carry the chord to the next sub-line.
- Never let a lyric line run longer than ~40 characters.
- Short chord lines are fine — do not pad them.

Example of splitting a long line:
Instead of:
G                                        D
Desde el momento que despierto hasta el anochecer

Write:
G                  D
Desde el momento que despierto
A           Em
Hasta el anochecer

## Section Deduplication
- Write each unique section once in full.
- On subsequent repeats, write only the section header (e.g., \`[Estribillo]\`) alone on its own line — no lyrics beneath. This signals "repeat the section defined above."
- If a section has a variation, label it \`[Estribillo Final]\` or \`[Verso 2]\` and write it in full.

## Instrumental / Interlude Sections
- Chord-only sections: list chords on one line separated by spaces.
- Parenthetical notation like \`( G  D  A  Bm )\` is acceptable for loop markers.
- Ignore ASCII bass tab (fret/string notation) — exclude it from \`content\`.

## Annotations and Special Markers
- Parenthetical performance notes like \`(Dice)\`, \`(¿de dónde viene?)\`, \`(¡yeah!)\` are acceptable inline within lyric lines.
- Underscore syllable extensions like \`ro__tos\` or \`socor_ro\` are acceptable to indicate held notes.
- Chord transitions like \`A-G\` (quick change) or slash chords like \`G/D\`, \`D/C#\` are acceptable.
- Repeat markers like \`D4\` (sus4) are acceptable.

## Other Rules
- Do NOT include \`Key:\`, \`Tuning:\`, or ASCII tab blocks in \`content\`.
- Support both Spanish and English section headers based on the input language.
- Prefer Sentence Case over ALL CAPS in lyrics.
- \`duration\`: Integer in seconds. Estimate if unknown (average worship song ~240s).
- \`tags\`: Infer relevant tags from genre, language, feel (e.g., \`["worship", "español", "4/4"]\`).
- Use actual newline characters (\\n) between every line. Never collapse multiple lines into one.
- Remove duplicate slashes from repeat markers like \`//phrase//\` → write as plain lyrics.
- Blank lines between sections are encouraged for readability.

## Full Content Example
[Intro]
D
¿De dónde viene mi socorro?
Mi ayuda viene de Ti

G  D  A  Bm

[Primera Parte]
G                        D
El cielo cuenta de tus obras
A                     Bm
Poesía escrita por Ti
G                   D
Estelas de misericordia
A                  Bm
Todas apuntan a Ti

[Pre-Estribillo]
    A     G
Si me encuentro perdido
    Gm                   D
Sé donde te puedo encontrar

[Estribillo]
     G                 D
Alzaré mis ojos a los montes
      A                   Bm
Te veré radiante como el sol
      G                   D
Seguiré el brillo de tu gracia
        A                       Bm
Porque sé que Tú sigues siendo Dios
       A
Tú sigues siendo Dios

[Interludio]
G  D  A  Bm

[Segunda Parte]
G                        D
Si cuidas de todas las aves
A                     Bm
Sé que me cuidas a mí

[Pre-Estribillo]

[Estribillo]

[Tercera Parte]
D
¿De dónde vienen mi socorro? (Dice)
Mi ayuda viene de Ti
                       D4  D
¿Quién sana corazones ro__tos?
Mi ayuda viene de Ti (¿de dónde viene?)

[Estribillo Final]
     G                   D
Alzaré mis manos a los cielos
      A                 Bm
Te veré obrando a mi favor

G  D  A  Bm
Tú sigues siendo Dios
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    artist: { type: Type.STRING },
    base_key: {
      type: Type.STRING,
      description: "Root key of the song, e.g. 'G', 'C#', 'Eb'",
    },
    tuning: {
      type: Type.STRING,
      description: "Instrument tuning, e.g. 'Standard', 'Drop D'",
    },
    duration: {
      type: Type.INTEGER,
      description: "Estimated duration in seconds",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Genre, language, feel, time signature, etc.",
    },
    content: {
      type: Type.STRING,
      description:
        "Song sections using above-line chord notation, starting with the first [Section] header. Chord lines appear directly above their lyric lines. Lines are kept short for mobile readability.",
    },
  },
  required: [
    "title",
    "artist",
    "base_key",
    "tuning",
    "duration",
    "tags",
    "content",
  ],
};

/**
 * Converts a File to a base64-encoded string (data portion only).
 * @param {File} file
 * @returns {Promise<string>}
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Calls Gemini, retrying transient overload/rate-limit errors (503/429)
 * with exponential backoff before giving up.
 */
async function generateWithRetry(ai, contents, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.1,
        },
      });
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.error?.code || err?.code;
      const isTransient = status === 503 || status === 429;
      if (!isTransient || attempt === maxRetries) break;
      // 1s, 2s, 4s (+ jitter)
      await sleep(1000 * 2 ** attempt + Math.random() * 300);
    }
  }

  const status = lastError?.status || lastError?.error?.code || lastError?.code;
  if (status === 503) {
    throw new Error(
      "Gemini is overloaded right now. Please wait a moment and try again.",
    );
  }
  if (status === 429) {
    throw new Error("Rate limit reached. Please wait a bit and try again.");
  }
  throw lastError;
}

/**
 * Analyzes a song from text input and/or an image file,
 * returning a structured JSON object with metadata and formatted content.
 *
 * @param {string|null} input - Raw song text (lyrics + chords)
 * @param {File|null} imageFile - Optional image of a chord sheet
 * @returns {Promise<object>} Parsed song object matching responseSchema
 */
export async function analyzeSong(input, imageFile = null) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Please set your Gemini API Key in Settings first.");
  }

  if (!input && !imageFile) {
    throw new Error("Provide either a text input or an image file.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const contents = [];

  if (imageFile) {
    const base64Data = await fileToBase64(imageFile);
    contents.push({
      inlineData: { data: base64Data, mimeType: imageFile.type },
    });
  }

  if (input) {
    contents.push(input);
  }

  const response = await generateWithRetry(ai, contents);

  if (!response.text) {
    throw new Error("Empty response from Gemini — please try again.");
  }

  try {
    return JSON.parse(response.text);
  } catch {
    throw new Error("Gemini returned malformed JSON. Please retry.");
  }
}
