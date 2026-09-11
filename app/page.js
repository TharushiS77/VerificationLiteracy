"use client";

import { useState, useEffect } from "react";
import { TASKS, WHAT_TO_LOOK_FOR } from "../lib/tasks";

const STORAGE_KEY = "reviewgym_progress_v1";
const PASS_SCORE = 75;

const LEVELS = [
  { name: "Rookie Reviewer", blurb: "Catch your first mistake" },
  { name: "Sharp Reviewer", blurb: "Catch and fix across tasks" },
  { name: "AI Supervisor", blurb: "Master every task type", goal: true },
];

function scoreBand(score) {
  if (score == null) return { label: "Not scored", tone: "muted" };
  if (score >= 80) return { label: "Strong", tone: "good" };
  if (score >= 60) return { label: "Good", tone: "good" };
  if (score >= 40) return { label: "Getting there", tone: "warn" };
  return { label: "Needs work", tone: "bad" };
}

const STATUS_ICON = { good: "✓", partial: "~", missing: "✗" };
// "bring your own" statuses map onto the same three visual tones.
const REVIEW_STATUS = { ok: "good", watch: "partial", issue: "missing" };
const RISK_TONE = { low: "good", medium: "warn", high: "bad" };

function loadProgress() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { reps: 0, caught: 0, mastered: {} };
}

