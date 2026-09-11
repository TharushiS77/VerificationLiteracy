// The "content library" for the Review Gym.
//
// Each task is a realistic piece of everyday knowledge work. For each one:
//   - brief:      the real requirements the learner is judged against
//   - audience:   who this task is for (shown in the UI)
//   - errorSpec:  a MANDATORY instruction to plant ONE specific, catchable flaw.
//                 Written so the model can never quietly return a correct draft.
//                 Never sent to the browser (it would give away the answer).
//   - rubric:     the criteria the grader scores the learner on.
//   - hint:       a nudge the learner can reveal on demand. Points at the KIND
//                 of thing to check, without naming the exact mistake.
//   - lesson:     shown after grading, teaches the general skill.

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
      "You MUST plant exactly one clear flaw: invent a specific fact that was never given, such as a discount percentage, a price, or a specific calendar date the proposal was sent. Make it a concrete, checkable detail. Do NOT produce a fully correct draft.",
    hint: "Check every specific fact in the draft, any number, date, price, or offer, against the brief. The brief says to invent nothing.",
    lesson:
      "AI often adds confident details that were never given, like a discount or a deadline, because it is trying to be helpful. Before you send anything AI wrote, check each specific fact against your source.",
    rubric: [
      "Caught the invented detail: did the learner notice the AI added a fact (discount, price, or date) that was not in the brief?",
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
      "You MUST plant exactly one clear flaw: add one unsupported claim the description never supports, for example 'the number one tool on the market' or 'saves 90% of time'. Do NOT produce a fully correct draft.",
    hint: "Think about who is reading this. Is the language right for a busy, non-technical executive? And is every claim actually backed by the product description?",
    lesson:
      "AI often adds impressive-sounding claims it cannot back up. Always keep only claims your source actually supports.",
    rubric: [
      "Caught the flaw: did the learner notice the unsupported claim (or wrong-audience jargon)?",
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
      "You MUST plant exactly one clear flaw: add a made-up action item that assigns the 'email the beta users' task to a specific person with a due date (for example 'Ravi: email the beta users by Monday'), as if it were agreed, even though the transcript explicitly left it unassigned. Keep Aisha's copy task and Ravi's design task correct and present. Do NOT produce a fully correct draft.",
    hint: "Go line by line through the transcript. Does every item in the draft actually appear there with the right owner? Two things were explicitly left unassigned, are they still unassigned?",
    lesson:
      "AI often invents an owner or a task when it summarizes, turning 'someone should maybe do this' into a firm assignment. Check each item against the source, and keep open things open.",
    rubric: [
      "Caught the flaw: did the learner spot the invented action item (assigning the beta-user email, which was left unassigned)?",
      "Met the brief: does the final list contain exactly the agreed actions (Aisha: copy by Friday; Ravi: design after copy) and correctly leave pricing and the beta email unassigned?",
      "Usable: is the final list clear, with owners and dates and no noise?",
    ],
  },
  {
    id: "team-update",
    title: "Post a status update to the team",
    audience: "Team lead posting a quick update in a team channel",
    brief:
      "Post a 2 to 3 sentence update in the team channel: the launch has slipped from this Friday to next Wednesday because design needs more time. " +
      "Keep it calm and clear. Do NOT invent a cause beyond 'design needs more time', do not blame anyone, and do not add details that are not given here.",
    errorSpec:
      "You MUST plant exactly one clear flaw: invent a detail that was not given, such as a specific new reason (a vendor delay, a bug, a sick teammate), a person to blame, or a different date. Do NOT produce a fully correct draft.",
    hint: "The only facts you were given are: the launch moved from this Friday to next Wednesday, because design needs more time. Anything more specific than that is invented.",
    lesson:
      "AI likes to 'add color' by inventing reasons or assigning blame you never gave it. Keep updates to the facts you actually have, especially anything others will act on.",
    rubric: [
      "Caught the flaw: did the learner notice the invented cause, blame, or wrong date?",
      "Met the brief: does the final update say only that the launch moved from Friday to next Wednesday because design needs more time, calmly and clearly?",
      "Clear: is it a tight 2 to 3 sentences a team could read at a glance?",
    ],
  },
  {
    id: "sales-numbers",
    title: "Summarize sales numbers for a manager",
    audience: "Analyst summarizing a simple results table",
    brief:
      "Summarize these Q1 results in 2 to 3 sentences for a manager. Use ONLY these numbers, and do not add any figure that is not here.\n\n" +
      "Q1 SALES:\n" +
      "January: 40 sales\n" +
      "February: 55 sales\n" +
      "March: 65 sales\n" +
      "Total: 160 sales",
    errorSpec:
      "You MUST plant exactly one clear numeric flaw: change or miscalculate one number, for example state a wrong monthly figure, a wrong total, or a made-up growth percentage that the data does not support. Keep the wording otherwise sensible. Do NOT produce a fully correct summary.",
    hint: "Check every number in the summary against the table: January 40, February 55, March 65, total 160. Recompute any total or percentage it claims.",
    lesson:
      "AI often gets numbers subtly wrong or invents a percentage that sounds right. Always recompute figures against the source before you trust or forward them.",
    rubric: [
      "Caught the flaw: did the learner spot the wrong or invented number?",
      "Met the brief: does the final summary use only the correct figures (Jan 40, Feb 55, Mar 65, total 160) with no invented stats?",
      "Clear: is it a tight 2 to 3 sentence summary a manager can trust?",
    ],
  },
  {
    id: "policy-reply",
    title: "Answer a customer using company policy",
    audience: "Support agent replying with the refund policy",
    brief:
      "A customer asks: 'Can I get a refund on my annual plan? I bought it 45 days ago.' " +
      "Reply politely using ONLY this policy: refunds are available within 30 days of purchase; after 30 days there are no refunds, but the customer can cancel to stop future billing. " +
      "Do NOT invent exceptions, prorated or partial refunds, or any detail not in this policy.",
    errorSpec:
      "You MUST plant exactly one clear flaw: state a policy detail that is not in the given policy or contradicts it, for example offering a partial or prorated refund, a 60 day window, or a special manager exception. Keep the tone polite. Do NOT produce a fully correct reply.",
    hint: "Check every policy claim in the reply against the given policy: refunds within 30 days only, after that the customer can cancel to stop future billing. Anything else is invented.",
    lesson:
      "AI often invents helpful-sounding exceptions or wrong policy details. In policy, legal, or compliance work, check each statement against the actual source, because a made-up promise can be costly.",
    rubric: [
      "Caught the flaw: did the learner spot the invented policy detail (an exception, prorated refund, or wrong window)?",
      "Met the brief: does the final reply state only the real policy (no refund after 30 days, can cancel to stop future billing) and answer the 45-day question correctly?",
      "Tone: is it polite and clear for a customer?",
    ],
  },
];

// The mental model we want every employee to internalize: the handful of ways
// AI output tends to be wrong. Shown during every review as a teaching aid, and
// used as the checklist for reviewing a person's own AI output.
export const WHAT_TO_LOOK_FOR = [
  { title: "Made-up facts", desc: "A number, date, price, or claim that was never in the source." },
  { title: "Missed the ask", desc: "It skipped or half-did something that was required." },
  { title: "Wrong focus", desc: "It answered a slightly different question, or wrote for the wrong reader." },
  { title: "Robotic tone", desc: "It reads like a template, not like a person." },
];

export function getTask(id) {
  return TASKS.find((t) => t.id === id) || null;
}
