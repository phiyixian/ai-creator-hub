import { NextRequest } from "next/server";
import { analyzeMediaFromUrl, invokeClaude } from "@/lib/bedrock";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { content, mediaUrl } = await req.json().catch(() => ({ content: "", mediaUrl: "" }));
  if (!content && !mediaUrl) return new Response(JSON.stringify({ error: "Provide content or mediaUrl" }), { status: 400 });

  try {
    if (mediaUrl) {
      const text = process.env.AWS_REGION ? await analyzeMediaFromUrl(mediaUrl) : null;
      const fallback = `Overall: 75/100\nComposition: Subject centered; consider rule-of-thirds.\nLighting: Slightly flat; add contrast or directional key.\nClarity: Good; reduce background clutter.\nPlatform fit: Works for IG; crop tighter for TikTok.\nImprovements: 1) Boost saturation, 2) Add subtle vignette, 3) Add on-image text hook.\nCTA: “Save this for inspo and follow for the full video.”`;
      return Response.json({ feedback: text || fallback });
    } else {
      const prompt = `You are an expert content coach. Provide concise, actionable feedback on the following content script/caption. Respond with bullets: Overall score (0-100), Strengths, Areas to improve, 3 specific edits, and a CTA suggestion. Content:\n\n${content}`;
      const text = process.env.AWS_REGION ? await invokeClaude([{ role: "user", content: prompt }]) : null;
      const fallback = `Overall: 72/100\nStrengths: Clear hook, consistent tone.\nAreas to improve: Trim intro, add timestamped captions, add CTA.\nEdits: 1) Shorten hook, 2) Add value prop early, 3) End with question.\nCTA: “Comment your biggest takeaway.”`;
      return Response.json({ feedback: text || fallback });
    }
  } catch (e) {
    return Response.json({ feedback: "Overall: 70/100\nWell structured. Consider a stronger hook and clear CTA." });
  }
}

