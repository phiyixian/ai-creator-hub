// src/lib/video.ts
export async function processVideo(file: File, trim: { start: number; end: number }) {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("trimStart", trim.start.toString());
  formData.append("trimEnd", trim.end.toString());

  try {
    const response = await fetch("/api/ai/video-processing", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Video processing failed: ${text}`);
    }

    return response.blob();
  } catch (error) {
    console.error("Error processing video:", error);
    throw error;
  }
}
