import { NextResponse } from "next/server";
import { callGemini } from "../../../lib/gemini";
import { getTask } from "../../../lib/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { taskId } = await req.json();
    const task = getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: "Unknown task." }, { status: 400 });
    }

    // errorSpec stays server-side so the planted mistake isn't sent to the client.
    const prompt = [
      "You are simulating a busy employee who used an AI assistant to do a task quickly.",
      "Produce ONLY the finished draft. No preamble, no notes, no explanation, no headings like 'Draft:'.",
      "",
      "TASK BRIEF:",
      task.brief,
      "",
      "IMPORTANT: you must intentionally introduce a flaw, because this is a training exercise:",
      task.errorSpec,
      "",
      "The draft MUST contain that one flaw. Never return a fully correct draft. Do not add more than one flaw either.",
      "Keep it realistic and plausible so the flaw has to be noticed, not obvious at a glance.",
      "Write the way a real person types. Do NOT use em dashes or en dashes; use commas, periods, or parentheses instead.",
    ].join("\n");

    const draft = await callGemini(prompt, {
      temperature: 0.9,
      maxOutputTokens: 2048,
    });

    return NextResponse.json({ draft: draft.trim() });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to generate draft." },
      { status: 500 }
    );
  }
}
