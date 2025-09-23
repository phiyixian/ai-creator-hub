// src/app/api/ai/unsplash/route.ts
import { NextResponse } from "next/server";

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function POST(request: Request) {
  if (!UNSPLASH_KEY) {
    return NextResponse.json({ error: "Missing Unsplash key" }, { status: 500 });
  }

  try {
    const { prompt } = await request.json();

    // Use Unsplash search endpoint (first result) then fall back to random
    const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(prompt || "abstract")} &per_page=1`;
    const res = await fetch(searchUrl, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_KEY}`,
      },
    });

    if (!res.ok) {
      // fallback to random photo
      const rand = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(prompt || "abstract")}`, {
        headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
      });
      if (!rand.ok) throw new Error("Unsplash fallback failed");
      const randJson = await rand.json();
      return NextResponse.json({ url: randJson.urls.full });
    }

    const json = await res.json();
    const results = json.results || [];
    if (results.length === 0) {
      // fallback to random
      const rand = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(prompt || "abstract")}`, {
        headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
      });
      if (!rand.ok) throw new Error("Unsplash fallback failed");
      const randJson = await rand.json();
      return NextResponse.json({ url: randJson.urls.full });
    }

    const image = results[0];
    // return full size url (client can add query params for resizing)
    return NextResponse.json({ url: image.urls.full });
  } catch (error) {
    console.error("Unsplash error:", error);
    return NextResponse.json({ error: "Failed to fetch image from Unsplash" }, { status: 500 });
  }
}
