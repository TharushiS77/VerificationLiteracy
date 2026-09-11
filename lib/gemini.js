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
 *   - json {boolean}          ask Gemini to reply as strict JSON
 *   - schema {object}         an OpenAPI-style responseSchema (implies json)
 * @returns {Promise<string>}
 */
export async function callGemini(prompt, opts = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it in Vercel under Settings, Environment Variables (or in .env.local for local dev)."
    );
  }

  const generationConfig = {
    temperature: opts.temperature ?? 0.7,
    maxOutputTokens: opts.maxOutputTokens ?? 2048,
  };

  // Forcing an application/json response (optionally with a schema) is what
  // stops the model from wrapping its answer in ```json fences or trailing
  // prose. This is the reliable way to get clean, parseable output.
  if (opts.json || opts.schema) {
    generationConfig.responseMimeType = "application/json";
    if (opts.schema) generationConfig.responseSchema = opts.schema;
  }

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig,
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
        // 404 means the model name is unavailable, so try the next candidate.
        // A schema-related 400 also gets retried without the schema below.
        if (res.status === 404) {
          lastError = new Error(`Model ${model} not found (404).`);
          continue;
        }
        // Some older models reject responseSchema. Retry this same model once
        // with plain JSON mode (no schema) before giving up on it.
        if (res.status === 400 && generationConfig.responseSchema) {
          const retry = { ...generationConfig };
          delete retry.responseSchema;
          const res2 = await fetch(`${ENDPOINT}/${model}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({ contents: body.contents, generationConfig: retry }),
          });
          if (res2.ok) {
            const d2 = await res2.json();
            const t2 = extractText(d2);
            if (t2.trim()) return t2;
          }
        }
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

function extractText(data) {
  return (
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? ""
  );
}

/**
 * Parse JSON from a model response. With json/schema mode the text is already
 * clean, but this stays defensive against fences or stray prose just in case.
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
