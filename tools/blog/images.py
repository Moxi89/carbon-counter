#!/usr/bin/env python3
"""Generate the blog illustrations (static/blog/images/*.svg) in the 2026 style.

    python3 tools/blog/images.py

Each image is 1200x630: deep green-black background, soft glow, faint data grid,
and line-art in emerald / gold / sky. The file names match what the posts use.
"""
import os

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'static', 'blog', 'images')
W, H = 1200, 630
EM, EM2, GOLD, SKY, INK, DIM = '#34d399', '#10b981', '#fbbf24', '#38bdf8', '#ecfdf5', 'rgba(236,253,245,0.35)'


def frame(body, glow=(840, 300), accent=EM):
    gx, gy = glow
    grid = ''.join(f'<path d="M{x} 0V{H}"/>' for x in range(0, W + 1, 48)) + \
        ''.join(f'<path d="M0 {y}H{W}"/>' for y in range(0, H + 1, 48))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" fill="none">
  <defs>
    <radialGradient id="glow" cx="{gx / W:.3f}" cy="{gy / H:.3f}" r="0.6">
      <stop offset="0" stop-color="{accent}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="{accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="warm" cx="0.08" cy="1" r="0.7">
      <stop offset="0" stop-color="{GOLD}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="{GOLD}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#050b09" stop-opacity="1"/>
      <stop offset="0.45" stop-color="#050b09" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{EM}"/>
      <stop offset="1" stop-color="{EM2}" stop-opacity="0.35"/>
    </linearGradient>
    <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{GOLD}"/>
      <stop offset="1" stop-color="{GOLD}" stop-opacity="0.3"/>
    </linearGradient>
  </defs>
  <rect width="{W}" height="{H}" fill="#06100c"/>
  <g stroke="{EM}" stroke-opacity="0.07" stroke-width="1">{grid}</g>
  <rect width="{W}" height="{H}" fill="url(#glow)"/>
  <rect width="{W}" height="{H}" fill="url(#warm)"/>
  <rect width="{W}" height="{H}" fill="url(#fade)"/>
  <g stroke-linecap="round" stroke-linejoin="round">
{body}
  </g>
</svg>
'''


def bars(x, base, values, w=34, gap=16, fill='url(#bar)', last=None):
    out = []
    for i, v in enumerate(values):
        f = last if (last and i == len(values) - 1) else fill
        out.append(f'<rect x="{x + i * (w + gap)}" y="{base - v}" width="{w}" height="{v}" rx="6" fill="{f}"/>')
    return '\n'.join(out)


def dots(points, r=5, color=EM):
    return '\n'.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}"/>' for x, y in points)


def sparkle(x, y, s=10, c=EM):
    return f'<path d="M{x} {y - s}V{y + s}M{x - s} {y}H{x + s}" stroke="{c}" stroke-width="3"/>'


IMAGES = {}

# Carbon footprint calculator: footprint + calculator keys + gauge
IMAGES['carbon-footprint-calculator'] = frame(f'''
    <path d="M760 470c-40 0-62-40-56-96 6-58 34-118 74-118s58 52 52 112c-6 62-30 102-70 102z" stroke="{EM}" stroke-width="5" fill="rgba(52,211,153,0.08)"/>
    <circle cx="702" cy="222" r="14" stroke="{EM}" stroke-width="4"/><circle cx="740" cy="200" r="12" stroke="{EM}" stroke-width="4"/>
    <circle cx="776" cy="196" r="11" stroke="{EM}" stroke-width="4"/><circle cx="808" cy="206" r="10" stroke="{EM}" stroke-width="4"/>
    <rect x="900" y="170" width="200" height="290" rx="26" stroke="{INK}" stroke-opacity="0.8" stroke-width="4" fill="rgba(6,16,12,0.85)"/>
    <rect x="924" y="196" width="152" height="58" rx="10" fill="rgba(52,211,153,0.12)" stroke="{EM}" stroke-width="3"/>
    <path d="M944 236h48" stroke="{EM}" stroke-width="5"/><path d="M1004 236h52" stroke="{GOLD}" stroke-width="5"/>
    {''.join(f'<rect x="{924 + c * 54}" y="{276 + r * 56}" width="42" height="42" rx="10" stroke="{DIM}" stroke-width="3"/>' for r in range(3) for c in range(3))}
    <rect x="1032" y="388" width="42" height="42" rx="10" fill="{EM}" stroke="none"/>
    <path d="M520 470a150 150 0 0 1 300 0" stroke="{DIM}" stroke-width="6" transform="translate(-300 0)"/>
    <path d="M220 470a150 150 0 0 1 216-134" stroke="{GOLD}" stroke-width="8"/>
    <path d="M370 470l70-96" stroke="{INK}" stroke-width="5"/><circle cx="370" cy="470" r="10" fill="{INK}"/>
    {sparkle(600, 150)}{sparkle(1140, 520, 8, GOLD)}
''', glow=(820, 320))

# Quick wins: stopwatch + checklist
IMAGES['quick-wins'] = frame(f'''
    <circle cx="820" cy="340" r="150" stroke="{EM}" stroke-width="6" fill="rgba(52,211,153,0.06)"/>
    <path d="M800 168h40M820 168v22" stroke="{EM}" stroke-width="6"/>
    <path d="M940 210l20-20" stroke="{EM}" stroke-width="6"/>
    <path d="M820 340V250" stroke="{INK}" stroke-width="6"/><path d="M820 340l62 36" stroke="{GOLD}" stroke-width="6"/>
    <circle cx="820" cy="340" r="10" fill="{INK}"/>
    <path d="M820 190a150 150 0 0 1 130 75" stroke="{GOLD}" stroke-width="10"/>
    {''.join(f'<rect x="{240}" y="{200 + i * 80}" width="34" height="34" rx="9" stroke="{EM}" stroke-width="4" fill="rgba(52,211,153,0.12)"/><path d="M{248} {217 + i * 80}l8 8 14-16" stroke="{EM}" stroke-width="4"/><rect x="300" y="{208 + i * 80}" width="{220 - i * 40}" height="18" rx="9" fill="{DIM}"/>' for i in range(4))}
    {sparkle(1080, 160, 10, GOLD)}{sparkle(620, 520)}
''', glow=(820, 330))

# Global Carbon Budget explained: globe + rising bars + budget meter
IMAGES['climate-crisis-2025'] = frame(f'''
    <circle cx="860" cy="300" r="170" stroke="{SKY}" stroke-width="5" fill="rgba(56,189,248,0.06)"/>
    <ellipse cx="860" cy="300" rx="70" ry="170" stroke="{SKY}" stroke-opacity="0.6" stroke-width="3"/>
    <path d="M690 300h340M712 220h296M712 380h296" stroke="{SKY}" stroke-opacity="0.5" stroke-width="3"/>
    {bars(250, 470, [70, 92, 110, 128, 150, 168, 182], fill='url(#bar)', last='url(#barGold)')}
    <path d="M250 520h330" stroke="{DIM}" stroke-width="3"/>
    <rect x="690" y="510" width="340" height="18" rx="9" fill="rgba(255,255,255,0.08)"/>
    <rect x="690" y="510" width="96" height="18" rx="9" fill="{GOLD}"/>
    {sparkle(1110, 140, 9, GOLD)}
''', glow=(860, 300), accent=SKY)

# 2026 outlook: line chart with dashed projection + thermometer
IMAGES['2026-climate-outlook'] = frame(f'''
    <path d="M240 470h560M240 470V170" stroke="{DIM}" stroke-width="3"/>
    <path d="M250 440C320 430 360 400 420 392S520 350 580 330S660 300 700 292" stroke="{EM}" stroke-width="6"/>
    <path d="M700 292C740 284 770 282 800 282" stroke="{GOLD}" stroke-width="6" stroke-dasharray="4 16"/>
    <path d="M700 292C740 300 770 318 800 336" stroke="{EM}" stroke-width="6" stroke-dasharray="4 16" stroke-opacity="0.7"/>
    {dots([(420, 392), (580, 330), (700, 292)], 8, EM)}
    <rect x="930" y="150" width="56" height="270" rx="28" stroke="{INK}" stroke-opacity="0.8" stroke-width="5"/>
    <circle cx="958" cy="450" r="48" stroke="{INK}" stroke-opacity="0.8" stroke-width="5" fill="rgba(251,191,36,0.15)"/>
    <rect x="946" y="250" width="24" height="200" rx="12" fill="{GOLD}"/>
    {''.join(f'<path d="M1000 {190 + i * 40}h22" stroke="{DIM}" stroke-width="3"/>' for i in range(5))}
    {sparkle(1100, 520, 9)}{sparkle(560, 170, 8, GOLD)}
''', glow=(760, 300))

# Next decade: timeline 2025 -> 2035 with milestones and curve
IMAGES['next-decade-climate'] = frame(f'''
    <path d="M200 430H1040" stroke="{DIM}" stroke-width="4"/>
    {''.join(f'<circle cx="{220 + i * 205}" cy="430" r="16" fill="#06100c" stroke="{c}" stroke-width="5"/>' for i, c in enumerate([EM, EM, GOLD, GOLD, SKY]))}
    <path d="M220 360C420 330 520 250 640 230S880 170 1020 130" stroke="{EM}" stroke-width="6"/>
    <path d="M220 360C420 350 560 330 700 320S900 300 1020 300" stroke="{SKY}" stroke-width="5" stroke-dasharray="6 14"/>
    <path d="M630 140v70M630 140l26 12-26 12" stroke="{GOLD}" stroke-width="5"/>
    {''.join(f'<rect x="{196 + i * 205}" y="470" width="48" height="12" rx="6" fill="{DIM}"/>' for i in range(5))}
    {sparkle(1090, 210, 9, GOLD)}
''', glow=(700, 260))

# Climate tech: solar panel + wind turbine + battery
IMAGES['climate-tech-2026'] = frame(f'''
    <path d="M640 470l50-150h220l50 150z" stroke="{SKY}" stroke-width="5" fill="rgba(56,189,248,0.08)"/>
    <path d="M707 320l-17 150M765 320l-8 150M835 320l8 150M893 320l17 150M672 370h256M656 420h288" stroke="{SKY}" stroke-opacity="0.7" stroke-width="3"/>
    <path d="M800 470v60M760 530h80" stroke="{SKY}" stroke-width="5"/>
    <path d="M1040 530V250" stroke="{INK}" stroke-opacity="0.85" stroke-width="6"/>
    <circle cx="1040" cy="240" r="12" fill="{INK}"/>
    <path d="M1040 240L1040 120M1040 240l104 60M1040 240l-104 60" stroke="{EM}" stroke-width="8"/>
    <rect x="270" y="280" width="150" height="230" rx="22" stroke="{EM}" stroke-width="5" fill="rgba(52,211,153,0.06)"/>
    <rect x="315" y="258" width="60" height="22" rx="6" stroke="{EM}" stroke-width="5"/>
    {''.join(f'<rect x="292" y="{460 - i * 52}" width="106" height="38" rx="8" fill="{EM if i < 3 else "rgba(52,211,153,0.2)"}"/>' for i in range(4))}
    <circle cx="560" cy="170" r="44" stroke="{GOLD}" stroke-width="5"/>
    {''.join(f'<path d="M{560 + 64 * dx} {170 + 64 * dy}l{14 * dx} {14 * dy}" stroke="{GOLD}" stroke-width="5"/>' for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1), (0.7, 0.7), (-0.7, 0.7), (0.7, -0.7), (-0.7, -0.7)])}
