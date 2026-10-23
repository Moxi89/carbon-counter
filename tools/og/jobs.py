#!/usr/bin/env python3
"""Describe every social share image (Open Graph) to render.

    python3 tools/og/jobs.py > /tmp/og-jobs.json
    node tools/og/render.js /tmp/og-jobs.json

Images go to static/og/<name>.jpg (1200x630).
"""
import json
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def gt(mt):
    return f'{mt / 1000:.2f} Gt' if mt >= 1000 else f'{mt:,.0f} Mt'


def main():
    jobs = [
        {'name': 'home', 'kicker': 'Live estimate', 'title': 'Carbon Emissions Counter Live',
         'big': '1,338 t', 'sub': 'of CO₂ emitted every second worldwide', 'ring': True},
        {'name': 'widget', 'kicker': 'Free widget', 'title': 'A live CO₂ counter for your website',
         'big': '', 'sub': 'One line of code · no cookies · dark and light themes', 'ring': True},
    ]
    data = json.load(open(os.path.join(ROOT, 'tools', 'countries', 'data.json'), encoding='utf-8'))
    year = data['year']
    top = data['countries'][:8]
    jobs.append({'name': 'co2-emissions-by-country', 'kicker': f'{len(data["countries"])} countries · {year} data',
                 'title': 'CO₂ Emissions by Country', 'big': '', 'sub': 'Live ranking, per-person emissions and trends',
                 'ranking': [[c['name'], c['share']] for c in top]})
    big = [c for c in data['countries'] if c['pop'] and c['pop'] >= 1_000_000 and c['pc'] is not None]
    pc_top = sorted(big, key=lambda c: -c['pc'])[:8]
    jobs.append({'name': 'co2-emissions-per-capita', 'kicker': f'Tonnes per person · {year} data',
                 'title': 'CO₂ Emissions per Capita', 'big': '', 'sub': f'World average {data["world"]["pc"]:.1f} t per person',
                 'ranking': [[c['name'], c['pc']] for c in pc_top], 'unit': ' t'})
    cum_top = sorted(data['countries'], key=lambda c: -c['cum'])[:8]
    jobs.append({'name': 'historical-co2-emissions-by-country', 'kicker': 'Cumulative since 1750',
                 'title': 'Historical CO₂ Emissions by Country', 'big': '', 'sub': 'Share of all fossil CO₂ ever emitted',
                 'ranking': [[c['name'], c['cum_share']] for c in cum_top]})
    for c in data['countries']:
        if 'series' not in c:
            continue
        jobs.append({'name': f'country-{c["slug"]}', 'kicker': f'#{c["rank"]} of {len(data["countries"])} countries',
                     'title': f'{c["name"]} CO₂ emissions', 'big': gt(c['co2']),
                     'sub': f'in {year} · {c["share"]:.1f}% of the world · {c["pc"]:.1f} t per person',
                     'bars': [v for _, v in c['series']]})

    content = os.path.join(ROOT, 'tools', 'blog', 'content')
    if os.path.isdir(content):
        for f in sorted(os.listdir(content)):
            if not f.endswith('.html'):
                continue
            m = re.match(r'\s*<!--meta\s*(\{.*?\})\s*-->', open(os.path.join(content, f), encoding='utf-8').read(), re.S)
            if not m:
                continue
            meta = json.loads(m.group(1))
            jobs.append({'name': f'blog-{f[:-5]}', 'kicker': meta['category'], 'title': meta['title'],
                         'image': os.path.join(ROOT, 'static', meta['image'].lstrip('/'))})
    print(json.dumps(jobs, ensure_ascii=False))


if __name__ == '__main__':
    main()
