import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/token";
import { dashboardPathFor } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "";

const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.CLIENT_ID_SECRET ||
  "";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://service.phidimservice.com.np";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = origin || "http://localhost:3000";

  if (error) {
    console.error("[Google OAuth Error]", error);
    return NextResponse.redirect(`${baseUrl}/login?error=OAuthAccessDenied`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=NoCodeProvided`);
  }

  let state = {};
  try {
    if (stateRaw) {
      state = JSON.parse(Buffer.from(stateRaw, "base64").toString("utf-8"));
    }
  } catch (e) {
    console.warn("[Google OAuth] Could not parse state, using defaults");
  }

  // Portal selection is a display preference, never an account permission.
  const redirectUri =
    state.redirectUri ||
    process.env.GOOGLE_CALLBACK_URL ||
    `${baseUrl}/api/auth/google/callback`;

  try {
    // 1. Exchange authorization code with Google OAuth token endpoint
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("[Google OAuth] Token exchange error:", tokenData);
      return NextResponse.redirect(`${baseUrl}/login?error=TokenExchangeFailed`);
    }

    // 2. Fetch Google user profile
    const userProfileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const profile = await userProfileResponse.json();

    if (!userProfileResponse.ok || !profile.email) {
      console.error("[Google OAuth] Profile fetch error:", profile);
      return NextResponse.redirect(`${baseUrl}/login?error=ProfileFetchFailed`);
    }

    // Only a Django-issued access token can establish a dashboard session.
    const backendSync = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleUser: profile, idToken: tokenData.id_token, accessToken: tokenData.access_token }),
      cache: "no-store", signal: AbortSignal.timeout(5000),
    });
    if (!backendSync.ok) return NextResponse.redirect(`${baseUrl}/login?error=BackendSessionRequired`);
    const syncData = await backendSync.json();
    const accessToken = syncData.access || syncData.accessToken || syncData.token;
    const decoded = await verifyAccessToken(accessToken);
    if (!decoded) return NextResponse.redirect(`${baseUrl}/login?error=BackendSessionRequired`);
    const destination = `${baseUrl}${dashboardPathFor(decoded.role)}`;
    const response = NextResponse.redirect(destination);

    const cookieOptions = {
      path: "/",
      maxAge: Math.max(0, Math.floor(decoded.exp - Date.now() / 1000)),
      sameSite: "lax",
      httpOnly: false,
      secure: new URL(baseUrl).protocol === "https:",
    };

    // Store tokens & user session
    response.cookies.set("phidim_access_token", accessToken, cookieOptions);
    response.cookies.set("phidim_jwt_token", accessToken, cookieOptions);


    return response;
  } catch (err) {
    console.error("[Google OAuth Callback Fatal Exception]", err);
    return NextResponse.redirect(`${baseUrl}/login?error=CallbackException`);
  }
}
