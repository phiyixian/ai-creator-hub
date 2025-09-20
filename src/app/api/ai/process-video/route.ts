import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const operation = String(form.get("operation") || "stabilize");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing video file" }, { status: 400 });
    }

    // In a real implementation, you'd stream to storage and run processing.
    // For this demo, return a public sample video URL as the processed result.
    const jobId = `job_${Math.random().toString(36).slice(2, 9)}`;

    const sampleProcessedUrl =
      "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4"; // royalty-free sample

    return NextResponse.json({ jobId, operation, processedUrl: sampleProcessedUrl, originalName: file.name });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}