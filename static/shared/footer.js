document.addEventListener('DOMContentLoaded', function() {
    // Load footer content
    fetch('/shared/footer.html?v=2026-10d')
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
