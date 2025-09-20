import { NextRequest } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { title, description, videoUrl } = await req.json().catch(() => ({ title: "", description: "", videoUrl: "" }));
  if (!videoUrl) return new Response(JSON.stringify({ error: "Missing videoUrl" }), { status: 400 });

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  try {
    // Use OAuth2 with refresh token (user-consented) which is required for YouTube uploads.
    if (!clientId || !clientSecret || !refreshToken) {
      return Response.json({ ok: false, message: "Set GOOGLE_CLIENT_ID/SECRET and GOOGLE_REFRESH_TOKEN for YouTube" }, { status: 200 });
    }
    const oauth2 = new google.auth.OAuth2({ clientId, clientSecret });
    oauth2.setCredentials({ refresh_token: refreshToken });
    const yt = google.youtube({ version: "v3", auth: oauth2 });

    // Fetch the video from URL and upload as a stream
    const res = await fetch(videoUrl);
    if (!res.ok || !res.body) return new Response(JSON.stringify({ error: "Cannot fetch video" }), { status: 400 });

    const insert = await yt.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: { title: title || "Uploaded via API", description: description || "" },
        status: { privacyStatus: "unlisted" },
      },
      media: { body: res.body as any },
    } as any);

    return Response.json({ ok: true, id: insert.data?.id, url: insert.data?.id ? `https://youtube.com/watch?v=${insert.data.id}` : undefined });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "YouTube upload failed" }), { status: 500 });
  }
}