''', glow=(820, 300), accent=SKY)

# Food: plate with leaf + comparison bars (beef tall, plants short)
IMAGES['food-climate-solutions'] = frame(f'''
    <circle cx="420" cy="330" r="160" stroke="{INK}" stroke-opacity="0.7" stroke-width="5"/>
    <circle cx="420" cy="330" r="112" stroke="{DIM}" stroke-width="3"/>
    <path d="M360 380c0-90 60-140 140-150-6 90-60 150-140 150z" stroke="{EM}" stroke-width="5" fill="rgba(52,211,153,0.14)"/>
    <path d="M360 380c40-40 70-70 110-110" stroke="{EM}" stroke-width="4"/>
    <path d="M220 200v130M206 200v50M234 200v50M220 330v70" stroke="{DIM}" stroke-width="5"/>
    <path d="M620 200c24 0 30 40 30 80s-14 50-30 50v70" stroke="{DIM}" stroke-width="5"/>
    {bars(760, 500, [300, 120, 70, 40, 22], w=46, gap=22, fill='url(#bar)')}
    <rect x="760" y="200" width="46" height="300" rx="6" fill="url(#barGold)"/>
    <path d="M748 520h340" stroke="{DIM}" stroke-width="3"/>
''', glow=(860, 340))

# Transport: car with plug, train, plane, and per-km bars
IMAGES['transportation-climate'] = frame(f'''
    <path d="M250 400h230l-30-60c-6-12-18-20-32-20H330c-14 0-26 8-32 20z" stroke="{EM}" stroke-width="5" fill="rgba(52,211,153,0.08)"/>
    <rect x="236" y="400" width="258" height="56" rx="18" stroke="{EM}" stroke-width="5"/>
    <circle cx="300" cy="462" r="24" fill="#06100c" stroke="{INK}" stroke-width="5"/><circle cx="430" cy="462" r="24" fill="#06100c" stroke="{INK}" stroke-width="5"/>
    <path d="M520 420c40 0 40-60 80-60h20M620 344v32M640 344v32" stroke="{EM}" stroke-width="4"/>
    <rect x="700" y="300" width="230" height="150" rx="30" stroke="{SKY}" stroke-width="5" fill="rgba(56,189,248,0.06)"/>
    <rect x="726" y="326" width="70" height="50" rx="8" stroke="{SKY}" stroke-width="4"/><rect x="834" y="326" width="70" height="50" rx="8" stroke="{SKY}" stroke-width="4"/>
    <path d="M730 480l-20 30M900 480l20 30M700 510h230" stroke="{SKY}" stroke-width="5"/>
    <circle cx="760" cy="462" r="12" stroke="{SKY}" stroke-width="4"/><circle cx="870" cy="462" r="12" stroke="{SKY}" stroke-width="4"/>
    <g transform="translate(1040 190) rotate(40)">
      <path d="M0 -110c9 0 14 10 14 24v52l84 48v20l-84-24v46l26 20v14l-40-10-40 10v-14l26-20v-46l-84 24v-20l84-48v-52c0-14 5-24 14-24z" stroke="{GOLD}" stroke-width="5" fill="rgba(251,191,36,0.12)"/>
    </g>
