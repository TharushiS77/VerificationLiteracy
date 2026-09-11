import { NextResponse } from "next/server";
import { callGemini, parseJsonFromModel } from "../../../lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Checks a real AI output the user pastes in. Not a grade of the user, just a
// review against the four failure modes with specific things to verify.
const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    overallRisk: { type: "string", enum: ["low", "medium", "high"] },
    summary: { type: "string" },
    checks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          status: { type: "string", enum: ["ok", "watch", "issue"] },
          note: { type: "string" },
        },
        required: ["category", "status", "note"],
      },
    },
    flags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          quote: { type: "string" },
          issue: { type: "string" },
          suggestion: { type: "string" },
        },
        required: ["quote", "issue", "suggestion"],
      },
    },
  },
  required: ["overallRisk", "summary", "checks", "flags"],
};

export async function POST(req) {
  try {
    const { requirements, output } = await req.json();
    if (!output || !output.trim()) {
      return NextResponse.json(
        { error: "Paste the AI output you want checked." },
        { status: 400 }
      );
    }

    const prompt = [
      "You are a careful reviewer that helps a person verify something an AI wrote before they use it.",
      "You are NOT grading the person. You are checking the AI's output so they can catch problems.",
      "Be helpful and specific, and never invent problems that are not there. If it looks solid, say so.",
      "",
      requirements?.trim()
        ? "WHAT THEY ASKED THE AI TO DO:\n" + requirements
        : "They did not give the original instructions, so judge the output on its own for internal consistency and unsupported claims.",
      "",
      "THE AI OUTPUT TO CHECK:",
      output,
      "",
      "Check it against the four ways AI output tends to be wrong, and return JSON:",
      '- "overallRisk": "low", "medium", or "high" (how risky it would be to use this as-is).',
      '- "summary": one or two plain sentences on the overall state.',
      '- "checks": exactly 4 items, one per category, in this order: "Made-up facts", "Missed the ask", "Wrong focus", "Robotic tone". Each has "status" ("ok", "watch", or "issue") and a one-line "note".',
      '- "flags": 0 to 4 specific things to verify or fix. Each has "quote" (a short exact snippet from the output), "issue" (what might be wrong), and "suggestion" (what to do).',
      "",
      "If you cannot verify a fact because the source was not given, treat it as something to verify, not as automatically wrong. Do NOT use em dashes; use commas or periods.",
    ].join("\n");

    const raw = await callGemini(prompt, {
      temperature: 0.2,
      schema: REVIEW_SCHEMA,
      maxOutputTokens: 2048,
    });

    let result;
    try {
      result = parseJsonFromModel(raw);
    } catch (e) {
      return NextResponse.json(
        { error: "The reviewer had trouble reading that. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to review." },
      { status: 500 }
    );
  }
}
