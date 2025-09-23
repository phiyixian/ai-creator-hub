"use client";
import { useState } from "react";

export default function CreatePage() {
  const [prompt, setPrompt] = useState("cinematic neon city at night");
  const [imgSeed, setImgSeed] = useState("city");
  const [script, setScript] = useState("");
  const [trim, setTrim] = useState({ start: 0, end: 15 });

  function generateScript() {
    const s = `Title: ${prompt}\n\nScene 1: Establishing shot of ${prompt}.\nScene 2: Close-up details.\nScene 3: Voiceover explains the story arc.\nScene 4: Call to action.`;
    setScript(s);
  }

  const imageUrl = `https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1600&auto=format&fit=crop&${encodeURIComponent(
    imgSeed
  )}`;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-medium text-base md:text-lg">AI Image Generation</div>
          </div>
          <div className="p-4 space-y-3">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Prompt for image generation"
              className="input-soft w-full"
            />
            <div className="aspect-video rounded-lg overflow-hidden border">
              <img src={imageUrl} alt="generated" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setImgSeed(prompt)} className="px-3 py-2 btn-gradient">Generate</button>
              <button className="px-3 py-2 btn-soft">Download</button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <div className="p-4 border-b font-medium text-base md:text-lg">Video Editing (Placeholder)</div>
          <div className="p-4 space-y-3">
            <div className="aspect-video rounded-lg overflow-hidden border bg-[var(--secondary)] grid place-items-center text-sm text-[var(--muted-foreground)]">
              Drop or select a clip
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Trim start (s)
                <input
                  type="number"
                  value={trim.start}
                  onChange={(e) => setTrim((t) => ({ ...t, start: Number(e.target.value) }))}
                  className="input-soft w-full"
                />
              </label>
              <label className="text-sm">
                Trim end (s)
                <input
                  type="number"
                  value={trim.end}
                  onChange={(e) => setTrim((t) => ({ ...t, end: Number(e.target.value) }))}
                  className="input-soft w-full"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 btn-soft">Apply Trim</button>
              <button className="px-3 py-2 btn-soft">Add Captions</button>
              <button className="px-3 py-2 btn-soft">Export</button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="p-4 border-b font-medium text-base md:text-lg">Script & Storyboard from Prompt</div>
        <div className="p-4 space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full min-h-24 input-soft"
          />
          <div className="flex gap-2">
            <button onClick={generateScript} className="px-3 py-2 btn-gradient">
              Generate Script
            </button>
          </div>
          {script && (
            <pre className="whitespace-pre-wrap text-sm bg-[var(--secondary)] p-3 rounded-md border">{script}</pre>
          )}
        </div>
      </div>
    </div>
  );
}