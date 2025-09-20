"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
    </div>
  );
}

