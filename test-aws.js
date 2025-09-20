const { BedrockRuntimeClient, ConverseCommand } = require("@aws-sdk/client-bedrock-runtime");

async function testBedrock() {
  try {
    console.log("Testing AWS Bedrock connection...");
    console.log("AWS_REGION:", process.env.AWS_REGION);
    console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "Set" : "Not set");
    console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "Set" : "Not set");
    console.log("BEDROCK_MODEL_ID:", process.env.BEDROCK_MODEL_ID);

    const client = new BedrockRuntimeClient({ 
      region: process.env.AWS_REGION || "ap-southeast-1"
    });

    const command = new ConverseCommand({
      modelId: process.env.BEDROCK_MODEL_ID || "amazon.nova-pro-v1:0",
      messages: [{
        role: "user",
        content: [{ text: "Hello, can you respond with just 'Test successful'?" }]
      }],
      inferenceConfig: {
        maxTokens: 10,
        temperature: 0.1,
      },
    });

    const response = await client.send(command);
    console.log("✅ Bedrock connection successful!");
    console.log("Response:", response.output?.message?.content);
  } catch (error) {
    console.error("❌ Bedrock connection failed:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
  }
}

testBedrock();
