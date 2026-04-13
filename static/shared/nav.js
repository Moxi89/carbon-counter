document.addEventListener('DOMContentLoaded', () => {
    // Load navbar HTML
    fetch('/shared/navbar.html')
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
        
        // Set active link based on current section
        function setActiveLink() {
            const sections = document.querySelectorAll('section[id]');
            const scrollPosition = window.scrollY + 100;
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href').includes(sectionId)) {
                            link.classList.add('active');
                        }
                    });
                }
            });
            
            // Handle home link
            if (scrollPosition < 100) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '/') {
                        link.classList.add('active');
                    }
                });
            }
        }
        
        // Set active link on page load
        setActiveLink();
        
        // Update active link on scroll
        window.addEventListener('scroll', setActiveLink);
        
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
