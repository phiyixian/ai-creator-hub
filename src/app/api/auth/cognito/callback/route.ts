// src/app/api/auth/cognito/callback/route.ts  (add the “link” step)
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOidcClient, parseOidcNonceCookie, exchangeCode } from "@/lib/oidc";
import { findUserByEmail, createUser, createSession, upsertSocialCredential } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();

  const nonce = parseOidcNonceCookie(cookieStore.get("oidc_nonce")?.value);
  if (nonce) cookieStore.delete("oidc_nonce");

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return NextResponse.json({ error: "Missing code/state" }, { status: 400 });
  if (!nonce || nonce.state !== state) return NextResponse.json({ error: "Invalid state" }, { status: 400 });

  const client = await getOidcClient();
  const tokens = await exchangeCode({
    client,
    code,
    codeVerifier: nonce.codeVerifier,
    nonce: nonce.nonce, // ✅ required to avoid “nonce mismatch”
  });

  // Claims from ID token
  const claims = typeof (tokens as any)?.claims === "function" ? (tokens as any).claims() : {};
  const email = (claims?.email as string) || (claims?.["cognito:username"] as string) || "";
  const name =
    (claims?.name as string) ||
    (claims?.given_name && claims?.family_name ? `${claims.given_name} ${claims.family_name}` : claims?.["cognito:username"]) ||
    null;

  if (!email) return NextResponse.json({ error: "No email in ID token" }, { status: 400 });

  // Create or find user
  const emailLower = email.toLowerCase();
  let user = await Promise.resolve(findUserByEmail(emailLower));
  if (!user) user = await Promise.resolve(createUser(emailLower, name, "oidc"));

  // 🔗 Link profile to the user (store provider info)
  // For social federation, Cognito often includes an `identities` array
  const identities = (claims?.identities as any[]) || [];
  const primary = identities[0] || null;
  // Choose a platform label
  const platform = (primary?.providerName || "cognito").toString().toLowerCase();

  await Promise.resolve(
    upsertSocialCredential(user.id, platform, {
      sub: claims?.sub,
      email,
      name,
      picture: claims?.picture,
      identities,
      providerUserId: primary?.userId,
      providerName: primary?.providerName,
      providerType: primary?.providerType,
      // optional: store a snapshot of raw ID token (short-lived)
      id_token_preview: String((tokens as any)?.id_token || "").slice(0, 50) + "...",
    })
  );

  // Issue app session
  const bearer =
    ((tokens as any)?.access_token as string) ||
    ((tokens as any)?.id_token as string) ||
    "";
  const session = await Promise.resolve(createSession(user.id, bearer, 60 * 60 * 1000));

  cookieStore.set("session", session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt),
  });

  return NextResponse.redirect(new URL(nonce.returnTo || "/", req.url));
}
