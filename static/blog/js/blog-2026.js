// Topic filter on the blog index.
(function () {
    'use strict';
    const chips = document.querySelectorAll('.bp-chip');
    const cards = document.querySelectorAll('#bpGrid .bp-card');
    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            const f = chip.dataset.filter;
            chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
            cards.forEach((card) => { card.hidden = f !== 'all' && card.dataset.category !== f; });
        });
    });
})();
