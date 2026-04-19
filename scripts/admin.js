document.addEventListener('DOMContentLoaded', function () {
    // Auth Elements
    const loginOverlay = document.getElementById('login-overlay');
    const adminTools = document.getElementById('admin-tools');
    const usernameInput = document.getElementById('admin-username');
    const passwordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');

    // Navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sections = {
        leaderboard: document.getElementById('leaderboard-section'),
        'daily-case': document.getElementById('daily-case-section'),
        'rewards-history': document.getElementById('rewards-history-section')
    };

    // Leaderboard Elements
    const usersList = document.getElementById('users-list');
    const addUserBtn = document.getElementById('add-user');
    const saveBtn = document.getElementById('save-leaderboard');
    const lbDateInput = document.getElementById('lb-date');
    const lbCountdownEndInput = document.getElementById('lb-countdown-end');
    const lbStatusInput = document.getElementById('lb-status');
    const archiveBtn = document.getElementById('archive-leaderboard');
    const logoutBtn = document.getElementById('logout-btn');
    const notif = document.getElementById('notif');
    const typeSelect = document.getElementById('leaderboard-type-select');
    const adminTitle = document.getElementById('admin-title');

    // Daily Case Elements
    const prizesList = document.getElementById('prizes-list');
    const addPrizeBtn = document.getElementById('submit-prize');
    const cooldownInput = document.getElementById('case-cooldown');
    const saveSettingsBtn = document.getElementById('save-settings');

    // Rewards History Elements
    const claimsList = document.getElementById('claims-list');
    const sortableHeaders = document.querySelectorAll('.sortable');

    let currentType = typeSelect?.value || 'weekly';
    let leaderboardData = { date: "", countdownEnd: "", status: "", users: [] };
    let claimsData = [];
    let currentSort = { key: 'claimed_at', order: 'desc' };

    const typeConfig = {
        weekly: { dataFile: 'data/leaderboard.json', title: 'Weekly Leaderboard Admin' },
        monthly: { dataFile: 'data/monthly-leaderboard.json', title: 'Monthly Leaderboard Admin' }
    };

    // --- Authentication Logic ---
    const checkAuth = () => {
        const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
        if (isAuthenticated) {
            loginOverlay.style.display = 'none';
            adminTools.style.display = 'block';
            loadLeaderboardData();
            loadPrizes();
            loadClaims();
        } else {
            loginOverlay.style.display = 'flex';
            adminTools.style.display = 'none';
        }
    };

    const handleLogin = async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                sessionStorage.setItem('adminAuthenticated', 'true');
                loginError.style.display = 'none';
                checkAuth();
            } else {
                loginError.style.display = 'block';
                passwordInput.value = '';
            }
        } catch (err) {
            console.error('Login error:', err);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('adminAuthenticated');
        fetch('/logout');
        checkAuth();
    };

    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // --- Tab Switching ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            Object.values(sections).forEach(s => s.style.display = 'none');
            sections[tab].style.display = 'block';

            if (tab === 'rewards-history') loadClaims();
        });
    });

    // --- Leaderboard Logic ---
    const loadLeaderboardData = () => {
        const config = typeConfig[currentType];
        fetch(config.dataFile)
            .then(res => res.json())
            .then(data => {
                leaderboardData = data;
                renderLeaderboardForm();
            })
            .catch(err => console.error('Error loading data', err));
    };

    const renderLeaderboardForm = () => {
        lbDateInput.value = leaderboardData.date;
        lbCountdownEndInput.value = leaderboardData.countdownEnd || "";
        lbStatusInput.value = leaderboardData.status;
        usersList.innerHTML = '';

        leaderboardData.users.sort((a, b) => a.place - b.place).forEach((user, index) => {
            const row = document.createElement('div');
            row.className = 'user-grid';
            row.innerHTML = `
                <input type="number" value="${user.place}" class="edit-place" data-index="${index}">
                <input type="text" value="${user.username}" class="edit-username" data-index="${index}">
                <input type="number" step="0.01" value="${user.wagered}" class="edit-wagered" data-index="${index}">
                <input type="number" step="0.01" value="${user.prize}" class="edit-prize" data-index="${index}">
                <input type="text" value="${user.site || ''}" placeholder="Site" class="edit-site" data-index="${index}">
                <input type="text" value="${user.logo || ''}" placeholder="Logo URL" class="edit-logo" data-index="${index}">
                <button class="btn btn-delete" data-index="${index}">Delete</button>
            `;
            usersList.appendChild(row);
        });
    };

    saveBtn.addEventListener('click', () => {
        leaderboardData.date = lbDateInput.value;
        leaderboardData.countdownEnd = lbCountdownEndInput.value;
        leaderboardData.status = lbStatusInput.value;

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leaderboardData, null, 4));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        const filename = currentType === 'weekly' ? 'leaderboard.json' : 'monthly-leaderboard.json';
        downloadAnchorNode.setAttribute("download", filename);
        downloadAnchorNode.click();
        
        showNotification("Changes saved! Remember to upload the JSON file.");
    });

    // --- Daily Case Logic ---
    const loadPrizes = async () => {
        try {
            const res = await fetch('/api/admin/prizes');
            const prizes = await res.json();
            renderPrizes(prizes);
        } catch (err) {
            console.error('Error loading prizes:', err);
        }
    };

    const renderPrizes = (prizes) => {
        prizesList.innerHTML = '';
        prizes.forEach(prize => {
            const row = document.createElement('div');
            row.className = 'user-grid';
            row.style.gridTemplateColumns = '1.5fr 1fr 1fr 2fr 120px';
            row.innerHTML = `
                <input type="text" value="${prize.name}" class="prize-edit-name" data-id="${prize.id}">
                <input type="number" step="0.01" value="${prize.value}" class="prize-edit-value" data-id="${prize.id}">
                <input type="number" value="${prize.weight}" class="prize-edit-weight" data-id="${prize.id}">
                <div style="padding: 10px; font-size: 11px; overflow: hidden; text-overflow: ellipsis; color: #888;">${prize.image_url}</div>
                <div style="display: flex; gap: 5px;">
                    <button class="btn btn-save save-prize-edit" data-id="${prize.id}" style="padding: 5px 10px; font-size: 12px;"><i class="fas fa-save"></i></button>
                    <button class="btn btn-delete delete-prize" data-id="${prize.id}" style="padding: 5px 10px; font-size: 12px;"><i class="fas fa-trash"></i></button>
                </div>
            `;
            prizesList.appendChild(row);
        });
    };

    addPrizeBtn.addEventListener('click', async () => {
        const formData = new FormData();
        formData.append('name', document.getElementById('new-prize-name').value);
        formData.append('value', document.getElementById('new-prize-value').value);
        formData.append('weight', document.getElementById('new-prize-weight').value);
        formData.append('image', document.getElementById('new-prize-image').files[0]);

        try {
            const res = await fetch('/api/admin/prizes', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                showNotification("Prize added successfully!");
                loadPrizes();
                document.getElementById('add-prize-form').reset();
            }
        } catch (err) {
            console.error('Error adding prize:', err);
        }
    });

    prizesList.addEventListener('click', async (e) => {
        const id = e.target.closest('button')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.delete-prize')) {
            if (confirm("Delete this prize?")) {
                await fetch(`/api/admin/prizes/${id}`, { method: 'DELETE' });
                loadPrizes();
            }
        }

        if (e.target.closest('.save-prize-edit')) {
            const row = e.target.closest('.user-grid');
            const name = row.querySelector('.prize-edit-name').value;
            const value = row.querySelector('.prize-edit-value').value;
            const weight = row.querySelector('.prize-edit-weight').value;

            try {
                const res = await fetch(`/api/admin/prizes/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, value, weight, is_active: 1 })
                });
                if (res.ok) showNotification("Prize updated!");
            } catch (err) {
                console.error('Update failed:', err);
            }
        }
    });

    // --- Rewards History Logic ---
    const loadClaims = async () => {
        try {
            const res = await fetch('/api/admin/claims');
            claimsData = await res.json();
            renderClaims();
        } catch (err) {
            console.error('Error loading claims:', err);
        }
    };

    const renderClaims = () => {
        claimsList.innerHTML = '';
        
        const sortedData = [...claimsData].sort((a, b) => {
            let valA = a[currentSort.key];
            let valB = b[currentSort.key];
            if (currentSort.key === 'claimed_at') {
                valA = new Date(valA);
                valB = new Date(valB);
            }
            if (currentSort.order === 'asc') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });

        sortedData.forEach(claim => {
            const row = document.createElement('div');
            row.className = 'user-grid';
            row.style.gridTemplateColumns = '2fr 1fr 1fr 2fr';
            row.style.borderBottom = '1px solid #1a1a1a';
            row.innerHTML = `
                <div style="padding: 10px;">${claim.username}</div>
                <div style="padding: 10px; color: var(--orange-web);">${claim.prize_name}</div>
                <div style="padding: 10px;">${claim.amount} USDT</div>
                <div style="padding: 10px; color: #666; font-size: 13px;">${new Date(claim.claimed_at).toLocaleString()}</div>
            `;
            claimsList.appendChild(row);
        });
    };

    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const key = header.dataset.sort;
            if (currentSort.key === key) {
                currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.key = key;
                currentSort.order = 'asc';
            }
            
            sortableHeaders.forEach(h => h.querySelector('i').className = 'fas fa-sort');
            header.querySelector('i').className = `fas fa-sort-${currentSort.order === 'asc' ? 'up' : 'down'}`;
            
            renderClaims();
        });
    });

    const showNotification = (text) => {
        notif.textContent = text;
        notif.style.display = 'block';
        setTimeout(() => notif.style.display = 'none', 3000);
    };

    checkAuth();
});
