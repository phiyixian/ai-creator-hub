"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      setError(json.error || "Failed");
    } else {
      setOk(true);
      window.location.href = "/profile";
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="input-soft w-full" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input-soft w-full" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input-soft w-full" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="px-3 py-2 btn-gradient w-full" type="submit">Sign up</button>
      </form>
      {ok && <div className="text-sm text-green-600">Account created.</div>}
    </div>
  );
}

