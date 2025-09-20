import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createUser, findUserByEmail } from "@/lib/db";
import { createUserSession } from "@/lib/utils";

export const runtime = "nodejs";

function getBaseUrl(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "login"; // login | callback | logout

  const clientId = process.env.COGNITO_CLIENT_ID || "";
  const clientSecret = process.env.COGNITO_CLIENT_SECRET || ""; // not used in implicit auth code exchange here
  const issuer = process.env.COGNITO_ISSUER || ""; // e.g. https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_x0ME18GVO
  const domain = process.env.COGNITO_DOMAIN || ""; // e.g. your-domain.auth.ap-southeast-1.amazoncognito.com
  const scopes = process.env.COGNITO_SCOPES || "openid email profile";
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/cognito?action=callback`;
  const returnTo = url.searchParams.get("returnTo") || "/dashboard";

  if (!clientId || !domain) {
    return new Response(JSON.stringify({ error: "Cognito not configured" }), { status: 400 });
  }

  if (action === "login") {
    const authorize = new URL(`https://${domain}/oauth2/authorize`);
    authorize.searchParams.set("client_id", clientId);
    authorize.searchParams.set("redirect_uri", redirectUri);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("scope", scopes);
    authorize.searchParams.set("state", returnTo);
    return Response.redirect(authorize.toString());
  }

  if (action === "callback") {
    const code = url.searchParams.get("code") || "";
    if (!code) return new Response(JSON.stringify({ error: "Missing code" }), { status: 400 });

    const tokenUrl = `https://${domain}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
    });
    if (clientSecret) body.set("client_secret", clientSecret);

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token as string | undefined;
    const idToken = tokenJson.id_token as string | undefined;
    if (!accessToken && !idToken) return new Response(JSON.stringify({ error: "Token exchange failed" }), { status: 400 });

    // Resolve user info (prefer /oauth2/userInfo)
    let email = "";
    let name: string | null = null;
    try {
      const userInfoRes = await fetch(`https://${domain}/oauth2/userInfo`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (userInfoRes.ok) {
        const info = await userInfoRes.json();
        email = String(info.email || "").toLowerCase();
        name = info.name || null;
      }
    } catch {}

    if (!email) {
      // fallback: decode id_token (without verification for brevity)
      try {
        const payload = idToken?.split(".")?.[1];
        if (payload) {
          const json = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
          email = String(json.email || "").toLowerCase();
          name = json.name || json["cognito:username"] || null;
        }
      } catch {}
    }

    if (!email) return new Response(JSON.stringify({ error: "Email not found in tokens" }), { status: 400 });

    let user = findUserByEmail(email);
    if (!user) user = createUser(email, name, "cognito-oauth");

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
  }

  if (action === "logout") {
    // Clear cookie; optional: hit Cognito logout endpoint
    const cookieStore = cookies();
    cookieStore.set("session", "", { httpOnly: true, sameSite: "lax", path: "/", expires: new Date(0) });
    const logoutUrl = new URL(`https://${domain}/logout`);
    logoutUrl.searchParams.set("client_id", clientId);
    logoutUrl.searchParams.set("logout_uri", `${baseUrl}/login`);
    return Response.redirect(logoutUrl.toString());
  }

  return new Response("Not found", { status: 404 });
}

