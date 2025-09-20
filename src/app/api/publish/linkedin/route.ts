import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { text } = await req.json().catch(() => ({ text: "" }));
  if (!text) return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });

  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const urn = process.env.LINKEDIN_MEMBER_URN; // e.g. urn:li:person:XXXXXXXX
  if (!token || !urn) {
    return Response.json({ ok: false, message: "Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_MEMBER_URN" }, { status: 200 });
  }

  try {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: urn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "CONNECTIONS" },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: `LinkedIn error: ${err}` }), { status: 500 });
    }
    const json = await res.json();
    return Response.json({ ok: true, id: json?.id });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Failed to post" }), { status: 500 });
  }
}

