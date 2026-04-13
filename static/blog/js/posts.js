// Blog post data with metadata for navigation and recommendations
const blogPosts = [
    {
        id: 'track-home-energy',
        title: 'Track Your Home\'s Energy: Simple Steps That Work',
        category: 'smart-tech',
        date: '2025-01-19',
        path: '/blog/posts/track-home-energy.html',
        image: '/blog/images/track-energy.svg',
        description: 'Learn how to monitor and understand your home\'s energy usage with these easy-to-follow techniques.'
    },
    {
        id: 'save-energy-at-home',
        title: '5 Ways to Save Energy at Home',
        category: 'guides',
        date: '2025-01-18',
        path: '/blog/posts/save-energy-at-home.html',
        image: '/blog/images/save-energy-home.svg',
        description: 'Simple, effective ways to reduce your home\'s energy consumption and lower your carbon footprint.'
    },
    {
        id: 'family-eco-activities',
        title: 'Fun Family Activities for a Greener Home',
        category: 'sustainability',
        date: '2025-01-18',
        path: '/blog/posts/family-eco-activities.html',
        image: '/blog/images/family-eco-activities.svg',
        description: 'Engage the whole family in eco-friendly activities that make a real difference.'
    },
    {
        id: 'five-minute-carbon-hacks',
        title: '5-Minute Carbon Reduction Hacks',
        category: 'guides',
        date: '2025-01-17',
        path: '/blog/posts/five-minute-carbon-hacks.html',
        image: '/blog/images/quick-wins.svg',
        description: 'Quick and effective ways to reduce your carbon footprint in just minutes a day.'
    }
];

document.addEventListener('DOMContentLoaded', function() {
    // Get current post ID from URL
    const currentPath = window.location.pathname;
    const currentPostIndex = blogPosts.findIndex(post => post.path === currentPath);
    
    if (currentPostIndex === -1) return;
    
    // Setup post navigation
    const postNav = document.querySelector('.post-navigation');
    if (postNav) {
        postNav.innerHTML = ''; // Clear any existing navigation
        
        // Previous post (newer post)
        if (currentPostIndex < blogPosts.length - 1) {
            const prevPost = blogPosts[currentPostIndex + 1];
            const prevLink = document.createElement('a');
            prevLink.href = prevPost.path;
            prevLink.className = 'prev-post';
            prevLink.innerHTML = `← Previous: ${prevPost.title}`;
            postNav.appendChild(prevLink);
        }
        
        // Next post (older post)
        if (currentPostIndex > 0) {
            const nextPost = blogPosts[currentPostIndex - 1];
            const nextLink = document.createElement('a');
            nextLink.href = nextPost.path;
            nextLink.className = 'next-post';
            nextLink.innerHTML = `Next: ${nextPost.title} →`;
            postNav.appendChild(nextLink);
        }
    }
});
