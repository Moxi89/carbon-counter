// Render photo hero images for blog posts: an AI photo (no text or numbers in it)
// with the post's real, sourced figures drawn on top.
// Usage: node tools/blog/heroes/render.js
// Reads tools/blog/heroes/heroes.json and photos/<slug>.jpg; budget figures come from
// tools/yearly/gcb.json, so re-running after the yearly update refreshes them.
// Writes static/blog/images/<slug>.webp (1600 px) and <slug>-800.webp.
const fs = require('fs');
const os = require('os');
const path = require('path');

let chromium;
try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.resolve(__dirname, '..', '..', '..');
const HERE = __dirname;
const OUT = path.join(ROOT, 'static', 'blog', 'images');
const FONTS = 'file://' + path.join(ROOT, 'static', 'fonts');
const W = 1600, H = 840;
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function budgetFigures() {
    const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'yearly', 'gcb.json'), 'utf8')).current;
    const years = Math.round(g.budget_15_gt / g.total_gt);
    return { gt: g.budget_15_gt, start: g.budget_start_year, edition: g.edition, years: WORDS[years] || String(years) };
}

function chart(c) {
    const max = Math.max(...c.rows.map((r) => r[1]));
    const dp = c.decimals === undefined ? 1 : c.decimals;
    const rows = c.rows.map(([name, v], i) => `<li><b>${esc(name)}</b><span>${v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}${esc(c.suffix || '')}</span><i><em class="${i === 0 ? 'hot' : ''}" style="width:${Math.max(1.2, (v / max) * 100)}%"></em></i></li>`).join('');
    return `<p class="kicker plain">${esc(c.kicker)}</p><ol class="rows">${rows}</ol><p class="src">${esc(c.source)}</p>`;
}

// One big figure: { kicker, value, unit, lines: [plain, bold], source, green }
function stat(t) {
    const lines = (t.lines || []).map((l, i) => `<p class="sub${i ? ' strong' : ''}">${esc(l)}</p>`).join('');
    return `<p class="kicker${t.green ? '' : ' gold'}">${esc(t.kicker)}</p>
<p class="big${t.green ? ' green' : ''}">${esc(t.value)}${t.unit ? `<small>${esc(t.unit)}</small>` : ''}</p>${lines}
<p class="src">${esc(t.source)}</p>`;
}

// Two or three figures, stacked: { kicker, items: [[value, label], ...], source, gold }
function stats(t) {
    const items = t.items.map(([v, l]) => `<li><b>${esc(v)}</b><span>${esc(l)}</span></li>`).join('');
    return `${t.kicker ? `<p class="kicker">${esc(t.kicker)}</p>` : ''}<ol class="stats${t.gold ? ' gold' : ''}">${items}</ol><p class="src">${esc(t.source)}</p>`;
}

function ppm() {
    const t = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'ppm', 'ppm.json'), 'utf8')).text;
    return stat({ kicker: 'CO₂ at Mauna Loa, latest month', green: true, value: t.latest_ppm_1dp, unit: 'ppm',
        lines: [`${t.latest_month} · ${t.change} a year earlier`, `Record: ${t.record_ppm} ppm in ${t.record_month}`],
        source: 'Source: NOAA, preliminary monthly mean' });
}

// Key findings of the current Global Carbon Budget edition (tools/yearly/gcb.json)
function gcb() {
    const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'yearly', 'gcb.json'), 'utf8')).current;
    const c = g.fossil_change_pct;
    const change = (c >= 0 ? '+' : '−') + Math.abs(c).toFixed(1) + '%';
    return stats({ kicker: `Global Carbon Budget ${g.edition}`, gold: true, items: [
        [`${g.fossil_gt.toFixed(1)} Gt`, `fossil CO₂ in ${g.year} (${change})`],
        [`${g.total_gt.toFixed(1)} Gt`, 'total CO₂ including land use'],
        [`${g.budget_15_gt} Gt`, `left for 1.5 °C from 1 January ${g.budget_start_year}`],
    ], source: `Source: Global Carbon Budget ${g.edition}` });
}

function budget() {
    const b = budgetFigures();
    return stat({ kicker: '1.5 °C carbon budget left', value: String(b.gt), unit: 'Gt CO₂',
        lines: [`from 1 January ${b.start} · 50% chance`, `About ${b.years} years at today’s rate`],
        source: `Source: Global Carbon Budget ${b.edition}` });
}

