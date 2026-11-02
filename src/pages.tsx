import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Award, BookOpen, Brain, Check, Clock3, Compass, Gamepad2, GraduationCap, History, ListChecks, Search, Sparkles, Target } from "lucide-react";
import { buddies, boards, exams, examTopicMaps, officialSources, type TopicContent } from "./data";
import type { Activity, BuddyId, LearningCharacterId, Note, StudentProfile } from "./types";
import { BRAND } from "./brand";
import { getCurrentStreak, getLevelFromXp, getPointsBalance, getRank } from "./rewards/engine";
import type { RewardsState } from "./types";
import { getSimulationForTopic, hasConceptSimulation } from "./components/topic/simulations/simulationRegistry.js";
import { BuddyPortrait } from "./components/BuddyPortrait";
import { CompanionAvatar } from "./CompanionAvatar";
import { defaultCharacterId, getLearningCharacter } from "./characters";

const Topic3DViewer = lazy(() => import("./components/topic/Topic3DViewer.jsx"));

type ActivityRecorder = (activity: Activity) => Promise<void>;

const makeActivity = (
  kind: Activity["kind"],
  title: string,
  subject: string,
  topic: string,
  result: Pick<Activity, "score" | "correct" | "total" | "durationSeconds" | "difficulty"> = {},
): Activity => ({
  id: crypto.randomUUID(),
  kind,
  title,
  subject,
  topic,
  date: new Date().toISOString(),
  durationSeconds: 0,
  ...result,
});

export function LandingPage({ onStart, onSignIn }: {
  onStart: () => void;
  onSignIn: () => void;
}) {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a className="brand" href="#top"><span className="brand-mark">Q</span><span>{BRAND.name}<small>AI LEARNING COMPANION</small></span></a>
        <nav><a href="#how-it-works">How it works</a><a href="#learning">Learning studio</a><button onClick={onSignIn}>Sign in</button></nav>
      </header>
      <section className="landing-hero" id="top">
        <div className="landing-copy"><span className="eyebrow">A BRIGHTER WAY TO LEARN</span><h1>Curiosity takes you <span>everywhere.</span></h1><p>Clear lessons, playful practice, and a friendly study buddy—all in one calm, personal learning space.</p><div className="landing-actions"><button className="btn violet" onClick={onStart}>Start exploring <span>→</span></button><a className="landing-secondary" href="#how-it-works">See how it works ↓</a></div><div className="landing-trust"><span><GraduationCap aria-hidden="true" /> Class-wise topics</span><span><Sparkles aria-hidden="true" /> Learn at your pace</span><span><Brain aria-hidden="true" /> Practice with purpose</span></div></div>
        <div className="landing-scene" aria-label="Animated learning adventure illustration">
          <div className="scene-sun" /><div className="scene-cloud cloud-one" /><div className="scene-cloud cloud-two" />
          <div className="scene-planet" aria-hidden="true" /><div className="scene-character character-panda"><BuddyPortrait buddyId="beerus" label="Beerus" /></div><div className="scene-character character-fox" aria-hidden="true"><Sparkles /></div>
          <span className="scene-star star-one" aria-hidden="true" /><span className="scene-star star-two" aria-hidden="true" /><div className="scene-book" aria-hidden="true"><BookOpen /></div>
        </div>
      </section>
      <section className="landing-proof" id="how-it-works"><span className="eyebrow">MADE FOR REAL LEARNING</span><h2>One little step at a time.</h2><div className="landing-steps"><article><span>01</span><h3>Choose a topic</h3><p>Find your class topics and open a lesson that fits your learning path.</p></article><article><span>02</span><h3>Make it click</h3><p>Read a clear explanation, explore examples, and ask your buddy for a hint.</p></article><article><span>03</span><h3>Try it yourself</h3><p>Practice, play, and see your learning activity build over time.</p></article></div></section>
      <section className="landing-video-section" id="demo"><div className="landing-video-copy"><span className="eyebrow">TAKE A 60-SECOND TOUR</span><h2>See how QuestShala works.</h2><p>Choose a class, open a topic, learn from a lesson, watch a video, revise with cards, and test what you know. The demo below is interactive so you can explore the workflow before creating your profile.</p><button className="btn violet" onClick={onStart}>Try the interactive demo →</button></div><div className="landing-demo-player"><div className="demo-player-top"><span className="demo-live-dot"/> QUESTSHALA QUICK TOUR <span>01 / 04</span></div><div className="demo-player-screen"><div className="demo-orbit" aria-hidden="true"><Sparkles /></div><div className="demo-player-card"><span>YOUR LEARNING PATH</span><strong>Class → Subject → Topic</strong><div className="demo-path"><i><BookOpen /></i><b>Physics</b><em>→</em><b>Rotational Motion</b></div><small>Video · Notes · Quiz · Test · Revision</small></div></div><div className="demo-player-caption"><span aria-hidden="true">▶</span><div><strong>One topic. Every way to learn.</strong><small>Interactive product walkthrough</small></div></div></div></section>
      <section className="landing-showcase" id="learning"><div><span className="eyebrow">YOUR OWN LEARNING STUDIO</span><h2>Everything connected to the same topic.</h2><p>Switch between video lessons, structured notes, quizzes, timed tests, flashcards, mind maps, and progress insights without losing your place.</p><button className="btn violet" onClick={onStart}>Build my learning space →</button></div><div className="showcase-card"><div className="showcase-card-top"><span><Sparkles aria-hidden="true" /> TODAY'S DISCOVERY</span><span aria-hidden="true">•••</span></div><div className="showcase-flower"><PandaIllustration /></div><strong>Notice. Wonder. Learn.</strong><p>A friendly space to ask the next question.</p><div className="showcase-progress"><span /></div></div></section>
      <footer className="landing-footer"><span>{BRAND.name}</span><span>{BRAND.tagline}</span><Link to="/feedback?feature=Login%20%2F%20Sign%20up">Give feedback</Link><button onClick={onStart}>Start your journey →</button></footer>
    </main>
  );
}

export function HomePage({ profile, activities, topics }: {
  profile: StudentProfile;
  activities: Activity[];
  topics: TopicContent[];
}) {
  const completedLessons = new Set(activities.filter((item) => item.kind === "lesson").map((item) => item.topic)).size;
  const quizzes = activities.filter((item) => item.kind === "quiz");
  const correct = quizzes.reduce((sum, item) => sum + (item.correct ?? 0), 0);
  const answered = quizzes.reduce((sum, item) => sum + (item.total ?? 0), 0);
  return (
    <>
      <div className="welcome-row">
        <div><span className="eyebrow">YOUR LEARNING SPACE</span><h1>Welcome, {profile.name}.</h1><p>Class {profile.grade} · {profile.board}. Choose a topic to learn, then practise what you discover.</p></div>
        <Link className="btn outline" to="/profile">Edit profile</Link>
      </div>
      <section className="hero-card">
        <div className="hero-copy"><span className="hero-label">YOUR NEXT STEP</span><h2>Small steps make big discoveries.</h2><p>Open a topic lesson, try its practice questions, and track your own attempts.</p><Link className="btn primary" to="/syllabus">Explore topics →</Link></div>
        <div className="hero-art" aria-hidden="true"><div className="planet"><span><PandaIllustration /></span></div></div>
      </section>
      <section className="home-quick-tour panel"><div><span className="eyebrow">YOUR NEXT 3 STEPS</span><h2>Learn it. Practise it. Own it.</h2><p>Every topic keeps the learning tools together, so you can move from explanation to exam practice without hunting around.</p></div><div className="quick-tour-steps"><Link to="/syllabus"><span>01</span><strong>Choose your class & topic</strong><small>Browse the syllabus map</small></Link><Link to={topics[0] ? `/topic/${topics[0].id}` : "/syllabus"}><span>02</span><strong>Watch, read & revise</strong><small>Video, notes, cards and mind maps</small></Link><Link to="/practice"><span>03</span><strong>Take a timed test</strong><small>Get a score and weak-topic analysis</small></Link></div></section>
      <div className="home-video-strip"><div><span className="eyebrow">VIDEO LEARNING</span><h2>See it explained. Then try it yourself.</h2><p>Topic pages can play YouTube lessons inside QuestShala and keep revision tools beside the video.</p></div><Link className="btn violet" to={topics[0] ? `/topic/${topics[0].id}` : "/syllabus"}>Explore a topic →</Link></div>
      {profile.grade === 11 && <section className="panel home-feature-video"><div><span className="eyebrow">FEATURED VIDEO LESSON</span><h2>Class 11 Physics · Rotational Motion</h2><p>Sample in-page video integration using a Physics Wallah lecture. Use the topic page to search for specific concepts such as toppling, torque or moment of inertia.</p><Link className="text-link" to="/topic/unavailable?subject=Physics&title=System%20of%20particles%20and%20rotation">Open topic workspace →</Link></div><div className="home-feature-player"><iframe src="https://www.youtube-nocookie.com/embed/p06331ToyhY?start=21518&rel=0" title="Physics Wallah Class 11 Rotational Motion lecture, toppling segment" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/><small>Physics Wallah · rotational motion lecture · toppling segment</small></div></section>}
      <div className="stats-grid">
        <Metric label="Lessons completed" value={completedLessons} icon={<BookOpen />} />
        <Metric label="Quiz attempts" value={quizzes.length} icon={<Brain />} />
        <Metric label="Quiz accuracy" value={answered ? `${Math.round((correct / answered) * 100)}%` : "—"} icon={<Check />} />
        <Metric label="Topics available here" value={topics.length} icon={<Compass />} />
      </div>
      <div className="section-heading"><h2>Continue learning</h2><Link className="text-link" to="/syllabus">Browse topics →</Link></div>
      {topics.length ? <div className="feature-grid">{topics.map((topic) => <Link className="feature-card" key={topic.id} to={`/topic/${topic.id}`}><div className="feature-emoji"><BookOpen aria-hidden="true" /></div><span className="tag">{topic.subject}</span><h3>{topic.title}</h3><p>{topic.intro}</p><div className="feature-foot"><span>Open lesson and practice →</span><span>{topic.questions.length} questions</span></div></Link>)}</div> : <ContentNotice grade={profile.grade} />}
    </>
  );
}

