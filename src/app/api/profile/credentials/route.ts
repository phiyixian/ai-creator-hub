// src/app/api/profile/credentials/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionByToken, getSocialCredentials, upsertSocialCredential } from "@/lib/db";

export const runtime = "nodejs";

const DEBUG_PROFILE = process.env.DEBUG_PROFILE === "1";

const ALLOWED_PLATFORMS = new Set([
  "cognito",
  "google",
  "linkedin",
  "x", // prefer "x" over "twitter"
  "instagram",
  "youtube",
  "tiktok",
]);

function normalizePlatform(input: string): string {
  const p = String(input || "").trim().toLowerCase();
  if (p === "twitter") return "x";
  return p;
}

async function requireUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const session = await Promise.resolve(getSessionByToken(token));
  if (!session) return null;
  if (Date.now() > session.expiresAt) return null;

  return session.userId as number;
}

// ✅ FIXED: only ever pass ResponseInit into NextResponse.json
function json(data: any, init?: number | ResponseInit) {
  const res =
    typeof init === "number"
      ? NextResponse.json(data, { status: init })
      : NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function GET() {
  const userId = await requireUserId();
  if (userId == null) return json({ error: "Unauthorized" }, { status: 401 });

  const creds = await Promise.resolve(getSocialCredentials(userId));
  const payload = (creds || []).map((c: any) => ({ platform: c.platform, data: c.data }));

  if (DEBUG_PROFILE) {
    console.log("[profile/credentials] GET", { userId, count: payload.length });
  }

  return json({ credentials: payload });
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (userId == null) return json({ error: "Unauthorized" }, { status: 401 });

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const platformRaw = body?.platform;
  const platform = normalizePlatform(platformRaw);
  const data = (body?.data ?? {}) as Record<string, unknown>;

  if (!platform) return json({ error: "Missing 'platform' (string)" }, { status: 400 });
  if (!ALLOWED_PLATFORMS.has(platform)) {
    return json({ error: `Unsupported platform '${platformRaw}'` }, { status: 400 });
  }
  if (typeof data !== "object" || Array.isArray(data)) {
    return json({ error: "'data' must be an object" }, { status: 400 });
  }

  if (DEBUG_PROFILE) {
    console.log("[profile/credentials] POST upsert", { userId, platform, keys: Object.keys(data) });
  }

  const c = await Promise.resolve(upsertSocialCredential(userId, platform, data));
  return json({ ok: true, platform: c.platform });
}
