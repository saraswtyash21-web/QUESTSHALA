import { useEffect, useMemo, useState } from "react";
import { formatMathText } from "./formatMathText";
import { curriculum } from "./data";

interface QuestionBatchInfo {
  file: string;
  start: number;
  end: number;
  compressedBytes: number;
}

interface GradeInfo {
  count: number;
  batches: QuestionBatchInfo[];
}

interface QuestionLibraryManifest {
  source: string;
  columns: string[];
  batchSize: number;
  totalQuestions: number;
  grades: Record<string, GradeInfo>;
}

interface LibraryQuestion {
  id: number;
  question: string;
  answer: string;
  context: string;
}

type QuestionTuple = [number, string, string, string];

const grades = Array.from({ length: 12 }, (_, index) => index + 1);
const pageSize = 25;

function isQuestionTuple(value: unknown): value is QuestionTuple {
  return Array.isArray(value) &&
    typeof value[0] === "number" &&
    typeof value[1] === "string" &&
    typeof value[2] === "string" &&
    typeof value[3] === "string";
}

function parseQuestionBatch(value: unknown): LibraryQuestion[] {
  if (!Array.isArray(value) || !value.every(isQuestionTuple)) {
    throw new Error("The selected question batch has an invalid data format.");
  }
  return value.map(([id, question, answer, context]) => ({ id, question, answer, context }));
}

function formatImportedText(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .split(/\r?\n/)
    .map((line) => formatMathText(line).replace(/\*\*(.*?)\*\*/g, "$1").replace(/__(.*?)__/g, "$1"))
    .join("\n");
}

function containsDevanagari(value: string): boolean {
  return /[\u0900-\u097f]/u.test(value);
}

function inferQuestionSubject(value: string, grade: number): string {
  const text = value.toLocaleLowerCase();
  const has = (pattern: RegExp) => pattern.test(text);
  const seniorClass = grade >= 11;

  if (has(/\b(computer|computing|scanner|keyboard|software|hardware|algorithm|programming|coding|database|internet|cyber|artificial intelligence|machine learning|data structure|input device|output device)\b/)) {
    return seniorClass ? "Computer Science" : "Computing & AI";
  }
  if (seniorClass && has(/\b(force|motion|velocity|acceleration|gravity|energy|work|power|electric|magnetic|wave|light|optics|pressure|heat|thermodynamics|oscillation|frequency|amplitude|resistance|current|voltage|circuit|momentum|torque)\b/)) return "Physics";
  if (seniorClass && has(/\b(atom|molecule|element|compound|chemical|reaction|acid|base|salt|bond|mole|solution|oxidation|reduction|organic|hydrocarbon|periodic table|electrochemistry)\b/)) return "Chemistry";
  if (seniorClass && has(/\b(cell|tissue|organism|photosynthesis|respiration|ecosystem|biodiversity|genetics|evolution|reproduction|nutrition|plant|animal|human body|microorganism|disease|blood|heart|leaf|root|seed)\b/)) return "Biology";
  if (has(/\b(addition|subtract|multiply|multiplication|division|fraction|decimal|ratio|equation|algebra|geometry|triangle|circle|area|perimeter|volume|probability|integer|number pattern|place value|factor|multiple|calculate|solve|product|quotient|square root|linear|angle|coordinate|percent|percentage|median|arithmetic|average of|mean of (?:the )?(?:numbers|values|data|scores)|sum of (?:the )?(?:numbers|integers|fractions|angles|terms)|find the sum)\b|[=+\u00d7\u00f7]|\b\d+\s*\/\s*\d+\b/)) return "Mathematics";
  if (has(/\b(history|historical|king|queen|empire|dynasty|freedom|independence|constitution|government|democracy|election|parliament|citizen|civics|geography|continent|latitude|longitude|climate|river|mountain|soil|agriculture|map|economy|trade|resources|population|village|rural|urban)\b/)) return "Social Science";
  if (has(/\b(science|scientific|experiment|observation|mixture|material|matter|force|energy|environment|weather|water cycle|food chain|habitat|species|adaptation|electricity|magnet|light|sound|heat|plant|animal|seed|germination|body|health|nutrition)\b/)) return seniorClass ? "Other / Unclassified" : "Science";
  if (containsDevanagari(value)) return seniorClass ? "Other / Unclassified" : "Languages";
  if (has(/\b(grammar|vocabulary|synonym|antonym|spelling|punctuation|sentence|pronoun|verb|adjective|adverb|preposition|poem|poetry|story|proverb|author|narrator|comprehension|metaphor|simile|literature|paragraph|letter writing)\b/)) return seniorClass ? "English" : "Languages";
  return "Other / Unclassified";
}

