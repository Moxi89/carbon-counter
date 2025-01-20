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

    function showAllArticles() {
        articles.forEach(article => {
            article.style.display = 'block';
            article.style.opacity = '1';
            article.style.transform = 'translateY(0)';
        });
    }

    function filterArticles(category) {
        console.log('Filtering for category:', {
            category,
            categoryTrimmed: category.trim(),
            length: category.length
        });
        
        articles.forEach(article => {
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
                }, 50);
            } else {
                article.style.opacity = '0';
                article.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    article.style.display = 'none';
                }, 300);
            }
        });
    }

    // Add click handlers to filter buttons
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

    // Initialize with 'all' category
    filterArticles('all');
});
