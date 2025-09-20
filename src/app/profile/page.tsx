"use client";
import { useEffect, useState } from "react";

type PlatformCred = { platform: string; data: any };

type ProfilePayload = {
  user: {
    id: number | string;
    email: string;
    name: string | null;
    picture?: string | null;
    bio?: string;
    persona?: string;
  };
  credentials: PlatformCred[];
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // user fields (bound to inputs)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [persona, setPersona] = useState("videographer");
  const [picture, setPicture] = useState<string | null>(null);

  // linked platforms (from /api/profile or /api/profile/credentials)
  const [platforms, setPlatforms] = useState<PlatformCred[]>([]);
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
      const data: ProfilePayload = await res.json();
      setName(data.user.name || "");
      setEmail(data.user.email || "");
      setBio(data.user.bio || "");
      setPersona(data.user.persona || "videographer");
      setPicture(data.user.picture || null);
      setPlatforms(data.credentials || []);
    } catch (e) {
      setAuthError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function reloadCredentials() {
    try {
      const res = await fetch("/api/profile/credentials", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setPlatforms(json.credentials || []);
      }
    } catch {
      /* ignore for now */
    }
  }

  async function save(platform: string, data: any) {
    setStatus("Saving...");
    try {
      const res = await fetch("/api/profile/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, data }),
      });
      if (res.ok) {
        setStatus("Saved");
        reloadCredentials();
      } else {
        setStatus("Failed");
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
            <img src={picture} alt="avatar" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--muted)]" />
          )}
          Creator profile
        </div>
        <div className="p-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full input-soft" />
          </label>
          <label className="text-sm">
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full input-soft" />
          </label>
          <label className="text-sm sm:col-span-2">
            Bio
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1 w-full min-h-24 input-soft" />
          </label>
          <label className="text-sm">
            Persona
            <select value={persona} onChange={(e) => setPersona(e.target.value)} className="mt-1 w-full input-soft">
              <option value="videographer">Videographer</option>
              <option value="photographer">Photographer</option>
              <option value="educator">Educator</option>
              <option value="streamer">Streamer</option>
              <option value="musician">Musician</option>
            </select>
          </label>
        </div>
      </div>

      {/* Linked platforms */}
      <div className="rounded-xl border overflow-hidden">
        <div className="p-4 border-b font-medium text-base md:text-lg flex items-center justify-between">
          <span>Social platform connections</span>
          {!!platforms.length && (
            <span className="text-xs text-[var(--muted-foreground)]">
              Linked: {platforms.map((p) => p.platform).join(", ")}
            </span>
          )}
        </div>

        <div className="p-4 grid gap-6 sm:grid-cols-2">
          {/* LinkedIn */}
          <div className="space-y-2">
            <div className="font-medium">LinkedIn</div>
            <button
              onClick={() => window.open("/api/oauth/linkedin", "_blank", "width=500,height=650")}
              className="px-3 py-2 btn-gradient text-sm"
            >
              Link LinkedIn
            </button>
            <div className="text-[var(--muted-foreground)] text-xs">Used for posting to LinkedIn.</div>
            {platforms.find((p) => p.platform === "linkedin") && (
              <div className="text-xs text-cyan-400">Linked ✓</div>
            )}
          </div>

          {/* X/Twitter */}
          <div className="space-y-2">
            <div className="font-medium">X (Twitter)</div>
            <button
              onClick={() => window.open("/api/oauth/x", "_blank", "width=500,height=650")}
              className="px-3 py-2 btn-gradient text-sm"
            >
              Link X
            </button>
            <div className="text-[var(--muted-foreground)] text-xs">Used for posting to X.</div>
            {platforms.find((p) => p.platform === "x" || p.platform === "twitter") && (
              <div className="text-xs text-cyan-400">Linked ✓</div>
            )}
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <div className="font-medium">Instagram</div>
            <button
              onClick={() => window.open("/api/oauth/instagram", "_blank", "width=500,height=650")}
              className="px-3 py-2 btn-gradient text-sm"
            >
              Link Instagram
            </button>
            <div className="text-[var(--muted-foreground)] text-xs">Used for posting to Instagram.</div>
            {platforms.find((p) => p.platform === "instagram") && (
              <div className="text-xs text-cyan-400">Linked ✓</div>
            )}
          </div>

          {/* YouTube */}
          <div className="space-y-2">
            <div className="font-medium">YouTube</div>
            <button
              onClick={() => window.open("/api/oauth/youtube", "_blank", "width=500,height=650")}
              className="px-3 py-2 btn-gradient text-sm"
            >
              Link YouTube
            </button>
            <div className="text-[var(--muted-foreground)] text-xs">Used for uploading to YouTube.</div>
            {platforms.find((p) => p.platform === "youtube") && (
              <div className="text-xs text-cyan-400">Linked ✓</div>
            )}
          </div>

          {/* TikTok */}
          <div className="space-y-2">
            <div className="font-medium">TikTok</div>
            <button
              onClick={() => window.open("/api/oauth/tiktok", "_blank", "width=500,height=650")}
              className="px-3 py-2 btn-gradient text-sm"
            >
              Link TikTok
            </button>
            <div className="text-[var(--muted-foreground)] text-xs">TikTok requires OAuth upload sessions.</div>
            {platforms.find((p) => p.platform === "tiktok") && (
              <div className="text-xs text-cyan-400">Linked ✓</div>
            )}
          </div>
        </div>

        <div className="p-4 text-xs text-[var(--muted-foreground)]">{status}</div>
      </div>
    </div>
  );
}
