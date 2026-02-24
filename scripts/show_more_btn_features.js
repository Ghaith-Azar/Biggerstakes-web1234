(function () {
    const INITIAL_COUNT = 6;
    const INCREMENT = 10;
    let currentVisible = INITIAL_COUNT;

    // On DOM load, hide cards beyond the initial count
    function initShowMore() {
        const siteList = document.querySelector('.site-list');
        if (!siteList) return;
        const cards = siteList.querySelectorAll(':scope > .site-card');

        cards.forEach(function (card, index) {
            if (index >= INITIAL_COUNT) {
                card.classList.add('hidden-card');
            }
        });

        // Hide button if total cards <= initial count
        const btn = document.getElementById('showMoreBtn');
        if (cards.length <= INITIAL_COUNT && btn) {
            btn.style.display = 'none';
        }
    }

    window.toggleSiteCards = function () {
        const siteList = document.querySelector('.site-list');
        if (!siteList) return;
        const cards = siteList.querySelectorAll(':scope > .site-card');
        const btn = document.getElementById('showMoreBtn');
        const textEl = document.getElementById('showMoreText');

        const isShowingLess = btn.classList.contains('expanded');

        if (isShowingLess) {
            // Reset to initial count
            cards.forEach(function (card, index) {
                if (index >= INITIAL_COUNT) {
                    card.classList.remove('show-card');
                }
            });
            currentVisible = INITIAL_COUNT;
            textEl.textContent = 'Show More';
            btn.classList.remove('expanded');
            document.getElementById('feature-section-whole').scrollIntoView({ behavior: 'smooth' });
        } else {
            // Show next increment
            let newlyShown = 0;
            for (let i = currentVisible; i < currentVisible + INCREMENT && i < cards.length; i++) {
                cards[i].classList.add('show-card');
                newlyShown++;
            }
            currentVisible += newlyShown;

            // Check if all are shown
            if (currentVisible >= cards.length) {
                textEl.textContent = 'Show Less';
                btn.classList.add('expanded');
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initShowMore);
    } else {
        initShowMore();
    }
})();