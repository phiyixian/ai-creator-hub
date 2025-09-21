// src/app/create/page.tsx
"use client";
import { useState } from "react";
import FileUploader from "@/components/ui/FileUploader";
import { processVideo, generateCaptions } from "@/lib/video";

export default function CreatePage() {
  const [prompt, setPrompt] = useState("cinematic neon city at night");
  const [imgSeed, setImgSeed] = useState("city");
  const [trim, setTrim] = useState({ start: 0, end: 15 });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  const handleFileSelect = (file: File) => {
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
  };

  const handleApplyTrim = async () => {
    if (videoFile) {
      try {
        const processedBlob = await processVideo(videoFile, trim);
        const newVideoUrl = URL.createObjectURL(processedBlob);
        setVideoUrl(newVideoUrl);
        alert("Video trimmed successfully!");
      } catch (error) {
        console.error(error);
        alert("Failed to trim video.");
      }
    }
  };

  const handleAddCaptions = async () => {
    if (videoFile) {
      try {
        const text = await generateCaptions(videoFile);
        setCaptions(text);
        alert("Captions generated!");
      } catch (error) {
        console.error(error);
        alert("Failed to generate captions.");
      }
    }
  };

  const handleExport = () => {
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = "edited_video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  async function downloadImage() {
    if (!imageUrl) {
      alert("No image to download — please generate one first.");
      return;
    }
    // fetch as blob then download to ensure CORS-safe download
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "generated_image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download image failed:", err);
      alert("Failed to download the image.");
    }
  }

  async function generateImage() {
    setLoadingImage(true);
    try {
      const res = await fetch("/api/ai/unsplash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to fetch image");
      }
      const data = await res.json();
      const url = data.url;
      // optional: add some query params for fit/quality
      setImageUrl(`${url}?w=1600&q=80&auto=format&fit=crop&sat=0.3&seed=${encodeURIComponent(prompt + Date.now())}`);
      setImgSeed(prompt + Date.now());
    } catch (error) {
      console.error("Generate image error:", error);
      alert("Failed to generate image.");
    } finally {
      setLoadingImage(false);
    }
  }

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
              {imageUrl ? (
                <img src={imageUrl} alt="generated" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-sm text-[var(--muted-foreground)]">
                  No image yet — click Generate
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={generateImage} className="px-3 py-2 btn-gradient" disabled={loadingImage}>
                {loadingImage ? "Generating..." : "Generate"}
              </button>
              <button onClick={downloadImage} className="px-3 py-2 btn-soft">Download</button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <div className="p-4 border-b font-medium text-base md:text-lg">Video Editing</div>
          <div className="p-4 space-y-3">
            {videoUrl ? (
              <video src={videoUrl} controls className="aspect-video rounded-lg w-full" />
            ) : (
              <FileUploader onFileSelect={handleFileSelect} />
            )}

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
              <button onClick={handleApplyTrim} className="px-3 py-2 btn-soft">Apply Trim</button>
              <button onClick={handleAddCaptions} className="px-3 py-2 btn-soft">Add Captions</button>
              <button onClick={handleExport} className="px-3 py-2 btn-soft">Export</button>
            </div>
            {captions && (
              <div className="text-sm text-[var(--muted-foreground)] p-2 border rounded">
                <strong>Captions:</strong> {captions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
