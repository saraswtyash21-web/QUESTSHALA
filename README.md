# QuestShala — A Reality Lab

QuestShala is a React, TypeScript, Vite learning application that combines the V2.1 learning workflow with a magical study world and selectable learning companions. The original syllabus map is preserved for Classes 1–12; the lesson and assessment library is intentionally limited to topics with authored content.

## Run locally

1. Install Node.js 20.19+ or 22.12+.
2. Run `npm install`.
3. Run `npm run dev` and open the local URL printed by Vite.
4. Run `npm run build` for a production build.

Without Supabase environment variables, the app opens in **local demo mode**. Profile preferences, notes, and recorded activities are saved to this browser only. This is not an account or secure cloud storage; do not enter sensitive personal information. Login, signup, OAuth, and password recovery require a configured Supabase project.

## Supabase setup

1. Create a Supabase project and open **Project Settings → API**.
2. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` to the project URL and `VITE_SUPABASE_ANON_KEY` to its publishable/anon key. These are the only Supabase values used by the browser. Never expose a service-role key.
3. Apply `supabase/migrations/001_learnquest.sql`, `002_profile_consent_feedback.sql`, `003_auth_profiles.sql`, `004_learning_characters.sql`, and `005_expand_learning_characters.sql` in order (for example, in the Supabase SQL Editor). The migrations create private student tables, their ownership-based RLS policies, a database trigger that creates a profile row for every new Auth user, and the constrained `selected_character_id` profile field. Existing profiles without a selection are assigned `berrus`.
4. In **Authentication → URL Configuration**, set the Site URL to your production app origin and add the exact development and production redirect URLs:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173/reset-password`
   - `https://YOUR_PRODUCTION_HOST/auth/callback`
   - `https://YOUR_PRODUCTION_HOST/reset-password`
   Replace the production host with the deployed app's real HTTPS origin. Also add any alternate development port or preview deployment origin you actually use. The app supplies these callback paths to Supabase; the Supabase allow-list must match.
5. In **Authentication → Providers → Email**, enable email/password sign-in and email confirmations. Configure SMTP for production delivery, review the confirmation email template, and make its confirmation redirect resolve to the app callback route. The password recovery email must redirect to `/reset-password`. Keep password policy and rate limits enabled.
6. To enable Google, create an OAuth 2.0 Web application in Google Cloud. Add the Supabase project's callback URL shown on **Authentication → Providers → Google** (usually `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`) as an authorized redirect URI in Google Cloud. Add the OAuth client ID and client secret only to the Supabase Google provider settings; do not put the client secret in `.env`, source code, or browser settings. Enable Google in Supabase and add each app origin/callback to Supabase's redirect allow-list. Google sign-in will report a setup error until the provider is enabled.
7. Restart Vite after changing `.env.local`, then run `npm run dev`. Session persistence and refresh use the single configured Supabase client.

The app's `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`, and `/choose-companion` routes use Supabase Auth and first-sign-in onboarding. Private learning routes redirect unauthenticated visitors to login and preserve only safe, same-origin destinations. Student profiles are created by the database trigger and are readable/updatable only by their owner under RLS. No admin UI or client-asserted administrator role is provided. If administrator features are added, authorize them through a trusted server-side mechanism, not profile metadata.

Auth configuration checks:

- If login/signup is unavailable, confirm both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set and restart Vite.
- If Google reports an incomplete setup, enable Google in Supabase and verify the Google Cloud callback URL and Supabase redirect allow-list.
- If confirmation or recovery links fail, verify the Site URL, allowed redirect list, email template redirect, SMTP delivery, and that the deployed host serves the Vite SPA fallback for both callback routes.
- If a new account has no learning profile, verify migration `003_auth_profiles.sql` and the `create_student_profile_after_signup` trigger are installed.
- If companion selection is not saved, verify migrations `004_learning_characters.sql` and `005_expand_learning_characters.sql` are installed and the authenticated student's profile RLS policy allows their own profile updates.
- If Zen, Luna, Kai, Sora, Rex, or Miko is rejected, apply migration `005_expand_learning_characters.sql` after `004_learning_characters.sql`.
- Authentication provider setup and actual email delivery must be verified in the target Supabase/Google projects; a successful frontend build does not verify them.

