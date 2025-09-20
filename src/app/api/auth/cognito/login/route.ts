import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizationUrl } from "openid-client";
import { getOidcClient, generateState, generatePkce, serializeOidcNonceCookie, getRedirectUri } from "@/lib/oidc";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const config = await getOidcClient();
  const state = generateState();
  const { codeVerifier, codeChallenge } = await generatePkce();
  const returnTo = req.nextUrl.searchParams.get("returnTo");

  const cookieStore = await cookies();
  cookieStore.set("oidc_nonce", serializeOidcNonceCookie({ state, codeVerifier, returnTo }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
  });

  const redirectTo = buildAuthorizationUrl(config, {
    redirect_uri: getRedirectUri(),
    scope: "openid email phone profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return new Response(null, { status: 302, headers: { Location: redirectTo.toString() } });
}

