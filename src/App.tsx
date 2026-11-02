import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Cookie, LogOut, MessageCircle, Moon, PanelLeftClose, PanelLeftOpen, Send,
  Settings, Sun, X,
} from "lucide-react";
import { buddies, boards, curriculum, exams, getTopicsForGrade, topicBank } from "./data";
import { appFeatures } from "./features";
import {
  deleteNote, fetchFeedback, fetchStudentData, saveActivity, saveFeedback, saveNote, saveProfile, supabase,
} from "./backend";
import type { Activity, Board, BuddyId, LearningCharacterId, Note, RewardsState, StudentProfile } from "./types";
import { FeedbackPage } from "./FeedbackPage";
import { BRAND, BRAND_ASSETS } from "./brand";
import { defaultCharacterId, getLearningCharacter } from "./characters";
import { CompanionAvatar } from "./CompanionAvatar";
import { CharacterSelectionPage } from "./CharacterSelection";
import { MathProblemBankPage } from "./MathProblemBankPage";
import { QuestionLibraryPage } from "./QuestionLibraryPage";
import { KingdomMapPage } from "./KingdomPages";
import { AuthPage, ProtectedRoute } from "./AuthPages";
import { ImportedQuestionPractice } from "./ImportedQuestionPractice";
import { StudyScanner } from "./StudyScanner";
import { DailyRewardCard, ProfileRewardsSummary, RewardsMini, RewardsPage, ShopPage } from "./RewardsPage";
import { awardActivity, claimDailyLogin, emptyRewards, getLevelFromXp, purchaseStreakFreeze, spendPoints } from "./rewards/engine";
import { REWARDS_CONFIG, SHOP_COSMETICS, type ShopAvatarId, type ShopCosmeticId, type ShopSkinId } from "./rewards/config";
import {
  BuddyPage, GamesPage, HistoryPage, HomePage, LandingPage, NotesPage, ProfilePage,
  PracticeZone, ProgressPage, SyllabusPage, TopicPage, ExamsPage,
} from "./pages";

interface AppData {
  profile: StudentProfile | null;
  notes: Note[];
  activities: Activity[];
  rewards: typeof emptyRewards;
}

const storageKey = "learnquest-react-demo";
const bandStorageKey = "gyanbuddy-band";
const defaultData: AppData = { profile: null, notes: [], activities: [], rewards: emptyRewards };
const navItems = appFeatures.filter((feature) => !("feedbackOnly" in feature && feature.feedbackOnly));

type ThemePreference = "light" | "dark" | "system";
const themeStorageKey = "gyanbuddy-theme";
const shopSkinStorageKey = "gyanbuddy-shop-skin";
const shopAvatarStorageKey = "gyanbuddy-shop-avatar";

function isAuthPath(pathname: string): boolean {
  return pathname === "/auth" || pathname === "/auth/signin" || pathname === "/auth/signup" || pathname === "/signin" || pathname === "/signup";
}

function authModeForPath(pathname: string): "signin" | "signup" {
  return pathname === "/auth/signup" || pathname === "/signup" ? "signup" : "signin";
}

function normalizeProfile(profile: StudentProfile): StudentProfile {
  return {
    ...profile,
    buddy: profile.buddy === "berrus" ? "beerus" : profile.buddy,
    buddyName: profile.buddyName === "Berrus" ? "Beerus" : profile.buddyName,
  };
}

function readShopPreference<T extends string>(key: string, values: readonly string[], fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return values.includes(stored ?? "") ? stored as T : fallback;
  } catch (error) {
    console.error("Could not read the saved appearance preference.", error);
    return fallback;
  }
}

function getInitialTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(themeStorageKey);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    const savedProfile = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as { profile?: StudentProfile };
    const savedBand = localStorage.getItem(bandStorageKey);
    return (savedProfile.profile?.grade ?? (savedBand === "senior" ? 11 : 4)) >= 9 ? "dark" : "light";
  } catch (error) {
    console.error("Could not read the saved theme preference.", error);
    return "light";
  }
}

function readGuestData(): AppData {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultData;
    const stored = { ...defaultData, ...JSON.parse(raw) as Partial<AppData> };
    return { ...stored, profile: stored.profile ? normalizeProfile(stored.profile) : null };
  } catch (error) {
    console.error("Could not read the local demo profile.", error);
    return defaultData;
  }
}

function readRewards(userId: string, fallback: RewardsState = emptyRewards): RewardsState {
  try {
    const raw = localStorage.getItem(`gyanbuddy-rewards:${userId}`);
    return raw ? JSON.parse(raw) as RewardsState : fallback;
  } catch (error) {
    console.error("Could not read the saved rewards ledger.", error);
    return fallback;
  }
}

function createProfile(input: Omit<StudentProfile, "id">, id: string = crypto.randomUUID()): StudentProfile {
  return {
    ...input,
    id,
    exams: input.grade >= 9 ? input.exams : [],
    selectedCharacterId: input.selectedCharacterId ?? defaultCharacterId,
    preferredLanguage: input.preferredLanguage ?? "English",
    onboardingComplete: input.onboardingComplete ?? true,
  };
}

