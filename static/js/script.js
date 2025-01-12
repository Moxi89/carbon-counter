document.addEventListener('DOMContentLoaded', function() {
    // Constants for emissions counter
    const EMISSIONS_PER_YEAR = 41.6; // Gt CO₂ per year
    const CARBON_BUDGET_START = 200; // Gt CO₂ in 2024
    const EMISSIONS_PER_SECOND = 1100; // tons of CO₂
    const UPDATE_INTERVAL = 50; // milliseconds
    const pageLoadTime = new Date(); // When the page was loaded
    const startOfYear = new Date(2025, 0, 1); // January 1st, 2025

    // Get counter elements
    const globalEmissionsElement = document.getElementById('globalEmissions');
    const yearlyEmissionsElement = document.getElementById('yearlyEmissions');
    const countryEmissionsElement = document.getElementById('countryEmissions');
    const carbonBudgetElement = document.getElementById('carbonBudget');
    const countrySelect = document.getElementById('countrySelect');

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

    function formatNumber(num) {
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function updateGlobalEmissions() {
        const now = new Date();
        const secondsSincePageLoad = (now - pageLoadTime) / 1000;
        const totalEmissions = Math.round(EMISSIONS_PER_SECOND * secondsSincePageLoad);
        globalEmissionsElement.textContent = formatNumber(totalEmissions);
    }

    function updateYearlyEmissions() {
        const now = new Date();
        const secondsIntoYear = (now - startOfYear) / 1000;
        const yearlyEmissions = (EMISSIONS_PER_YEAR * secondsIntoYear) / (365 * 24 * 60 * 60);
        yearlyEmissionsElement.textContent = formatNumber(yearlyEmissions * 1000000000);
    }

    function updateCountryEmissions() {
        const selectedCountry = countrySelect.value;
        const countryPercentage = countryEmissionsData[selectedCountry].percentage / 100;
        const globalEmissions = parseInt(globalEmissionsElement.textContent.replace(/,/g, ''));
        const countryEmissions = Math.round(globalEmissions * countryPercentage);
        countryEmissionsElement.textContent = formatNumber(countryEmissions);
    }

    function updateCarbonBudget() {
        const now = new Date();
        const yearFraction = (now - startOfYear) / (1000 * 60 * 60 * 24 * 365);
        const budgetRemaining = CARBON_BUDGET_START - (EMISSIONS_PER_YEAR * yearFraction);
        carbonBudgetElement.textContent = Math.max(0, Math.round(budgetRemaining));
    }

    function updateAllCounters() {
        updateGlobalEmissions();
        updateYearlyEmissions();
        updateCountryEmissions();
        updateCarbonBudget();
    }

    // Initialize counters
    updateAllCounters();

    // Update counters every interval
    setInterval(updateAllCounters, UPDATE_INTERVAL);

    // Country selector event listener
    countrySelect?.addEventListener('change', updateCountryEmissions);

    // Info button functionality
    document.querySelectorAll('.info-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const tooltip = button.nextElementSibling;
            
            // Close all other tooltips
            document.querySelectorAll('.info-tooltip').forEach(t => {
                if (t !== tooltip) {
                    t.classList.remove('show');
                }
            });
            
            // Toggle current tooltip
            tooltip.classList.toggle('show');
            button.classList.toggle('active');
        });
    });

    // Close tooltips when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.info-tooltip').forEach(tooltip => {
            tooltip.classList.remove('show');
        });
        document.querySelectorAll('.info-button').forEach(button => {
            button.classList.remove('active');
        });
    });

    // FAQ Accordion functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isOpen = answer.style.maxHeight;

            // Close all other answers
            document.querySelectorAll('.faq-answer').forEach(item => {
                item.style.maxHeight = null;
            });
            document.querySelectorAll('.faq-question').forEach(item => {
                item.classList.remove('active');
            });

            // Toggle current answer
            if (!isOpen) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
                question.classList.add('active');
            }
        });
    });

    // Mobile menu functionality
    const navToggle = document.querySelector('.nav-toggle');
    const navItems = document.querySelector('.nav-items');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navItems.classList.toggle('show');
            navToggle.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    const navLinks = document.querySelectorAll('.nav-items a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navItems.classList.remove('show');
            navToggle.classList.remove('active');
        });
    });
});