export function QuestionLibraryPage({ initialGrade }: { initialGrade: number }) {
  const [manifest, setManifest] = useState<QuestionLibraryManifest | null>(null);
  const [manifestError, setManifestError] = useState("");
  const [grade, setGrade] = useState(Math.min(12, Math.max(1, initialGrade)));
  const [batchIndex, setBatchIndex] = useState(0);
  const [questions, setQuestions] = useState<LibraryQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [scriptFilter, setScriptFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const controller = new AbortController();
    fetch("/question-library/index.json", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Question library index could not be loaded (HTTP ${response.status}).`);
        return response.json() as Promise<QuestionLibraryManifest>;
      })
      .then(setManifest)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Could not load the question library index.", error);
        setManifestError(error instanceof Error ? error.message : "Question library index could not be loaded.");
      });
    return () => controller.abort();
  }, []);

  const gradeInfo = manifest?.grades[String(grade)];
  const selectedBatch = gradeInfo?.batches[batchIndex];
  const subjects = Object.keys(curriculum[String(grade)] ?? {});

  useEffect(() => {
    if (!selectedBatch) {
      setQuestions([]);
      setLoading(false);
      setLoadError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    setQuestions([]);
    fetch(`/question-library/${selectedBatch.file}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Question batch could not be loaded (HTTP ${response.status}).`);
        const contentEncoding = response.headers.get("content-encoding");
        if (!contentEncoding?.includes("gzip") && typeof DecompressionStream === "undefined") {
          throw new Error("This browser does not support compressed question data. Please use a current version of Chrome, Edge, Firefox, or Safari.");
        }
        if (!response.body) throw new Error("The question batch response had no data.");
        const body = contentEncoding?.includes("gzip")
          ? response.body
          : response.body.pipeThrough(new DecompressionStream("gzip"));
        return new Response(body).json() as Promise<unknown>;
      })
      .then((data) => setQuestions(parseQuestionBatch(data)))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Could not load a question library batch.", error);
        setLoadError(error instanceof Error ? error.message : "Question batch could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selectedBatch]);

  const questionSubjects = useMemo(
    () => new Map(questions.map((item) => [item.id, inferQuestionSubject(`${item.question}\n${item.answer}\n${item.context}`, grade)])),
    [questions, grade],
  );
  const filteredQuestions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return questions.filter((item) => {
      const matchesQuery = !normalizedQuery ||
        `${item.question}\n${item.answer}\n${item.context}`.toLocaleLowerCase().includes(normalizedQuery);
      const script = containsDevanagari(`${item.question}\n${item.answer}\n${item.context}`);
      const matchesScript = scriptFilter === "all" ||
        (scriptFilter === "devanagari" ? script : !script);
      const matchesSubject = subjectFilter === "all" || questionSubjects.get(item.id) === subjectFilter;
      return matchesQuery && matchesScript && matchesSubject;
    });
  }, [questions, query, scriptFilter, subjectFilter, questionSubjects]);

  const pageCount = Math.ceil(filteredQuestions.length / pageSize);
  const visibleQuestions = filteredQuestions.slice(page * pageSize, (page + 1) * pageSize);
  const emptyGrades = grades.filter((value) => !manifest?.grades[String(value)]?.count);

  function changeGrade(value: number) {
    setGrade(value);
    setBatchIndex(0);
    setQuery("");
    setScriptFilter("all");
    setSubjectFilter("all");
    setPage(0);
    setExpandedIds(new Set());
  }

  function changeBatch(value: number) {
    setBatchIndex(value);
    setQuery("");
    setScriptFilter("all");
    setPage(0);
    setExpandedIds(new Set());
  }

  function toggleExpanded(id: number) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <main className="question-library-page">
      <div className="page-title"><div><span className="eyebrow">IMPORTED QUESTION SET · MIXED CONTENT</span><h1>Question Library</h1><p>Browse questions, answers, and learning context from the uploaded CSV dataset.</p></div></div>
      {manifestError && <p className="error-message" role="alert">{manifestError}</p>}
      {manifest && <>
        <p className="question-library-note"><strong>Dataset coverage:</strong> {manifest.totalQuestions.toLocaleString()} source rows for Classes 6–12. The CSV has no subject column, so subject filters are inferred from question wording and may miss ambiguous items; unclassified questions remain available under “Other / Unclassified”. Classes 1–5 have no rows in this upload.</p>
        <section className="panel question-library-controls" aria-label="Filter question library">
          <label>Class
            <select value={grade} onChange={(event) => changeGrade(Number(event.target.value))}>
              {grades.map((value) => {
                const count = manifest.grades[String(value)]?.count ?? 0;
                return <option value={value} key={value} disabled={count === 0}>{count ? `Class ${value} · ${count.toLocaleString()} questions` : `Class ${value} · Not in this dataset`}</option>;
              })}
            </select>
          </label>
          <label>Batch
            <select value={batchIndex} disabled={!gradeInfo?.batches.length} onChange={(event) => changeBatch(Number(event.target.value))}>
              {(gradeInfo?.batches ?? []).map((batch, index) => <option value={index} key={batch.file}>Batch {index + 1} · questions {batch.start.toLocaleString()}–{batch.end.toLocaleString()}</option>)}
            </select>
          </label>
          <label>Subject
            <select value={subjectFilter} onChange={(event) => { setSubjectFilter(event.target.value); setPage(0); }}>
              <option value="all">All subjects</option>
              {subjects.map((subject) => <option value={subject} key={subject}>{subject}</option>)}
              <option value="Other / Unclassified">Other / Unclassified</option>
            </select>
          </label>
          <label className="question-library-search">Search this class batch
            <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search question, answer, or context" disabled={!selectedBatch} />
          </label>
          <label>Text script
            <select value={scriptFilter} onChange={(event) => { setScriptFilter(event.target.value); setPage(0); }}>
              <option value="all">All scripts</option>
              <option value="devanagari">Contains Devanagari</option>
              <option value="other">No Devanagari detected</option>
            </select>
          </label>
        </section>
        {gradeInfo?.count ? <>
          <p className="question-library-count" role="status">
            {loading ? `Loading Class ${grade} questions…` : loadError ? `Batch ${batchIndex + 1} could not be loaded.` : `Showing ${filteredQuestions.length.toLocaleString()} of ${questions.length.toLocaleString()} questions in this batch · ${gradeInfo.count.toLocaleString()} in Class ${grade}. Subject tags are inferred.`}
          </p>
          {loadError && <p className="error-message" role="alert">{loadError}</p>}
          {!loading && !loadError && <>
            {filteredQuestions.length === 0 ? <section className="panel empty-content"><h2>No matching questions in this batch</h2><p>Try another search or choose a different batch for Class {grade}.</p></section> : <>
              <section className="question-library-results" aria-label="Questions">
                {visibleQuestions.map((item) => {
                  const expanded = expandedIds.has(item.id);
                  return <article className="panel library-question-card" key={item.id}>
                    <div className="library-question-heading"><span className="library-question-number">Q{item.id.toLocaleString()}</span><p>{formatImportedText(item.question)}</p><span className="tag">{questionSubjects.get(item.id)}</span></div>
                    <button className="btn soft" type="button" aria-expanded={expanded} onClick={() => toggleExpanded(item.id)}>{expanded ? "Hide answer and context" : "Reveal answer and context"}</button>
                    {expanded && <div className="library-answer">
                      <div><h2>Answer</h2><p>{formatImportedText(item.answer)}</p></div>
                      {item.context && <div><h2>Context</h2><p>{formatImportedText(item.context)}</p></div>}
                    </div>}
                  </article>;
                })}
              </section>
              {pageCount > 1 && <nav className="question-library-pagination" aria-label="Question pages">
                <button className="btn outline" type="button" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Previous</button>
                <span>Page {page + 1} of {pageCount}</span>
                <button className="btn outline" type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => current + 1)}>Next</button>
              </nav>}
            </>}
          </>}
        </> : !manifestError && <section className="panel empty-content"><h2>Class {grade} is not in this upload</h2><p>The uploaded CSV contains no questions for this class. Available dataset classes are {grades.filter((value) => !emptyGrades.includes(value)).join(", ")}.</p></section>}
        <small className="question-library-provenance">Source: {manifest.source} · Answers and context are displayed as supplied and are not independently verified. Search is limited to the currently selected batch.</small>
      </>}
    </main>
  );
}
