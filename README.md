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

1. Import this folder as a new Vercel project.
2. Keep the project type as a static site.
3. Deploy with the repository root as the output source.
4. Add these project environment variables before deploying the contact form:
   - `SUPABASE_SERVICE_ROLE_KEY` — service-role key for project `povizsshrvyqcaszwzmr`
   - `SUPABASE_URL` — optional override; defaults to `https://povizsshrvyqcaszwzmr.supabase.co`
   - `RESEND_API_KEY` — optional, only needed for email notifications
   - `CONTACT_NOTIFY_TO` — optional default recipient email(s) for notification copies; comma-separated supported
   - `CONTACT_NOTIFY_TO_OASIS` — optional community-specific recipient override for Oasis inquiries
   - `CONTACT_NOTIFY_TO_CORNERSTONE` — optional community-specific recipient override for Cornerstone inquiries
   - `CONTACT_NOTIFY_TO_STILL_DECIDING` — optional community-specific recipient override for undecided inquiries
   - `CONTACT_NOTIFY_BCC` — optional blind-copy recipient email(s) for internal visibility
   - `CONTACT_NOTIFY_FROM` — optional sender identity for Resend notifications
   - `CONTACT_ALLOWED_ORIGINS` — optional comma-separated allowlist for `/api/contact` origins
   - `CONTACT_RATE_LIMIT_MAX` — optional per-IP request limit inside the active rate-limit window
   - `CONTACT_RATE_LIMIT_WINDOW_MS` — optional rate-limit window length in milliseconds

A starter `.env.example` is included for deployment setup.

The included `vercel.json` enables clean URLs, so routes such as `/about`, `/faq`, and `/the-oasis` resolve without `.html`.

## Notes

- Brand assets reused locally live in `assets/images/`.
- Property photography references current image URLs exposed by the live VUE Communities site and scrape.
- Public contact form now posts to `/api/contact`, which inserts into Supabase server-side and falls back to `mailto:` if the endpoint is unavailable.
- The server route keeps community values constrained to `The Oasis`, `Cornerstone`, or `Still deciding` so inquiries stay cleanly separated.
- Optional Resend notifications are wired behind env vars and do not affect form success if email delivery is disabled or fails.
- Contact notifications can now route to community-specific inboxes so Oasis and Cornerstone inquiry handling stays separated.
- `/api/contact` now supports optional origin allowlisting and per-instance rate limiting for basic production hardening.
