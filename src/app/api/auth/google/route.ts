import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createUser, findUserByEmail, getSessionByToken } from "@/lib/db";
import { createUserSession } from "@/lib/utils";

export const runtime = "nodejs";

const GOOGLE_AUTH_ROOT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function getBaseUrl(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const returnTo = url.searchParams.get("returnTo") || "/dashboard";

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: "Google OAuth not configured" }), { status: 400 });
  }

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/google`;

  if (!code) {
    const auth = new URL(GOOGLE_AUTH_ROOT);
    auth.searchParams.set("client_id", clientId);
    auth.searchParams.set("redirect_uri", redirectUri);
    auth.searchParams.set("response_type", "code");
    auth.searchParams.set("scope", "openid email profile");
    auth.searchParams.set("access_type", "offline");
    auth.searchParams.set("prompt", "consent");
    auth.searchParams.set("state", returnTo);
    return Response.redirect(auth.toString());
  }

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token as string | undefined;
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Failed to exchange Google code" }), { status: 400 });
    }

    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();
    const email = String(profile.email || "").toLowerCase();
    const name = profile.name || null;
    if (!email) {
      return new Response(JSON.stringify({ error: "Google profile missing email" }), { status: 400 });
    }

    let user = findUserByEmail(email);
    if (!user) {
      // Create a passwordless user entry
      user = createUser(email, name, "google-oauth");
    }

    const session = createUserSession(user.id);
    const cookieStore = cookies();
    cookieStore.set("session", session.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(session.expiresAt),
    });

    const state = url.searchParams.get("state");
    const next = state || returnTo || "/dashboard";
    return Response.redirect(`${baseUrl}${next}`);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Google sign-in failed" }), { status: 500 });
  }
}

