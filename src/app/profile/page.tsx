"use client";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [name, setName] = useState("Alex Creator");
  const [email, setEmail] = useState("alex@example.com");
  const [bio, setBio] = useState("Filmmaker exploring AI workflows.");
  const [persona, setPersona] = useState("videographer");
  const [status, setStatus] = useState("");
  const [platforms, setPlatforms] = useState<Array<{ platform: string; data: any }>>([]);

  async function loadCreds() {
    const res = await fetch("/api/profile/credentials", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setPlatforms(json.credentials || []);
    }
  }

  async function save(platform: string, data: any) {
    setStatus("Saving...");
    const res = await fetch("/api/profile/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, data }),
    });
    if (res.ok) {
      setStatus("Saved");
      loadCreds();
    } else {
      setStatus("Failed");
    }
  }

  useEffect(() => {
    loadCreds();
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-xl border overflow-hidden">
        <div className="p-4 border-b font-medium">Creator profile</div>
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

      <div className="rounded-xl border overflow-hidden">
        <div className="p-4 border-b font-medium flex items-center justify-between">
          <div>AWS connection</div>
          <button className="px-3 py-1.5 rounded-md border">Docs</button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-[var(--muted-foreground)] max-w-prose">
            Connect your AWS account to enable Bedrock model inference, Lambda automations, and multi-platform publishing via API Gateways.
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-2 btn-gradient">Connect AWS</button>
            <button className="px-3 py-2 btn-soft">Test connection</button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="p-4 border-b font-medium">Social platform connections</div>
        <div className="p-4 grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="font-medium">LinkedIn</div>
            <input className="input-soft w-full" placeholder="Access Token" onBlur={(e) => save("linkedin", { accessToken: e.target.value })} />
            <input className="input-soft w-full" placeholder="Member URN (urn:li:person:...)" onBlur={(e) => save("linkedin", { ...(platforms.find(p=>p.platform==="linkedin")?.data||{}), memberUrn: e.target.value })} />
            <div className="text-[var(--muted-foreground)] text-xs">Used for posting to LinkedIn.</div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">X (Twitter)</div>
            <input className="input-soft w-full" placeholder="App Key" onBlur={(e) => save("x", { ...(platforms.find(p=>p.platform==="x")?.data||{}), appKey: e.target.value })} />
            <input className="input-soft w-full" placeholder="App Secret" onBlur={(e) => save("x", { ...(platforms.find(p=>p.platform==="x")?.data||{}), appSecret: e.target.value })} />
            <input className="input-soft w-full" placeholder="Access Token" onBlur={(e) => save("x", { ...(platforms.find(p=>p.platform==="x")?.data||{}), accessToken: e.target.value })} />
            <input className="input-soft w-full" placeholder="Access Secret" onBlur={(e) => save("x", { ...(platforms.find(p=>p.platform==="x")?.data||{}), accessSecret: e.target.value })} />
            <div className="text-[var(--muted-foreground)] text-xs">Used for posting to X.</div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">Instagram</div>
            <input className="input-soft w-full" placeholder="IG User ID" onBlur={(e) => save("instagram", { ...(platforms.find(p=>p.platform==="instagram")?.data||{}), userId: e.target.value })} />
            <input className="input-soft w-full" placeholder="Access Token" onBlur={(e) => save("instagram", { ...(platforms.find(p=>p.platform==="instagram")?.data||{}), accessToken: e.target.value })} />
            <div className="text-[var(--muted-foreground)] text-xs">Used for posting to Instagram.</div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">YouTube</div>
            <input className="input-soft w-full" placeholder="Client ID" onBlur={(e) => save("youtube", { ...(platforms.find(p=>p.platform==="youtube")?.data||{}), clientId: e.target.value })} />
            <input className="input-soft w-full" placeholder="Client Secret" onBlur={(e) => save("youtube", { ...(platforms.find(p=>p.platform==="youtube")?.data||{}), clientSecret: e.target.value })} />
            <input className="input-soft w-full" placeholder="Refresh Token" onBlur={(e) => save("youtube", { ...(platforms.find(p=>p.platform==="youtube")?.data||{}), refreshToken: e.target.value })} />
            <div className="text-[var(--muted-foreground)] text-xs">Used for uploading to YouTube.</div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">TikTok</div>
            <input className="input-soft w-full" placeholder="App ID" onBlur={(e) => save("tiktok", { ...(platforms.find(p=>p.platform==="tiktok")?.data||{}), appId: e.target.value })} />
            <input className="input-soft w-full" placeholder="App Secret" onBlur={(e) => save("tiktok", { ...(platforms.find(p=>p.platform==="tiktok")?.data||{}), appSecret: e.target.value })} />
            <div className="text-[var(--muted-foreground)] text-xs">TikTok requires OAuth upload sessions; placeholders stored here.</div>
          </div>
        </div>
        <div className="p-4 text-xs text-[var(--muted-foreground)]">{status}</div>
      </div>
    </div>
  );
}