import { NextRequest } from "next/server";
import { TwitterApi } from "twitter-api-v2";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { text } = await req.json().catch(() => ({ text: "" }));
  if (!text) return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });

  const bearerToken = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
  const appKey = process.env.X_APP_KEY || process.env.TWITTER_APP_KEY;
  const appSecret = process.env.X_APP_SECRET || process.env.TWITTER_APP_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN || process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET || process.env.TWITTER_ACCESS_SECRET;

  try {
    if (appKey && appSecret && accessToken && accessSecret) {
      const client = new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
      const rw = client.readWrite;
      const res = await rw.v2.tweet(text);
      return Response.json({ ok: true, id: res.data?.id, url: res.data?.id ? `https://x.com/i/web/status/${res.data.id}` : undefined });
    }
    if (bearerToken) {
      return Response.json({ ok: false, message: "Bearer token present but cannot post. Configure X_APP_KEY/X_APP_SECRET/X_ACCESS_TOKEN/X_ACCESS_SECRET for posting." }, { status: 200 });
    }
    return Response.json({ ok: false, message: "No X credentials configured. Set X_APP_KEY/X_APP_SECRET/X_ACCESS_TOKEN/X_ACCESS_SECRET." }, { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Failed to post" }), { status: 500 });
  }
}

