import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getSessionByToken, getSocialCredentials } from "@/lib/db";

export const runtime = "nodejs";

// Instagram Graph API requires a Facebook Page + IG Business account and a container workflow.
// We implement a simple photo publish via image URL.
export async function POST(req: NextRequest) {
  const { caption, imageUrl } = await req.json().catch(() => ({ caption: "", imageUrl: "" }));
  if (!imageUrl) return new Response(JSON.stringify({ error: "Missing imageUrl" }), { status: 400 });

  const cookieStore = cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const session = sessionToken ? getSessionByToken(sessionToken) : null;
  const userId = session && Date.now() < session.expiresAt ? session.userId : null;
  const creds = userId ? getSocialCredentials(userId) : [];
  const igData = creds.find((c) => c.platform === "instagram")?.data || {};
  const igUserId = igData.userId || process.env.IG_USER_ID;
  const igToken = igData.accessToken || process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !igToken) {
    return Response.json({ ok: false, message: "Missing Instagram credentials. Provide via profile settings." }, { status: 200 });
  }

  try {
    const create = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: igToken }),
    });
    const cjson = await create.json();
    if (!create.ok) return new Response(JSON.stringify(cjson), { status: 500 });
    const id = cjson.id;
    const publish = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: id, access_token: igToken }),
    });
    const pjson = await publish.json();
    if (!publish.ok) return new Response(JSON.stringify(pjson), { status: 500 });
    return Response.json({ ok: true, id: pjson?.id });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Failed" }), { status: 500 });
  }
}

