"use client";
import { useEffect, useMemo, useState } from "react";

const platforms = ["YouTube", "TikTok", "Instagram", "X", "LinkedIn"] as const;
type Platform = typeof platforms[number];

type Project = { id: number; title: string; contentUrl?: string | null; coverUrl?: string | null; feedback?: string | null };

export default function ReleasePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [feedbackInput, setFeedbackInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackAttached, setFeedbackAttached] = useState<null | { projectId: number; when: string }>(null);

  const [tz, setTz] = useState("UTC");

  const [captionPrompt, setCaptionPrompt] = useState("Behind the scenes of my neon city short film");
  const [captions, setCaptions] = useState<string[]>([]);
  const [captionsLoading, setCaptionsLoading] = useState(false);

  const [selected, setSelected] = useState<Record<Platform, boolean>>({
    YouTube: true,
    TikTok: true,
    Instagram: false,
    X: false,
    LinkedIn: false,
  });

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Load projects
  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .catch(() => {});
  }, []);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  // Best times
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

  // ---------- helpers ----------
  function buildPlatformPreview(platform: Platform, base: string) {
    const text = base.trim();
    switch (platform) {
      case "X": {
        const limit = 280;
        let t = text;
        if (t.length > limit) t = t.slice(0, limit - 1) + "…";
        return t;
      }
      case "Instagram":
        return `${text}\n\n#reels #creator #behindthescenes`;
      case "TikTok":
        return `${text}\n\n#tiktok #fyp #creators`;
      case "LinkedIn":
        return `${text}\n\nWhat did you learn?`;
      case "YouTube":
        return `${text} | Full video link in bio.`;
      default:
        return text;
    }
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  function looksLikeListLine(s: string) {
    return /^[\-\*•\u2022]|^\d+\./.test(s.trim());
  }

  function FeedbackBlock({ text }: { text: string }) {
    // very light formatting: split to lines, render bullets if they look like a list
    const lines = text.split(/\r?\n/).filter(Boolean);
    return (
      <div className="rounded-md border bg-[var(--secondary)]/60 backdrop-blur-sm p-4">
        <div className="text-sm leading-relaxed space-y-2">
          {lines.map((ln, i) =>
            looksLikeListLine(ln) ? (
              <div key={i} className="pl-4 relative">
                <span className="absolute left-0 top-[0.35rem] h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
                {ln.replace(/^([\-\*•\u2022]|\d+\.)\s*/, "")}
              </div>
            ) : (
              <p key={i} className="text-[0.95rem]">
                {ln}
              </p>
            )
          )}
        </div>
      </div>
    );
  }

  function CaptionCard({
    text,
    onUse,
  }: {
    text: string;
    onUse: () => void;
  }) {
    return (
      <div className="rounded-md border p-3 bg-background/60 backdrop-blur-sm hover:border-fuchsia-400/60 transition">
        <div className="text-sm">{text}</div>
        <div className="mt-2 flex items-center gap-2">
          <button className="px-2 py-1 btn-soft text-xs" onClick={() => copy(text)}>
            Copy
          </button>
          <button className="px-2 py-1 btn-gradient text-xs" onClick={onUse}>
            Use this
          </button>
        </div>
      </div>
    );
  }

  // ---------- upload ----------
  async function handleUpload(file: File) {
    setIsUploading(true);
    setUploadError(null);
    try {
      // 1) upload to your backend
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const { url } = await up.json();

      // 2) ensure there is a project to attach to
      let projectId = selectedProjectId;
      if (!projectId) {
        // auto-create a project (title from file name)
        const title = file.name.replace(/\.[^.]+$/, "");
        const createRes = await fetch("/api/projects", {
          method: "POST",
          body: JSON.stringify({ title }),
        });
        const created = await createRes.json();
        projectId = created.project?.id;
        setSelectedProjectId(projectId ?? null);
      }

      // 3) update project with contentUrl
      if (projectId) {
        await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          body: JSON.stringify({ contentUrl: url }),
        });
      }

      // 4) refresh list
      const refreshed = await fetch("/api/projects").then((r) => r.json());
      setProjects(refreshed.projects || []);
    } catch (e: any) {
      setUploadError(e?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  // ---------- AI: feedback ----------
  async function getFeedback() {
    const mediaUrl = activeProject?.contentUrl || null;
    setFeedbackLoading(true);
    setFeedbackAttached(null);
    try {
      // send attachment context so API can persist too if desired
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: feedbackInput,
          projectId: selectedProjectId ?? undefined,
          mediaUrl: mediaUrl ?? undefined,
          attach: true, // hint for server
        }),
      });
      const json = await res.json();
      const text = String(json.feedback || "");
      setFeedback(text);

      // also persist feedback on the project locally (soft attach)
      if (selectedProjectId) {
        try {
          await fetch(`/api/projects/${selectedProjectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ feedback: text, feedbackAt: new Date().toISOString() }),
          });
          setFeedbackAttached({ projectId: selectedProjectId, when: new Date().toLocaleString() });
          // refresh projects so UI shows the new feedback if you list it anywhere
          const refreshed = await fetch("/api/projects").then((r) => r.json());
          setProjects(refreshed.projects || []);
        } catch {
          // ignore if project API doesn't support feedback yet
        }
      }
    } finally {
      setFeedbackLoading(false);
    }
  }

  // ---------- AI: captions ----------
  async function generateCaptions() {
    setCaptionsLoading(true);
    try {
      const mediaUrl = activeProject?.contentUrl || null;
      const res = await fetch("/api/ai/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: captionPrompt,
          projectId: selectedProjectId ?? undefined,
          mediaUrl: mediaUrl ?? undefined,
        }),
      });
      const json = await res.json();
      setCaptions(Array.isArray(json.captions) ? json.captions : []);
    } finally {
      setCaptionsLoading(false);
    }
  }

  // ---------- publish ----------
  async function publishApproved(platformsToPost: Platform[], finalText: string) {
    setIsPublishing(true);
    const results: Record<string, { ok: boolean; url?: string; message?: string }> = {};
    const base = finalText.trim();
    const mediaUrl = activeProject?.contentUrl || "";

    for (const p of platformsToPost) {
      const preview = buildPlatformPreview(p, base);
      try {
        if (p === "X") {
          const res = await fetch("/api/publish/x", { method: "POST", body: JSON.stringify({ text: preview }) });
          const json = await res.json();
          results[p] = { ok: !!json.ok, url: json.url, message: json.message };
        } else if (p === "LinkedIn") {
          const r = await fetch("/api/publish/linkedin", { method: "POST", body: JSON.stringify({ text: preview }) });
          const j = await r.json();
          results[p] = { ok: !!j.ok, url: j.id ? `https://www.linkedin.com/feed/update/${j.id}` : undefined, message: j.message };
        } else if (p === "Instagram") {
          if (!mediaUrl) results[p] = { ok: false, message: "No image/video URL on selected project" };
          else {
            const r = await fetch("/api/publish/instagram", { method: "POST", body: JSON.stringify({ caption: preview, imageUrl: mediaUrl }) });
            const j = await r.json();
            results[p] = { ok: !!j.ok, message: j.message };
          }
        } else if (p === "YouTube") {
          if (!mediaUrl) results[p] = { ok: false, message: "No video URL on selected project" };
          else {
            const r = await fetch("/api/publish/youtube", { method: "POST", body: JSON.stringify({ title: base.slice(0, 80), description: base, videoUrl: mediaUrl }) });
            const j = await r.json();
            results[p] = { ok: !!j.ok, url: j.url, message: j.message };
          }
        } else if (p === "TikTok") {
          const r = await fetch("/api/publish/tiktok", { method: "POST", body: JSON.stringify({ caption: preview, videoUrl: mediaUrl }) });
          const j = await r.json();
          results[p] = { ok: !!j.ok, message: j.message };
        }
      } catch (e: any) {
        results[p] = { ok: false, message: e?.message || "Failed" };
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
          <div className="text-base md:text-lg">Project</div>
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
              onChange={(e) => {
                if (!e.target.files?.[0]) return;
                void handleUpload(e.target.files[0]);
              }}
            />
            {isUploading && <div className="text-xs text-[var(--muted-foreground)]">Uploading…</div>}
            {uploadError && <div className="text-xs text-red-400">{uploadError}</div>}
          </div>

          {activeProject?.contentUrl && (
            <div className="flex items-center gap-3 rounded-md border p-3 bg-background/60">
              <div className="text-xs text-[var(--muted-foreground)]">Attached media:</div>
              <a href={activeProject.contentUrl} target="_blank" className="text-xs text-cyan-400 underline">
                Open file
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Feedback */}
        <div className="rounded-xl border overflow-hidden lg:col-span-2">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-medium text-base md:text-lg">Content feedback</div>
            {activeProject && (
              <div className="text-xs text-[var(--muted-foreground)]">
                {feedbackAttached
                  ? <>Attached to <span className="text-cyan-400">Project #{feedbackAttached.projectId}</span> • {feedbackAttached.when}</>
                  : activeProject.contentUrl
                  ? <>Will attach to <span className="text-cyan-400">Project #{activeProject.id}</span></>
                  : <>No media yet</>}
              </div>
            )}
          </div>
          <div className="p-4 space-y-3">
            <textarea
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder="Paste your script, caption, or summary for feedback"
              className="w-full min-h-32 input-soft"
            />
            <div className="flex items-center gap-2">
              <button onClick={getFeedback} className="px-3 py-2 btn-gradient" disabled={feedbackLoading}>
                {feedbackLoading ? "Thinking…" : "Get AI feedback"}
              </button>
              {feedback && (
                <button
                  className="px-3 py-2 btn-soft"
                  onClick={() => feedback && copy(feedback)}
                >
                  Copy feedback
                </button>
              )}
            </div>

            {activeProject?.contentUrl && (
              <div className="rounded-md border p-3 bg-background/60">
                <div className="text-xs text-[var(--muted-foreground)] mb-2">Preview</div>
                {/\.(mp4|mov|webm|m4v)$/i.test(activeProject.contentUrl) ? (
                  <video src={activeProject.contentUrl} className="w-full rounded-md" controls />
                ) : (
                  <img src={activeProject.contentUrl} className="max-h-64 rounded-md object-contain" alt="preview" />
                )}
              </div>
            )}

            {feedback && <FeedbackBlock text={feedback} />}
          </div>
        </div>

        {/* Best time */}
        <div className="rounded-xl border overflow-hidden">
          <div className="p-4 border-b font-medium text-base md:text-lg">Best time to release</div>
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
                  <div>
                    {d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" })} • {tz}
                  </div>
                  <button className="px-2 py-1 btn-soft">Schedule</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Captions + multi-post */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border overflow-hidden lg:col-span-2">
          <div className="p-4 border-b font-medium text-base md:text-lg">AI Caption writing</div>
          <div className="p-4 space-y-3">
            <input
              value={captionPrompt}
              onChange={(e) => setCaptionPrompt(e.target.value)}
              placeholder="Describe the post to generate captions"
              className="input-soft w-full"
            />
            <div className="flex gap-2">
              <button onClick={generateCaptions} className="px-3 py-2 btn-gradient" disabled={captionsLoading}>
                {captionsLoading ? "Generating…" : "Generate captions"}
              </button>
              {!!captions.length && (
                <button className="px-3 py-2 btn-soft" onClick={() => copy(captions.join("\n"))}>
                  Copy all
                </button>
              )}
            </div>

            {!!captions.length && (
              <div className="grid sm:grid-cols-2 gap-3">
                {captions.map((c, i) => (
                  <CaptionCard key={i} text={c} onUse={() => setCaptionPrompt(c)} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <div className="p-4 border-b font-medium text-base md:text-lg">Multi-platform</div>
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
            <button className="px-3 py-2 btn-gradient w-full" onClick={() => setIsReviewOpen(true)}>
              Review & publish
            </button>
          </div>
        </div>
      </div>

      {/* Review modal */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !isPublishing && setIsReviewOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-xl border bg-[var(--background)]">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-medium">Review posts</div>
              <button className="px-2 py-1 btn-soft" onClick={() => !isPublishing && setIsReviewOpen(false)}>
                Close
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-auto">
              {selectedPlatforms.length === 0 ? (
                <div className="text-sm text-[var(--muted-foreground)]">No platforms selected.</div>
              ) : (
                selectedPlatforms.map((p) => (
                  <div key={p} className="rounded-md border p-3 text-sm bg-background/60 backdrop-blur-sm">
                    <div className="mb-2 font-medium">{p}</div>
                    <div className="rounded border p-3 bg-[var(--secondary)]/60">
                      {buildPlatformPreview(p, captions[0] || captionPrompt || "New post")}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button className="px-3 py-2 btn-soft" onClick={() => setIsReviewOpen(false)} disabled={isPublishing}>
                Cancel
              </button>
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
