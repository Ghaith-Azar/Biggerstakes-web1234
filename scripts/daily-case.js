document.addEventListener('DOMContentLoaded', function () {
    const authCheck = document.getElementById('auth-check');
    const caseContainer = document.getElementById('case-opening-container');
    const prizeTrack = document.getElementById('prize-track');
    const spinBtn = document.getElementById('spin-btn');
    const caseTimer = document.getElementById('case-timer');
    const rewardTimer = document.getElementById('reward-timer');
    const winOverlay = document.getElementById('win-overlay');
    const wonAmount = document.getElementById('won-amount');

    let allPrizes = [];
    let isSpinning = false;
    const CARD_WIDTH = 160; // card(150) + margin(5*2)

    // Check Login Status
    const checkStatus = async () => {
        try {
            const res = await fetch('/api/user-status');
            const data = await res.json();

            if (data.loggedIn) {
                authCheck.style.display = 'none';
                caseContainer.style.display = 'block';
                loadPrizes();
                checkTimer(data.user);
            } else {
                authCheck.style.display = 'block';
                caseContainer.style.display = 'none';
            }
        } catch (err) {
            console.error('Status check failed:', err);
        }
    };

    const loadPrizes = async () => {
        try {
            const res = await fetch('/api/prizes');
            allPrizes = await res.json();
            generateInitialTrack();
        } catch (err) {
            console.error('Failed to load prizes:', err);
        }
    };

    const checkTimer = (user) => {
        if (!user.last_claim_at) return;

        const lastClaim = new Date(user.last_claim_at);
        const cooldownSeconds = 5; // Updated to 5 seconds for testing
        const nextClaim = new Date(lastClaim.getTime() + cooldownSeconds * 1000);
        const now = new Date();

        if (now < nextClaim) {
            startCountdown(nextClaim);
        }
    };

    const startCountdown = (endTime) => {
        spinBtn.disabled = true;
        caseTimer.style.display = 'block';

        const update = () => {
            const now = new Date();
            const diff = endTime - now;

            if (diff <= 0) {
                spinBtn.disabled = false;
                caseTimer.style.display = 'none';
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            rewardTimer.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            setTimeout(update, 1000);
        };
        update();
    };

    const generateInitialTrack = () => {
        prizeTrack.innerHTML = '';
        // Create a repeating loop of prizes for display
        for (let i = 0; i < 80; i++) {
            const prize = allPrizes[i % allPrizes.length];
            const card = createPrizeCard(prize);
            prizeTrack.appendChild(card);
        }
    };

    const createPrizeCard = (prize) => {
        const card = document.createElement('div');
        const rarity = getRarity(prize.value);
        card.className = `prize-card ${rarity}`;
        
        card.innerHTML = `
            <img src="${prize.image_url || '/icons and images/biggerstakes v2 logo icon.png'}" class="prize-image">
            <div class="prize-name">${prize.name}</div>
        `;
        return card;
    };

    const getRarity = (value) => {
        if (value >= 100) return 'ancient';
        if (value >= 50) return 'legendary';
        if (value >= 10) return 'mythical';
        return 'rare';
    };

    const spin = async () => {
        if (isSpinning) return;
        isSpinning = true;
        spinBtn.disabled = true;

        try {
            const res = await fetch('/api/spin', { method: 'POST' });
            const data = await res.json();

            if (data.error) {
                alert(data.error);
                isSpinning = false;
                spinBtn.disabled = false;
                return;
            }

            const winner = data.prize;
            const winningIndex = 60; // Place winner at index 60
            
            // Re-generate track segments to ensure winner is at winningIndex
            const cards = prizeTrack.children;
            const winnerCard = createPrizeCard(winner);
            prizeTrack.replaceChild(winnerCard, cards[winningIndex]);

            // Audio Effect (Optional)
            // playSpinSound();

            // Calculate Translate
            const viewportWidth = document.querySelector('.case-viewport').offsetWidth;
            const centerOffset = viewportWidth / 2;
            const winningOffset = (winningIndex * CARD_WIDTH) + (CARD_WIDTH / 2);
            // Add some randomness within the card
            const randomInnerOffset = (Math.random() - 0.5) * (CARD_WIDTH * 0.8);
            const finalPosition = -(winningOffset - centerOffset + randomInnerOffset);

            prizeTrack.style.transition = 'transform 8s cubic-bezier(0.1, 0, 0.1, 1)';
            prizeTrack.style.transform = `translateX(${finalPosition}px)`;

            setTimeout(() => {
                showWin(winner);
                isSpinning = false;
                // Start timer
                const nextClaim = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
                startCountdown(nextClaim);
            }, 8500);

        } catch (err) {
            console.error('Spin failed:', err);
            isSpinning = false;
            spinBtn.disabled = false;
        }
    };

    const showWin = (prize) => {
        wonAmount.textContent = `${prize.value.toFixed(2)} USDT`;
        winOverlay.style.display = 'flex';
    };

    window.closeWinOverlay = () => {
        winOverlay.style.display = 'none';
        // Reset track position for next time (or keep it)
        prizeTrack.style.transition = 'none';
        prizeTrack.style.transform = 'translateX(0)';
        generateInitialTrack();
    };

    spinBtn.addEventListener('click', spin);

    checkStatus();
});