''', glow=(700, 340))

# Renewable energy: sun + turbines + solar rows
IMAGES['renewable-energy-guide'] = frame(f'''
    <circle cx="900" cy="190" r="70" stroke="{GOLD}" stroke-width="6" fill="rgba(251,191,36,0.12)"/>
    {''.join(f'<path d="M{900 + 98 * dx:.0f} {190 + 98 * dy:.0f}l{20 * dx:.0f} {20 * dy:.0f}" stroke="{GOLD}" stroke-width="6"/>' for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1), (0.7, 0.7), (-0.7, 0.7), (0.7, -0.7), (-0.7, -0.7)])}
    {''.join(f'<path d="M{x} 520V{y}" stroke="{INK}" stroke-opacity="0.85" stroke-width="5"/><circle cx="{x}" cy="{y}" r="9" fill="{INK}"/><path d="M{x} {y}l0 -{s}M{x} {y}l{int(s * 0.87)} {s // 2}M{x} {y}l-{int(s * 0.87)} {s // 2}" stroke="{EM}" stroke-width="6"/>' for x, y, s in [(300, 300, 96), (470, 340, 76)])}
    {''.join(f'<path d="M{620 + i * 140} 520l30-80h110l30 80z" stroke="{SKY}" stroke-width="4" fill="rgba(56,189,248,0.08)"/>' for i in range(3))}
    <path d="M200 540H1100" stroke="{DIM}" stroke-width="3"/>
