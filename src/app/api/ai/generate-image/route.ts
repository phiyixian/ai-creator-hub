import { NextRequest, NextResponse } from "next/server";
import { imageGenerator } from "@/lib/image-generator";

export async function POST(req: NextRequest) {
  try {
    const { prompt, style, orientation } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing 'prompt'" }, { status: 400 });
    }
    // Generate images using your utility
    const images = await imageGenerator.generateImages(prompt, { style, orientation });
    return NextResponse.json({ images });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}