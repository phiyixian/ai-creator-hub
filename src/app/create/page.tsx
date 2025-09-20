"use client";

import { useState, useRef } from "react";

export default function CreatePage() {
  // Shared prompt for all sections (kept from your design)
  const [prompt, setPrompt] = useState("cinematic neon city at night");

  // Image generation
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [image, setImage] = useState<{ id: string; url: string; downloadUrl: string; description: string } | null>(null);

  // Video processing
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [trim, setTrim] = useState({ start: 0, end: 15 });
  const videoRef = useRef<HTMLVideoElement>(null);

  // Script generation
  const [script, setScript] = useState("");
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  async function handleGenerateImage() {
    if (!prompt.trim()) return;
    setImgError(null);
    setImgLoading(true);
    setImage(null);
    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio: "16:9" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate image");
      const first: string | undefined = (data?.images || [])[0];
      if (first) {
        setImage({ id: "img-0", url: first, downloadUrl: first, description: prompt });
      } else {
        setImgError("No images returned. Try another prompt.");
      }
      if (data?.note) {
        setImgError(data.note);
      }
    } catch (e: any) {
      setImgError(e?.message || "Unexpected error");
    } finally {
      setImgLoading(false);
    }
  }

  function handleDownloadImage() {
    if (!image) return;
    const filename = `${image.id}-${image.description?.slice(0, 24).replace(/\s+/g, "-") || "image"}.jpg`;
    const url = `/api/download/${filename}?url=${encodeURIComponent(image.downloadUrl)}&type=image`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setOutputUrl(null);
    setProcessError(null);
    if (videoRef.current) {
      videoRef.current.src = f ? URL.createObjectURL(f) : "";
      // ensure the new source is loaded
      try { videoRef.current.load(); } catch {}
    }
  }

  async function applyTrim() {
    if (!file) return setProcessError("Please select a video first.");
    setProcessing(true);
    setProcessError(null);
    setOutputUrl(null);
    try {
      const { videoProcessor: vp } = await import("@/lib/video-processor");
      const result = await vp.trimVideo(file, { start: trim.start, end: trim.end });
      if (!result.success) throw new Error(result.error || "Trim failed");
      setOutputUrl(result.url || null);
      if (trim.start !== 0 || trim.end !== 15) {
        setProcessError("Note: Client-side trim is a demo and does not change video length. Use backend or ffmpeg.wasm for real trimming.");
      }
    } catch (e: any) {
      setProcessError(e?.message || "Processing failed");
    } finally {
      setProcessing(false);
    }
  }

  async function addCaptions() {
    if (!file) return setProcessError("Please select a video first.");
    setProcessing(true);
    setProcessError(null);
    setOutputUrl(null);
    try {
      const { videoProcessor: vp } = await import("@/lib/video-processor");
      const captions = [
        { text: prompt || "Caption", start: trim.start, end: Math.max(trim.start + 2, Math.min(trim.end, trim.start + 6)) },
      ];
      const result = await vp.addCaptions(file, captions);
      if (!result.success) throw new Error(result.error || "Add captions failed");
      setOutputUrl(result.url || null);
    } catch (e: any) {
      setProcessError(e?.message || "Processing failed");
    } finally {
      setProcessing(false);
    }
  }

  function downloadOutput() {
    if (!outputUrl) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `processed-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function generateScript() {
    if (!prompt.trim()) return;
    setScript("");
    setScriptError(null);
    setScriptLoading(true);
    try {
      const res = await fetch("/api/ai/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: prompt, style: "commercial" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate script");

      const storyboardLines = Array.isArray(data?.storyboard)
        ? data.storyboard.map((s: any, i: number) => `Beat ${i + 1}: ${s.description}`).join("\n\n")
        : "";
      const content = [data?.script || `Title: ${prompt}`, storyboardLines].filter(Boolean).join("\n\n");

      setScript(content);
    } catch (e: any) {
      setScriptError(e?.message || "Unexpected error");
    } finally {
      setScriptLoading(false);
    }
  }

  const imageUrl = image?.url || `https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1600&auto=format&fit=crop&${encodeURIComponent(prompt)}`;

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
            {imgError && (
              <div className="text-sm text-[var(--destructive)]">{imgError}</div>
            )}
            <div className="flex gap-2">
              <button onClick={handleGenerateImage} className="px-3 py-2 btn-gradient" disabled={imgLoading}>
                {imgLoading ? "Generating..." : "Generate"}
              </button>
              <button onClick={handleDownloadImage} className="px-3 py-2 btn-soft" disabled={!image}>Download</button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <div className="p-4 border-b font-medium text-base md:text-lg">Video Editing (Client-side)</div>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <input type="file" accept="video/*" onChange={handleFileChange} className="input-soft w-full" />
            </div>
            <div className="aspect-video rounded-lg overflow-hidden border bg-[var(--secondary)] grid place-items-center text-sm text-[var(--muted-foreground)]">
              {file ? (
                <video ref={videoRef} controls className="w-full h-full object-contain" />
              ) : (
                <span>Drop or select a clip</span>
              )}
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
            {processError && <div className="text-sm text-[var(--destructive)]">{processError}</div>}
            <div className="flex gap-2">
              <button onClick={applyTrim} className="px-3 py-2 btn-soft" disabled={!file || processing}>
                {processing ? "Processing..." : "Apply Trim"}
              </button>
              <button onClick={addCaptions} className="px-3 py-2 btn-soft" disabled={!file || processing}>Add Captions</button>
              <button onClick={downloadOutput} className="px-3 py-2 btn-soft" disabled={!outputUrl}>Export</button>
            </div>
            {outputUrl && (
              <div className="space-y-2">
                <div className="text-sm text-[var(--muted-foreground)]">Processed preview</div>
                <video controls src={outputUrl} className="w-full rounded-md border" />
              </div>
            )}
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
          {scriptError && <div className="text-sm text-[var(--destructive)]">{scriptError}</div>}
          <div className="flex gap-2">
            <button onClick={generateScript} className="px-3 py-2 btn-gradient" disabled={scriptLoading}>
              {scriptLoading ? "Generating..." : "Generate Script"}
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