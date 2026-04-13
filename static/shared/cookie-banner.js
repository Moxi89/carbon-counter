class CookieConsent {
    constructor() {
        this.cookieName = 'carbon_counter_cookie_consent';
        this.cookieBanner = document.getElementById('cookie-banner');
        this.acceptButton = document.getElementById('accept-cookies');
        this.declineButton = document.getElementById('decline-cookies');
        
        this.init();
    }
    
    init() {
        if (!this.hasUserConsent()) {
            this.showBanner();
        }
        
        this.acceptButton.addEventListener('click', () => this.acceptCookies());
        this.declineButton.addEventListener('click', () => this.declineCookies());
    }
    
    hasUserConsent() {
        return localStorage.getItem(this.cookieName) !== null;
    }
    
    showBanner() {
        // Wait a moment before showing the banner for better UX
        setTimeout(() => {
            this.cookieBanner.classList.add('show');
        }, 1000);
    }
    
    hideBanner() {
        this.cookieBanner.classList.add('hide');
        this.cookieBanner.classList.remove('show');
        
        // Remove banner from DOM after animation
        setTimeout(() => {
            this.cookieBanner.remove();
        }, 300);
    }
    
    acceptCookies() {
        localStorage.setItem(this.cookieName, 'accepted');
        this.hideBanner();
        this.initializeAnalytics();
    }
    
    declineCookies() {
        localStorage.setItem(this.cookieName, 'declined');
        this.hideBanner();
    }
    
    initializeAnalytics() {
        // Initialize analytics only if user has accepted cookies
        if (localStorage.getItem(this.cookieName) === 'accepted') {
            // Add your analytics initialization code here
            console.log('Analytics initialized');
        }
    }
}

// Load cookie banner
document.addEventListener('DOMContentLoaded', () => {
    fetch('/shared/cookie-banner.html')
        .then(response => response.text())
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            new CookieConsent();
        });
});
