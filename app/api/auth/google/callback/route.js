import { NextResponse } from "next/server";

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

  const role = (state.role || "USER").toUpperCase();
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

    // 3. Construct client-safe authenticated user
    const targetDashboard =
      role === "ADMIN"
        ? "/admin/dashboard"
        : role === "TECHNICIAN"
          ? "/technician/dashboard"
          : "/user/dashboard";

    let authUser = {
      id: profile.id ? `usr-${profile.id.slice(-6)}` : `usr-${Date.now()}`,
      name: profile.name || profile.given_name || "Google User",
      displayName: profile.name || profile.given_name || "Google User",
      email: profile.email,
      phone: "",
      role: role,
      avatar: profile.picture || "",
      dashboardPath: targetDashboard,
      status: "active",
    };

    let accessToken = tokenData.id_token || tokenData.access_token;

    // 4. Try syncing with backend API if available
    try {
      const backendSync = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleUser: profile,
          role,
          idToken: tokenData.id_token,
          accessToken: tokenData.access_token,
        }),
      });
      if (backendSync.ok) {
        const syncData = await backendSync.json();
        if (syncData.user) {
          authUser = { ...authUser, ...syncData.user, role };
        }
        if (syncData.accessToken) {
          accessToken = syncData.accessToken;
        }
      }
    } catch (backendErr) {
      console.warn("[Google OAuth] Backend sync skipped, proceeding with Google verified session");
    }

    // 5. Build response and set security cookies
    const destination = `${baseUrl}${authUser.dashboardPath || targetDashboard}`;
    const response = NextResponse.redirect(destination);

    const cookieOptions = {
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: "lax",
      httpOnly: false,
    };

    // Store tokens & user session
    response.cookies.set("phidim_access_token", accessToken, cookieOptions);
    response.cookies.set("phidim_jwt_token", accessToken, cookieOptions);
    response.cookies.set(
      "phidim_auth_user",
      encodeURIComponent(JSON.stringify(authUser)),
      cookieOptions
    );

    return response;
  } catch (err) {
    console.error("[Google OAuth Callback Fatal Exception]", err);
    return NextResponse.redirect(`${baseUrl}/login?error=CallbackException`);
  }
}
