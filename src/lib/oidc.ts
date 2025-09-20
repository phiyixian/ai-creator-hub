import { discovery, Configuration, randomState, randomPKCECodeVerifier, calculatePKCECodeChallenge } from "openid-client";

let cachedConfig: Configuration | null = null;

export async function getOidcClient(): Promise<Configuration> {
  if (cachedConfig) return cachedConfig;
  const issuerUrl = process.env.COGNITO_ISSUER as string;
  const domain = process.env.COGNITO_DOMAIN as string | undefined;
  const clientId = process.env.COGNITO_CLIENT_ID as string;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET as string;
  if (!issuerUrl || !clientId || !clientSecret) {
    throw new Error("Missing Cognito OIDC env vars");
  }
  // Supports either an Issuer Identifier (recommended) or a direct discovery URL.
  const discoveryUrl = domain ? `${domain.replace(/\/$/, "")}/.well-known/openid-configuration` : issuerUrl;
  cachedConfig = await discovery(new URL(discoveryUrl), clientId, clientSecret);
  return cachedConfig;
}

export function generateState(): string {
  return randomState();
}

export async function generatePkce(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = randomPKCECodeVerifier();
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}

export type OidcSessionNonce = {
  state: string;
  codeVerifier: string;
  returnTo?: string | null;
};

export function serializeOidcNonceCookie(value: OidcSessionNonce): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function parseOidcNonceCookie(value: string | undefined | null): OidcSessionNonce | null {
  if (!value) return null;
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    return JSON.parse(json) as OidcSessionNonce;
  } catch {
    return null;
  }
}

export function getRedirectUri(): string {
  return process.env.COGNITO_REDIRECT_URI as string;
}

