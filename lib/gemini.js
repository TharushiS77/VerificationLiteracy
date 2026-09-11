// Thin wrapper around the Gemini REST API.
// The API key stays on the server (read from env), so it is never exposed
// in the browser. That is why the app calls Gemini through /api routes
// instead of directly from the page.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

// We try these models in order. If Google renames or retires one (which
// happens), the next candidate is used automatically, so the live demo
// does not break because of a model-name change. You can force a specific
// model with the GEMINI_MODEL env var.
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
].filter(Boolean);

/**
 * Send a prompt to Gemini and return the raw text response.
 *
 * @param {string} prompt
 * @param {object} opts
 *   - temperature {number}
 *   - maxOutputTokens {number}
 *   - json {boolean}   ask Gemini to reply as strict JSON
 *   - schema {object}  an OpenAPI-style responseSchema (implies json)
 * @returns {Promise<string>}
 */
export async function callGemini(prompt, opts = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it in Vercel under Settings, Environment Variables (or in .env.local for local dev)."
    );
  }

  // Base config. thinkingBudget: 0 turns OFF the hidden reasoning that newer
  // "thinking" models do by default. Without this, that reasoning eats the
  // output-token budget and the real answer comes back truncated (cut-off
  // drafts, unparseable JSON). Some older models do not accept thinkingConfig
  // or responseSchema, so we strip those and retry if a model returns 400.
  const fullConfig = {
    temperature: opts.temperature ?? 0.7,
    maxOutputTokens: opts.maxOutputTokens ?? 2048,
    thinkingConfig: { thinkingBudget: 0 },
  };
  if (opts.json || opts.schema) {
    fullConfig.responseMimeType = "application/json";
    if (opts.schema) fullConfig.responseSchema = opts.schema;
  }

  // A safe subset that every model version accepts.
  const safeConfig = {
    temperature: fullConfig.temperature,
    maxOutputTokens: fullConfig.maxOutputTokens,
  };
  if (fullConfig.responseMimeType) safeConfig.responseMimeType = "application/json";

  let lastError = null;

  for (const model of MODEL_CANDIDATES) {
    try {
      let res = await postTo(model, prompt, fullConfig, apiKey);

      // 404: this model name is unavailable, move to the next candidate.
      if (res.status === 404) {
        lastError = new Error(`Model ${model} not found (404).`);
        continue;
      }
      // 400: an option was rejected. Retry this same model with the safe subset.
      if (res.status === 400) {
        res = await postTo(model, prompt, safeConfig, apiKey);
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const text = extractText(data);
      if (!text.trim()) throw new Error("Gemini returned an empty response.");
      return text;
    } catch (err) {
      lastError = err;
      // Try the next model on any network-level failure.
    }
  }

  throw lastError ?? new Error("Gemini request failed for all model candidates.");
}

async function postTo(model, prompt, generationConfig, apiKey) {
  return fetch(`${ENDPOINT}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });
}

function extractText(data) {
  return (
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? ""
  );
}

/**
 * Parse JSON from a model response. With json mode the text is already clean,
 * but this stays defensive against fences or stray prose just in case.
 */
export function parseJsonFromModel(text) {
  let cleaned = text.trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  if (!cleaned.startsWith("{")) {
    const braceStart = cleaned.indexOf("{");
    const braceEnd = cleaned.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd !== -1) {
      cleaned = cleaned.slice(braceStart, braceEnd + 1);
    }
  }

  return JSON.parse(cleaned);
}
