# Nexus Tasks

An enterprise-grade personal task workspace built with Next.js App Router, Supabase, native Web Push, and Vercel Cron. Notifications go directly to browser-vendor gateways using VAPID; there is no paid notification platform in the request path.

## Run it locally

1. Create a Supabase project and enable Email auth.
2. Run both SQL migrations in `supabase/migrations/`, in numeric order, in the Supabase SQL editor (or apply them with the Supabase CLI). The second migration enables cross-tab/device Realtime task updates.
3. Copy `.env.example` to `.env.local`, then set the Supabase URL, publishable key, and service-role key.
4. Generate the push identity with `npm run vapid`; place the public key in `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and private key in `VAPID_PRIVATE_KEY`.
5. Install and start:

   ```bash
   npm install
   npm run dev
   ```

Web Push requires HTTPS (localhost is an allowed development exception). On Vercel, add every `.env.local` variable in Project Settings. `vercel.json` invokes the protected deadline scanner every 10 minutes; set Vercel's `CRON_SECRET` to the same secret configured in the deployment.

### If browser enrollment reports an `AbortError`

`Registration failed - push service error` is raised by the browser while it is contacting its own push gateway; it occurs before Nexus or Supabase receives anything. Confirm the app is on HTTPS (or `localhost`), then disable any VPN/proxy/ad blocker that blocks the browser's push service and retry. The client waits for an active service worker, validates the VAPID key, replaces subscriptions made with an older key, and now shows this actionable error in the UI.

## Security model

- Browser clients use only the Supabase publishable key. Row-level policies isolate task and device-subscription records by `auth.uid()`.
- `SUPABASE_SERVICE_ROLE_KEY` and `VAPID_PRIVATE_KEY` exist only in Node server routes. Never expose either through `NEXT_PUBLIC_*` variables.
- The cron route rejects calls without `Authorization: Bearer $CRON_SECRET`.
- Each task is atomically marked with `reminder_sent_at` before delivery, so overlapping cron calls cannot send duplicate reminders. Browser endpoints returning `404` or `410` are automatically pruned.

## Key routes

| Route | Purpose |
| --- | --- |
| `/` | Product landing page |
| `/login` | Email/password sign-up and sign-in |
| `/dashboard` | Protected task command center and device enrollment |
| `/api/cron/check-deadlines` | Protected scheduled reminder processor |
| `/api/health` | Lightweight deployment health response |
