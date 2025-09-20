import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

export type BedrockOptions = {
  region?: string;
  modelId?: string;
};

export function createBedrockClient(options: BedrockOptions = {}) {
  const region = options.region || process.env.AWS_REGION || "ap-southeast-1";
  const client = new BedrockRuntimeClient({ region });
  return client;
}

export async function invokeClaude(messages: Array<{ role: string; content: string }>, options: BedrockOptions = {}) {
  const client = createBedrockClient(options);
  const modelId = options.modelId || process.env.BEDROCK_MODEL_ID || "amazon.nova-pro-v1:0";

  const converseMessages = (messages || []).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: [{ text: String(m.content ?? "") }],
  }));

  const res = await client.send(new ConverseCommand({
    modelId,
    messages: converseMessages,
    inferenceConfig: {
      maxTokens: 800,
      temperature: 0.3,
      topP: 0.9,
    },
  }));

  const parts = res?.output?.message?.content || [];
  const combined = parts
    .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
    .filter(Boolean)
    .join("\n");
  return String(combined || "");
}

