// The "content library" for the Review Gym.
//
// Each task is a realistic piece of everyday knowledge work. For each one:
//   - brief:      the real requirements the learner is judged against
//   - audience:   who this task is for (shown in the UI)
//   - errorSpec:  a hidden instruction that tells the AI to deliberately
//                 introduce ONE realistic, catchable flaw. This is never
//                 sent to the browser — otherwise it would give away the
//                 answer. Only the server (generate + grade routes) sees it.
//   - rubric:     the criteria the grader scores the learner on.
//
// This is what makes the Gym a *practice* tool rather than a chatbot:
// the AI's draft is intentionally flawed, and the learner's job is to
// catch it, fix it, and add the human judgment the AI can't.

export const TASKS = [
  {
    id: "client-followup",
    title: "Re-engage a quiet client (email)",
    audience: "Salesperson following up after a proposal went silent",
    brief:
      "Write a short, warm follow-up email to Priya, a prospect who received our proposal 12 days ago and hasn't replied. " +
      "Requirements: keep it under 120 words; friendly and human, not corporate; make exactly ONE clear ask (a 15-minute call); " +
      "reference that she was worried about onboarding time for her team. Do NOT invent any details, prices, discounts, or dates that aren't given here.",
    errorSpec:
      "Make the draft break the brief in ONE clear way: invent a specific concrete detail that was never provided — for example a fake discount percentage, a made-up price, a specific deadline, or a feature we never mentioned. Also make the tone slightly generic and robotic. Keep it otherwise plausible so the flaw must be noticed, not obvious at a glance.",
    rubric: [
      "Caught the fabrication: did the learner notice the AI invented a detail (discount / price / date / feature) that wasn't in the brief?",
      "Requirement match: does the final email keep ONE ask, stay under ~120 words, and reference the onboarding-time concern?",
      "Human quality: did the learner make it warmer and less robotic rather than just accepting the AI's tone?",
    ],
  },
  {
    id: "product-onepager",
    title: "Summarize a product for a busy executive",
    audience: "Marketer writing a one-paragraph blurb for a time-poor exec",
    brief:
      "Product: 'Loop', an internal tool that automatically turns messy customer-support tickets into weekly trend reports for managers. " +
      "Write a 4-sentence summary for a busy, non-technical executive. Requirements: plain language, no jargon; focus on the business outcome " +
      "(less time reading tickets, faster decisions); make only claims supported by the description above.",
    errorSpec:
      "Make the draft break the brief in ONE clear way: either write it for a technical audience (heavy jargon like 'NLP pipeline', 'vector embeddings', 'API-first') OR add an unsupported superlative claim such as 'the #1 tool on the market' or 'saves 90% of time' that the description never supports. Keep everything else reasonable.",
    rubric: [
      "Caught the flaw: did the learner notice the jargon (wrong audience) or the unsupported claim?",
      "Requirement match: is the final version 4 plainly-worded sentences focused on the business outcome, with no invented claims?",
      "Human quality: did the learner improve clarity for a non-technical exec rather than just accept the draft?",
    ],
  },
  {
    id: "meeting-actions",
    title: "Turn messy meeting notes into action items",
    audience: "Ops / project coordinator cleaning up a meeting transcript",
    brief:
      "Turn the transcript below into a clean list of action items, each with an owner and (if stated) a due date. " +
      "Only include actions that were actually agreed. Do not invent owners or tasks.\n\n" +
      "TRANSCRIPT:\n" +
      "Sam: Okay, so the launch page is behind. Aisha, can you get the copy done by Friday?\n" +
      "Aisha: Yes, Friday works.\n" +
      "Sam: Great. Ravi, once the copy's in, you handle the design.\n" +
      "Ravi: Sure, but I'll need it by Friday to hit Monday.\n" +
      "Sam: We also talked about pricing but let's park that for next week, no owner yet.\n" +
      "Aisha: Should someone email the beta users?\n" +
      "Sam: Good point, but let's decide who next time.",
    errorSpec:
      "Make the draft break the brief in ONE clear way: either INVENT an owner/date for something that was explicitly left unassigned (e.g. assign the 'email the beta users' task or the pricing discussion to a specific person), OR drop one of the two real agreed action items (Aisha's copy, Ravi's design). Keep the rest accurate so the error must be spotted by comparing against the transcript.",
    rubric: [
      "Caught the flaw: did the learner notice an invented owner/task OR a dropped real action item by checking against the transcript?",
      "Requirement match: does the final list contain exactly the agreed actions (Aisha: copy by Friday; Ravi: design after copy) with correct owners, and correctly leave pricing + beta-email unassigned?",
      "Human quality: is the final list clear and genuinely usable (owners, dates, no noise)?",
    ],
  },
];

export function getTask(id) {
  return TASKS.find((t) => t.id === id) || null;
}
