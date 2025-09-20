"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const cognitoHref = `/api/auth/cognito/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      setError(json.error || "Failed");
    } else {
      window.location.href = "/profile";
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="page-title">Log in</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="input-soft w-full" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input-soft w-full" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="px-3 py-2 btn-gradient w-full" type="submit">Log in</button>
      </form>
      <div className="pt-2">
        <a className="px-3 py-2 btn-gradient w-full inline-flex justify-center" href={cognitoHref}>Continue with Cognito</a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto p-6">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}

