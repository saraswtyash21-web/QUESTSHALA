import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "./backend";
import { boards } from "./data";
import { BRAND, BRAND_ASSETS } from "./brand";

type AuthPageName = "login" | "signup" | "forgot-password" | "reset-password" | "callback";

function safeDestination(value: unknown): string {
  if (typeof value !== "string") return "/dashboard";
  const candidate = value.trim();
  const blockedPrefixes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/onboarding",
    "/choose-companion",
    "/auth/",
  ];
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\") || blockedPrefixes.some((prefix) => candidate === prefix || candidate.startsWith(`${prefix}`))) {
    return "/dashboard";
  }
  return candidate;
}

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-screen visible">
      <section className="auth-art" aria-label="Learning world illustration">
        <div className="auth-orbit" aria-hidden="true" />
        <div className="auth-orbit orbit-b" aria-hidden="true" />
        <div className="auth-planet" aria-hidden="true">📚</div>
        <span className="auth-star star-a" aria-hidden="true">✦</span>
        <span className="auth-star star-b" aria-hidden="true">✧</span>
        <div className="auth-art-caption"><img className="auth-stacked-logo" src={BRAND_ASSETS.stackedLogo} alt={`${BRAND.name} — A Reality Lab`} /></div>
      </section>
      <section className="auth-panel">
        <Link className="auth-brand brand-logo-plaque" to="/">
          <img className="brand-wordmark" src={BRAND_ASSETS.wordmark} alt={`${BRAND.name} — A Reality Lab`} />
        </Link>
        {children}
      </section>
    </main>
  );
}

function SetupMessage() {
  return <p className="auth-message" role="status">Account sign-in is unavailable until a Supabase project is configured. Add the values from <code>.env.example</code> to <code>.env.local</code>, then restart the app.</p>;
}

