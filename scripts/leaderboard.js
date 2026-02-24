document.addEventListener('DOMContentLoaded', function () {
    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    class Leaderboard {
        constructor(config) {
            this.id = config.id;
            this.dataFile = config.dataFile;
            this.historyFile = config.historyFile;
            this.selectors = config.selectors;
            this.currentData = null;
            this.historyData = [];
            this.countdownInterval = null;

            this.init();
        }

        init() {
            this.loadHistory();
            this.loadCurrentData();
            this.setupHistoryListener();
        }

        loadCurrentData() {
            // Try localStorage first
            const localData = localStorage.getItem(`leaderboardData_${this.id}`);
            if (localData) {
                try {
                    this.currentData = JSON.parse(localData);
                    this.render(this.currentData);
                } catch (e) {
                    console.error(`Failed to parse local data for ${this.id}`, e);
                    this.fetchData();
                }
            } else {
                this.fetchData();
            }
        }

        fetchData() {
            fetch(this.dataFile)
                .then(res => res.json())
                .then(data => {
                    this.currentData = data;
                    this.render(data);
                    localStorage.setItem(`leaderboardData_${this.id}`, JSON.stringify(data));
                })
                .catch(err => console.error(`Error fetching ${this.id}:`, err));
        }

        loadHistory() {
            fetch(this.historyFile)
                .then(res => res.json())
                .then(data => {
                    this.historyData = data;
                    this.populateHistorySelect();
                })
                .catch(err => console.error(`Error loading history for ${this.id}:`, err));
        }

        populateHistorySelect() {
            const select = document.getElementById(this.selectors.historySelect);
            if (!select) return;

            this.historyData.forEach((entry, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = entry.date;
                select.appendChild(option);
            });
        }

        setupHistoryListener() {
            const select = document.getElementById(this.selectors.historySelect);
            if (!select) return;

            select.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val === 'current') {
                    this.render(this.currentData);
                } else {
                    this.render(this.historyData[parseInt(val)]);
                }
            });
        }

        render(data) {
            const podiumContainer = document.getElementById(this.selectors.podium);
            const listContainer = document.getElementById(this.selectors.list);
            const statusDate = document.getElementById(this.selectors.statusDate);
            const statusLabel = document.getElementById(this.selectors.statusLabel);

            if (!podiumContainer || !listContainer) return;

            podiumContainer.innerHTML = '';
            listContainer.innerHTML = '';

            if (statusDate) statusDate.textContent = data.date;
            if (statusLabel) statusLabel.textContent = data.status;

            // Handle Countdown
            const countdownEl = document.getElementById(this.selectors.countdown);
            if (countdownEl) {
                if (data.countdownEnd && data.status !== "LEADERBOARD ENDED") {
                    this.startCountdown(data.countdownEnd, countdownEl);
                } else {
                    clearInterval(this.countdownInterval);
                    countdownEl.innerHTML = '';
                }
            }

            // Render Top 3
            data.users.slice(0, 3).forEach(user => {
                const card = document.createElement('div');
                card.className = `podium-card rank-${user.place}`;

                let logoSrc = 'icons and images/gambling websites logos/stake top picks.png';
                if (user.logo) logoSrc = user.logo;
                else if (user.site?.toLowerCase() === 'stake') logoSrc = 'icons and images/gambling websites logos/stake top picks.png';
                else if (user.site?.toLowerCase() === 'duel') logoSrc = 'icons and images/gambling websites logos/duel logo.png';

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

            // Render Others
            data.users.slice(3).forEach(user => {
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
        }

        startCountdown(endTime, el) {
            if (this.countdownInterval) clearInterval(this.countdownInterval);

            const update = () => {
                const now = new Date().getTime();
                const distance = new Date(endTime).getTime() - now;

                if (distance < 0) {
                    clearInterval(this.countdownInterval);
                    el.innerHTML = '<div class="status-label">LEADERBOARD ENDED</div>';
                    return;
                }

                const d = Math.floor(distance / (1000 * 60 * 60 * 24));
                const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((distance % (1000 * 60)) / 1000);

                el.innerHTML = `
                    <div class="countdown-unit">
                        <span class="countdown-value">${d}</span>
                        <span class="countdown-label">Days</span>
                    </div>
                    <div class="countdown-unit">
                        <span class="countdown-value">${h}</span>
                        <span class="countdown-label">Hours</span>
                    </div>
                    <div class="countdown-unit">
                        <span class="countdown-value">${m}</span>
                        <span class="countdown-label">Min</span>
                    </div>
                    <div class="countdown-unit">
                        <span class="countdown-value">${s}</span>
                        <span class="countdown-label">Sec</span>
                    </div>
                `;
            };

            update();
            this.countdownInterval = setInterval(update, 1000);
        }
    }

    // Initialize Weekly Leaderboard
    new Leaderboard({
        id: 'weekly',
        dataFile: 'data/leaderboard.json',
        historyFile: 'data/leaderboard-history.json',
        selectors: {
            podium: 'weekly-podium',
            list: 'leaderboard-data',
            statusDate: 'weekly-status-date',
            statusLabel: 'weekly-status-label',
            historySelect: 'leaderboard-history-select',
            countdown: 'leaderboard-countdown'
        }
    });

    // Initialize Monthly Leaderboard
    new Leaderboard({
        id: 'monthly',
        dataFile: 'data/monthly-leaderboard.json',
        historyFile: 'data/monthly-leaderboard-history.json',
        selectors: {
            podium: 'monthly-podium',
            list: 'monthly-leaderboard-data',
            statusDate: 'monthly-status-date',
            statusLabel: 'monthly-status-label',
            historySelect: 'monthly-leaderboard-history-select',
            countdown: 'monthly-leaderboard-countdown'
        }
    });
});
