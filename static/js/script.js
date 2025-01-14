document.addEventListener('DOMContentLoaded', function() {
    // Constants for emissions counter
    const EMISSIONS_PER_YEAR = 41.6; // Gt CO₂ per year
    const CARBON_BUDGET_START = 200; // Gt CO₂ in 2024
    const EMISSIONS_PER_SECOND = 1100; // tons of CO₂
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
        indonesia: { percentage: 1.65 },
        canada: { percentage: 1.53 }
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

    // Scroll improvements
    const scrollProgress = document.querySelector('.scroll-progress');
    const scrollUpButton = document.querySelector('.scroll-up');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    // Update scroll progress bar
    function updateScrollProgress() {
        const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        scrollProgress.style.width = `${scrolled}%`;
        
        // Show/hide scroll up button
        if (window.scrollY > window.innerHeight / 2) {
            scrollUpButton.classList.add('visible');
        } else {
            scrollUpButton.classList.remove('visible');
        }
    }

    // Handle scroll to top
    scrollUpButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Update active navigation link
    function updateActiveNavLink() {
        const fromTop = window.scrollY + 100;

        sections.forEach(section => {
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-link[href="#${id}"]`);
            
            if (!link) return;

            const offsetTop = section.offsetTop;
            const height = section.offsetHeight;

            if (fromTop >= offsetTop && fromTop < offsetTop + height) {
                navLinks.forEach(link => link.classList.remove('active'));
                link.classList.add('active');
                section.classList.add('section-highlight');
            } else {
                link.classList.remove('active');
                section.classList.remove('section-highlight');
            }
        });
    }

    // Parallax effect
    function updateParallax() {
        const parallaxElements = document.querySelectorAll('.parallax');
        parallaxElements.forEach(element => {
            const speed = element.dataset.parallaxSpeed || 0.2;
            const offset = window.scrollY * speed;
            element.style.setProperty('--parallax-offset', `${offset}px`);
        });
    }

    // Add parallax class to elements
    document.querySelectorAll('.counter-section, .faq-section h2').forEach(el => {
        el.classList.add('parallax');
    });

    // Scroll event listener with throttling
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateScrollProgress();
                updateActiveNavLink();
                updateParallax();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Initial call
    updateScrollProgress();
    updateActiveNavLink();

    // Initialize carousels
    document.querySelectorAll('.facts-carousel-container').forEach(container => {
        const carousel = container.querySelector('.facts-carousel');
        const facts = container.querySelectorAll('.fact-item');
        const prevButton = container.querySelector('.carousel-button.prev');
        const nextButton = container.querySelector('.carousel-button.next');
        const dotsContainer = container.querySelector('.carousel-dots');
        
        let currentSlide = 0;
        
        // Clear existing dots first
        dotsContainer.innerHTML = '';

        // Create dots
        facts.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('carousel-dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });

        // Update dots
        function updateDots() {
            container.querySelectorAll('.carousel-dot').forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        }

        // Slide navigation
        function goToSlide(index) {
            currentSlide = index;
            carousel.scrollTo({
                left: facts[index].offsetLeft,
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
});
