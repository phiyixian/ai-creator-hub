import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export type BedrockOptions = {
  region?: string;
  modelId?: string;
};

export function createBedrockClient(options: BedrockOptions = {}) {
  const region = options.region || process.env.AWS_REGION || "us-east-1";
  const client = new BedrockRuntimeClient({ region });
  return client;
}

export async function invokeClaude(messages: Array<{ role: string; content: string }>, options: BedrockOptions = {}) {
  const client = createBedrockClient(options);
  const modelId = options.modelId || process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20241022-v2:0";
  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 800,
    messages,
  };
  const res = await client.send(new InvokeModelCommand({
    contentType: "application/json",
    accept: "application/json",
    modelId,
    body: JSON.stringify(body),
  }));
  const json = JSON.parse(Buffer.from(res.body!).toString());
  const text = json?.content?.[0]?.text || json?.content?.[0]?.content?.[0]?.text || "";
  return String(text || "");
}

