// arc/app/profile/credentials/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  getSessionByToken,
  getUserById,
  upsertUserOnLogin,
} from "@/lib/db";

export const runtime = "nodejs";

const DEBUG_PROFILE = process.env.DEBUG_PROFILE === "1";

/** JSON helper that always disables caching. Accepts status as number or ResponseInit. */
function json(data: any, init?: number | ResponseInit) {
  const res =
    typeof init === "number"
      ? NextResponse.json(data, { status: init })
      : NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

async function requireUserId(): Promise<string | null> {
  const store = await cookies(); // Next 15: MUST await
  const token = store.get("session")?.value;
  if (!token) return null;

  const session = await getSessionByToken(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) return null;

  return String(session.userId);
}

/**
 * GET /api/profile/credentials
 * Now returns the logged-in user's profile document from DynamoDB.
 */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const user = await getUserById(userId);
  if (!user) return json({ error: "User not found" }, 404);

  if (DEBUG_PROFILE) {
    console.log("[profile] GET", { userId, email: user.email });
  }

  // Keep the shape simple; front-end can read data.user.*
  return json({ user }, 200);
}

/**
 * POST /api/profile/credentials
 * Update the user's display fields (name, picture).
 * Body: { name?: string, picture?: string }
 */
export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return json({ error: "Unauthorized" }, 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const name =
    typeof body?.name === "string" ? body.name.trim() : undefined;
  const picture =
    typeof body?.picture === "string" ? body.picture.trim() : undefined;

  if (name === undefined && picture === undefined) {
    return json(
      { error: "Provide at least one of: { name, picture }" },
      400
    );
  }

  const existing = await getUserById(userId);
  if (!existing) return json({ error: "User not found" }, 404);

  const updated = await upsertUserOnLogin({
    userId,
    email: existing.email, // required by upsertUserOnLogin
    name: name ?? existing.name ?? null,
    picture: picture ?? existing.picture ?? null,
  });

  if (DEBUG_PROFILE) {
    console.log("[profile] POST update", {
      userId,
      changed: { name: name !== undefined, picture: picture !== undefined },
    });
  }

  return json({ user: updated }, 200);
}
