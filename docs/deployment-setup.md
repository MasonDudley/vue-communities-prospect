# VUE Communities deployment setup

This is the exact repo-side setup still required for a fully live production deployment.

## Current Vercel project

- Project: `vue-communities-prospect-check`
- Production URL: `https://vue-communities-prospect-check.vercel.app`
- Preview deploy command: `vercel deploy`
- Production promote command: `vercel --prod`

If the local link is wrong or points at the retired `vue-prospect-site` project, run:

```bash
vercel link --project vue-communities-prospect-check --yes
```

## Required Vercel environment variables

Add these in Vercel Project Settings → Environment Variables.

### Required for server-side inquiry inserts

- `SUPABASE_SERVICE_ROLE_KEY`

### Optional / recommended

- `SUPABASE_URL=https://povizsshrvyqcaszwzmr.supabase.co`
- `RESEND_API_KEY`
- `CONTACT_NOTIFY_TO`
- `CONTACT_NOTIFY_TO_OASIS`
- `CONTACT_NOTIFY_TO_CORNERSTONE`
- `CONTACT_NOTIFY_TO_STILL_DECIDING`
- `CONTACT_NOTIFY_BCC`
- `CONTACT_NOTIFY_FROM=VUE Communities <onboarding@resend.dev>`
- `CONTACT_ALLOWED_ORIGINS=https://vue-communities-prospect-check.vercel.app`
- `CONTACT_RATE_LIMIT_MAX=5`
- `CONTACT_RATE_LIMIT_WINDOW_MS=600000`

Notes:
- Without `SUPABASE_SERVICE_ROLE_KEY`, `/api/contact` returns a server error and the front-end falls back to `mailto:`.
- Use the community-specific `CONTACT_NOTIFY_TO_*` variables if Oasis and Cornerstone should route to different inboxes.
- Add the final custom domain(s) to `CONTACT_ALLOWED_ORIGINS` once production domain mapping is finalized.

## Required Supabase SQL

Run this file in the target Supabase project SQL editor:

- `docs/supabase-setup.sql`

That migration does all of the following:
- aligns `contact_submissions` for the admin dashboard
- enforces community separation checks
- provisions `availability`
- provisions `specials`
- creates the public `specials-assets` storage bucket for promo image uploads
- adds RLS/storage policies for public read / authenticated admin write flows
- seeds the expected availability unit rows

## Post-setup verification

After SQL and env vars are applied:

1. Redeploy the site.
2. Submit one Oasis inquiry and one Cornerstone inquiry through the production form.
3. Confirm both rows land in `contact_submissions` with the correct `community` values.
4. Confirm notification routing goes to the intended inbox(es).
5. In `/admin`, confirm:
   - inquiries load
   - availability loads per community
   - specials can be created, edited, and displayed on the matching community page only
   - uploading a special image stores it in `specials-assets/<community>/...` and the saved record gets an `image_url`
6. Verify these URLs resolve cleanly:
   - `/`
   - `/about`
   - `/faq`
   - `/the-oasis`
   - `/cornerstone`
   - `/contact`

## Current blocker summary

Repo code is ready for review deployment, but production contact inserts and specials data depend on:
- Vercel environment variables being added
- `docs/supabase-setup.sql` being executed in Supabase
