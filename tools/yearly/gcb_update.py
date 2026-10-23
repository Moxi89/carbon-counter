#!/usr/bin/env python3
"""Release-day helper for the yearly Global Carbon Budget update.

Fill the "next" block in tools/yearly/gcb.json with the new edition's headline
figures, then:

    python3 tools/yearly/gcb_update.py            # dry run: derived figures + every change, file by file
    python3 tools/yearly/gcb_update.py --apply    # write the changes and bump cache versions
    python3 tools/yearly/gcb_update.py --draft    # fill the key-findings draft and add it to the blog

The script only edits the pages that show the live headline figures (home, methodology,
counter scripts, widget, footer, country-page generator, share images, content guide).
Blog posts are listed for review, not edited: many describe a past edition on purpose.

Derived figures (per second, minute, hour, day, years left, run-out date, shares) are
computed here, so they always agree with each other. Runbook: docs/GCB2026.md.
"""
import argparse
import glob
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
INPUTS = os.path.join(ROOT, 'tools', 'yearly', 'gcb.json')
SECONDS_PER_YEAR = 365 * 24 * 3600

# Pages that show the live headline figures. Paths relative to the repo root.
CORE_FILES = [
    'static/index.html',
    'static/methodology.html',
    'static/js/home-2026.js',
    'static/embed.html',
    'static/widget.html',
    'static/shared/footer.html',
    'tools/countries/build.py',
    'tools/og/jobs.py',
]
# Only this part of the content guide is edited.
GUIDE = ('tools/blog/CONTENT_GUIDE.md', '## Core figures', '## Existing posts')

# Each template is rendered with the current and the next figures; the current text is
# replaced by the next. Longer matches win, and numbers never match inside longer numbers.
TEMPLATES = [
    # Links to the key-findings post follow the new post
    '/blog/posts/{post_slug}">Global Carbon Budget {edition}: key findings',
    # Country data is Our World in Data's copy of the budget: it changes when OWID updates
    'Global Carbon Project (Global Carbon Budget {owid_edition})',
    'Global Carbon Project</a> (Global Carbon Budget {owid_edition})',
    # Edition and paper
    'Global Carbon Budget {edition}',
    'GCB {edition}',
    '{paper_url}',
    # Annual totals
    '{total}e9', '{total} billion', '{total}&nbsp;Gt', '{total} Gt',
    '{fossil} billion', '{fossil}&nbsp;Gt', '{fossil} Gt',
    '{landuse} billion', '{landuse}&nbsp;Gt', '{landuse} Gt',
    'fossil {fossil} + land use {landuse}',
    'width: {fossil_share}%', 'width: {land_share}%',
    'Fossil fuels {fossil_share_int} percent, land use {land_share_int} percent',
    '{fossil_trend_about}', '{fossil_trend} on {prev_year}',
    # Rates
    '{per_second}', '{per_minute}', '{per_hour} million', '{per_day} million', '{cars} cars',
    # Year labels tied to the emissions year
    'the {year} annual total', 'Gt in {year})', 'headline estimate for {year}',
    '{year} estimates from the Global Carbon Budget', 'puts {year} emissions',
    # Atmospheric CO2
    '{ppm} parts per million (ppm) on average in {year}',
    '{ppm_pct}% above the pre-industrial',
    # Remaining 1.5 °C budget
    'BUDGET_START_GT = {budget};', 'BUDGET_T = {budget}e9;', '>{budget_2dp}<',
    '{budget} billion tonnes', '{budget} Gt',
    'Date.UTC({budget_start}, 0, 1)',
    '1 January {budget_start}', '1&nbsp;January {budget_start}', '1 Jan {budget_start}',
    'from January {budget_start}', 'from the start of {budget_start}',
    'Gt ({budget_start})', '0 Gt ({runout_year})',
    'about {years_words} years', 'about {years_int} years at {year} rates', 'around {runout}',
    '&asymp; {years_1dp} years',
    # Content guide table
    'emissions {year} (fossil', 'Fossil CO₂ {year} |', 'Land-use change CO₂ {year} |',
    'record high, {fossil_change_signed}',
]

# Text that looks like a template match but belongs to another source; left alone.
PROTECT = [
    '130 Gt CO₂ from the start of 2026',  # Indicators of Global Climate Change, not the GCB
]

NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
                'eleven', 'twelve']


def fmt1(x):
    return f'{x:.1f}'


def num(x):
    """170 -> '170', 170.5 -> '170.5'."""
    return str(int(x)) if float(x).is_integer() else f'{x:g}'


