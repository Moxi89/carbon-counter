// Shared card interaction functions
function initializeCardAnimations(cards) {
    cards.forEach((card, index) => {
        // Initial state
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        // Stagger animation in
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
        
        // Hover interactions
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
            const image = card.querySelector('.card-image');
            if (image) image.style.transform = 'scale(1.05)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
            const image = card.querySelector('.card-image');
            if (image) image.style.transform = 'scale(1)';
        });
        
        // Click animation
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('read-more')) return;
            const ripple = document.createElement('div');
            ripple.classList.add('ripple');
            card.appendChild(ripple);
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            setTimeout(() => ripple.remove(), 1000);
        });
    });
}