function App() {
  const [data, setData] = useState<AppData>(() => {
    const guestData = readGuestData();
    return { ...guestData, rewards: readRewards("guest", guestData.rewards) };
  });
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [authMode, setAuthMode] = useState<"signin" | "signup">(() => authModeForPath(window.location.pathname));
  const [authError, setAuthError] = useState("");
  const [notice, setNotice] = useState("");
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(getInitialTheme);
  const [shopSkin, setShopSkin] = useState<ShopSkinId>(() => readShopPreference(shopSkinStorageKey, ["default", "starlight", "woodland", "cosmos"], "default"));
  const [shopAvatar, setShopAvatar] = useState<ShopAvatarId>(() => readShopPreference(shopAvatarStorageKey, ["default", "starlight", "woodland", "comet"], "default"));
  const [testActive, setTestActive] = useState(false);
  const [bandPreviewGrade, setBandPreviewGrade] = useState<number | null>(null);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [showSetup, setShowSetup] = useState(() => isAuthPath(window.location.pathname));
  const recordedActivityIds = useRef(new Set<string>());
  const backgroundBurstTimer = useRef<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthPath(location.pathname)) {
      setShowSetup(true);
      setAuthMode(authModeForPath(location.pathname));
      setAuthError("");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(async ({ data: result, error }) => {
      if (error) throw error;
      if (!active) return;
      const user = result.session?.user;
      setSessionUserId(user?.id ?? null);
      if (user) {
        const remote = await fetchStudentData(user.id);
        if (active) setData({ ...defaultData, ...remote, profile: remote.profile ?? null, rewards: readRewards(user.id) });
      }
      if (active) setLoading(false);
    }).catch((error: unknown) => {
      console.error("Could not load the signed-in student session.", error);
      if (active) {
        setAuthError("We couldn't connect to your account. Check your connection and try again.");
        setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user.id ?? null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // AuthPage performs its own Supabase sign-in; reload the private profile whenever that session changes.
  useEffect(() => {
    if (!supabase || !sessionUserId || data.profile?.id === sessionUserId) return;
    let active = true;
    fetchStudentData(sessionUserId).then((remote) => {
      if (active) setData({ ...defaultData, ...remote, profile: remote.profile ?? null, rewards: readRewards(sessionUserId) });
    }).catch((error: unknown) => {
      console.error("Could not refresh the signed-in student's learning data.", error);
      if (active) setAuthError("Your account is signed in, but the learning profile could not be loaded. Check the Supabase migrations and try again.");
    });
    return () => { active = false; };
  }, [sessionUserId, data.profile?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`gyanbuddy-rewards:${sessionUserId ?? "guest"}`, JSON.stringify(data.rewards));
    } catch (error) {
      console.error("Could not save the reward ledger on this device.", error);
      setNotice("Reward changes were made, but this device could not save them.");
    }
  }, [data.rewards, sessionUserId]);
  useEffect(() => {
    if (!supabase) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.error("Could not save local demo data.", error);
        setNotice("Browser storage is full or unavailable. Your latest changes may not persist.");
      }
    }
  }, [data, sessionUserId]);

  const profile = data.profile;
  const topics = useMemo(() => getTopicsForGrade(profile?.grade ?? 4), [profile?.grade]);
  const selectedGrade = bandPreviewGrade ?? profile?.grade ?? 4;
  const band = selectedGrade <= 5 ? "junior" : selectedGrade <= 8 ? "middle" : "senior";
  useEffect(() => {
    if (location.pathname !== "/profile") setBandPreviewGrade(null);
  }, [location.pathname]);
  const activeTheme = theme === "system" ? systemDark ? "dark" : "light" : theme;
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.band = band;
    root.dataset.theme = activeTheme;
    root.dataset.skin = shopSkin;
    root.dataset.avatar = shopAvatar;
    root.dataset.buddy = profile?.buddy ?? "beerus";
    root.dataset.selectedCharacter = profile?.selectedCharacterId ?? defaultCharacterId;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) themeColor.content = activeTheme === "dark" ? "#102923" : "#E8DFC9";
    try {
      localStorage.setItem(bandStorageKey, band);
    } catch (error) {
      console.error("Could not save the selected learning band.", error);
    }
  }, [activeTheme, band, profile?.buddy, profile?.selectedCharacterId, shopAvatar, shopSkin]);
  useEffect(() => {
    try {
      localStorage.setItem(shopSkinStorageKey, shopSkin);
      localStorage.setItem(shopAvatarStorageKey, shopAvatar);
    } catch (error) {
      console.error("Could not save the selected Shop appearance.", error);
      setNotice("Your appearance is active for this visit, but this device could not save it.");
    }
  }, [shopAvatar, shopSkin]);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    preference.addEventListener("change", updateSystemTheme);
    return () => preference.removeEventListener("change", updateSystemTheme);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(themeStorageKey, theme);
    } catch (error) {
      console.error("Could not save the theme preference.", error);
      setNotice("Theme changed for this visit, but could not be saved in browser storage.");
    }
  }, [theme]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);
  useEffect(() => () => {
    if (backgroundBurstTimer.current !== null) window.clearTimeout(backgroundBurstTimer.current);
  }, []);
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3800);
  };

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    const form = new FormData(event.currentTarget);
    const profileInput = {
      name: String(form.get("name") ?? "").trim(),
      grade: Number(form.get("grade") ?? 4),
      board: String(form.get("board") ?? "CBSE") as Board,
      exams: form.getAll("exams").map(String),
      buddy: String(form.get("buddy") ?? "beerus") as BuddyId,
      buddyName: String(form.get("buddyName") ?? "Beerus").trim(),
      voice: String(form.get("voice") ?? ""),
      guardianEmail: String(form.get("guardianEmail") ?? "").trim(),
      guardianConsentAt: form.get("guardianConsent") === "on" ? new Date().toISOString() : undefined,
    };
    if (profileInput.grade <= 12 && (!profileInput.guardianEmail || !profileInput.guardianConsentAt)) {
      setAuthError("A parent or guardian email and consent are required for a student profile.");
      return;
    }
    if (supabase && sessionUserId) {
      if (profileInput.grade <= 12 && (!profileInput.guardianEmail || !profileInput.guardianConsentAt)) {
        setAuthError("A parent or guardian email and consent are required for a student profile.");
        return;
      }
      const next = createProfile(profileInput, sessionUserId);
      try {
        await saveProfile(next);
        setData((current) => ({ ...current, profile: next }));
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Could not save the student profile.", error);
        setAuthError("Profile setup could not be saved. Please try again.");
      }
      return;
    }
    if (supabase) {
      const { data: result, error } = await supabase.auth.signUp({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      if (error) {
        console.error("Sign-up request could not be completed.", error);
        setAuthError("If this address can receive a confirmation, check your email for next steps.");
        return;
      }
      if (!result.session || !result.user) {
        setAuthError("If this address can receive a confirmation, check your email for next steps.");
        setAuthMode("signin");
        navigate("/auth/signin");
        return;
      }
      const next = createProfile(profileInput, result.user.id);
      try {
        await saveProfile(next);
        setSessionUserId(result.user.id);
        setData({ ...defaultData, profile: next });
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Could not save the new student profile.", error);
        setAuthError("Your account was created, but profile setup could not be saved. Please try again.");
      }
      return;
    }
    setData((current) => ({ ...current, profile: createProfile(profileInput) }));
    navigate("/", { replace: true });
  }

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setAuthError("");
    const form = new FormData(event.currentTarget);
    const { data: result, error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (error) {
    console.error("Sign-in request could not be completed.", error);
    setAuthError("We couldn't verify those details. Check your email and password, then try again.");
      return;
    }
    if (!result.user) {
      setAuthError("We couldn't identify this account. Please try again.");
      return;
    }
    try {
      const remote = await fetchStudentData(result.user.id);
      setSessionUserId(result.user.id);
      setData({ ...defaultData, ...remote, profile: remote.profile ?? null, rewards: readRewards(result.user.id) });
      if (!remote.profile) {
        setAuthError("");
        setAuthMode("signup");
        navigate("/auth/signup");
      } else navigate("/", { replace: true });
    } catch (error) {
      console.error("Could not load your saved learning data.", error);
      setAuthError("Signed in, but your learning data couldn't be loaded. Please retry.");
    }
  }

  async function updateProfile(nextProfile: StudentProfile) {
    setData((current) => ({ ...current, profile: nextProfile }));
    try {
      if (sessionUserId) await saveProfile(nextProfile);
      showNotice("Profile and learning preferences saved.");
    } catch (error) {
      console.error("Could not save the student profile.", error);
      showNotice("Profile couldn't be saved to the server. Please try again.");
    }
  }

  async function changeCharacter(characterId: LearningCharacterId) {
    if (!profile) throw new Error("A student profile is required to change companions.");
    const previous = profile;
    const next = { ...profile, selectedCharacterId: characterId, onboardingComplete: true };
    setData((current) => ({ ...current, profile: next }));
    try {
      if (sessionUserId) await saveProfile(next);
      showNotice(`${getLearningCharacter(characterId).name} is now your learning companion.`);
    } catch (error) {
      setData((current) => ({ ...current, profile: previous }));
      throw error;
    }
  }

  async function chooseCharacterAndReturn(characterId: LearningCharacterId) {
    await changeCharacter(characterId);
    navigate("/", { replace: true });
  }

  function saveProfileAndReturnHome(nextProfile: StudentProfile) {
    // Optimistic local update first; navigate immediately so a slow network request never freezes the profile screen.
    void updateProfile(nextProfile);
    setMenuOpen(false);
    navigate("/", { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function recordActivity(activity: Activity) {
    if (recordedActivityIds.current.has(activity.id) || data.activities.some((item) => item.id === activity.id)) return;
    recordedActivityIds.current.add(activity.id);
    const previousXp = data.rewards.ledger.filter((entry) => entry.type === "xp").reduce((sum, entry) => sum + entry.amount, 0);
    const updatedRewards = awardActivity(data.rewards, data.activities, activity, data.profile?.id ?? "guest");
    const nextXp = updatedRewards.ledger.filter((entry) => entry.type === "xp").reduce((sum, entry) => sum + entry.amount, 0);
    const previousLevel = getLevelFromXp(previousXp);
    const nextLevel = getLevelFromXp(nextXp);
    if (nextLevel > previousLevel) setLevelUp(nextLevel);
    setData((current) => ({
      ...current,
      activities: [activity, ...current.activities],
      rewards: awardActivity(current.rewards, current.activities, activity, current.profile?.id ?? "guest"),
    }));
    try {
      if (sessionUserId) await saveActivity(sessionUserId, activity);
    } catch (error) {
      console.error("Could not save the learning activity.", error);
      showNotice("Activity was recorded in this session but could not be synced.");
    }
  }

  function claimLoginReward() {
    if (!sessionUserId) {
      showNotice("Sign in to claim a daily login reward. Guest demo activity stays on this device.");
      return;
    }
    const rewards = claimDailyLogin(data.rewards, sessionUserId);
    if (!rewards) {
      showNotice("Today's reward has already been claimed.");
      return;
    }
    setData((current) => ({ ...current, rewards }));
    showNotice("Today's Points reward has been added.");
  }

  function buyStreakFreeze() {
    if (!profile) return;
    const rewards = purchaseStreakFreeze(data.rewards, profile.id);
    if (!rewards) {
      showNotice("You need more Points to buy a streak freeze.");
      return;
    }
    setData((current) => ({ ...current, rewards }));
    showNotice("Streak freeze added to your inventory.");
  }

  function purchaseCosmetic(itemId: ShopCosmeticId) {
    const item = SHOP_COSMETICS.find((cosmetic) => cosmetic.id === itemId);
    if (!item) {
      showNotice("That appearance item is not available.");
      return;
    }
    if (data.rewards.ledger.some((entry) => entry.idempotencyKey === `shop-cosmetic:${item.id}`)) {
      showNotice("You already own this appearance item.");
      return;
    }
    const rewards = spendPoints(data.rewards, item.cost, `${item.name} purchased`, item.id, `shop-cosmetic:${item.id}`);
    if (!rewards) {
      showNotice("You need more Points for this appearance item.");
      return;
    }
    setData((current) => ({ ...current, rewards }));
    if ("skin" in item) setShopSkin(item.skin);
    if ("avatar" in item) setShopAvatar(item.avatar);
    showNotice(`${item.name} unlocked and equipped. This appearance is saved on this device.`);
  }

  async function upsertNote(note: Note, strict = false): Promise<void> {
    if (!profile) {
      if (strict) throw new Error("A student profile is required to save a note.");
      return;
    }
    try {
      const saved = sessionUserId ? await saveNote(profile.id, note) : { ...note, updatedAt: new Date().toISOString() };
      setData((current) => ({
        ...current,
        notes: [saved, ...current.notes.filter((item) => item.id !== saved.id)],
      }));
      showNotice("Note saved.");
    } catch (error) {
      console.error("Could not save the note.", error);
      showNotice("The note couldn't be saved. Check your connection and try again.");
      if (strict) throw error;
    }
  }

  async function removeNote(noteId: string) {
    if (!profile) return;
    try {
      if (sessionUserId) await deleteNote(profile.id, noteId);
      setData((current) => ({ ...current, notes: current.notes.filter((item) => item.id !== noteId) }));
      showNotice("Note deleted.");
    } catch (error) {
      console.error("Could not delete the note.", error);
      showNotice("The note couldn't be deleted. Please try again.");
    }
  }

  async function signOut() {
    if (supabase && sessionUserId) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Could not sign out.", error);
        showNotice("Sign out failed. Please try again.");
        return;
      }
      setSessionUserId(null);
      setData(defaultData);
      localStorage.removeItem(storageKey);
    } else {
      setData((current) => ({ ...current, profile: null }));
      showNotice("You left guest mode. Your learning history remains saved on this device.");
    }
    setShowSetup(false);
    setMenuOpen(false);
    navigate("/auth/signin");
  }

  function pageLink(path: string) {
    setMenuOpen(false);
    navigate(path);
  }

  function reactToBackground(event: React.MouseEvent<HTMLDivElement>) {
    const effects = document.querySelector<HTMLElement>(".world-effects");
    if (!effects || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = effects.getBoundingClientRect();
    effects.style.setProperty("--burst-x", `${event.clientX - bounds.left}px`);
    effects.style.setProperty("--burst-y", `${event.clientY - bounds.top}px`);
    effects.classList.remove("tap-burst");
    void effects.offsetWidth;
    effects.classList.add("tap-burst");
    if (backgroundBurstTimer.current !== null) window.clearTimeout(backgroundBurstTimer.current);
    backgroundBurstTimer.current = window.setTimeout(() => {
      effects.classList.remove("tap-burst");
      backgroundBurstTimer.current = null;
    }, 700);
  }

  if (loading) return <div className="loading-screen" role="status">Loading your learning space…</div>;
  const authRoute = ({
    "/login": "login", "/signup": "signup", "/forgot-password": "forgot-password",
    "/reset-password": "reset-password", "/auth/callback": "callback",
  } as const)[location.pathname as "/login" | "/signup" | "/forgot-password" | "/reset-password" | "/auth/callback"];
  if (authRoute) {
    if (sessionUserId && (authRoute === "login" || authRoute === "signup")) return <Navigate to={profile ? "/dashboard" : "/auth/signup"} replace />;
    return <AuthPage page={authRoute} />;
  }
  const publicPaths = new Set(["/", "/terms", "/privacy", "/feedback", "/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback"]);
  const legacyAuthPath = isAuthPath(location.pathname) || location.pathname === "/signin" || location.pathname === "/signup";
  const privatePath = !publicPaths.has(location.pathname) && !legacyAuthPath;
  if (supabase && !sessionUserId && privatePath) return <ProtectedRoute authenticated={false}><></></ProtectedRoute>;
  if (location.pathname === "/terms" || location.pathname === "/privacy") {
    return <LegalPage privacy={location.pathname === "/privacy"} onBack={() => navigate(-1)} />;
  }
  if (!profile && location.pathname === "/feedback") {
    return <main className="public-feedback-shell"><Link className="brand" to="/"><span className="brand-mark">Q</span><span>{BRAND.name}</span></Link><FeedbackPage initialFeature={searchParams.get("feature") ?? "Login / Sign up"} junior={false} signedIn={false} /></main>;
  }
  if (!profile && !showSetup) {
    return (
      <>
        <LandingPage
          onStart={() => {
            setAuthError("");
            navigate("/signup");
          }}
          onSignIn={() => {
            setAuthError("");
            navigate("/login");
          }}
        />
        <BuddyDock profile={null} pathname={location.pathname} topics={topicBank} />
      </>
    );
  }
  if (!profile && showSetup) {
    return (
      <>
        <SetupScreen
          hasSupabase={Boolean(supabase)}
          needsProfile={Boolean(supabase && sessionUserId)}
          mode={authMode}
          error={authError}
          onSubmit={authMode === "signin" && supabase && !sessionUserId ? signIn : createAccount}
          onModeChange={(mode) => { setAuthError(""); setAuthMode(mode); navigate(mode === "signup" ? "/auth/signup" : "/auth/signin"); }}
          onBack={() => { setShowSetup(false); navigate("/"); }}
        />
        <BuddyDock profile={null} pathname={location.pathname} topics={topicBank} />
      </>
    );
  }
  if (!profile) return null;

  const currentBuddy = buddies.find((buddy) => buddy.id === profile.buddy) ?? buddies[0];
  const lessonTopics = topics.length ? topics : topicBank.filter((topic) => topic.grades.includes(profile.grade));
  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {menuOpen && <button className="menu-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside id="main-navigation" className={`sidebar ${menuOpen ? "open" : ""}`}>
        <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark brand-mark-image" aria-hidden="true"><img src={BRAND_ASSETS.floralMark} alt="" /></span><span>{BRAND.name}<small>A REALITY LAB</small></span>
        </Link>
        <button className="profile-mini" onClick={() => pageLink("/profile")}>
          <span className="avatar buddy-avatar"><CompanionAvatar id={profile.selectedCharacterId ?? defaultCharacterId} size="small" /></span>
          <span><strong>{profile.name}</strong><small>Class {profile.grade} · {profile.board}</small></span>
          <Settings size={16} aria-hidden="true" />
        </button>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink key={to} to={to} end={"end" in rest ? rest.end : false} title={label} aria-label={label} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} onClick={() => {
              setMenuOpen(false);
              if (!window.matchMedia("(max-width: 760px)").matches) setSidebarCollapsed(true);
            }}>
              <Icon size={18} aria-hidden="true" /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="safety-note"><span className="safety-shield" aria-hidden="true">✓</span><span><strong>Safe learning space</strong><small>{sessionUserId ? "Synced securely" : "Saved locally"}</small></span></div>
          <button className="nav-item" onClick={() => void signOut()} title={sessionUserId ? "Sign out of your account" : "Leave this guest profile"}><LogOut size={18} /><span>Sign out</span></button>
        </div>
      </aside>
      <main className="main-area">
        <div className={`world-effects world-effects-${profile.grade <= 5 ? "junior" : profile.grade <= 8 ? "middle" : "senior"}`} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <header className="topbar">
          <button className="icon-btn menu-toggle" aria-label="Toggle navigation menu" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => {
            if (window.matchMedia("(max-width: 760px)").matches) setMenuOpen((open) => !open);
            else setSidebarCollapsed((collapsed) => !collapsed);
          }}>{sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</button>
          <div className="crumb"><span>CLASS {profile.grade}</span><span className="crumb-dot">/</span><span>{location.pathname.slice(1).replaceAll("-", " ").toUpperCase() || "HOME"}</span></div>
          <div className="top-actions">
            <Link to="/points" className="rewards-mini-link"><RewardsMini rewards={data.rewards} activities={data.activities} /></Link>
            <span className="mode-pill"><span className="mode-dot" />{sessionUserId ? "Synced account" : "Local demo"}</span>
            <button className="icon-btn theme-toggle" onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")} aria-label={`Switch to ${activeTheme === "dark" ? "light" : "dark"} theme`} title="Toggle light and dark theme">{activeTheme === "dark" ? <Sun /> : <Moon />}</button>
            <button className="avatar top-avatar buddy-avatar" onClick={() => pageLink("/profile")} aria-label="Open profile"><CompanionAvatar id={profile.selectedCharacterId ?? defaultCharacterId} size="small" /></button>
          </div>
        </header>
        <div className="page-wrap">
          <div key={`${location.pathname}${location.search}`} className={`route-transition route-${band}`} onClick={reactToBackground} onPointerMove={(event) => {
            if (band !== "junior" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12;
            const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 12;
            document.documentElement.style.setProperty("--pointer-shift-x", `${x.toFixed(1)}px`);
            document.documentElement.style.setProperty("--pointer-shift-y", `${y.toFixed(1)}px`);
          }} onPointerLeave={() => {
            document.documentElement.style.setProperty("--pointer-shift-x", "0px");
            document.documentElement.style.setProperty("--pointer-shift-y", "0px");
          }}>
          <Routes>
            <Route path="/" element={<><DailyRewardCard sessionUserId={sessionUserId} rewards={data.rewards} onClaim={claimLoginReward} /><ProfileRewardsSummary profile={profile} rewards={data.rewards} activities={data.activities} /><HomePage profile={profile} activities={data.activities} topics={lessonTopics} /></>} />
            <Route path="/dashboard" element={<><DailyRewardCard sessionUserId={sessionUserId} rewards={data.rewards} onClaim={claimLoginReward} /><ProfileRewardsSummary profile={profile} rewards={data.rewards} activities={data.activities} /><HomePage profile={profile} activities={data.activities} topics={lessonTopics} /></>} />
            <Route path="/kingdom" element={<KingdomMapPage profile={profile} activities={data.activities} topics={lessonTopics} />} />
            <Route path="/syllabus" element={<SyllabusPage profile={profile} topics={lessonTopics} curriculum={curriculum} onBoard={(board) => updateProfile({ ...profile, board })} onTopic={(id) => navigate(`/topic/${id}`)} onCurriculumTopic={(subject, title) => navigate(`/topic/unavailable?subject=${encodeURIComponent(subject)}&title=${encodeURIComponent(title)}`)} />} />
            <Route path="/topic/:topicId" element={<TopicPage profile={profile} recordActivity={recordActivity} topics={lessonTopics} />} />
            <Route path="/lessons" element={<SyllabusPage profile={profile} topics={lessonTopics} curriculum={curriculum} onBoard={(board) => updateProfile({ ...profile, board })} onTopic={(id) => navigate(`/topic/${id}`)} onCurriculumTopic={(subject, title) => navigate(`/topic/unavailable?subject=${encodeURIComponent(subject)}&title=${encodeURIComponent(title)}`)} lessonsOnly />} />
            <Route path="/practice" element={<PracticeZone profile={profile} topics={lessonTopics} recordActivity={recordActivity} onTestActive={setTestActive} />} />
            <Route path="/practice/imported" element={<ImportedQuestionPractice initialGrade={profile.grade} onRecordActivity={recordActivity} onTestActive={setTestActive} />} />
            <Route path="/problem-bank" element={<MathProblemBankPage initialGrade={profile.grade} />} />
            <Route path="/question-library" element={<QuestionLibraryPage initialGrade={profile.grade} />} />
            <Route path="/scan" element={<StudyScanner onSave={(note) => upsertNote(note, true)} />} />
            <Route path="/companions" element={<CharacterSelectionPage profile={profile} onChoose={changeCharacter} />} />
            <Route path="/choose-companion" element={<CharacterSelectionPage profile={profile} onChoose={chooseCharacterAndReturn} />} />
            <Route path="/games" element={<GamesPage profile={profile} topics={lessonTopics} recordActivity={recordActivity} />} />
            <Route path="/buddy" element={<BuddyPage profile={profile} buddy={currentBuddy} topics={lessonTopics} characterId={profile.selectedCharacterId ?? defaultCharacterId} />} />
            <Route path="/notes" element={<NotesPage notes={data.notes} activities={data.activities} onSave={upsertNote} onDelete={removeNote} topics={topicBank} />} />
            <Route path="/progress" element={<ProgressPage profile={profile} activities={data.activities} rewards={data.rewards} />} />
            <Route path="/history" element={<HistoryPage activities={data.activities} />} />
            <Route path="/exams" element={<ExamsPage profile={profile} onSave={updateProfile} />} />
            <Route path="/profile" element={<><ProfileRewardsSummary profile={profile} rewards={data.rewards} activities={data.activities} /><ProfilePage profile={profile} onSave={saveProfileAndReturnHome} theme={theme} onThemeChange={setTheme} onGradeChange={setBandPreviewGrade} /></>} />
            <Route path="/points" element={<RewardsPage rewards={data.rewards} activities={data.activities} />} />
            <Route path="/shop" element={<ShopPage rewards={data.rewards} profile={profile} onBuyFreeze={buyStreakFreeze} skin={shopSkin} avatar={shopAvatar} onPurchase={purchaseCosmetic} onEquipSkin={setShopSkin} onEquipAvatar={setShopAvatar} onSelectBuddy={(buddy) => {
              const previousNameWasDefault = buddies.some((item) => item.label === profile.buddyName) || profile.buddyName === "Berrus";
              void updateProfile({ ...profile, buddy, buddyName: previousNameWasDefault ? buddies.find((item) => item.id === buddy)?.label ?? BRAND.mascot : profile.buddyName });
            }} />} />
            <Route path="/feedback" element={<FeedbackPage initialFeature={searchParams.get("feature") ?? ""} junior={profile.grade <= 5} signedIn={Boolean(sessionUserId)} submitRemote={sessionUserId ? saveFeedback : undefined} loadRemote={sessionUserId ? fetchFeedback : undefined} />} />
            <Route path="*" element={<HomePage profile={profile} activities={data.activities} topics={lessonTopics} />} />
          </Routes>
          {location.pathname !== "/feedback" && <Link className="page-feedback-link" to={`/feedback?feature=${encodeURIComponent(appFeatures.find((feature) => feature.to === location.pathname && !("feedbackOnly" in feature && feature.feedbackOnly))?.label ?? (location.pathname.startsWith("/topic/") ? "Lessons" : "Home"))}`}>
            <MessageCircle size={16} aria-hidden="true" /> Give feedback about this page
          </Link>}
          </div>
        </div>
        <footer className="footer"><span>{BRAND.name}</span><span>{BRAND.tagline}</span><span>{sessionUserId ? "Private account data" : "Local demo data on this device"}</span></footer>
      </main>
      {!testActive && <BuddyDock profile={profile} pathname={location.pathname} topics={lessonTopics} />}
      {notice && <div className="toast" role="status">{notice}</div>}
      {levelUp !== null && <div className="level-up-toast" role="status"><strong>Level {levelUp} reached</strong><p>{REWARDS_CONFIG.level.unlocks.find((unlock) => unlock.level === levelUp)?.title ?? "Your learning progress keeps growing."}</p><button className="text-link" type="button" onClick={() => setLevelUp(null)}>Continue learning</button></div>}
    </div>
  );
}

function SetupScreen(props: {
  hasSupabase: boolean;
  needsProfile: boolean;
  mode: "signin" | "signup";
  error: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onModeChange: (mode: "signin" | "signup") => void;
  onBack: () => void;
}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => typeof window === "undefined" || !("speechSynthesis" in window) ? [] : window.speechSynthesis.getVoices());
  const [grade, setGrade] = useState(4);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const updateVoices = () => setVoices(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    updateVoices();
    return () => window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
  }, []);
  const signingIn = props.mode === "signin" && props.hasSupabase && !props.needsProfile;
  return (
    <div className="setup-shell">
      <section className="setup-card">
        <button className="setup-back" type="button" onClick={props.onBack}>← Back to QuestShala</button>
        <div className="brand"><span className="brand-mark" aria-hidden="true">Q</span><span>{BRAND.name}</span></div>
        <span className="eyebrow">{props.hasSupabase ? "YOUR LEARNING ADVENTURE" : "LOCAL DEMO MODE"}</span>
        <h1>{signingIn ? "Welcome back, explorer." : props.needsProfile ? "Finish your profile." : "Create your learning space."}</h1>
        <p>{props.hasSupabase ? "Sign in securely or create your account to save your progress." : "Set up a profile to explore the working demo. Demo data stays in this browser and is not an account."}</p>
        <form className="setup-form" onSubmit={props.onSubmit}>
          {(!signingIn && props.hasSupabase) && <label>Display name<input name="name" required maxLength={40} autoComplete="name" /></label>}
          {props.hasSupabase && !props.needsProfile && <>
            <label>Email<input name="email" type="email" required autoComplete="email" /></label>
            <label>Password<input name="password" type="password" required minLength={8} autoComplete={signingIn ? "current-password" : "new-password"} /></label>
          </>}
          {!signingIn && <>
            {!props.hasSupabase && <label>Display name<input name="name" required maxLength={40} defaultValue="Student" /></label>}
            <label>Class<select name="grade" value={grade} onChange={(event) => setGrade(Number(event.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Class {i + 1}</option>)}</select></label>
            <label>School board<select name="board">{boards.map((board) => <option key={board.id} value={board.id}>{board.id}</option>)}</select></label>
            {grade >= 9 && <fieldset><legend>Competitive exams (optional)</legend>{exams.map((exam) => <label className="check-option" key={exam}><input type="checkbox" name="exams" value={exam} />{exam}</label>)}</fieldset>}
            <label>Learning buddy<select name="buddy">{buddies.map((buddy) => <option key={buddy.id} value={buddy.id}>{buddy.label}</option>)}</select></label>
            <label>Buddy name<input name="buddyName" defaultValue="Beerus" maxLength={30} /></label>
            <section className="guardian-consent">
              <span className="eyebrow">PARENT OR GUARDIAN</span>
              <p>For students in Classes 1–12, we ask for a parent or guardian email and consent. We collect only what is needed to set up this learning profile. Our team should review this flow against the Digital Personal Data Protection Act, 2023 before launch.</p>
              <label>Parent / guardian email<input name="guardianEmail" type="email" autoComplete="email" required /></label>
              <label className="check-option"><input name="guardianConsent" type="checkbox" required />My parent or guardian has agreed to this learning profile and its privacy notice.</label>
            </section>
            <label>Speech voice<select name="voice"><option value="">System default</option>{voices.slice(0, 6).map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>)}</select><small>Available voices depend on your browser and device.</small></label>
          </>}
          {props.error && <p className="error-message" role="alert">{props.error}</p>}
          <button className="btn violet full" type="submit">{signingIn ? "Sign in" : props.needsProfile ? "Save profile" : props.hasSupabase ? "Create account" : "Continue as guest (demo, data stays on this device)"} →</button>
        </form>
        {props.hasSupabase && !props.needsProfile && <button className="text-link" onClick={() => props.onModeChange(signingIn ? "signup" : "signin")}>{signingIn ? "New here? Create an account" : "Already have an account? Sign in"}</button>}
        {!props.hasSupabase && <div className="backend-setup-note"><strong>Backend is not configured.</strong><p>To enable accounts and cloud sync, set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env.local</code>, apply the SQL migrations in <code>supabase/migrations</code>, then restart the Vite dev server.</p><p>Until then, this is a demo profile only. Your data stays in this browser.</p></div>}
        <nav className="legal-links" aria-label="Legal"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/feedback?feature=Login%20%2F%20Sign%20up">Give feedback</Link></nav>
      </section>
    </div>
  );
}