function AuthError({ children }: { children: ReactNode }) {
  return <p className="auth-error" role="alert">{children}</p>;
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const next = safeDestination((location.state as { from?: unknown } | null)?.from);
  const notice = (location.state as { notice?: string } | null)?.notice;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
      });
      if (signInError) {
        setError(signInError.message.toLowerCase().includes("confirm")
          ? "Please verify your email address using the link we sent before signing in."
          : "We couldn't verify those details. Check your email and password, then try again.");
        return;
      }
      navigate(next, { replace: true });
    } catch (caught) {
      console.error("Sign-in request could not be completed.", caught);
      setError("We couldn't connect to your account. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (oauthError) {
        console.error("Google OAuth could not be started.", oauthError);
        setError(oauthError.message.toLowerCase().includes("provider") || oauthError.message.toLowerCase().includes("unsupported")
          ? "Google sign-in isn't configured for this Supabase project yet. Ask the project administrator to enable the Google provider."
          : "Google sign-in couldn't be started. Please try again.");
      }
    } catch (caught) {
      console.error("Google OAuth could not be started.", caught);
      setError("Google sign-in couldn't be started. Check the provider configuration and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <span className="eyebrow">YOUR LEARNING SPACE</span>
      <h1>Welcome back, explorer.</h1>
      <p>Sign in to continue learning where you left off.</p>
      {notice && <p className="auth-message" role="status">{notice}</p>}
      {!supabase && <SetupMessage />}
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <label className="auth-field">Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label className="auth-field">Password<input name="password" type="password" autoComplete="current-password" required /></label>
        <div className="auth-inline"><span>Your session is securely restored on this browser.</span><Link to="/forgot-password">Forgot password?</Link></div>
        {error && <AuthError>{error}</AuthError>}
        <button className="btn violet auth-submit" type="submit" disabled={!supabase || busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <button className="btn outline auth-google" type="button" disabled={!supabase || busy} onClick={() => void signInWithGoogle()}><span aria-hidden="true">G</span> Continue with Google</button>
      <p className="auth-switch">New to {BRAND.name}? <Link to="/signup">Create an account</Link></p>
      {!supabase && <p className="auth-switch">Just exploring? <Link to="/auth/signup">Continue as a guest demo</Link></p>}
    </AuthLayout>
  );
}

function SignupPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirmPassword") ?? "")) {
      setError("Your passwords don't match.");
      return;
    }
    const name = String(form.get("fullName") ?? "").trim();
    if (name.length < 2) {
      setError("Enter a name with at least 2 characters.");
      return;
    }
    setBusy(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: String(form.get("email") ?? "").trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fonboarding`,
          data: {
            full_name: name,
            class_level: form.get("grade") ? Number(form.get("grade")) : null,
            board: form.get("board") || null,
            preferred_language: String(form.get("language") || "English"),
            guardian_consent: form.get("guardianConsent") === "on",
          },
        },
      });
      if (signUpError) {
        console.error("Sign-up request could not be completed.", signUpError);
        setError(signUpError.message.toLowerCase().includes("password")
          ? "Choose a stronger password that meets the project's password requirements."
          : "We couldn't create your account. Check your details and try again.");
        return;
      }
      if (data.session) {
        navigate("/choose-companion", { replace: true });
      } else {
        setNotice("If this address can receive a confirmation, check your email for next steps. You can sign in after verifying your address.");
      }
    } catch (caught) {
      console.error("Sign-up request could not be completed.", caught);
      setError("We couldn't connect to create your account. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=%2Fonboarding` },
      });
      if (oauthError) {
        console.error("Google OAuth could not be started.", oauthError);
        setError(oauthError.message.toLowerCase().includes("provider") || oauthError.message.toLowerCase().includes("unsupported")
          ? "Google sign-in isn't configured for this Supabase project yet. Ask the project administrator to enable the Google provider."
          : "Google sign-in couldn't be started. Please try again.");
      }
    } catch (caught) {
      console.error("Google OAuth could not be started.", caught);
      setError("Google sign-in couldn't be started. Check the provider configuration and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <span className="eyebrow">START YOUR LEARNING ADVENTURE</span>
      <h1>Create your account.</h1>
      <p>Set up a private learning space. Class and board are optional and can be changed later.</p>
      {!supabase && <SetupMessage />}
      <form className="auth-form auth-signup-form" onSubmit={(event) => void submit(event)}>
        <label className="auth-field">Full name<input name="fullName" autoComplete="name" required minLength={2} maxLength={40} /></label>
        <label className="auth-field">Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label className="auth-field">Password<input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} aria-describedby="password-help" /><small id="password-help">Use at least 8 characters.</small></label>
        <label className="auth-field">Confirm password<input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} /></label>
        <label className="auth-check"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />Show passwords</label>
        <label className="auth-field">Class (optional)<select name="grade" defaultValue=""><option value="">Choose later</option>{Array.from({ length: 12 }, (_, index) => <option value={index + 1} key={index + 1}>Class {index + 1}</option>)}</select></label>
        <label className="auth-field">Board (optional)<select name="board" defaultValue=""><option value="">Choose later</option>{boards.map((board) => <option value={board.id} key={board.id}>{board.id}</option>)}</select></label>
        <label className="auth-field">Preferred language<select name="language" defaultValue="English"><option>English</option><option>Hindi</option></select></label>
        <label className="auth-check"><input name="guardianConsent" type="checkbox" required />I have permission from a parent or guardian to create this student learning profile.</label>
        <p className="auth-legal">By continuing, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Notice</Link>. We collect only the profile information needed to personalize learning.</p>
        {error && <AuthError>{error}</AuthError>}
        {notice && <p className="auth-message" role="status">{notice}</p>}
        <button className="btn violet auth-submit" type="submit" disabled={!supabase || busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <button className="btn outline auth-google" type="button" disabled={!supabase || busy} onClick={() => void signInWithGoogle()}><span aria-hidden="true">G</span> Continue with Google</button>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      {!supabase && <p className="auth-switch">Just exploring? <Link to="/auth/signup">Continue as a guest demo</Link></p>}
    </AuthLayout>
  );
}

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(String(form.get("email") ?? "").trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        console.error("Password recovery request could not be completed.", resetError);
        setError("We couldn't submit the recovery request right now. Please try again shortly.");
        return;
      }
      setSent(true);
    } catch (caught) {
      console.error("Password recovery request could not be completed.", caught);
      setError("We couldn't submit the recovery request right now. Please try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return <AuthLayout><span className="eyebrow">ACCOUNT RECOVERY</span><h1>Forgot your password?</h1><p>Enter the email address you used to create your account.</p>{!supabase && <SetupMessage />}{sent ? <p className="auth-message" role="status">If an account exists for that address, a password reset link is on its way. Check your inbox and spam folder.</p> : <form className="auth-form" onSubmit={(event) => void submit(event)}><label className="auth-field">Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>{error && <AuthError>{error}</AuthError>}<button className="btn violet auth-submit" type="submit" disabled={!supabase || busy}>{busy ? "Sending…" : "Send reset link"}</button></form>}<p className="auth-switch"><Link to="/login">Return to sign in</Link></p></AuthLayout>;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        console.error("Could not validate the password recovery session.", sessionError);
        setError("This reset link couldn't be validated. Request a new reset link and try again.");
      } else if (data.session) {
        setReady(true);
      } else {
        setError("This reset link is missing or has expired. Request a new reset link to continue.");
      }
    }).catch((caught: unknown) => {
      console.error("Could not validate the password recovery session.", caught);
      if (active) setError("This reset link couldn't be validated. Request a new reset link and try again.");
    });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirmPassword") ?? "")) {
      setError("Your passwords don't match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        console.error("Password update could not be completed.", updateError);
        setError("We couldn't update your password. Choose a stronger password or request a new reset link.");
        return;
      }
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) console.error("Could not clear the session after password reset.", signOutError);
      navigate("/login", { replace: true, state: { notice: "Your password was changed. Sign in with your new password." } });
    } catch (caught) {
      console.error("Password update could not be completed.", caught);
      setError("We couldn't update your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <AuthLayout><span className="eyebrow">ACCOUNT RECOVERY</span><h1>Choose a new password.</h1><p>Use at least 8 characters that you haven't used here before.</p>{!supabase && <SetupMessage />}{ready && <form className="auth-form" onSubmit={(event) => void submit(event)}><label className="auth-field">New password<input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} /></label><label className="auth-field">Confirm new password<input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} /></label><label className="auth-check"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />Show passwords</label>{error && <AuthError>{error}</AuthError>}<button className="btn violet auth-submit" type="submit" disabled={busy}>{busy ? "Saving…" : "Save new password"}</button></form>}{!ready && error && <AuthError>{error}</AuthError>}<p className="auth-switch"><Link to="/forgot-password">Request another reset link</Link></p></AuthLayout>;
}

function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setError("Account sign-in is unavailable until Supabase is configured.");
      return;
    }
    const client = supabase;
    let active = true;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const providerError = searchParams.get("error_description") ?? params.get("error_description") ?? searchParams.get("error");
    if (providerError) {
      setError(providerError.toLowerCase().includes("access_denied")
        ? "Sign-in was cancelled. You can try again whenever you're ready."
        : "We couldn't complete sign-in. Please try again or contact the project administrator.");
      return;
    }
    client.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        console.error("Authentication callback could not be validated.", sessionError);
        setError("We couldn't validate this sign-in link. Please try signing in again.");
      } else if (data.session) {
        const { data: profile, error: profileError } = await client
          .from("student_profiles")
          .select("onboarding_complete")
          .eq("id", data.session.user.id)
          .maybeSingle();
        if (profileError) {
          console.error("Could not check student onboarding status.", profileError);
          setError("Sign-in succeeded, but your profile could not be loaded. Please try again.");
        } else {
          const requestedDestination = safeDestination(searchParams.get("next"));
          navigate(!profile?.onboarding_complete ? "/choose-companion" : requestedDestination === "/onboarding" || requestedDestination === "/choose-companion" ? "/dashboard" : requestedDestination, { replace: true });
        }
      } else {
        setError("This sign-in link is invalid or has expired. Return to sign in and try again.");
      }
    }).catch((caught: unknown) => {
      console.error("Authentication callback could not be validated.", caught);
      if (active) setError("We couldn't validate this sign-in link. Please try signing in again.");
    });
    return () => { active = false; };
  }, [navigate, searchParams]);

  return <AuthLayout><span className="eyebrow">SECURE SIGN-IN</span><h1>Finishing sign-in…</h1>{error ? <><AuthError>{error}</AuthError><p className="auth-switch"><Link to="/login">Return to sign in</Link></p></> : <p role="status">Please wait while we verify your account.</p>}</AuthLayout>;
}

export function ProtectedRoute({ authenticated, children }: { authenticated: boolean; children: ReactNode }) {
  const location = useLocation();
  if (!authenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from: safeDestination(from) }} />;
  }
  return <>{children}</>;
}

export function AuthPage({ page }: { page: AuthPageName }) {
  switch (page) {
    case "login": return <LoginPage />;
    case "signup": return <SignupPage />;
    case "forgot-password": return <ForgotPasswordPage />;
    case "reset-password": return <ResetPasswordPage />;
    case "callback": return <AuthCallbackPage />;
  }
}
