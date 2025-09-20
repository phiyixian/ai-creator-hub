import { cookies } from "next/headers";
import { deleteSessionByToken } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (token) {
    try {
      deleteSessionByToken(token);
    } catch {}
  }
  cookieStore.delete("session");
  const domain = process.env.COGNITO_DOMAIN;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const postLogout = process.env.COGNITO_LOGOUT_REDIRECT_URI || "/";
  if (domain && clientId) {
    const url = new URL("/logout", domain);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("logout_uri", postLogout);
    return new Response(null, { status: 302, headers: { Location: url.toString() } });
  }
  return new Response(null, { status: 302, headers: { Location: "/" } });
}

