import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getOidcClient, parseOidcNonceCookie, exchangeCode } from "@/lib/oidc";
import { findUserByEmail, createUser, createSession } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
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

  const client = await getOidcClient();
  const tokens = await exchangeCode({ client, code, codeVerifier: nonceCookie.codeVerifier });

  const idToken = tokens.claims();
  const email = (idToken.email as string) || "";
  const name = ((idToken.name as string) || idToken["cognito:username"] as string) || null;
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