function LegalPage({ privacy, onBack }: { privacy: boolean; onBack: () => void }) {
  return <main className="legal-page">
    <button className="text-link" type="button" onClick={onBack}>← Back</button>
    <span className="eyebrow">{BRAND.name}</span>
    <h1>{privacy ? "Privacy notice" : "Terms of use"}</h1>
    {privacy ? <>
      <p>This prototype stores demo profiles, learning activity, reward history, and feedback in your browser. If a Supabase backend is configured, account data is sent to that project and protected by its row-level security policies.</p>
      <p>Students in Classes 1–12 must provide a parent or guardian email and record consent before setting up a profile. This prototype does not send consent emails and should not be treated as a legally reviewed consent workflow.</p>
      <p>Before public launch, the team must review data retention, guardian consent, age-appropriate notices, deletion requests, and compliance with the Digital Personal Data Protection Act, 2023.</p>
    </> : <>
      <p>This is a learning prototype. Lesson, quiz, and exam content may be incomplete; verify important curriculum and exam information with your school or official exam authority.</p>
      <p>Use the demo only with permission from a parent or guardian. Do not add sensitive personal information to notes, chat, or feedback.</p>
      <p>Access may be changed or paused while the prototype is being tested. These plain-language terms are not a substitute for legal review.</p>
    </>}
    <Link className="btn outline" to="/">Return to {BRAND.name}</Link>
  </main>;
}