export function SyllabusPage({ profile, topics, curriculum, onBoard, onTopic, onCurriculumTopic, lessonsOnly = false, practiceOnly = false }: {
  profile: StudentProfile;
  topics: TopicContent[];
  curriculum: Record<string, Record<string, string[]>>;
  onBoard: (board: StudentProfile["board"]) => void;
  onTopic: (id: string) => void;
  onCurriculumTopic: (subject: string, title: string) => void;
  lessonsOnly?: boolean;
  practiceOnly?: boolean;
}) {
  const heading = lessonsOnly ? "Lessons" : practiceOnly ? "Practice Zone" : "Syllabus and Topics";
  const classMap = curriculum[String(profile.grade)] ?? {};
  const supportedTitles = new Set(topics.map((topic) => topic.title));
  return (
    <>
      <PageHeading eyebrow={heading.toUpperCase()} title={heading} subtitle={`Class ${profile.grade} · ${profile.board}. Board selections are saved to your profile.`} />
      {!lessonsOnly && !practiceOnly && <section className="panel syllabus-controls"><label>School board<select value={profile.board} onChange={(event) => onBoard(event.target.value as StudentProfile["board"])}>{boards.map((board) => <option value={board.id} key={board.id}>{board.id}</option>)}</select></label><p className="micro-copy">{boards.find((board) => board.id === profile.board)?.detail}. Board selection is stored, but these sample lesson topics are not official board-specific syllabi.</p></section>}
      {topics.length ? <div className="feature-grid topic-catalogue">{topics.map((topic) => (
        <article className="feature-card" key={topic.id}>
          <div className="feature-emoji">{practiceOnly ? <ListChecks /> : lessonsOnly ? <BookOpen /> : <Search />}</div><span className="tag">{topic.subject} · Classes {topic.grades.join(", ")}</span>
          <h3>{topic.title}</h3><p>{practiceOnly ? `${topic.questions.length} topic-specific practice questions with explanations.` : topic.intro}</p>
          <button className="btn violet" onClick={() => onTopic(topic.id)}>{practiceOnly ? "Start practice" : lessonsOnly ? "Open lesson" : "Open topic"} →</button>
        </article>
      ))}</div> : <ContentNotice grade={profile.grade} />}
      {!lessonsOnly && !practiceOnly && <><div className="section-heading"><h2>Class {profile.grade} topic map</h2><span className="tag">{Object.values(classMap).reduce((sum, items) => sum + items.length, 0)} topic clusters</span></div>
        <div className="syllabus-grid">{Object.entries(classMap).map(([subject, entries]) => <section className="syllabus-card" key={subject}><div className="syllabus-card-head"><span className="subject-symbol">📚</span><div><h3>{subject}</h3><small>{entries.length} topic clusters</small></div></div><div className="topic-list">{entries.map((title) => {
          const supported = topics.find((topic) => topic.title === title);
          return <button className="topic-row" key={title} onClick={() => supported ? onTopic(supported.id) : onCurriculumTopic(subject, title)}><span className="topic-check">{supportedTitles.has(title) ? "✓" : "·"}</span><span>{title}</span><span className="topic-arrow">→</span></button>;
        })}</div></section>)}</div></>}
      <div className="source-note"><strong>Content coverage</strong><p>Only topics with reviewed lesson text and question sets are shown as supported in this demo. Other classes and board-specific chapter maps still need verified curriculum content; they are not replaced with generic lessons.</p></div>
    </>
  );
}

