import { GoogleGenAI, Type } from "@google/genai";

function getApiKey() {
  return (
    import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem("geminiApiKey")
  );
}

const SYSTEM_INSTRUCTION = `
You are the song-importer skill for the Bass Tab Manager app.
Your job is to format song lyrics and chords into a specific JSON format, maximizing compatibility with the built-in transposer and UI preview.

## Core Workflow
1. **Extract Metadata**: Identify the Title, Artist, Base Key, and Tuning. These go in the top-level JSON fields — NOT in \`content\`.
2. **Format Sections**: Use bracketed headers (e.g., \`[Intro]\`, \`[Verso 1]\`, \`[Estribillo]\`) for visual clarity. The \`content\` field starts directly with the first section header.
3. **Chord Alignment**: Ensure chords are placed directly above the lyrics they correspond to.

## Expected Format Template for 'content'
[Intro]
G  Em  C  D

[Verso 1]
G             Em
Lyrics go here...
     C           D
More lyrics here...

## Rules
- Do NOT include \`Key:\`, \`Tuning:\`, or ASCII tab blocks in \`content\`. Those fields exist at the JSON level.
- The app's transposer uses a regex to find chords. Avoid using ambiguous text that might be mistaken for a chord.
- Support both English (\`[Chorus]\`) and Spanish (\`[Estribillo]\`) section headers based on the input.
- Prefer Sentence Case (e.g., "Lyrics go here") over ALL CAPS.
- \`duration\`: Integer in seconds. Estimate from the song length if not explicitly known.
- CRITICAL: You MUST use explicit newline characters (\`\\n\`) to format the \`content\` field properly. Never squash the lyrics and chords into a single line. Every chord line must be above the lyric line, separated by \`\\n\`. Every section header must be on its own line, followed by \`\\n\`.
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    artist: { type: Type.STRING },
    base_key: { type: Type.STRING, description: "e.g., 'E', 'G', 'C#'" },
    tuning: { type: Type.STRING, description: "e.g., 'Standard', 'Drop D'" },
    duration: { type: Type.INTEGER, description: "Duration in seconds" },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    content: {
      type: Type.STRING,
      description:
        "Sections with chords and lyrics only, starting directly with the first [Section] header",
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

export async function analyzeSong(input, imageFile = null) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Please set your Gemini API Key in Settings first.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const contents = [];

  if (imageFile) {
    // Convert File to base64
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    contents.push({
      inlineData: {
        data: base64Data,
        mimeType: imageFile.type,
      },
    });
  }

  if (input) {
    contents.push(input);
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.2,
    },
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text);
}
