# carbonemissionscounter.com

## Repo and hosting
- GitHub repo `Moxi89/carbon-counter`, default branch `master`.
- Hosted on Cloudflare Pages, which publishes only the `static/` folder. Merging to `master` deploys automatically in 1–2 minutes.
- Security headers and redirects live in `static/_headers` and `static/_redirects`.
- Cloudflare Web Analytics is on, and the CSP allows it.

## How the owner works
- Usually on a phone: keep replies short, outcome first.
- "PR" means open a pull request. The owner merges it, then asks "check if it's live".
- Work on a `claude/...` branch. Never push to `master` directly.

## Site structure
- Home (`static/index.html`):
  - live CO₂ counter (42.2 Gt a year, 1,338 t a second) and 1.5 °C carbon budget (170 Gt from 1 Jan 2026)
  - history chart and "CO₂ since you were born" tool
  - key figures, 14 FAQs and an About section with a citation button
  - Motion animations
- 159 country pages (`/co2-emissions/<slug>`, every country over 1 million people) with an "in context" section, plus rankings: total, per person, historical.
- Blog: 17 sourced guides, including a footprint calculator (sticky total, shareable link, oil/LPG heating) and a carbon tracking guide at `/carbon-tracking-guide`.
- Other pages: `/methodology`, `/about` (editorial standards, corrections), `/contact`, `/privacy`, `/terms`, `/widget` and `/embed` (embeddable counter), and a 404 page.
- Shared parts: the menu and footer come from `static/shared/` and are loaded by `nav.js` and `footer.js`.

## Build tools (run in this order after changes)
```sh
python3 tools/countries/build.py   # country pages, rankings, sitemap, home data (data: OWID CSV → tools/countries/data.json)
python3 tools/blog/build.py        # posts from tools/blog/content/*.html (rules: tools/blog/CONTENT_GUIDE.md)
python3 tools/pages/build.py       # about, contact, privacy, terms
python3 tools/ads/apply.py         # AdSense on/off from tools/site_config.json (run last)
node tools/blog/heroes/render.js    # photo hero images: Magnific photo + real figures (tools/blog/heroes/heroes.json)
python3 tools/og/jobs.py > /tmp/og.json && node tools/og/render.js /tmp/og.json   # share images
python3 tools/blog/images.py       # SVG illustrations (fallback for posts without a photo hero)
npm run build:motion               # slim Motion build → static/js/vendor/motion.js
```

## Rules
- Files under `/css/`, `/js/` and `/shared/` are cached for a long time. When one changes, bump its `?v=` everywhere it's referenced. The generators use `ASSET_V`/`V` plus a letter.
- No inline `onclick`/`onload` handlers: the strict CSP planned for AdSense blocks them.
- Every number in content needs a source. Core figures are in `tools/blog/CONTENT_GUIDE.md`.
- AdSense is prepared but off. Full checklist: `docs/ADSENSE.md`. Launch-day security add-on: `docs/adsense/_middleware.js`.

## Open tasks
- Turn on Cloudflare Email Routing for hello@carbonemissionscounter.com (used on the Contact page).
- Apply for AdSense, then put the `ca-pub-…` ID in `tools/site_config.json` and run `apply.py`. That adds the verification tag and `ads.txt` while ads stay off.
- Reminder set for 5 Nov 2026: check Search Console results (new home title, guide, country pages) and whether the Global Carbon Budget 2026 has been published. If it has, run the yearly update from the README checklist.

## Search Console notes
- Most impressions come from "carbon tracking" searches, at positions 27–57.
- Best opportunities: "real-time carbon tracking", "co2 tracker" and "co2 live", at positions 9–15.
- Mobile click-through is better than desktop.
