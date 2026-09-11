# Review Gym

**Practice catching — and fixing — what AI gets wrong.**

A prototype built for the Tai Labs final assessment. It's the flagship of a
three-tool idea about **verification literacy**: the skill of working *with* AI
without blindly trusting it.

## The idea

Most AI tools make workers *more* dependent on AI. The skill that actually
matters is the opposite — teaching people to use AI but catch it when it's
wrong. Everyone teaches *prompting* (getting an answer out of AI). Almost nobody
teaches *evaluation* (telling whether that answer is any good).

The Review Gym trains that skill through deliberate practice:

1. **Pick a real task** — a client email, a product summary, meeting notes.
2. **The AI writes a draft** — with one realistic flaw hidden inside it (an
   invented detail, a misread brief, a robotic tone, a dropped requirement).
3. **You diagnose it** — say what's wrong by comparing against the brief.
4. **You fix it** — edit out the mistake and add the human quality AI can't.
5. **You get graded** — a rubric-based score on whether you caught the flaw and
   met the requirements, with specific feedback.

The score is on *your judgment*, not on how fast you accept the answer.

## How it works

- **Frontend + backend:** Next.js (App Router). One page, two API routes.
- **AI:** Google Gemini, called two ways:
  - a **generator** that produces the draft and deliberately plants one flaw
    (from a hidden `errorSpec` the browser never sees);
  - an **evaluator** that grades the learner's diagnosis and fix against a rubric.
- **Content library:** `lib/tasks.js` — each task has a brief, an audience, a
  hidden error spec, and a grading rubric. Add a task by adding one object.
- **Key stays secret:** the Gemini key lives in a server-side env var and is
  only ever used inside the `/api` routes, so the public live link is safe to share.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then paste your Gemini key into .env.local
npm run dev                  # http://localhost:3000
```

Get a free Gemini API key at https://aistudio.google.com/apikey

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import it at https://vercel.com/new.
3. Add an environment variable **`GEMINI_API_KEY`** with your key.
4. Deploy — Vercel gives you the public live link.

## What's a prototype vs. what's next

**Works today:** the full loop — generate a flawed draft, diagnose, fix,
rubric-based grading with feedback, retry.

**Cut for the timebox:** user accounts, saved history, the companion Diagnostic
and manager Dashboard, and company-specific tasks via retrieval.

**Next:** a dashboard that tracks judgment over time, so a manager can see not
just *whether* their team uses AI but whether they use it *well*.
