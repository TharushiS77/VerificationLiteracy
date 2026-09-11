import { NextResponse } from "next/server";
import { callGemini, parseJsonFromModel } from "../../../lib/gemini";
import { getTask } from "../../../lib/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildPrompt(task, draft, diagnosis, finalVersion, extraStrict) {
  const rubricList = task.rubric.map((r, i) => `${i + 1}. ${r}`).join("\n");
  return [
    "You are a warm, plain-spoken coach in a tool that teaches people to catch and fix mistakes in AI writing.",
    "You are grading the LEARNER, not the AI. Judge how well they (a) spotted what was wrong and (b) fixed it.",
    "",
    "THE BRIEF (the requirements the work must meet):",
    task.brief,
    "",
    "THE MISTAKE SECRETLY PLANTED IN THE AI DRAFT (the learner was not told this):",
    task.errorSpec,
    "",
    "THE FLAWED AI DRAFT THE LEARNER REVIEWED:",
    draft || "(none)",
    "",
    "WHAT THE LEARNER SAID WAS WRONG:",
    diagnosis?.trim() ? diagnosis : "(they wrote nothing)",
    "",
    "THE LEARNER'S FIXED VERSION:",
    finalVersion?.trim() ? finalVersion : "(they submitted nothing)",
    "",
    "Grade them against these criteria:",
    rubricList,
    "",
    "Reply with a JSON object with exactly these keys:",
    '- "caughtMistake": boolean. true only if their diagnosis clearly identified the planted mistake.',
    '- "hiddenMistake": string. One plain, friendly sentence naming what was actually wrong with THIS draft.',
    '- "overallScore": integer 0 to 100. Weight catching the mistake heavily.',
    '- "checks": array of exactly 3 objects, each {"label": short string, "status": "good" | "partial" | "missing", "note": one short sentence}. Use labels like "Spotted the mistake", "Meets the brief", "Sounds human".',
    '- "didWell": string. One specific, encouraging sentence.',
    '- "toImprove": string. The single most useful thing to do better next time, one sentence.',
    "",
    "Write every sentence in warm, simple language a beginner understands. Do NOT use em dashes; use commas or periods.",
    extraStrict ? "Return ONLY the JSON object. No code fences, no text before or after it." : "",
  ].join("\n");
}

async function gradeOnce(task, draft, diagnosis, finalVersion, strict) {
  const raw = await callGemini(
    buildPrompt(task, draft, diagnosis, finalVersion, strict),
    { temperature: strict ? 0 : 0.2, json: true, maxOutputTokens: 3072 }
  );
  return parseJsonFromModel(raw);
}

export async function POST(req) {
  try {
    const { taskId, draft, diagnosis, finalVersion } = await req.json();
    const task = getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: "Unknown task." }, { status: 400 });
    }

    let result = null;
    try {
      result = await gradeOnce(task, draft, diagnosis, finalVersion, false);
    } catch (e) {
      // First response was not clean JSON. Try once more, stricter.
      try {
        result = await gradeOnce(task, draft, diagnosis, finalVersion, true);
      } catch (e2) {
        result = null;
      }
    }

    // Basic shape guard. If anything essential is missing, treat as not graded
    // so the UI shows a neutral "could not score" state, never a false "miss".
    if (!result || typeof result.overallScore !== "number") {
      return NextResponse.json({
        gradingFailed: true,
        caughtMistake: null,
        overallScore: null,
        hiddenMistake: "",
        checks: [],
        didWell: "",
        toImprove: "",
      });
    }

    return NextResponse.json({ gradingFailed: false, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to grade." },
      { status: 500 }
    );
  }
}
