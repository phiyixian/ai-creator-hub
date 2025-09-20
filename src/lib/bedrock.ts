// src/lib/bedrock.ts
import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandInput,
  type Message,
  type ContentBlock,
  type ConversationRole,
} from "@aws-sdk/client-bedrock-runtime";

export type BedrockOptions = {
  region?: string;
  modelId?: string;               // on-demand (e.g., Claude)
  inferenceProfileArn?: string;   // Nova via ARN
  inferenceProfileId?: string;    // Nova via ID (e.g., "us.amazon.nova-pro-v1:0")
  debug?: boolean;
};

const parseArnRegion = (arn?: string) => arn?.split(":")[3];

export function createBedrockClient({ region }: { region: string }) {
  return new BedrockRuntimeClient({ region });
}

type AppMsg = { role: "user" | "assistant" | "system"; content: string };
type BasicMsg = { role: "user" | "assistant" | "system"; content: string };
const toTextBlock = (s: string): ContentBlock => ({ text: String(s ?? "") });


const toBedrockMessages = (msgs: AppMsg[]): Message[] =>
  msgs.map((m) => ({
    role: (m.role as ConversationRole) ?? "user",
    content: [{ text: String(m.content ?? "") } as ContentBlock],
  }));

const previewMessages = (messages: Message[]) =>
  messages.map((m, i) => ({
    i,
    role: m.role,
    contentPreview: (m.content ?? []).map((b) =>
      "text" in b ? (b.text ?? "").slice(0, 160) : `[${Object.keys(b)[0]}]`
    ),
  }));

  

