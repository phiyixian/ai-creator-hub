// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getLogoutUrl } from "@/lib/oidc";
import { deleteSessionByToken } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const store = await cookies();

  // read + clear server-side session
  const token = store.get("session")?.value;
  if (token) {
    try { await Promise.resolve(deleteSessionByToken(token)); } catch {}
  }

  // expire browser cookie
  store.set({
    name: "session",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  // ⬇️ send user back to your login route after Cognito logout
  const loginUrl = new URL("/api/auth/cognito/login", req.url).toString();

  // Build Cognito Hosted UI logout URL -> redirects back to login
  let redirectTo: string;
  try {
    // This must be whitelisted in Cognito App Client "Sign-out URLs"
    redirectTo = await getLogoutUrl(loginUrl);
  } catch {
    // If anything goes wrong, at least go to your login route locally
    redirectTo = loginUrl;
  }

  return NextResponse.redirect(redirectTo, 302);
}
