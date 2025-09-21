// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getLogoutUrl } from "@/lib/oidc";
import { deleteSessionByToken } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const store = await cookies();

  // Clear server-side session
  const token = store.get("session")?.value;
  if (token) {
    try { await Promise.resolve(deleteSessionByToken(token)); } catch {}
  }

  // Expire browser cookies
  const cookieBase = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  };
  store.set({ name: "session", value: "", ...cookieBase });
  // also clear the OIDC nonce cookie if you set one during login
  store.set({ name: "oidc_nonce", value: "", ...cookieBase });

  // After Cognito logout, send user back to your login route
  const loginUrl = new URL("/api/auth/cognito/login", req.url).toString();

  let redirectTo: string;
  try {
    // Must be whitelisted in Cognito App Client “Sign-out URLs”
    redirectTo = await getLogoutUrl(loginUrl);
  } catch {
    redirectTo = loginUrl; // fallback
  }

  // If the caller asked for JSON (fetch), return the URL to navigate to
  const wantsJson = new Headers(req.headers).get("accept")?.includes("application/json");
  if (wantsJson) {
    return NextResponse.json(
      { redirectTo },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Normal browser navigation -> redirect
  return NextResponse.redirect(redirectTo, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