export function TopicPage({ profile, topics, recordActivity }: {
  profile: StudentProfile;
  topics: TopicContent[];
  recordActivity: ActivityRecorder;
}) {
  const { topicId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const topic = topics.find((item) => item.id === topicId);
  const [section, setSection] = useState(searchParams.get("practice") === "1" ? "practice" : "lesson");
  const supportsSimulation = Boolean(topic && getSimulationForTopic(topic));
  useEffect(() => {
    if (!supportsSimulation && section === "simulation") setSection("lesson");
  }, [supportsSimulation, section]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [marked, setMarked] = useState<string[]>([]);
  const startedAt = useRef(Date.now());
  if (!topic) return <CurriculumTopicHub subject={searchParams.get("subject") ?? "Subject"} title={searchParams.get("title") ?? "Curriculum topic"} grade={profile.grade} />;
  const activeTopic = topic;
  const question = activeTopic.questions[questionIndex];

  async function submitAnswer() {
    if (selected === null || submitted || !question) return;
    const isCorrect = selected === question.answer;
    const nextCorrect = correct + Number(isCorrect);
    setCorrect(nextCorrect);
    setSubmitted(true);
    if (questionIndex === activeTopic.questions.length - 1) {
      await recordActivity(makeActivity("quiz", `${activeTopic.title} practice`, activeTopic.subject, activeTopic.id, {
        score: Math.round((nextCorrect / activeTopic.questions.length) * 100),
        correct: nextCorrect,
        total: activeTopic.questions.length,
        durationSeconds: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
      }));
    }
  }

  function advanceQuestion() {
    if (questionIndex + 1 >= activeTopic.questions.length) return;
    setQuestionIndex((index) => index + 1);
    setSelected(null);
    setSubmitted(false);
  }

  async function finishLesson() {
    await recordActivity({
      ...makeActivity("lesson", `${activeTopic.title} lesson`, activeTopic.subject, activeTopic.id),
      durationSeconds: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
    });
  }

  return (
    <>
      <PageHeading eyebrow={`CLASS ${profile.grade} · ${activeTopic.subject}`} title={activeTopic.title} subtitle={supportsSimulation ? "A topic-specific lesson, practice test, revision cards, and visual explanation." : "A topic-specific lesson, practice test, and revision cards."} />
      <div className="tabs" role="tablist">
        {["lesson", "video", "notes", "practice", "test", "cards", ...(supportsSimulation ? ["simulation"] : [])].map((item) => <button key={item} role="tab" aria-selected={section === item} className={section === item ? "selected" : ""} onClick={() => setSection(item)}>{item === "cards" ? "Revision cards" : item === "simulation" ? activeTopic.id === "class-11-physics-simple-harmonic-motion" ? "3D simulation" : "Interactive model" : item === "practice" ? "Quiz" : item === "test" ? "Timed test" : item[0].toUpperCase() + item.slice(1)}</button>)}
      </div>
      {section === "lesson" && <section className="panel lesson-content">
        <h2>Start with the big idea</h2><p>{activeTopic.intro}</p>
        <h3>Break it into steps</h3><ol>{activeTopic.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        <div className="example-box"><strong>Real-life example</strong><p>{activeTopic.example}</p></div>
        <div className="activity-callout"><span aria-hidden="true">✨</span><div><strong>Try an observation</strong><p>Write down what you notice, change one thing at a time, and compare the result.</p></div></div>
        <button className="btn violet" onClick={finishLesson}>Mark lesson complete →</button>
        <button className="btn soft" onClick={() => setSection("practice")}>Practise this topic</button>
        <Link className="btn outline" to={`/games?topic=${activeTopic.id}`}>Play this topic game →</Link>
      </section>}
      {section === "video" && <TopicVideoSection topic={activeTopic} grade={profile.grade} />}
      {section === "notes" && <section className="panel topic-notes-panel"><span className="eyebrow">TOPIC NOTES</span><h2>{activeTopic.title} — quick notes</h2><p>{activeTopic.intro}</p><h3>Key ideas</h3><ol>{activeTopic.steps.map((step) => <li key={step}>{step}</li>)}</ol><div className="example-box"><strong>Remember this example</strong><p>{activeTopic.example}</p></div><div className="topic-note-actions"><button className="btn soft" onClick={() => window.print()}>Print / save as PDF</button><button className="btn violet" onClick={() => setSection("cards")}>Revise with cards →</button></div></section>}
      {section === "test" && <section className="panel topic-test-prompt"><div className="feature-emoji"><Clock3 /></div><h2>Ready for a timed {activeTopic.title} test?</h2><p>Choose a difficulty, take the test in a distraction-free full-screen view, and review your marks, missed questions, and concepts to revisit when you finish.</p><Link className="btn violet" to={`/practice?topic=${activeTopic.id}`}>Open timed test centre →</Link></section>}
      {section === "practice" && <section className="panel practice-panel">
        {finished ? <><div className="success-icon">✓</div><h2>Practice complete</h2><p>You answered {correct} of {activeTopic.questions.length} correctly ({Math.round(correct / activeTopic.questions.length * 100)}%). Review missed ideas in the explanations, then revisit the lesson.</p><button className="btn outline" onClick={() => { setQuestionIndex(0); setCorrect(0); setSubmitted(false); setFinished(false); setSelected(null); }}>Try again</button></> : <>
          <div className="panel-head"><h2>Question {questionIndex + 1} of {activeTopic.questions.length}</h2><span className="tag">{activeTopic.subject}</span></div>
          <p className="question-prompt">{question.prompt}</p>
          <div className="answer-grid">{question.choices.map((choice, index) => <button key={choice} disabled={submitted} className={`answer-option ${submitted && index === question.answer ? "correct" : ""} ${submitted && selected === index && index !== question.answer ? "wrong" : ""} ${selected === index ? "chosen" : ""}`} onClick={() => setSelected(index)}>{choice}</button>)}</div>
          {submitted && <p className={`feedback-box show ${selected === question.answer ? "good" : "try"}`}>{question.explanation}</p>}
          <div className="game-footer"><span className="micro-copy">10 questions written for this topic.</span>{submitted ? questionIndex === activeTopic.questions.length - 1 ? <button className="btn violet" onClick={() => setFinished(true)}>See results →</button> : <button className="btn violet" onClick={advanceQuestion}>Next question →</button> : <button className="btn violet" disabled={selected === null} onClick={submitAnswer}>Check answer</button>}</div>
        </>}
      </section>}
      {section === "cards" && <section className="panel flashcard-section">
        <div className="panel-head"><h2>Revision cards</h2><button className="btn outline" onClick={() => setCardIndex(Math.floor(Math.random() * activeTopic.cards.length))}>Shuffle</button></div>
        <button className="flashcard" onClick={() => setShowAnswer((value) => !value)}><small>{showAnswer ? "ANSWER" : "QUESTION"}</small><strong>{showAnswer ? activeTopic.cards[cardIndex].back : activeTopic.cards[cardIndex].front}</strong><span>Tap to flip</span></button>
        <div className="game-footer"><button className="btn outline" onClick={() => { setCardIndex((cardIndex + activeTopic.cards.length - 1) % activeTopic.cards.length); setShowAnswer(false); }}>← Previous</button><button className={`btn ${marked.includes(activeTopic.cards[cardIndex].front) ? "violet" : "soft"}`} onClick={() => setMarked((items) => items.includes(activeTopic.cards[cardIndex].front) ? items.filter((item) => item !== activeTopic.cards[cardIndex].front) : [...items, activeTopic.cards[cardIndex].front])}>{marked.includes(activeTopic.cards[cardIndex].front) ? "Marked for review ✓" : "Mark for review"}</button><button className="btn outline" onClick={() => { setCardIndex((cardIndex + 1) % activeTopic.cards.length); setShowAnswer(false); }}>Next →</button></div>
      </section>}
      {section === "simulation" && supportsSimulation && <section className="panel"><Suspense fallback={<p role="status">Loading visual explanation…</p>}><Topic3DViewer topic={activeTopic} /></Suspense><Link className="text-link" to="/feedback?feature=Topic%20simulations">Give feedback about this simulation</Link></section>}
    </>
  );
}

function CurriculumTopicHub({ subject, title, grade }: { subject: string; title: string; grade: number }) {
  const simulationTopic = { id: "curriculum-topic", subject, title };
  const has3DExplanation = hasConceptSimulation(simulationTopic);
  const [section, setSection] = useState("video");
  const [videoUrl, setVideoUrl] = useState("");
  const isRotationTopic = /rotat|rotation/i.test(title);
  const [videoId, setVideoId] = useState(isRotationTopic ? "p06331ToyhY" : "");
  const [error, setError] = useState("");
  const query = encodeURIComponent(`Class ${grade} ${subject} ${title} explanation PW BYJU'S NCERT`);
  function loadVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { const parsed = new URL(videoUrl.trim()); let id = parsed.hostname.includes("youtu.be") ? parsed.pathname.slice(1) : parsed.searchParams.get("v") ?? ""; if (parsed.pathname.includes("/embed/")) id = parsed.pathname.split("/embed/")[1]?.split("/")[0] ?? ""; if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) throw new Error(); setVideoId(id); setError(""); } catch { setError("Paste a valid YouTube video URL."); }
  }
  return <><PageHeading eyebrow={`CLASS ${grade} · ${subject}`} title={title} subtitle="Your topic workspace connects video discovery, notes, revision and assessment. Reviewed lesson content is added topic by topic; we won't invent facts where the source map only lists a topic cluster."/><div className="tabs" role="tablist">{["video","notes","quiz","test","revision",...(has3DExplanation ? ["simulation"] : [])].map((item) => <button key={item} role="tab" aria-selected={section===item} className={section===item?"selected":""} onClick={()=>setSection(item)}>{item === "revision" ? "Revision" : item === "simulation" ? "3D explanation" : item[0].toUpperCase()+item.slice(1)}</button>)}</div>{section === "simulation" && has3DExplanation && <section className="panel"><Suspense fallback={<p role="status">Loading 3D explanation…</p>}><Topic3DViewer topic={simulationTopic} /></Suspense><p className="micro-copy">This visual model supplements the topic map; it is not a substitute for reviewed lesson notes or a topic-specific question bank.</p><Link className="text-link" to="/practice">Browse available practice quizzes →</Link></section>}{section === "video" && <section className="panel topic-video-panel"><h2>Video lessons for {title}</h2><p>Search for the exact concept, including channels such as Physics Wallah or BYJU'S where available. Select a video and paste its URL below to play it inside this page.</p>{isRotationTopic && <p className="micro-copy">Featured Physics Wallah lecture is preloaded and starts near the toppling segment (around 5:58:38).</p>}<a className="btn violet" href={`https://www.youtube.com/results?search_query=${query}`} target="_blank" rel="noreferrer">Find {title} videos on YouTube ↗</a><form className="video-url-form" onSubmit={loadVideo}><label htmlFor="curriculum-video-url">Play selected video here</label><div><input id="curriculum-video-url" type="url" value={videoUrl} onChange={(e)=>setVideoUrl(e.target.value)} placeholder="Paste YouTube video URL…" required/><button className="btn violet">Play</button></div>{error && <p className="error-message">{error}</p>}</form>{videoId ? <div className="video-embed-wrap"><iframe src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0${isRotationTopic && videoId === "p06331ToyhY" ? "&start=21518" : ""}`} title={`${title} lesson video`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy"/></div> : <div className="video-empty-state"><span>🎬</span><strong>Video player ready</strong><small>Third-party video plays here after you paste its YouTube link.</small></div>}</section>}{section === "notes" && <section className="panel topic-notes-panel"><span className="eyebrow">NOTES WORKSPACE</span><h2>{title} — notes</h2><p><strong>Source map:</strong> Class {grade} · {subject} · {title}</p><div className="example-box"><strong>Build your notes from the selected lesson</strong><p>Use this space to capture definitions, formulas or key facts from the video you choose. The supplied syllabus compendium is a topic map rather than a full textbook, so detailed notes for this topic still need a verified lesson source.</p></div><label className="notes-draft-label">My notes<textarea className="curriculum-notes-draft" placeholder={`Write your verified notes for ${title} here…`} rows={8}/></label><button className="btn soft" onClick={()=>window.print()}>Print / save as PDF</button></section>}{section === "quiz" || section === "test" ? <section className="panel empty-content"><div className="feature-emoji">🧠</div><h2>{section === "quiz" ? "Topic quiz" : "Timed test"} for {title}</h2><p>This syllabus entry is available, but a reviewed topic-specific question bank has not yet been authored. Open Practice Zone for timed tests on currently supported lessons. We avoid generating unverified answer keys.</p><Link className="btn violet" to="/practice">Open Practice Zone →</Link></section> : null}{section === "revision" && <section className="panel empty-content"><div className="feature-emoji">🗂️</div><h2>Revision tools for {title}</h2><p>After verified notes are added, this space is designed for flashcards, short notes, mind maps, formula tables and spaced-revision prompts. The syllabus PDF alone does not contain enough chapter-level explanation to generate these accurately yet.</p><button className="btn outline" onClick={()=>setSection("notes")}>Open notes workspace →</button></section>}</>;
}

function TopicVideoSection({ topic, grade }: { topic: TopicContent; grade: number }) {
  const [url, setUrl] = useState("");
  const [focus, setFocus] = useState("");
  const isRotationTopic = /rotat|rotation/i.test(topic.title);
  const [videoId, setVideoId] = useState(isRotationTopic ? "p06331ToyhY" : "");
  const [error, setError] = useState("");
  const query = encodeURIComponent(`Class ${grade} ${topic.subject} ${topic.title} ${focus} explanation PW BYJU'S NCERT`);
  function loadVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const parsed = new URL(url.trim());
      let id = parsed.hostname.includes("youtu.be") ? parsed.pathname.slice(1) : parsed.searchParams.get("v") ?? "";
      if (parsed.pathname.includes("/embed/")) id = parsed.pathname.split("/embed/")[1]?.split("/")[0] ?? "";
      if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) throw new Error("Please paste a valid YouTube video URL.");
      setVideoId(id); setError("");
    } catch { setError("Paste a valid YouTube video link (youtube.com/watch?v=… or youtu.be/…)."); }
  }
  return <section className="panel topic-video-panel"><div className="panel-head"><div><span className="eyebrow">VIDEO LESSONS</span><h2>{topic.title}</h2><p>Search for lessons from trusted educators, then paste a video link to play it here.</p></div></div><div className="video-search-card"><div className="video-search-icon">▶</div><div><strong>Find a lesson for this exact topic</strong><p>Search results are opened on YouTube; choose a video from a teacher or channel you trust.</p><label className="video-focus-label">Optional subtopic <input value={focus} onChange={(event) => setFocus(event.target.value)} placeholder="e.g. toppling, torque, worked examples" /></label><a className="btn violet" href={`https://www.youtube.com/results?search_query=${query}`} target="_blank" rel="noreferrer">Search YouTube for this topic ↗</a></div></div>{isRotationTopic && <p className="micro-copy">Featured PW lecture is preloaded. It covers rotational motion, including toppling (around 5:58:38 in the full lecture).</p>}<form className="video-url-form" onSubmit={loadVideo}><label htmlFor="topic-video-url">Play a YouTube lesson inside QuestShala</label><div><input id="topic-video-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste YouTube video URL…" required/><button className="btn violet" type="submit">Play video</button></div>{error && <p className="error-message" role="alert">{error}</p>}</form>{videoId ? <div className="video-embed-wrap"><iframe src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0${isRotationTopic && videoId === "p06331ToyhY" ? "&start=21518" : ""}`} title={`${topic.title} video lesson`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy"/><small>Video hosted by YouTube. QuestShala does not own or re-upload third-party lessons.</small></div> : <div className="video-empty-state"><span>🎬</span><strong>Your lesson will play here</strong><small>Paste a YouTube URL above to keep the video on this page.</small></div>}</section>;
}

export function NotesPage({ notes, activities, onSave, onDelete, topics }: {
  notes: Note[];
  activities: Activity[];
  onSave: (note: Note) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  topics: TopicContent[];
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Note | null>(null);
  const [error, setError] = useState("");
  const filtered = notes.filter((note) => `${note.title} ${note.body} ${note.subject} ${note.topic}`.toLowerCase().includes(query.toLowerCase()));
  const topicOptions = [...topics.map((topic) => ({ subject: topic.subject, title: topic.title }))];
  const viewedTopicIds = new Set(activities.filter((activity) => activity.kind === "lesson").map((activity) => activity.topic));
  const lessonSummaries = topics.filter((topic) => viewedTopicIds.has(topic.id));
  const savedSummary = (topic: TopicContent) => notes.find((note) => note.topic === topic.title && note.title === `${topic.title} · lesson summary`);

  function startSummaryEdit(topic: TopicContent) {
    const body = `${topic.intro}\n\nKey ideas:\n${topic.steps.map((step) => `• ${step}`).join("\n")}\n\nExample: ${topic.example}`;
    setEditing(savedSummary(topic) ?? {
      id: crypto.randomUUID(),
      title: `${topic.title} · lesson summary`,
      body,
      subject: topic.subject,
      topic: topic.title,
      updatedAt: new Date().toISOString(),
    });
    setError("");
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = (form.get("photo") as File | null) ?? null;
    if (file && file.size > 2 * 1024 * 1024) {
      setError("Choose an image smaller than 2 MB.");
      return;
    }
    let photo = editing?.photo;
    try {
      if (file && file.size) photo = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the selected photo."));
        reader.readAsDataURL(file);
      });
    } catch (readError) {
      console.error("Could not read the selected note photo.", readError);
      setError("The selected photo could not be read. Try another image.");
      return;
    }
    const topic = String(form.get("topic") ?? "");
    await onSave({
      id: editing?.id ?? crypto.randomUUID(),
      title: String(form.get("title") ?? "").trim(),
      body: String(form.get("body") ?? ""),
      subject: topicOptions.find((item) => item.title === topic)?.subject ?? "",
      topic,
      photo,
      photoPath: editing?.photoPath,
      updatedAt: new Date().toISOString(),
    });
    setEditing(null);
    setError("");
  }
  return (
    <>
      <PageHeading eyebrow="YOUR NOTEBOOK" title="Notes" subtitle="Create, search, edit, and organize your learning notes." />
      <section className="lesson-summary-section">
        <div className="section-heading"><div><span className="eyebrow">FROM YOUR LEARNING</span><h2>Lesson summaries</h2></div><span className="tag">{lessonSummaries.length} lessons seen</span></div>
        {lessonSummaries.length ? <div className="summary-grid">{lessonSummaries.map((topic) => <article className="lesson-summary-card" key={topic.id}><div className="summary-card-icon">✦</div><div><span className="tag">{topic.subject}</span><h3>{topic.title}</h3><p>{topic.intro}</p><small>{topic.steps.length} key steps · Seen in a completed lesson</small><button className="btn soft" onClick={() => startSummaryEdit(topic)}>{savedSummary(topic) ? "Edit saved summary" : "Edit & save as note"} →</button></div></article>)}</div> : <p className="summary-empty">Complete a lesson to collect its short summary here. You can edit and save it into your notes.</p>}
      </section>
      <section className="panel notes-layout">
        <form key={editing?.id ?? "new-note"} className="note-form" onSubmit={submit}>
          <div className="note-form-title"><h2>{editing ? "Edit note" : "Write a note"}</h2>{editing && <button className="text-link" type="button" onClick={() => setEditing(null)}>New note +</button>}</div>
          {editing?.title.endsWith("· lesson summary") && <p className="summary-editing-label">Editing a lesson summary. Save it here to keep your own version.</p>}
          <label>Title<input name="title" required maxLength={100} defaultValue={editing?.title ?? ""} /></label>
          <label>Topic<select name="topic" defaultValue={editing?.topic ?? ""}><option value="">General note</option>{topicOptions.map((item) => <option value={item.title} key={item.title}>{item.subject} · {item.title}</option>)}</select></label>
          <label>Note<textarea name="body" rows={6} required defaultValue={editing?.body ?? ""} /></label>
          <label>Attach a photo<input name="photo" type="file" accept="image/*" /></label>
          {editing?.photo && <img className="note-photo" src={editing.photo} alt="Attached to this note" />}
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="btn violet" type="submit">Save note</button>
          {editing && <button className="btn outline" type="button" onClick={() => setEditing(null)}>Cancel edit</button>}
        </form>
        <div className="note-list"><div className="panel-head"><h2>Saved notes ({filtered.length})</h2><input aria-label="Search notes" placeholder="Search notes…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          {filtered.length ? filtered.map((note) => <article className="note-card" key={note.id}><div><h3>{note.title}</h3><small>{note.subject || "General"}{note.topic ? ` · ${note.topic}` : ""} · {new Date(note.updatedAt).toLocaleDateString()}</small></div><p>{note.body}</p>{note.photo && <img className="note-photo" src={note.photo} alt={`Attachment for ${note.title}`} />}<div className="button-row"><button className="btn soft" type="button" onClick={() => { setEditing(note); setError(""); }}>Edit</button><button className="btn outline" type="button" onClick={() => void onDelete(note.id)}>Delete</button></div></article>) : <p className="empty-state">No matching notes yet. Create one to keep a useful idea.</p>}
        </div>
      </section>
    </>
  );
}

export function ProgressPage({ profile, activities, rewards }: { profile: StudentProfile; activities: Activity[]; rewards: RewardsState }) {
  const quizzes = activities.filter((item) => item.kind === "quiz");
  const total = quizzes.reduce((sum, item) => sum + (item.total ?? 0), 0);
  const correct = quizzes.reduce((sum, item) => sum + (item.correct ?? 0), 0);
  const lessons = new Set(activities.filter((item) => item.kind === "lesson").map((item) => item.topic)).size;
  const studySeconds = activities.reduce((sum, item) => sum + (item.durationSeconds ?? 0), 0);
  const days = new Set(activities.map((item) => item.date.slice(0, 10))).size;
  const earnedXp = rewards.ledger.filter((entry) => entry.type === "xp").reduce((sum, entry) => sum + entry.amount, 0);
  const spentPoints = -rewards.ledger.filter((entry) => entry.type === "points" && entry.amount < 0).reduce((sum, entry) => sum + entry.amount, 0);
  const streak = getCurrentStreak(activities, rewards.ledger);
  const rank = getRank(streak);
  return <>
    <PageHeading eyebrow="YOUR PROGRESS" title="Progress and achievements" subtitle="XP grows your level, a daily learning streak determines rank, and Points are the only spendable reward." />
    <div className="stats-grid progress-grid"><Metric label="Level" value={getLevelFromXp(earnedXp)} icon={<Award />} /><Metric label="Points available" value={getPointsBalance(rewards.ledger)} icon={<Target />} /><Metric label="Points spent" value={spentPoints} icon={<ListChecks />} /><Metric label="Lessons completed" value={lessons} icon={<BookOpen />} /><Metric label="Quiz accuracy" value={total ? `${Math.round(correct / total * 100)}%` : "—"} icon={<Check />} /><Metric label="Current streak rank" value={`${rank.name} · ${streak} days`} icon={<History />} /><Metric label="Learning days recorded" value={days} icon={<Compass />} /><Metric label="Time recorded" value={`${Math.floor(studySeconds / 60)} min`} icon={<Clock3 />} /><Metric label="Topics attempted" value={new Set(quizzes.map((item) => item.topic)).size} icon={<Brain />} /><Metric label="Selected exam tracks" value={profile.grade >= 9 ? profile.exams.length : "Not eligible"} icon={<Target />} /></div>
    <div className="source-note"><strong>How these metrics work</strong><p>Rewards are awarded for completed learning activities, not for opening a screen. Reward history and tunable rules are available on the <Link to="/points">Levels and Points page</Link>.</p></div>
  </>;
}

export function HistoryPage({ activities }: { activities: Activity[] }) {
  const [kind, setKind] = useState("all");
  const filtered = activities.filter((item) => kind === "all" || item.kind === kind);
  return <>
    <PageHeading eyebrow="ACTIVITY HISTORY" title="Tests, quizzes, lessons and games" subtitle="Review completed learning activities and revisit topics." />
    <div className="filter-row"><label>Show<select value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">All activity</option><option value="quiz">Quizzes</option><option value="lesson">Lessons</option><option value="game">Games</option></select></label></div>
    <div className="panel history-list">{filtered.length ? filtered.map((item) => <article className="history-row" key={item.id}><span className="history-icon">{item.kind === "quiz" ? <Brain /> : item.kind === "lesson" ? <BookOpen /> : <Gamepad2 />}</span><div><strong>{item.title}</strong><p>{item.subject} · {item.topic} · {new Date(item.date).toLocaleString()}</p></div>{item.total !== undefined && <span className="score-pill">{item.correct}/{item.total} · {item.score}%</span>}<Link className="btn soft" to={`/topic/${item.topic}`}>Review topic</Link></article>) : <p className="empty-state">No activities yet. Complete a lesson or practice test to see it here.</p>}</div>
  </>;
}

export function GamesPage({ profile, topics, recordActivity }: {
  profile: StudentProfile;
  topics: TopicContent[];
  recordActivity: ActivityRecorder;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTopicId = topics.some((item) => item.id === searchParams.get("topic")) ? searchParams.get("topic")! : topics[0]?.id ?? "";
  const [topicId, setTopicId] = useState(initialTopicId);
  const [gameType, setGameType] = useState<"quiz" | "cards" | "sequence">("quiz");
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [checked, setChecked] = useState(false);
  const [cardAnswer, setCardAnswer] = useState(false);
  const [knownCards, setKnownCards] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [sequenceChecked, setSequenceChecked] = useState(false);
  const startedAt = useRef(Date.now());
  const topic = topics.find((item) => item.id === topicId);
  const shuffledSteps = topic ? topic.steps.map((step, originalIndex) => ({ step, originalIndex })).reverse() : [];

  useEffect(() => {
    setTopicId((current) => topics.some((item) => item.id === current) ? current : topics[0]?.id ?? "");
  }, [topics]);

  function resetGame(nextTopicId = topicId, nextType = gameType) {
    setTopicId(nextTopicId);
    setSearchParams(nextTopicId ? { topic: nextTopicId } : {});
    setGameType(nextType);
    setIndex(0);
    setChoice(null);
    setCorrect(0);
    setDone(false);
    setChecked(false);
    setCardAnswer(false);
    setKnownCards(0);
    setSequence([]);
    setSequenceChecked(false);
    startedAt.current = Date.now();
  }

  if (!topic) return <ContentNotice grade={profile.grade} />;
  const activeTopic = topic;
  const q = activeTopic.questions[index];

  async function check() {
    if (choice === null || checked) return;
    const next = correct + Number(choice === q.answer);
    setCorrect(next);
    setChecked(true);
  }

  async function finishGame(score: number, total: number, label: string) {
    await recordActivity(makeActivity("game", `${activeTopic.title} · ${label}`, activeTopic.subject, activeTopic.id, {
      score: Math.round(score / total * 100),
      correct: score,
      total,
      durationSeconds: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
    }));
    setDone(true);
  }

  function markCard(remembered: boolean) {
    const nextKnown = knownCards + Number(remembered);
    setKnownCards(nextKnown);
    setCardAnswer(false);
    if (index + 1 >= activeTopic.cards.length) {
      void finishGame(nextKnown, activeTopic.cards.length, "recall cards");
    } else {
      setIndex((current) => current + 1);
    }
  }

  function chooseStep(originalIndex: number) {
    if (!sequenceChecked && !sequence.includes(originalIndex)) {
      setSequence((items) => [...items, originalIndex]);
    }
  }

  function clearSequence() {
    setSequence([]);
    setSequenceChecked(false);
  }

  async function checkSequence() {
    if (sequence.length !== activeTopic.steps.length || sequenceChecked) return;
    setSequenceChecked(true);
    const score = sequence.reduce((sum, item, position) => sum + Number(item === position), 0);
    await finishGame(score, activeTopic.steps.length, "put-the-steps-in-order");
  }

  const gameCards = [
    { id: "quiz" as const, icon: "🧠", title: "Quiz quest", description: `${activeTopic.questions.length} topic questions with clear explanations.` },
    { id: "cards" as const, icon: "🃏", title: "Memory cards", description: `${activeTopic.cards.length} useful facts to recall and review.` },
    { id: "sequence" as const, icon: "🪄", title: "Put it in order", description: "Tap the learning steps in the correct sequence." },
  ];

  return <>
    <PageHeading eyebrow="TOPIC GAME STUDIO" title={profile.grade <= 5 ? "Pick a game. Grow an idea." : "Practise by playing"} subtitle="Choose a supported topic, then try a quiz, memory cards, or an interactive step-order puzzle." />
    <section className="panel game-picker">
    <label>Choose a topic<select value={activeTopic.id} onChange={(event) => resetGame(event.target.value)}>{topics.map((item) => <option value={item.id} key={item.id}>{item.subject} · {item.title}</option>)}</select></label>
    <div className="game-mode-grid">{gameCards.map((game) => <button className={`game-mode-card ${gameType === game.id ? "selected" : ""}`} key={game.id} onClick={() => resetGame(activeTopic.id, game.id)}><span>{game.icon}</span><strong>{game.title}</strong><small>{game.description}</small></button>)}</div>
    </section>
    <section className={`panel practice-panel game-stage game-stage-${gameType}`}>
      <div className="game-stage-sparkles" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span></div>
      <div className="panel-head"><h2>{done ? "Nice work!" : `${activeTopic.title} · ${gameType === "quiz" ? `Question ${index + 1} of 5` : gameType === "cards" ? `Card ${index + 1} of ${activeTopic.cards.length}` : "Step sequence"}`}</h2><span className="tag">{activeTopic.subject}</span></div>
      {done ? <div className="game-results"><div className="success-icon">✓</div><h3>Challenge complete</h3><p>{      gameType === "quiz" ? `You answered ${correct} of 5 quiz questions correctly.` : gameType === "cards" ? `You recalled ${knownCards} of ${activeTopic.cards.length} cards.` : `You placed ${sequence.reduce((sum, item, position) => sum + Number(item === position), 0)} of ${activeTopic.steps.length} steps in the right place.`}</p><button className="btn violet" onClick={() => resetGame(activeTopic.id)}>Play again →</button></div> :
        gameType === "quiz" ? <>
          <div className="question-prompt">{q.prompt}</div><div className="answer-grid">{q.choices.map((answer, i) => <button className={`answer-option ${checked && i === q.answer ? "correct" : ""} ${checked && i === choice && i !== q.answer ? "wrong" : ""}`} key={answer} disabled={checked} onClick={() => setChoice(i)}>{answer}</button>)}</div>
          {checked && <p className="feedback-box show">{q.explanation}</p>}
          <div className="game-footer"><span className="micro-copy">The answer explanation follows each question.</span>{checked ? index < 4 ? <button className="btn violet" onClick={() => { setIndex((n) => n + 1); setChoice(null); setChecked(false); }}>Next round →</button> : <button className="btn violet" onClick={() => void finishGame(correct, 5, "quiz quest")}>See results →</button> : <button className="btn violet" disabled={choice === null} onClick={() => void check()}>Check answer</button>}</div>
        </> : gameType === "cards" ? <>
          <button className={`memory-card ${cardAnswer ? "flipped" : ""}`} onClick={() => setCardAnswer((value) => !value)}><small>{cardAnswer ? "REMEMBER THIS" : "CAN YOU RECALL?"}</small><strong>{cardAnswer ? activeTopic.cards[index].back : activeTopic.cards[index].front}</strong><span>Tap the card to reveal the answer</span></button>
          {cardAnswer && <div className="button-row"><button className="btn outline" onClick={() => markCard(false)}>Practise this again</button><button className="btn violet" onClick={() => markCard(true)}>I remembered it ✓</button></div>}
        </> : <>
          <p className="sequence-instructions">{sequenceChecked ? "Compare the numbered order with the lesson steps." : "Tap each step in the order you think the idea happens."}</p>
          <div className="sequence-options">{shuffledSteps.map(({ step, originalIndex }) => <button key={originalIndex} disabled={sequenceChecked || sequence.includes(originalIndex)} className={`sequence-option ${sequence.includes(originalIndex) ? "placed" : ""}`} onClick={() => chooseStep(originalIndex)}><span>{sequence.includes(originalIndex) ? sequence.indexOf(originalIndex) + 1 : "＋"}</span>{step}</button>)}</div>
          {sequenceChecked && <p className="feedback-box show">{sequence.every((item, position) => item === position) ? "Perfect order! You have the process." : `The correct order is: ${activeTopic.steps.join(" → ")}`}</p>}
          <div className="game-footer"><button className="btn outline" onClick={clearSequence} disabled={!sequence.length || sequenceChecked}>Start over</button><button className="btn violet" disabled={sequence.length !== activeTopic.steps.length || sequenceChecked} onClick={() => void checkSequence()}>Check sequence</button></div>
        </>}
    </section>
    <p className="source-note"><strong>Every game stays topic-specific.</strong> Results are added to your learning activity history. A matching mini-game can be played for topics with authored lesson content; other curriculum topics need their own reviewed content before a meaningful game can be offered.</p>
  </>;
}

export function BuddyPage({ profile, buddy, topics, characterId }: {
  profile: StudentProfile;
  buddy: (typeof buddies)[number];
  topics: TopicContent[];
  characterId?: LearningCharacterId;
}) {
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const topic = topics.find((item) => item.id === topicId);
  function ask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (!text || !topic) return;
    const response = buddy.id === "beerus"
      ? `Good question. Let's look at ${topic.title} one step at a time. ${topic.intro} Start here: ${topic.steps[0]}`
      : `${buddy.label} says: Let's look at ${topic.title}. ${topic.intro} ${topic.steps[0]}`;
    setReply(response);
    setQuestion("");
    if ("speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined" && profile.voice !== "off") {
      const utterance = new SpeechSynthesisUtterance(response);
      const voices = window.speechSynthesis.getVoices();
      utterance.voice = voices.find((voice) => voice.voiceURI === profile.voice) ?? null;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }
  return <>
    <PageHeading eyebrow="YOUR LEARNING BUDDY" title={`${profile.buddyName || getLearningCharacter(characterId).name} is here to help`} subtitle={`${getLearningCharacter(characterId).title} · guided answers are grounded in authored lesson content. A live LLM is not configured in this build.`} />
    {topics.length ? <section className="panel buddy-chat"><label>Choose a topic<select value={topicId} onChange={(event) => setTopicId(event.target.value)}>{topics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><div className="buddy-message"><span aria-hidden="true"><CompanionAvatar id={characterId ?? defaultCharacterId} size="small" /></span><p>{reply || getLearningCharacter(characterId).greeting || "Ask for an explanation or a hint about one of the topics in your learning library."}</p></div><form className="chat-form" onSubmit={ask}><input aria-label="Ask your buddy" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a topic-related question…" /><button className="btn violet" type="submit">Ask</button></form><p className="micro-copy">This companion uses the app's authored topics to provide guided practice, not a connected AI service.</p></section> : <ContentNotice grade={profile.grade} />}
  </>;
}

export function PracticeZone({ profile, topics, recordActivity, onTestActive }: {
  profile: StudentProfile;
  topics: TopicContent[];
  recordActivity: ActivityRecorder;
  onTestActive: (active: boolean) => void;
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedTopic = searchParams.get("topic");
  const requestedMode = searchParams.get("mode") === "quiz" ? "quiz" : "test";
  const [topicId, setTopicId] = useState(requestedTopic ?? "");
  const [mode, setMode] = useState<"quiz" | "test">(requestedMode);
  const [level, setLevel] = useState<"Starter" | "Standard" | "Challenge">("Standard");
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState(false);
  const [fullscreenNotice, setFullscreenNotice] = useState("");
  const runId = useRef("");
  const selectedTopic = topics.find((topic) => topic.id === topicId);
  const questions = selectedTopic?.questions ?? [];
  const durationMinutes = level === "Starter" ? 8 : level === "Standard" ? 12 : 15;
  const score = questions.reduce((total, question, questionIndex) => total + Number(answers[questionIndex] === question.answer), 0);
  const missed = questions.filter((question, questionIndex) => answers[questionIndex] !== question.answer);
  const subjects = [...new Set(topics.map((topic) => topic.subject))];

  useEffect(() => {
    if (requestedTopic && topics.some((topic) => topic.id === requestedTopic)) {
      setTopicId(requestedTopic);
      setMode(requestedMode);
    }
  }, [requestedMode, requestedTopic, topics]);

  useEffect(() => {
    if (!active || mode !== "test") return undefined;
    const timer = window.setInterval(() => setSecondsLeft((remaining) => {
      if (remaining <= 1) {
        window.clearInterval(timer);
        window.setTimeout(() => { void finishRef.current?.(); }, 0);
        return 0;
      }
      return remaining - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [active, mode]);

  useEffect(() => () => {
    onTestActive(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, [onTestActive]);

  const finishRef = useRef<(() => Promise<void>) | null>(null);

  async function begin(nextMode: "quiz" | "test", nextTopicId: string) {
    const topic = topics.find((item) => item.id === nextTopicId);
    if (!topic?.questions.length) return;
    setTopicId(nextTopicId);
    setMode(nextMode);
    setIndex(0);
    setAnswers({});
    setResult(false);
    setFullscreenNotice("");
    runId.current = crypto.randomUUID();
    setSecondsLeft(durationMinutes * 60);
    setActive(true);
    onTestActive(nextMode === "test");
    try {
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setFullscreenNotice("Full screen is unavailable in this browser; your activity can still continue here.");
    } catch {
      setFullscreenNotice("Full-screen permission was not granted. Your activity will continue in distraction-free mode.");
    }
  }

  async function finish() {
    if (!selectedTopic || result) return;
    setActive(false);
    setResult(true);
    onTestActive(false);
    await recordActivity({
      ...makeActivity("quiz", `${selectedTopic.title} · ${mode === "test" ? `${level} timed test` : "quiz"}`, selectedTopic.subject, selectedTopic.id, {
        score: Math.round(score / Math.max(1, questions.length) * 100),
        correct: score,
        total: questions.length,
        durationSeconds: mode === "test" ? durationMinutes * 60 - secondsLeft : 0,
        difficulty: level,
      }),
      id: runId.current,
    });
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
  }
  finishRef.current = finish;

  if (active && selectedTopic) {
    const question = questions[index];
    return <main className={`practice-run ${mode === "test" ? "test-mode" : "quiz-mode"}`} aria-label={`${mode === "test" ? "Timed test" : "Quiz"} in progress`}>
      <header className="practice-run-header">
        <div><span className="eyebrow">{mode === "test" ? "FOCUS MODE · NO CHAT HELP" : "QUIZ · BEERUS CAN HELP"}</span><h1>{selectedTopic.title}</h1><p>Class {profile.grade} · {selectedTopic.subject} · {level}</p></div>
        {mode === "test" && <div className={`test-clock ${secondsLeft < 60 ? "urgent" : ""}`} aria-label={`${Math.floor(secondsLeft / 60)} minutes ${secondsLeft % 60} seconds remaining`}>{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</div>}
      </header>
      <div className="test-progress" role="progressbar" aria-label="Question progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index + 1}><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
      <section className="timed-question panel">
        <div className="panel-head"><span className="tag">Question {index + 1} / {questions.length}</span><span className="tag">{mode === "test" ? `${level} test` : "Practice quiz"}</span></div>
        <h2>{question.prompt}</h2>
        <div className="answer-grid">{question.choices.map((choice, option) => <button key={choice} className={`answer-option ${answers[index] === option ? "chosen" : ""}`} aria-pressed={answers[index] === option} onClick={() => setAnswers((current) => ({ ...current, [index]: option }))}><span>{String.fromCharCode(65 + option)}.</span> {choice}</button>)}</div>
        {mode === "quiz" && <details className="practice-hint"><summary>Ask Beerus for a hint</summary><p>{selectedTopic.intro} Start with: {selectedTopic.steps[0]}</p></details>}
        <div className="timed-test-footer"><button className="btn outline" disabled={index === 0} onClick={() => setIndex((current) => current - 1)}>← Previous</button><span>{Object.keys(answers).length} answered</span>{index < questions.length - 1 ? <button className="btn violet" onClick={() => setIndex((current) => current + 1)}>Next question →</button> : <button className="btn violet" onClick={() => void finish()}>Finish {mode === "test" ? "test" : "quiz"}</button>}</div>
        {index === questions.length - 1 && <button className="text-link" onClick={() => void finish()}>Submit now</button>}
      </section>
      {fullscreenNotice && <p className="micro-copy" role="status">{fullscreenNotice}</p>}
    </main>;
  }

  if (result && selectedTopic) return <div className="timed-test-screen results-screen">
    <section className="panel result-hero"><span className="eyebrow">{mode === "test" ? "TEST REPORT" : "QUIZ RESULTS"} · {level.toUpperCase()}</span><div className="result-score-ring"><strong>{Math.round(score / Math.max(1, questions.length) * 100)}%</strong><small>{score}/{questions.length} correct</small></div><h1>{score / Math.max(1, questions.length) >= .8 ? "Excellent work!" : score / Math.max(1, questions.length) >= .5 ? "Good progress — let's strengthen a few areas." : "Every attempt is progress."}</h1><p>Your answers and explanations are based on the selected topic.</p></section>
    <section className="panel"><h2>Review together</h2>{missed.length ? <ul className="weak-spot-list">{missed.map((question) => <li key={question.prompt}><strong>{question.prompt}</strong><p>{question.explanation}</p></li>)}</ul> : <p>Every answer was correct. Nice work!</p>}<button className="btn outline" onClick={() => { setResult(false); setTopicId(""); navigate("/practice"); }}>Back to Practice Zone</button></section>
  </div>;

  return <>
    <PageHeading eyebrow={profile.exams.length ? `${profile.exams.join(" · ")} STUDY TRACK` : `CLASS ${profile.grade} PRACTICE`} title="Choose a subject, then a topic." subtitle="Every topic with reviewed questions has a quick quiz and a timed test. Choose the format that fits your practice." />
    <section className="panel imported-bank-promo"><div className="imported-bank-promo-icon"><BookOpen /></div><div><span className="eyebrow">EXTRA PRACTICE · CLASSES 6–12</span><h2>Question Vault · Imported Test Data</h2><p>Try timed random sets from the imported 222,880-row question archive, with answer reveal and self-assessment.</p></div><Link className="btn violet" to="/practice/imported">Open imported tests →</Link></section>
    {!topics.length && <section className="panel empty-state">No reviewed topic quizzes are available for this class yet. Try the Imported Question Test above for Classes 6–12.</section>}
    {subjects.map((subject) => <section className="practice-subject-section" key={subject}><div className="section-heading"><h2>{subject}</h2><span className="tag">{topics.filter((topic) => topic.subject === subject).length} topics</span></div><div className="practice-topic-grid">{topics.filter((topic) => topic.subject === subject).map((topic) => <article className={`panel practice-topic-card subject-${subject.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} key={topic.id}><span className="eyebrow">{topic.grades.includes(profile.grade) ? `CLASS ${profile.grade}` : "REVISION"}</span><h3>{topic.title}</h3><p>{topic.questions.length} reviewed questions · {subject}</p><div className="practice-topic-actions"><button className="btn outline" onClick={() => void begin("quiz", topic.id)}>Start quiz</button><button className="btn violet" onClick={() => void begin("test", topic.id)}>Timed test</button></div></article>)}</div></section>)}
    <section className="panel test-setup-panel"><h2>Choose test difficulty</h2><div className="test-level-grid">{([{ name: "Starter", description: "Build confidence with foundational questions." }, { name: "Standard", description: "Balanced practice for class assessments." }, { name: "Challenge", description: "Push your recall and reasoning." }] as const).map((item) => <button key={item.name} className={`test-level-card ${level === item.name ? "selected" : ""}`} onClick={() => setLevel(item.name)}><strong>{item.name}</strong><p>{item.description}</p></button>)}</div><p className="micro-copy">Selected level: {level}. Choose Timed test on any topic to begin.</p></section>
  </>;
}

export function PracticeTestPage({ profile, topics, recordActivity }: { profile: StudentProfile; topics: TopicContent[]; recordActivity: ActivityRecorder }) {
  const [searchParams] = useSearchParams();
  const requestedTopic = searchParams.get("topic");
  const [topicId, setTopicId] = useState(requestedTopic && topics.some((t) => t.id === requestedTopic) ? requestedTopic : topics[0]?.id ?? "");
  const [level, setLevel] = useState<"Starter" | "Standard" | "Challenge">("Standard");
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState(false);
  const [fullscreenWarning, setFullscreenWarning] = useState("");
  const finishTestRef = useRef<(() => Promise<void>) | null>(null);
  const testRunId = useRef("");
  const selectedTopic = topics.find((topic) => topic.id === topicId);
  const totalQuestions = selectedTopic?.questions.length ?? 0;
  const duration = level === "Starter" ? 8 : level === "Standard" ? 12 : 15;
  useEffect(() => {
    if (!running || result) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => {
      if (value <= 1) {
        window.clearInterval(timer);
        window.setTimeout(() => { void finishTestRef.current?.(); }, 0);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running, result]);
  useEffect(() => () => { if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined); }, []);
  const score = selectedTopic ? selectedTopic.questions.reduce((sum, q, i) => sum + Number(answers[i] === q.answer), 0) : 0;
  const missed = selectedTopic ? selectedTopic.questions.filter((q, i) => answers[i] !== q.answer) : [];
  async function startTest() {
    if (!selectedTopic) return;
    testRunId.current = crypto.randomUUID();
    setIndex(0); setAnswers({}); setResult(false); setSecondsLeft(duration * 60); setRunning(true); setFullscreenWarning("");
    try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); }
    catch { setFullscreenWarning("Browser full-screen permission was not granted. The test will still run in distraction-free mode."); }
  }
  async function finishTest() {
    if (!selectedTopic || result) return;
    setRunning(false); setResult(true);
    await recordActivity({ ...makeActivity("quiz", `${selectedTopic.title} · ${level} timed test`, selectedTopic.subject, selectedTopic.id, { score: Math.round((score / Math.max(1, totalQuestions)) * 100), correct: score, total: totalQuestions, durationSeconds: duration * 60 - secondsLeft, difficulty: level }), id: testRunId.current });
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
  }
  finishTestRef.current = finishTest;
  if (running && selectedTopic) {
    const q = selectedTopic.questions[index];
    return <div className="timed-test-screen"><header><div><span className="eyebrow">QUESTSHALA EXAM MODE</span><h1>{selectedTopic.title}</h1><p>Class {profile.grade} · {selectedTopic.subject} · {level}</p></div><div className={`test-clock ${secondsLeft < 60 ? "urgent" : ""}`}>⏱ {String(Math.floor(secondsLeft / 60)).padStart(2,"0")}:{String(secondsLeft % 60).padStart(2,"0")}</div></header><div className="test-progress"><span style={{ width: `${((index + 1) / totalQuestions) * 100}%` }}/></div><section className="timed-question panel"><div className="panel-head"><span className="tag">Question {index + 1} / {totalQuestions}</span><span className="tag">{level} level</span></div><h2>{q.prompt}</h2><div className="answer-grid">{q.choices.map((choice, option) => <button key={choice} className={`answer-option ${answers[index] === option ? "chosen" : ""}`} onClick={() => setAnswers((current) => ({ ...current, [index]: option }))}><span>{String.fromCharCode(65 + option)}.</span> {choice}</button>)}</div><div className="timed-test-footer"><button className="btn outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>← Previous</button><span>{Object.keys(answers).length} answered</span>{index < totalQuestions - 1 ? <button className="btn violet" onClick={() => setIndex((i) => i + 1)}>Next question →</button> : <button className="btn violet" onClick={() => void finishTest()}>Submit test</button>}</div><button className="text-link" onClick={() => void finishTest()}>Finish test now</button></section>{fullscreenWarning && <p className="micro-copy">{fullscreenWarning}</p>}</div>;
  }
  if (result && selectedTopic) return <div className="timed-test-screen results-screen"><section className="panel result-hero"><span className="eyebrow">TEST REPORT · {level.toUpperCase()}</span><div className="result-score-ring"><strong>{Math.round(score / Math.max(1,totalQuestions) * 100)}%</strong><small>{score}/{totalQuestions} correct</small></div><h1>{score / Math.max(1,totalQuestions) >= .8 ? "Excellent work!" : score / Math.max(1,totalQuestions) >= .5 ? "Good progress — let's strengthen a few areas." : "Every attempt is progress."}</h1><p>Your local QuestShala analysis is based on the answers recorded in this test.</p><div className="result-metrics"><div><strong>{score}</strong><small>Correct</small></div><div><strong>{totalQuestions-score}</strong><small>Review</small></div><div><strong>{Math.round((duration*60-secondsLeft)/60)}m</strong><small>Time used</small></div></div></section><section className="panel"><span className="eyebrow">AI BUDDY · PERFORMANCE ANALYSIS</span><h2>What went well</h2><p>{score >= totalQuestions * .8 ? `You showed strong understanding of ${selectedTopic.title}. Try the Challenge level next.` : `You have a foundation in ${selectedTopic.title}; reviewing explanations for missed questions should improve your next attempt.`}</p><h3>Weak spots to revisit</h3>{missed.length ? <ul className="weak-spot-list">{missed.map((q) => <li key={q.prompt}><strong>{q.prompt}</strong><p>{q.explanation}</p></li>)}</ul> : <p>None of the questions were missed. Revise the topic once and attempt a harder level.</p>}<div className="topic-note-actions"><button className="btn outline" onClick={() => { setResult(false); setRunning(false); if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined); }}>Back to test centre</button><button className="btn violet" onClick={() => { setLevel("Challenge"); setResult(false); }}>Try Challenge level →</button></div><p className="micro-copy">Note: this prototype generates feedback from the test answer data locally; a live LLM-powered AI analysis requires an AI backend/API connection.</p></section></div>;
  return <><PageHeading eyebrow="PRACTICE ZONE" title="Test yourself, level up." subtitle="Choose a topic and difficulty. Each test runs with a timer and a distraction-free full-screen layout, then gives you a score and review plan."/><section className="panel test-setup-panel"><label>Class / topic<select value={topicId} onChange={(e) => setTopicId(e.target.value)}>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.subject} · {topic.title}</option>)}</select></label><div className="section-heading"><h2>Choose your test level</h2></div><div className="test-level-grid">{([{name:"Starter", icon:"🌱", time:"8 minutes", description:"Build confidence with foundational questions."},{name:"Standard", icon:"⚡", time:"12 minutes", description:"Balanced practice for class assessments."},{name:"Challenge", icon:"🔥", time:"15 minutes", description:"Push your recall and reasoning under time."}] as const).map((item) => <button key={item.name} className={`test-level-card ${level === item.name ? "selected" : ""}`} onClick={() => setLevel(item.name)}><span>{item.icon}</span><strong>{item.name}</strong><small>{item.time} · {totalQuestions} questions</small><p>{item.description}</p></button>)}</div>{selectedTopic ? <div className="test-start-row"><div><strong>{selectedTopic.title}</strong><p>{selectedTopic.subject} · {totalQuestions} questions · {duration} min</p></div><button className="btn violet" onClick={() => void startTest()}>Start full-screen test →</button></div> : <p>No reviewed topic questions are available for this class yet.</p>}</section><section className="panel"><h2>Test series</h2><div className="test-series-grid">{[1,2,3].map((n) => <button className="test-series-card" key={n} onClick={() => { setLevel(n === 1 ? "Starter" : n === 2 ? "Standard" : "Challenge"); window.scrollTo({top:0,behavior:"smooth"}); }}><span>TEST {n}</span><strong>{["Foundation check","Topic mastery","Exam challenge"][n-1]}</strong><small>{["Starter","Standard","Challenge"][n-1]} level · {duration} min</small></button>)}</div></section></>;
}

export function ExamsPage({ profile, onSave }: {
  profile: StudentProfile;
  onSave: (profile: StudentProfile) => void;
}) {
  const [selected, setSelected] = useState(profile.exams);
  function toggle(exam: string) {
    setSelected((items) => items.includes(exam) ? items.filter((item) => item !== exam) : [...items, exam]);
  }
  return <>
    <PageHeading eyebrow="BOARDS AND EXAMS" title="Choose your learning tracks" subtitle="School curriculum selection is separate from optional competitive exam preparation." />
    <section className="panel"><div className="panel-head"><h2>School boards</h2></div><div className="board-grid">{boards.map((board) => <button key={board.id} className={`board-choice ${profile.board === board.id ? "selected" : ""}`} onClick={() => onSave({ ...profile, board: board.id })}><strong>{board.id}</strong><span>{board.detail}</span>{profile.board === board.id && <small>Selected ✓</small>}</button>)}</div></section>
    <div className="section-heading"><h2>Competitive exams</h2></div>
    {profile.grade < 9 ? <section className="panel"><p>Competitive exam preparation is available from Class 9. You are in Class {profile.grade}; this section will unlock when your class is updated in Profile.</p></section> :
      <section className="panel"><p>Select exams to add them to your profile. This prototype does not yet include verified exam question banks or mock-test flows.</p><div className="exam-check-grid">{exams.map((exam) => <label className="check-option" key={exam}><input type="checkbox" checked={selected.includes(exam)} onChange={() => toggle(exam)} />{exam}</label>)}</div><button className="btn violet" onClick={() => onSave({ ...profile, exams: selected })}>Save exam selection</button><p className="micro-copy">Diagnostics and mock tests are not available yet. No exam preparation tests are presented as complete.</p>
        <div className="source-link-list"><strong>Official reference links shared with this project</strong><p>Check the latest notice before using any syllabus or exam details.</p>{officialSources.map((source) => <a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div>
      </section>}
    <section className="exam-topic-library"><div className="section-heading"><h2>Competitive exam topic library</h2><span className="tag">2026–27 planning map</span></div><p className="micro-copy">Topic clusters are based on the supplied syllabus compendium. They help organise learning; always verify exact units, eligibility and paper patterns against the official exam-year notice.</p>{examTopicMaps.map((exam) => <details className="exam-map-card" key={exam.name}><summary><span><strong>{exam.name}</strong><small>{exam.subjects.length} subject / paper areas</small></span><span className="exam-map-open">＋</span></summary><div className="exam-map-content">{exam.subjects.map((subject) => <div className="exam-map-subject" key={subject.name}><h3>{subject.name}</h3><div className="exam-topic-chips">{subject.topics.map((topic) => <span key={topic}>{topic}</span>)}</div></div>)}<p>{exam.note}</p><a className="text-link" href={exam.officialUrl} target="_blank" rel="noreferrer">Open official syllabus / notice ↗</a></div></details>)}</section>
  </>;
}

export function ProfilePage({ profile, onSave, theme, onThemeChange, onGradeChange }: {
  profile: StudentProfile;
  onSave: (profile: StudentProfile) => void | Promise<void>;
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  onGradeChange: (grade: number) => void;
}) {
  const [grade, setGrade] = useState(profile.grade);
  const [saving, setSaving] = useState(false);
  const voiceOptions = typeof window === "undefined" || !("speechSynthesis" in window) ? [] : window.speechSynthesis.getVoices();
  return <>
    <PageHeading eyebrow="PROFILE AND SETTINGS" title="Your learning profile" subtitle="Update class, board, buddy and speech preferences. Historical activity stays available." />
    <form className="panel profile-form" onSubmit={async (event) => {
      event.preventDefault();
      if (saving) return;
      setSaving(true);
      const form = new FormData(event.currentTarget);
      const selectedGrade = Number(form.get("grade"));
      await Promise.resolve(onSave({
        ...profile,
        name: String(form.get("name") ?? "").trim(),
        grade: selectedGrade,
        board: String(form.get("board")) as StudentProfile["board"],
        exams: selectedGrade >= 9 ? form.getAll("exams").map(String) : [],
        buddy: String(form.get("buddy")) as StudentProfile["buddy"],
        buddyName: String(form.get("buddyName") ?? "").trim(),
        voice: String(form.get("voice") ?? ""),
        guardianEmail: String(form.get("guardianEmail") ?? "").trim(),
        guardianConsentAt: form.get("guardianConsent") === "on" ? profile.guardianConsentAt ?? new Date().toISOString() : undefined,
      }));
      setSaving(false);
    }}>
      <label>Display name<input name="name" required maxLength={40} defaultValue={profile.name} /></label>
      <label>Class<select name="grade" value={grade} onChange={(event) => { const nextGrade = Number(event.target.value); setGrade(nextGrade); onGradeChange(nextGrade); }}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Class {i + 1}</option>)}</select></label>
      <label>School board<select name="board" defaultValue={profile.board}>{boards.map((board) => <option key={board.id} value={board.id}>{board.id}</option>)}</select></label>
      {grade >= 9 && <fieldset><legend>Competitive exams</legend>{exams.map((exam) => <label className="check-option" key={exam}><input name="exams" type="checkbox" value={exam} defaultChecked={profile.exams.includes(exam)} />{exam}</label>)}</fieldset>}
      <label>Learning buddy<select name="buddy" defaultValue={profile.buddy}>{buddies.map((buddy) => <option value={buddy.id} key={buddy.id}>{buddy.label}</option>)}</select></label>
      <label>Buddy name<input name="buddyName" maxLength={30} defaultValue={profile.buddyName} /></label>
      <section className="guardian-consent">
        <span className="eyebrow">PARENT OR GUARDIAN</span>
        <label>Parent / guardian email<input name="guardianEmail" type="email" required defaultValue={profile.guardianEmail} /></label>
        <label className="check-option"><input name="guardianConsent" type="checkbox" required defaultChecked={Boolean(profile.guardianConsentAt)} />My parent or guardian agrees to this learning profile and its privacy notice.</label>
        <small>We collect only details needed for this student profile. The consent flow needs legal review against the Digital Personal Data Protection Act, 2023 before launch.</small>
      </section>
      <label>Appearance<select value={theme} onChange={(event) => onThemeChange(event.target.value as "light" | "dark" | "system")}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select><small>Theme changes are saved on this device.</small></label>
      <label>Voice preference<select name="voice" defaultValue={profile.voice}><option value="">System default</option><option value="off">No speech</option>{voiceOptions.slice(0, 6).map((voice) => <option value={voice.voiceURI} key={voice.voiceURI}>{voice.name} ({voice.lang})</option>)}</select><small>Speech synthesis and available voices vary by browser and device.</small></label>
      <button className="btn violet" type="submit" disabled={saving}>{saving ? "Saving your changes…" : "Save profile & return home →"}</button><p className="micro-copy" role="status">{saving ? "Updating your learning space…" : "Your profile updates are saved before returning you to Home."}</p>
    </form>
  </>;
}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div className="page-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div></div>;
}

export function PandaIllustration() {
  return (
    <svg className="panda-illustration" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle cx="25" cy="27" r="17" fill="#263445" />
      <circle cx="75" cy="27" r="17" fill="#263445" />
      <ellipse cx="50" cy="55" rx="39" ry="36" fill="#fffdf7" stroke="#263445" strokeWidth="3" />
      <ellipse cx="34" cy="50" rx="10" ry="14" fill="#263445" transform="rotate(22 34 50)" />
      <ellipse cx="66" cy="50" rx="10" ry="14" fill="#263445" transform="rotate(-22 66 50)" />
      <circle cx="36" cy="49" r="3" fill="#fffdf7" />
      <circle cx="64" cy="49" r="3" fill="#fffdf7" />
      <ellipse cx="50" cy="65" rx="7" ry="5" fill="#263445" />
      <path d="M50 70q-5 8-12 2m12-2q5 8 12 2" fill="none" stroke="#263445" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function BuddyAvatar({ buddyId, label }: { buddyId: BuddyId; label: string }) {
  return <BuddyPortrait buddyId={buddyId} label={label} />;
}

function Metric({ label, value, icon }: { label: string; value: ReactNode; icon: ReactNode }) {
  return <article className="stat-card"><span className="stat-icon purple">{icon}</span><span><small>{label}</small><strong>{value}</strong></span></article>;
}

function ContentNotice({ grade }: { grade: number }) {
  return <section className="panel empty-content"><div className="feature-emoji"><Compass /></div><h2>Verified topic content is not available for Class {grade} yet.</h2><p>The syllabus framework includes topic clusters for more classes, but this build only contains lesson text and question sets for a small sample. We are not substituting generic content or labeling unsupported topics as complete.</p><Link className="btn outline" to="/exams">Review board and exam options</Link></section>;
}
