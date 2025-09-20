import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getSessionByToken, getSocialCredentials, upsertSocialCredential } from "@/lib/db";

export const runtime = "nodejs";

async function requireUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const session = getSessionByToken(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) return null;
  return session.userId;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const creds = getSocialCredentials(userId).map((c) => ({ platform: c.platform, data: c.data }));
  return Response.json({ credentials: creds });
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const { platform, data } = await req.json().catch(() => ({ platform: "", data: {} }));
  if (!platform) return new Response(JSON.stringify({ error: "Missing platform" }), { status: 400 });
  const c = upsertSocialCredential(userId, platform, data || {});
  return Response.json({ ok: true, platform: c.platform });
}

