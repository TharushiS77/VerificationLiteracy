import { NextResponse } from "next/server";
import { callGemini, parseJsonFromModel } from "../../../lib/gemini";
import { getTask } from "../../../lib/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { taskId, draft, diagnosis, finalVersion } = await req.json();
    const task = getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: "Unknown task." }, { status: 400 });
    }

    const rubricList = task.rubric.map((r, i) => `${i + 1}. ${r}`).join("\n");

    // The grader sees the hidden errorSpec, so it knows what flaw the learner
    // was supposed to catch. It scores the learner's diagnosis AND their fix.
    const prompt = [
      "You are a fair, specific grading coach in a training tool that teaches people to catch and fix mistakes in AI output.",
      "You are grading a LEARNER, not the AI. Judge how well the learner (a) diagnosed what was wrong and (b) fixed it.",
      "",
      "THE TASK BRIEF (the ground truth the work must satisfy):",
      task.brief,
      "",
      "THE FLAW THAT WAS DELIBERATELY PLANTED IN THE AI DRAFT (the learner was NOT told this):",
      task.errorSpec,
      "",
      "THE FLAWED AI DRAFT THE LEARNER REVIEWED:",
      draft || "(none provided)",
      "",
      "THE LEARNER'S DIAGNOSIS (what they said was wrong):",
      diagnosis?.trim() ? diagnosis : "(they wrote nothing)",
      "",
      "THE LEARNER'S FINAL FIXED VERSION:",
      finalVersion?.trim() ? finalVersion : "(they submitted nothing)",
      "",
      "Grade the learner against these criteria:",
      rubricList,
      "",
      "Return ONLY valid JSON in exactly this shape, no markdown fences:",
      `{
  "overallScore": <integer 0-100>,
  "verdict": "<'pass' if 75 or above, otherwise 'revise'>",
  "caughtTheFlaw": <true or false>,
  "criteria": [
    { "name": "<short criterion name>", "score": <0-100>, "comment": "<one specific sentence>" }
  ],
  "summary": "<2 sentences: what they did well and the single most useful thing to improve>"
}`,
      "",
      "Be encouraging but honest. Reward catching the planted flaw highly. If they missed it, say so plainly and explain what the tell was.",
    ].join("\n");

    const raw = await callGemini(prompt, { temperature: 0.2 });

    let result;
    try {
      result = parseJsonFromModel(raw);
    } catch (e) {
      // If the model didn't return clean JSON, don't crash — return the
      // text so the learner still gets feedback.
      return NextResponse.json({
        overallScore: null,
        verdict: "revise",
        caughtTheFlaw: null,
        criteria: [],
        summary: raw.trim().slice(0, 800),
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
