// src/app/api/auth/cognito/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthUrl, serializeOidcNonceCookie } from "@/lib/oidc";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const returnTo = req.nextUrl.searchParams.get("returnTo") || "/";
  const { url, nonce } = await buildAuthUrl({ returnTo: req.nextUrl.searchParams.get("returnTo") || "/" });
console.log("[oidc/login] authorize url:", new URL(url).origin + new URL(url).pathname); // hides query
console.log("[oidc/login] params:", Object.fromEntries(new URL(url).searchParams)); // state, scope, redirect_uri, etc.


  (await cookies()).set("oidc_nonce", serializeOidcNonceCookie(nonce), {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production", // false on localhost is fine
  path: "/",
  maxAge: 600,
});
return NextResponse.redirect(url, 302);

}
