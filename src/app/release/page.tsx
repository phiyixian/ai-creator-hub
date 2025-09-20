"use client";
import { useEffect, useMemo, useState } from "react";

const platforms = ["YouTube", "TikTok", "Instagram", "X", "LinkedIn"] as const;

type Platform = typeof platforms[number];

export default function ReleasePage() {
  const [projects, setProjects] = useState<Array<{ id: number; title: string; contentUrl?: string | null; coverUrl?: string | null }>>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [tz, setTz] = useState("UTC");
  const [captionPrompt, setCaptionPrompt] = useState("Behind the scenes of my neon city short film");
  const [captions, setCaptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<Platform, boolean>>({
    YouTube: true,
    TikTok: true,
    Instagram: false,
    X: false,
    LinkedIn: false,
  });
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .catch(() => {});
  }, []);

  async function getFeedback() {
    const res = await fetch("/api/ai/feedback", { method: "POST", body: JSON.stringify({ content: feedbackInput }) });
    const json = await res.json();
    setFeedback(String(json.feedback || ""));
  }

  async function generateCaptions() {
    const res = await fetch("/api/ai/captions", { method: "POST", body: JSON.stringify({ prompt: captionPrompt }) });
    const json = await res.json();
    setCaptions(Array.isArray(json.captions) ? json.captions : []);
  }

  const [bestTimes, setBestTimes] = useState<Date[]>([]);
  useEffect(() => {
    fetch("/api/ai/best-time", { method: "POST", body: JSON.stringify({ timezone: tz }) })
      .then((r) => r.json())
      .then((d) => setBestTimes((d.times || []).map((s: string) => new Date(s))))
      .catch(() => {});
  }, [tz]);

  const selectedPlatforms = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([k]) => k as Platform);

  function buildPlatformPreview(platform: Platform, base: string) {
    const text = base.trim();
    switch (platform) {
      case "X": {
        const limit = 280;
        let t = text;
        if (t.length > limit) t = t.slice(0, limit - 1) + "…";
        return t;
      }
      case "Instagram": {
        return `${text}\n\n#reels #creator #behindthescenes`;
      }
      case "TikTok": {
        return `${text} \n\n#tiktok #fyp #creators`;
      }
      case "LinkedIn": {
        return `${text}\n\nWhat did you learn?`;
      }
      case "YouTube": {
        return `${text} | Full video link in bio.`;
      }
      default:
        return text;
    }
  }

  async function publishApproved(platformsToPost: Platform[], finalText: string) {
    setIsPublishing(true);
    const results: Record<string, { ok: boolean; url?: string; message?: string }> = {};
    const base = finalText.trim();
    for (const p of platformsToPost) {
      const preview = buildPlatformPreview(p, base);
      if (p === "X") {
        try {
          const res = await fetch("/api/publish/x", { method: "POST", body: JSON.stringify({ text: preview }) });
          const json = await res.json();
          results[p] = { ok: !!json.ok, url: json.url, message: json.message };
        } catch (e: any) {
          results[p] = { ok: false, message: e?.message || "Failed" };
        }
      } else {
        results[p] = { ok: false, message: "Not yet implemented" };
      }
    }
    setIsPublishing(false);
    setIsReviewOpen(false);
    const success = Object.entries(results)
      .map(([k, v]) => `${k}: ${v.ok ? (v.url || "OK") : (v.message || "Failed")}`)
      .join("\n");
    alert(success);
  }

  return (
    <div className="space-y-8">
      {/* Project selector & uploader */}
      <div className="rounded-xl border overflow-hidden">
        <div className="p-4 border-b font-medium flex items-center justify-between">
          <div>Project</div>
          <button
            className="px-3 py-1.5 btn-soft"
            onClick={async () => {
              const title = prompt("Project title?") || "Untitled";
              const res = await fetch("/api/projects", { method: "POST", body: JSON.stringify({ title }) });
              const json = await res.json();
              setProjects((p) => [json.project, ...p]);
              setSelectedProjectId(json.project.id);
            }}
          >
            New project
          </button>
        </div>
        <div className="p-4 space-y-3">
          <select
            className="input-soft w-full"
            value={selectedProjectId ?? ""}
            onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={async (e) => {
                if (!e.target.files?.[0]) return;
                setIsUploading(true);
                try {
                  const fd = new FormData();
                  fd.append("file", e.target.files[0]);
                  const up = await fetch("/api/upload", { method: "POST", body: fd });
                  const { url } = await up.json();
                  if (selectedProjectId) {
                    await fetch(`/api/projects/${selectedProjectId}`, {
                      method: "PATCH",
                      body: JSON.stringify({ contentUrl: url }),
                    });
                    const refreshed = await fetch("/api/projects").then((r) => r.json());
                    setProjects(refreshed.projects || []);
                  }
                } finally {
                  setIsUploading(false);
                }
              }}
            />
            {isUploading && <div className="text-xs text-[var(--muted-foreground)]">Uploading…</div>}
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Feedback */}
        <div className="rounded-xl border overflow-hidden lg:col-span-2">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-medium">Content feedback</div>
            <button className="px-3 py-1.5 btn-soft">Connect AWS</button>
          </div>
          <div className="p-4 space-y-3">
            <textarea
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder="Paste your script, caption, or summary for feedback"
              className="w-full min-h-32 input-soft"
            />
            <button onClick={getFeedback} className="px-3 py-2 btn-gradient">Get AI feedback</button>
            {feedback && (
              <pre className="whitespace-pre-wrap text-sm bg-[var(--secondary)] p-3 rounded-md border">{feedback}</pre>
            )}
          </div>
        </div>

        {/* Best time */}
        <div className="rounded-xl border overflow-hidden">
          <div className="p-4 border-b font-medium">Best time to release</div>
          <div className="p-4 space-y-3">
            <label className="text-sm">
              Timezone
              <select value={tz} onChange={(e) => setTz(e.target.value)} className="mt-1 w-full input-soft">
                <option value="UTC">UTC</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Singapore">Asia/Singapore</option>
              </select>
            </label>
            <div className="grid gap-2">
              {bestTimes.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <div>{d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" })} • {tz}</div>
                  <button className="px-2 py-1 btn-soft">Schedule</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Captions and multi-platform publish */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border overflow-hidden lg:col-span-2">
          <div className="p-4 border-b font-medium">AI Caption writing</div>
          <div className="p-4 space-y-3">
            <input
              value={captionPrompt}
              onChange={(e) => setCaptionPrompt(e.target.value)}
              placeholder="Describe the post to generate captions"
              className="input-soft w-full"
            />
            <div className="flex gap-2">
              <button onClick={generateCaptions} className="px-3 py-2 btn-gradient">Generate captions</button>
              <button className="px-3 py-2 btn-soft">Connect AWS</button>
            </div>
            {!!captions.length && (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {captions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <div className="p-4 border-b font-medium">Multi-platform</div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {platforms.map((p) => (
                <label key={p} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!selected[p]}
                    onChange={(e) => setSelected((s) => ({ ...s, [p]: e.target.checked }))}
                  />
                  {p}
                </label>
              ))}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              Selected: {selectedPlatforms.length ? selectedPlatforms.join(", ") : "None"}
            </div>
            <button
              className="px-3 py-2 btn-gradient w-full"
              onClick={() => setIsReviewOpen(true)}
            >
              Review & publish
            </button>
          </div>
        </div>
      </div>

      {isReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !isPublishing && setIsReviewOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-xl border bg-[var(--background)]">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-medium">Review posts</div>
              <button className="px-2 py-1 btn-soft" onClick={() => !isPublishing && setIsReviewOpen(false)}>Close</button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-auto">
              {selectedPlatforms.length === 0 ? (
                <div className="text-sm text-[var(--muted-foreground)]">No platforms selected.</div>
              ) : (
                selectedPlatforms.map((p) => (
                  <div key={p} className="rounded-md border p-3 text-sm">
                    <div className="mb-2 font-medium">{p}</div>
                    <pre className="whitespace-pre-wrap">{buildPlatformPreview(p, captions[0] || captionPrompt || "New post")}</pre>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button className="px-3 py-2 btn-soft" onClick={() => setIsReviewOpen(false)} disabled={isPublishing}>Cancel</button>
              <button
                className="px-3 py-2 btn-gradient"
                disabled={isPublishing || selectedPlatforms.length === 0}
                onClick={() => publishApproved(selectedPlatforms, captions[0] || captionPrompt || "New post")}
              >
                {isPublishing ? "Publishing…" : "Approve & publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}