// Home page live counters (2026 layout).
// Figures are estimates from Global Carbon Budget 2025 annual totals.
(function () {
    'use strict';

    const EMISSIONS_PER_YEAR_T = 42.2e9;              // tonnes CO2 a year (fossil 38.1 + land use 4.1)
    const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    const PER_SECOND_T = EMISSIONS_PER_YEAR_T / SECONDS_PER_YEAR; // ~1,338 t
    const BUDGET_START_GT = 170;                      // 1.5 °C, 50% likelihood
    const BUDGET_START = Date.UTC(2026, 0, 1);        // GCB 2025 counts from 1 January 2026
    const BUDGET_END = BUDGET_START + (BUDGET_START_GT / (EMISSIONS_PER_YEAR_T / 1e9)) * SECONDS_PER_YEAR * 1000;

    // Country figures live on the <option> elements (share %, annual Mt),
    // written by tools/countries/build.py from the latest annual data.

    const $ = (id) => document.getElementById(id);
    const el = {
        year: $('cxYear'), session: $('cxSession'), budget: $('cxBudget'),
        meterUsed: $('cxMeterUsed'), used: $('cxUsed'), meter: $('cxMeter'),
        years: $('cxYears'), days: $('cxDays'), hours: $('cxHours'), mins: $('cxMins'), secs: $('cxSecs'),
        country: $('cxCountry'), countryValue: $('cxCountryValue'), countryShare: $('cxCountryShare'),
        countryBar: $('cxCountryBar'), countryYear: $('cxCountryYear'), countryLink: $('cxCountryLink'), pause: $('cxPause')
    };
    document.querySelectorAll('.current-year').forEach((n) => { n.textContent = new Date().getFullYear(); });
    if (!el.year) return;

    const fmt = new Intl.NumberFormat('en-US');
    const pad = (n) => String(n).padStart(2, '0');
    const loadedAt = Date.now();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let paused = false;
    let pausedAt = 0;      // wall-clock time when paused
    let lastPaint = 0;

    const selected = () => el.country.options[el.country.selectedIndex];
    const topShare = parseFloat(el.country.options[0].dataset.share) || 1;

    function setCountry() {
        const o = selected();
        const share = parseFloat(o.dataset.share) || 0;
        el.countryShare.textContent = share.toFixed(1) + '%';
        el.countryYear.textContent = ((parseFloat(o.dataset.mt) || 0) / 1000).toFixed(2);
        el.countryBar.style.width = (share / topShare * 100) + '%';
        if (el.countryLink) {
            el.countryLink.href = '/co2-emissions/' + o.value;
            el.countryLink.textContent = o.textContent + ' CO\u2082 profile \u2192';
        }
    }

    function render(now) {
        const yearStart = new Date(new Date(now).getFullYear(), 0, 1).getTime();
        el.year.textContent = fmt.format(Math.floor((now - yearStart) / 1000 * PER_SECOND_T));

        const sessionSeconds = (now - loadedAt) / 1000;
        const sessionT = Math.max(0, sessionSeconds * PER_SECOND_T);
        el.session.textContent = fmt.format(Math.floor(sessionT));

        const countryRate = (parseFloat(selected().dataset.mt) || 0) * 1e6 / SECONDS_PER_YEAR;
        el.countryValue.textContent = fmt.format(Math.floor((now - yearStart) / 1000 * countryRate));

        const usedGt = Math.max(0, (now - BUDGET_START) / 1000 / SECONDS_PER_YEAR * EMISSIONS_PER_YEAR_T / 1e9);
        const leftGt = Math.max(0, BUDGET_START_GT - usedGt);
        const usedPct = Math.min(100, usedGt / BUDGET_START_GT * 100);
        el.budget.textContent = leftGt.toFixed(2);
        el.meterUsed.style.width = usedPct + '%';
        el.used.textContent = Math.round(usedPct) + '% used';
        el.meter.setAttribute('aria-label', 'Carbon budget: ' + Math.round(usedPct) + ' percent used, ' + leftGt.toFixed(1) + ' gigatonnes left');

        let s = Math.max(0, Math.floor((BUDGET_END - now) / 1000));
        const years = Math.floor(s / SECONDS_PER_YEAR); s -= years * SECONDS_PER_YEAR;
        const days = Math.floor(s / 86400); s -= days * 86400;
        const hours = Math.floor(s / 3600); s -= hours * 3600;
        const mins = Math.floor(s / 60);
        el.years.textContent = years;
        el.days.textContent = days;
        el.hours.textContent = pad(hours);
        el.mins.textContent = pad(mins);
        el.secs.textContent = pad(s - mins * 60);
    }

    function tick(ts) {
        // Smooth on most devices; once a second when the user prefers reduced motion
        const interval = reduceMotion.matches ? 1000 : 50;
        if (!paused && ts - lastPaint >= interval) {
            render(Date.now());
            lastPaint = ts;
        }
        requestAnimationFrame(tick);
    }

    el.country.addEventListener('change', () => { setCountry(); render(paused ? pausedAt : Date.now()); });

    el.pause.addEventListener('click', () => {
        paused = !paused;
        if (paused) pausedAt = Date.now();
        else render(Date.now());
        el.pause.setAttribute('aria-pressed', String(paused));
        el.pause.querySelector('.cx-pause-text').textContent = paused ? 'Resume' : 'Pause';
        document.body.classList.toggle('cx-is-paused', paused);
    });

    setCountry();
    render(Date.now());
    requestAnimationFrame(tick);
})();

