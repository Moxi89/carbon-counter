document.addEventListener('DOMContentLoaded', () => {
    // Load navbar HTML
    fetch('/shared/navbar.html?v=2026-10b')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar-placeholder').innerHTML = data;
            initializeNavbar();
        });

    function initializeNavbar() {
        // Elements
        const navbar = document.querySelector('.nav-container');
        const navLinks = document.querySelectorAll('.nav-link');
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navItems = document.querySelector('.nav-items');
        
        // Variables
        let lastScroll = 0;
        const scrollThreshold = 100;
        
        // Mobile menu toggle
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
                mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
                navItems.classList.toggle('active');
                
                // Prevent body scroll when menu is open
                document.body.style.overflow = isExpanded ? 'auto' : 'hidden';
            });
        }
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navbar && !navbar.contains(e.target) && navItems.classList.contains('active')) {
                navItems.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = 'auto';
            }
        });
        
        // Close mobile menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navItems.classList.contains('active')) {
                    navItems.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = 'auto';
                }
            });
        });
        
        // Handle scroll behavior
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            // Add/remove scrolled class
            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            // Hide/show navbar on scroll
            if (currentScroll > lastScroll && currentScroll > scrollThreshold) {
                navbar.classList.add('hidden');
            } else {
                navbar.classList.remove('hidden');
            }
            
            lastScroll = currentScroll;
        });
        
        // Highlight the current page; on the home page, follow the section in view
        const path = window.location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
        const isHome = path === '/' || path === '';
        const pageLink = (() => {
            if (path.indexOf('/blog/posts/carbon-footprint-calculator-guide') === 0) return '/blog/posts/carbon-footprint-calculator-guide';
            if (path.indexOf('/blog') === 0) return '/blog';
            if (path.indexOf('/co2-emissions') === 0 || path.indexOf('/historical-co2') === 0) return '/co2-emissions-by-country';
            return null;
        })();

        function mark(href) {
            navLinks.forEach(link => {
                const on = link.getAttribute('href') === href;
                link.classList.toggle('active', on);
                if (on && !isHome) link.setAttribute('aria-current', 'page');
                else link.removeAttribute('aria-current');
            });
        }

        function setActiveLink() {
            if (!isHome) return;
            const y = window.scrollY + 120;
            let current = '/';
            ['faq-section', 'about-section'].forEach(id => {
                const s = document.getElementById(id);
                if (s && y >= s.offsetTop && y < s.offsetTop + s.offsetHeight) current = '/#' + id;
            });
            mark(current);
        }

        if (isHome) {
            setActiveLink();
            window.addEventListener('scroll', setActiveLink, { passive: true });
        } else if (pageLink) {
            mark(pageLink);
        }

        // Handle smooth scrolling for anchor links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                if (href.startsWith('/#')) {
                    const targetId = href.substring(2);
                    const targetElement = document.getElementById(targetId);
                    
                    // Check if we're on the home page and the target exists
                    if (targetElement && (window.location.pathname === '/' || window.location.pathname === '/index.html')) {
                        e.preventDefault();
                        targetElement.scrollIntoView({
                            behavior: 'smooth'
                        });
                        
                        // Update URL without jumping
                        history.pushState(null, '', href);
                    }
                    // If we're not on home page or target doesn't exist, let the default navigation work
                    // This will navigate to home page with the anchor
                }
            });
        });
    }
});
