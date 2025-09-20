import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getOidcClient, generateState, generatePkce, serializeOidcNonceCookie } from "@/lib/oidc";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const client = await getOidcClient();
  const state = generateState();
  const { codeVerifier, codeChallenge } = generatePkce();
  const returnTo = req.nextUrl.searchParams.get("returnTo");

  const cookieStore = cookies();
  cookieStore.set("oidc_nonce", serializeOidcNonceCookie({ state, codeVerifier, returnTo }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
  });

  const url = client.authorizationUrl({
    scope: "openid email phone profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return new Response(null, { status: 302, headers: { Location: url } });
}

