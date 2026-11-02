export type Board =
  | "CBSE"
  | "CISCE (ICSE / ISC)"
  | "Haryana Board (HBSE)"
  | "NIOS"
  | "Other State Board";

export type BuddyId = "beerus" | "berrus" | "panda" | "fox" | "robot" | "owl" | "dino" | "cat";
export type LearningCharacterId =
  | "berrus" | "wizzy" | "professor-nova" | "shadow" | "ember" | "astra"
  | "zen" | "luna" | "kai" | "sora" | "rex" | "miko";

export interface StudentProfile {
  id: string;
  name: string;
  grade: number;
  board: Board;
  exams: string[];
  buddy: BuddyId;
  buddyName: string;
  voice: string;
  preferredLanguage?: string;
  onboardingComplete?: boolean;
  selectedCharacterId?: LearningCharacterId;
  guardianEmail?: string;
  guardianConsentAt?: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  subject: string;
  topic: string;
  photo?: string;
  photoPath?: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  kind: "quiz" | "lesson" | "game";
  title: string;
  subject: string;
  topic: string;
  date: string;
  score?: number;
  correct?: number;
  total?: number;
  durationSeconds?: number;
  difficulty?: "Starter" | "Standard" | "Challenge";
}

export interface RewardLedgerEntry {
  id: string;
  type: "xp" | "points" | "freeze";
  amount: number;
  reason: string;
  sourceId: string;
  timestamp: string;
  idempotencyKey: string;
}

export interface RewardsState {
  ledger: RewardLedgerEntry[];
  bestRank: string;
}
