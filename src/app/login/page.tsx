"use client";
import { useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email, password } : { email, password, name };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || "Failed");
      } else {
        const url = new URL(window.location.href);
        const returnTo = url.searchParams.get("returnTo") || "/dashboard";
        window.location.href = returnTo;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 bg-gradient-to-b from-[var(--card)] to-transparent">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-center">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-xs md:text-sm text-center text-[var(--muted-foreground)]">
              {mode === "login" ? "Sign in to access your dashboard" : "Start creating with us in seconds"}
            </p>
          </div>
          <div className="p-6 md:p-8 pt-0">
            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <label className="block text-sm">
                  <span className="sr-only">Name</span>
                  <input
                    className="input-soft w-full px-3 py-2"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
              )}
              <label className="block text-sm">
                <span className="sr-only">Email</span>
                <input
                  className="input-soft w-full px-3 py-2"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="sr-only">Password</span>
                <input
                  className="input-soft w-full px-3 py-2"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {error && <div className="text-xs md:text-sm text-red-600">{error}</div>}
              <button className="px-4 py-2.5 btn-gradient w-full text-sm md:text-base" type="submit" disabled={loading}>
                {loading ? (mode === "login" ? "Signing in..." : "Creating account...") : (mode === "login" ? "Sign in" : "Create account")}
              </button>
            </form>
            <div className="my-5 flex items-center gap-3 text-[var(--muted-foreground)]">
              <div className="h-px bg-[var(--border)] flex-1" />
              <span className="text-[10px] md:text-xs uppercase tracking-wide">or</span>
              <div className="h-px bg-[var(--border)] flex-1" />
            </div>
            <button
              onClick={() => (window.location.href = "/api/auth/google")}
              className="w-full px-4 py-2.5 border rounded-md hover:bg-[var(--accent)] transition text-sm md:text-base"
            >
              Continue with Google
            </button>
            <button
              onClick={() => (window.location.href = "/api/auth/cognito?action=login&returnTo=/dashboard")}
              className="mt-3 w-full px-4 py-2.5 border rounded-md hover:bg-[var(--accent)] transition text-sm md:text-base"
            >
              Continue with Cognito
            </button>
            <div className="mt-6 text-center text-xs md:text-sm">
              {mode === "login" ? (
                <span>
                  Don't have an account?{" "}
                  <button className="underline underline-offset-4 hover:opacity-80" onClick={() => setMode("register")}>Create one</button>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <button className="underline underline-offset-4 hover:opacity-80" onClick={() => setMode("login")}>Sign in</button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

