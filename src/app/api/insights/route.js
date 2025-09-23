import { NextResponse } from "next/server";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

export async function POST(req) {
  try {
    const { analytics } = await req.json();
    console.log("📥 Received analytics:", analytics);

    const prompt = `
    You are a social media strategist. Analyze the following dataset:
    ${JSON.stringify(analytics, null, 2)}

    Respond with ONLY valid JSON, no explanations, no markdown fences.
    Format:
    {
      "best_posting_times": ["10:00", "18:00"],
      "recommended_platforms": ["instagram", "tiktok"],
      "content_type_focus": "Video posts perform best",
      "engagement_tips": [
        "Post consistently 3-4 times per week",
        "Use trending hashtags",
        "Engage with comments within 1 hour",
        "Cross-post short-form content to multiple platforms"
      ]
    }
    `;

    const command = new InvokeModelCommand({
      modelId: "amazon.nova-pro-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [{ text: prompt }],
          },
        ],
        inferenceConfig: { maxTokens: 500, temperature: 0.3 },
      }),
    });

    const response = await client.send(command);

    // Dump raw body string
    const rawBody = new TextDecoder().decode(response.body);
    console.log("🟢 Raw response string from Bedrock:", rawBody);

    let responseBody;
    try {
      responseBody = JSON.parse(rawBody);
      console.log("🟢 Parsed JSON response:", responseBody);
    } catch (e) {
      console.error("❌ Failed to parse rawBody as JSON:", e);
      return NextResponse.json({ error: "Invalid JSON from Bedrock", raw: rawBody }, { status: 500 });
    }

    const outputText =
      responseBody.output?.message?.content?.map(c => c.text).join("\n") || "";

    console.log("🟢 Extracted text:", outputText);

    let parsed;
    try {
      parsed = JSON.parse(outputText);
    } catch (e) {
      console.error("❌ JSON.parse failed on model output:", e);
      return NextResponse.json(
        { error: "Model returned invalid JSON", raw: outputText },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("❌ Bedrock error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
