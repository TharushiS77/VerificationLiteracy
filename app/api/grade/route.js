import { NextResponse } from "next/server";
import { callGemini, parseJsonFromModel } from "../../../lib/gemini";
import { getTask } from "../../../lib/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A strict shape for the grade. Forcing this schema is what guarantees the
// app always gets clean data to display, never a wall of raw JSON on screen.
const GRADE_SCHEMA = {
  type: "object",
  properties: {
    caughtMistake: { type: "boolean" },
    hiddenMistake: { type: "string" },
    overallScore: { type: "integer" },
    checks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          status: { type: "string", enum: ["good", "partial", "missing"] },
          note: { type: "string" },
        },
        required: ["label", "status", "note"],
      },
    },
    didWell: { type: "string" },
    toImprove: { type: "string" },
  },
  required: [
    "caughtMistake",
    "hiddenMistake",
    "overallScore",
    "checks",
    "didWell",
    "toImprove",
  ],
};

export async function POST(req) {
  try {
    const { taskId, draft, diagnosis, finalVersion } = await req.json();
    const task = getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: "Unknown task." }, { status: 400 });
    }

    const rubricList = task.rubric.map((r, i) => `${i + 1}. ${r}`).join("\n");

    const prompt = [
      "You are a warm, plain-spoken coach in a tool that teaches people to catch and fix mistakes in AI writing.",
      "You are grading the LEARNER, not the AI. Judge how well they (a) spotted what was wrong and (b) fixed it.",
      "",
      "THE BRIEF (the requirements the work must meet):",
      task.brief,
      "",
      "THE MISTAKE THAT WAS SECRETLY PLANTED IN THE AI DRAFT (the learner was not told this):",
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
      "Fill in the fields as follows:",
      "- caughtMistake: true only if their diagnosis clearly identified the planted mistake.",
      "- hiddenMistake: describe, in one plain friendly sentence, what was actually wrong with THIS draft, so the learner can learn what to look for.",
      "- overallScore: 0 to 100. Weight catching the mistake heavily.",
      "- checks: exactly 3 items, each a short plain label (for example 'Spotted the mistake', 'Meets the brief', 'Sounds human'), a status of good, partial, or missing, and a one-line note.",
      "- didWell: one specific, encouraging sentence about what they did well.",
      "- toImprove: the single most useful thing to do better next time, in one sentence.",
      "",
      "Write every sentence in warm, simple language a beginner understands. Do NOT use em dashes; use commas or periods.",
    ].join("\n");

    const raw = await callGemini(prompt, {
      temperature: 0.2,
      schema: GRADE_SCHEMA,
      maxOutputTokens: 1024,
    });

    let result;
    try {
      result = parseJsonFromModel(raw);
    } catch (e) {
      // Extremely unlikely now that we force a schema, but stay safe: return a
      // clean, friendly fallback instead of ever dumping raw text on screen.
      return NextResponse.json({
        caughtMistake: null,
        hiddenMistake: "",
        overallScore: null,
        checks: [],
        didWell: "",
        toImprove:
          "The grader had trouble scoring this attempt. Please try submitting again.",
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to grade." },
      { status: 500 }
    );
  }
}
