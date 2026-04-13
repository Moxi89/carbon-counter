document.addEventListener('DOMContentLoaded', function() {
    // Constants for emissions counter (2025 Global Carbon Budget)
    const EMISSIONS_PER_YEAR = 42.2; // Gt CO₂ per year (2025: 38.1 fossil + 4.1 land-use)
    const CARBON_BUDGET_START = 170; // Gt CO₂ remaining for 1.5°C (2025 update)
    const EMISSIONS_PER_SECOND = 1338; // tons of CO₂ (42.2 Gt ÷ 31,536,000 seconds)
    const UPDATE_INTERVAL = 1000/120; // ~8.33ms for 120fps
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
        pageTimer: document.getElementById('pageTimer'),
        countryTimer: document.getElementById('countryTimer')
    };

    // Country emissions data (percentage of global emissions - 2025 estimates)
    const countryEmissionsData = {
        china: { percentage: 33.0 },
        us: { percentage: 13.0 },
        india: { percentage: 7.2 },
        russia: { percentage: 4.7 },
        japan: { percentage: 3.0 },
        germany: { percentage: 1.8 },
        iran: { percentage: 1.8 },
        skorea: { percentage: 1.8 },
        saudi: { percentage: 1.7 },
        indonesia: { percentage: 1.6 },
        canada: { percentage: 1.5 }
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
                const countryData = countryEmissionsData[selectedCountry];
                const countryPercentage = countryData ? countryData.percentage / 100 : 0;
                const countryEmissions = Math.round(lastGlobalEmissions * countryPercentage);
                elements.countryEmissions.textContent = formatNumber(countryEmissions);
                
                // Update percentage text
                const percentageText = `${countryData.percentage}% of the global emission`;
                document.getElementById('countryPercentage').textContent = percentageText;
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

    // Carbon Budget Counter (2025 update)
    const carbonBudgetCounter = document.getElementById('carbonBudget');
    const progressFill = document.querySelector('.progress-fill');
    const startingBudget = 170; // Gt CO2 remaining for 1.5°C
    const annualUsage = 42.2; // Gt CO2 per year (2025)
    const usagePerSecond = annualUsage / (365 * 24 * 60 * 60); // Gt CO2 per second
    const startDate = new Date('2025-01-01T00:00:00Z');

    function updateCarbonBudget() {
        const secondsSince2024 = (Date.now() - startDate.getTime()) / 1000;
        const budgetUsed = usagePerSecond * secondsSince2024;
        const remainingBudget = startingBudget - budgetUsed;
        
        // Update counter
        carbonBudgetCounter.textContent = Math.max(0, remainingBudget.toFixed(6));
        
        // Update progress bar
        const percentageUsed = Math.min(100, (budgetUsed / startingBudget) * 100);
        progressFill.style.width = `${percentageUsed}%`;
        
        // Request next update
        requestAnimationFrame(updateCarbonBudget);
    }

    // Start the carbon budget counter
    updateCarbonBudget();

    // Event Delegation for better performance
    document.addEventListener('click', (e) => {
        // FAQ clicks
        if (e.target.closest('.faq-question')) {
            const button = e.target.closest('.faq-question');
            const faqItem = button.parentElement;
            
            // Close all other FAQs
            document.querySelectorAll('.faq-item.active').forEach(item => {
                if (item !== faqItem) {
                    item.classList.remove('active');
                }
            });
            
            // Toggle current FAQ
            faqItem.classList.toggle('active');
        }
        
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
    });

    // Handle tooltips for mobile
    function initTooltips() {
        const isMobile = window.innerWidth <= 768;
        const tooltips = document.querySelectorAll('.info-tooltip');
        const buttons = document.querySelectorAll('.info-button');

        buttons.forEach((button, index) => {
            const tooltip = tooltips[index];

            if (isMobile) {
                // For mobile: handle touch events
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    tooltips.forEach(t => {
                        if (t !== tooltip) {
                            t.style.opacity = '0';
                            t.style.visibility = 'hidden';
                        }
                    });
                    tooltip.style.opacity = '1';
                    tooltip.style.visibility = 'visible';
                });

                // Close tooltip when touching outside
                document.addEventListener('touchstart', (e) => {
                    if (!e.target.closest('.info-button') && !e.target.closest('.info-tooltip')) {
                        tooltips.forEach(t => {
                            t.style.opacity = '0';
                            t.style.visibility = 'hidden';
                        });
                    }
                });
            }
        });
    }

    // Initialize tooltips
    initTooltips();

    // Update tooltips on resize
    window.addEventListener('resize', initTooltips);

    // Update scroll progress bar
    function updateScrollProgress() {
        const scrollProgress = document.querySelector('.scroll-progress');
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        scrollProgress.style.width = `${scrollPercent}%`;
    }

    window.addEventListener('scroll', updateScrollProgress);
    updateScrollProgress();

    // Handle scroll to top
    const scrollUpButton = document.querySelector('.scroll-up');
    scrollUpButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Show/hide scroll button based on scroll position
    window.addEventListener('scroll', () => {
        scrollUpButton.classList.toggle('visible', window.scrollY > window.innerHeight / 2);
    });

    // Update timers
    function updateTimers() {
        const now = new Date();
        const secondsElapsed = Math.floor((now - pageLoadTime) / 1000);
        const timerText = `${secondsElapsed} seconds since you opened the page`;
        elements.pageTimer.textContent = timerText;
        elements.countryTimer.textContent = timerText;
    }

    // Update timers every second
    setInterval(updateTimers, 1000);
    updateTimers(); // Initial update

    // Initialize carousels
    function initializeCarousels() {
        const carousels = document.querySelectorAll('.facts-carousel-container');
        carousels.forEach(container => {
            const carousel = container.querySelector('.facts-carousel');
            const facts = Array.from(container.querySelectorAll('.fact-item'));
            const prevButton = container.querySelector('.carousel-button.prev');
            const nextButton = container.querySelector('.carousel-button.next');
            const dotsContainer = container.querySelector('.carousel-dots');
            
            let currentSlide = 0;
            
            // Clear existing dots
            dotsContainer.innerHTML = '';
            
            // Create only the needed number of dots
            facts.forEach((_, index) => {
                const dot = document.createElement('div');
                dot.classList.add('carousel-dot');
                if (index === 0) dot.classList.add('active');
                dot.addEventListener('click', () => goToSlide(index));
                dotsContainer.appendChild(dot);
            });

            const dots = Array.from(dotsContainer.children);

            function updateDots() {
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === currentSlide);
                });
            }

            function goToSlide(index) {
                currentSlide = index;
                const offset = facts[index].offsetLeft;
                carousel.scrollTo({
                    left: offset,
                    behavior: 'smooth'
                });
                updateDots();
            }

            prevButton.addEventListener('click', () => {
                currentSlide = (currentSlide - 1 + facts.length) % facts.length;
                goToSlide(currentSlide);
            });

            nextButton.addEventListener('click', () => {
                currentSlide = (currentSlide + 1) % facts.length;
                goToSlide(currentSlide);
            });

            // Handle scroll events
            carousel.addEventListener('scroll', () => {
                const index = Math.round(carousel.scrollLeft / carousel.offsetWidth);
                if (index !== currentSlide) {
                    currentSlide = index;
                    updateDots();
                }
            });

            // Auto-advance carousel every 10 seconds
            setInterval(() => {
                if (!document.hidden && !carousel.matches(':hover')) {
                    currentSlide = (currentSlide + 1) % facts.length;
                    goToSlide(currentSlide);
                }
            }, 10000);
        });
    }

    // Call initialization
    initializeCarousels();
});
