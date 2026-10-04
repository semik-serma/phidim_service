import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request) {
  const session = await getSessionUser({ request });
  return NextResponse.json(
    session ? { success: true, user: session.user, expiresAt: session.decoded.exp * 1000 } : { success: false, user: null },
    { status: session ? 200 : 401, headers: { "Cache-Control": "no-store" } }
  );
}
