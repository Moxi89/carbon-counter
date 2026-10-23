# Blog content guide

Posts are written as content files in `tools/blog/content/<slug>.html` and built with:

```
python3 tools/blog/build.py
```

The build wraps each file in the shared article template: breadcrumb, H1, "Key takeaways", table of
contents, sources, Q&A, CTA, related posts, and BlogPosting / BreadcrumbList / FAQPage structured data.
Keep the slug (file name) of existing posts unchanged; their URLs are already indexed.

## File format

```html
<!--meta
{
  "title": "SEO title, 45-60 characters, sentence case, no emoji",
  "h1": "On-page headline (can be a little longer than the title)",
  "description": "Meta description, 140-158 characters. Plain, specific, says what the reader gets.",
  "dek": "One or two sentences under the headline.",
  "category": "How-to",
  "image": "/blog/images/existing-image.svg",
  "image_alt": "What the illustration shows",
  "published": "2025-01-17",
  "updated": "2026-10-23",
  "takeaways": ["3-5 short, concrete bullets with numbers", "..."],
  "faq": [["Question people actually search?", "Direct 1-3 sentence answer. Simple inline HTML allowed."]],
  "sources": [["Report or page name, Publisher, Year", "https://..."]],
  "related": ["other-post-slug", "another-post-slug"]
}
-->
<section>
    <h2>First section heading</h2>
    <p>...</p>
</section>
<section>
    <h2>Next section</h2>
    ...
</section>
```

- `meta` must be valid JSON (double quotes, no trailing commas). Use the typographic apostrophe ’ inside strings.
- Do **not** write an `<h1>`, a "Key takeaways" box, a sources list, a FAQ section or a CTA in the body: the
  template adds them from `meta`.
- Optional: `"scripts": ["/blog/js/your-script.js"]` loads extra JavaScript (path without `?v=`).

### Categories (use exactly one)

`How-to` · `Home energy` · `Food` · `Transport` · `Climate science` · `Climate tech` · `Family`

## Components you can use in the body

```html
<div class="callout"><strong>Tip:</strong> ...</div>
<div class="callout callout-warn"><strong>Watch out:</strong> ...</div>

<ul class="checklist"><li>...</li></ul>

<div class="stat-row">
  <div class="stat"><span class="stat-value">42.2 Gt</span><span class="stat-label">CO₂ emitted worldwide in 2025</span></div>
</div>

<div class="table-wrap"><table class="data-table">
  <caption>Source: ...</caption>
  <thead><tr><th>Item</th><th class="num">kg CO₂e</th></tr></thead>
  <tbody><tr><td>Beef (1 kg)</td><td class="num">99.5</td></tr></tbody>
</table></div>

<blockquote>...</blockquote>
```

Plain `h2`, `h3`, `p`, `ul`, `ol`, `strong`, `em` and `a` are styled automatically. No inline styles, no
emoji icons, no `<img>` other than existing files in `/blog/images/`.

## Writing rules (2026 search guidance: helpful, people-first content)

1. **Answer the search intent in the first two paragraphs.** Lead with the answer, then explain.
2. **Every number needs a source** listed in `sources`, from a primary or authoritative publisher (Global Carbon
   Project, IPCC, IEA, Our World in Data, Ember, EPA, UK DESNZ/DEFRA, ICCT, peer-reviewed papers). Prefer
   2024-2026 figures. If you can't verify a claim, leave it out.
3. **No hype or fear-mongering.** No ALL CAPS, no "ACT NOW", no "LOST", no exclamation-mark marketing. Be calm,
   precise and practical. It's fine to say plainly that the 1.5 °C budget is nearly used up.
4. **Be specific and useful:** concrete actions with rough savings (kg CO₂ per year, money where sensible),
   comparisons and tables over vague advice.
5. **Structure for skimming:** short paragraphs (2-4 sentences), descriptive H2s that read like questions or
   answers people search for, lists and tables where they help.
6. **Length:** as long as the topic needs; most posts land at 1,200-2,000 words. Don't pad.
7. **Internal links (3-6 per post, natural anchor text):**
   - Live counter: `/`
   - CO₂ by country ranking: `/co2-emissions-by-country`
   - Country pages: `/co2-emissions/<slug>` exist for every country with over 1 million people (159 pages), e.g.
     china, united-states, india, germany, united-kingdom, sweden, norway, new-zealand. Slugs are lowercase names
     with hyphens; check `static/co2-emissions/` if unsure.
   - How the counter works: `/carbon-tracking-guide`
   - Other posts: `/blog/posts/<slug>` (see list below)
8. **FAQ:** 3-5 questions phrased the way people search, each answered directly.
9. **Dates:** keep each post's original `published` date; set `updated` to the day you revise it.

## Core figures used across the site (keep consistent)

| Figure | Value | Source |
|---|---|---|
| Total CO₂ emissions 2025 (fossil + land use) | 42.2 Gt CO₂ | Global Carbon Budget 2025 |
| Fossil CO₂ 2025 | 38.1 Gt, record high, +1.1% | Global Carbon Budget 2025 |
| Land-use change CO₂ 2025 | 4.1 Gt | Global Carbon Budget 2025 |
| Remaining 1.5 °C budget (50% chance) | 170 Gt CO₂ from 1 Jan 2026, about 4 years at 2025 rates | Global Carbon Budget 2025 |
| Alternative estimate | 130 Gt CO₂ from the start of 2026 (Indicators of Global Climate Change 2025, published June 2026) | Forster et al., ESSD 2026 |
| Per second | ~1,338 t CO₂ | 42.2 Gt ÷ seconds per year |
| World average per person (fossil, 2024) | 4.7 t | Our World in Data / GCP |
| Top emitters 2024 (fossil) | China 31.8% (12.29 Gt), US 12.7% (4.90 Gt), India 8.3% (3.19 Gt) | Our World in Data / GCP |

Source links: Global Carbon Budget https://globalcarbonbudget.org/ · ESSD paper
https://essd.copernicus.org/articles/18/3211/2026/ · Our World in Data https://ourworldindata.org/co2-emissions

## Existing posts (slugs)

2026-climate-outlook · beyond-2025-next-decade-climate · carbon-footprint-calculator-guide ·
climate-tech-innovations-2026 · critical-climate-year-2025 · family-eco-activities · five-minute-carbon-hacks ·
food-climate-solutions · renewable-energy-guide-2026 · save-energy-at-home · track-home-energy ·
transportation-climate-guide
