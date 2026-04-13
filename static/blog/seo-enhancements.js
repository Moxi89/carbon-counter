// SEO Enhancement Script for Blog Articles
// This script adds internal linking and SEO improvements dynamically

document.addEventListener('DOMContentLoaded', function() {
    // Wait for images to load before modifying content
    const featuredImages = document.querySelectorAll('.featured-image img');
    let imagesLoaded = 0;
    
    if (featuredImages.length === 0) {
        // No images to wait for, proceed immediately
        addInternalLinks();
    } else {
        featuredImages.forEach(img => {
            if (img.complete) {
                imagesLoaded++;
                if (imagesLoaded === featuredImages.length) {
                    addInternalLinks();
                }
            } else {
                img.addEventListener('load', () => {
                    imagesLoaded++;
                    if (imagesLoaded === featuredImages.length) {
                        addInternalLinks();
                    }
                });
                img.addEventListener('error', () => {
                    imagesLoaded++;
                    if (imagesLoaded === featuredImages.length) {
                        addInternalLinks();
                    }
                });
            }
        });
    }
    
    function addInternalLinks() {
        // Add internal links to key terms in articles
        const internalLinks = {
            'carbon budget': '/blog/posts/critical-climate-year-2025.html',
            '1.5°C target': '/blog/posts/critical-climate-year-2025.html',
            'emissions': '/',
            'carbon counter': '/',
            'electric vehicles': '/blog/posts/transportation-climate-guide.html',
            'plant-based': '/blog/posts/food-climate-solutions.html',
            'food waste': '/blog/posts/food-climate-solutions.html',
            'climate adaptation': '/blog/posts/beyond-2025-next-decade-climate.html',
            'direct air capture': '/blog/posts/climate-tech-innovations-2026.html'
        };

        // Find article content (exclude header with images)
        const articleContent = document.querySelector('.post-body');
        if (!articleContent) return;

        // Add internal links to key terms
        let contentHTML = articleContent.innerHTML;
        
        Object.keys(internalLinks).forEach(term => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            contentHTML = contentHTML.replace(regex, (match) => {
                return `<a href="${internalLinks[term]}" class="internal-link" title="Learn more about ${term}">${match}</a>`;
            });
        });

        // Only update if content actually changed
        if (contentHTML !== articleContent.innerHTML) {
            articleContent.innerHTML = contentHTML;
        }
    }

    // Add FAQ schema for enhanced SEO
    const faqSection = document.querySelector('.faq-section');
    if (faqSection) {
        const faqSchema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": []
        };

        const faqItems = faqSection.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question h3');
            const answer = item.querySelector('.faq-answer p');
            
            if (question && answer) {
                faqSchema.mainEntity.push({
                    "@type": "Question",
                    "name": question.textContent.trim(),
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": answer.textContent.trim()
                    }
                });
            }
        });

        // Add FAQ schema to page
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(faqSchema);
        document.head.appendChild(script);
    }

    // Add breadcrumb schema
    const breadcrumbNav = document.querySelector('.breadcrumb');
    if (breadcrumbNav) {
        const breadcrumbLinks = breadcrumbNav.querySelectorAll('a');
        const breadcrumbList = [];
        
        breadcrumbLinks.forEach((link, index) => {
            breadcrumbList.push({
                "@type": "ListItem",
                "position": index + 1,
                "name": link.textContent.trim(),
                "item": link.href
            });
        });

        const breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbList
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(breadcrumbSchema);
        document.head.appendChild(script);
    }

    // Add reading time estimation
    const readingTime = document.querySelector('.reading-time');
    if (!readingTime) {
        const text = articleContent.textContent;
        const wordsPerMinute = 200;
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        
        const metaTag = document.createElement('meta');
        metaTag.name = 'article:reading_time';
        metaTag.content = `${minutes} minutes`;
        document.head.appendChild(metaTag);
    }

    // Add author schema
    const authorSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Carbon Counter Team",
        "url": "https://www.carbonemissionscounter.com",
        "logo": {
            "@type": "ImageObject",
            "url": "https://www.carbonemissionscounter.com/images/logo.svg"
        }
    };

    const authorScript = document.createElement('script');
    authorScript.type = 'application/ld+json';
    authorScript.textContent = JSON.stringify(authorSchema);
    document.head.appendChild(authorScript);
});

// Add styles for internal links
const internalLinkStyles = `
    .internal-link {
        color: #4ae290;
        text-decoration: underline;
        text-decoration-style: dotted;
        transition: all 0.3s ease;
    }
    
    .internal-link:hover {
        color: #52b788;
        text-decoration-style: solid;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = internalLinkStyles;
document.head.appendChild(styleSheet);
