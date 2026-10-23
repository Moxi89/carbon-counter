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
    const rows = c.rows.map(([name, v], i) => `<li><b>${esc(name)}</b><span>${v.toFixed(1)}${esc(c.suffix || '')}</span><i><em class="${i === 0 ? 'hot' : ''}" style="width:${Math.max(1.2, (v / max) * 100)}%"></em></i></li>`).join('');
    return `<p class="kicker plain">${esc(c.kicker)}</p><ol class="rows">${rows}</ol><p class="src">${esc(c.source)}</p>`;
}

function budget() {
    const b = budgetFigures();
    return `<p class="kicker gold">1.5&nbsp;&deg;C carbon budget left</p>
<p class="big">${b.gt}<small>Gt CO&#8322;</small></p>
<p class="sub">from 1 January ${b.start} &middot; 50% chance</p>
<p class="sub strong">About ${b.years} years at today&rsquo;s rate</p>
<p class="src">Source: Global Carbon Budget ${b.edition}</p>`;
}

function page(slug, job) {
    const photo = 'file://' + path.join(HERE, 'photos', slug + '.jpg');
    const right = job.side === 'right';
    const shade = right
        ? 'linear-gradient(270deg,rgba(5,11,9,.92) 0%,rgba(5,11,9,.78) 34%,rgba(5,11,9,.2) 58%,transparent 70%)'
        : 'linear-gradient(90deg,rgba(5,11,9,.92) 0%,rgba(5,11,9,.75) 36%,rgba(5,11,9,.15) 60%,transparent 72%)';
    const body = job.chart ? chart(job.chart) : job.budget ? budget() : '';
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
.big small{font:500 64px 'Fira Sans',sans-serif;letter-spacing:0;margin-left:20px;color:#fde68a}
.sub{margin-top:30px;font-size:52px;line-height:1.15;color:#c9dcd4}
.sub.strong{margin-top:12px;color:#ecfdf5;font-weight:600}
.src{margin-top:32px;font-size:30px;color:#9db9ae}
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
        fs.writeFileSync(tmp, page(slug, job));
        await p.goto('file://' + tmp);
        await p.evaluate(() => document.fonts.ready);
        await p.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth));
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
