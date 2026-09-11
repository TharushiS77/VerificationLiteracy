import { NextResponse } from "next/server";
import { callGemini } from "../../../lib/gemini";
import { getTask } from "../../../lib/tasks";

// Runs on the server (Node/serverless), so the API key stays secret.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { taskId } = await req.json();
    const task = getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: "Unknown task." }, { status: 400 });
    }

    // The generator is deliberately told to inject ONE realistic flaw
    // (the errorSpec). That flaw description is NEVER returned to the client.
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
      "Write the draft now, including that one flaw, but keep it realistic and plausible.",
      "Write the way a real person types. Do NOT use em dashes or en dashes; use commas, periods, or parentheses instead.",
    ].join("\n");

    const draft = await callGemini(prompt, {
      temperature: 0.9,
      maxOutputTokens: 1024,
    });

    return NextResponse.json({ draft: draft.trim() });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to generate draft." },
      { status: 500 }
    );
  }
}
