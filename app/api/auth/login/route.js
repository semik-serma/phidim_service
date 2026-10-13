export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const responseHeaders = { "Cache-Control": "no-store" };

export async function POST(request) {
  let credentials;
  try {
    credentials = await request.json();
  } catch {
    return Response.json({ detail: "Invalid login request." }, { status: 400, headers: responseHeaders });
  }
  if (typeof credentials?.email !== "string" || typeof credentials?.password !== "string") {
    return Response.json({ detail: "Email and password are required." }, { status: 400, headers: responseHeaders });
  }

  // Resolve localhost on the Next.js host, including when the browser uses a tunnel.
  // Use the same backend precedence as session token verification.
  const base = (process.env.DJANGO_API_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000").replace(/\/+$/, "");
  try {
    const upstream = await fetch(`${base}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    const data = await upstream.json();
    return Response.json(data, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json(
      { detail: "Could not reach the login backend. Make sure Django is running and DJANGO_API_URL points to it on the frontend server." },
      { status: 502, headers: responseHeaders },
    );
  }
}
