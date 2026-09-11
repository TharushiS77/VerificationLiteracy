// The "content library" for the Review Gym.
//
// Each task is a realistic piece of everyday knowledge work. For each one:
//   - brief:      the real requirements the learner is judged against
//   - audience:   who this task is for (shown in the UI)
//   - errorSpec:  a hidden instruction telling the AI to plant ONE realistic,
//                 catchable flaw. Never sent to the browser (it would give away
//                 the answer). Only the server routes see it.
//   - rubric:     the criteria the grader scores the learner on.
//   - hint:       a nudge the learner can reveal on demand. It points at the
//                 KIND of thing to check, without naming the exact mistake.
//   - lesson:     shown after grading, teaches the general skill so the learner
//                 gets better, not just a score.

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
      "Plant ONE clear flaw: invent a specific concrete detail that was never provided, for example a discount percentage, a price, a specific deadline, or a feature we never mentioned. Keep the rest plausible so the flaw must be noticed, not obvious at a glance.",
    hint: "Check every specific fact in the draft, any number, date, price, or offer, against the brief. The brief says to invent nothing.",
    lesson:
      "AI often adds confident details that were never given, like a discount or a deadline, because it is trying to be helpful. Before you send anything AI wrote, check each specific fact against your source.",
    rubric: [
      "Caught the invented detail: did the learner notice the AI added a fact (discount, price, date, or feature) that was not in the brief?",
      "Met the brief: does the final email keep ONE ask, stay under about 120 words, and mention the onboarding-time concern?",
      "Sounds human: did the learner make it warmer and less robotic instead of accepting the AI's tone?",
    ],
  },
  {
    id: "product-onepager",
    title: "Summarize a product for a busy executive",
    audience: "Marketer writing a short blurb for a time-poor executive",
    brief:
      "Product: 'Loop', an internal tool that automatically turns messy customer-support tickets into weekly trend reports for managers. " +
      "Write a 4-sentence summary for a busy, non-technical executive. Requirements: plain language, no jargon; focus on the business outcome " +
      "(less time reading tickets, faster decisions); make only claims supported by the description above.",
    errorSpec:
      "Plant ONE clear flaw: either write it for a technical audience (heavy jargon like 'NLP pipeline', 'vector embeddings', 'API-first') OR add an unsupported claim such as 'the number one tool on the market' or 'saves 90% of time' that the description never supports. Keep everything else reasonable.",
    hint: "Think about who is reading this. Is the language right for a busy, non-technical executive? And is every claim actually backed by the product description?",
    lesson:
      "AI often writes for the wrong audience or adds impressive-sounding claims it cannot back up. Always match the reader, and keep only claims your source actually supports.",
    rubric: [
      "Caught the flaw: did the learner notice the jargon (wrong audience) or the unsupported claim?",
      "Met the brief: is the final version about 4 plain sentences focused on the business outcome, with no invented claims?",
      "Clear for the reader: did the learner make it genuinely easy for a non-technical executive?",
    ],
  },
  {
    id: "meeting-actions",
    title: "Turn messy meeting notes into action items",
    audience: "Coordinator cleaning up a meeting transcript",
    brief:
      "Turn the transcript below into a clean list of action items, each with an owner and (if stated) a due date. " +
      "Only include actions that were actually agreed. Do not invent owners or tasks.\n\n" +
      "TRANSCRIPT:\n" +
      "Sam: Okay, the launch page is behind. Aisha, can you get the copy done by Friday?\n" +
      "Aisha: Yes, Friday works.\n" +
      "Sam: Great. Ravi, once the copy is in, you handle the design.\n" +
      "Ravi: Sure, but I need it by Friday to hit Monday.\n" +
      "Sam: We also talked about pricing but let's park that for next week, no owner yet.\n" +
      "Aisha: Should someone email the beta users?\n" +
      "Sam: Good point, but let's decide who next time.",
    errorSpec:
      "Plant ONE clear flaw: either INVENT an owner or date for something left unassigned (for example assign the 'email the beta users' task or the pricing discussion to a specific person), OR DROP one of the two real agreed action items (Aisha's copy, Ravi's design). Keep the rest accurate so the error must be spotted by comparing against the transcript.",
    hint: "Go line by line through the transcript. Does every item in the draft actually appear there with the right owner? Was anything added, or anything real left out?",
    lesson:
      "AI often invents an owner or quietly drops a task when it summarizes. Check each item against the source, and keep things that were left open, open.",
    rubric: [
      "Caught the flaw: did the learner spot an invented owner/task OR a dropped real action item by checking the transcript?",
      "Met the brief: does the final list contain exactly the agreed actions (Aisha: copy by Friday; Ravi: design after copy) and correctly leave pricing and the beta email unassigned?",
      "Usable: is the final list clear, with owners and dates and no noise?",
    ],
  },
];

// The mental model we want every employee to internalize: the handful of ways
// AI output tends to be wrong. Shown during every review as a teaching aid.
export const WHAT_TO_LOOK_FOR = [
  { title: "Made-up facts", desc: "A number, date, price, or claim that was never in the brief." },
  { title: "Missed the ask", desc: "It skipped or half-did something the brief required." },
  { title: "Wrong focus", desc: "It answered a slightly different question, or wrote for the wrong reader." },
  { title: "Robotic tone", desc: "It reads like a template, not like a person." },
];

export function getTask(id) {
  return TASKS.find((t) => t.id === id) || null;
}
