document.addEventListener('DOMContentLoaded', () => {
    // Load navbar and footer
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');
    
    // Function to load HTML content
    async function loadHTML(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Error loading ${url}:`, error);
            return null;
        }
    }

    // Load navbar and footer
    Promise.all([
        loadHTML('/shared/navbar.html'),
        loadHTML('/shared/footer.html')
    ]).then(([navbarHTML, footerHTML]) => {
        if (navbarHTML && navbarPlaceholder) {
            navbarPlaceholder.innerHTML = navbarHTML;
        }
        if (footerHTML && footerPlaceholder) {
            footerPlaceholder.innerHTML = footerHTML;
        }

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

        // Initialize scroll behavior
        let lastY = window.scrollY;
        const navbar = document.querySelector('.nav-container');
        const threshold = 50;
        let isNavVisible = true;

        function onScroll() {
            const currentY = window.scrollY;
            handleNavVisibility(lastY, currentY);
            lastY = currentY;
        }

        function handleNavVisibility(lastY, currentY) {
            if (!navbar) return;

            // Show navbar when scrolling up or near top
            if (currentY < threshold || currentY < lastY) {
                if (!isNavVisible) {
                    navbar.style.transform = 'translateY(0)';
                    isNavVisible = true;
                }
            } 
            // Hide navbar when scrolling down
            else if (currentY > lastY && currentY > threshold) {
                if (isNavVisible) {
                    navbar.style.transform = 'translateY(-100%)';
                    isNavVisible = false;
                }
            }

            // Add/remove shadow based on scroll position
            if (currentY > 0) {
                navbar.classList.add('nav-shadow');
            } else {
                navbar.classList.remove('nav-shadow');
            }
        }

        // Add scroll listener with passive flag for better performance
        window.addEventListener('scroll', onScroll, { passive: true });

        // Initialize nav state
        onScroll();
    }).catch(error => {
        console.error('Error loading navigation components:', error);
    });
});
