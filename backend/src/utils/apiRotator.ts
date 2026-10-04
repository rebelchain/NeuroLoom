import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[];

let currentGeminiIndex = 0;
let currentGroqIndex = 0;

export function getActiveGeminiKey(): string {
  if (GEMINI_KEYS.length === 0) {
    throw new Error("Tidak ada GEMINI_API_KEY yang ditemukan di file .env");
  }
  return GEMINI_KEYS[currentGeminiIndex];
}

export function rotateGeminiKey(): string {
  currentGeminiIndex = (currentGeminiIndex + 1) % GEMINI_KEYS.length;
  console.log(
    `\n[API ROTATOR] Beralih ke Gemini API Key Index: ${currentGeminiIndex + 1}/${GEMINI_KEYS.length}`,
  );
  return GEMINI_KEYS[currentGeminiIndex];
}

// FUNGSI ROTATOR GROQ
export function getActiveGroqKey(): string {
  if (GROQ_KEYS.length === 0) throw new Error("Tidak ada GROQ_API_KEY di .env");
  return GROQ_KEYS[currentGroqIndex];
}

export function rotateGroqKey(): string {
  currentGroqIndex = (currentGroqIndex + 1) % GROQ_KEYS.length;
  console.log(
    `\n🔄 [API ROTATOR] Beralih ke Groq API Key Index: ${currentGroqIndex + 1}/${GROQ_KEYS.length}`,
  );
  return GROQ_KEYS[currentGroqIndex];
}
