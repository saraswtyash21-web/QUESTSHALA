import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpenCheck, CheckCircle2, Clock3, Eye, RotateCcw, Sparkles } from "lucide-react";
import type { Activity } from "./types";

interface QuestionBatchInfo { file: string; start: number; end: number; compressedBytes: number }
interface GradeInfo { count: number; batches: QuestionBatchInfo[] }
interface QuestionManifest { source: string; totalQuestions: number; grades: Record<string, GradeInfo> }
interface LibraryQuestion { id: number; question: string; answer: string; context: string }
type QuestionTuple = [number, string, string, string];

async function loadBatch(file: string, signal: AbortSignal): Promise<LibraryQuestion[]> {
  const response = await fetch(`/question-library/${file}`, { signal });
  if (!response.ok) throw new Error(`Question set could not be loaded (HTTP ${response.status}).`);
  if (!response.body) throw new Error("The question set returned an empty response.");
  const encoding = response.headers.get("content-encoding") ?? "";
  let body: ReadableStream<Uint8Array> = response.body;
  if (!encoding.toLowerCase().includes("gzip")) {
    if (typeof DecompressionStream === "undefined") throw new Error("This browser cannot open the compressed question set. Update Chrome, Edge, Firefox or Safari.");
    body = body.pipeThrough(new DecompressionStream("gzip") as unknown as TransformStream<Uint8Array, Uint8Array>);
  }
  const data: unknown = await new Response(body).json();
  if (!Array.isArray(data) || !data.every((item): item is QuestionTuple => Array.isArray(item) && item.length === 4 && typeof item[0] === "number" && item.slice(1).every((part) => typeof part === "string"))) {
    throw new Error("The selected question batch has an invalid data format.");
  }
  return data.map(([id, question, answer, context]) => ({ id, question, answer, context }));
}

