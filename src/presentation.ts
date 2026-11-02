export type ClassTier = "young" | "adventure" | "focus";

export interface ClassPresentation {
  tier: ClassTier;
  animationIntensity: "high" | "medium" | "low-medium";
  label: string;
  prefersShortActivities: boolean;
}

export function getClassPresentation(grade: number): ClassPresentation {
  if (grade <= 5) {
    return {
      tier: "young",
      animationIntensity: "high",
      label: "Playful explorer",
      prefersShortActivities: true,
    };
  }
  if (grade <= 8) {
    return {
      tier: "adventure",
      animationIntensity: "medium",
      label: "Kingdom adventurer",
      prefersShortActivities: false,
    };
  }
  return {
    tier: "focus",
    animationIntensity: "low-medium",
    label: "Focused scholar",
    prefersShortActivities: false,
  };
}