''', glow=(880, 220), accent=GOLD)

# Save energy at home: house + thermostat + down arrow
IMAGES['save-energy-home'] = frame(f'''
    <path d="M300 300L470 170L640 300V500H300z" stroke="{EM}" stroke-width="6" fill="rgba(52,211,153,0.06)"/>
    <rect x="430" y="390" width="80" height="110" rx="8" stroke="{EM}" stroke-width="5"/>
    <rect x="340" y="320" width="70" height="60" rx="8" stroke="{SKY}" stroke-width="4"/><rect x="530" y="320" width="70" height="60" rx="8" stroke="{SKY}" stroke-width="4"/>
    <circle cx="880" cy="320" r="120" stroke="{INK}" stroke-opacity="0.8" stroke-width="6" fill="rgba(6,16,12,0.8)"/>
    <path d="M790 380a120 120 0 0 1 60-170" stroke="{GOLD}" stroke-width="10"/>
    <path d="M880 320l-50-60" stroke="{INK}" stroke-width="6"/><circle cx="880" cy="320" r="12" fill="{INK}"/>
    <path d="M1060 200v170M1030 340l30 32 30-32" stroke="{EM}" stroke-width="7"/>
    {sparkle(220, 180, 9, GOLD)}
''', glow=(760, 320))


# Track energy: dashboard gauge + bar chart + smart plug
IMAGES['track-energy'] = frame(f'''
    <rect x="620" y="150" width="480" height="330" rx="28" stroke="{INK}" stroke-opacity="0.75" stroke-width="5" fill="rgba(6,16,12,0.85)"/>
    {bars(660, 440, [90, 130, 70, 160, 110, 60, 140], w=34, gap=20, last='url(#barGold)')}
    <path d="M650 440h420" stroke="{DIM}" stroke-width="3"/>
    <path d="M660 200h120" stroke="{EM}" stroke-width="8"/><path d="M800 200h70" stroke="{DIM}" stroke-width="8"/>
    <path d="M230 470a160 160 0 0 1 320 0" stroke="{DIM}" stroke-width="10"/>
    <path d="M230 470a160 160 0 0 1 220-148" stroke="{EM}" stroke-width="12"/>
    <path d="M390 470l60-90" stroke="{INK}" stroke-width="6"/><circle cx="390" cy="470" r="12" fill="{INK}"/>
    <rect x="340" y="180" width="100" height="100" rx="24" stroke="{SKY}" stroke-width="5"/>
    <circle cx="372" cy="230" r="7" fill="{SKY}"/><circle cx="408" cy="230" r="7" fill="{SKY}"/>
