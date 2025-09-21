"use client";
import { useEffect, useState } from "react";

type User = {
  userId: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  provider?: "cognito";
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // profile fields (bound to inputs)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");        // read-only (from user)
  const [picture, setPicture] = useState<string>("");

  // local-only for now (not yet persisted in API)
  const [bio, setBio] = useState("");
  const [persona, setPersona] = useState("videographer");

  const [status, setStatus] = useState("");

  async function loadProfile() {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/profile/credentials", { cache: "no-store" });
      if (res.status === 401) {
        setAuthError("You’re not signed in.");
        setLoading(false);
        return;
      }
      const data: { user: User } = await res.json();

      setName(data.user.name ?? "");
      setEmail(data.user.email ?? "");
      setPicture(data.user.picture ?? "");
      // bio/persona are local UI fields for now
    } catch {
      setAuthError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setStatus("Saving…");
    try {
      const res = await fetch("/api/profile/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // API currently supports name and picture updates
        body: JSON.stringify({
          name: name || null,
          picture: picture || null,
        }),
      });

      if (res.ok) {
        setStatus("Saved");
        // reload to reflect updated timestamps, etc.
        loadProfile();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatus(err?.error ? `Failed: ${err.error}` : "Failed");
      }
    } catch {
      setStatus("Failed");
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border p-6">
        <div className="animate-pulse text-sm text-[var(--muted-foreground)]">Loading profile…</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="rounded-xl border p-6 space-y-3">
        <div className="text-sm text-[var(--muted-foreground)]">{authError}</div>
        <a href="/api/auth/cognito/login" className="px-4 py-2 btn-gradient inline-block">
          Sign in with Cognito
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Creator profile card */}
      <div className="rounded-xl border overflow-hidden">
        <div className="p-4 border-b font-medium text-base md:text-lg flex items-center gap-3">
          {picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={picture} alt="avatar" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--muted)]" />
          )}
          Creator profile
        </div>

        <div className="p-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full input-soft px-3 py-2"
            />
          </label>

          <label className="text-sm">
            Email
            <input
              value={email}
              readOnly
              className="mt-1 w-full input-soft px-3 py-2 opacity-80 cursor-not-allowed"
            />
          </label>

          <label className="text-sm sm:col-span-2">
            Picture URL
            <input
              value={picture}
              onChange={(e) => setPicture(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full input-soft px-3 py-2"
            />
          </label>

          {/* Local-only fields (not yet persisted) */}
          <label className="text-sm sm:col-span-2">
            Bio (local)
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full min-h-24 input-soft px-3 py-2"
            />
          </label>

          <label className="text-sm">
            Persona (local)
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="mt-1 w-full input-soft px-3 py-2"
            >
              <option value="videographer">Videographer</option>
              <option value="photographer">Photographer</option>
              <option value="educator">Educator</option>
              <option value="streamer">Streamer</option>
              <option value="musician">Musician</option>
            </select>
          </label>

          <div className="sm:col-span-2">
            <button onClick={saveProfile} className="px-4 py-2 btn-gradient">
              Save profile
            </button>
            {!!status && (
              <span className="ml-3 text-xs text-[var(--muted-foreground)]">{status}</span>
            )}
          </div>
        </div>
      </div>

      {/* Social platform connections (UI only for now) */}
      <div className="rounded-xl border overflow-hidden">
        <div className="p-4 border-b font-medium text-base md:text-lg">Social platform connections</div>
        <div className="p-4 grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="font-medium">LinkedIn</div>
            <button
              onClick={() => window.open("/api/oauth/linkedin", "_blank", "width=500,height=650")}
              className="px-3 py-2 btn-gradient text-sm"
            >
              Link LinkedIn
            </button>
            <div className="text-[var(--muted-foreground)] text-xs">Used for posting to LinkedIn.</div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">X (Twitter)</div>
            <button
              onClick={() => window.open("/api/oauth/x", "_blank", "width=500,height=650")}
              className="px-3 py-2 btn-gradient text-sm"
            >
              Link X
            </button>
            <div className="text-[var(--muted-foreground)] text-xs">Used for posting to X.</div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">Instagram</div>
            <button
              onClick={() => window.open("/api/oauth/instagram", "_blank", "width=500,height=650")}
              className="px-3 py-2 btn-gradient text-sm"
            >
              Link Instagram
            </button>
            <div className="text-[var(--muted-foreground)] text-xs">Used for posting to Instagram.</div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">YouTube</div>
            <button
              onClick={() => window.open("/api/oauth/youtube", "_blank", "width=500,height=650")}
              className="px-3 py-2 btn-gradient text-sm"
            >
              Link YouTube
            </button>
            <div className="text-[var(--muted-foreground)] text-xs">Used for uploading to YouTube.</div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">TikTok</div>
            <button
              onClick={() => window.open("/api/oauth/tiktok", "_blank", "width=500,height=650")}
              className="px-3 py-2 btn-gradient text-sm"
            >
              Link TikTok
            </button>
            <div className="text-[var(--muted-foreground)] text-xs">
              TikTok requires OAuth upload sessions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
