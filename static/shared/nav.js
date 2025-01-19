document.addEventListener('DOMContentLoaded', () => {
    // Get current path
    const currentPath = window.location.pathname;

    // Fix relative paths based on current page location
    const navbar = document.querySelector('nav');
    const links = navbar.getElementsByTagName('a');
    
    // Determine if we're in a subdirectory
    const isInBlogPosts = currentPath.includes('/blog/posts/');
    const prefix = isInBlogPosts ? '../..' : '..';
    
    // Update links
    for (let link of links) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/static/')) {
            // Remove /static/ prefix and adjust path
            link.href = prefix + href.substring(7);
        } else if (href && href.startsWith('../')) {
            // Already relative, leave as is
            link.href = href;
        }
    }

    // Add active class to current page link
    if (currentPath.includes('/blog/')) {
        const blogLink = navbar.querySelector('a[href$="blog/index.html"]');
        if (blogLink) {
            blogLink.classList.add('active');
        }
    }

    // Find all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Only set up scroll observers if we're on the main page
    if (currentPath === '/' || currentPath.endsWith('index.html')) {
        // Get all sections that have corresponding nav links
        const sections = {
            'counter': document.querySelector('#counter-section'),
            'faq': document.querySelector('#faq-section'),
            'about': document.querySelector('#about-section')
        };

        // Create a single observer for all sections
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Find the corresponding nav link
                let sectionId = entry.target.id;
                let navLink;

                switch(sectionId) {
                    case 'counter-section':
                        navLink = document.querySelector('a[href="#global-emissions-card"]');
                        break;
                    case 'faq-section':
                        navLink = document.querySelector('a[href="#faq-section"]');
                        break;
                    case 'about-section':
                        navLink = document.querySelector('a[href="#about-section"]');
                        break;
                }

                if (navLink) {
                    if (entry.isIntersecting) {
                        // Remove active class from all nav links first
                        navLinks.forEach(link => link.classList.remove('active'));
                        // Add active class to current section
                        navLink.classList.add('active');
                    }
                }
            });
        }, { 
            threshold: 0.3, // Trigger when 30% of the section is visible
            rootMargin: '-20% 0px -20% 0px' // Adds a margin to when the observer triggers
        });

        // Observe each section
        Object.values(sections).forEach(section => {
            if (section) {
                observer.observe(section);
            }
        });

        // Set initial active state for counter section
        const counterLink = document.querySelector('a[href="#global-emissions-card"]');
        if (counterLink && sections.counter.getBoundingClientRect().top >= 0) {
            counterLink.classList.add('active');
        }
    }

    // Scroll-based navigation
    let lastScrollY = window.scrollY;
    let ticking = false;

    // Debounce scroll events for better performance
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleNavVisibility(lastScrollY, window.scrollY);
                lastScrollY = window.scrollY;
                ticking = false;
            });
            ticking = true;
        }
    }

    // Handle navbar visibility
    function handleNavVisibility(lastY, currentY) {
        const navbar = document.querySelector('.nav-container');
        const scrollingDown = currentY > lastY;
        const scrollAmount = Math.abs(currentY - lastY);
        const minScrollBeforeHide = 50; // Minimum scroll before hiding nav

        // Don't hide nav when near the top
        if (currentY < 100) {
            navbar.classList.remove('nav-hidden');
            navbar.classList.add('nav-visible');
            return;
        }

        // Only react to significant scroll amounts
        if (scrollAmount < minScrollBeforeHide) return;

        if (scrollingDown) {
            navbar.classList.add('nav-hidden');
            navbar.classList.remove('nav-visible');
        } else {
            navbar.classList.remove('nav-hidden');
            navbar.classList.add('nav-visible');
        }
    }

    // Add scroll listener
    window.addEventListener('scroll', onScroll, { passive: true });

    // Initialize nav state
    document.querySelector('.nav-container').classList.add('nav-visible');
});
