document.addEventListener('DOMContentLoaded', () => {
    // Basic interaction for job cards
    const cards = document.querySelectorAll('.job-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = 'var(--turf-green)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.borderColor = 'var(--border-color)';
        });
    });

    // Mock date switching
    const chevronLeft = document.querySelector('.fa-chevron-left');
    const chevronRight = document.querySelector('.fa-chevron-right');
    const dateSpan = document.querySelector('.date-selector span');

    let currentDate = new Date('2025-02-05');

    const updateDateDisplay = () => {
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        dateSpan.textContent = currentDate.toLocaleDateString('en-US', options);
    };

    chevronLeft.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateDisplay();
    });

    chevronRight.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateDisplay();
    });

    // Button hover effects
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.filter = 'brightness(1.1)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.filter = 'brightness(1)';
        });
    });
});
