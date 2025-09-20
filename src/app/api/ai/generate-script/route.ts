import { NextRequest, NextResponse } from "next/server";
import { scriptGenerator } from "@/lib/script-generator";

export async function POST(req: NextRequest) {
  try {
    const { prompt, type, platform, duration } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing 'prompt'" }, { status: 400 });
    }
    // Use your script generator utility
    const script = scriptGenerator.generateScript(prompt, { type, platform, duration });
    return NextResponse.json(script);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}