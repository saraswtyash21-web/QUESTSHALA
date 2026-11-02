export interface FeedbackEntry {
  id: string;
  feature: string;
  rating: number;
  tags: string[];
  comment: string;
  createdAt: string;
}

const feedbackStorageKey = "gyanbuddy-feedback";

export function getFeedback(): FeedbackEntry[] {
  try {
    const stored = localStorage.getItem(feedbackStorageKey);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error("Stored feedback has an invalid format.");
    return parsed as FeedbackEntry[];
  } catch (error) {
    console.error("Could not read saved feedback.", error);
    return [];
  }
}

export async function submitFeedback(
  entry: Omit<FeedbackEntry, "id" | "createdAt">,
  saveRemote?: (feedback: FeedbackEntry) => Promise<void>,
): Promise<FeedbackEntry> {
  const saved: FeedbackEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  if (saveRemote) {
    await saveRemote(saved);
    return saved;
  }
  const existing = getFeedback();
  try {
    localStorage.setItem(feedbackStorageKey, JSON.stringify([saved, ...existing]));
  } catch (error) {
    console.error("Could not save feedback locally.", error);
    throw new Error("Your feedback could not be saved in this browser. Check available storage and try again.");
  }
  return saved;
}
