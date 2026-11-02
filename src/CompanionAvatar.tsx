import type { CSSProperties } from "react";
import { getLearningCharacter } from "./characters";
import type { LearningCharacterId } from "./types";

export function CompanionAvatar({ id, size = "large" }: {
  id: LearningCharacterId;
  size?: "large" | "small";
}) {
  const character = getLearningCharacter(id);
  return (
    <span
      className={`character-avatar character-avatar-${size}`}
      style={{ "--character-accent": character.accentColor } as CSSProperties}
      aria-hidden="true"
    >
      <img className="character-avatar-photo" src={`/companions/${character.id}.webp`} alt="" />
    </span>
  );
}