/** Collect only text parts from content blocks */
function collectText(blocks: any[]): string {
  return (blocks || [])
    .map((b) => (typeof b?.text === "string" ? b.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

/** Try to parse JSON from free text (code fences, first object/array) */
function parseFirstJson(input: string): any | null {
  const raw = (input || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const m1 = raw.match(/```json\s*([\s\S]*?)\s*```/i);
    if (m1?.[1]) { try { return JSON.parse(m1[1]); } catch {} }
    const mo = raw.match(/\{[\s\S]*\}/);
    if (mo) { try { return JSON.parse(mo[0]); } catch {} }
    const ma = raw.match(/\[[\s\S]*\]/);
    if (ma) { try { return JSON.parse(ma[0]); } catch {} }
    return null;
  }
}

/** Coerce any shape into { suggestions: [...] } */
function coerceToSuggestionsObject(x: any): { suggestions: any[] } {
  if (x && typeof x === "object" && Array.isArray(x.suggestions)) {
    return { suggestions: x.suggestions };
  }
  if (Array.isArray(x)) {
    return { suggestions: x };
  }
  return { suggestions: [] };
}

/**
 * Force JSON via tool schema. If tool is ignored, falls back to parsing TEXT as JSON.
 * Always returns an object with { suggestions: [...] }.
 */
export async function invokeClaudeJSON<T extends { suggestions: any[] }>(
  messages: BasicMsg[],
  schema: any,
  options: {
    region?: string;
    modelId?: string;
    inferenceProfileId?: string;   // e.g. "us.amazon.nova-pro-v1:0"
    inferenceProfileArn?: string;
    debug?: boolean;
  } = {}
): Promise<T> {
  const debug = options.debug ?? process.env.DEBUG_BEDROCK === "1";
  const region =
    options.region ||
    (options.inferenceProfileArn ? options.inferenceProfileArn.split(":")[3] : undefined) ||
    process.env.AWS_REGION ||
    "us-east-1";

  // Split incoming messages: system -> input.system ; user/assistant -> input.messages
  const systemBlocks: ContentBlock[] = [];
  const convoMessages: Message[] = [];
  for (const m of messages || []) {
    if (m.role === "system") {
      systemBlocks.push(toTextBlock(m.content));
    } else {
      const role = (m.role as ConversationRole) ?? "user"; // only 'user' | 'assistant'
      convoMessages.push({ role, content: [toTextBlock(m.content)] });
    }
  }
  // Ensure first convo message is 'user'
  if (!convoMessages.length || convoMessages[0].role !== "user") {
    convoMessages.unshift({ role: "user", content: [toTextBlock("")] });
  }

  const client = new BedrockRuntimeClient({ region });
  const toolName = "emit_topics";

  const input: ConverseCommandInput = {
    modelId:
      options.inferenceProfileArn ||
      options.inferenceProfileId ||
      options.modelId ||
      process.env.BEDROCK_INFERENCE_PROFILE_ID ||
      process.env.BEDROCK_INFERENCE_PROFILE_ARN ||
      process.env.BEDROCK_MODEL_ID ||
      "us.amazon.nova-pro-v1:0",
    messages: convoMessages,
    inferenceConfig: { maxTokens: 800, temperature: 0.3, topP: 0.9 },
    toolConfig: {
      tools: [
        {
          toolSpec: {
            name: toolName,
            description: "Return structured topic suggestions only.",
            inputSchema: { json: schema }, // Top-level OBJECT
          },
        },
      ],
      toolChoice: { tool: { name: toolName } }, // force tool
    },
  };
  if (systemBlocks.length) (input as any).system = systemBlocks;

  if (debug) {
    console.log("[bedrock/json] >>> request", {
      region,
      modelId: input.modelId,
      systemBlocks: systemBlocks.length,
      messageCount: convoMessages.length,
      firstRole: convoMessages[0]?.role,
      firstUserHead: (convoMessages[0]?.content?.[0] as any)?.text?.slice(0, 120),
    });
  }

  const t0 = Date.now();
  const res = await client.send(new ConverseCommand(input));
  const http = res.$metadata?.httpStatusCode;
  const requestId = res.$metadata?.requestId;
  const blocks: any[] = (res.output?.message?.content ?? []) as any[];
  const stop = (res as any).stopReason;

  if (debug) {
    console.log("[bedrock/json] <<< response", {
      tookMs: Date.now() - t0,
      http,
      requestId,
      stopReason: stop,
      blockCount: blocks.length,
      blockKinds: blocks.map((b) => (b.toolUse ? "toolUse" : b.text ? "text" : Object.keys(b)[0] || "unknown")),
    });
    blocks.slice(0, 2).forEach((b, i) => {
      if (b.toolUse) {
        console.log(`[bedrock/json] block[${i}] toolUse name=`, b.toolUse?.name, "keys=", Object.keys(b.toolUse?.input || {}));
      } else if (typeof b.text === "string") {
        console.log(`[bedrock/json] block[${i}] text head=`, b.text.slice(0, 200));
      }
    });
  }

  // Preferred: toolUse
  const toolUse = blocks.find((b) => b?.toolUse)?.toolUse;
  if (toolUse?.name === toolName && typeof toolUse.input === "object") {
    const coerced = coerceToSuggestionsObject(toolUse.input) as T;
    if (debug) console.log("[bedrock/json] ✓ toolUse detected; suggestions:", Array.isArray(coerced.suggestions) ? coerced.suggestions.length : "n/a");
    return coerced;
  }

  // Fallback: parse text as JSON
  const text = collectText(blocks);
  if (debug) {
    console.warn("[bedrock/json] ! no toolUse; trying text->JSON", {
      textLen: text.length,
      head: text.slice(0, 240),
      tail: text.slice(-240),
    });
  }
  const parsed = parseFirstJson(text);
  if (parsed && typeof parsed === "object") {
    const coerced = coerceToSuggestionsObject(parsed) as T;
    if (debug) console.log("[bedrock/json] ✓ parsed JSON from text; suggestions:", Array.isArray(coerced.suggestions) ? coerced.suggestions.length : "n/a");
    return coerced;
  }

  const err: any = new Error("No toolUse and no parseable JSON text");
  err.stage = "toolUse";
  err.reason = "Model ignored tool and did not return parseable JSON";
  err.requestId = requestId;
  throw err;
}

export async function invokeClaude(
  messages: Array<{ role: string; content: string }>,
  options: BedrockOptions = {}
): Promise<string> {
  const debug = options.debug ?? process.env.DEBUG_BEDROCK === "1";

  const profileId =
    options.inferenceProfileId || process.env.BEDROCK_INFERENCE_PROFILE_ID;
  const profileArn =
    options.inferenceProfileArn || process.env.BEDROCK_INFERENCE_PROFILE_ARN;

  const onDemandModelId =
    options.modelId ||
    process.env.BEDROCK_MODEL_ID ||
    "anthropic.claude-3-5-sonnet-20240620-v1:0";

  // Prefer profile ARN; else profile ID; else on-demand modelId
  const usingProfileArn = Boolean(profileArn);
  const usingProfileId = !usingProfileArn && Boolean(profileId);

  // If using a profile ARN, force client region to the ARN’s region; else use provided/default
  const region =
    (usingProfileArn && parseArnRegion(profileArn)) ||
    options.region ||
    process.env.AWS_REGION ||
    "us-east-1";

  const client = createBedrockClient({ region });

  // Normalize your inputs → AppMsg → Bedrock Message
  const appMsgs: AppMsg[] = (messages || []).map((m) => ({
    role: m.role === "assistant" || m.role === "system" ? (m.role as any) : "user",
    content: m.content ?? "",
  }));

  const converseMessages: Message[] = toBedrockMessages(appMsgs); // <-- DEFINED HERE

  // Ensure first turn is 'user'
  if (!converseMessages.length || converseMessages[0].role !== "user") {
    converseMessages.unshift({ role: "user", content: [{ text: "" }] });
  }

  // Choose the effective identifier for modelId
const effectiveModelId =
  (usingProfileArn && profileArn!) ||
  (usingProfileId && profileId!) ||
  onDemandModelId;

// Build the input with a required `modelId`
const cmdInput: ConverseCommandInput = {
  modelId: effectiveModelId,                // <-- always present
  messages: converseMessages,
  inferenceConfig: { maxTokens: 800, temperature: 0.3, topP: 0.9 },
};


  if (debug) {
    console.log("[bedrock] >>> request", {
      region,
      usingProfileArn,
      usingProfileId,
      idOrArn: profileArn || profileId || onDemandModelId,
      msgCount: converseMessages.length,
      messages: previewMessages(converseMessages),
      inferenceConfig: cmdInput.inferenceConfig,
    });
  }

  const t0 = Date.now();
  try {
    const res = await client.send(new ConverseCommand(cmdInput));
    const parts = res.output?.message?.content ?? [];
    const combined = parts
      .map((b) => ("text" in b ? b.text : ""))
      .filter(Boolean)
      .join("\n");

    if (debug) {
      console.log("[bedrock] <<< response", {
        tookMs: Date.now() - t0,
        http: res.$metadata?.httpStatusCode,
        requestId: res.$metadata?.requestId,
        textLen: combined.length,
      });
    }

    return combined || "";
  } catch (e: any) {
    console.error("[bedrock] !!! error", {
      tookMs: Date.now() - t0,
      region,
      usingProfileArn,
      usingProfileId,
      idOrArn: profileArn || profileId || onDemandModelId,
      name: e?.name,
      message: e?.message,
      status: e?.$metadata?.httpStatusCode,
      requestId: e?.$metadata?.requestId,
    });
    throw e;
  }
}