''', glow=(860, 300))

# Family: seedling in pot, sun and small house
IMAGES['family-eco-activities'] = frame(f'''
    <path d="M520 470h160l-20 90H540z" stroke="{GOLD}" stroke-width="6" fill="rgba(251,191,36,0.1)"/>
    <path d="M600 470V320" stroke="{EM}" stroke-width="6"/>
    <path d="M600 380c-80 0-120-40-130-110 80 0 124 40 130 110z" stroke="{EM}" stroke-width="6" fill="rgba(52,211,153,0.14)"/>
    <path d="M600 340c10-80 60-120 140-124-4 82-60 124-140 124z" stroke="{EM}" stroke-width="6" fill="rgba(52,211,153,0.14)"/>
    <circle cx="300" cy="200" r="56" stroke="{GOLD}" stroke-width="6"/>
    {''.join(f'<path d="M{300 + 82 * dx:.0f} {200 + 82 * dy:.0f}l{16 * dx:.0f} {16 * dy:.0f}" stroke="{GOLD}" stroke-width="5"/>' for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1), (0.7, 0.7), (-0.7, 0.7), (0.7, -0.7), (-0.7, -0.7)])}
    <path d="M860 420l90-70 90 70v140H860z" stroke="{SKY}" stroke-width="5" fill="rgba(56,189,248,0.06)"/>
    <rect x="926" y="480" width="48" height="80" rx="6" stroke="{SKY}" stroke-width="4"/>
    <path d="M280 560H1100" stroke="{DIM}" stroke-width="3"/>
    <path d="M1000 240c0-20 30-20 30 0 0-20 30-20 30 0 0 24-30 40-30 40s-30-16-30-40z" stroke="{EM}" stroke-width="5" fill="rgba(52,211,153,0.15)"/>
