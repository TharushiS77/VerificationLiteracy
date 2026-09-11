// Thin wrapper around the Gemini REST API.
// The API key stays on the server (read from env), so it is never exposed
// in the browser — that's why the app calls Gemini through /api routes
// instead of directly from the page.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

// We try these models in order. If Google renames or retires one (which
// happens), the next candidate is used automatically — so the live demo
// doesn't break because of a model-name change. You can force a specific
// model with the GEMINI_MODEL env var.
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
].filter(Boolean);

/**
 * Send a prompt to Gemini and return the plain-text response.
 * @param {string} prompt
 * @param {object} opts - { temperature }
 * @returns {Promise<string>}
 */
export async function callGemini(prompt, opts = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it in Vercel → Settings → Environment Variables (or in .env.local for local dev)."
    );
  }

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: 1200,
    },
  };

  let lastError = null;

  for (const model of MODEL_CANDIDATES) {
    try {
      const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        // 404 = model name not available; try the next candidate.
        // Other errors (bad key, quota) won't be fixed by another model,
        // so surface them immediately.
        if (res.status === 404) {
          lastError = new Error(`Model ${model} not found (404).`);
          continue;
        }
        throw new Error(`Gemini API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text)
          .join("") ?? "";

      if (!text.trim()) {
        throw new Error("Gemini returned an empty response.");
      }
      return text;
    } catch (err) {
      lastError = err;
      // Network-level failure — try the next model as a fallback.
    }
  }

  throw lastError ?? new Error("Gemini request failed for all model candidates.");
}

/**
 * Ask Gemini for JSON and parse it robustly (models sometimes wrap JSON
 * in ```json fences or add stray prose).
 */
export function parseJsonFromModel(text) {
  let cleaned = text.trim();

  // Strip ```json ... ``` or ``` ... ``` fences if present.
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  // Otherwise grab the first {...} block.
  if (!cleaned.startsWith("{")) {
    const braceStart = cleaned.indexOf("{");
    const braceEnd = cleaned.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd !== -1) {
      cleaned = cleaned.slice(braceStart, braceEnd + 1);
    }
  }

  return JSON.parse(cleaned);
}
