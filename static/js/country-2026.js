// Live estimates, search and sorting for the CO2-by-country pages.
// Rates come from each country's latest annual total (data-rate = tonnes per second).
(function () {
    'use strict';

    const fmt = new Intl.NumberFormat('en-US');
    const loadedAt = Date.now();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const yearStart = () => new Date(new Date().getFullYear(), 0, 1).getTime();
    const sinceYearStart = () => (Date.now() - yearStart()) / 1000;

    document.querySelectorAll('.current-year').forEach(el => { el.textContent = new Date().getFullYear(); });

    // Country page: one big counter
    const live = document.querySelector('.cc-live[data-rate]');
    const liveYear = live && live.querySelector('[data-live="year"]');
    const liveSession = live && live.querySelector('[data-live="session"]');
    const liveRate = live ? parseFloat(live.dataset.rate) : 0;

    // Ranking page: one cell per row
    const rows = [...document.querySelectorAll('#ccRanking tbody tr')];
    const cells = rows.map(r => ({ el: r.querySelector('[data-live="row"]'), rate: parseFloat(r.dataset.rate) }));

    let last = 0;
    function tick(ts) {
        const interval = reduceMotion.matches ? 1000 : (cells.length ? 250 : 50);
        if (ts - last >= interval) {
            const s = sinceYearStart();
            if (liveYear) {
                liveYear.textContent = fmt.format(Math.floor(s * liveRate));
                liveSession.textContent = fmt.format(Math.floor((Date.now() - loadedAt) / 1000 * liveRate));
            }
            for (const c of cells) {
                if (c.el && c.el.offsetParent !== null) c.el.textContent = fmt.format(Math.floor(s * c.rate));
            }
            last = ts;
        }
        requestAnimationFrame(tick);
    }
    if (liveYear || cells.length) requestAnimationFrame(tick);

    // Search
    const filter = document.getElementById('ccFilter');
    const none = document.getElementById('ccNoResults');
    if (filter) {
        filter.addEventListener('input', () => {
            const q = filter.value.trim().toLowerCase();
            let shown = 0;
            rows.forEach(r => {
                const match = !q || r.dataset.name.includes(q);
                r.hidden = !match;
                if (match) shown++;
            });
            if (none) none.hidden = shown > 0;
        });
    }

    // Sort by total or per person
    const tbody = document.querySelector('#ccRanking tbody');
    document.querySelectorAll('[data-sort]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.sort;
            document.querySelectorAll('[data-sort]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
            const sorted = [...rows].sort((a, b) => parseFloat(b.dataset[key]) - parseFloat(a.dataset[key]));
            sorted.forEach((r, i) => {
                r.querySelector('.cc-rank').textContent = parseFloat(r.dataset[key]) >= 0 ? i + 1 : '–';
                tbody.appendChild(r);
            });
        });
    });
})();
