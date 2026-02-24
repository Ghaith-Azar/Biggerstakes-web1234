document.addEventListener('DOMContentLoaded', function () {
    const leaderboardSection = document.getElementById('leaderboard-data');
    if (!leaderboardSection) return;

    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Load and render leaderboard
    const renderLeaderboard = (data) => {
        const podiumContainer = document.querySelector('.podium');
        const listContainer = document.querySelector('.leaderboard-list-items');
        const statusDate = document.querySelector('.status-date');
        const statusLabel = document.querySelector('.status-label');

        if (!podiumContainer || !listContainer) return;

        // Clear existing content
        podiumContainer.innerHTML = '';
        listContainer.innerHTML = '';

        // Update status
        statusDate.textContent = data.date;
        statusLabel.textContent = data.status;

        // Start Countdown
        if (data.countdownEnd && data.status !== "LEADERBOARD ENDED") {
            startCountdown(data.countdownEnd);
        } else {
            const countdownEl = document.getElementById('leaderboard-countdown');
            if (countdownEl) countdownEl.innerHTML = '';
        }

        const users = data.users;

        // Render Top 3 (Podium)
        const top3 = users.slice(0, 3);
        top3.forEach(user => {
            const card = document.createElement('div');
            card.className = `podium-card rank-${user.place}`;

            // Map site names to logos (placeholder logic)
            let logoSrc = 'icons and images/gambling websites logos/stake top picks.png';
            if (user.logo) {
                logoSrc = user.logo;
            } else if (user.site && user.site.toLowerCase() === 'stake') {
                logoSrc = 'icons and images/gambling websites logos/stake top picks.png';
            } else if (user.site && user.site.toLowerCase() === 'duel') {
                logoSrc = 'icons and images/gambling websites logos/duel logo.png';
            }

            card.innerHTML = `
                <div class="podium-rank-circle">
                    <img src="${logoSrc}" alt="${user.site}" class="podium-logo">
                    <div class="rank-badge">${user.place}</div>
                </div>
                <div class="podium-site">${user.site || ''}</div>
                <div class="podium-username">${user.username}</div>
                <div class="podium-wagered">
                    <span class="podium-amount">${formatCurrency(user.wagered)}</span>
                    <span class="podium-label">Wagered</span>
                </div>
                <div class="podium-prize">
                    <i class="fas fa-trophy"></i> ${formatCurrency(user.prize)}
                </div>
            `;
            podiumContainer.appendChild(card);
        });

        // Render others (Rank 4+)
        const others = users.slice(3);
        others.forEach(user => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="item-place">${user.place}</div>
                <div class="item-username">${user.username} <div style="font-size: 12px; color: #888; text-transform: uppercase;">${user.site || ''}</div></div>
                <div class="item-wagered">${formatCurrency(user.wagered)}</div>
                <div class="item-prize">
                    <i class="fas fa-trophy"></i> ${formatCurrency(user.prize)}
                </div>
            `;
            listContainer.appendChild(item);
        });
    };

    let countdownInterval;
    const startCountdown = (endTime) => {
        const countdownEl = document.getElementById('leaderboard-countdown');
        if (!countdownEl) return;

        if (countdownInterval) clearInterval(countdownInterval);

        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = new Date(endTime).getTime() - now;

            if (distance < 0) {
                clearInterval(countdownInterval);
                countdownEl.innerHTML = '<div class="status-label">LEADERBOARD ENDED</div>';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            countdownEl.innerHTML = `
                <div class="countdown-unit">
                    <span class="countdown-value">${days}</span>
                    <span class="countdown-label">Days</span>
                </div>
                <div class="countdown-unit">
                    <span class="countdown-value">${hours}</span>
                    <span class="countdown-label">Hours</span>
                </div>
                <div class="countdown-unit">
                    <span class="countdown-value">${minutes}</span>
                    <span class="countdown-label">Min</span>
                </div>
                <div class="countdown-unit">
                    <span class="countdown-value">${seconds}</span>
                    <span class="countdown-label">Sec</span>
                </div>
            `;
        };

        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    };

    let currentData = null;
    let historyData = [];
    const historySelect = document.getElementById('leaderboard-history-select');

    const loadHistory = () => {
        fetch('data/leaderboard-history.json')
            .then(res => res.json())
            .then(data => {
                historyData = data;
                if (historySelect) {
                    historyData.forEach((entry, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = entry.date;
                        historySelect.appendChild(option);
                    });
                }
            })
            .catch(err => console.error('Error loading history:', err));
    };

    if (historySelect) {
        historySelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'current') {
                renderLeaderboard(currentData);
            } else {
                renderLeaderboard(historyData[parseInt(val)]);
            }
        });
    }

    // Try to load from localStorage first (for admin page updates)
    const localData = localStorage.getItem('leaderboardData');
    if (localData) {
        try {
            currentData = JSON.parse(localData);
            renderLeaderboard(currentData);
        } catch (e) {
            console.error('Failed to parse local leaderboard data', e);
        }
    } else {
        // Fallback to JSON file
        fetch('data/leaderboard.json')
            .then(response => response.json())
            .then(data => {
                currentData = data;
                renderLeaderboard(data);
                // Save to local storage as initial cache
                localStorage.setItem('leaderboardData', JSON.stringify(data));
            })
            .catch(error => console.error('Error fetching leaderboard:', error));
    }

    loadHistory();
});
