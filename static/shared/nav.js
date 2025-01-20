document.addEventListener('DOMContentLoaded', () => {
    // Load navbar and footer
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');
    
    // Function to load HTML content
    async function loadHTML(url) {
        try {
            const response = await fetch(url);
            return await response.text();
        } catch (error) {
            console.error('Error loading HTML:', error);
            return '';
        }
    }

    // Load navbar and footer
    Promise.all([
        loadHTML('/shared/navbar.html'),
        loadHTML('/shared/footer.html')
    ]).then(([navbarHTML, footerHTML]) => {
        if (navbarPlaceholder) navbarPlaceholder.innerHTML = navbarHTML;
        if (footerPlaceholder) footerPlaceholder.innerHTML = footerHTML;
        
        // Get current path
        const currentPath = window.location.pathname;

        // Add active class to current page link
        if (currentPath.includes('/blog')) {
            const blogLink = document.querySelector('a[href="/blog"]');
            if (blogLink) blogLink.classList.add('active');
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
                    const sectionId = entry.target.id;
                    const navLink = document.querySelector(`a[href="/#${sectionId}"]`);

                    if (navLink && entry.isIntersecting) {
                        navLinks.forEach(link => link.classList.remove('active'));
                        navLink.classList.add('active');
                    }
                });
            }, { threshold: 0.2 });

            // Observe each section
            Object.values(sections).forEach(section => {
                if (section) observer.observe(section);
            });
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
});
