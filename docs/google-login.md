Google login is available on /system and /login.

Set GOOGLE_CLIENT_ID, GOOGLE_CALLBACK_URL and GOOGLE_AUTH_BACKEND_URL in the frontend .env file. Existing Google credentials were moved from .env.local to .env; both files are ignored by Git. Restart the development server after changing environment variables.

For local development register http://localhost:3000/auth/google/callback as an authorized redirect URI in the Google Cloud OAuth web application. For production use the HTTPS site URL in both Google Cloud and GOOGLE_CALLBACK_URL.

The frontend starts authorization through /api/auth/google/start, stores a random state in a ten-minute HttpOnly cookie, and handles the callback on the server. The callback sends POST { code } to GOOGLE_AUTH_BACKEND_URL (default: the Django base URL plus /api/auth/google/). No Google credentials are included in browser JavaScript.

The backend must exchange the code with Google using GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and the exact same redirect URI from its own server environment. It must return a Django access JWT containing user_id, token_type=access and exp (with an optional role claim); access/accessToken/token response keys are supported, with optional refresh/refreshToken. If refresh is empty, the callback reads the backend refresh cookie and stores it in an HttpOnly phidim_refresh_token cookie. The frontend verifies the token with the existing Django /token/verify/ endpoint before creating the session. Set DJANGO_API_URL to the backend that verifies these tokens. Backend cookie-only responses do not satisfy the existing dashboard JWT session contract.

Account permissions and dashboard destinations come from the verified backend JWT. When the JWT omits role, the frontend fetches GET /api/auth/user/ with the verified Bearer token and requires a matching pk/id and a valid role. Set DJANGO_AUTH_USER_URL if the backend user-details endpoint has a different URL. This lookup also runs on subsequent protected requests; it fails closed if user details cannot be verified. A login initiated with ?redirect=/ returns home after successful authentication.

OAuth reference: https://developers.google.com/identity/protocols/oauth2/web-server
