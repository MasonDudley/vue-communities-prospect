# VUE Communities — Project Context

## What This Is
Marketing website for VUE Communities, a student-only apartment company near Liberty University in Lynchburg, VA. Two properties: **The Oasis** (1-6BR, amenity-heavy, campus-edge) and **Cornerstone** (single 3BR/3BA layout, private bathrooms, quieter neighborhood).

## Tech Stack
- **Frontend:** Pure static HTML/CSS/JS (no framework, no build step)
- **Hosting:** Vercel (deploys from `main` branch on GitHub)
- **Repo:** `MasonDudley/vue-communities-prospect` on GitHub
- **Images:** Supabase Storage (public bucket `vue-site-assets`)
- **Database:** Supabase (project: `povizsshrvyqcaszwzmr`)
- **Analytics:** Vercel Web Analytics (script on all pages, needs enabling in dashboard)
- **Domain:** vuecommunities.com

## Supabase
- **URL:** `https://povizsshrvyqcaszwzmr.supabase.co`
- **Anon/Publishable Key:** (in site.js and used client-side — safe to expose)
- **Service/Secret Key:** (stored locally, never commit — ask Mason for it)
- **Storage Bucket:** `vue-site-assets` (public, 75+ images)
- **Tables:** `contact_submissions` (with RLS policy allowing anon inserts)

## Site Structure
```
/                        → Homepage (hero, community cards, pricing snapshot, FAQ preview)
/the-oasis/              → Oasis community page (comparison table, pricing, floor plans, amenity icons, photo gallery, CTA band)
/cornerstone/            → Cornerstone community page (same structure as Oasis but for Cornerstone)
/floor-plans-pricing/    → Pricing overview (comparison cards, CTAs to community pages, how pricing works, best-fit guidance)
/faq/                    → FAQ page (4 accordion sections)
/about/                  → About page (info cards, spotlight, amenity grid, CTA band)
/contact/                → Contact page (office details, Supabase-powered inquiry form with mailto fallback)
/communities/            → Retired/slim hub page (just community cards, redirects to individual pages)
/amenities/              → Retired/slim hub page (CTAs to community pages, keeps amenity content)
/404.html                → Custom 404
```

## Navigation
Flat nav (no dropdowns): `Home | The Oasis | Cornerstone | Pricing | FAQ | About | Contact`
- Desktop: full nav + "Resident Portal" button + "Call Leasing" button
- Mobile (≤900px): hamburger menu with all links + "Call Leasing" and "Schedule a Tour" CTA buttons at bottom

## Key Design Patterns
- **CSS:** Custom properties in `:root`, mobile-first responsive with breakpoints at 680px, 900px, 1080px, 1160px
- **Reveal animations:** `.reveal` class with IntersectionObserver, softer on mobile (16px translateY, 450ms)
- **Touch handling:** All `:hover` effects wrapped in `@media (hover: hover)`, `:active` states for touch feedback
- **Cards:** `.community-card`, `.pricing-card`, `.info-card`, `.amenity-card`, `.faq-card`, `.contact-card`
- **Surfaces:** `.surface` (light) and `.surface.navy` (dark) wrapper sections
- **Comparison table:** `.compare-table` with `.is-highlight` class for column emphasis, stacks on mobile with `data-label` attributes
- **Photo gallery:** Masonry-style `.photo-gallery` with lightbox (click to enlarge, arrow key nav, swipe on mobile)
- **Amenity icons:** `.icon-amenity-grid` with `.icon-amenity` items (Oasis-specific icons from Supabase)

## Contact Form
- HTML: `<form data-mailto-form>` on `/contact/`
- JS: Posts to Supabase `contact_submissions` table via REST API using anon key
- Fallback: If Supabase fails, falls back to `mailto:gm1@vuecommunities.com`
- Success state: Replaces form with confirmation message

## External Links
- **Apply for Oasis:** `https://sclas.twa.rentmanager.com/ApplyNow?propertyshortname=OAS`
- **Apply for Cornerstone:** `https://sclas.twa.rentmanager.com/ApplyNow?propertyshortname=CST`
- **Resident Portal:** `https://sclas.twa.rentmanager.com/`
- **Leasing Office:** 40 Oasis Way, Lynchburg, VA 24502
- **Phone:** 434-329-7979
- **Email:** gm1@vuecommunities.com
- **Hours:** Monday-Friday 10:00 AM to 5:00 PM

## Current Pricing (as of March 2026)
### The Oasis
- 1BR: Contact for availability
- 2BR: $895/installment
- 2BR with office/study: $955/installment
- 3BR with office/study: $885/installment
- 4BR no window: $610, window: $650
- 6BR no window: $525, window: $570

### Cornerstone
- 3BR/3BA: $699/installment

All pricing is per person, per room, per installment. Electricity is separate.

## Upcoming Work (Planned)
1. **Admin portal** (`/admin`) — Login-protected dashboard for property managers
2. **Availability management** — Admins can update room/unit availability per community
3. **Public availability display** — Show availability status on Oasis and Cornerstone pages
4. **Contact submission viewer** — Admin can view/manage form submissions in dashboard
5. **Resend email integration** — Auto-email admins when new contact form submission arrives
6. **Framework migration** — Consider moving to Astro or Next.js to eliminate HTML duplication across 10+ files and support dynamic features

## File Conventions
- All HTML pages share the same header/nav/footer structure (currently duplicated, not templated)
- CSS: Single `assets/styles.css` file (1550+ lines)
- JS: Single `assets/site.js` file (nav toggle, reveal animations, form handling, gallery lightbox)
- Images: Mix of local `/assets/images/` (floor plans, badges, logo) and Supabase Storage (photos)
- Vercel config: `vercel.json` with `cleanUrls: true`

## Git Workflow
- Branch: `main` (Vercel auto-deploys on push)
- No CI/CD beyond Vercel's built-in deployment
- Commits use conventional-style messages with `Co-Authored-By: Claude` tags
