# Dashboard authorization

Password login remains at Django `/login/`. Dashboard requests verify the
`phidim_access_token` with POST `/token/verify/`, sending `{ "token": "…" }`.
Verification must return HTTP 200. The token must also contain
`token_type: "access"`, an unexpired `exp`, `user_id`, and a recognized role.

| Role | Allowed dashboards |
| --- | --- |
| `c`, `customer`, `user` | User |
| `t`, `technician` | Technician |
| `a`, `admin` | User, technician, admin |

Set `DJANGO_API_URL` in the frontend server environment to configure the
verification backend. It falls back to `NEXT_PUBLIC_DJANGO_API_URL`, then
`http://localhost:8000`. Browser login uses `NEXT_PUBLIC_DJANGO_API_URL`.
Restart Next.js after changing environment variables. Production must use a
Django URL reachable from the Next.js server; `localhost` refers to that server.

`GET /api/auth/session` is handled locally by Next.js and returns the sanitized
verified user and access-token expiry. Browser profile cookies, localStorage,
portal selection, and query parameters never authorize dashboard requests.
Cached profile fields may supply display information after verification.

Missing, expired, invalid, or unverifiable access tokens deny access. Expired
sessions require login again; automatic refresh is not implemented. Roles are
valid for the access token's lifetime, without live database role checks.
Backend data API permissions must still be enforced by Django.

Google and registration flows must provide an access token accepted by this
Django verifier. Google tokens or a selected portal role alone cannot grant a
dashboard session.

Run `node --test tests/dashboard-access.test.mjs` and `npm run build` to validate.
