"use client";
import { useMemo, useState } from "react";

const platforms = ["YouTube", "TikTok", "Instagram", "X", "LinkedIn"] as const;

type Platform = typeof platforms[number];

export default function ReleasePage() {
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

  function getFeedback() {
    const score = Math.min(100, 60 + feedbackInput.length % 40);
    setFeedback(
      `Overall: ${score}/100\nStrengths: clear hook, niche-relevant.\nSuggestions: tighten intro, add captions, insert CTA at 90s.\nAWS Bedrock could refine tone and extract highlights automatically.`
    );
  }

  function generateCaptions() {
    const base = captionPrompt || "New video";
    setCaptions([
      `${base} ✨ | Shot on a budget, powered by AI #CreatorFlow`,
      `From prompt to post: ${base}. Full process inside.`,
      `${base} — what do you think? #filmmaking #AI`,
    ]);
  }

  const bestTimes = useMemo(() => {
    const now = new Date();
    const hours = [9, 12, 18, 21];
    return hours.map((h) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + (h % 2), h, 0, 0));
  }, []);

  const selectedPlatforms = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([k]) => k as Platform);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Feedback */}
        <div className="rounded-xl border overflow-hidden lg:col-span-2">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-medium">Content feedback</div>
            <button className="px-3 py-1.5 rounded-md border">Connect AWS</button>
          </div>
          <div className="p-4 space-y-3">
            <textarea
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder="Paste your script, caption, or summary for feedback"
              className="w-full min-h-32 rounded-md border p-3"
            />
            <button onClick={getFeedback} className="px-3 py-2 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)]">Get AI feedback</button>
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
              <select value={tz} onChange={(e) => setTz(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-md border">
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
                  <button className="px-2 py-1 rounded-md border">Schedule</button>
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
              className="px-3 py-2 rounded-md border w-full"
            />
            <div className="flex gap-2">
              <button onClick={generateCaptions} className="px-3 py-2 rounded-md bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]">Generate captions</button>
              <button className="px-3 py-2 rounded-md border">Connect AWS</button>
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
            <button className="px-3 py-2 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] w-full">Publish (mock)</button>
          </div>
        </div>
      </div>
    </div>
  );
}