import { NextRequest } from "next/server";

export const runtime = "nodejs";

// TikTok requires a full OAuth and upload session workflow; we stub with a placeholder.
export async function POST(req: NextRequest) {
  const { caption, videoUrl } = await req.json().catch(() => ({ caption: "", videoUrl: "" }));
  const hint = "TikTok publishing requires OAuth and upload sessions (not implemented).";
  return Response.json({ ok: false, message: hint });
}

