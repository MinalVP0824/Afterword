import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { api, session } from "../api";

export default function Auth({ onAuthed, onBack }) {
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isSignup = mode === "signup";

  function update(field, value) {
    setForm({ ...form, [field]: value });
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (isSignup && !form.name.trim()) return setError("Please enter your name.");
    if (!form.email.trim()) return setError("Please enter your email.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const res = isSignup
        ? await api.signup({ name: form.name.trim(), email: form.email.trim(), password: form.password })
        : await api.login({ email: form.email.trim(), password: form.password });
      session.setToken(res.token);
      onAuthed(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(isSignup ? "login" : "signup");
    setError("");
  }

  const input =
    "w-full rounded-lg border border-line bg-card px-4 py-3 text-[15px] outline-none transition focus:border-ink/40";

  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex">
        <button onClick={onBack} className="font-display text-4xl tracking-tight italic text-left">
          Afterword
        </button>

        <div>
          <p className="font-display text-5xl leading-[1.1] tracking-tight">
            "Someone should
            <br />
            look into it, <span className="italic text-orange-300">soon."</span>
          </p>
          <p className="mt-6 max-w-sm text-paper/60">
            Afterword asks who, what and by when, so nothing from the meeting gets lost.
          </p>
        </div>

        <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-paper/50 uppercase">
          <span className="h-px w-10 bg-orange-300" />
          Meeting notes that ask back
        </p>
      </div>

      {/* Right: form */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <button
          onClick={onBack}
          className="flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted hover:bg-line/50 hover:text-ink"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <p className="font-display text-3xl italic lg:hidden">Afterword</p>
          <h1 className="mt-6 font-display text-4xl tracking-tight lg:mt-0">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-muted">
            {isSignup ? "Your meetings stay private to your account." : "Log in to see your meetings."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            {isSignup && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Name</span>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className={input}
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={input}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder={isSignup ? "At least 6 characters" : "Your password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className={`${input} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-ink"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {error && (
              <p className="rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-[15px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <>
                  {isSignup ? "Create account" : "Log in"} <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {isSignup ? "Already have an account?" : "New to Afterword?"}{" "}
            <button onClick={switchMode} className="font-medium text-ink underline underline-offset-4 hover:text-accent">
              {isSignup ? "Log in" : "Create an account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}