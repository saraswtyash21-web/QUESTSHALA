import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Award, BookOpen, Box, Check, Eye, Gamepad2, GraduationCap, Signal, Sparkles, Timer } from "lucide-react";
import { defaultCharacterId, getLearningCharacter, learningCharacters } from "./characters";
import { CompanionAvatar } from "./CompanionAvatar";
import type { LearningCharacterId, StudentProfile } from "./types";

export function CharacterSelectionPage({ profile, onChoose }: {
  profile: StudentProfile;
  onChoose: (id: LearningCharacterId) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<LearningCharacterId>(profile.selectedCharacterId ?? defaultCharacterId);
  const [previewId, setPreviewId] = useState<LearningCharacterId | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const previewDialogRef = useRef<HTMLDialogElement>(null);
  const selected = getLearningCharacter(selectedId);
  const preview = previewId ? getLearningCharacter(previewId) : null;

  useEffect(() => {
    const dialog = previewDialogRef.current;
    if (!previewId || !dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [previewId]);

  async function choose() {
    setSaving(true);
    setError("");
    try {
      await onChoose(selectedId);
      setNotice(`${selected.name} is now your learning companion.`);
    } catch (caught) {
      console.error("Could not save the selected learning companion.", caught);
      setError("Your companion couldn't be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="character-selection-page">
      <header className="character-selection-heading">
        <span className="eyebrow"><Sparkles size={14} aria-hidden="true" /> YOUR LEARNING ADVENTURE</span>
        <h1>Choose Your Learning Companion</h1>
        <p>Different characters. Different styles. Same goal — Your Success!</p>
        <span className="character-change-note">You can change your companion later in Profile or Settings.</span>
      </header>
      <section className="character-grid" aria-label="Learning companions">
        {learningCharacters.map((character) => {
          const isSelected = selectedId === character.id;
          return (
            <article key={character.id} className={`character-card ${isSelected ? "selected" : ""}`} style={{ "--character-accent": character.accentColor } as CSSProperties}>
              <div className="character-card-content">
                <span className="character-card-art"><img className="character-card-portrait" src={`/companions/${character.id}.webp`} alt="" />{isSelected && <span className="character-selected-check" aria-label="Selected"><Check size={17} /></span>}</span>
                <span className="character-card-copy"><strong>{character.name}</strong><small>{character.title}</small><span className="character-class-range">{character.classRange}</span><span>{character.description}</span></span>
                {character.id === defaultCharacterId && <span className="character-default-badge">Default companion</span>}
                <span className="character-specialties">{character.specialties.map((specialty) => <span key={specialty}>{specialty}</span>)}</span>
              </div>
              <button className={`character-select-button ${isSelected ? "selected" : ""}`} type="button" aria-pressed={isSelected} aria-label={isSelected ? `${character.name} selected` : `Choose ${character.buttonLabel}`} onClick={() => { setSelectedId(character.id); setNotice(""); }}>
                {isSelected ? <><Check size={15} aria-hidden="true" /> Selected</> : `Choose ${character.buttonLabel}`}
              </button>
              <button className="character-preview-button" type="button" onClick={() => setPreviewId(previewId === character.id ? null : character.id)} aria-expanded={previewId === character.id}>
                <Eye size={15} aria-hidden="true" /> Preview {character.name}
              </button>
            </article>
          );
        })}
      </section>
      {preview && <dialog ref={previewDialogRef} className="character-preview-dialog" aria-labelledby="character-preview-title" onKeyDown={(event) => { if (event.key === "Escape") setPreviewId(null); }} onCancel={(event) => { event.preventDefault(); setPreviewId(null); }} style={{ "--character-accent": preview.accentColor } as CSSProperties}>
        <button className="character-preview-close" type="button" aria-label="Close character preview" onClick={() => setPreviewId(null)}>×</button>
        <CompanionAvatar id={preview.id} />
        <span className="eyebrow">MEET YOUR COMPANION</span><h2 id="character-preview-title">{preview.name} — {preview.title}</h2>
        <p className="character-preview-greeting">“{preview.greeting}”</p>
        <p><strong>Personality:</strong> {preview.personality}</p>
        <p><strong>Teaching style:</strong> {preview.teachingStyle}</p>
        <p><strong>Suitable:</strong> {preview.classRange}</p>
        <div className="character-specialties">{preview.specialties.map((specialty) => <span key={specialty}>{specialty}</span>)}</div>
        <p><strong>Sample explanation:</strong> {preview.sampleExplanation}</p>
        <button className="btn violet" type="button" onClick={() => { setSelectedId(preview.id); setNotice(""); setPreviewId(null); }}>Choose {preview.buttonLabel}</button>
        <small>Character guidance is a selection profile; generative AI is not configured in this project.</small>
      </dialog>}
      {error && <p className="error-message" role="alert">{error}</p>}
      {notice && <p className="character-save-notice" role="status">{notice}</p>}
      <div className="character-continue">
        <button className="btn violet" type="button" disabled={saving} onClick={() => void choose()}>{saving ? "Saving your companion…" : `Continue with ${selected.name} →`}</button>
        <span>{profile.selectedCharacterId ? "Your choice can be changed at any time." : "Choose the companion that feels right for you."}</span>
      </div>
      <section className="character-feature-strip" aria-label="LearnQuest features">
        {[
          { icon: BookOpen, label: "Concept videos", detail: "YouTube search and player" },
          { icon: Box, label: "3D explainers", detail: "Available for selected lessons" },
          { icon: Gamepad2, label: "Game-themed quizzes", detail: "For authored topics" },
          { icon: Timer, label: "Timed practice", detail: "Starter, Standard and Challenge" },
          { icon: Signal, label: "Level-based practice", detail: "Choose a practice level" },
          { icon: GraduationCap, label: "Classes 1–12", detail: "Topic map" },
          { icon: Award, label: "XP and progress", detail: "Learning activity and rewards" },
        ].map(({ icon: Icon, label, detail }) => <div className="character-feature-item" key={label}><Icon size={18} aria-hidden="true" /><span><strong>{label}</strong><small>{detail}</small></span></div>)}
      </section>
    </main>
  );
}

export function CharacterSwitcher({ selectedId, onChoose }: {
  selectedId?: LearningCharacterId;
  onChoose: (id: LearningCharacterId) => Promise<void>;
}) {
  const [selected, setSelected] = useState<LearningCharacterId>(selectedId ?? defaultCharacterId);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => setSelected(selectedId ?? defaultCharacterId), [selectedId]);
  async function save() {
    setSaving(true);
    setNotice("");
    try {
      await onChoose(selected);
      setNotice(`${getLearningCharacter(selected).name} is now your learning companion.`);
    } catch (error) {
      console.error("Could not save the selected learning companion.", error);
      setNotice("Your companion couldn't be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }
  return <section className="character-switcher panel">
    <div className="panel-head"><div><span className="eyebrow">YOUR COMPANION</span><h2>Choose a learning style</h2></div></div>
    <div className="character-switcher-current"><CompanionAvatar id={selected} size="small" /><span><strong>{getLearningCharacter(selected).name}</strong><small>{getLearningCharacter(selected).title}</small></span></div>
    <div className="character-switcher-options" role="group" aria-label="Select a learning companion">
      {learningCharacters.map((character) => <button key={character.id} type="button" className={`character-option ${selected === character.id ? "selected" : ""}`} aria-pressed={selected === character.id} onClick={() => setSelected(character.id)}><CompanionAvatar id={character.id} size="small" /><span>{character.name}</span></button>)}
    </div>
    <button className="btn violet" type="button" disabled={saving || selected === (selectedId ?? defaultCharacterId)} onClick={() => void save()}>{saving ? "Saving…" : `Continue with ${getLearningCharacter(selected).name}`}</button>
    {notice && <p className="micro-copy" role="status">{notice}</p>}
  </section>;
}
