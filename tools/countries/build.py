#!/usr/bin/env python3
"""Build the CO2-by-country pages from Our World in Data's CO2 dataset.

Data: Our World in Data, based on the Global Carbon Project's Global Carbon
Budget (CC BY 4.0). https://github.com/owid/co2-data

Yearly update:
    curl -L -o /tmp/owid-co2.csv https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv
    python3 tools/countries/build.py --csv /tmp/owid-co2.csv     # refresh data.json, then build pages
    python3 tools/countries/build.py                             # rebuild pages from data.json only

Writes:
    tools/countries/data.json
    static/co2-emissions-by-country.html
    static/co2-emissions/<slug>.html   (one per featured country)
    static/sitemap.xml
and keeps the country routes in _redirects up to date.
"""
import argparse
import csv
import html
import json
import os
import re
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
STATIC = os.path.join(ROOT, 'static')
DATA_JSON = os.path.join(os.path.dirname(__file__), 'data.json')
SITE = 'https://www.carbonemissionscounter.com'
FEATURED = 30            # countries that get their own page
SERIES_FROM = 2000       # first year in the trend chart
ASSET_V = '2026-10'      # cache-busting tag for shared assets
NOW_YEAR = date.today().year

FUELS = [('coal_co2', 'Coal'), ('oil_co2', 'Oil'), ('gas_co2', 'Gas'),
         ('cement_co2', 'Cement'), ('flaring_co2', 'Flaring'), ('other_industry_co2', 'Other industry')]

DISPLAY_NAMES = {'United States': 'the United States', 'United Kingdom': 'the United Kingdom',
                 'United Arab Emirates': 'the United Arab Emirates', 'Netherlands': 'the Netherlands',
                 'Philippines': 'the Philippines', 'Czechia': 'Czechia'}


