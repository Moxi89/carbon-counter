/* Motion effects (motion.dev, self-hosted in /js/vendor/motion.js, MIT licence).
 * 1. Numbers count up when they scroll into view.
 * 2. Bars and chart columns grow into place.
 * 3. Ranking rows glide to their new position when sorted or filtered.
 * Everything is skipped for visitors who prefer reduced motion, and the page
 * works unchanged if this file or the library fails to load. */
(function () {
    'use strict';
    var M = window.Motion;
    if (!M || !M.animate || !M.inView) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var animate = M.animate, inView = M.inView, stagger = M.stagger;
    var EASE = [0.22, 1, 0.36, 1];

    /* ---------- 1. Count-up numbers ---------- */
    var NUM = /[-+−]?\d[\d,]*(?:\.\d+)?/;

    function countUp(el, from) {
        var text = el.textContent;
        var m = text.match(NUM);
        if (!m) return;
        var raw = m[0];
        var neg = /^[-−]/.test(raw);
        var plus = raw.charAt(0) === '+';
        var digits = raw.replace(/^[-+−]/, '');
        var to = parseFloat(digits.replace(/,/g, '')) * (neg ? -1 : 1);
        if (!isFinite(to) || to === 0) return;
        var decimals = (digits.split('.')[1] || '').length;
        var commas = digits.indexOf(',') > -1 || Math.abs(to) >= 10000;
        var before = text.slice(0, m.index), after = text.slice(m.index + raw.length);
        var fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: commas });
        var start = typeof from === 'number' ? from : 0;
        var render = function (v) {
            var sign = v < 0 ? '−' : (plus ? '+' : '');
            el.textContent = before + sign + fmt.format(Math.abs(v)) + after;
        };
        if (el._mfx) el._mfx.stop();       // a newer value replaces any running count
        render(start);
        el._mfx = animate(start, to, { duration: 1.1, ease: EASE, onUpdate: render, onComplete: function () { el.textContent = text; el._mfx = null; } });
    }

    var COUNT_SELECTORS = [
        '.cc-stat-value',                 // country page key figures
        '.cx-fact-num',                   // home: one tonne of CO2 is about...
        '.cx-rate-list dd',               // home: how fast it adds up
        '.cx-legend strong',              // home: fossil vs land use
        '.cx-bar-val',                    // home: biggest emitters
        '.cc-fuel-list strong',           // country: fuel shares
        '.cx-born-pct'                    // home: lifetime share
    ].join(',');

    document.querySelectorAll(COUNT_SELECTORS).forEach(function (el) {
        if (el.closest('[data-live]') || el.querySelector('*')) return; // skip live counters and mixed markup
        inView(el, function () { countUp(el); }, { amount: 0.6 });
    });

    // Lifetime tool: roll the headline percentage from the old value to the new one
    document.addEventListener('cx:born', function (e) {
        var el = document.getElementById('cxBornPct');
        if (el && e.detail) countUp(el, e.detail.from);
    });

    /* ---------- 2. Bars grow into place ---------- */
    function growWidths(container, selector) {
        var bars = container.querySelectorAll(selector);
        if (!bars.length) return;
        bars.forEach(function (b) { b.style.transformOrigin = 'left center'; });
        animate(bars, { scaleX: [0, 1] }, { duration: 0.9, ease: EASE, delay: stagger(0.06) });
    }

    [['.cx-bars', '.cx-bar > span'], ['.cx-split', 'span'], ['.cc-fuelbar', 'span'], ['.cx-share-bar', 'span']].forEach(function (pair) {
        document.querySelectorAll(pair[0]).forEach(function (c) {
            c.querySelectorAll(pair[1]).forEach(function (b) { b.style.transform = 'scaleX(0)'; b.style.transformOrigin = 'left center'; });
            inView(c, function () { growWidths(c, pair[1]); }, { amount: 0.4 });
        });
    });

    // Country trend charts: columns rise from the baseline, left to right
    document.querySelectorAll('.cc-trend').forEach(function (svg) {
        var rects = svg.querySelectorAll('rect');
        if (!rects.length) return;
        rects.forEach(function (r) {
            r.style.transformBox = 'fill-box';
            r.style.transformOrigin = 'center bottom';
            r.style.transform = 'scaleY(0)';
        });
        inView(svg, function () {
            animate(rects, { scaleY: [0, 1] }, { duration: 0.7, ease: EASE, delay: stagger(0.025) });
        }, { amount: 0.3 });
    });

    /* ---------- 3. Ranking rows glide when sorted or filtered (FLIP) ---------- */
    var table = document.getElementById('ccRanking');
    if (table) {
        var tbody = table.tBodies[0];
        var first = null;

        function snapshot() {
            var vh = window.innerHeight, map = new Map();
            [].forEach.call(tbody.rows, function (r) {
                if (r.hidden) return;
                var top = r.getBoundingClientRect().top;
                if (top > -200 && top < vh + 200) map.set(r, top);   // only rows near the screen
            });
            return map;
        }

        function play() {
            if (!first) return;
            var before = first; first = null;
            var vh = window.innerHeight, moved = [], entering = [];
            [].forEach.call(tbody.rows, function (r) {
                if (r.hidden) return;
                var top = r.getBoundingClientRect().top;
                if (top < -200 || top > vh + 200) return;
                if (before.has(r)) {
                    var dy = before.get(r) - top;
                    if (Math.abs(dy) > 1) moved.push([r, dy]);
                } else {
                    entering.push(r);
                }
            });
            moved.forEach(function (p) {
                animate(p[0], { y: [p[1], 0] }, { duration: 0.5, ease: EASE });
            });
            if (entering.length) {
                animate(entering, { opacity: [0, 1], y: [8, 0] }, { duration: 0.35, ease: EASE, delay: stagger(0.02) });
            }
        }

        // Capture phase runs before country-2026.js reorders or hides rows
        document.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('[data-sort]')) {
                first = snapshot();
                requestAnimationFrame(play);
            }
        }, true);
        document.addEventListener('input', function (e) {
            if (e.target && e.target.id === 'ccFilter') {
                first = snapshot();
                requestAnimationFrame(play);
            }
        }, true);
    }
})();
