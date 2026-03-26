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

The included `vercel.json` enables clean URLs, so routes such as `/about`, `/faq`, and `/the-oasis` resolve without `.html`.

## Notes

- Brand assets reused locally live in `assets/images/`.
- Property photography references current image URLs exposed by the live VUE Communities site and scrape.
- Contact form is a lightweight `mailto:` prospect form suitable for demo/prospect use without backend setup.
