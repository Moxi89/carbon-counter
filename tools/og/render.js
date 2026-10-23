// Render the social share images described by tools/og/jobs.py.
// Usage: node tools/og/render.js jobs.json
// Needs Playwright (Chromium). Writes static/og/<name>.jpg at 1200x630.
const fs = require('fs');
const path = require('path');

let chromium;
try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'static', 'og');
const FONTS = 'file://' + path.join(ROOT, 'static', 'fonts');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function page(job) {
    const leaf = `<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;
    let visual = '';
    if (job.image) {
        visual = `<img class="art" src="file://${job.image}">`;
    } else if (job.bars && job.bars.length) {
        const max = Math.max(...job.bars);
        visual = `<div class="bars">${job.bars.map((v, i) => `<span style="height:${(v / max) * 100}%" class="${i === job.bars.length - 1 ? 'last' : ''}"></span>`).join('')}</div>`;
    } else if (job.ring) {
        visual = `<div class="ring"><i></i><i></i><i></i><b></b></div>`;
    } else if (job.ranking) {
        const max = job.ranking[0][1];
        visual = `<ol class="rank">${job.ranking.map(([n, s]) => `<li><b>${esc(n)}</b><i><em style="width:${(s / max) * 100}%"></em></i><span>${s.toFixed(1)}${job.unit || '%'}</span></li>`).join('')}</ol>`;
    }
    return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Fira Sans';font-weight:500;src:url('${FONTS}/fira-sans-latin-500-normal.woff2')}
@font-face{font-family:'Fira Sans';font-weight:700;src:url('${FONTS}/fira-sans-latin-700-normal.woff2')}
@font-face{font-family:'Fira Code';font-weight:300 700;src:url('${FONTS}/fira-code-latin-wght-normal.woff2')}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:'Fira Sans',sans-serif;color:#ecfdf5;
 background:radial-gradient(700px 420px at 85% 40%,rgba(16,185,129,.22),transparent 70%),radial-gradient(600px 400px at 0% 100%,rgba(251,191,36,.08),transparent 70%),#06100c;position:relative}
body:before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(52,211,153,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,.06) 1px,transparent 1px);background-size:48px 48px}
.art{position:absolute;inset:0;width:1200px;height:630px;object-fit:cover;opacity:.95}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,#06100c 0%,rgba(6,16,12,.92) 38%,rgba(6,16,12,.15) 70%,transparent)}
.wrap{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:26px}
.brand svg{width:34px;height:34px}
.kicker{margin-top:auto;display:inline-flex;align-self:flex-start;padding:7px 16px;border-radius:999px;border:1.5px solid rgba(52,211,153,.4);background:rgba(16,185,129,.12);color:#34d399;font:500 20px 'Fira Code',monospace;letter-spacing:.06em;text-transform:uppercase}
h1{margin-top:20px;font-size:${job.image ? 58 : 64}px;line-height:1.05;letter-spacing:-.03em;max-width:${job.image ? 640 : job.ranking ? 520 : 700}px;font-weight:700}
.big{margin-top:18px;font:600 96px 'Fira Code',monospace;letter-spacing:-.04em;background:linear-gradient(180deg,#ecfdf5 10%,#34d399);-webkit-background-clip:text;color:transparent;line-height:1}
.sub{margin-top:14px;font-size:26px;color:#a3bfb4;max-width:720px}
.url{margin-top:28px;font:500 20px 'Fira Code',monospace;color:#7f9c91}
.bars{position:absolute;right:72px;bottom:120px;width:380px;height:300px;display:flex;align-items:flex-end;gap:5px}
.bars span{flex:1;border-radius:4px 4px 0 0;background:linear-gradient(180deg,rgba(52,211,153,.75),rgba(16,185,129,.2))}
.bars span.last{background:linear-gradient(180deg,#fbbf24,rgba(251,191,36,.3))}
.rank{position:absolute;right:64px;top:50%;transform:translateY(-50%);width:440px;list-style:none;padding:0;display:grid;gap:14px}
.rank li{display:grid;grid-template-columns:150px 1fr 92px;align-items:center;gap:14px;font-size:21px;color:#a3bfb4}
.rank b{font-weight:500;color:#ecfdf5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rank i{height:12px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden;display:block}
.rank em{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#10b981,#34d399)}
.ring{position:absolute;right:120px;top:50%;width:340px;height:340px;transform:translateY(-50%)}
.ring i{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(52,211,153,.35)}
.ring i:nth-child(2){inset:50px;border-color:rgba(52,211,153,.55)}
.ring i:nth-child(3){inset:100px;border-color:rgba(52,211,153,.8);background:rgba(16,185,129,.12)}
.ring b{position:absolute;inset:150px;border-radius:50%;background:#34d399;box-shadow:0 0 60px 20px rgba(52,211,153,.55)}
.rank span{font-family:'Fira Code',monospace;color:#ecfdf5;text-align:right}
</style></head><body>${visual}${job.image ? '<div class="shade"></div>' : ''}
<div class="wrap"><div class="brand">${leaf}CO₂ Counter</div>
<span class="kicker">${esc(job.kicker)}</span><h1>${esc(job.title)}</h1>
${job.big ? `<div class="big">${esc(job.big)}</div>` : ''}${job.sub ? `<div class="sub">${esc(job.sub)}</div>` : ''}
<div class="url">carbonemissionscounter.com</div></div></body></html>`;
}

(async () => {
    const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    fs.mkdirSync(OUT, { recursive: true });
    const tmp = path.join(require('os').tmpdir(), 'og-render.html');
    const browser = await chromium.launch();
    const p = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    for (const job of jobs) {
        fs.writeFileSync(tmp, page(job));
        await p.goto('file://' + tmp);
        await p.evaluate(() => document.fonts.ready);
        await p.screenshot({ path: path.join(OUT, job.name + '.jpg'), type: 'jpeg', quality: 86 });
    }
    await browser.close();
    console.log(`${jobs.length} share images written to static/og/`);
})();