def signed_pct(x):
    return f'+{x:.1f}%' if x >= 0 else f'−{abs(x):.1f}%'


def derive(f):
    """All text forms of the figures, as they appear on the site."""
    missing = [k for k, v in f.items() if v is None and not k.startswith('_')]
    if missing:
        raise ValueError('missing: ' + ', '.join(missing))
    t = f['total_gt'] * 1e9
    per_s = t / SECONDS_PER_YEAR
    years = f['budget_15_gt'] / f['total_gt']
    runout = f['budget_start_year'] + years
    part = runout - int(runout)
    fossil_share = round(f['fossil_gt'] / (f['fossil_gt'] + f['landuse_gt']) * 100, 1)
    c = f['fossil_change_pct']
    trend = ('up' if c >= 0 else 'down') + f' {abs(c):.1f}%'
    years_int = round(years)
    return {
        'edition': str(f['edition']),
        'year': str(f['year']),
        'prev_year': str(f['year'] - 1),
        'owid_edition': str(f['owid_edition']),
        'post_slug': f['post_slug'],
        'paper_url': f['paper_url'],
        'total': fmt1(f['total_gt']),
        'fossil': fmt1(f['fossil_gt']),
        'landuse': fmt1(f['landuse_gt']),
        'fossil_share': fmt1(fossil_share),
        'land_share': fmt1(100 - fossil_share),
        'fossil_share_int': str(round(fossil_share)),
        'land_share_int': str(100 - round(fossil_share)),
        'fossil_trend': trend,
        'fossil_trend_about': trend.replace(' ', ' about ', 1),
        'fossil_change_signed': signed_pct(c),
        'per_second': f'{round(per_s):,}',
        'per_minute': f'{int(round(per_s * 60, -2)):,}',
        'per_hour': fmt1(t / 8760 / 1e6),
        'per_day': fmt1(t / 365 / 1e6),
        'cars': str(int(round(per_s / 4.6, -1))),  # US EPA: 4.6 t CO2 per typical car a year
        'ppm': fmt1(f['ppm']),
        'ppm_pct': str(f['ppm_above_preindustrial_pct']),
        'budget': num(f['budget_15_gt']),
        'budget_2dp': f"{f['budget_15_gt']:.2f}",
        'budget_start': str(f['budget_start_year']),
        'years_1dp': fmt1(years),
        'years_int': str(years_int),
        'years_words': NUMBER_WORDS[years_int] if years_int < len(NUMBER_WORDS) else str(years_int),
        'runout_year': str(int(runout)),
        'runout': ('early' if part < 0.34 else 'mid' if part < 0.67 else 'late') + f' {int(runout)}',
    }


def build_mapping(cur, nxt):
    mapping = {}
    for tpl in TEMPLATES:
        old, new = tpl.format(**cur), tpl.format(**nxt)
        if old in mapping and mapping[old] != new:
            sys.exit(f'Two templates disagree about "{old}": "{mapping[old]}" vs "{new}"')
        mapping[old] = new
    for p in PROTECT:
        mapping[p] = p
    return mapping


def build_regex(mapping):
    # Longest first, so the most specific text wins at the same position.
    alts = sorted(mapping, key=len, reverse=True)
    body = '|'.join(re.escape(a) for a in alts)
    # A number never matches in the middle of a longer number (e.g. 42.2 inside 142.2).
    return re.compile(r'(?<![\d.,])(?:' + body + r')(?![\d])')


def region(text, path):
    if path != GUIDE[0]:
        return 0, len(text)
    start = text.find(GUIDE[1])
    end = text.find(GUIDE[2], start)
    if start < 0 or end < 0:
        sys.exit(f'{path}: could not find the core figures section')
    return start, end


def plan(mapping):
    """Return {path: (old_text, new_text, [(line, old, new), ...])} for files that change."""
    rx = build_regex(mapping)
    out = {}
    for path in CORE_FILES + [GUIDE[0]]:
        full = os.path.join(ROOT, path)
        text = open(full, encoding='utf-8').read()
        a, b = region(text, path)
        changes = []

        def sub(m):
            new = mapping[m.group(0)]
            if new != m.group(0):
                line = text.count('\n', 0, a + m.start()) + 1
                changes.append((line, m.group(0), new))
            return new
        new_text = text[:a] + rx.sub(sub, text[a:b]) + text[b:]
        if changes:
            out[path] = (text, new_text, changes)
    return out


