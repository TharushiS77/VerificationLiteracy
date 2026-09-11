"use client";

import { useState } from "react";
import { TASKS } from "../lib/tasks";

export default function Home() {
  const [taskId, setTaskId] = useState(TASKS[0].id);
  const [draft, setDraft] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [finalVersion, setFinalVersion] = useState("");
  const [result, setResult] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState("");

  const task = TASKS.find((t) => t.id === taskId);

  function resetForNewAttempt() {
    setDraft("");
    setDiagnosis("");
    setFinalVersion("");
    setResult(null);
    setError("");
  }

  async function generateDraft() {
    setError("");
    setResult(null);
    setGenerating(true);
    setDraft("");
    setFinalVersion("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setDraft(data.draft);
      setFinalVersion(data.draft); // pre-fill the fix box with the draft to edit
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function submitForReview() {
    setError("");
    setGrading(true);
    setResult(null);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, draft, diagnosis, finalVersion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Grading failed.");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setGrading(false);
    }
  }

  const scoreColor =
    result?.overallScore == null
      ? "var(--muted)"
      : result.overallScore >= 75
      ? "var(--good)"
      : result.overallScore >= 50
      ? "var(--warn)"
      : "var(--bad)";

  return (
    <div className="wrap">
      <header className="header">
        <h1>Review Gym</h1>
        <p className="tag">Practice catching — and fixing — what AI gets wrong.</p>
        <p className="thesis">
          The AI writes a draft that has a deliberate flaw hidden in it. Your job:
          diagnose what&apos;s wrong, fix it, and add the human judgment the AI can&apos;t.
          You get scored on your judgment — not on how fast you can accept the answer.
        </p>
      </header>

      {/* STEP 1 — pick a task */}
      <section className="card">
        <div className="step-label"><span className="step-num">1</span> Choose a task</div>
        <label htmlFor="task">Task</label>
        <select
          id="task"
          value={taskId}
          onChange={(e) => { setTaskId(e.target.value); resetForNewAttempt(); }}
        >
          {TASKS.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
        <p className="task-meta"><b>Who it&apos;s for:</b> {task.audience}</p>
        <div className="brief-box">{task.brief}</div>

        <div className="btn-row">
          <button onClick={generateDraft} disabled={generating}>
            {generating ? <><span className="spinner" />Generating…</> : "Generate the AI draft →"}
          </button>
        </div>
      </section>

      {error && <div className="error">⚠️ {error}</div>}

      {/* STEP 2 — review the flawed draft */}
      {draft && (
        <>
          <section className="card">
            <div className="step-label"><span className="step-num">2</span> Review the AI&apos;s draft</div>
            <div className="draft-box">
              <div className="draft-tag">⚠ AI draft — may contain a mistake</div>
              {draft}
            </div>

            <div style={{ marginTop: 18 }}>
              <label htmlFor="diag">What did the AI get wrong or do poorly?</label>
              <p className="hint">
                Compare it against the brief. Did it invent a detail? Misread the ask?
                Sound robotic? Miss a requirement? Be specific.
              </p>
              <textarea
                id="diag"
                rows={4}
                placeholder="e.g. It invented a 20% discount that was never in the brief, and the tone is generic…"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>
          </section>

          {/* STEP 3 — fix it */}
          <section className="card">
            <div className="step-label"><span className="step-num">3</span> Fix it</div>
            <label htmlFor="fix">Your corrected version</label>
            <p className="hint">
              Edit the draft directly — remove the mistake, meet every requirement,
              and make it sound like a real person wrote it.
            </p>
            <textarea
              id="fix"
              rows={9}
              value={finalVersion}
              onChange={(e) => setFinalVersion(e.target.value)}
            />
            <div className="btn-row">
              <button onClick={submitForReview} disabled={grading}>
                {grading ? <><span className="spinner" />Reviewing your work…</> : "Submit for review"}
              </button>
              <button className="secondary" onClick={generateDraft} disabled={generating}>
                ↻ New AI draft (same task)
              </button>
            </div>
          </section>
        </>
      )}

      {/* RESULT */}
      {result && (
        <section className="card">
          <div className="step-label"><span className="step-num">✓</span> Your score</div>
          <div className="score-head">
            <div className="score-badge" style={{ color: scoreColor }}>
              {result.overallScore == null ? "—" : result.overallScore}
            </div>
            {result.verdict && (
              <span className={`verdict ${result.verdict === "pass" ? "pass" : "revise"}`}>
                {result.verdict === "pass" ? "PASS" : "NEEDS ANOTHER PASS"}
              </span>
            )}
            {result.caughtTheFlaw != null && (
              <span className="flag">
                Caught the planted flaw:{" "}
                {result.caughtTheFlaw
                  ? <b className="yes">yes ✓</b>
                  : <b className="no">no ✗</b>}
              </span>
            )}
          </div>

          {Array.isArray(result.criteria) && result.criteria.map((c, i) => (
            <div className="criterion" key={i}>
              <div className="crow">
                <span className="cname">{c.name}</span>
                <span>{c.score}</span>
              </div>
              <div className="bar"><span style={{ width: `${Math.max(0, Math.min(100, c.score))}%` }} /></div>
              {c.comment && <div className="comment">{c.comment}</div>}
            </div>
          ))}

          {result.summary && <div className="summary-box">{result.summary}</div>}

          <div className="btn-row">
            <button className="secondary" onClick={submitForReview} disabled={grading}>
              Re-submit after edits
            </button>
            <button className="secondary" onClick={resetForNewAttempt}>
              Start over
            </button>
          </div>
        </section>
      )}

      <p className="footer">
        Review Gym · a verification-literacy prototype · built for the Tai Labs assessment
      </p>
    </div>
  );
}
