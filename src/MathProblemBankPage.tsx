import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatMathText } from "./formatMathText";

interface ImportedStep {
  step_number?: number;
  action?: string;
  calculation?: string;
  reasoning?: string;
}

interface ImportedSolutionMethod {
  method_type?: string;
  is_primary?: boolean;
  steps: ImportedStep[];
}

interface ImportedProblem {
  id: string;
  topic: string;
  chapter: string;
  difficulty: string;
  prompt: string;
  solutionMethods: ImportedSolutionMethod[];
  pedagogicalNotes?: unknown;
  sourceFile: string;
}

interface ImportedBank {
  grade: number;
  subject: string;
  source: string;
  problems: ImportedProblem[];
  emptyChapters: { chapter: string; sourceFile: string }[];
}

const availableGrades = [8, 9, 10, 11, 12];
const problemKey = (problem: ImportedProblem) => `${problem.sourceFile}:${problem.id}`;

function formatNote(note: unknown): string {
  if (typeof note === "string") return note;
  if (Array.isArray(note)) return note.map((item) => String(item)).join("; ");
  if (note && typeof note === "object") {
    return Object.entries(note).map(([label, value]) => {
      const text = Array.isArray(value) ? value.join("; ") : String(value);
      return `${label.replaceAll("_", " ")}: ${text}`;
    }).join("\n");
  }
  return "";
}

export function MathProblemBankPage({ initialGrade }: { initialGrade: number }) {
  const grade = initialGrade;
  const isAvailableGrade = availableGrades.includes(grade);
  const [bank, setBank] = useState<ImportedBank | null>(null);
  const [loading, setLoading] = useState(isAvailableGrade);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All difficulties");
  const [selectedId, setSelectedId] = useState("");
  const [showSolutions, setShowSolutions] = useState(false);

  useEffect(() => {
    if (!isAvailableGrade) {
      setBank(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    setBank(null);
    fetch(`/math-question-bank/class-${grade}.json`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`The Class ${grade} problem data could not be loaded (HTTP ${response.status}).`);
        return response.json() as Promise<ImportedBank>;
      })
      .then((data) => {
        setBank(data);
        setSelectedId(data.problems[0] ? problemKey(data.problems[0]) : "");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Could not load the imported math problem bank.", error);
        setLoadError(error instanceof Error ? error.message : "The problem bank could not be loaded. Please try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [grade, isAvailableGrade]);

  const difficulties = useMemo(
    () => ["All difficulties", ...new Set((bank?.problems ?? []).map((problem) => problem.difficulty))],
    [bank],
  );
  const filteredProblems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (bank?.problems ?? []).filter((problem) => {
      const matchesDifficulty = difficulty === "All difficulties" || problem.difficulty === difficulty;
      const matchesSearch = !query || [problem.topic, problem.chapter, problem.prompt, problem.id]
        .some((value) => value.toLocaleLowerCase().includes(query));
      return matchesDifficulty && matchesSearch;
    });
  }, [bank, difficulty, search]);
  const currentProblem = filteredProblems.find((problem) => problemKey(problem) === selectedId) ?? filteredProblems[0];

  function selectProblem(problem: ImportedProblem) {
    setSelectedId(problemKey(problem));
    setShowSolutions(false);
  }

  if (!isAvailableGrade) {
    return (
      <main className="math-bank-page">
        <div className="page-title"><div><span className="eyebrow">IMPORTED PRACTICE · MATHEMATICS</span><h1>Worked Problem Bank</h1><p>This archive contains worked problems for Classes 8–12.</p></div></div>
        <section className="panel empty-content">
          <h2>Not available for Class {grade}</h2>
          <p>The worked-problem archive does not include your class, so its questions are hidden.</p>
          <Link className="btn violet" to="/lessons">Browse your class lessons →</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="math-bank-page">
      <div className="page-title"><div><span className="eyebrow">IMPORTED PRACTICE · MATHEMATICS</span><h1>Worked Problem Bank</h1><p>Browse step-by-step mathematics problems imported from your archive for Classes 8–12.</p></div></div>
      <section className="panel math-bank-controls" aria-label="Filter problem bank">
        <p className="math-bank-current-class">Your profile class: <strong>Class {grade}</strong></p>
        <label>Difficulty
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            {difficulties.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="math-bank-search">Search topics or problems
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="e.g. fractions, circles, equations" />
        </label>
      </section>
      {loading && <p className="panel" role="status">Loading Class {grade} mathematics problems…</p>}
      {loadError && <p className="error-message" role="alert">{loadError}</p>}
      {bank && !loading && <>
        <p className="math-bank-count" role="status">Showing {filteredProblems.length} of {bank.problems.length} imported Class {grade} problems.</p>
        {bank.emptyChapters.length > 0 && <p className="math-bank-source-note">The archive also lists {bank.emptyChapters.map((chapter) => chapter.chapter).join(" and ")}, but contains no problem rows for those chapters.</p>}
        {filteredProblems.length === 0 ? <section className="panel empty-content"><h2>No matching problems</h2><p>Try a different search term or difficulty.</p></section> : <div className="math-bank-layout">
          <nav className="panel math-bank-list" aria-label="Problem results">
            {filteredProblems.map((problem, index) => <button key={problemKey(problem)} className={`math-bank-list-item ${currentProblem && problemKey(currentProblem) === problemKey(problem) ? "selected" : ""}`} type="button" aria-current={currentProblem && problemKey(currentProblem) === problemKey(problem) ? "true" : undefined} onClick={() => selectProblem(problem)}>
              <span className="math-bank-list-index">{index + 1}</span><span><strong>{problem.topic}</strong><small>{problem.difficulty} · {problem.chapter}</small></span>
            </button>)}
          </nav>
          {currentProblem && <article className="panel math-problem-detail">
            <div className="math-problem-meta"><span className="tag">{currentProblem.difficulty}</span><span>{currentProblem.chapter}</span></div>
            <h2>{currentProblem.topic}</h2>
            <p className="math-problem-prompt">{formatMathText(currentProblem.prompt)}</p>
            <button className="btn violet" type="button" aria-expanded={showSolutions} onClick={() => setShowSolutions((visible) => !visible)}>{showSolutions ? "Hide worked solution" : "Show worked solution"}</button>
            {showSolutions && <div className="math-solution-list">
              {currentProblem.solutionMethods.map((method, index) => <section className="math-solution-method" key={`${method.method_type}-${index}`}>
                <h3>{method.method_type || `Solution method ${index + 1}`}{method.is_primary && <span className="tag">Main method</span>}</h3>
                <ol>{method.steps.map((step, stepIndex) => <li key={`${step.step_number ?? stepIndex}-${step.action}`}>
                  {step.action && <strong>{step.action}</strong>}
                  {step.calculation && <p className="math-calculation">{formatMathText(step.calculation)}</p>}
                  {step.reasoning && <p>{formatMathText(step.reasoning)}</p>}
                </li>)}</ol>
              </section>)}
              {formatNote(currentProblem.pedagogicalNotes) && <p className="math-pedagogical-note"><strong>Study note:</strong> {formatMathText(formatNote(currentProblem.pedagogicalNotes))}</p>}
            </div>}
            <small className="math-bank-provenance">Problem ID: {currentProblem.id} · Imported from the user-provided archive; source solutions have not been independently reviewed.</small>
          </article>}
        </div>}
      </>}
    </main>
  );
}
