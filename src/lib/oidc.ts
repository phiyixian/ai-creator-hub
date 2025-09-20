import { generators, Issuer, Client, TokenSet } from "openid-client";

let cachedClient: Client | null = null;

export async function getOidcClient(): Promise<Client> {
  if (cachedClient) return cachedClient;
  const issuerUrl = process.env.COGNITO_ISSUER as string;
  const domain = process.env.COGNITO_DOMAIN as string | undefined;
  const clientId = process.env.COGNITO_CLIENT_ID as string;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET as string;
  if (!issuerUrl || !clientId || !clientSecret) {
    throw new Error("Missing Cognito OIDC env vars");
  }
  const discoveryUrl = domain ? `${domain.replace(/\/$/, "")}/.well-known/openid-configuration` : issuerUrl;
  const issuer = await Issuer.discover(discoveryUrl);
  cachedClient = new issuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [process.env.COGNITO_REDIRECT_URI as string],
    response_types: ["code"],
  });
  return cachedClient;
}

export function generateState(): string {
  return generators.state();
}

export function generatePkce(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
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

export async function exchangeCode(params: {
  client: Client;
  code: string;
  codeVerifier: string;
}): Promise<TokenSet> {
  const { client, code, codeVerifier } = params;
  const tokens = await client.callback(getRedirectUri(), { code }, { code_verifier: codeVerifier });
  return tokens;
}

