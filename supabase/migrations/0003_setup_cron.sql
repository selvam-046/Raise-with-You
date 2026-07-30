-- Enable necessary extensions
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Schedule the cron job to ping the Vercel API route
-- Replace <YOUR_VERCEL_URL> and <YOUR_CRON_SECRET> with your actual production values
select cron.schedule(
  'invoke-check-deadlines', -- Unique job identifier
  '*/10 * * * *',           -- Cron schedule (every 20 minutes)
  $$
    select net.http_get(
        url:='https://rise-with-you.kannantech.com/api/cron/check-deadlines',
        headers:='{"Authorization": "Bearer iu33nfPXr3ODNYFVEeWjG9DtRkNYubCuFcNdVeHNnSg="}'::jsonb
    );
  $$
);
