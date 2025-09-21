import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOidcClient, parseOidcNonceCookie, exchangeCode, getRedirectUri } from "@/lib/oidc";
import { upsertUserOnLogin, createSession } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const store = await cookies();
  const nonceCookie = parseOidcNonceCookie(store.get("oidc_nonce")?.value);
  store.set({ name: "oidc_nonce", value: "", path: "/", httpOnly: true, sameSite: "lax", expires: new Date(0) });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return new NextResponse("Missing code/state", { status: 400 });
  if (!nonceCookie || nonceCookie.state !== state) return new NextResponse("Invalid state", { status: 400 });

  const client = await getOidcClient();
  const tokens = await exchangeCode({
    client,
    code,
    codeVerifier: nonceCookie.codeVerifier,
    nonce: nonceCookie.nonce,
  });

  const claims = tokens.claims() as Record<string, any>;
  const email = String(claims.email || "");
  const userId = String(claims.sub || "");
  const name = (claims.name as string) || (claims["cognito:username"] as string) || null;
  const picture = (claims.picture as string) || null;
  if (!userId || !email) return new NextResponse("Missing sub/email", { status: 400 });

  const user = await upsertUserOnLogin({ userId, email, name, picture });

  const session = await createSession(user.userId);
  store.set({
    name: "session",
    value: session.token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt),
  });

  const redirectTo = nonceCookie.returnTo || "/dashboard";
  return NextResponse.redirect(new URL(redirectTo, getRedirectUri()).toString(), 302);
}
