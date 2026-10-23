# Google AdSense: readiness and launch checklist

The site is prepared for AdSense but **ads are off**. Nothing ad-related loads, no cookies are set, and the
privacy policy says so. This file is the step-by-step plan for applying and, once approved, switching ads on.

All ad settings live in `tools/site_config.json`:

```json
"contact_email": "hello@carbonemissionscounter.com",
"ads": { "enabled": false, "client": "ca-pub-0000000000000000", "mode": "auto",
         "slots": { "in_article": "", "after_data": "", "before_faq": "" } }
```

After changing it, rebuild in this order:

```bash
python3 tools/countries/build.py
python3 tools/blog/build.py
python3 tools/pages/build.py      # about, contact, privacy, terms (privacy/terms gain ad sections when enabled)
python3 tools/ads/apply.py        # adds or removes ad code everywhere; safe to run repeatedly
```

## Already in place

- [x] **Original, useful content:** live counters, 159 country pages with data and FAQs, rankings, a calculator,
      and 18 sourced guides (Google's main reason for rejection is "low value content").
- [x] **About** (`/about`) with editorial standards and a corrections policy, **Contact** (`/contact`),
      **Privacy policy** (`/privacy`) and **Terms** (`/terms`), all linked from the footer.
- [x] Clear navigation, mobile-friendly layout, fast pages (Lighthouse accessibility/SEO 100), no broken links.
- [x] Ad positions marked in the templates, with space reserved so ads won't make the page jump.
- [x] No ads on pages where Google doesn't want them: 404, legal pages, About, Contact, the widget and the embed.

## 1. Before applying

1. **Make the contact address work.** In Cloudflare, open the domain → **Email** → **Email Routing**, enable it,
   and add a rule `hello@carbonemissionscounter.com` → your own inbox. Send a test email.
   (To use another address, change `contact_email` and run `python3 tools/pages/build.py`.)
2. Consider adding your name or a short bio to `/about` (edit `tools/pages/build.py`). A named, accountable
   owner helps with Google's trust assessment (E-E-A-T).
3. You must be 18+ and own the domain (you do).

## 2. Apply

1. Sign up at <https://adsense.google.com/> with your Google account and add `carbonemissionscounter.com`.
2. Copy your publisher ID (`ca-pub-` + 16 digits) into `"client"` in `tools/site_config.json`. Keep `"enabled": false`.
3. Run `python3 tools/ads/apply.py`. This adds Google's verification tag
   (`<meta name="google-adsense-account">`) to content pages and creates `static/ads.txt`. No ads or cookies yet.
4. Open a PR, merge, and in AdSense choose **meta tag** as the verification method, then **Request review**.
   Review usually takes a few days to a few weeks. Don't change the site's structure while it's under review.

## 3. Consent message (required for Europe)

Google requires a certified consent management platform for visitors in the EEA, the UK and Switzerland.
In AdSense open **Privacy & messaging** → **European regulations** → create a message (Google's own CMP is free
and certified). Publish it for the site. Optionally add the **US state regulations** message too.

## 4. Switch ads on (after approval)

1. In `tools/site_config.json` set `"enabled": true`.
   - `"mode": "auto"`: Google's **Auto ads** decide placements (simplest; turn on Auto ads in AdSense and keep
     ad load on the lower side so the counters stay prominent).
   - `"mode": "manual"`: create three **display ad units** in AdSense (Ads → By ad unit) and paste their
     slot ids into `"slots"`. They appear after the second section of guides, after the key figures on the
     home and country pages, and before each FAQ.
2. Run the four build commands above. Privacy and terms automatically gain the advertising sections
   (Google cookies, opt-out links, consent), and About states that the site is ad-funded.

## 5. Security policy (CSP)

AdSense only supports a strict, nonce-based CSP, and a static site can't create nonces. So:

1. Copy `docs/adsense/_middleware.js` to `functions/_middleware.js` (repo root). It is a Cloudflare Pages Function
   that adds a fresh nonce to every `<script>` and sends Google's recommended strict policy.
2. In `static/_headers`, delete the `Content-Security-Policy` line under `/*` (the function now sets it).
3. **Cloudflare Web Analytics:** its automatically injected beacon won't carry the nonce. In Cloudflare →
   Web Analytics → the site → switch to **manual JS snippet**, and add that snippet before `</body>` in the
   templates so it gets a nonce too.
4. Pages Functions count against Cloudflare's free Workers quota (100,000 requests a day); fine for this site
   today, but keep an eye on it as traffic grows.

## 6. After launch

- Check a few pages on a phone: ads labelled "Advertisement", nothing covering the counters or calculator.
- Run Lighthouse: Cumulative Layout Shift should stay under 0.1.
- Watch **Policy center** in AdSense for warnings.
- Never click your own ads or ask anyone to.

## Switching ads off again

Set `"enabled": false` and rerun the four commands. `apply.py` removes every ad block (the pages return
byte-for-byte to their previous state). If you remove the publisher ID too, `ads.txt` is deleted.
Undo the CSP change by deleting `functions/_middleware.js` and restoring the line in `static/_headers`.
