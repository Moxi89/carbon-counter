# carbonemissionscounter.com

## Repo and hosting
- GitHub repo `Moxi89/carbon-counter`, default branch `master`.
- Hosted on Cloudflare Pages (Free plan), which publishes only the `static/` folder. Merging to `master` deploys automatically in 1–2 minutes.
- Security headers and redirects live in `static/_headers` and `static/_redirects`.
- Cloudflare Web Analytics is on, and the CSP allows it. Cloudflare injects a bot-detection script (`/cdn-cgi/challenge-platform/.../jsd/`) that the Free plan can't switch off; it costs the home page some Lighthouse points, nothing else.

## How the owner works
- Usually on a phone: keep replies short, outcome first.
- "PR" means open a pull request. The owner merges it, then asks "check if it's live".
- Work on a `claude/...` branch. Never push to `master` directly.
- The owner has Magnific (AI images) on a paid plan. Generations cost credits: estimate with `simulate_cost` and say the cost before generating.

## Site structure
- Home (`static/index.html`):
  - live CO₂ counter (42.2 Gt a year, 1,338 t a second) and 1.5 °C carbon budget (170 Gt from 1 Jan 2026)
  - history chart and "CO₂ since you were born" tool
  - key figures, 14 FAQs and an About section with a citation button
  - Motion animations
- 159 country pages (`/co2-emissions/<slug>`, every country over 1 million people) with an "in context" section, plus rankings: total, per person, historical.
- Blog: 17 sourced guides, including a footprint calculator (sticky total, shareable link, oil/LPG heating) and a carbon tracking guide at `/carbon-tracking-guide`. Every post has a photo hero image with its real figures drawn on top (see Images).
- `/data`: free CSV downloads (`static/downloads/`, written by the country build, CC BY 4.0), the reusable charts, a citation and the widget. Has Dataset structured data.
- `/widget` (builder: CO₂ counter or carbon budget, dark/light, full screen) and `/embed` (`?type=budget`, `?theme=light`).
- Other pages: `/methodology`, `/about` (editorial standards, corrections), `/contact`, `/privacy`, `/terms`, and a 404 page.
- Shared parts: the menu and footer come from `static/shared/` and are loaded by `nav.js` and `footer.js` (they fetch `/shared/navbar` and `/shared/footer` without `.html`).

## Build tools (run in this order after changes)
```sh
python3 tools/countries/build.py   # country pages, rankings, sitemap, home data, /downloads CSVs (data: OWID CSV → tools/countries/data.json)
python3 tools/blog/build.py        # posts from tools/blog/content/*.html (rules: tools/blog/CONTENT_GUIDE.md)
python3 tools/pages/build.py       # about, contact, privacy, terms, data
python3 tools/ads/apply.py         # AdSense on/off from tools/site_config.json
node tools/blog/heroes/render.js   # photo hero images: photo + real figures (tools/blog/heroes/heroes.json)
python3 tools/og/jobs.py > /tmp/og.json && node tools/og/render.js /tmp/og.json   # share images
python3 tools/blog/images.py       # SVG illustrations (fallback for posts without a photo hero)
npm run build:motion               # slim Motion build → static/js/vendor/motion.js
```

## Images
- Blog heroes: a Magnific photo (Seedream 5 Pro, 16:9, 2K) with **no text, numbers, charts or logos** and one side empty, saved as `tools/blog/heroes/photos/<slug>.jpg` (2400 × 1350). `render.js` draws the figures from `heroes.json` (`chart`, `stat`, `stats`, `budget`, `ppm`, `gcb`) and writes 1600 px + 800 px WebP. Figures must match the post and its sources.
- Share images use the bare photo, mirrored when the figures sit on the right, plus `og_sub`.
- Magnific's file server is `pikaso.cdnpk.net` (allowed in the environment's network settings).

## Live and yearly figures
- **Monthly CO₂ ppm:** `python3 tools/ppm/update.py` downloads NOAA's Mauna Loa monthly data (gml.noaa.gov) into `tools/ppm/ppm.json`. The CO₂ ppm post uses `{{ppm:key}}` placeholders filled by the blog build; its hero and share image read the same file.
- **Yearly Global Carbon Budget:** fill `tools/yearly/gcb.json`, then `python3 tools/yearly/gcb_update.py` (dry run, then `--apply`) updates every live-figure page and derived number. The key-findings post is drafted in `tools/blog/drafts/` (`--draft` publishes it); its photo is ready. Runbook: `docs/GCB2026.md`.

## Scheduled tasks (fresh session each run, open a draft PR, push notification)
- **Global Carbon Budget 2026 watch:** daily 8:36 Helsinki time in November–December. On release it runs the yearly update and opens "Global Carbon Budget 2026 update", then disables itself.
- **Monthly CO₂ ppm update:** 9th of each month, 8:41 Helsinki time. Opens "CO₂ ppm update: <Month Year>" when NOAA has a new month.

## Rules
- Files under `/css/`, `/js/` and `/shared/` are cached for a long time. When one changes, bump its `?v=` everywhere it's referenced. The generators use `ASSET_V`/`V` plus a letter. A footer change needs the cascade in `gcb_update.bump_versions`.
- No inline `onclick`/`onload` handlers: the strict CSP planned for AdSense blocks them.
- Every number in content needs a source. Core figures are in `tools/blog/CONTENT_GUIDE.md`.
- AdSense is prepared but off. Full checklist: `docs/ADSENSE.md`. Launch-day security add-on: `docs/adsense/_middleware.js`.

## Open tasks (owner)
- Turn on Cloudflare Email Routing for hello@carbonemissionscounter.com (used on the Contact page).
- Find the cause of the 522 errors in Cloudflare analytics (probably an old proxied DNS record).
- Apply for AdSense, then put the `ca-pub-…` ID in `tools/site_config.json` and run `apply.py`. That adds the verification tag and `ads.txt` while ads stay off.
- 5 Nov 2026: check Search Console results (new home title, tracking guide, country pages) and share them.

## Search Console and speed notes
- Most impressions come from "carbon tracking" searches, at positions 27–57.
- Best opportunities: "real-time carbon tracking", "co2 tracker" and "co2 live", at positions 9–15 (home title and the guide's real-time section were tuned on 23 Oct 2026).
- Mobile click-through is better than desktop.
- Lighthouse mobile (23 Oct 2026): posts, country pages, rankings and blog 98–100; home 88–100 depending on Cloudflare's script.
