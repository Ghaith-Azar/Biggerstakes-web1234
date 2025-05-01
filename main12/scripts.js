document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault();
    alert('Form submitted!');
});


const features = document.querySelectorAll('.feature');

features.forEach(feature => {
    feature.addEventListener('mouseenter', () => {
        feature.classList.add('active');
    });

    feature.addEventListener('mouseleave', () => {
        feature.classList.remove('active');
    });
});



document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');

    menuToggle.addEventListener('click', function () {
        menu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
});





























// COPY CODE IN CARDS
function copyCode(button) {
    const card = button.closest('.site-card');
    const codeElement = card.querySelector('.code');
    const codeText = codeElement.innerText.trim();
    
    navigator.clipboard.writeText(codeText).then(() => {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.innerHTML = `
            Code copied successfully!
            <div class="progress-bar"></div>
        `;
        
        // Add to container
        const container = document.querySelector('.notification-container');
        container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'));
        
        // Remove after animation
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Button feedback
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = 'Copy Code';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}