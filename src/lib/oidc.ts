// src/lib/oidc.ts
import openid from "openid-client";
const { Issuer, generators } = openid;

type BaseClient = InstanceType<typeof Issuer["prototype"]["Client"]>;
let cachedClient: BaseClient | null = null;
const DEBUG_OIDC = process.env.DEBUG_OIDC === "1";

function required(name: string, v?: string | null) {
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export function getRedirectUri(): string {
  return required("COGNITO_REDIRECT_URI", process.env.COGNITO_REDIRECT_URI);
}

function hostedBaseFromIssuer(discovered: openid.Issuer): string {
  if (process.env.COGNITO_DOMAIN) return process.env.COGNITO_DOMAIN.replace(/\/+$/, "");
  const anyEndpoint =
    discovered.metadata.authorization_endpoint ||
    discovered.metadata.token_endpoint ||
    discovered.metadata.end_session_endpoint;
  if (!anyEndpoint) throw new Error("Could not derive Hosted UI domain");
  const u = new URL(anyEndpoint);
  return `${u.protocol}//${u.host}`;
}

export async function getOidcClient(): Promise<BaseClient> {
  if (cachedClient) return cachedClient;

  const issuerBase = (process.env.COGNITO_ISSUER || "").replace(/\/+$/, "");
  const domainBase = (process.env.COGNITO_DOMAIN || "").replace(/\/+$/, "");
  const client_id = required("COGNITO_CLIENT_ID", process.env.COGNITO_CLIENT_ID);
  const client_secret = required("COGNITO_CLIENT_SECRET", process.env.COGNITO_CLIENT_SECRET);
  const redirect_uri = getRedirectUri();

  if (!issuerBase && !domainBase) throw new Error("Set either COGNITO_ISSUER or COGNITO_DOMAIN");

  const candidates: string[] = [];
  if (domainBase) {
    candidates.push(`${domainBase}/.well-known/openid-configuration`);
    candidates.push(`${domainBase}/oauth2/.well-known/openid-configuration`);
  }
  if (issuerBase) candidates.push(`${issuerBase}/.well-known/openid-configuration`);

  if (DEBUG_OIDC) console.log("[oidc] discovery candidates:", candidates);

  let discovered: openid.Issuer | null = null;
  let lastErr: any = null;

  for (const url of candidates) {
    try {
      if (DEBUG_OIDC) console.log("[oidc] discovering:", url);
      discovered = await Issuer.discover(url);
      if (DEBUG_OIDC) {
        console.log("[oidc] discovered issuer:", discovered.issuer);
        console.log("[oidc] token_endpoint:", discovered.metadata.token_endpoint);
      }
      break;
    } catch (e: any) {
      lastErr = e;
      console.warn("[oidc] discover failed:", url, e?.name, e?.message || e);
    }
  }
  if (!discovered) {
    const detail = (lastErr && `${lastErr.name}: ${lastErr.message}`) || "Unknown";
    throw new Error(`OIDC discovery failed. Last error: ${detail}`);
  }

  const client: any = new (discovered as any).Client({
    client_id,
    client_secret,
    redirect_uris: [redirect_uri],
    response_types: ["code"],
  });

  cachedClient = client as BaseClient;
  return cachedClient!;
}

/* ---------- Nonce cookie helpers ---------- */

export type OidcSessionNonce = {
  state: string;
  codeVerifier: string;
  nonce: string;              // <-- add this
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

/* ---------- Login / Callback helpers ---------- */

export async function buildAuthUrl(params?: { scope?: string; returnTo?: string | null }) {
  const client = await getOidcClient();
  const scope = params?.scope || "openid email profile";
  const state = generators.state();
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  const nonce = generators.nonce();                      // <-- create a nonce

  const base = hostedBaseFromIssuer((client as any).issuer);
  const redirect_uri = getRedirectUri();

  const url = client.authorizationUrl({
    scope,
    state,
    redirect_uri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    nonce,                                              // <-- send nonce to /authorize
  });

  // Ensure Hosted UI origin if needed
  const u = new URL(url);
  const want = new URL(base);
  if (u.host !== want.host) {
    u.protocol = want.protocol;
    u.host = want.host;
  }

  return {
    url: u.toString(),
    nonce: <OidcSessionNonce>{ state, codeVerifier, nonce, returnTo: params?.returnTo || null },
  };
}

export async function exchangeCode(args: {
  client: BaseClient;
  code: string;
  codeVerifier: string;
  nonce?: string;                 // <-- accept nonce here
}) {
  const redirect_uri = getRedirectUri();
  const tokens = await (args.client as any).callback(
    redirect_uri,
    { code: args.code },
    {
      code_verifier: args.codeVerifier,
      nonce: args.nonce,         // <-- and validate against the ID token's nonce
    }
  );
  return tokens;
}


/** Build Cognito logout URL */
export async function getLogoutUrl(logoutRedirectUri?: string) {
  const client = await getOidcClient();
  const base = hostedBaseFromIssuer((client as any).issuer);
  const client_id = required("COGNITO_CLIENT_ID", process.env.COGNITO_CLIENT_ID);
  const postLogout = logoutRedirectUri || process.env.COGNITO_LOGOUT_REDIRECT_URI || "/";

  const u = new URL(`${base}/logout`);
  u.searchParams.set("client_id", client_id);
  u.searchParams.set("logout_uri", postLogout);
  return u.toString();
}
