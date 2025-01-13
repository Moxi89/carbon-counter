document.addEventListener('DOMContentLoaded', function() {
    // Constants for emissions counter
    const EMISSIONS_PER_YEAR = 41.6; // Gt CO₂ per year
    const CARBON_BUDGET_START = 200; // Gt CO₂ in 2024
    const EMISSIONS_PER_SECOND = 1100; // tons of CO₂
    const UPDATE_INTERVAL = 1000/60; // ~16.7ms for 60fps
    const pageLoadTime = new Date(); // When the page was loaded
    const startOfYear = new Date(2025, 0, 1); // January 1st, 2025

    // Cache DOM elements
    const elements = {
        globalEmissions: document.getElementById('globalEmissions'),
        yearlyEmissions: document.getElementById('yearlyEmissions'),
        countryEmissions: document.getElementById('countryEmissions'),
        carbonBudget: document.getElementById('carbonBudget'),
        countrySelect: document.getElementById('countrySelect'),
        infoButtons: document.querySelectorAll('.info-button'),
        tooltips: document.querySelectorAll('.info-tooltip'),
        faqQuestions: document.querySelectorAll('.faq-question'),
        navToggle: document.querySelector('.nav-toggle'),
        navItems: document.querySelector('.nav-items'),
        navLinks: document.querySelectorAll('.nav-items a')
    };

    // Country emissions data (percentage of global emissions)
    const countryEmissionsData = {
        china: { percentage: 32.88 },
        us: { percentage: 12.60 },
        india: { percentage: 7.02 },
        russia: { percentage: 4.71 },
        japan: { percentage: 2.99 },
        germany: { percentage: 1.85 },
        iran: { percentage: 1.83 },
        skorea: { percentage: 1.80 },
        saudi: { percentage: 1.70 },
        indonesia: { percentage: 1.65 }
    };

    // Performance optimized number formatter
    const formatter = new Intl.NumberFormat('en-US');
    const formatNumber = num => formatter.format(Math.round(num));

    // Cached calculations
    let lastGlobalEmissions = 0;
    let lastUpdate = performance.now();

    // Use RequestAnimationFrame for smooth updates
    function updateCounters(timestamp) {
        const elapsed = timestamp - lastUpdate;
        
        if (elapsed >= UPDATE_INTERVAL) {
            const now = new Date();
            
            // Global Emissions
            const secondsSincePageLoad = (now - pageLoadTime) / 1000;
            lastGlobalEmissions = Math.round(EMISSIONS_PER_SECOND * secondsSincePageLoad);
            elements.globalEmissions.textContent = formatNumber(lastGlobalEmissions);

            // Yearly Emissions
            const secondsIntoYear = (now - startOfYear) / 1000;
            const yearlyEmissions = (EMISSIONS_PER_YEAR * secondsIntoYear) / (365 * 24 * 60 * 60);
            elements.yearlyEmissions.textContent = formatNumber(yearlyEmissions * 1000000000);

            // Country Emissions
            if (elements.countrySelect && elements.countryEmissions) {
                const selectedCountry = elements.countrySelect.value;
                const countryPercentage = countryEmissionsData[selectedCountry].percentage / 100;
                const countryEmissions = Math.round(lastGlobalEmissions * countryPercentage);
                elements.countryEmissions.textContent = formatNumber(countryEmissions);
            }

            // Carbon Budget
            if (elements.carbonBudget) {
                const yearFraction = (now - startOfYear) / (1000 * 60 * 60 * 24 * 365);
                const budgetRemaining = CARBON_BUDGET_START - (EMISSIONS_PER_YEAR * yearFraction);
                elements.carbonBudget.textContent = formatNumber(Math.max(0, Math.round(budgetRemaining)));
            }

            lastUpdate = timestamp;
        }

        requestAnimationFrame(updateCounters);
    }

    // Start the animation loop
    requestAnimationFrame(updateCounters);

    // Event Delegation for better performance
    document.addEventListener('click', (e) => {
        // Info button clicks
        if (e.target.closest('.info-button')) {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.target.closest('.info-button');
            const tooltip = button.nextElementSibling;
            
            elements.tooltips.forEach(t => {
                if (t !== tooltip) t.classList.remove('show');
            });
            
            tooltip.classList.toggle('show');
        }
        // Close tooltips when clicking outside
        else if (!e.target.closest('.info-tooltip')) {
            elements.tooltips.forEach(tooltip => tooltip.classList.remove('show'));
        }
        
        // FAQ clicks
        const faqQuestion = e.target.closest('.faq-question');
        if (faqQuestion) {
            const answer = faqQuestion.nextElementSibling;
            const isOpen = answer.classList.contains('show');
            
            document.querySelectorAll('.faq-answer').forEach(a => {
                a.classList.remove('show');
                a.previousElementSibling.classList.remove('active');
            });
            
            if (!isOpen) {
                answer.classList.add('show');
                faqQuestion.classList.add('active');
            }
        }
    });

    // Mobile menu optimization
    if (elements.navToggle) {
        elements.navToggle.addEventListener('click', () => {
            requestAnimationFrame(() => {
                elements.navItems.classList.toggle('show');
                elements.navToggle.classList.toggle('active');
            });
        });

        elements.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                requestAnimationFrame(() => {
                    elements.navItems.classList.remove('show');
                    elements.navToggle.classList.remove('active');
                });
            });
        });
    }
});
