import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getOidcClient, parseOidcNonceCookie } from "@/lib/oidc";
import { authorizationCodeGrant } from "openid-client";
import { findUserByEmail, createUser, createSession } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const nonceCookie = parseOidcNonceCookie(cookieStore.get("oidc_nonce")?.value);
  cookieStore.delete("oidc_nonce");

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return new Response("Missing code/state", { status: 400 });
  }
  if (!nonceCookie || nonceCookie.state !== state) {
    return new Response("Invalid state", { status: 400 });
  }

  const config = await getOidcClient();
  const tokens = await authorizationCodeGrant(
    config,
    new URL(req.url),
    {
      pkceCodeVerifier: nonceCookie.codeVerifier,
      expectedState: state,
    },
  );

  const idToken = tokens.claims();
  if (!idToken) {
    return new Response("No ID token returned", { status: 400 });
  }
  const email = ((idToken as any).email as string) || "";
  const name = (((idToken as any).name as string) || (idToken as any)["cognito:username"] as string) || null;
  if (!email) {
    return new Response("No email in ID token", { status: 400 });
  }

  let user = findUserByEmail(email.toLowerCase());
  if (!user) {
    user = createUser(email.toLowerCase(), name, "oidc");
  }

  const session = createSession(user.id, tokens.access_token || tokens.id_token || "", 60 * 60 * 1000);
  cookieStore.set("session", session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });

  const redirectTo = nonceCookie.returnTo || "/profile";
  return new Response(null, { status: 302, headers: { Location: redirectTo } });
}

