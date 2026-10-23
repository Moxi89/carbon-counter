#!/usr/bin/env python3
"""Build the blog from content files.

Each post lives in tools/blog/content/<slug>.html:

    <!--meta
    { "title": "...", "h1": "...", "description": "...", "dek": "...", "category": "...",
      "image": "/blog/images/x.svg", "image_alt": "...", "published": "2025-01-17", "updated": "2026-10-23",
      "takeaways": ["..."], "faq": [["Question", "Answer"]], "sources": [["Name, publisher, year", "https://..."]],
      "related": ["other-slug"], "scripts": ["/blog/js/x.js"] }
    -->
    <section>
        <h2 id="first-section">...</h2>
        ...
    </section>

Run:  python3 tools/blog/build.py
Writes static/blog/posts/<slug>.html and static/blog/index.html.
"""
import html
import json
import math
import os
import re
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CONTENT = os.path.join(os.path.dirname(__file__), 'content')
STATIC = os.path.join(ROOT, 'static')
SITE = 'https://www.carbonemissionscounter.com'
V = '2026-10'
PUBLISHER = {'@type': 'Organization', 'name': 'Carbon Emissions Counter', 'url': SITE + '/'}


def e(s):
    return html.escape(str(s), quote=True)


def strip(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()


def slug_id(text):
    return re.sub(r'[^a-z0-9]+', '-', strip(text).lower()).strip('-')[:60]


def nice_date(iso):
    d = date.fromisoformat(iso)
    return f'{d.day} {d.strftime("%B %Y")}'


def load():
    posts = []
    for f in sorted(os.listdir(CONTENT)):
        if not f.endswith('.html'):
            continue
        raw = open(os.path.join(CONTENT, f), encoding='utf-8').read()
        m = re.match(r'\s*<!--meta\s*(\{.*?\})\s*-->\s*(.*)$', raw, re.S)
        if not m:
            raise SystemExit(f'{f}: missing <!--meta {{...}} --> header')
        meta = json.loads(m.group(1))
        meta['slug'] = f[:-5]
        meta['body'] = m.group(2).strip()
        for key in ('title', 'h1', 'description', 'category', 'image', 'image_alt', 'published', 'updated', 'takeaways', 'sources'):
            if key not in meta:
                raise SystemExit(f'{f}: meta is missing "{key}"')
        posts.append(meta)
    return posts


def add_heading_ids(body):
    """Give every h2 an id and return (body, toc entries)."""
    toc, seen = [], set()

    def fix(m):
        attrs, text = m.group(1), m.group(2)
        idm = re.search(r'\bid="([^"]+)"', attrs)
        hid = idm.group(1) if idm else slug_id(text)
        while hid in seen:
            hid += '-2'
        seen.add(hid)
        toc.append((hid, strip(text)))
        if not idm:
            attrs = f' id="{hid}"' + attrs
        return f'<h2{attrs}>{text}</h2>'

    body = re.sub(r'<h2([^>]*)>(.*?)</h2>', fix, body, flags=re.S)
    return body, toc


def jsonld(obj):
    return '    <script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + '</script>'


def head(title, description, url, og_type, extra_css, schemas, img='home'):
    css = ''.join(f'\n    <link rel="stylesheet" href="{c}">' for c in extra_css)
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{e(title)}</title>
    <meta name="description" content="{e(description)}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="{url}">
    <meta property="og:type" content="{og_type}">
    <meta property="og:url" content="{url}">
    <meta property="og:title" content="{e(title)}">
    <meta property="og:description" content="{e(description)}">
    <meta property="og:site_name" content="Carbon Emissions Counter">
    <meta property="og:image" content="{SITE}/og/{img}.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="{e(title)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="{SITE}/og/{img}.jpg">
    <meta name="theme-color" content="#050b09">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="preload" href="/fonts/fira-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/css/styles.css">
    <link rel="stylesheet" href="/shared/nav-styles.css">
    <link rel="stylesheet" href="/shared/footer-styles.css" media="print" onload="this.media='all'">
    <link rel="stylesheet" href="/shared/cookie-banner.css" media="print" onload="this.media='all'">
    <link rel="stylesheet" href="/css/theme-2026.css?v={V}g">
    <link rel="stylesheet" href="/css/post-2026.css?v={V}">{css}
{chr(10).join(jsonld(s) for s in schemas)}
</head>
<body>
    <div class="container">
        <div id="navbar-placeholder"></div>
        <main role="main" class="bp-main">
'''


def foot(scripts):
    extra = ''.join(f'\n    <script src="{s}?v={V}" defer></script>' for s in scripts)
    return f'''        </main>
        <div id="footer-placeholder"></div>
    </div>
    <script src="/shared/nav.js?v={V}" defer></script>
    <script src="/shared/footer.js?v={V}e" defer></script>
    <script src="/shared/cookie-banner.js?v=2026-10" defer></script>{extra}
</body>
</html>
'''


def card(p, heading='h3'):
    return f'''<a class="bp-card" href="/blog/posts/{p["slug"]}" data-category="{e(p["category"])}">
                    <img src="{e(p["image"])}" alt="" loading="lazy" width="1200" height="630">
                    <span class="bp-card-body">
                        <span class="bp-tag">{e(p["category"])}</span>
                        <{heading} class="bp-card-title">{e(p["h1"])}</{heading}>
                        <span class="bp-card-text">{e(p["description"])}</span>
                        <span class="bp-card-meta">{p["minutes"]} min read &middot; Updated {nice_date(p["updated"])}</span>
                    </span>
                </a>'''


def build_post(p, by_slug):
    url = f'{SITE}/blog/posts/{p["slug"]}'
    body, toc = add_heading_ids(p['body'])
    words = len(strip(body).split())
    p['minutes'] = max(1, math.ceil(words / 220))

    takeaways = ''.join(f'<li>{t}</li>' for t in p['takeaways'])
    toc_html = ''.join(f'<li><a href="#{hid}">{e(t)}</a></li>' for hid, t in toc)
    sources = ''.join(f'<li><a href="{e(u)}" rel="noopener" target="_blank">{e(n)}</a></li>' for n, u in p['sources'])
    faqs = p.get('faq', [])
    faq_html = ''.join(f'''
                    <details class="bp-faq-item">
                        <summary>{e(q)}</summary>
                        <p>{a}</p>
                    </details>''' for q, a in faqs)
    related = [by_slug[s] for s in p.get('related', []) if s in by_slug][:3]

    schemas = [
        {'@context': 'https://schema.org', '@type': 'BlogPosting', 'mainEntityOfPage': {'@type': 'WebPage', '@id': url},
         'headline': p['h1'], 'description': p['description'], 'image': f'{SITE}/og/blog-{p["slug"]}.jpg',
         'datePublished': p['published'], 'dateModified': p['updated'], 'wordCount': words,
         'author': {'@type': 'Organization', 'name': 'Carbon Emissions Counter editorial team', 'url': SITE + '/#about-section'},
         'publisher': PUBLISHER, 'articleSection': p['category'],
         'citation': [u for _, u in p['sources']]},
        {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': SITE + '/blog'},
            {'@type': 'ListItem', 'position': 3, 'name': p['h1'], 'item': url}]},
    ]
    if faqs:
        schemas.append({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
            {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': strip(a)}} for q, a in faqs]})

    published_note = '' if p['published'] == p['updated'] else f' &middot; First published {nice_date(p["published"])}'
    page = head(p['title'], p['description'], url, 'article', [], schemas, f'blog-{p["slug"]}') + f'''            <nav class="bp-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/blog">Blog</a><span aria-hidden="true">/</span><span aria-current="page">{e(p["h1"])}</span></nav>

            <article class="bp-article">
                <header class="bp-header">
                    <p class="bp-tag">{e(p["category"])}</p>
                    <h1 class="bp-title">{e(p["h1"])}</h1>
                    {f'<p class="bp-dek">{e(p["dek"])}</p>' if p.get("dek") else ''}
                    <p class="bp-meta"><time datetime="{p["updated"]}">Updated {nice_date(p["updated"])}</time>{published_note} &middot; {p["minutes"]} min read</p>
                    <p class="bp-share"><button type="button" class="t-share" data-share aria-label="Share this page"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg><span>Share</span></button></p>
                    <figure class="bp-hero-image"><img src="{e(p["image"])}" alt="{e(p["image_alt"])}" width="1200" height="630"></figure>
                </header>

                <aside class="bp-takeaways" aria-labelledby="takeaways-title">
                    <h2 id="takeaways-title">Key takeaways</h2>
                    <ul>{takeaways}</ul>
                </aside>

                {f'<nav class="bp-toc" aria-label="Contents"><p class="bp-toc-title">Contents</p><ol>{toc_html}</ol></nav>' if len(toc) >= 3 else ''}

                <div class="bp-body">
{body}
                </div>

                {f'<section class="bp-faq" aria-labelledby="faq-title"><h2 id="faq-title">Questions and answers</h2>{faq_html}</section>' if faqs else ''}

                <section class="bp-sources" aria-labelledby="sources-title">
                    <h2 id="sources-title">Sources</h2>
                    <ol>{sources}</ol>
                </section>

                <aside class="bp-cta">
                    <p class="bp-cta-title">See the numbers live</p>
                    <p>Watch global CO&#8322; emissions add up in real time, or look up any country.</p>
                    <p class="bp-cta-links"><a href="/">Live counter &rarr;</a><a href="/co2-emissions-by-country">CO&#8322; emissions by country &rarr;</a></p>
                </aside>
            </article>

            {f"""<section class="bp-related" aria-labelledby="related-title">
                <h2 id="related-title">Keep reading</h2>
                <div class="bp-grid">{''.join(card(r) for r in related)}</div>
            </section>""" if related else ''}
'''
    page += foot(p.get('scripts', []))
    out = os.path.join(STATIC, 'blog', 'posts', p['slug'] + '.html')
    open(out, 'w', encoding='utf-8').write(page)
    return words


def build_index(posts):
    posts = sorted(posts, key=lambda p: (p['updated'], p['published']), reverse=True)
    cats = sorted({p['category'] for p in posts})
    chips = '<button type="button" class="bp-chip" data-filter="all" aria-pressed="true">All</button>' + ''.join(
        f'<button type="button" class="bp-chip" data-filter="{e(c)}" aria-pressed="false">{e(c)}</button>' for c in cats)
    url = SITE + '/blog'
    title = 'Climate & Carbon Emissions Blog: Guides and Explainers'
    desc = 'Practical, sourced guides on carbon footprints, home energy, food, transport and climate science, updated for 2026.'
    schemas = [{'@context': 'https://schema.org', '@type': 'Blog', 'name': 'Carbon Emissions Counter blog', 'url': url,
                'description': desc, 'publisher': PUBLISHER,
                'blogPost': [{'@type': 'BlogPosting', 'headline': p['h1'], 'url': f'{SITE}/blog/posts/{p["slug"]}',
                              'dateModified': p['updated']} for p in posts]}]
    page = head(title, desc, url, 'website', [], schemas) + f'''            <nav class="bp-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Blog</span></nav>

            <header class="bp-index-head">
                <h1 class="bp-title">Guides and explainers</h1>
                <p class="bp-dek">Practical, sourced articles on cutting your carbon footprint and understanding the climate numbers behind the live counter.</p>
            </header>

            <div class="bp-chips" role="group" aria-label="Filter by topic">{chips}</div>

            <div class="bp-grid bp-index-grid" id="bpGrid">
                {''.join(card(p, 'h2') for p in posts)}
            </div>
'''
    page += foot(['/blog/js/blog-2026.js'])
    open(os.path.join(STATIC, 'blog', 'index.html'), 'w', encoding='utf-8').write(page)


HOME_FEATURED = ['carbon-footprint-calculator-guide', 'food-climate-solutions', 'transportation-climate-guide']


def update_home(by_slug):
    """Fill the home page's article cards from the featured posts."""
    p = os.path.join(STATIC, 'index.html')
    s = open(p, encoding='utf-8').read()
    cards = '\n'.join(f'''                    <a href="/blog/posts/{q["slug"]}" class="blog-card">
                        <img src="{e(q["image"])}" alt="" width="1200" height="630" loading="lazy">
                        <div class="card-content">
                            <h3>{e(q["h1"])}</h3>
                            <p>{e(q["description"])}</p>
                        </div>
                    </a>''' for q in (by_slug[x] for x in HOME_FEATURED if x in by_slug))
    a, z = '<!-- blog:cards -->', '<!-- /blog:cards -->'
    s = re.sub(re.escape(a) + '.*?' + re.escape(z), lambda _: a + '\n' + cards + '\n                    ' + z, s, flags=re.S)
    open(p, 'w', encoding='utf-8').write(s)


def main():
    posts = load()
    by_slug = {p['slug']: p for p in posts}
    for p in posts:  # first pass sets reading time used by related cards
        p['minutes'] = max(1, math.ceil(len(strip(p['body']).split()) / 220))
    for p in posts:
        w = build_post(p, by_slug)
        print(f'{p["slug"]}: {w} words, title {len(p["title"])} chars, description {len(p["description"])} chars')
    build_index(posts)
    update_home(by_slug)
    print(f'blog index: {len(posts)} posts')


if __name__ == '__main__':
    main()