export default function Home() {
  const [mode, setMode] = useState("train");

  // --- Train mode state ---
  const [taskId, setTaskId] = useState(TASKS[0].id);
  const [draft, setDraft] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [finalVersion, setFinalVersion] = useState("");
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState("");

  // --- Check-your-own state ---
  const [checkReqs, setCheckReqs] = useState("");
  const [checkOutput, setCheckOutput] = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");

  const [progress, setProgress] = useState(null);
  useEffect(() => { setProgress(loadProgress()); }, []);

  const task = TASKS.find((t) => t.id === taskId);

  const masteredCount = progress
    ? TASKS.filter((t) => progress.mastered?.[t.id]?.passed).length : 0;
  const currentLevel = masteredCount >= TASKS.length ? 2 : masteredCount >= 1 ? 1 : 0;
  const goalReached = masteredCount >= TASKS.length;

  const nextTaskId = (() => {
    const idx = TASKS.findIndex((t) => t.id === taskId);
    for (let i = 1; i <= TASKS.length; i++) {
      const t = TASKS[(idx + i) % TASKS.length];
      if (!progress?.mastered?.[t.id]?.passed) return t.id;
    }
    return null;
  })();
  const nextTask = nextTaskId ? TASKS.find((t) => t.id === nextTaskId) : null;

  function goToTask(id) {
    setTaskId(id);
    resetForNewAttempt();
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 40);
  }

  function saveProgress(next) {
    setProgress(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (e) {}
  }

  function recordResult(data) {
    const passed = data.caughtMistake === true && (data.overallScore ?? 0) >= PASS_SCORE;
    const base = progress || { reps: 0, caught: 0, mastered: {} };
    const prevBest = base.mastered?.[taskId]?.bestScore ?? 0;
    saveProgress({
      reps: base.reps + 1,
      caught: base.caught + (data.caughtMistake ? 1 : 0),
      mastered: {
        ...base.mastered,
        [taskId]: {
          passed: (base.mastered?.[taskId]?.passed || passed) === true,
          bestScore: Math.max(prevBest, data.overallScore ?? 0),
        },
      },
    });
  }

  function resetForNewAttempt() {
    setDraft(""); setDiagnosis(""); setFinalVersion(""); setResult(null);
    setError(""); setShowHint(false);
  }

  async function generateDraft() {
    setError(""); setResult(null); setGenerating(true);
    setDraft(""); setFinalVersion(""); setShowHint(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setDraft(data.draft);
      setFinalVersion(data.draft);
    } catch (e) { setError(e.message); } finally { setGenerating(false); }
  }

  async function submitForReview() {
    setError(""); setGrading(true); setResult(null);
    try {
      const res = await fetch("/api/grade", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, draft, diagnosis, finalVersion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Grading failed.");
      setResult(data);
      if (!data.gradingFailed && data.overallScore != null) recordResult(data);
      setTimeout(() => {
        document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    } catch (e) { setError(e.message); } finally { setGrading(false); }
  }

  async function checkMyOutput() {
    setCheckError(""); setChecking(true); setCheckResult(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirements: checkReqs, output: checkOutput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Review failed.");
      setCheckResult(data);
      setTimeout(() => {
        document.getElementById("checkresult")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    } catch (e) { setCheckError(e.message); } finally { setChecking(false); }
  }

  const graded = result && !result.gradingFailed && result.overallScore != null;
  const band = graded ? scoreBand(result.overallScore) : null;
  const passedThis = graded && result.caughtMistake && result.overallScore >= PASS_SCORE;

  return (
    <div className="page">
      <div className="topbar">
        <div className="topbar-in">
          <div className="brand">
            <div className="wordmark">Review Gym</div>
          </div>
          <div className="topstat">
            <span className="lv">{LEVELS[currentLevel].name}</span>
            <span className="sep">|</span>
            <span>{masteredCount} / {TASKS.length} mastered</span>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="intro">
          <h1>Get better at using AI at work</h1>
          <p>
            AI is fast, but it gets things wrong. Review Gym trains you to spot the
            mistakes and fix them, so you can trust what you send out. Practise on
            realistic tasks, or bring something an AI wrote for your real work and
            have it checked.
          </p>
        </div>

        <div className="tabs">
          <button className={mode === "train" ? "tab active" : "tab"} onClick={() => setMode("train")}>
            Train
          </button>
          <button className={mode === "check" ? "tab active" : "tab"} onClick={() => setMode("check")}>
            Check your own work
          </button>
        </div>

        {mode === "train" && (
        <>
        {/* JOURNEY */}
        <section className="card">
          <div className="journey-head">
            <div className="shead" style={{ marginBottom: 0 }}>
              <span className="sq">★</span>
              <h2>Your journey</h2>
            </div>
            <div className="goaltext">
              Goal: master all {TASKS.length} tasks to become a <b>certified AI Supervisor</b>
            </div>
          </div>

          <div className="roadmap">
            {LEVELS.map((lvl, i) => {
              const state = i < currentLevel ? "done" : i === currentLevel ? "current" : "";
              return (
                <div className={`node ${state} ${lvl.goal ? "goal" : ""}`} key={i}>
                  <div className="dot">{i < currentLevel ? "✓" : i + 1}</div>
                  <div className="nname">{lvl.name}</div>
                  <div className="nblurb">{lvl.blurb}</div>
                </div>
              );
            })}
          </div>

          <div className="mastery">
            <div className="mrow"><span>Tasks mastered</span><b>{masteredCount} of {TASKS.length}</b></div>
            <div className="mbar"><span style={{ width: `${(masteredCount / TASKS.length) * 100}%` }} /></div>
          </div>

          <div className="jstats">
            <div className="stat"><div className="snum">{progress ? progress.reps : 0}</div><div className="slabel">Rounds done</div></div>
            <div className="stat"><div className="snum">{progress ? progress.caught : 0}</div><div className="slabel">Mistakes caught</div></div>
            <div className="stat"><div className="snum">{LEVELS[currentLevel].name.split(" ")[0]}</div><div className="slabel">Current level</div></div>
          </div>

          {goalReached && (
            <div className="certified">
              <div className="medal">★</div>
              <div>
                <div className="ctitle">Goal reached: certified AI Supervisor</div>
                <div className="csub">You mastered every task. Keep practising to stay sharp.</div>
              </div>
            </div>
          )}
        </section>

        {/* STEP 1 */}
        <section className="card">
          <div className="shead plain"><span className="sq">1</span><h2>Choose a task</h2></div>
          <label htmlFor="task">Pick something to practise on</label>
          <select id="task" value={taskId}
            onChange={(e) => { setTaskId(e.target.value); resetForNewAttempt(); }}>
            {TASKS.map((t) => {
              const done = progress?.mastered?.[t.id]?.passed;
              return <option key={t.id} value={t.id}>{done ? "✓ " : ""}{t.title}</option>;
            })}
          </select>
          <div className="who">Who it&apos;s for: {task.audience}</div>
          <div className="brief"><div className="brief-tag">The brief</div>{task.brief}</div>
          <button className="primary" onClick={generateDraft} disabled={generating}>
            {generating ? <><span className="spinner" />Writing the draft…</> : "Generate the AI draft"}
          </button>
        </section>

        {error && <div className="error">{error}</div>}

        {/* STEP 2 */}
        {draft && (
          <>
            <section className="card">
              <div className="shead plain"><span className="sq">2</span><h2>Find the mistake</h2></div>
              <div className="draft">
                <div className="draft-tag">AI draft · one mistake is hidden in here</div>
                <div className="draft-body">{draft}</div>
              </div>

              <div className="lookfor">
                <div className="lookfor-tag">What to look for</div>
                <div className="lookfor-grid">
                  {WHAT_TO_LOOK_FOR.map((w, i) => (
                    <div className="lf-item" key={i}>
                      <div className="lf-title">{w.title}</div>
                      <div className="lf-desc">{w.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="field">
                <label htmlFor="diag">What did the AI get wrong?</label>
                <p className="hint">Read the draft against the brief. Use the guide above. Say what you notice.</p>
                <textarea id="diag" rows={4}
                  placeholder="For example: it invented a discount the brief never mentioned, and the tone is stiff."
                  value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                {!showHint ? (
                  <button className="link" onClick={() => setShowHint(true)}>Stuck? Give me a hint</button>
                ) : (
                  <div className="hintbox"><b>Hint:</b> {task.hint}</div>
                )}
              </div>
            </section>

            {/* STEP 3 */}
            <section className="card">
              <div className="shead plain"><span className="sq">3</span><h2>Fix it</h2></div>
              <label htmlFor="fix">Your corrected version</label>
              <p className="hint">Edit the draft below. Remove the mistake, meet every requirement, and make it sound like a real person wrote it.</p>
              <textarea id="fix" rows={9} value={finalVersion} onChange={(e) => setFinalVersion(e.target.value)} />
              <div className="btn-row">
                <button className="primary" onClick={submitForReview} disabled={grading}>
                  {grading ? <><span className="spinner" />Checking your work…</> : "Submit for review"}
                </button>
                <button className="ghost" onClick={generateDraft} disabled={generating}>Try a new draft</button>
              </div>
            </section>
          </>
        )}

        {/* RESULT */}
        {result && (
          <section className="card" id="result">
            {!graded ? (
              <div className="notice">
                <div className="ni">i</div>
                <div>
                  <div className="ntitle">We could not score that round</div>
                  <div className="nsub">This was a glitch on our side, not your answer. Please press submit again.</div>
                </div>
              </div>
            ) : (
              <>
                <div className={`verdict-banner ${result.caughtMistake ? "hit" : "miss"}`}>
                  <div className="vb-icon">{result.caughtMistake ? "✓" : "!"}</div>
                  <div>
                    <div className="vb-title">
                      {result.caughtMistake ? "You caught the mistake." : "You did not spot the mistake this time."}
                    </div>
                    <div className="vb-sub">
                      {result.caughtMistake
                        ? "Nice. That is exactly the skill this trains."
                        : "No problem. Read the mistake below, then try another draft."}
                    </div>
                  </div>
                </div>

                {result.hiddenMistake && (
                  <div className="reveal">
                    <div className="reveal-tag">The mistake hidden in the draft</div>
                    <div>{result.hiddenMistake}</div>
                  </div>
                )}

                {band && (
                  <div className="score">
                    <div className="score-row">
                      <span className="score-label">Your score</span>
                      <span className={`band ${band.tone}`}>{band.label}</span>
                      <span className="score-num">{result.overallScore}<small>/100</small></span>
                    </div>
                    <div className="meter">
                      <span className={band.tone} style={{ width: `${Math.max(4, Math.min(100, result.overallScore))}%` }} />
                    </div>
                  </div>
                )}

                {Array.isArray(result.checks) && result.checks.length > 0 && (
                  <div className="checks">
                    {result.checks.map((c, i) => (
                      <div className="check" key={i}>
                        <span className={`ci ${c.status}`}>{STATUS_ICON[c.status] || "•"}</span>
                        <div>
                          <div className="c-label">{c.label}</div>
                          {c.note && <div className="c-note">{c.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="callouts">
                  {result.didWell && (
                    <div className="callout good"><div className="co-tag">What you did well</div>{result.didWell}</div>
                  )}
                  {result.toImprove && (
                    <div className="callout warn"><div className="co-tag">One thing to improve</div>{result.toImprove}</div>
                  )}
                </div>

                <div className="lesson">
                  <div className="lesson-tag">How to catch this next time</div>
                  {task.lesson}
                </div>

                {passedThis && (
                  <div className="mastered-note">
                    {goalReached
                      ? "You mastered every task. You are a certified AI Supervisor."
                      : "Task mastered. It now counts toward your certification."}
                  </div>
                )}
              </>
            )}

            <div className="btn-row">
              {passedThis && nextTask ? (
                <>
                  <button className="primary" onClick={() => goToTask(nextTask.id)}>
                    Next task: {nextTask.title} →
                  </button>
                  <button className="ghost" onClick={generateDraft} disabled={generating}>Practise this again</button>
                </>
              ) : passedThis && !nextTask ? (
                <>
                  <button className="primary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                    See your journey
                  </button>
                  <button className="ghost" onClick={generateDraft} disabled={generating}>Practise this again</button>
                </>
              ) : (
                <>
                  <button className="primary" onClick={submitForReview} disabled={grading}>
                    {grading ? <><span className="spinner" />Rechecking…</> : (graded ? "Edit above, then re-check" : "Submit again")}
                  </button>
                  <button className="ghost" onClick={generateDraft} disabled={generating}>New draft, same task</button>
                  {nextTask && (
                    <button className="ghost" onClick={() => goToTask(nextTask.id)}>Skip to next task</button>
                  )}
                </>
              )}
            </div>
          </section>
        )}
        </>
        )}

        {mode === "check" && (
          <>
            <section className="card">
              <div className="shead plain"><span className="sq">✓</span><h2>Check your own AI output</h2></div>
              <p className="hint" style={{ marginBottom: 18 }}>
                Paste something an AI wrote for your real work. Review Gym checks it
                against the four things AI most often gets wrong and flags what to
                double-check. It is a second pair of eyes. You make the final call.
              </p>

              <div className="field" style={{ marginTop: 0 }}>
                <label htmlFor="reqs">What did you ask the AI to do? <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional, but helps)</span></label>
                <textarea id="reqs" rows={3}
                  placeholder="For example: write a 4-sentence product update for customers, no jargon, only the features we shipped."
                  value={checkReqs} onChange={(e) => setCheckReqs(e.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="out">Paste the AI&apos;s response</label>
                <textarea id="out" rows={9}
                  placeholder="Paste the AI-written text you want checked here."
                  value={checkOutput} onChange={(e) => setCheckOutput(e.target.value)} />
              </div>

              <button className="primary" onClick={checkMyOutput} disabled={checking || !checkOutput.trim()}>
                {checking ? <><span className="spinner" />Checking…</> : "Check it"}
              </button>
              {checkError && <div className="error">{checkError}</div>}
            </section>

            {checkResult && (
              <section className="card" id="checkresult">
                <div className="score-row" style={{ marginBottom: 12 }}>
                  <span className="score-label">Overall risk of using this as-is</span>
                  <span className={`band ${RISK_TONE[checkResult.overallRisk] || "muted"}`} style={{ marginLeft: "auto" }}>
                    {(checkResult.overallRisk || "").toUpperCase()}
                  </span>
                </div>
                {checkResult.summary && <div className="reveal" style={{ marginTop: 0 }}>{checkResult.summary}</div>}

                {Array.isArray(checkResult.checks) && (
                  <div className="checks">
                    {checkResult.checks.map((c, i) => {
                      const tone = REVIEW_STATUS[c.status] || "partial";
                      return (
                        <div className="check" key={i}>
                          <span className={`ci ${tone}`}>{STATUS_ICON[tone] || "•"}</span>
                          <div>
                            <div className="c-label">{c.category}</div>
                            {c.note && <div className="c-note">{c.note}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {Array.isArray(checkResult.flags) && checkResult.flags.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div className="lookfor-tag" style={{ color: "var(--navy)" }}>Things to double-check</div>
                    {checkResult.flags.map((f, i) => (
                      <div className="flag-item" key={i}>
                        {f.quote && <div className="flag-quote">&ldquo;{f.quote}&rdquo;</div>}
                        <div className="flag-issue">{f.issue}</div>
                        {f.suggestion && <div className="flag-sugg">{f.suggestion}</div>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="lesson" style={{ marginTop: 20 }}>
                  <div className="lesson-tag">Remember</div>
                  This is a second pair of eyes, not the final word. Verify anything
                  flagged against your real source before you use it.
                </div>

                <div className="btn-row">
                  <button className="ghost" onClick={() => { setCheckResult(null); setCheckOutput(""); setCheckReqs(""); }}>
                    Check something else
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
