import { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDoc } from "./aws/dynamo";
import crypto from "node:crypto";

const USERS_TABLE = process.env.USERS_TABLE!;
const SESSIONS_TABLE = process.env.SESSIONS_TABLE!;
const SESSION_TTL_SECONDS = parseInt(process.env.SESSION_TTL_SECONDS || "86400", 10);

export type User = {
  userId: string; email: string; name?: string | null; picture?: string | null; provider?: "cognito";
  createdAt: string; updatedAt: string; lastLoginAt: string;
};

export type Session = { token: string; userId: string; createdAt: string; expiresAt: number; };

export async function getUserById(userId: string): Promise<User | null> {
  const res = await ddbDoc.send(new GetCommand({ TableName: USERS_TABLE, Key: { userId } }));
  return (res.Item as User) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const res = await ddbDoc.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: "byEmail",
    KeyConditionExpression: "#e = :email",
    ExpressionAttributeNames: { "#e": "email" },
    ExpressionAttributeValues: { ":email": email.toLowerCase() },
    Limit: 1,
  }));
  return (res.Items?.[0] as User) || null;
}

export async function upsertUserOnLogin(input: {
  userId: string; email: string; name?: string | null; picture?: string | null;
}): Promise<User> {
  const now = new Date().toISOString();
  try {
    const item: User = {
      userId: input.userId,
      email: input.email.toLowerCase(),
      name: input.name ?? null,
      picture: input.picture ?? null,
      provider: "cognito",
      createdAt: now, updatedAt: now, lastLoginAt: now,
    };
    await ddbDoc.send(new PutCommand({
      TableName: USERS_TABLE, Item: item, ConditionExpression: "attribute_not_exists(userId)",
    }));
    return item;
  } catch (err: any) {
    if (err?.name !== "ConditionalCheckFailedException") throw err;
  }
  const update = await ddbDoc.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { userId: input.userId },
    UpdateExpression: `
      SET email=:email, #name=:name, picture=:picture, provider=:provider,
          updatedAt=:now, lastLoginAt=:now
    `,
    ExpressionAttributeNames: { "#name": "name" },
    ExpressionAttributeValues: {
      ":email": input.email.toLowerCase(),
      ":name": input.name ?? null,
      ":picture": input.picture ?? null,
      ":provider": "cognito",
      ":now": now,
    },
    ReturnValues: "ALL_NEW",
  }));
  return update.Attributes as User;
}

export function newSessionToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export async function createSession(userId: string, ttlSeconds?: number): Promise<Session> {
  const token = newSessionToken();
  const now = Date.now();
  const expiresAt = now + 1000 * (ttlSeconds || SESSION_TTL_SECONDS);
  const session: Session = { token, userId, createdAt: new Date(now).toISOString(), expiresAt };
  await ddbDoc.send(new PutCommand({ TableName: SESSIONS_TABLE, Item: session }));
  return session;
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  const res = await ddbDoc.send(new GetCommand({ TableName: SESSIONS_TABLE, Key: { token } }));
  return (res.Item as Session) || null;
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await ddbDoc.send(new DeleteCommand({ TableName: SESSIONS_TABLE, Key: { token } }));
}
