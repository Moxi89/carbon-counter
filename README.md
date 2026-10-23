# Carbon Emissions Counter

Source for [carbonemissionscounter.com](https://www.carbonemissionscounter.com/): a live estimate of global CO₂
emissions, the remaining 1.5 °C carbon budget, CO₂ by country, a lifetime-emissions tool, an embeddable widget and a
blog of sourced guides.

Plain static HTML, CSS and JavaScript, hosted on **Cloudflare Pages** (output directory = `static/`, so only files inside it are published). Pushing to
`master` deploys the site.

## Layout

| Path | What it is |
|---|---|
| `static/` | The website. `index.html` is the home page. |
| `static/_headers` | Security headers, long caching for versioned CSS/JS/fonts, and the rule that lets other sites frame `/embed`. If a page starts loading something from another domain, add that domain to the Content-Security-Policy here. |
| `static/_redirects` | Redirects for old URLs. Clean URLs (`/co2-emissions/japan` → `co2-emissions/japan.html`) and the 404 page are handled by Cloudflare Pages itself. |
| `static/shared/` | Navbar and footer, loaded on every page by `nav.js` and `footer.js` (footer.js also runs share buttons and scroll reveals). |
| `static/css/theme-2026.css` | Design tokens and shared styles, loaded last on every page. Page styles: `home-2026.css`, `country-2026.css`, `post-2026.css`. |
| `tools/countries/` | Builds the country pages, rankings, sitemap and the home page's country data. |
| `tools/blog/` | Builds the blog from `tools/blog/content/*.html`. Writing rules: `tools/blog/CONTENT_GUIDE.md`. |
| `tools/og/` | Renders the 1200×630 social share images in `static/og/`. |
| `static/js/motion-effects.js` | Count-up numbers, growing bars and gliding ranking rows on the home and country pages, using a slim self-hosted build of [Motion](https://motion.dev) (`static/js/vendor/motion.js`). Rebuild it with `npm install && npm run build:motion`. Skipped when the visitor prefers reduced motion. |

## Building

```bash
python3 tools/countries/build.py                   # country pages, rankings, sitemap, home page data
python3 tools/blog/build.py                        # blog posts, blog index, home page article cards
python3 tools/pages/build.py                       # about, contact, privacy, terms (reads tools/site_config.json)
python3 tools/ads/apply.py                         # AdSense on/off (reads tools/site_config.json); run last
python3 tools/og/jobs.py > /tmp/og.json && node tools/og/render.js /tmp/og.json   # share images (needs Playwright)
```

Preview locally with `cd static && python3 -m http.server 8000` (clean URLs need the `.html` suffix locally).
Advertising is prepared but off; see `docs/ADSENSE.md` for the approval and launch checklist.

**Caching:** files in `/shared/` and `/css/`, `/js/` are cached for a long time. When you change one, bump its
`?v=` value everywhere it is referenced (the generators use `ASSET_V` / `V` plus a letter).

## Yearly data update (each November)

The Global Carbon Project publishes the new **Global Carbon Budget** every November. To update:

**Shortcut:** `tools/yearly/gcb_update.py` updates all the global figures in one go from the numbers in
`tools/yearly/gcb.json`, and `tools/blog/drafts/` holds the key-findings post. Step-by-step: `docs/GCB2026.md`.

1. **Country data:** download `owid-co2-data.csv` from
   [Our World in Data](https://github.com/owid/co2-data) and run `python3 tools/countries/build.py --csv owid-co2-data.csv`.
2. **Global figures** (total emissions, fossil and land-use split, remaining 1.5 °C budget and its start date). Update them in:
   - `static/js/home-2026.js` (`EMISSIONS_PER_YEAR_T`, `BUDGET_START_GT`, `BUDGET_START`)
   - `static/embed.html` (`PER_SECOND`) and `static/widget.html` text
   - `static/index.html` (hero text, budget section, key figures, FAQ, structured data)
   - `static/methodology.html` (method page)
   - `tools/blog/CONTENT_GUIDE.md` (core figures table), then review posts in `tools/blog/content/`
3. Rebuild everything (see above), re-render share images, and check the site.

## Data sources

- [Global Carbon Budget](https://globalcarbonbudget.org/) (Global Carbon Project): global totals and the carbon budget.
- [Our World in Data](https://ourworldindata.org/co2-emissions): country data, CC BY 4.0.