def template_coverage(cur):
    """How often each template's current text appears in the core files (sanity check)."""
    texts = {}
    for path in CORE_FILES + [GUIDE[0]]:
        text = open(os.path.join(ROOT, path), encoding='utf-8').read()
        a, b = region(text, path)
        texts[path] = text[a:b]
    rows = []
    for tpl in TEMPLATES:
        s = tpl.format(**cur)
        rx = re.compile(r'(?<![\d.,])' + re.escape(s) + r'(?![\d])')
        rows.append((tpl, s, sum(len(rx.findall(t)) for t in texts.values())))
    return rows


def bump_letter(v):
    return v[:-1] + chr(ord(v[-1]) + 1) if v[-1] != 'z' else v + 'a'


def bump_versions(changed):
    """Cache-busting: /js/ and /shared/ files are cached for a year, so bump their ?v=."""
    edits = []
    if 'static/js/home-2026.js' in changed:
        p = os.path.join(ROOT, 'static/index.html')
        s = open(p, encoding='utf-8').read()
        s2 = re.sub(r'(home-2026\.js\?v=)([0-9a-z-]+)', lambda m: m.group(1) + bump_letter(m.group(2)), s)
        open(p, 'w', encoding='utf-8').write(s2)
        edits.append('home-2026.js ?v= in static/index.html')
    if 'static/shared/footer.html' in changed:
        # footer.js fetches footer.html with a ?v=, and every page loads footer.js with a ?v=
        p = os.path.join(ROOT, 'static/shared/footer.js')
        s = open(p, encoding='utf-8').read()
        s = re.sub(r"(/shared/footer\?v=)([0-9a-z-]+)", lambda m: m.group(1) + bump_letter(m.group(2)), s)
        open(p, 'w', encoding='utf-8').write(s)
        rx = re.compile(r'(footer\.js\?v=(?:\{V\}|\{ASSET_V\}|[0-9-]+))([a-z]+)')
        files = glob.glob(os.path.join(ROOT, 'static', '**', '*.html'), recursive=True)
        files += [os.path.join(ROOT, 'tools', d, 'build.py') for d in ('blog', 'countries')]
        for p in files:
            s = open(p, encoding='utf-8').read()
            s2 = rx.sub(lambda m: m.group(1) + bump_letter(m.group(2)), s)
            if s2 != s:
                open(p, 'w', encoding='utf-8').write(s2)
        p = os.path.join(ROOT, 'tools/pages/build.py')
        s = open(p, encoding='utf-8').read()
        s = re.sub(r"('footer': ')([0-9a-z-]+)(')", lambda m: m.group(1) + bump_letter(m.group(2)) + m.group(3), s)
        open(p, 'w', encoding='utf-8').write(s)
        edits.append('footer ?v= in footer.js, all pages and the generators')
    return edits


def review_list(cur):
    """Lines that still mention the old figures after --apply, for a human to check."""
    figures = [
        r'(?<![\d.,])' + re.escape(cur['total']) + r'\s?(?:&nbsp;)?(?:Gt|billion)',
        r'(?<![\d.,])' + re.escape(cur['fossil']) + r'\s?(?:&nbsp;)?(?:Gt|billion)',
        re.escape(cur['per_second']),
        r'(?<![\d.,])' + re.escape(cur['budget']) + r'\s?(?:&nbsp;)?(?:Gt|billion)',
        r'Global Carbon Budget ' + cur['edition'] + r'(?!\d)',
    ]
    # Claims that may no longer hold; checked on the live-figure pages only.
    claims = [r'\brecord\b', r'Indicators of Global Climate Change', r'Earth System Science Data']
    posts = sorted(os.path.relpath(p, ROOT) for p in glob.glob(os.path.join(ROOT, 'tools/blog/content/*.html')))
    hits = {}
    for path in CORE_FILES + [GUIDE[0]] + posts:
        pats = figures + (claims if path in CORE_FILES else [])
        for i, line in enumerate(open(os.path.join(ROOT, path), encoding='utf-8'), 1):
            if any(re.search(p, line) for p in pats):
                hits.setdefault(path, []).append(i)
    return hits