The anon key is intended for browser use and is not a service-role secret. Never put a Supabase service-role key or AI provider key in frontend variables. This app does not currently call an AI model.

## Implemented in this build

- React UI, TypeScript checks, Vite build, React Router, Tailwind CSS, Lucide icons, responsive collapsible menu.
- Animated public welcome page before the first profile is created, with a walkthrough, responsive layout, floating study buddy, and reduced-motion support.
- Board selection and saved profile preferences; competitive exam choices are hidden below Class 9.
- Existing Classes 1–12 syllabus topic-cluster map.
- Four authored topic lessons: plant growth, paint colour mixing, and number patterns each have 10 questions; Simple Harmonic Motion has a focused question set and a 3D physics simulation.
- The SHM simulation uses React Three Fiber and Three.js to compare a spring-mass system with a simple pendulum. Learners can adjust amplitude, mass, spring constant, pendulum length, gravity, and animation speed; it shows live displacement, period, and frequency, and supports reduced-motion and 2D views.
- The seven mixed-revision questions included in the latest project notes are available as a clearly labelled, non-official practice topic for Classes 9–12.
- Notes with create/edit/delete/search, class-topic association, and image attachments. Supabase mode stores image objects in a private bucket and serves signed URLs.
- Lesson summaries appear in Notes after completing a supported lesson; students can edit and save a summary as their own note.
- Activity history and basic progress calculated from recorded events.
- Topic game studio for authored topics: a five-round quiz, memory cards, and an interactive step-order puzzle.
- A floating contextual buddy on the landing, setup, and student pages, customizable buddy character/name, and best-effort browser speech.
- Twelve selectable learning companion profiles (Berrus, Wizzy, Professor Nova, Shadow, Ember, Astra, Zen, Luna, Kai, Sora, Rex, Miko) with portrait artwork, previews, class suitability, persistent Supabase selection, first-sign-in selection, profile switching and character-aware assistant display.
- Imported Mathematics worked-problem bank for Classes 8–12, with searchable difficulty/topic filters and step-by-step source solutions.
- Camera study scanner with rear-camera capture, mobile image upload, image compression, optional browser text recognition, manual note editing and save-to-Notes flow. Automatic OCR depends on browser support; the image-save workflow does not.
- Uploaded question library with 222,880 question/answer/context rows for Classes 6–12, stored in compressed, lazily loaded batches. Practice Zone links to an eight-minute randomized self-check test, and completed results can be added to learning history.
- Official curriculum/exam reference links shared in the project are listed separately for verification.

## Incomplete / not production-ready

- The topic-cluster map is not an official board-specific syllabus. Changing a board saves the preference but does not yet load a verified, board-specific curriculum.
- The imported archive contained JSON files (not CSVs) for Mathematics only: 536 unique problems were imported after removing 24 exact duplicate entries. The two Class 10 files for Constructions and Areas Related to Circles list metadata but contain no problem rows. Imported problem statements and solutions are shown as supplied and have not been independently reviewed; this is not a complete multi-subject or official board question bank.
- The later `archive (1).zip` upload contains `ncert_test.csv` with 222,880 question/answer/context rows for Classes 6–12; it has no subject column and has no rows for Classes 1–5. The Question Library preserves the uploaded rows in compressed 5,000-question batches, and its search operates within the currently selected batch. Subject filters are best-effort keyword inferences because the source has no subject metadata; ambiguous items are kept under “Other / Unclassified”. Questions, answers and context are presented as uploaded, without independent correctness or curriculum-coverage verification.
- Only the three lesson topics with 10 authored questions have complete practice sets; Simple Harmonic Motion has a shorter introductory question set and no per-topic game yet. The mixed-revision topic contains seven supplied questions and is not an official exam bank. Other curriculum topics remain visible but show an explicit content-pending message.
- Competitive exam selections are saved, but diagnostic tests, mock-test banks, score analysis, and evidence-based weak-topic recommendations are not implemented.
- Progress does not yet include token spending, quests, streak awards, mastery, goals, or achievements. Token earnings are derived from correct practice answers only.
- Activity history records lesson, quiz, and game events, but does not yet retain individual answer reviews, question-level mistakes, animation history, or test attempts.
- Games now include quizzes, memory cards, and step ordering for authored topics. Drag-and-drop, broad subject-specific games, and interactive concept animations for every curriculum topic are not implemented yet.
- The buddy answers from the included topic text/question bank and provides contextual navigation help; it is not a generative AI model and cannot answer arbitrary questions reliably. Companion portraits, greetings and teaching profiles are included, but no live AI provider is connected. Speech availability depends on the browser and operating system.
- Companion descriptions, greetings and teaching prompts are configuration for a future AI integration. No AI backend exists in this project, so the current guided lesson helper does not send character prompts to a model or generate AI responses.
- The public page uses animated CSS/emoji illustrations; it is not a custom-rendered 3D animation.
- Production persistence requires a configured Supabase project and applied migration. No Supabase credentials were supplied, so cloud authentication and storage could not be exercised here.
- Child privacy, parental consent, and production deployment policies still require product/legal review.

