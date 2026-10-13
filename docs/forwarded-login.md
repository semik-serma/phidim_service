# Login through a forwarded port

Password login uses `/api/auth/login` on the frontend origin. Next.js sends the
request to Django's `/login/` endpoint from the development computer. This works
with both `http://localhost:3000` and the HTTPS URL for forwarded port 3000.

1. Keep Django running on port 8000 on the development computer.
2. Set `DJANGO_API_URL=http://127.0.0.1:8000` in `.env.local` (or use the existing
   `NEXT_PUBLIC_DJANGO_API_URL` fallback). Login and session verification must use
   the same Django backend.
3. Restart `npm run dev` after changing environment variables.
4. Forward port 3000 and open its HTTPS URL. Port 8000 does not need forwarding
   for password login, and Django does not need to allow the tunnel origin via
   CORS for this server-to-server request.

If login returns 502, check that Django is reachable from the Next.js server and
that its allowed hosts include the hostname in `DJANGO_API_URL`.

All Django service requests (bookings, technicians, comments, articles,
categories and announcements) use `/api/django/*`. Backend images from Django
use that proxy as well. Pagination URLs are validated by the service and then
sent through the proxy.

Legacy chat/admin requests use `/api/backend/api/*`. Set `BACKEND_API_URL` to
select a backend explicitly. Otherwise Next.js checks local port 5000 before
using `NEXT_PUBLIC_BACKEND_URL` or the default hosted backend. Requests are not
retried on another backend after a mutation is sent.

Weather uses `/api/weather`. Socket.IO uses `/api/realtime` with HTTP polling;
set `SOCKET_BACKEND_URL` to its upstream and restart Next.js after changing it.
Existing public backend URL settings remain supported as configuration fallbacks.

Google OAuth exchanges already run server-side. To use Google sign-in through a
tunnel, its exact callback URL must still be registered with Google and set in
`GOOGLE_CALLBACK_URL`.
