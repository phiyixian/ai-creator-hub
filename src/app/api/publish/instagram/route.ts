import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Instagram Graph API requires a Facebook Page + IG Business account and a container workflow.
// We implement a simple photo publish via image URL.
export async function POST(req: NextRequest) {
  const { caption, imageUrl } = await req.json().catch(() => ({ caption: "", imageUrl: "" }));
  if (!imageUrl) return new Response(JSON.stringify({ error: "Missing imageUrl" }), { status: 400 });

  const igUserId = process.env.IG_USER_ID;
  const igToken = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !igToken) {
    return Response.json({ ok: false, message: "Set IG_USER_ID and IG_ACCESS_TOKEN" }, { status: 200 });
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

