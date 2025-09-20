import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = /^\/(inspire|create|release|track|profile)(\/.*)?$/.test(pathname);
  if (!isProtected) return NextResponse.next();
  const hasSession = req.cookies.get("session");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/api/auth/cognito/login";
    url.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/inspire/:path*", "/create/:path*", "/release/:path*", "/track/:path*", "/profile/:path*"],
};