def fill_draft(data, nxt):
    src = os.path.join(ROOT, 'tools/blog/drafts', nxt['post_slug'] + '.html')
    if not os.path.exists(src):
        sys.exit(f'No draft at {os.path.relpath(src, ROOT)}')
    values = dict(nxt)
    values.update({k: (v if isinstance(v, str) else (num(v) if isinstance(v, (int, float)) else v))
                   for k, v in data['post'].items() if not k.startswith('_')})
    for k in [k for k, v in data['post'].items() if k.endswith('_pct') and isinstance(v, (int, float))]:
        values[k + '_signed'] = signed_pct(data['post'][k])
    for k in ('budget_17_gt', 'budget_2_gt'):
        v = data['post'].get(k)
        if isinstance(v, (int, float)):
            values[k.replace('_gt', '_years')] = str(round(v / data['next']['total_gt']))
    text = open(src, encoding='utf-8').read()
    # The draft's own instructions are an HTML comment at the top; drop it.
    text = re.sub(r'\A<!--draft.*?-->\s*', '', text, flags=re.S)
    missing = sorted({k for k in re.findall(r'\{\{(\w+)\}\}', text) if values.get(k) in (None, '')})
    if missing:
        sys.exit('Fill these in tools/yearly/gcb.json first: ' + ', '.join(missing))
    todo = re.findall(r'\[\[WRITE:[^\]]*\]\]', text)
    if todo:
        sys.exit(f'{len(todo)} [[WRITE: ...]] notes left in the draft. Write those parts first, e.g.:\n  ' + todo[0])
    text = re.sub(r'\{\{(\w+)\}\}', lambda m: str(values[m.group(1)]), text)
    out = os.path.join(ROOT, 'tools/blog/content', nxt['post_slug'] + '.html')
    open(out, 'w', encoding='utf-8').write(text)
    return os.path.relpath(out, ROOT)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--apply', action='store_true', help='write the changes')
    ap.add_argument('--draft', action='store_true', help='fill the key-findings draft and add it to the blog')
    ap.add_argument('--inputs', default=INPUTS, help='inputs JSON (default: tools/yearly/gcb.json)')
    args = ap.parse_args()

    data = json.load(open(args.inputs, encoding='utf-8'))
    cur = derive(data['current'])

    if args.draft:
        try:
            nxt = derive(data['next'])
        except ValueError as e:
            sys.exit(f'Fill "next" in {os.path.relpath(args.inputs, ROOT)} first ({e}).')
        print('Draft added:', fill_draft(data, nxt | data['next']))
        print('Next: python3 tools/blog/build.py, then check the post.')
        return

    try:
        nxt = derive(data['next'])
    except ValueError as e:
        print(f'"next" is not filled in yet ({e}).\n')
        print('Template check against the current site (0 means the template found nothing):')
        for tpl, s, n in template_coverage(cur):
            print(f'  {n:3d}  {s}')
        return

    print('Figures            current -> next')
    for k in cur:
        if cur[k] != nxt[k] and k not in ('paper_url',):
            print(f'  {k:18s} {cur[k]} -> {nxt[k]}')
    print()

    changes = plan(build_mapping(cur, nxt))
    for path, (_, _, rows) in changes.items():
        print(f'{path}: {len(rows)} change(s)')
        for line, old, new in rows:
            print(f'  {line:4d}  {old}  ->  {new}')
    if not args.apply:
        print('\nDry run. Run again with --apply to write these changes.')
        return

    for path, (_, new_text, _) in changes.items():
        open(os.path.join(ROOT, path), 'w', encoding='utf-8').write(new_text)
    for e in bump_versions(set(changes)):
        print('Bumped', e)

    # Roll the inputs forward so next year starts from the figures now on the site.
    data['current'] = dict(data['next'])
    data['next'] = {k: None for k in data['next']}
    data['next'].update({
        'edition': data['current']['edition'] + 1,
        'year': data['current']['year'] + 1,
        'budget_start_year': data['current']['budget_start_year'] + 1,
        'post_slug': f"global-carbon-budget-{data['current']['edition'] + 1}",
        'owid_edition': data['current']['owid_edition'],
    })
    with open(args.inputs, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
        fh.write('\n')

    print('\nStill check these lines by hand (old figures; on core pages also "record" claims,')
    print('the other budget estimate and the paper citation):')
    for path, rows in review_list(cur).items():
        print(f'  {path}: lines ' + ', '.join(str(i) for i in rows[:12]) + (' ...' if len(rows) > 12 else ''))
    if not os.path.exists(os.path.join(ROOT, 'tools/blog/content', nxt['post_slug'] + '.html')):
        print(f"\nCountry pages now link to /blog/posts/{nxt['post_slug']}: publish it with --draft in the same PR.")
    print('\nThen rebuild (see README), re-render share images and check the site.')


if __name__ == '__main__':
    main()