function pretty(value: string): string {
  return value.replace(/\\n/g, "\n").replace(/\*\*(.*?)\*\*/g, "$1").replace(/__(.*?)__/g, "$1");
}
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function ImportedQuestionPractice({ initialGrade, onRecordActivity, onTestActive }: {
  initialGrade: number;
  onRecordActivity: (activity: Activity) => Promise<void>;
  onTestActive: (active: boolean) => void;
}) {
  const [manifest, setManifest] = useState<QuestionManifest | null>(null);
  const [manifestError, setManifestError] = useState("");
  const [grade, setGrade] = useState(Math.min(12, Math.max(6, initialGrade)));
  const [batchIndex, setBatchIndex] = useState(0);
  const [bank, setBank] = useState<LibraryQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [testQuestions, setTestQuestions] = useState<LibraryQuestion[]>([]);
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [marks, setMarks] = useState<Record<number, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(8 * 60);
  const [result, setResult] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [savedResult, setSavedResult] = useState(false);
  const finishRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/question-library/index.json", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Question library index could not be loaded (HTTP ${response.status}).`);
        return response.json() as Promise<QuestionManifest>;
      })
      .then((data) => {
        setManifest(data);
        const requested = Math.min(12, Math.max(6, initialGrade));
        const firstAvailable = Object.entries(data.grades).find(([key, info]) => Number(key) >= requested && info.count > 0)?.[0]
          ?? Object.entries(data.grades).find(([, info]) => info.count > 0)?.[0];
        if (firstAvailable) setGrade(Number(firstAvailable));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setManifestError(error instanceof Error ? error.message : "Question library index could not be loaded.");
      });
    return () => controller.abort();
  }, [initialGrade]);

  const gradeInfo = manifest?.grades[String(grade)];
  const selectedBatch = gradeInfo?.batches[batchIndex];
  useEffect(() => {
    if (!selectedBatch) {
      setBank([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    setBank([]);
    loadBatch(selectedBatch.file, controller.signal)
      .then(setBank)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(error instanceof Error ? error.message : "Question set could not be loaded.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [selectedBatch]);

  const current = testQuestions[questionIndex];
  const score = useMemo(() => Object.values(marks).filter(Boolean).length, [marks]);
  const finish = async () => {
    if (!started || result) return;
    setStarted(false);
    onTestActive(false);
    setResult(true);
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
  };
  finishRef.current = finish;

  useEffect(() => () => onTestActive(false), [onTestActive]);

  useEffect(() => {
    if (!started || result) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((remaining) => {
        if (remaining <= 1) {
          window.clearInterval(timer);
          window.setTimeout(() => { void finishRef.current?.(); }, 0);
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, result]);

  function startTest() {
    if (bank.length === 0) return;
    setTestQuestions(shuffle(bank).slice(0, Math.min(10, bank.length)));
    setQuestionIndex(0);
    setRevealed(new Set());
    setMarks({});
    setSecondsLeft(8 * 60);
    setResult(false);
    setSavedResult(false);
    setStarted(true);
    onTestActive(true);
    if (document.documentElement.requestFullscreen) void document.documentElement.requestFullscreen().catch(() => undefined);
  }

  async function saveTestResult() {
    if (savingResult || savedResult) return;
    setSavingResult(true);
    try {
      const total = Math.max(1, testQuestions.length);
      await onRecordActivity({
        id: crypto.randomUUID(), kind: "quiz", title: `Imported question practice · Class ${grade}`,
        subject: "Mixed curriculum", topic: `imported-class-${grade}`, date: new Date().toISOString(),
        score: Math.round(score / total * 100), correct: score, total: testQuestions.length,
        durationSeconds: 8 * 60 - secondsLeft, difficulty: "Standard",
      });
      setSavedResult(true);
    } finally {
      setSavingResult(false);
    }
  }

  if (started && current) {
    const isRevealed = revealed.has(questionIndex);
    return <main className="imported-test-run" aria-label="Imported question practice in progress">
      <header className="imported-test-header"><div><span className="eyebrow"><BookOpenCheck size={14} /> IMPORTED QUESTION SET</span><h1>Class {grade} practice</h1><p>Self-check format · judge your understanding after revealing the supplied answer.</p></div><div className={`test-clock ${secondsLeft < 60 ? "urgent" : ""}`}><Clock3 size={16} /> {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</div></header>
      <div className="test-progress" role="progressbar" aria-label="Question progress" aria-valuemin={0} aria-valuemax={testQuestions.length} aria-valuenow={questionIndex + 1}><span style={{ width: `${(questionIndex + 1) / testQuestions.length * 100}%` }} /></div>
      <section className="panel imported-test-question"><div className="panel-head"><span className="tag">Question {questionIndex + 1} / {testQuestions.length}</span><span className="tag">Source item #{current.id.toLocaleString()}</span></div><h2>{pretty(current.question)}</h2>
        {isRevealed ? <div className="imported-test-answer"><h3>Answer supplied with the dataset</h3><p>{pretty(current.answer)}</p>{current.context && <details><summary>Read learning context</summary><p>{pretty(current.context)}</p></details>}<div className="imported-self-check"><span>How did you do?</span><button type="button" className={`btn ${marks[questionIndex] === true ? "primary" : "outline"}`} aria-pressed={marks[questionIndex] === true} onClick={() => setMarks((prev) => ({ ...prev, [questionIndex]: true }))}><CheckCircle2 size={16} /> I knew it</button><button type="button" className={`btn ${marks[questionIndex] === false ? "soft" : "outline"}`} aria-pressed={marks[questionIndex] === false} onClick={() => setMarks((prev) => ({ ...prev, [questionIndex]: false }))}>Need to revise</button></div></div> : <button type="button" className="btn violet reveal-imported-answer" onClick={() => setRevealed((prev) => new Set(prev).add(questionIndex))}><Eye size={16} /> Reveal answer and context</button>}
        <div className="timed-test-footer"><button className="btn outline" type="button" disabled={questionIndex === 0} onClick={() => setQuestionIndex((value) => value - 1)}><ArrowLeft size={16} /> Previous</button><span>{Object.keys(marks).length} / {testQuestions.length} self-checked</span>{questionIndex < testQuestions.length - 1 ? <button className="btn violet" type="button" onClick={() => setQuestionIndex((value) => value + 1)}>Next question →</button> : <button className="btn violet" type="button" onClick={() => void finish()}>Finish test</button>}</div>
      </section><button className="text-link" type="button" onClick={() => void finish()}>Submit now</button>
    </main>;
  }

  if (result) return <main className="imported-test-results"><section className="panel result-hero"><span className="eyebrow">IMPORTED PRACTICE REPORT</span><div className="result-score-ring"><strong>{Math.round(score / Math.max(1, testQuestions.length) * 100)}%</strong><small>{score}/{testQuestions.length} self-marked</small></div><h1>{score / Math.max(1, testQuestions.length) >= .8 ? "Excellent recall!" : "A useful revision round."}</h1><p>This score is self-assessed because the imported dataset contains written answers rather than verified multiple-choice keys. Unmarked questions count as not yet mastered.</p></section><section className="panel"><h2>Next steps</h2><p>Revisit the questions marked for revision, then try another random set from the same class and batch.</p><div className="button-row"><button className="btn violet" type="button" onClick={startTest}><RotateCcw size={16} /> Try another set</button><Link className="btn outline" to="/practice">Back to Practice Zone</Link><Link className="btn outline" to="/question-library">Browse full question library</Link></div>{!savedResult ? <button className="btn primary" type="button" disabled={savingResult} onClick={() => void saveTestResult()}>{savingResult ? "Saving result…" : "Save result to learning history"}</button> : <p className="success-message" role="status">Your result is saved in learning history.</p>}</section></main>;

  return <main className="imported-question-practice">
    <div className="page-title"><div><span className="eyebrow"><Sparkles size={14} /> PRACTICE ZONE · IMPORTED TEST DATA</span><h1>Challenge yourself with the question vault.</h1><p>Short random tests from the imported study-question archive. Choose a class and batch, then self-check your answers.</p></div><Link className="btn outline" to="/practice">Back to topic tests</Link></div>
    {manifestError && <p className="error-message" role="alert">{manifestError}</p>}
    {manifest && <>
      <p className="question-library-note"><strong>{manifest.totalQuestions.toLocaleString()} imported rows.</strong> Available for Classes 6–12. This source contains written question/answer/context data, not guaranteed official exam questions; answers have not been independently verified. Self-check scoring is intentional.</p>
      <section className="panel imported-test-controls"><label>Class<select value={grade} onChange={(event) => { setGrade(Number(event.target.value)); setBatchIndex(0); }}><option value={6}>Class 6 · {manifest.grades["6"]?.count.toLocaleString()} questions</option><option value={7}>Class 7 · {manifest.grades["7"]?.count.toLocaleString()} questions</option><option value={8}>Class 8 · {manifest.grades["8"]?.count.toLocaleString()} questions</option><option value={9}>Class 9 · {manifest.grades["9"]?.count.toLocaleString()} questions</option><option value={10}>Class 10 · {manifest.grades["10"]?.count.toLocaleString()} questions</option><option value={11}>Class 11 · {manifest.grades["11"]?.count.toLocaleString()} questions</option><option value={12}>Class 12 · {manifest.grades["12"]?.count.toLocaleString()} questions</option></select></label><label>Question batch<select value={batchIndex} onChange={(event) => setBatchIndex(Number(event.target.value))}>{(gradeInfo?.batches ?? []).map((batch, index) => <option value={index} key={batch.file}>Batch {index + 1} · #{batch.start.toLocaleString()}–{batch.end.toLocaleString()}</option>)}</select></label><div className="imported-batch-summary"><strong>{loading ? "Loading questions…" : loadError ? "Could not load this batch" : `${bank.length.toLocaleString()} questions ready`}</strong><small>Each test draws up to 10 random questions from this batch · 8 minutes.</small></div></section>
      {loadError && <p className="error-message" role="alert">{loadError}</p>}
      <section className="panel imported-test-start"><span className="imported-test-icon"><BookOpenCheck size={26} /></span><div><h2>Ready for a quick knowledge check?</h2><p>Read the question, try answering it yourself, then reveal the answer and mark your confidence. Unanswered items count as not yet mastered.</p><div className="imported-test-facts"><span>10 questions max</span><span>8 minute timer</span><span>Answer explanations</span></div></div><button className="btn violet" type="button" disabled={loading || !bank.length || Boolean(loadError)} onClick={startTest}>Start imported test →</button></section>
      <p className="micro-copy">For full search and browsing, use the <Link to="/question-library">Question Library</Link>. Questions are loaded one compressed batch at a time to avoid downloading the entire archive at once.</p>
    </>}
  </main>;
}
