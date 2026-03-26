# VUE Communities Prospect Redesign

Static, multi-page prospect/demo website for VUE Communities in Lynchburg, Virginia. The site is designed as a polished redesign mockup and is ready to preview locally or deploy on Vercel.

## Canonical Baseline

This repository is the single working baseline for the VUE Communities redesign.

- Use this repo for all future website work.
- The later one-page rewrite has been retired from the working setup.
- Supporting research and original-site notes live in `docs/reference/`.
- A local scrape archive lives in `archive/` and is gitignored on purpose.

## Local preview

Run a simple static server from the project root:

```bash
python3 -m http.server 3000
```

Then open `http://localhost:3000`.

## Deploy to Vercel

This repo is currently linked to the Vercel project `vue-communities-prospect-check`.

- Production URL: `https://vue-communities-prospect-check.vercel.app`
- Standard preview deploy: `vercel deploy`
- Production deploy: `vercel --prod`
- If the local `.vercel` link is stale, re-link with `vercel link --project vue-communities-prospect-check --yes`

Project settings should remain a static site with the repository root as the output source. The included `vercel.json` enables clean URLs, so routes such as `/about`, `/faq`, and `/the-oasis` resolve without `.html`.

Add these project environment variables before expecting the server-side contact form + notification path to work:

- `SUPABASE_SERVICE_ROLE_KEY` — required for `/api/contact` inserts into project `povizsshrvyqcaszwzmr`
- `SUPABASE_URL` — optional override; defaults to `https://povizsshrvyqcaszwzmr.supabase.co`
- `RESEND_API_KEY` — optional, only needed for email notifications
- `CONTACT_NOTIFY_TO` — optional default recipient email(s) for notification copies; comma-separated supported
- `CONTACT_NOTIFY_TO_OASIS` — optional community-specific recipient override for Oasis inquiries
- `CONTACT_NOTIFY_TO_CORNERSTONE` — optional community-specific recipient override for Cornerstone inquiries
- `CONTACT_NOTIFY_TO_STILL_DECIDING` — optional community-specific recipient override for undecided inquiries
- `CONTACT_NOTIFY_BCC` — optional blind-copy recipient email(s) for internal visibility
- `CONTACT_NOTIFY_FROM` — optional sender identity for Resend notifications
- `CONTACT_ALLOWED_ORIGINS` — optional comma-separated allowlist for `/api/contact` origins, e.g. `https://vue-communities-prospect-check.vercel.app`
- `CONTACT_RATE_LIMIT_MAX` — optional per-IP request limit inside the active rate-limit window
- `CONTACT_RATE_LIMIT_WINDOW_MS` — optional rate-limit window length in milliseconds

A starter `.env.example` is included for deployment setup, and `docs/deployment-setup.md` now captures the exact SQL/env checklist for production readiness.

## Notes

- Brand assets reused locally live in `assets/images/`.
- Property photography references current image URLs exposed by the live VUE Communities site and scrape.
- Public contact form now posts to `/api/contact`, which inserts into Supabase server-side and falls back to `mailto:` if the endpoint is unavailable.
- The server route keeps community values constrained to `The Oasis`, `Cornerstone`, or `Still deciding` so inquiries stay cleanly separated.
- Optional Resend notifications are wired behind env vars and do not affect form success if email delivery is disabled or fails.
- Contact notifications can now route to community-specific inboxes so Oasis and Cornerstone inquiry handling stays separated.
- `/api/contact` now supports optional origin allowlisting and per-instance rate limiting for basic production hardening.
- The admin dashboard now includes a lightweight `specials` workflow in addition to inquiries and availability. Run `docs/supabase-setup.sql` to provision the `specials` table/RLS policies before using that tab.
- Community pages now support one live special card each, pulled from Supabase and filtered strictly by matching community.
