/* Carbon footprint calculator for /blog/posts/carbon-footprint-calculator-guide.
 * Plain JS, no dependencies. Recalculates on every input. Fails silently if markup is missing.
 * Emission factors (kg CO2e) and their sources are listed in the article's "How the calculator works" table.
 */
(function () {
    'use strict';

    var root = document.getElementById('fpCalc');
    if (!root) return;

    var KM_PER_MILE = 1.609344;

    // Car tailpipe factors, kg CO2e per km (UK DESNZ 2025, average car). Electric is computed from the grid.
    var CAR = { petrol: 0.16272, diesel: 0.17304, hybrid: 0.128, electric: null, none: 0 };
    var EV_KWH_PER_KM = 0.2; // at the plug, incl. charging losses (US DOE: ~32.6 kWh per 100 miles)

    // Flights, economy, incl. radiative forcing (DESNZ 2025), per return trip with assumed distances.
    var SHORT_RETURN_KM = 2400, SHORT_KG_PER_KM = 0.126; // 2 x 1,200 km
    var LONG_RETURN_KM = 14000, LONG_KG_PER_KM = 0.117;  // 2 x 7,000 km

    // Electricity grid intensity, kg CO2e per kWh.
    var GRID = { world: 0.458, us: 0.384, eu: 0.170, uk: 0.126, low: 0.020 };

    // Heating fuels, kg CO2e per kWh, gross CV (DESNZ 2025). 'none' = electric (counted in electricity), 'other' = not counted.
    var HEAT = { gas: 0.183, oil: 0.247, lpg: 0.214 };
    var HEAT_LABEL = { gas: 'Gas use (kWh a year)', oil: 'Heating oil use (kWh a year)', lpg: 'LPG use (kWh a year)' };
    var HEAT_HINT = {
        gas: 'Typical UK home: 11,500 kWh. Your bill shows kWh.',
        oil: '1 litre of heating oil is about 10.4 kWh, so 1,000 litres is about 10,400 kWh.',
        lpg: '1 litre of LPG is about 7.1 kWh, so 1,000 litres is about 7,100 kWh.'
    };

    // Diets, tonnes CO2e per year (Scarborough et al. 2014: kg CO2e per 2,000 kcal per day x 365).
    var DIET = { high: 2.62, medium: 2.05, low: 1.70, fish: 1.43, veg: 1.39, vegan: 1.05 };
    var DIET_ORDER = ['high', 'medium', 'low', 'veg', 'vegan'];
    var DIET_NAME = { high: 'a high-meat', medium: 'a medium-meat', low: 'a low-meat', fish: 'a pescatarian', veg: 'a vegetarian', vegan: 'a vegan' };

    // Shopping, services and everything else, tonnes per year (calculator assumption).
    var SHOP = { low: 1.0, medium: 2.0, high: 3.5 };

    var WORLD_AVG = 4.7, TARGET_2030 = 2.5;

    function el(id) { return document.getElementById(id); }

    function num(id, fallback) {
        var input = el(id);
        if (!input) return fallback;
        var v = parseFloat(String(input.value).replace(',', '.'));
        return isFinite(v) && v > 0 ? v : 0;
    }

    function val(id, fallback) {
        var input = el(id);
        return input && input.value ? input.value : fallback;
    }

    function fmt(t) {
        return (t < 10 ? t.toFixed(1) : t.toFixed(0)) + ' t';
    }

    function setText(id, text) {
        var node = el(id);
        if (node) node.textContent = text;
    }

    function calc() {
        var grid = GRID[val('fpGrid', 'world')] || GRID.world;
        var people = Math.max(1, Math.round(num('fpPeople', 1)) || 1);

        var km = num('fpCarKm', 0) * (val('fpCarUnit', 'km') === 'mi' ? KM_PER_MILE : 1);
        var fuel = val('fpFuel', 'petrol');
        var carFactor = fuel === 'electric' ? EV_KWH_PER_KM * grid : (CAR[fuel] || 0);
        var car = km * carFactor / 1000;

        var shortTrips = num('fpShort', 0), longTrips = num('fpLong', 0);
        var shortT = shortTrips * SHORT_RETURN_KM * SHORT_KG_PER_KM / 1000;
        var longT = longTrips * LONG_RETURN_KM * LONG_KG_PER_KM / 1000;

        var elecKwh = num('fpElec', 0);
        var elec = elecKwh * grid / 1000 / people;

        var heatType = val('fpHeat', 'gas');
        var heatKwh = HEAT[heatType] ? num('fpGas', 0) : 0;
        var heat = heatKwh * (HEAT[heatType] || 0) / 1000 / people;

        var dietKey = val('fpDiet', 'medium');
        var food = DIET[dietKey] || DIET.medium;
        var shopKey = val('fpShop', 'medium');
        var shop = SHOP[shopKey] || SHOP.medium;

        var parts = [
            ['car', 'Car', car],
            ['flights', 'Flights', shortT + longT],
            ['electricity', 'Home electricity', elec],
            ['heating', 'Home heating', heat],
            ['food', 'Food', food],
            ['shopping', 'Shopping & other', shop]
        ];
        var total = parts.reduce(function (s, p) { return s + p[2]; }, 0);

        setText('fpTotal', total.toFixed(1));
        setText('fpStickyTotal', total.toFixed(1) + ' t CO\u2082e');
        lastTotal = total;
        setText('fpWorld', compare(total, WORLD_AVG, 'the world average of 4.7 t (fossil CO₂ per person)'));
        setText('fpTarget', compare(total, TARGET_2030, 'the 2.5 t per person 1.5 °C-aligned lifestyle target for 2030'));

        drawBreakdown(parts, total);
        drawTips({
            km: km, fuel: fuel, car: car, grid: grid, shortT: shortT, longT: longT, shortTrips: shortTrips,
            longTrips: longTrips, elec: elec, heat: heat, dietKey: dietKey, food: food, shopKey: shopKey
        });
    }

    function compare(total, ref, label) {
        if (total <= 0) return 'Enter your details to compare with ' + label + '.';
        var r = total / ref;
        if (r > 1.05) return 'About ' + r.toFixed(1) + '× ' + label + '.';
        if (r < 0.95) return 'About ' + Math.round((1 - r) * 100) + '% below ' + label + '.';
        return 'Close to ' + label + '.';
    }

    function drawBreakdown(parts, total) {
        var list = el('fpBreakdown');
        if (!list) return;
        var max = parts.reduce(function (m, p) { return Math.max(m, p[2]); }, 0) || 1;
        list.innerHTML = '';
        parts.forEach(function (p) {
            var li = document.createElement('li');
            li.className = 'fp-bar-row';
            var share = total > 0 ? Math.round(p[2] / total * 100) : 0;
            li.innerHTML = '<span class="fp-bar-label"></span><span class="fp-bar-value"></span>' +
                '<span class="fp-bar-track" aria-hidden="true"><span class="fp-bar-fill"></span></span>';
            li.querySelector('.fp-bar-label').textContent = p[1];
            li.querySelector('.fp-bar-value').textContent = fmt(p[2]) + ' · ' + share + '%';
            li.querySelector('.fp-bar-fill').style.width = Math.max(0, p[2] / max * 100).toFixed(1) + '%';
            list.appendChild(li);
        });
    }

    function drawTips(d) {
        var list = el('fpTips');
        if (!list) return;
        var tips = [];

        if (d.longTrips > 0) {
            tips.push([d.longT / d.longTrips, 'Skip or replace one long-haul return flight: about ' + fmt(d.longT / d.longTrips) + ' less, the single biggest one-off cut most people can make.']);
        }
        if (d.shortTrips > 0) {
            tips.push([d.shortT / d.shortTrips * 0.8, 'Take the train instead of one short-haul return flight: most of its ' + fmt(d.shortT / d.shortTrips) + ' disappears.']);
        }
        if (d.car > 0 && d.fuel !== 'electric') {
            var evSave = d.car - d.km * EV_KWH_PER_KM * d.grid / 1000;
            if (evSave > d.car * 0.25) {
                tips.push([evSave, 'Make your next car electric: on your grid that cuts driving emissions by about ' + fmt(evSave) + ' a year (more as grids get cleaner).']);
            }
            tips.push([d.car * 0.2, 'Swap a fifth of your car trips for walking, cycling, transit or home working: about ' + fmt(d.car * 0.2) + ' a year.']);
        }
        if (d.elec > 0 && d.grid > 0.05) {
            tips.push([d.elec * 0.9, 'Move to a renewable electricity tariff or add rooftop solar: up to ' + fmt(d.elec) + ' of your share of home electricity.']);
        }
        if (d.heat > 0) {
            var heatSave = d.heat * 0.16;
            tips.push([heatSave, 'Turn the thermostat down 1 °C (about 7% of heating energy) and lower a condensing boiler’s flow temperature to 60 °C (about 9%): roughly ' + fmt(heatSave) + ' a year. A heat pump is the long-term fix.']);
        }
        var i = DIET_ORDER.indexOf(d.dietKey === 'fish' ? 'veg' : d.dietKey);
        if (i >= 0 && i < DIET_ORDER.length - 1) {
            var next = DIET_ORDER[i + 1];
            var dietSave = d.food - DIET[next];
            if (dietSave > 0.01) {
                tips.push([dietSave, 'Shift from ' + DIET_NAME[d.dietKey] + ' to ' + DIET_NAME[next] + ' diet: about ' + fmt(dietSave) + ' a year. Beef and lamb are the biggest lever.']);
            }
        }
        if (d.shopKey === 'high') {
            tips.push([SHOP.high - SHOP.medium, 'Buy fewer new things and keep them longer, especially electronics, clothes and furniture: about ' + fmt(SHOP.high - SHOP.medium) + ' a year.']);
        }

        tips.sort(function (a, b) { return b[0] - a[0]; });
        list.innerHTML = '';
        if (!tips.length) {
            var li = document.createElement('li');
            li.textContent = 'Your footprint is already low in every category the calculator covers. The next step is supporting change beyond your household.';
            list.appendChild(li);
            return;
        }
        tips.slice(0, 3).forEach(function (t) {
            var item = document.createElement('li');
            item.textContent = t[1];
            list.appendChild(item);
        });
    }

    function syncHeat() {
        var type = val('fpHeat', 'gas');
        var gasField = el('fpGasField');
        if (gasField) gasField.hidden = !HEAT[type];
        if (HEAT[type]) {
            setText('fpGasLabel', HEAT_LABEL[type]);
            setText('fpGasHint', HEAT_HINT[type]);
        }
        // No car: the distance doesn't apply
        var noCar = val('fpFuel', 'petrol') === 'none';
        ['fpCarKm', 'fpCarUnit'].forEach(function (id) { var n = el(id); if (n) n.disabled = noCar; });
    }

    // Shareable state: every field is mirrored in the URL (?km=12000&fuel=petrol...)
    var FIELDS = { km: 'fpCarKm', unit: 'fpCarUnit', fuel: 'fpFuel', short: 'fpShort', long: 'fpLong', people: 'fpPeople',
        elec: 'fpElec', grid: 'fpGrid', heat: 'fpHeat', fuelkwh: 'fpGas', diet: 'fpDiet', shop: 'fpShop' };
    var lastTotal = 0;

    function readUrl() {
        var q = new URLSearchParams(location.search);
        Object.keys(FIELDS).forEach(function (k) {
            var n = el(FIELDS[k]);
            if (!n || !q.has(k)) return;
            var v = q.get(k);
            if (n.tagName === 'SELECT') {
                if ([].some.call(n.options, function (o) { return o.value === v; })) n.value = v;
            } else if (/^\d+(\.\d+)?$/.test(v)) {
                n.value = v;
            }
        });
    }

    function stateQuery() {
        var q = new URLSearchParams();
        Object.keys(FIELDS).forEach(function (k) {
            var n = el(FIELDS[k]);
            if (n && n.value !== '') q.set(k, n.value);
        });
        return q.toString();
    }

    var urlTimer;
    function writeUrl() {
        clearTimeout(urlTimer);
        urlTimer = setTimeout(function () {
            try { history.replaceState(null, '', location.pathname + '?' + stateQuery() + location.hash); } catch (e) { /* ignore */ }
        }, 400);
    }

    function update() { syncHeat(); calc(); writeUrl(); }

    var form = el('fpForm');
    if (form) {
        form.addEventListener('input', update);
        form.addEventListener('change', update);
        form.addEventListener('submit', function (ev) { ev.preventDefault(); calc(); });
    }

    var shareBtn = el('fpShare');
    if (shareBtn) {
        shareBtn.addEventListener('click', function () {
            var canonical = document.querySelector('link[rel="canonical"]');
            var url = (canonical ? canonical.href : location.origin + location.pathname) + '?' + stateQuery() + '#fpCalc';
            var r = lastTotal / WORLD_AVG;
            var text = 'My carbon footprint is about ' + lastTotal.toFixed(1) + ' t CO\u2082e a year' +
                (r > 1.05 ? ', ' + r.toFixed(1) + '\u00d7 the world average' : r < 0.95 ? ', below the world average' : '') +
                '. Estimate yours in two minutes:';
            var label = shareBtn.querySelector('span');
            var flash = function (msg) { label.textContent = msg; setTimeout(function () { label.textContent = 'Share my result'; }, 2200); };
            if (navigator.share) {
                navigator.share({ title: 'My carbon footprint', text: text, url: url }).catch(function () {});
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text + ' ' + url).then(function () { flash('Link copied'); }, function () { flash('Copy failed'); });
            } else {
                window.prompt('Copy this link:', text + ' ' + url);
            }
        });
    }

    var resetBtn = el('fpReset');
    if (resetBtn && form) {
        resetBtn.addEventListener('click', function () {
            form.reset();
            syncHeat();
            calc();
            try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* ignore */ }
        });
    }

    readUrl();
    root.classList.add('fp-ready');
    syncHeat();
    calc();
})();
