import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock } from "lucide-react";
import { useAuth, authErrorMessage } from "../hooks/useAuth";
import Logo from "./ui/Logo";

export default function Auth() {
  const { loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword } =
    useAuth();
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "signin") await loginWithEmail(email, password);
      else await signUpWithEmail(email, password);
      // On success, onAuthStateChanged swaps this screen out.
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Enter your email above first, then tap “Forgot password”.");
      return;
    }
    try {
      await resetPassword(email);
      setNotice("Password reset email sent — check your inbox.");
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-surface border border-border rounded-3xl p-7 text-center"
      >
        <Logo size={56} className="mb-5 rounded-2xl inline-block" />
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-1">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {mode === "signin"
            ? "Sign in to your chord charts and setlists."
            : "Start organizing and practicing your songs."}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3 text-left">
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground-2" />
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full bg-background border border-border-chrome rounded-xl py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground-2 focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground-2" />
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-background border border-border-chrome rounded-xl py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground-2 focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium leading-relaxed">
              {error}
            </p>
          )}
          {notice && (
            <p className="text-xs text-secondary font-medium leading-relaxed">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover active:scale-[0.99] transition-all disabled:opacity-60"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {mode === "signin" && (
          <button
            onClick={forgot}
            className="mt-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot password?
          </button>
        )}

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-border flex-1" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground-2">
            or
          </span>
          <div className="h-px bg-border flex-1" />
        </div>

        <button
          onClick={google}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 active:scale-[0.99] transition-all disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-sm text-muted-foreground">
          {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setNotice("");
            }}
            className="font-bold text-primary hover:underline"
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
