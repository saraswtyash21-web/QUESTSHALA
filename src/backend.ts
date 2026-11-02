import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Activity, Note, StudentProfile } from "./types";
import type { FeedbackEntry } from "./feedback";
import { defaultCharacterId, getLearningCharacter } from "./characters";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }) : null;

export interface StudentData {
  profile: StudentProfile;
  notes: Note[];
  activities: Activity[];
}

export async function fetchStudentData(userId: string): Promise<Partial<StudentData>> {
  if (!supabase) return {};
  const [profileResult, notesResult, activityResult] = await Promise.all([
    supabase.from("student_profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("student_notes").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("learning_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(500),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (notesResult.error) throw notesResult.error;
  if (activityResult.error) throw activityResult.error;

  const profile = profileResult.data
    ? {
        id: profileResult.data.id,
        name: profileResult.data.display_name,
        grade: profileResult.data.grade,
        board: profileResult.data.board,
        exams: profileResult.data.selected_exams ?? [],
        buddy: profileResult.data.buddy,
        buddyName: profileResult.data.buddy_name,
        selectedCharacterId: getLearningCharacter(profileResult.data.selected_character_id).id,
        voice: profileResult.data.voice ?? "",
        preferredLanguage: profileResult.data.preferred_language ?? "English",
        onboardingComplete: profileResult.data.onboarding_complete ?? false,
        guardianEmail: profileResult.data.guardian_email ?? "",
        guardianConsentAt: profileResult.data.guardian_consent_at ?? undefined,
      } as StudentProfile
    : undefined;

  const notes = await Promise.all((notesResult.data ?? []).map(async (row) => {
    let photo: string | undefined;
    if (row.photo_path) {
      const { data, error } = await supabase.storage.from("note-photos").createSignedUrl(row.photo_path, 3600);
      if (error) throw error;
      photo = data.signedUrl;
    }
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      subject: row.subject,
      topic: row.topic,
      photo,
      photoPath: row.photo_path ?? undefined,
      updatedAt: row.updated_at,
    };
  }));
  return {
    profile,
    notes,
    activities: (activityResult.data ?? []).map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      subject: row.subject,
      topic: row.topic,
      date: row.created_at,
      score: row.score ?? undefined,
      correct: row.correct_count ?? undefined,
      total: row.total_count ?? undefined,
      durationSeconds: row.duration_seconds ?? undefined,
      difficulty: row.difficulty ?? undefined,
    })),
  };
}

export async function saveProfile(profile: StudentProfile): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("student_profiles").upsert({
    id: profile.id,
    display_name: profile.name,
    grade: profile.grade,
    board: profile.board,
    selected_exams: profile.grade >= 9 ? profile.exams : [],
    buddy: profile.buddy,
    buddy_name: profile.buddyName,
    selected_character_id: getLearningCharacter(profile.selectedCharacterId ?? defaultCharacterId).id,
    voice: profile.voice,
    preferred_language: profile.preferredLanguage ?? "English",
    onboarding_complete: true,
    guardian_email: profile.guardianEmail ?? null,
    guardian_consent_at: profile.guardianConsentAt ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function saveNote(userId: string, note: Note): Promise<Note> {
  if (!supabase) return note;
  let photoPath = note.photoPath;
  if (note.photo?.startsWith("data:")) {
    const response = await fetch(note.photo);
    const blob = await response.blob();
    const path = `${userId}/${note.id}`;
    const { error: uploadError } = await supabase.storage
      .from("note-photos")
      .upload(path, blob, { upsert: true, contentType: blob.type });
    if (uploadError) throw uploadError;
    photoPath = path;
  }
  const { data, error } = await supabase.from("student_notes").upsert({
    id: note.id,
    user_id: userId,
    title: note.title,
    body: note.body,
    subject: note.subject,
    topic: note.topic,
    photo_path: photoPath ?? null,
    updated_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  let photo: string | undefined;
  if (data.photo_path) {
    const { data: signed, error: signedError } = await supabase.storage.from("note-photos").createSignedUrl(data.photo_path, 3600);
    if (signedError) throw signedError;
    photo = signed.signedUrl;
  }
  return { ...note, photo, photoPath: data.photo_path ?? undefined, updatedAt: data.updated_at };
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  if (!supabase) return;
  const { data: note, error: selectError } = await supabase.from("student_notes").select("photo_path").eq("user_id", userId).eq("id", noteId).maybeSingle();
  if (selectError) throw selectError;
  if (note?.photo_path) {
    const { error: storageError } = await supabase.storage.from("note-photos").remove([note.photo_path]);
    if (storageError) throw storageError;
  }
  const { error } = await supabase.from("student_notes").delete().eq("user_id", userId).eq("id", noteId);
  if (error) throw error;
}

export async function saveActivity(userId: string, activity: Activity): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("learning_events").insert({
    id: activity.id,
    user_id: userId,
    kind: activity.kind,
    title: activity.title,
    subject: activity.subject,
    topic: activity.topic,
    score: activity.score ?? null,
    correct_count: activity.correct ?? null,
    total_count: activity.total ?? null,
    duration_seconds: activity.durationSeconds ?? null,
    difficulty: activity.difficulty ?? null,
    created_at: activity.date,
  });
  if (error) throw error;
}

export async function saveFeedback(entry: FeedbackEntry): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("student_feedback").insert({
    id: entry.id,
    feature: entry.feature,
    rating: entry.rating,
    tags: entry.tags,
    comment: entry.comment,
    created_at: entry.createdAt,
  });
  if (error) throw error;
}

export async function fetchFeedback(): Promise<FeedbackEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("student_feedback").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    feature: row.feature,
    rating: row.rating,
    tags: row.tags ?? [],
    comment: row.comment ?? "",
    createdAt: row.created_at,
  }));
}
