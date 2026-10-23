#!/usr/bin/env python3
"""Switch Google AdSense on or off across the built site.

    python3 tools/ads/apply.py

Run it after the other builds (countries, blog, pages): it edits the HTML files
in static/ in place and is safe to run any number of times.

Settings: tools/site_config.json -> "ads"
  enabled  false: removes every ad block, the AdSense script and static/ads.txt
           true:  adds them (needs a real "client", e.g. ca-pub-1234567890123456)
  mode     "auto":   only the AdSense script; Google's Auto ads choose placements
           "manual": also fills the slots marked in the templates with
                     <!-- ad:NAME --><!-- /ad:NAME --> using the slot ids in "slots"

Ad slots are marked in the templates at:
  in_article  blog posts and guides, after the second section
  after_data  home page (after the key figures) and country pages (after the stats)
  before_faq  before the questions section on posts, country pages and the home page

See docs/ADSENSE.md for the full launch checklist (consent message, CSP, ads.txt).
"""
import glob
import json
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
STATIC = os.path.join(ROOT, 'static')
CFG = json.load(open(os.path.join(ROOT, 'tools', 'site_config.json'), encoding='utf-8'))['ads']

# Pages that should never carry ads (policy pages, utilities, error page, embeds)
NO_ADS = {'404.html', 'embed.html', 'widget.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html'}

HEAD_A, HEAD_Z = '<!-- ads:head -->', '<!-- /ads:head -->'

# Short statements about ads that must change when ads go live: (ads off, ads on)
AD_TEXT = {
    'home-about': ('It is independent, free, has no ads and sets no cookies.',
                   'It is independent and free, funded by clearly labelled ads.'),
    'footer': ('No cookies, no tracking.', 'Ad-supported &middot; <a href="/privacy">Privacy and ad choices</a>'),
}
TEXT_RE = re.compile(r'<!-- adtext:([a-z-]+) -->.*?<!-- /adtext:\1 -->', re.S)


def swap_text(html, enabled):
    return TEXT_RE.sub(lambda m: f'<!-- adtext:{m.group(1)} -->{AD_TEXT[m.group(1)][1 if enabled else 0]}<!-- /adtext:{m.group(1)} -->', html)
SLOT_RE = re.compile(r'<!-- ad:([a-z_]+) -->.*?<!-- /ad:\1 -->', re.S)


def head_block(client, enabled):
    # The account meta tag lets Google verify the site while you apply (ads can stay off);
    # the script is only added once ads are switched on.
    meta = f'<meta name="google-adsense-account" content="{client}">'
    script = (f'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={client}" '
              f'crossorigin="anonymous"></script>') if enabled else ''
    return f'{HEAD_A}{meta}{script}{HEAD_Z}'


def slot_html(name, client, slot):
    return (f'<!-- ad:{name} --><div class="ad-slot" data-ad="{name}"><p class="ad-label">Advertisement</p>'
            f'<ins class="adsbygoogle" style="display:block" data-ad-client="{client}" data-ad-slot="{slot}" '
            f'data-ad-format="auto" data-full-width-responsive="true"></ins>'
            f'<script>(adsbygoogle = window.adsbygoogle || []).push({{}});</script></div><!-- /ad:{name} -->')


def process(path, enabled, client, mode, slots, has_client):
    html = open(path, encoding='utf-8').read()
    orig = html
    # 1. Head script: remove any old block, then add a fresh one if ads are on
    html = re.sub(re.escape(HEAD_A) + '.*?' + re.escape(HEAD_Z) + '\n?', '', html, flags=re.S)
    if has_client:
        html = html.replace('</head>', head_block(client, enabled) + '\n</head>', 1)
    # 2. Manual slots: fill when on (and the slot has an id), empty otherwise
    def fill(m):
        name = m.group(1)
        if enabled and mode == 'manual' and slots.get(name):
            return slot_html(name, client, slots[name])
        return f'<!-- ad:{name} --><!-- /ad:{name} -->'
    html = SLOT_RE.sub(fill, html)
    html = swap_text(html, enabled)
    if html != orig:
        open(path, 'w', encoding='utf-8').write(html)
        return True
    return False


def main():
    enabled = bool(CFG.get('enabled'))
    client = CFG.get('client', '')
    has_client = bool(re.fullmatch(r'ca-pub-\d{16}', client)) and client != 'ca-pub-0000000000000000'
    if enabled and not has_client:
        raise SystemExit('ads.enabled is true but ads.client is not a real publisher id (ca-pub-################)')
    mode, slots = CFG.get('mode', 'auto'), CFG.get('slots', {})
    changed = 0
    pages = [p for p in glob.glob(os.path.join(STATIC, '**', '*.html'), recursive=True)
             if os.sep + 'og' + os.sep not in p and os.sep + 'shared' + os.sep not in p]
    for p in pages:
        if os.path.basename(p) in NO_ADS and os.path.dirname(p) == STATIC:
            if process(p, False, client, mode, slots, False):  # these never carry ad code
                changed += 1
            continue
        if process(p, enabled, client, mode, slots, has_client):
            changed += 1
    # The shared footer is loaded on every page: keep its ad wording in step
    # (bump the footer.html ?v= in static/shared/footer.js when this changes it)
    footer = os.path.join(STATIC, 'shared', 'footer.html')
    ftxt = open(footer, encoding='utf-8').read()
    new = swap_text(ftxt, enabled)
    if new != ftxt:
        open(footer, 'w', encoding='utf-8').write(new)
        print('shared/footer.html wording updated: bump its ?v= in static/shared/footer.js')
    ads_txt = os.path.join(STATIC, 'ads.txt')
    if has_client:  # ads.txt is safe (and recommended) as soon as you have a publisher id
        with open(ads_txt, 'w', encoding='utf-8') as f:
            f.write(f'google.com, {client.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n')
    elif os.path.exists(ads_txt):
        os.remove(ads_txt)
    print(f'ads {"ON (" + mode + ")" if enabled else "off"}: {changed} pages updated'
          + (', account tag and ads.txt written' if has_client else ''))


if __name__ == '__main__':
    main()
