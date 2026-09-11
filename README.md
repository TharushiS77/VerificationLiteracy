# Review Gym

A small web app for getting better at using AI at work: it shows you AI-written
drafts with a mistake hidden in them, you find and fix the mistake, and it scores
how you did. Built for the Tai Labs assessment.

There are two sides to it:

- **Train** — pick a task, the AI writes a draft with one planted mistake, you
  spot it and fix it, and you get a score with feedback. Progress is tracked
  across six tasks.
- **Check your own work** — paste something an AI wrote for your real work and
  get it checked against the same four things AI tends to get wrong.

## Running it

```bash
npm install
cp .env.example .env.local   # add your Gemini key
npm run dev
```

Get a free Gemini key at https://aistudio.google.com/apikey.

## Deploying

Push to GitHub, import the repo on Vercel, and add a `GEMINI_API_KEY`
environment variable. That's it.

## How it's put together

Next.js app, deployed on Vercel. The AI is Google Gemini, called from two API
routes: `/api/generate` writes the flawed draft, `/api/grade` scores the fix.
`/api/review` powers the check-your-own-work side. The tasks live in
`lib/tasks.js`; the planted mistake for each one stays server-side so it isn't
handed to the browser. Progress is kept in the browser for now.
