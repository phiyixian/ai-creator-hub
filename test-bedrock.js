// test-bedrock.js
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

async function test() {
  try {
    const command = new InvokeModelCommand({
      modelId: "amazon.nova-pro-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              { text: "Analyze social media growth trends for Instagram, TikTok, and YouTube." }
            ]
          }
        ],
        inferenceConfig: {
          maxTokens: 500,
          temperature: 0.7
        }
      })
    });

    const response = await client.send(command);

    // Decode & parse Bedrock response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log("✅ Response:", JSON.stringify(responseBody, null, 2));
  } catch (err) {
    console.error("❌ Bedrock error:", err);
  }
}

test();