''', glow=(620, 380))

# Carbon tracking: scope 1-3 icons feeding a live dashboard
IMAGES['carbon-tracking'] = frame(f'''
    <path d="M150 470V330l70 44v-44l70 44v-44l70 44V250h40v220z" stroke="{GOLD}" stroke-width="5" fill="rgba(251,191,36,0.08)"/>
    <path d="M180 470h260" stroke="{DIM}" stroke-width="3"/>
    <path d="M520 200l-40 80h44l-30 80 86-110h-48l30-50z" stroke="{SKY}" stroke-width="5" fill="rgba(56,189,248,0.10)"/>
    <rect x="460" y="400" width="56" height="40" rx="8" stroke="{EM}" stroke-width="4"/>
    <rect x="540" y="400" width="56" height="40" rx="8" stroke="{EM}" stroke-width="4"/>
    <path d="M516 420h24M596 420h24" stroke="{EM}" stroke-width="4"/>
    <rect x="620" y="400" width="56" height="40" rx="8" fill="rgba(52,211,153,0.18)" stroke="{EM}" stroke-width="4"/>
    <path d="M660 300c40 0 50-20 80-20" stroke="{DIM}" stroke-width="3" stroke-dasharray="6 10"/>
    <rect x="740" y="150" width="380" height="330" rx="28" stroke="{INK}" stroke-opacity="0.75" stroke-width="5" fill="rgba(6,16,12,0.88)"/>
    <path d="M776 196h90" stroke="{EM}" stroke-width="8"/><path d="M880 196h50" stroke="{DIM}" stroke-width="8"/>
    <path d="M780 400l46-30 40 16 44-52 40 20 46-64 48-26" stroke="{EM}" stroke-width="6"/>
    <path d="M780 400l46-30 40 16 44-52 40 20 46-64 48-26V440H780z" fill="rgba(52,211,153,0.10)" stroke="none"/>
    <circle cx="1044" cy="264" r="11" fill="{GOLD}"/><circle cx="1044" cy="264" r="22" stroke="{GOLD}" stroke-opacity="0.4" stroke-width="3"/>
    <path d="M776 440h308" stroke="{DIM}" stroke-width="3"/>
    {sparkle(400, 170, 9, EM)}{sparkle(690, 540, 8, GOLD)}
''', glow=(900, 300))


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, svg in IMAGES.items():
        with open(os.path.join(OUT, name + '.svg'), 'w', encoding='utf-8') as f:
            f.write(svg)
    print(f'{len(IMAGES)} images written to static/blog/images/')


if __name__ == '__main__':
    main()