function BuddyDock({ profile, pathname, topics }: {
  profile: StudentProfile | null;
  pathname: string;
  topics: typeof topicBank;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ by: "student" | "buddy"; text: string }[]>([]);
  const [mood, setMood] = useState<"awake" | "sleeping" | "snacking">("awake");
  const search = new URLSearchParams(location.search);
  const topicId = pathname.match(/^\/topic\/([^/]+)/)?.[1] ?? search.get("topic");
  const topicTitle = search.get("title");
  const topic = topics.find((item) => item.id === topicId || item.title === topicTitle) ?? topics[0];
  const buddy = buddies.find((item) => item.id === profile?.buddy) ?? buddies[0];

  useEffect(() => {
    if (buddy.id !== "beerus") return undefined;
    if (mood === "snacking") {
      const snackTimer = window.setTimeout(() => setMood("awake"), 1500);
      return () => window.clearTimeout(snackTimer);
    }
    if (open) return undefined;
    const timer = window.setTimeout(() => setMood((current) => current === "sleeping" ? "awake" : "sleeping"), mood === "sleeping" ? 6000 : 16000);
    return () => window.clearTimeout(timer);
  }, [buddy.id, mood, open]);

  function feedBeerus() {
    setMood("snacking");
  }

  function answer(text: string) {
    const query = text.toLowerCase();
    const matchingQuestion = topic?.questions.find((item) =>
      item.prompt.toLowerCase().split(/\W+/).filter((word) => word.length > 4)
        .some((word) => query.includes(word)),
    );
    if (matchingQuestion) {
      const explanation = `The answer is ${matchingQuestion.choices[matchingQuestion.answer]}. ${matchingQuestion.explanation}`;
      return buddy.id === "beerus" ? `Good question. Let's take it one step at a time: ${explanation}` : explanation;
    }
    if (/answer|correct|solution/.test(query) && topic?.questions[0]) {
      return `Let's work through the current topic. ${topic.questions[0].prompt} The answer is ${topic.questions[0].choices[topic.questions[0].answer]}. ${topic.questions[0].explanation}`;
    }
    if (/hint|help|explain|how|why|what/.test(query) && topic) {
      return buddy.id === "beerus"
        ? `Let's explore ${topic.title} together. ${topic.intro} Start with this step: ${topic.steps[0]}`
        : `${topic.title}: ${topic.intro} A good first step is: ${topic.steps[0]}`;
    }
    if (pathname.startsWith("/notes")) return "Open Notes to find lesson summaries, edit a summary into your own note, or write a new note and attach a photo.";
    if (pathname.startsWith("/games")) return "Pick a topic and game mode. The quiz checks topic facts, the card game practises recall, and the ordering challenge checks the lesson steps.";
    if (pathname.startsWith("/exams")) return profile && profile.grade < 9
      ? "Competitive exam choices become available from Class 9. School board choices can be changed here or in your profile."
      : "Exam selections are separate from school topics. Exam-specific question banks and diagnostic tests are not available in this build.";
    return `${buddy.id === "beerus" ? "I'm Beerus, your learning companion." : `I'm ${profile?.buddyName ?? "your QuestShala buddy"}.`} ${topic ? `We can explore ${topic.title}: ${topic.intro}` : "Choose a lesson and I can help explain it."} I'm a guided demo helper, not a connected AI service.`;
  }

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;
    setMood("awake");
    setMessages((items) => [...items, { by: "student", text }, { by: "buddy", text: answer(text) }]);
    setQuestion("");
  }

  return (
    <div className="buddy-dock">
      {open && <section className="buddy-window" aria-label="QuestShala chat">
        <header className="buddy-window-head"><span className="buddy-orb"><CompanionAvatar id={profile?.selectedCharacterId ?? defaultCharacterId} size="small" /></span><div><strong>{profile?.buddyName ?? getLearningCharacter(profile?.selectedCharacterId).name}</strong><small>{getLearningCharacter(profile?.selectedCharacterId).title} · learning helper</small></div><button aria-label="Close buddy chat" onClick={() => setOpen(false)}><X size={18} /></button></header>
        <div className="buddy-thread" aria-live="polite">
          {!messages.length && <div className="buddy-chat-intro"><strong>{buddy.id === "beerus" ? buddy.greeting : "Hi! What are you learning?"}</strong><p>{topic ? `We're ready to explore ${topic.title}.` : "Ask about lessons, notes, games, or your learning path."}</p><small>Answers use the app's lesson content, not an external AI model.</small></div>}
          {messages.map((message, index) => <p className={`chat-bubble ${message.by}`} key={`${index}-${message.text}`}>{message.text}</p>)}
        </div>
        <form className="chat-form" onSubmit={send}><input aria-label="Message your buddy" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question…" /><button className="btn violet" aria-label="Send message"><Send size={16} /></button></form>
      </section>}
      <button className={`buddy-launcher ${open ? "active" : ""}`} onClick={() => { setMood("awake"); setOpen((value) => !value); }} aria-label={open ? "Close buddy" : "Open learning buddy"} aria-expanded={open}>
        <span className={`buddy-launcher-face buddy-mood-${mood}`} aria-label={getLearningCharacter(profile?.selectedCharacterId).name}><CompanionAvatar id={profile?.selectedCharacterId ?? defaultCharacterId} size="small" /></span><span className="buddy-launcher-label">{open ? "Close" : "Ask buddy"}</span><MessageCircle className="buddy-launcher-icon" size={17} />
      </button>
      {buddy.id === "beerus" && !open && <button className="buddy-snack" type="button" onClick={feedBeerus} aria-label="Give Beerus a snack" title="Give Beerus a snack"><Cookie size={16} /><span>{mood === "snacking" ? "Yum!" : "Snack"}</span></button>}
    </div>
  );
}

export default App;