## QuestShala V2.1 update (27 October 2026)

This update adds:

- A shared Fantasy Kingdom RPG presentation across all classes, centrally configured by class tier (Classes 1–5 high, 6–8 medium, 9–12 low-to-medium motion), with system reduced-motion support and a persistent Focus Mode.
- A game dashboard and interactive Kingdom Map connected to existing curriculum, lessons, notes, practice, history, XP, streak, rank, points and shop routes. Progress is based on recorded student activity; map locations remain open because progression locks are not implemented.
- Original CSS castle/map scenery. No third-party animation assets are included; see [docs/ASSET_LICENSES.md](./docs/ASSET_LICENSES.md).
- The existing app brand tagline and Berrus Buddy identity requested in the redesign brief.
- An all-screen hamburger navigation drawer that closes after selecting a destination.
- Optimistic profile updates: the app returns to Home immediately while remote profile sync continues in the background.
- A learning homepage with an interactive product-tour panel and connected learning workflow cards using original styling and copy.
- A topic workspace with Video, Notes, Quiz, Timed Test, Revision Cards, and optional 3D explanation tabs.
- YouTube search links for class/subject/topic/subtopic, an in-page YouTube player for pasted links, and a featured Physics Wallah rotational-motion lesson for Class 11.
- A timed test centre with Starter / Standard / Challenge levels, timer, full-screen request, score summary, missed-question explanations and a local buddy-generated review plan. Timer expiry submits using the latest saved answers.
- Expandable competitive-exam topic maps based on the supplied `LearnQuest_AI_Complete_Syllabus_Compendium_2026-27.pdf` and links to official exam sources.
- Lightweight buddy idle/jump/sleep animations and responsive styling.

### Run locally

```bash
npm install
npm run dev
```

### Important content and integration notes

- `src/curriculum.json` is a grade-wise topic-cluster map. The supplied compendium itself warns that it is not a verbatim reproduction of every chapter and that exact chapter lists vary by board and academic year. Verify official board/exam PDFs before publishing lessons or mock tests.
- The current authored topic bank is smaller than the curriculum map. Unauthored syllabus entries open a topic workspace, but do not fabricate verified notes or answer keys.
- Timed tests currently use the reviewed questions available for supported topics. Difficulty levels currently vary timing and framing; distinct difficulty-calibrated question banks should be authored before claiming exam-grade adaptive difficulty.
- Test analysis is generated locally from answers and explanations. A live LLM-powered AI Buddy requires a configured AI backend/API; this update does not claim a live model connection.
- YouTube playback uses YouTube's embedded player and user-selected public video URLs. LearnQuest AI does not download, re-upload or claim ownership of third-party videos. Availability and embedding permissions are controlled by the video publisher.
- Profile saves are optimistic in the UI. For signed-in accounts, the app still reports any server-sync problem through its existing toast notification.
