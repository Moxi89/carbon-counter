#!/usr/bin/env python3
"""Monthly update of the Mauna Loa CO2 figures on the site.

    python3 tools/ppm/update.py                  # download NOAA's monthly data and update tools/ppm/ppm.json
    python3 tools/ppm/update.py --csv file.csv   # use a local copy of co2_mm_mlo.csv instead

The CO2 ppm post uses {{ppm:key}} placeholders, filled from ppm.json by tools/blog/build.py; the post's
hero image and share image read the same file. After an update, rebuild:

    python3 tools/blog/build.py && python3 tools/ads/apply.py && node tools/blog/heroes/render.js
    python3 tools/og/jobs.py > /tmp/og.json && node tools/og/render.js /tmp/og.json

Exit code 0: updated. Exit code 3: no new month yet (nothing to do).
"""
import argparse
import csv
import io
import json
import os
import re
import sys
import urllib.request
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'tools', 'ppm', 'ppm.json')
URL = 'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.csv'
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
          'October', 'November', 'December']


def season(month):
    """Where a month sits in Mauna Loa's yearly cycle (peak in May, low in September-October)."""
    if month == 5:
        return 'at the yearly peak'
    if month in (9, 10):
        return 'near the yearly low'
    if 6 <= month <= 8:
        return 'on the seasonal fall towards the autumn low'
    return 'on the seasonal rise towards the May peak'


def change(delta):
    word = 'above' if delta >= 0 else 'below'
    return f'about {abs(delta):.1f} ppm {word}'


def text(latest, prev_year, record):
    """Every phrase the site shows, from (year, month, ppm) tuples."""
    (ly, lm, lp), (_, _, pp), (ry, rm, rp) = latest, prev_year, record
    return {
        'latest_ppm': f'{lp:.2f}',
        'latest_ppm_1dp': f'{lp:.1f}',
        'latest_month': f'{MONTHS[lm - 1]} {ly}',
        'latest_month_prev_year': f'{MONTHS[lm - 1]} {ly - 1}',
        'season': season(lm),
        'change': change(lp - pp),
        'record_ppm': f'{rp:.1f}',
        'record_ppm_int': f'{int(rp)}',
        'record_month': f'{MONTHS[rm - 1]} {ry}',
    }


def read_rows(raw):
    rows = []
    lines = [l for l in raw.splitlines() if l.strip() and not l.startswith('#')]
    for r in csv.DictReader(io.StringIO('\n'.join(lines))):
        try:
            y, m, v = int(r['year']), int(r['month']), float(r['average'])
        except (KeyError, ValueError):
            continue
        if v > 0:  # NOAA marks missing months with -99.99
            rows.append((y, m, v))
    if len(rows) < 24:
        sys.exit('NOAA data looks wrong: fewer than 24 monthly values')
    return rows


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--csv', help='local copy of co2_mm_mlo.csv')
    args = ap.parse_args()
    if args.csv:
        raw = open(args.csv, encoding='utf-8').read()
    else:
        with urllib.request.urlopen(URL, timeout=60) as r:
            raw = r.read().decode('utf-8')
    rows = read_rows(raw)
    latest = rows[-1]
    prev = next((r for r in rows if r[0] == latest[0] - 1 and r[1] == latest[1]), None)
    if not prev:
        sys.exit('No value for the same month a year earlier')
    record = max(rows, key=lambda r: r[2])

    old = json.load(open(OUT, encoding='utf-8')) if os.path.exists(OUT) else {}
    new = {
        '_help': 'Mauna Loa monthly CO2 (NOAA). Written by tools/ppm/update.py; used by {{ppm:key}} in blog posts and by the CO2 ppm hero image.',
        'source': URL,
        'latest': list(latest), 'prev_year': list(prev), 'record': list(record),
        'text': text(latest, prev, record),
    }
    if old.get('latest') == new['latest'] and old.get('record') == new['record']:
        print(f"No new month: latest is still {new['text']['latest_month']} ({new['text']['latest_ppm']} ppm).")
        sys.exit(3)
    with open(OUT, 'w', encoding='utf-8') as fh:
        json.dump(new, fh, ensure_ascii=False, indent=2)
        fh.write('\n')
    # The post shows new figures, so its "Updated" date moves too.
    post = os.path.join(ROOT, 'tools', 'blog', 'content', 'co2-ppm-atmosphere.html')
    s = open(post, encoding='utf-8').read()
    s = re.sub(r'"updated": "\d{4}-\d{2}-\d{2}"', f'"updated": "{date.today().isoformat()}"', s, count=1)
    open(post, 'w', encoding='utf-8').write(s)
    t = new['text']
    print(f"Updated: {t['latest_ppm']} ppm in {t['latest_month']}, {t['change']} {t['latest_month_prev_year']}.")
    print(f"Record: {t['record_ppm']} ppm in {t['record_month']}.")
    if old.get('record') and old['record'] != new['record']:
        print('NEW RECORD: also update by hand the Scripps figure and the "Both are about ... higher than May ..." '
              'sentence in tools/blog/content/co2-ppm-atmosphere.html, or remove that clause if no Scripps figure is out yet.')


if __name__ == '__main__':
    main()
