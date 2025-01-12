document.addEventListener('DOMContentLoaded', function() {
    // Constants for emissions counter
    const FPS = 60;
    const FRAME_INTERVAL = 1000 / FPS; // 16.67ms for 60fps
    const EMISSIONS_PER_YEAR = 41.6; // Gt CO₂ per year
    const CARBON_BUDGET_START = 200; // Gt CO₂ in 2024
    const EMISSIONS_PER_SECOND = 1100; // tons of CO₂
    const UPDATE_INTERVAL = 50; // milliseconds
    const pageLoadTime = new Date(); // When the page was loaded
    const startOfYear = new Date(2025, 0, 1); // January 1st, 2025

    // Country emissions data (percentage of global emissions)
    const countryEmissionsData = {
        china: {
            percentage: 32.88,
            info: '32.88% of global emissions'
        },
        us: {
            percentage: 12.60,
            info: '12.60% of global emissions'
        },
        india: {
            percentage: 7.02,
            info: '7.02% of global emissions'
        },
        russia: {
            percentage: 4.71,
            info: '4.71% of global emissions'
        },
        japan: {
            percentage: 2.99,
            info: '2.99% of global emissions'
        },
        germany: {
            percentage: 1.85,
            info: '1.85% of global emissions'
        },
        iran: {
            percentage: 1.83,
            info: '1.83% of global emissions'
        },
        skorea: {
            percentage: 1.80,
            info: '1.80% of global emissions'
        },
        saudi: {
            percentage: 1.70,
            info: '1.70% of global emissions'
        },
        indonesia: {
            percentage: 1.65,
            info: '1.65% of global emissions'
        }
    };

    // Get counter elements
    const totalEmissionsElement = document.getElementById('totalEmissions');
    const yearlyEmissionsElement = document.getElementById('yearlyEmissions');
    const timeAgoElement = document.getElementById('timeAgo');
    const countryEmissionsElement = document.getElementById('countryEmissions');
    const countryInfoElement = document.getElementById('countryInfo');
    const countrySelect = document.getElementById('countrySelect');
    
    // Get chart elements
    const countryChartCanvas = document.querySelector('#countryChart canvas');
    const productChartCanvas = document.querySelector('#productChart canvas');
    const prevButton = document.getElementById('prevChart');
    const nextButton = document.getElementById('nextButton');

    let lastFrameTime = 0;
    let startTime;
    let accumulatedTime = 0;
    let currentChartIndex = 0;

    function formatNumber(num) {
        // Round to the nearest integer
        num = Math.round(num);
        
        if (num >= 1000000) {
            // For numbers >= 1 million, format with commas
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            // For smaller numbers, just return the integer
            return num.toString();
        }
    }

    function formatNumberWithAnimation(element, value) {
        const currentValue = parseFloat(element.textContent.replace(/,/g, '')) || 0;
        const diff = value - currentValue;
        const step = diff / (FPS / 4); // Smooth transition over 1/4 second
        
        element.textContent = formatNumber(currentValue + step);
    }

    // Special formatting for carbon budget (keeping one decimal place)
    function formatBudgetNumber(num) {
        return Math.round(num * 10) / 10;
    }

    function updateEmissions() {
        const currentTime = performance.now();
        const elapsedSeconds = (currentTime - startTime) / 1000;
        const totalEmissions = EMISSIONS_PER_SECOND * elapsedSeconds;
        
        // Update total emissions since page load
        formatNumberWithAnimation(totalEmissionsElement, totalEmissions);
        
        // Calculate and update yearly emissions
        const yearStart = new Date(2025, 0, 1);
        const yearlyElapsedSeconds = (Date.now() - yearStart) / 1000;
        const yearlyEmissions = EMISSIONS_PER_SECOND * yearlyElapsedSeconds;
        formatNumberWithAnimation(yearlyEmissionsElement, yearlyEmissions);
        
        // Update country emissions
        const selectedCountry = countrySelect.value;
        const countryData = countryEmissionsData[selectedCountry];
        const countryEmissions = (totalEmissions * countryData.percentage) / 100;
        
        formatNumberWithAnimation(countryEmissionsElement, countryEmissions);
        countryInfoElement.textContent = `${countryData.percentage}% of global emissions`;
    }

    function updateTimeAgo() {
        const currentTime = new Date();
        const pageLoadSecondsElapsed = (currentTime - pageLoadTime) / 1000;
        const seconds = Math.floor(pageLoadSecondsElapsed);
        const text = seconds === 1 ? 'second' : 'seconds';
        timeAgoElement.textContent = `${seconds} ${text} ago`;
    }

    // Carbon Budget Counter Logic
    function updateCarbonBudgetCounter() {
        const now = performance.now();
        const startDate = new Date('2024-01-01').getTime();
        const endDate = new Date('2029-01-01').getTime();
        const elapsedTime = Date.now() - startDate;
        const totalTimespan = endDate - startDate;
        const elapsedPercentage = (elapsedTime / totalTimespan) * 100;
        
        // Calculate remaining budget with high precision
        const emissionsPerMs = EMISSIONS_PER_YEAR / (365 * 24 * 60 * 60 * 1000);
        const emittedSoFar = elapsedTime * emissionsPerMs;
        const remainingBudget = Math.max(0, CARBON_BUDGET_START - emittedSoFar);
        
        // Calculate percentage used
        const percentageUsed = ((CARBON_BUDGET_START - remainingBudget) / CARBON_BUDGET_START) * 100;
        
        // Update budget display
        const budgetElement = document.getElementById('carbon-budget-counter');
        budgetElement.textContent = formatBudgetNumber(remainingBudget);
        
        // Update progress bar and percentage
        const progressBar = document.getElementById('carbon-budget-progress');
        progressBar.style.width = `${percentageUsed}%`;
        document.getElementById('budget-percentage').textContent = `${Math.round(percentageUsed)}% used`;
        
        // Update years remaining
        const yearsRemaining = remainingBudget / EMISSIONS_PER_YEAR;
        document.getElementById('budget-years-remaining').textContent = Math.max(0, Math.round(yearsRemaining * 10) / 10);
    }

    // Update all counters with precise timing
    function updateCounters(currentTime) {
        if (!lastFrameTime) lastFrameTime = currentTime;
        
        const deltaTime = currentTime - lastFrameTime;
        accumulatedTime += deltaTime;
        
        // Update at fixed time steps for smooth animation
        while (accumulatedTime >= FRAME_INTERVAL) {
            updateEmissions();
            updateTimeAgo();
            updateCarbonBudgetCounter();
            accumulatedTime -= FRAME_INTERVAL;
        }
        
        lastFrameTime = currentTime;
        requestAnimationFrame(updateCounters);
    }

    // Initialize everything when the page loads
    startTime = performance.now();
    lastFrameTime = startTime;
    
    // Initial update
    updateEmissions();
    updateTimeAgo();
    updateCarbonBudgetCounter();
    
    // Start the animation loop
    requestAnimationFrame(updateCounters);

    // Handle country selection change
    countrySelect.addEventListener('change', function() {
        const selectedCountry = this.value;
        const countryData = countryEmissionsData[selectedCountry];
        countryInfoElement.textContent = countryData.info;
        updateEmissions();
    });

    // Initialize country info
    countryInfoElement.textContent = countryEmissionsData[countrySelect.value].info;

    // Chart Data and Configuration
    const countryData = {
        labels: ['China', 'United States', 'India', 'Russia', 'Japan', 'Germany', 'Iran', 'South Korea', 'Saudi Arabia', 'Indonesia'],
        datasets: [{
            label: 'Percentage of Global Emissions',
            data: [32.88, 12.60, 7.02, 4.71, 2.99, 1.85, 1.83, 1.80, 1.70, 1.65],
            backgroundColor: [
                'rgba(74, 226, 144, 0.8)',
                'rgba(74, 226, 144, 0.7)',
                'rgba(74, 226, 144, 0.6)',
                'rgba(74, 226, 144, 0.5)',
                'rgba(74, 226, 144, 0.4)',
                'rgba(74, 226, 144, 0.35)',
                'rgba(74, 226, 144, 0.3)',
                'rgba(74, 226, 144, 0.25)',
                'rgba(74, 226, 144, 0.2)',
                'rgba(74, 226, 144, 0.15)'
            ],
            borderColor: 'rgba(74, 226, 144, 1)',
            borderWidth: 1
        }]
    };

    const productData = {
        labels: ['Energy', 'Industry', 'Transport', 'Buildings', 'Agriculture', 'Other'],
        datasets: [{
            label: 'CO₂ Emissions by Sector',
            data: [31.5, 24.2, 14.9, 8.4, 11.8, 9.2],
            backgroundColor: [
                'rgba(74, 226, 144, 0.8)',
                'rgba(74, 226, 144, 0.7)',
                'rgba(74, 226, 144, 0.6)',
                'rgba(74, 226, 144, 0.5)',
                'rgba(74, 226, 144, 0.4)',
                'rgba(74, 226, 144, 0.3)'
            ],
            borderColor: 'rgba(74, 226, 144, 1)',
            borderWidth: 1
        }]
    };

    const chartConfig = {
        type: 'bar',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    };

    // Create charts
    const countryChart = new Chart(countryChartCanvas, {
        ...chartConfig,
        data: countryData
    });

    const productChart = new Chart(productChartCanvas, {
        ...chartConfig,
        data: productData
    });

    // Chart navigation
    let charts = [countryChartCanvas.parentElement, productChartCanvas.parentElement];
    
    function updateChartVisibility() {
        charts.forEach((chart, index) => {
            if (index === currentChartIndex) {
                chart.style.display = 'block';
            } else {
                chart.style.display = 'none';
            }
        });
    }

    function showChart(index) {
        currentChartIndex = index;
        updateChartVisibility();
    }

    // Initialize first chart
    showChart(0);

    // Add event listeners for chart navigation
    if (prevButton && nextButton) {
        prevButton.addEventListener('click', () => {
            if (currentChartIndex > 0) {
                currentChartIndex--;
                updateChartVisibility();
            }
        });

        nextButton.addEventListener('click', () => {
            if (currentChartIndex < charts.length - 1) {
                currentChartIndex++;
                updateChartVisibility();
            }
        });
    }

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
