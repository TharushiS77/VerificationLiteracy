// Server-side helper for calling Gemini. Key is read from env and never
// reaches the browser.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

// Tried in order, so a renamed/retired model doesn't break things. Override with GEMINI_MODEL.
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
].filter(Boolean);

export async function callGemini(prompt, opts = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it in Vercel under Settings, Environment Variables (or in .env.local for local dev)."
    );
  }

  // thinkingBudget 0 stops the newer models from spending the token budget on
  // hidden reasoning, which was cutting off drafts and breaking JSON.
  const fullConfig = {
    temperature: opts.temperature ?? 0.7,
    maxOutputTokens: opts.maxOutputTokens ?? 2048,
    thinkingConfig: { thinkingBudget: 0 },
  };
  if (opts.json || opts.schema) {
    fullConfig.responseMimeType = "application/json";
    if (opts.schema) fullConfig.responseSchema = opts.schema;
  }

  // Some older models reject thinkingConfig/responseSchema; this is the retry.
  const safeConfig = {
    temperature: fullConfig.temperature,
    maxOutputTokens: fullConfig.maxOutputTokens,
  };
  if (fullConfig.responseMimeType) safeConfig.responseMimeType = "application/json";

  let lastError = null;

  for (const model of MODEL_CANDIDATES) {
    try {
      let res = await postTo(model, prompt, fullConfig, apiKey);

      if (res.status === 404) {
        lastError = new Error(`Model ${model} not found (404).`);
        continue;
      }
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
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
}

// Pull JSON out of a reply, tolerating code fences or stray text around it.
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
