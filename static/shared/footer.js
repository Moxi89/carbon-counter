document.addEventListener('DOMContentLoaded', function() {
    // Load footer content
    fetch('/shared/footer?v=2026-10m')
        .then(response => response.text())
        .then(data => {
            const footerPlaceholder = document.getElementById('footer-placeholder');
            if (footerPlaceholder) {
                footerPlaceholder.innerHTML = data;
                footerPlaceholder.querySelectorAll('.footer-year').forEach(el => {
                    el.textContent = new Date().getFullYear();
                });
            }
        })
        .catch(error => {
            console.error('Error loading footer:', error);
        });
});

// Gentle reveal for content blocks as they scroll into view (see theme-2026.css)
(function () {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const SELECTOR = '.cx-budget, .cx-tile, .cc-stat, .cc-card, .cc-podium-item, .blog-card, .faq-item, .cc-faq-item, ' +
        '.feature, .understanding-card, .science-card, .impact-card, .next-step-card, .usage-step, .policy-section';
    const start = () => {
        const items = document.querySelectorAll(SELECTOR);
        if (!items.length) return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        document.documentElement.classList.add('t-reveal-on');
        items.forEach((el) => io.observe(el));
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();

// Share buttons: native share sheet on phones, copy link elsewhere
document.addEventListener('click', function (event) {
    const btn = event.target.closest('[data-share]');
    if (!btn) return;
    const canonical = document.querySelector('link[rel="canonical"]');
    const url = canonical ? canonical.href : location.href;
    const title = document.title;
    const label = btn.querySelector('span');
    const flash = (text) => {
        if (!label) return;
        label.textContent = text;
        clearTimeout(btn._t);
        btn._t = setTimeout(() => { label.textContent = 'Share'; }, 2200);
    };
    if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => flash('Link copied'), () => flash('Copy failed'));
    } else {
        window.prompt('Copy this link:', url);
    }
});

// "Back to top" in the footer (no inline handlers, so it works under a strict CSP)
document.addEventListener('click', function (event) {
    const link = event.target.closest('[data-top]');
    if (!link) return;
    event.preventDefault();
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
});