// "Since you were born": share of all fossil CO2 (since 1750) emitted after a given year.
// Data: [year, annual Mt, cumulative Mt] from Our World in Data, written by tools/countries/build.py.
(function () {
    'use strict';
    const dataEl = document.getElementById('cxBornData');
    const form = document.getElementById('cxBornForm');
    if (!dataEl || !form) return;

    const series = JSON.parse(dataEl.textContent).s;
    const byYear = new Map(series.map((r) => [r[0], r]));
    const first = series[0][0];
    const [lastYear, lastAnnual, lastCum] = series[series.length - 1];
    const input = document.getElementById('cxBornYear');
    const error = document.getElementById('cxBornError');
    const $ = (id) => document.getElementById(id);
    const fmt = new Intl.NumberFormat('en-US');
    let current = null;

    function compute(year) {
        const [, annual, cum] = byYear.get(year);
        const since = lastCum - (cum - annual);
        return { year, annual, since, pct: since / lastCum * 100, rise: (lastAnnual / annual - 1) * 100 };
    }

    function show(year) {
        const r = compute(year);
        const from = parseInt($('cxBornPct').textContent, 10) || 0;
        current = r;
        $('cxBornPct').textContent = Math.round(r.pct) + '%';
        $('cxBornY').textContent = year;
        $('cxBornBarY').textContent = year;
        $('cxBornBar').style.width = r.pct.toFixed(1) + '%';
        document.querySelectorAll('.cx-born-y').forEach((el) => { el.textContent = year; });
        $('cxBornTotal').textContent = fmt.format(Math.round(r.since / 1000)) + ' billion t';
        $('cxBornThen').textContent = (r.annual / 1000).toFixed(1) + ' billion t';
        $('cxBornRise').textContent = (r.rise >= 0 ? '+' : '−') + fmt.format(Math.round(Math.abs(r.rise))) + '%';
        // Optional animation hook (js/motion-effects.js)
        document.dispatchEvent(new CustomEvent('cx:born', { detail: { from: from } }));
    }

    function valid(v) {
        const y = parseInt(v, 10);
        return String(y) === String(v).trim() && byYear.has(y) ? y : null;
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const y = valid(input.value);
        if (y === null) {
            error.textContent = 'Enter a year between ' + first + ' and ' + lastYear + '.';
            error.hidden = false;
            input.setAttribute('aria-invalid', 'true');
            input.focus();
            return;
        }
        error.hidden = true;
        input.removeAttribute('aria-invalid');
        show(y);
        try { history.replaceState(null, '', '?born=' + y + '#since-you-were-born'); } catch (e) { /* ignore */ }
    });

    const shareBtn = document.getElementById('cxBornShare');
    shareBtn.addEventListener('click', () => {
        const r = current || compute(parseInt(input.value, 10) || 1990);
        const url = 'https://www.carbonemissionscounter.com/?born=' + r.year + '#since-you-were-born';
        const text = Math.round(r.pct) + '% of all the fossil CO₂ ever emitted has been released since I was born in ' + r.year + '. What about you?';
        const label = shareBtn.querySelector('span');
        const flash = (msg) => { label.textContent = msg; setTimeout(() => { label.textContent = 'Share my result'; }, 2200); };
        if (navigator.share) {
            navigator.share({ title: 'CO₂ since I was born', text: text, url: url }).catch(() => {});
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text + ' ' + url).then(() => flash('Copied'), () => flash('Copy failed'));
        } else {
            window.prompt('Copy this:', text + ' ' + url);
        }
    });

    const param = new URLSearchParams(location.search).get('born');
    const fromUrl = param && valid(param);
    if (fromUrl) { input.value = fromUrl; show(fromUrl); }
})();

// Copy the suggested citation, with today's date as the access date
(function () {
    const btn = document.getElementById('cxCiteCopy');
    const cite = document.getElementById('cxCite');
    if (!btn || !cite) return;
    btn.addEventListener('click', () => {
        const accessed = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const text = cite.textContent.replace(/\s+/g, ' ').trim() + ' (accessed ' + accessed + ').';
        const label = btn.querySelector('span');
        const done = () => { label.textContent = 'Copied'; setTimeout(() => { label.textContent = 'Copy citation'; }, 2200); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => window.prompt('Copy this citation:', text));
        else window.prompt('Copy this citation:', text);
    });
})();
