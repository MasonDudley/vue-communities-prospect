# VUE Communities — Codex Handoff

## Goal
Work on the VUE Communities website from the restored static-style build, preserving the original design direction and making only controlled, reviewable changes.

## Project Location
- Restored codebase copy: `./codebase/`
- Original workspace project path: `/Users/masondudley/.openclaw/workspace/projects/vue-communities`

## Restored Baseline
- Commit: `9b69b41`
- Message: `Restore static-style VUE site and add backend hooks`

This is the baseline that should be treated as the preferred visual/design starting point.

## Live Review Preview of Restored Version
- https://vue-communities-4nuae64m5-masondudleys-projects.vercel.app

## Primary Instructions
1. Preserve the original visual style and site structure from the restored build.
2. Do not turn the site into a different layout or a generic single-page marketing rewrite.
3. Use the confirmed facts in `ORIGINAL_SITE_CONFIRMED_FACTS.md` as source material.
4. If a detail is inconsistent across the original live site, mark it as needing confirmation instead of confidently rewriting it.
5. Prefer very small, surgical edits.
6. Keep Oasis and Cornerstone clearly separated. Do not blend amenities or features between them.
7. Avoid invented claims, compressed summaries that overstate certainty, or generalized utility statements when the source is inconsistent.

## Pages / Sources Reviewed from Original Site
- https://vuecommunities.com/
- https://vuecommunities.com/welcome-to-the-vue
- https://vuecommunities.com/the-oasis-1
- https://vuecommunities.com/cornerstone-1
- https://vuecommunities.com/terms-%26-pricing
- https://vuecommunities.com/faq
- https://vuecommunities.com/gallery

## Key Guidance for Editing
### Safe to treat as confirmed
- Student-only positioning near Liberty University
- Two communities: Oasis and The VUE at Cornerstone
- Individual leases
- Roommate matching
- Furnished units
- Oasis has 1BR–6BR range
- Cornerstone is 3BR/3BA only
- Office phone/address/email from original site
- Published pricing from original pricing pages

### Needs caution / confirmation
- Exact utilities wording, because original live pages do not match each other perfectly
- Any stronger marketing claim like “only privately owned apartment community with access to the Liberty Shuttle Service” unless the client wants the exact original line kept
- Any attempt to unify all included services into a single definitive statement

## Suggested Codex Workflow
1. Start from `./codebase/`
2. Review `ORIGINAL_SITE_CONFIRMED_FACTS.md`
3. Make only minimal changes per request
4. Show diffs before broad edits
5. Keep preview deployments frequent and narrow in scope

## Files in This Desktop Packet
- `codebase/`
- `ORIGINAL_SITE_CONFIRMED_FACTS.md`
- `live-site-sources.txt`
- `extraction-summary.txt`
- `commits.txt`
- `git-status.txt`

## One-Sentence Brief for Codex
Use the restored VUE Communities static-style build as the baseline, preserve its design, and apply only source-backed, minimal edits using the confirmed facts file as the reference of truth.