def slugify(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Data extraction
# ---------------------------------------------------------------------------

def extract(csv_path):
    rows = list(csv.DictReader(open(csv_path, encoding='utf-8')))
    by = {(r['country'], int(r['year'])): r for r in rows}
    year = max(int(r['year']) for r in rows if r['co2'] and len(r['iso_code']) == 3)
    world = by[('World', year)]
    countries = [r for r in rows if int(r['year']) == year and len(r['iso_code']) == 3
                 and not r['iso_code'].startswith('OWID') and num(r['co2']) is not None]
    countries.sort(key=lambda r: -num(r['co2']))

    cum_sorted = sorted(countries, key=lambda r: -(num(r['cumulative_co2']) or 0))
    cum_rank = {r['country']: i + 1 for i, r in enumerate(cum_sorted)}

    out = []
    for i, r in enumerate(countries):
        name = r['country']
        prev = by.get((name, year - 1), {})
        c = {
            'name': name, 'iso': r['iso_code'], 'slug': slugify(name), 'rank': i + 1,
            'co2': round(num(r['co2']), 1),
            'prev': round(num(prev.get('co2')), 1) if num(prev.get('co2')) is not None else None,
            'pc': round(num(r['co2_per_capita']), 2) if num(r['co2_per_capita']) is not None else None,
            'share': round(num(r['share_global_co2']), 2) if num(r['share_global_co2']) is not None else None,
            'pop': int(num(r['population'])) if num(r['population']) else None,
            'cum': round(num(r['cumulative_co2']) or 0, 0),
            'cum_share': round(num(r['share_global_cumulative_co2']), 2) if num(r['share_global_cumulative_co2']) is not None else None,
            'cum_rank': cum_rank[name],
        }
        if i < FEATURED:
            c['series'] = [[y, round(num(by[(name, y)]['co2']), 1)] for y in range(SERIES_FROM, year + 1)
                           if (name, y) in by and num(by[(name, y)]['co2']) is not None]
            peak = max(((int(rr['year']), num(rr['co2'])) for (n, _), rr in by.items()
                        if n == name and num(rr['co2']) is not None), key=lambda t: t[1])
            c['peak'] = [peak[0], round(peak[1], 1)]
            y2005 = num(by.get((name, 2005), {}).get('co2'))
            c['co2_2005'] = round(y2005, 1) if y2005 else None
            c['fuels'] = [[label, round(num(r[key]) or 0, 1)] for key, label in FUELS]
        out.append(c)

    data = {
        'year': year,
        'source': 'Our World in Data based on the Global Carbon Project (Global Carbon Budget 2025)',
        'world': {'co2': round(num(world['co2']), 1), 'pc': round(num(world['co2_per_capita']), 2),
                  'pop': int(num(world['population']))},
        'countries': out,
    }
    with open(DATA_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f'data.json: {len(out)} countries, year {year}')
    return data


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------

def e(s):
    return html.escape(str(s), quote=True)


def the(name):
    return DISPLAY_NAMES.get(name, name)


def poss(name):
    """Possessive: China’s, the United States’."""
    return name + ('’' if name.endswith('s') else '’s')


def cap(s):
    return s[0].upper() + s[1:]


def tonnes(mt):
    """Million tonnes -> readable words."""
    if mt >= 1000:
        return f'{mt / 1000:.2f} billion tonnes'
    if mt >= 1:
        return f'{mt:,.1f} million tonnes'
    return f'{mt * 1000:,.0f} thousand tonnes'


def short_t(mt):
    if mt >= 1000:
        return f'{mt / 1000:.2f} Gt'
    return f'{mt:,.1f} Mt'


def pct(v, digits=1):
    return f'{v:.{digits}f}%'


def ordinal(n):
    suf = 'th' if 10 <= n % 100 <= 20 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')
    return f'{n}{suf}'


def change_pct(new, old):
    return (new - old) / old * 100 if old else None


def per_second_t(mt):
    return mt * 1e6 / (365 * 24 * 3600)


# ---------------------------------------------------------------------------
# Shared page chrome
# ---------------------------------------------------------------------------

def head(title, description, path, extra_css, schema):
    url = SITE + path
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{e(title)}</title>
    <meta name="description" content="{e(description)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{url}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{url}">
    <meta property="og:title" content="{e(title)}">
    <meta property="og:description" content="{e(description)}">
    <meta name="twitter:card" content="summary">
    <meta name="theme-color" content="#050b09">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="preload" href="/fonts/fira-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/fira-code-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/css/styles.css">
    <link rel="stylesheet" href="/shared/nav-styles.css">
    <link rel="stylesheet" href="/shared/footer-styles.css">
    <link rel="stylesheet" href="/shared/cookie-banner.css">
    <link rel="stylesheet" href="/css/theme-2026.css?v={ASSET_V}d">
    <link rel="stylesheet" href="/css/{extra_css}?v={ASSET_V}">
{schema}
</head>
<body>
    <div class="container">
        <div id="navbar-placeholder"></div>
        <main role="main" class="cc-main">
'''


def foot(js):
    return f'''        </main>
        <div id="footer-placeholder"></div>
    </div>
    <script src="/shared/nav.js?v={ASSET_V}" defer></script>
    <script src="/shared/footer.js?v={ASSET_V}c" defer></script>
    <script src="/shared/cookie-banner.js" defer></script>
    <script src="/js/{js}?v={ASSET_V}" defer></script>
</body>
</html>
'''


def jsonld(obj):
    return ('    <script type="application/ld+json">\n    '
            + json.dumps(obj, ensure_ascii=False, indent=1).replace('\n', '\n    ')
            + '\n    </script>')


def breadcrumb_ld(items):
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList',
            'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': SITE + p}
                                for i, (n, p) in enumerate(items)]}


def faq_ld(faqs):
    return {'@context': 'https://schema.org', '@type': 'FAQPage',
            'mainEntity': [{'@type': 'Question', 'name': q,
                            'acceptedAnswer': {'@type': 'Answer', 'text': re.sub('<[^>]+>', '', a)}}
                           for q, a in faqs]}


def dataset_ld(name, description, path, year):
    return {'@context': 'https://schema.org', '@type': 'Dataset', 'name': name, 'description': description,
            'url': SITE + path, 'temporalCoverage': f'{SERIES_FROM}/{year}',
            'license': 'https://creativecommons.org/licenses/by/4.0/',
            'creator': [{'@type': 'Organization', 'name': 'Global Carbon Project', 'url': 'https://globalcarbonbudget.org/'},
                        {'@type': 'Organization', 'name': 'Our World in Data', 'url': 'https://ourworldindata.org/co2-emissions'}],
            'isBasedOn': 'https://github.com/owid/co2-data'}


def faq_html(faqs):
    items = '\n'.join(f'''                <details class="cc-faq-item">
                    <summary>{e(q)}</summary>
                    <p>{a}</p>
                </details>''' for q, a in faqs)
    return f'''            <section class="cc-section" aria-labelledby="faq-title">
                <h2 class="cc-h2" id="faq-title">Questions and answers</h2>
                <div class="cc-faq">
{items}
                </div>
            </section>
'''


def source_html(year):
    return f'''            <p class="cc-source">Data: <a href="https://ourworldindata.org/co2-emissions" rel="noopener">Our World in Data</a>, based on the
                <a href="https://globalcarbonbudget.org/" rel="noopener">Global Carbon Project</a> (Global Carbon Budget 2025), CC&nbsp;BY&nbsp;4.0.
                Annual figures are fossil-fuel and industry CO&#8322; for {year}, the latest complete year. Live counters are estimates that assume {year} emission rates continue.
                <a href="/carbon-tracking-guide">How the counter works &rarr;</a></p>
'''


# ---------------------------------------------------------------------------
# Country page
# ---------------------------------------------------------------------------

def trend_svg(series, name):
    w, h, pad_l, pad_b, pad_t = 640, 220, 8, 22, 10
    vals = [v for _, v in series]
    vmax = max(vals) * 1.08
    n = len(series)
    bw = (w - pad_l * 2) / n
    bars = []
    for i, (y, v) in enumerate(series):
        bh = (v / vmax) * (h - pad_b - pad_t)
        x = pad_l + i * bw + bw * 0.15
        cls = 'cc-bar cc-bar-last' if i == n - 1 else 'cc-bar'
        bars.append(f'<rect class="{cls}" x="{x:.1f}" y="{h - pad_b - bh:.1f}" width="{bw * 0.7:.1f}" height="{bh:.1f}" rx="2"><title>{y}: {v:,.1f} Mt</title></rect>')
    labels = ''.join(f'<text class="cc-axis" x="{pad_l + i * bw + bw / 2:.1f}" y="{h - 6}" text-anchor="middle">{y}</text>'
                     for i, (y, _) in enumerate(series) if y % 5 == 0 or i == n - 1)
    first, last = series[0], series[-1]
    label = (f'Bar chart of {name} CO2 emissions from {first[0]} to {last[0]}: '
             f'{first[1]:,.0f} million tonnes in {first[0]}, {last[1]:,.0f} million tonnes in {last[0]}.')
    return (f'<svg class="cc-trend" viewBox="0 0 {w} {h}" role="img" aria-label="{e(label)}" preserveAspectRatio="none">'
            + ''.join(bars) + labels + '</svg>')


def country_page(c, data, by_rank, featured_slugs):
    year, world = data['year'], data['world']
    name, the_name = c['name'], the(c['name'])
    path = f'/co2-emissions/{c["slug"]}'
    n_countries = len(data['countries'])

    growth = change_pct(c['co2'], c['prev']) if c['prev'] else None
    since05 = change_pct(c['co2'], c['co2_2005']) if c.get('co2_2005') else None
    ratio = c['pc'] / world['pc'] if c['pc'] else None
    fuels = [(l, v) for l, v in c['fuels'] if v > 0]
    fuel_total = sum(v for _, v in fuels) or 1
    top_fuel = max(fuels, key=lambda t: t[1])
    rate = per_second_t(c['co2'])
    peak_y, peak_v = c['peak']

    # --- sentences built from the data ---
    lead = (f'{cap(the_name)} emitted <strong>{tonnes(c["co2"])}</strong> of CO&#8322; from fossil fuels and industry in {year}: '
            f'<strong>{pct(c["share"])}</strong> of the world total, '
            + ('the most of any country.' if c['rank'] == 1 else f'the {ordinal(c["rank"])} most of {n_countries} countries.'))

    if ratio is None:
        pc_text = 'Per-person figures are not available.'
    elif ratio >= 1.05:
        pc_text = f'That is {c["pc"]:.1f} tonnes per person, {ratio:.1f}&times; the world average of {world["pc"]:.1f}&nbsp;t.'
    elif ratio <= 0.95:
        pc_text = f'That is {c["pc"]:.1f} tonnes per person, {100 - ratio * 100:.0f}% below the world average of {world["pc"]:.1f}&nbsp;t.'
    else:
        pc_text = f'That is {c["pc"]:.1f} tonnes per person, close to the world average of {world["pc"]:.1f}&nbsp;t.'

    if growth is None:
        trend_text = ''
    elif abs(growth) < 0.5:
        trend_text = f'Emissions were roughly flat in {year} ({growth:+.1f}% on {year - 1}).'
    else:
        trend_text = f'Emissions {"rose" if growth > 0 else "fell"} {abs(growth):.1f}% in {year} compared with {year - 1}.'

    if peak_y == year:
        peak_text = f'{year} was the highest year on record.'
    else:
        below = change_pct(c['co2'], peak_v)
        peak_text = f'Emissions peaked in {peak_y} at {tonnes(peak_v)} and are now {abs(below):.0f}% lower.'

    since_text = (f'Compared with 2005, emissions are {"up" if since05 > 0 else "down"} {abs(since05):.0f}%.'
                  if since05 is not None and peak_y != 2005 else '')

    # --- neighbours in the ranking ---
    lo, hi = max(1, c['rank'] - 2), min(n_countries, c['rank'] + 2)
    neighbour_rows = []
    for r in range(lo, hi + 1):
        o = by_rank[r]
        nm = e(o['name'])
        link = f'<a href="/co2-emissions/{o["slug"]}">{nm}</a>' if o['slug'] in featured_slugs and o['slug'] != c['slug'] else nm
        cur = ' class="cc-current" aria-current="true"' if o['slug'] == c['slug'] else ''
        neighbour_rows.append(f'<tr{cur}><td>{r}</td><th scope="row">{link}</th><td>{short_t(o["co2"])}</td>'
                              f'<td>{pct(o["share"]) if o["share"] is not None else "–"}</td>'
                              f'<td>{o["pc"]:.1f} t</td></tr>' if o['pc'] is not None else
                              f'<tr{cur}><td>{r}</td><th scope="row">{link}</th><td>{short_t(o["co2"])}</td><td>–</td><td>–</td></tr>')

    fuel_bar = ''.join(f'<span class="cc-fuel cc-fuel-{slugify(l)}" style="width:{v / fuel_total * 100:.2f}%" title="{e(l)} {v / fuel_total * 100:.1f}%"></span>'
                       for l, v in fuels)
    fuel_list = ''.join(f'<li><span class="cc-swatch cc-fuel-{slugify(l)}" aria-hidden="true"></span><span>{e(l)}</span>'
                        f'<strong>{v / fuel_total * 100:.0f}%</strong><em>{short_t(v)}</em></li>' for l, v in fuels)
    table_rows = ''.join(f'<tr><th scope="row">{y}</th><td>{v:,.1f}</td></tr>' for y, v in reversed(c['series']))

    faqs = [
        (f'How much CO₂ does {the_name} emit?',
         f'{cap(the_name)} emitted {tonnes(c["co2"])} of CO₂ from fossil fuels and industry in {year}, '
         f'{pct(c["share"])} of global emissions. That is about {rate:,.0f} tonnes every second.'),
        (f'What are {poss(the_name)} CO₂ emissions per person?',
         f'{cap(the_name)} emits ' + pc_text.replace("That is ", "").replace("&times;", "×").replace("&nbsp;", " ") + f' Per-person emissions divide the national total by population ({c["pop"] / 1e6:,.1f} million people in {year}).'
         if c['pc'] else 'Per-person figures are not available.'),
        (f'Are {poss(the_name)} CO₂ emissions rising or falling?',
         ' '.join(t for t in [trend_text, since_text, peak_text] if t)),
        (f'What is the main source of CO₂ emissions in {the_name}?',
         f'{top_fuel[0]} is the largest source, at {top_fuel[1] / fuel_total * 100:.0f}% of {poss(the_name)} fossil and industry CO₂ in {year} ({tonnes(top_fuel[1])}).'),
        (f'How much has {the_name} contributed to historical CO₂ emissions?',
         f'Since 1750, {the_name} has emitted about {c["cum"] / 1000:,.0f} billion tonnes of fossil CO₂, '
         f'{pct(c["cum_share"])} of the world total, the '
         + ('largest historical contribution of any country.' if c['cum_rank'] == 1 else f'{ordinal(c["cum_rank"])} largest historical contribution.')),
    ]

    title = f'{name} CO₂ Emissions {NOW_YEAR}: Live Counter, Per Capita & Trend'
    desc = (f'{name} emitted {short_t(c["co2"])} of CO₂ in {year} ({pct(c["share"])} of the world, #{c["rank"]}). '
            f'Live counter, per-person emissions, trend since {SERIES_FROM} and main sources.')
    schema = '\n'.join(jsonld(x) for x in [
        breadcrumb_ld([('Home', '/'), ('CO₂ emissions by country', '/co2-emissions-by-country'), (name, path)]),
        faq_ld(faqs),
        dataset_ld(f'{name} CO₂ emissions {SERIES_FROM}–{year}', desc, path, year),
    ])

    stat = lambda label, value, sub='': (f'<div class="cc-stat"><p class="cc-stat-label">{label}</p>'
                                          f'<p class="cc-stat-value">{value}</p>' + (f'<p class="cc-stat-sub">{sub}</p>' if sub else '') + '</div>')
    growth_cls = 'cc-up' if growth and growth > 0 else 'cc-down'
    stats = ''.join([
        stat(f'CO&#8322; in {year}', short_t(c['co2']), f'{tonnes(c["co2"])}'),
        stat('World rank', f'#{c["rank"]}', f'of {n_countries} countries'),
        stat('Share of world', pct(c['share']), f'world total {short_t(world["co2"])}'),
        stat('Per person', f'{c["pc"]:.1f} t' if c['pc'] else '–', f'world average {world["pc"]:.1f} t'),
        stat(f'Change vs {year - 1}', f'<span class="{growth_cls}">{growth:+.1f}%</span>' if growth is not None else '–',
             f'{year - 1}: {short_t(c["prev"])}' if c['prev'] else ''),
        stat('Historical share', pct(c['cum_share']) if c['cum_share'] is not None else '–', f'#{c["cum_rank"]} since 1750'),
    ])

    body = f'''            <nav class="cc-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/co2-emissions-by-country">CO&#8322; emissions by country</a><span aria-hidden="true">/</span><span aria-current="page">{e(name)}</span></nav>

            <section class="cc-hero" aria-labelledby="cc-title">
                <p class="cc-eyebrow"><span class="cc-dot" aria-hidden="true"></span>Live estimate</p>
                <h1 class="cc-title" id="cc-title">{e(name)} CO&#8322; Emissions</h1>
                <p class="cc-lede">{lead} {pc_text}</p>
                <div class="cc-live" data-rate="{rate:.4f}">
                    <p class="cc-live-label">Estimated CO&#8322; emitted by {e(the_name)} in <span class="current-year">{NOW_YEAR}</span> so far</p>
                    <p class="cc-live-number" data-live="year">0</p>
                    <p class="cc-live-sub"><span data-live="session">0</span> tonnes since you opened this page &middot; {rate:,.0f}&nbsp;t every second</p>
                </div>
            </section>

            <section class="cc-stats" aria-label="Key figures">{stats}</section>

            <section class="cc-section cc-two">
                <div class="cc-card">
                    <h2 class="cc-h2">Trend since {SERIES_FROM}</h2>
                    <p class="cc-card-text">{trend_text} {since_text} {peak_text}</p>
                    {trend_svg(c["series"], name)}
                    <details class="cc-data">
                        <summary>Show yearly data (million tonnes)</summary>
                        <table class="cc-table cc-table-compact"><thead><tr><th scope="col">Year</th><th scope="col">CO&#8322; (Mt)</th></tr></thead><tbody>{table_rows}</tbody></table>
                    </details>
                </div>
                <div class="cc-card">
                    <h2 class="cc-h2">Where it comes from</h2>
                    <p class="cc-card-text">{e(top_fuel[0])} is the largest source of {e(poss(the_name))} CO&#8322;, at {top_fuel[1] / fuel_total * 100:.0f}%.</p>
                    <div class="cc-fuelbar" role="img" aria-label="Share of CO2 by source">{fuel_bar}</div>
                    <ul class="cc-fuel-list">{fuel_list}</ul>
                </div>
            </section>

            <section class="cc-section">
                <h2 class="cc-h2">How {e(the_name)} compares</h2>
                <div class="cc-table-wrap">
                    <table class="cc-table">
                        <thead><tr><th scope="col">Rank</th><th scope="col">Country</th><th scope="col">CO&#8322; {year}</th><th scope="col">Share</th><th scope="col">Per person</th></tr></thead>
                        <tbody>{"".join(neighbour_rows)}</tbody>
                    </table>
                </div>
                <p class="cc-more"><a href="/co2-emissions-by-country">See all {n_countries} countries &rarr;</a> &middot; <a href="/">Global live counter &rarr;</a></p>
            </section>

{faq_html(faqs)}
{source_html(year)}'''
    return head(title, desc, path, 'country-2026.css', schema) + body + foot('country-2026.js')


# ---------------------------------------------------------------------------
# Ranking page
# ---------------------------------------------------------------------------

def ranking_page(data, featured_slugs):
    year, world = data['year'], data['world']
    cs = data['countries']
    path = '/co2-emissions-by-country'
    top = cs[:3]
    big = [c for c in cs if c['pop'] and c['pop'] > 1_000_000 and c['pc'] is not None]
    pc_top = sorted(big, key=lambda c: -c['pc'])[:3]
    cum_top = sorted(cs, key=lambda c: -c['cum'])[:3]
    top3_share = sum(c['share'] for c in top)

    rows = []
    for c in cs:
        nm = e(c['name'])
        link = f'<a href="/co2-emissions/{c["slug"]}">{nm}</a>' if c['slug'] in featured_slugs else nm
        g = change_pct(c['co2'], c['prev']) if c['prev'] else None
        pc_txt = f'{c["pc"]:.1f}' if c['pc'] is not None else '–'
        gtxt = f'<span class="{"cc-up" if g > 0 else "cc-down"}">{g:+.1f}%</span>' if g is not None else '–'
        rows.append(
            f'<tr data-name="{nm.lower()}" data-co2="{c["co2"]}" data-pc="{c["pc"] if c["pc"] is not None else -1}" data-rate="{per_second_t(c["co2"]):.4f}">'
            f'<td class="cc-rank">{c["rank"]}</td><th scope="row">{link}</th>'
            f'<td class="cc-num">{c["co2"]:,.1f}</td>'
            f'<td class="cc-num cc-col-share">{pct(c["share"]) if c["share"] is not None else "–"}</td>'
            f'<td class="cc-num">{pc_txt}</td>'
            f'<td class="cc-num cc-col-change">{gtxt}</td>'
            f'<td class="cc-num cc-live-cell cc-col-live" data-live="row">–</td></tr>')

    faqs = [
        ('Which country emits the most CO₂?',
         f'{cap(the(top[0]["name"]))} emits the most CO₂: {tonnes(top[0]["co2"])} in {year}, {pct(top[0]["share"])} of the world total. '
         f'{cap(the(top[1]["name"]))} ({tonnes(top[1]["co2"])}) and {the(top[2]["name"])} ({tonnes(top[2]["co2"])}) follow. Together the top three produce {top3_share:.0f}% of global fossil CO₂.'),
        ('Which country has the highest CO₂ emissions per person?',
         f'Among countries with more than one million people, {pc_top[0]["name"]} has the highest emissions per person at {pc_top[0]["pc"]:.1f} tonnes, '
         f'followed by {pc_top[1]["name"]} ({pc_top[1]["pc"]:.1f} t) and {pc_top[2]["name"]} ({pc_top[2]["pc"]:.1f} t). The world average is {world["pc"]:.1f} tonnes.'),
        ('Which countries have emitted the most CO₂ in history?',
         f'Since 1750, {the(cum_top[0]["name"])} has emitted the most fossil CO₂ ({pct(cum_top[0]["cum_share"])} of the total), '
         f'followed by {the(cum_top[1]["name"])} ({pct(cum_top[1]["cum_share"])}) and {the(cum_top[2]["name"])} ({pct(cum_top[2]["cum_share"])}).'),
        ('How much CO₂ does the world emit per year?',
         f'Fossil fuels and industry released {tonnes(world["co2"])} of CO₂ in {year}, about {world["pc"]:.1f} tonnes per person. '
         'Including land-use change such as deforestation, the Global Carbon Budget 2025 puts total emissions at about 42.2 billion tonnes a year.'),
        ('Where does this data come from?',
         'Country figures come from Our World in Data, based on the Global Carbon Project’s Global Carbon Budget. '
         'They cover CO₂ from fossil fuels and industry (coal, oil, gas, cement, flaring) produced within each country’s borders.'),
    ]

    title = f'CO₂ Emissions by Country {NOW_YEAR}: Live Ranking of {len(cs)} Countries'
    desc = (f'Every country ranked by CO₂ emissions, with per-person figures, yearly change and live counters. '
            f'{top[0]["name"]} ({pct(top[0]["share"])}), {top[1]["name"]} and {top[2]["name"]} lead. Data for {year}.')
    schema = '\n'.join(jsonld(x) for x in [
        breadcrumb_ld([('Home', '/'), ('CO₂ emissions by country', path)]),
        faq_ld(faqs),
        dataset_ld(f'CO₂ emissions by country {year}', desc, path, year),
    ])

    podium = ''.join(f'''<a class="cc-podium-item" href="/co2-emissions/{c["slug"]}">
                        <span class="cc-podium-rank">#{c["rank"]}</span>
                        <span class="cc-podium-name">{e(c["name"])}</span>
                        <span class="cc-podium-value">{short_t(c["co2"])}</span>
                        <span class="cc-podium-sub">{pct(c["share"])} of world &middot; {c["pc"]:.1f} t per person</span>
                    </a>''' for c in top)

    body = f'''            <nav class="cc-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">CO&#8322; emissions by country</span></nav>

            <section class="cc-hero" aria-labelledby="cc-title">
                <p class="cc-eyebrow"><span class="cc-dot" aria-hidden="true"></span>{len(cs)} countries &middot; {year} data</p>
                <h1 class="cc-title" id="cc-title">CO&#8322; Emissions by Country</h1>
                <p class="cc-lede"><strong>{cap(the(top[0]["name"]))}</strong> emits the most CO&#8322; ({short_t(top[0]["co2"])}, {pct(top[0]["share"])} of the world), followed by
                    {the(top[1]["name"])} and {the(top[2]["name"])}. Per person, {pc_top[0]["name"]} ranks highest at {pc_top[0]["pc"]:.1f}&nbsp;tonnes, against a world average of {world["pc"]:.1f}&nbsp;t.</p>
                <div class="cc-podium">{podium}</div>
            </section>

            <section class="cc-section" aria-labelledby="rank-title">
                <div class="cc-table-head">
                    <h2 class="cc-h2" id="rank-title">Full ranking</h2>
                    <div class="cc-controls">
                        <label class="cc-search"><span class="cc-visually-hidden">Find a country</span><input type="search" id="ccFilter" placeholder="Find a country" autocomplete="off"></label>
                        <div class="cc-segment" role="group" aria-label="Sort by">
                            <button type="button" data-sort="co2" aria-pressed="true">Total</button>
                            <button type="button" data-sort="pc" aria-pressed="false">Per person</button>
                        </div>
                    </div>
                </div>
                <div class="cc-table-wrap">
                    <table class="cc-table cc-ranking" id="ccRanking">
                        <thead><tr>
                            <th scope="col">#</th><th scope="col">Country</th><th scope="col" class="cc-num">CO&#8322; {year} (Mt)</th>
                            <th scope="col" class="cc-num cc-col-share">Share</th><th scope="col" class="cc-num">Per person (t)</th>
                            <th scope="col" class="cc-num cc-col-change">vs {year - 1}</th><th scope="col" class="cc-num cc-col-live">{NOW_YEAR} so far (t)</th>
                        </tr></thead>
                        <tbody>
{chr(10).join(rows)}
                        </tbody>
                    </table>
                </div>
                <p class="cc-note" id="ccNoResults" hidden>No country matches that search.</p>
            </section>

{faq_html(faqs)}
{source_html(year)}'''
    return head(title, desc, path, 'country-2026.css', schema) + body + foot('country-2026.js')


# ---------------------------------------------------------------------------
# Sitemap & redirects
# ---------------------------------------------------------------------------

STATIC_URLS = [
    ('/', 'daily', '1.0'), ('/co2-emissions-by-country', 'weekly', '0.9'),
    ('/carbon-tracking-guide', 'monthly', '0.7'), ('/blog', 'weekly', '0.7'),
    ('/privacy', 'yearly', '0.2'), ('/terms', 'yearly', '0.2'),
]


def write_sitemap(featured):
    today = date.today().isoformat()
    urls = list(STATIC_URLS)
    urls += [(f'/co2-emissions/{c["slug"]}', 'weekly', '0.8') for c in featured]
    posts = sorted(f[:-5] for f in os.listdir(os.path.join(STATIC, 'blog', 'posts')) if f.endswith('.html'))
    urls += [(f'/blog/posts/{p}', 'monthly', '0.6') for p in posts]
    body = '\n'.join(f'''    <url>
        <loc>{SITE}{u}</loc>
        <lastmod>{today}</lastmod>
        <changefreq>{cf}</changefreq>
        <priority>{pr}</priority>
    </url>''' for u, cf, pr in urls)
    with open(os.path.join(STATIC, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}\n</urlset>\n')
    print(f'sitemap.xml: {len(urls)} URLs')


def write_redirects(featured):
    p = os.path.join(ROOT, '_redirects')
    text = open(p, encoding='utf-8').read()
    start, end = '# BEGIN country pages (generated by tools/countries/build.py)', '# END country pages'
    block = [start, '/co2-emissions-by-country  /static/co2-emissions-by-country.html  200']
    block += [f'/co2-emissions/{c["slug"]}  /static/co2-emissions/{c["slug"]}.html  200' for c in featured]
    block.append(end)
    block = '\n'.join(block)
    if start in text:
        text = re.sub(re.escape(start) + '.*?' + re.escape(end), block, text, flags=re.S)
    else:
        marker = '# Catch-all for clean URLs'
        text = text.replace(marker, block + '\n\n' + marker) if marker in text else block + '\n\n' + text
    open(p, 'w', encoding='utf-8').write(text)
    print('_redirects: country routes updated')


def update_home(data, featured):
    """Refresh the country picker and top-emitters bars on the home page."""
    p = os.path.join(STATIC, 'index.html')
    s = open(p, encoding='utf-8').read()
    top_share = featured[0]['share']
    opts = '\n'.join(f'                            <option value="{c["slug"]}" data-share="{c["share"]}" data-mt="{c["co2"]}">{e(c["name"])}</option>'
                     for c in featured)
    bars = '\n'.join(f'                        <li><a class="cx-bar-name" href="/co2-emissions/{c["slug"]}">{e(c["name"])}</a>'
                     f'<span class="cx-bar"><span style="width: {c["share"] / top_share * 100:.1f}%"></span></span>'
                     f'<span class="cx-bar-val">{c["share"]:.1f}%</span></li>' for c in featured[:6])

    def fill(text, key, content, indent=''):
        a, z = f'<!-- countries:{key} -->', f'<!-- /countries:{key} -->'
        return re.sub(re.escape(a) + '.*?' + re.escape(z), lambda _: a + content + z, text, flags=re.S)

    s = fill(s, 'options', '\n' + opts + '\n                            ')
    s = fill(s, 'bars', '\n' + bars + '\n                        ')
    s = fill(s, 'year', str(data['year']))
    open(p, 'w', encoding='utf-8').write(s)
    print('index.html: country picker and top emitters updated')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--csv', help='path to owid-co2-data.csv; refreshes data.json')
    args = ap.parse_args()
    data = extract(args.csv) if args.csv else json.load(open(DATA_JSON, encoding='utf-8'))

    by_rank = {c['rank']: c for c in data['countries']}
    featured = [c for c in data['countries'] if 'series' in c]
    featured_slugs = {c['slug'] for c in featured}

    os.makedirs(os.path.join(STATIC, 'co2-emissions'), exist_ok=True)
    for c in featured:
        with open(os.path.join(STATIC, 'co2-emissions', c['slug'] + '.html'), 'w', encoding='utf-8') as f:
            f.write(country_page(c, data, by_rank, featured_slugs))
    with open(os.path.join(STATIC, 'co2-emissions-by-country.html'), 'w', encoding='utf-8') as f:
        f.write(ranking_page(data, featured_slugs))
    print(f'pages: ranking + {len(featured)} countries')
    write_sitemap(featured)
    write_redirects(featured)
    update_home(data, featured)


if __name__ == '__main__':
    main()
