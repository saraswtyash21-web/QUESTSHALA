import { useEffect, useState } from "react";
import { Check, Star } from "lucide-react";
import { appFeatures } from "./features";
import { getFeedback, submitFeedback, type FeedbackEntry } from "./feedback";
import { BRAND } from "./brand";

const tags = [
  "Easy to use", "Confusing", "Too slow", "Too hard", "Too easy",
  "Bug", "Looks great", "Needs more content",
];

function Face({ mood, selected }: { mood: number; selected: boolean }) {
  const mouths = ["M13 25 Q20 19 27 25", "M13 23 Q20 23 27 23", "M13 21 Q20 27 27 21"];
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={selected ? "face-selected" : ""}>
      <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="14" cy="16" r="1.7" fill="currentColor" />
      <circle cx="26" cy="16" r="1.7" fill="currentColor" />
      <path d={mouths[mood]} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function FeedbackPage({ initialFeature, junior, submitRemote, loadRemote, signedIn }: {
  initialFeature: string;
  junior: boolean;
  submitRemote?: (entry: FeedbackEntry) => Promise<void>;
  loadRemote?: () => Promise<FeedbackEntry[]>;
  signedIn: boolean;
}) {
  const selectableFeatures = appFeatures.filter((feature) => feature.label !== "Feedback");
  const [feature, setFeature] = useState(initialFeature || "Home");
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [pastFeedback, setPastFeedback] = useState<FeedbackEntry[]>(getFeedback);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loadRemote) return;
    let active = true;
    loadRemote().then((items) => {
      if (active) setPastFeedback(items);
    }).catch((loadError: unknown) => {
      console.error("Could not load feedback history.", loadError);
      if (active) setError("Feedback history could not be loaded from your account.");
    });
    return () => { active = false; };
  }, [loadRemote]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!rating) {
      setError("Choose a rating before submitting.");
      return;
    }
    try {
      const saved = await submitFeedback({ feature, rating, tags: selectedTags, comment: comment.trim() }, submitRemote);
      setPastFeedback((items) => [saved, ...items]);
      setSubmitted(true);
      setRating(0);
      setSelectedTags([]);
      setComment("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Feedback could not be saved. Please try again.");
    }
  }

  return (
    <div className="feedback-page">
      <header className="page-title">
        <div>
          <span className="eyebrow">HELP US IMPROVE</span>
          <h1>Feedback</h1>
          <p>Tell us what worked and what got in your way. {signedIn ? "Your feedback is saved to your account." : "Your feedback stays on this device."}</p>
        </div>
      </header>
      {submitted && (
        <div className="feedback-thanks" role="status">
          <span className="feedback-check"><Check size={20} /></span>
          <div><strong>Thanks for helping us make {BRAND.name} better.</strong><p>{signedIn ? "Your note has been saved to your account." : "Your note has been saved on this device."}</p></div>
          <button type="button" className="text-link" onClick={() => setSubmitted(false)}>Add another</button>
        </div>
      )}
      <form className="panel feedback-form" onSubmit={submit}>
        <label className="feedback-feature-label">Which part of QuestShala is this about?
          <select value={feature} onChange={(event) => setFeature(event.target.value)}>
            {selectableFeatures.map((item) => <option value={item.label} key={`${item.to}-${item.label}`}>{item.label}</option>)}
          </select>
        </label>
        <fieldset className="feedback-rating">
          <legend>{junior ? "How did that feel?" : "How would you rate it?"}</legend>
          {junior
            ? <div className="feedback-faces">{[0, 1, 2].map((face) => <button key={face} type="button" aria-label={["Not great yet", "It was okay", "I liked it"][face]} aria-pressed={rating === face + 1} className={rating === face + 1 ? "selected" : ""} onClick={() => setRating(face + 1)}><Face mood={face} selected={rating === face + 1} /><span>{["Not yet", "Okay", "Great"][face]}</span></button>)}</div>
            : <div className="feedback-stars">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} ${value === 1 ? "star" : "stars"}`} aria-pressed={rating === value} onClick={() => setRating(value)}><Star size={25} fill={rating >= value ? "currentColor" : "none"} /></button>)}</div>}
        </fieldset>
        {!junior && <fieldset className="feedback-tags">
          <legend>Choose any that fit</legend>
          <div>{tags.map((tag) => <button key={tag} type="button" aria-pressed={selectedTags.includes(tag)} className={selectedTags.includes(tag) ? "selected" : ""} onClick={() => setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])}>{tag}</button>)}</div>
        </fieldset>}
        {!junior && <label className="feedback-comment">Anything else? <span>Optional</span>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={5} placeholder="Share a detail that would help us understand your experience." />
        </label>}
        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="btn violet" type="submit">Submit feedback</button>
      </form>
      <section className="panel feedback-history">
        <div className="panel-head"><h2>Your past feedback</h2><span className="tag">{pastFeedback.length}</span></div>
        {pastFeedback.length ? <ul>{pastFeedback.map((entry) => <li key={entry.id}><div><strong>{entry.feature}</strong><small>{new Date(entry.createdAt).toLocaleDateString()}</small></div><span className="feedback-history-rating" aria-label={`${entry.rating} out of 5`}>{entry.rating}/5</span>{entry.tags.length > 0 && <p>{entry.tags.join(" · ")}</p>}{entry.comment && <p>{entry.comment}</p>}</li>)}</ul> : <p className="empty-state">Your feedback will appear here after you send it.</p>}
      </section>
    </div>
  );
}
