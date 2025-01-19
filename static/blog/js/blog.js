document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const articles = document.querySelectorAll('.article-card');
    const featuredArticle = document.querySelector('.featured-article');

    // Debug: Log all articles and their categories
    console.log('All articles:', Array.from(articles).map(article => ({
        title: article.querySelector('h3')?.textContent,
        category: article.getAttribute('data-category'),
        rawCategory: article.getAttribute('data-category').trim(),
        rawElement: article
    })));

    function showAllArticles() {
        articles.forEach(article => {
            article.style.display = 'block';
            article.style.opacity = '1';
        });
        if (featuredArticle) {
            featuredArticle.style.display = 'block';
            featuredArticle.style.opacity = '1';
        }
    }

    function filterArticles(category) {
        console.log('Filtering for category:', {
            category,
            categoryTrimmed: category.trim(),
            length: category.length
        });
        
        const allArticles = [featuredArticle, ...articles];
        allArticles.forEach(article => {
            if (!article) return;
            
            const articleCategory = article.getAttribute('data-category');
            const title = article.querySelector('h3')?.textContent || article.querySelector('h2')?.textContent;
            
            const shouldShow = category === 'All' || articleCategory === category;
            
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
                setTimeout(() => article.style.opacity = '1', 10);
            } else {
                article.style.opacity = '0';
                setTimeout(() => article.style.display = 'none', 300);
            }
        });
    }

    // Add click handlers to filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            console.log('Filter button clicked:', {
                category,
                categoryTrimmed: category.trim(),
                length: category.length
            });
            
            // Update active button
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');

            // Filter articles
            if (category === 'All') {
                showAllArticles();
            } else {
                filterArticles(category);
            }
        });
    });

    // Show all articles initially
    showAllArticles();
});
