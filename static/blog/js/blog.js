document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const articles = document.querySelectorAll('.blog-card');
    
    // Debug: Log all articles and their categories
    console.log('All articles:', Array.from(articles).map(article => ({
        title: article.querySelector('h3')?.textContent,
        category: article.dataset.category,
        rawCategory: article.dataset.category.trim(),
        rawElement: article
    })));

    // Initialize cards with stagger effect
    articles.forEach((article, index) => {
        article.style.opacity = '0';
        article.style.transform = 'translateY(20px)';
        setTimeout(() => {
            article.style.opacity = '1';
            article.style.transform = 'translateY(0)';
        }, index * 100);
        
        // Add hover interactions
        article.addEventListener('mouseenter', () => {
            article.style.transform = 'translateY(-8px) scale(1.02)';
            const image = article.querySelector('.card-image');
            if (image) image.style.transform = 'scale(1.05)';
        });
        
        article.addEventListener('mouseleave', () => {
            article.style.transform = 'translateY(0) scale(1)';
            const image = article.querySelector('.card-image');
            if (image) image.style.transform = 'scale(1)';
        });
        
        // Add click animation
        article.addEventListener('click', (e) => {
            if (e.target.classList.contains('read-more')) return;
            const ripple = document.createElement('div');
            ripple.classList.add('ripple');
            article.appendChild(ripple);
            
            const rect = article.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            setTimeout(() => ripple.remove(), 1000);
        });
    });

    function showAllArticles() {
        articles.forEach((article, index) => {
            article.style.display = 'block';
            setTimeout(() => {
                article.style.opacity = '1';
                article.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    function filterArticles(category) {
        console.log('Filtering for category:', {
            category,
            categoryTrimmed: category.trim(),
            length: category.length
        });
        
        articles.forEach((article, index) => {
            const articleCategory = article.dataset.category;
            const title = article.querySelector('h3')?.textContent;
            
            const shouldShow = category === 'all' || articleCategory === category;
            
            console.log('Article:', {
                title,
                articleCategory,
                articleCategoryTrimmed: articleCategory.trim(),
                categoryLength: articleCategory.length,
                shouldShow,
                comparison: {
                    exact: articleCategory === category,
                    trimmed: articleCategory.trim() === category.trim()
                }
            });
            
            if (shouldShow) {
                article.style.display = 'block';
                setTimeout(() => {
                    article.style.opacity = '1';
                    article.style.transform = 'translateY(0)';
                }, index * 100);
            } else {
                article.style.opacity = '0';
                article.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    article.style.display = 'none';
                }, 300);
            }
        });
    }

    // Add click handlers to filter buttons with animation
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });
            // Add active class to clicked button
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');
            
            // Add click feedback animation
            const circle = document.createElement('div');
            circle.classList.add('click-circle');
            button.appendChild(circle);
            setTimeout(() => circle.remove(), 400);
            
            const category = button.dataset.category;
            console.log('Filter button clicked:', {
                category,
                categoryTrimmed: category.trim(),
                length: category.length
            });
            
            if (category === 'all') {
                showAllArticles();
            } else {
                filterArticles(category);
            }
        });
    });

    // Initialize Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    articles.forEach(article => observer.observe(article));
    
    // Initialize with 'all' category
    filterArticles('all');
});