function page(slug, job) {
    const photo = 'file://' + path.join(HERE, 'photos', slug + '.jpg');
    const right = job.side === 'right';
    const shade = right
        ? 'linear-gradient(270deg,rgba(5,11,9,.94) 0%,rgba(5,11,9,.84) 38%,rgba(5,11,9,.35) 60%,transparent 74%)'
        : 'linear-gradient(90deg,rgba(5,11,9,.94) 0%,rgba(5,11,9,.84) 38%,rgba(5,11,9,.35) 60%,transparent 74%)';
    const body = job.chart ? chart(job.chart) : job.stat ? stat(job.stat) : job.stats ? stats(job.stats) : job.budget ? budget() : job.ppm ? ppm() : job.gcb ? gcb() : '';
    return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Fira Sans';font-weight:500;src:url('${FONTS}/fira-sans-latin-500-normal.woff2')}
@font-face{font-family:'Fira Sans';font-weight:600;src:url('${FONTS}/fira-sans-latin-600-normal.woff2')}
@font-face{font-family:'Fira Code';font-weight:300 700;src:url('${FONTS}/fira-code-latin-wght-normal.woff2')}
*{box-sizing:border-box;margin:0}
body{width:${W}px;height:${H}px;overflow:hidden;background:#050b09;font-family:'Fira Sans',sans-serif;color:#ecfdf5;position:relative}
.photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.shade{position:absolute;inset:0;background:${shade}}
/* Sized for phones: the 1600 px image shows about 343 px wide, so 52 px here is about 11 px there. */
.panel{position:absolute;top:50%;transform:translateY(-50%);${right ? 'right:72px;width:760px' : 'left:88px;width:840px'}}
.kicker{font:500 34px 'Fira Code',monospace;letter-spacing:.06em;text-transform:uppercase;color:#34d399;margin-bottom:34px}
.kicker.plain{text-transform:none;letter-spacing:0;margin-bottom:28px}
.kicker.gold{color:#fbbf24}
.rows{list-style:none;padding:0;display:grid;gap:24px}
.rows li{display:grid;grid-template-columns:1fr auto;align-items:baseline;row-gap:10px;font-size:48px;line-height:1}
.rows b{font-weight:500;white-space:nowrap}
.rows span{font:600 46px 'Fira Code',monospace;color:#ecfdf5}
.rows i{grid-column:1/-1;display:block;height:16px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}
.rows em{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#10b981,#34d399)}
.rows em.hot{background:linear-gradient(90deg,#d97706,#fbbf24)}
.big{font:600 280px/0.9 'Fira Code',monospace;letter-spacing:-.05em;color:#fbbf24;text-shadow:0 0 60px rgba(251,191,36,.25)}
.big.green{color:#34d399;text-shadow:0 0 60px rgba(52,211,153,.25)}
.big small{font:500 64px 'Fira Sans',sans-serif;letter-spacing:0;margin-left:20px;color:#fde68a}
.sub{margin-top:30px;font-size:52px;line-height:1.15;color:#c9dcd4}
.sub.strong{margin-top:12px;color:#ecfdf5;font-weight:600}
.src{margin-top:32px;font-size:30px;color:#9db9ae}
.stats{list-style:none;padding:0;display:grid;gap:34px}
.stats li{display:grid;gap:8px}
.stats b{font:600 104px/1 'Fira Code',monospace;letter-spacing:-.04em;color:#34d399}
.stats.gold b{color:#fbbf24}
.stats span{font-size:44px;line-height:1.18;color:#dce9e3}
</style></head><body><img class="photo" src="${photo}"><div class="shade"></div><div class="panel">${body}</div></body></html>`;
}

(async () => {
    const jobs = JSON.parse(fs.readFileSync(path.join(HERE, 'heroes.json'), 'utf8'));
    const browser = await chromium.launch();
    const p = await browser.newPage({ viewport: { width: W, height: H } });
    const enc = await browser.newPage();
    const tmp = path.join(os.tmpdir(), 'hero-render.html');
    for (const [slug, job] of Object.entries(jobs)) {
        if (slug.startsWith('_')) continue;
        // A draft post (e.g. tools/blog/drafts/) gets its hero once it is published
        if (!fs.existsSync(path.join(ROOT, 'tools', 'blog', 'content', slug + '.html'))) { console.log('skip', slug, '(no post yet)'); continue; }
        fs.writeFileSync(tmp, page(slug, job));
        await p.goto('file://' + tmp);
        await p.evaluate(() => document.fonts.ready);
        await p.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth));
        // Shrink the figures to fit when long labels wrap (60 px margin top and bottom)
        await p.evaluate(() => {
            const el = document.querySelector('.panel');
            const max = innerHeight - 120;
            if (el.offsetHeight > max) el.style.zoom = (max / el.offsetHeight).toFixed(3);
        });
        const png = (await p.screenshot({ type: 'png' })).toString('base64');
        // Chromium encodes WebP; write a full-size and a phone-size file.
        const out = await enc.evaluate(async ({ png, sizes }) => {
            const img = new Image();
            img.src = 'data:image/png;base64,' + png;
            await img.decode();
            return sizes.map((w) => {
                const c = document.createElement('canvas');
                c.width = w; c.height = Math.round(w * img.height / img.width);
                const g = c.getContext('2d');
                g.imageSmoothingQuality = 'high';
                g.drawImage(img, 0, 0, c.width, c.height);
                return c.toDataURL('image/webp', 0.8).split(',')[1];
            });
        }, { png, sizes: [W, 800] });
        fs.writeFileSync(path.join(OUT, slug + '.webp'), Buffer.from(out[0], 'base64'));
        fs.writeFileSync(path.join(OUT, slug + '-800.webp'), Buffer.from(out[1], 'base64'));
        console.log('hero', slug);
    }
    await browser.close();
})();
