import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getSessionByToken, getSocialCredentials } from "@/lib/db";

export const runtime = "nodejs";

// TikTok requires a full OAuth and upload session workflow; we stub with a placeholder.
export async function POST(req: NextRequest) {
  const { caption, videoUrl } = await req.json().catch(() => ({ caption: "", videoUrl: "" }));
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const session = sessionToken ? getSessionByToken(sessionToken) : null;
  const userId = session && Date.now() < session.expiresAt ? session.userId : null;
  const creds = userId ? getSocialCredentials(userId) : [];
  const tk = creds.find((c) => c.platform === "tiktok")?.data || {};
  const hint = tk.appId ? "TikTok OAuth partially configured. Full workflow not implemented." : "TikTok publishing requires OAuth and upload sessions (not implemented).";
  return Response.json({ ok: false, message: hint });
}

