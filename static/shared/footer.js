document.addEventListener('DOMContentLoaded', function() {
    // Load footer content
    fetch('/shared/footer.html?v=2026-10')
        .then(response => response.text())
        .then(data => {
            const footerPlaceholder = document.getElementById('footer-placeholder');
            if (footerPlaceholder) {
                footerPlaceholder.innerHTML = data;
                footerPlaceholder.querySelectorAll('.footer-year').forEach(el => {
                    el.textContent = new Date().getFullYear();
                });
            }
        })
        .catch(error => {
            console.error('Error loading footer:', error);
        });
});
