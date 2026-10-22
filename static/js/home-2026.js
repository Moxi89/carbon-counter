// Home page live counters (2026 layout).
// Figures are estimates from Global Carbon Budget 2025 annual totals.
(function () {
    'use strict';

    const EMISSIONS_PER_YEAR_T = 42.2e9;              // tonnes CO2 a year (fossil 38.1 + land use 4.1)
    const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    const PER_SECOND_T = EMISSIONS_PER_YEAR_T / SECONDS_PER_YEAR; // ~1,338 t
    const BUDGET_START_GT = 170;                      // 1.5 °C, 50% likelihood
    const BUDGET_START = Date.UTC(2026, 0, 1);        // GCB 2025 counts from 1 January 2026
    const BUDGET_END = BUDGET_START + (BUDGET_START_GT / 42.2) * SECONDS_PER_YEAR * 1000;

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
        el.countryValue.textContent = fmt.format(Math.floor(sessionSeconds * countryRate));

        const usedGt = Math.max(0, (now - BUDGET_START) / 1000 / SECONDS_PER_YEAR * 42.2);
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
