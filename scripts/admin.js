document.addEventListener('DOMContentLoaded', function () {
    // Auth Elements
    const loginOverlay = document.getElementById('login-overlay');
    const adminTools = document.getElementById('admin-tools');
    const usernameInput = document.getElementById('admin-username');
    const passwordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');

    // Admin Panel Elements
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

    // Default Credentials
    const AUTH_USERNAME = "azar";
    const AUTH_PASSWORD = "1234";
    const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes in ms

    let currentType = typeSelect?.value || 'weekly';

    let leaderboardData = {
        date: "",
        countdownEnd: "",
        status: "",
        users: []
    };

    const typeConfig = {
        weekly: {
            dataFile: 'data/leaderboard.json',
            historyFile: 'data/leaderboard-history.json',
            title: 'Weekly Leaderboard Admin'
        },
        monthly: {
            dataFile: 'data/monthly-leaderboard.json',
            historyFile: 'data/monthly-leaderboard-history.json',
            title: 'Monthly Leaderboard Admin'
        }
    };

    let inactivityTimer;

    // --- Authentication Logic ---
    const checkAuth = () => {
        const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
        if (isAuthenticated) {
            loginOverlay.style.display = 'none';
            adminTools.style.display = 'block';
            loadData();
            resetInactivityTimer();
        } else {
            loginOverlay.style.display = 'flex';
            adminTools.style.display = 'none';
            clearInactivityTimer();
        }
    };

    const handleLogin = () => {
        const user = usernameInput.value;
        const pass = passwordInput.value;

        if (user === AUTH_USERNAME && pass === AUTH_PASSWORD) {
            sessionStorage.setItem('adminAuthenticated', 'true');
            loginError.style.display = 'none';
            checkAuth();
        } else {
            loginError.style.display = 'block';
            passwordInput.value = '';
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('adminAuthenticated');
        checkAuth();
        usernameInput.value = '';
        passwordInput.value = '';
    };

    // --- Inactivity Logic ---
    const resetInactivityTimer = () => {
        clearInactivityTimer();
        inactivityTimer = setTimeout(() => {
            alert("Session expired due to inactivity.");
            handleLogout();
        }, INACTIVITY_TIMEOUT);
    };

    const clearInactivityTimer = () => {
        if (inactivityTimer) clearTimeout(inactivityTimer);
    };

    // Listen for activity
    ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'].forEach(event => {
        window.addEventListener(event, () => {
            if (sessionStorage.getItem('adminAuthenticated') === 'true') {
                resetInactivityTimer();
            }
        });
    });

    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    });

    // --- Admin Panel Logic ---
    const loadData = () => {
        const localData = localStorage.getItem(`leaderboardData_${currentType}`);
        if (localData) {
            leaderboardData = JSON.parse(localData);
            renderForm();
        } else {
            const config = typeConfig[currentType];
            fetch(config.dataFile)
                .then(res => res.json())
                .then(data => {
                    leaderboardData = data;
                    renderForm();
                })
                .catch(err => console.error('Error loading data', err));
        }
    };

    if (typeSelect) {
        typeSelect.addEventListener('change', (e) => {
            currentType = e.target.value;
            adminTitle.textContent = typeConfig[currentType].title;
            loadData();
        });
    }

    const renderForm = () => {
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
                <input type="text" value="${user.site || ''}" placeholder="e.g. Stake" class="edit-site" data-index="${index}">
                <input type="text" value="${user.logo || ''}" placeholder="Path to logo/icon" class="edit-logo" data-index="${index}">
                <button class="btn btn-delete" data-index="${index}">Delete</button>
            `;
            usersList.appendChild(row);
        });
    };

    addUserBtn.addEventListener('click', () => {
        const nextPlace = leaderboardData.users.length + 1;
        leaderboardData.users.push({
            place: nextPlace,
            username: "New User",
            wagered: 0,
            prize: 0,
            site: "Stake"
        });
        renderForm();
    });

    usersList.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const index = e.target.dataset.index;
            leaderboardData.users.splice(index, 1);
            renderForm();
        }
    });

    usersList.addEventListener('input', (e) => {
        const index = e.target.dataset.index;
        const value = e.target.value;

        if (e.target.classList.contains('edit-place')) leaderboardData.users[index].place = parseInt(value);
        if (e.target.classList.contains('edit-username')) leaderboardData.users[index].username = value;
        if (e.target.classList.contains('edit-wagered')) leaderboardData.users[index].wagered = parseFloat(value);
        if (e.target.classList.contains('edit-prize')) leaderboardData.users[index].prize = parseFloat(value);
        if (e.target.classList.contains('edit-site')) leaderboardData.users[index].site = value;
        if (e.target.classList.contains('edit-logo')) leaderboardData.users[index].logo = value;
    });

    saveBtn.addEventListener('click', () => {
        leaderboardData.date = lbDateInput.value;
        leaderboardData.countdownEnd = lbCountdownEndInput.value;
        leaderboardData.status = lbStatusInput.value;
        leaderboardData.updatedAt = new Date().toISOString();

        localStorage.setItem(`leaderboardData_${currentType}`, JSON.stringify(leaderboardData));

        notif.style.display = 'block';
        setTimeout(() => notif.style.display = 'none', 3000);

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leaderboardData, null, 4));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        const filename = currentType === 'weekly' ? 'leaderboard.json' : 'monthly-leaderboard.json';
        downloadAnchorNode.setAttribute("download", filename);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        alert(`Changes saved to browser! A '${filename}' file has been downloaded. To make changes permanent for everyone, please replace the file in 'data/${filename}' with this new one.`);
    });

    archiveBtn.addEventListener('click', () => {
        const config = typeConfig[currentType];
        fetch(config.historyFile)
            .then(res => res.json())
            .then(historyData => {
                const exists = historyData.some(h => h.date === lbDateInput.value);
                if (exists) {
                    if (!confirm("A leaderboard with this date already exists in history. Overwrite?")) return;
                    historyData = historyData.filter(h => h.date !== lbDateInput.value);
                }

                const newHistoryEntry = {
                    date: lbDateInput.value,
                    status: lbStatusInput.value,
                    updatedAt: new Date().toISOString(),
                    users: JSON.parse(JSON.stringify(leaderboardData.users))
                };

                historyData.push(newHistoryEntry);

                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(historyData, null, 4));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                const historyFilename = currentType === 'weekly' ? 'leaderboard-history.json' : 'monthly-leaderboard-history.json';
                downloadAnchorNode.setAttribute("download", historyFilename);
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();

                alert(`Current data archived! A '${historyFilename}' file has been downloaded. Please replace the file in 'data/${historyFilename}' with this new one.`);
            })
            .catch(err => {
                console.error('Error archiving:', err);
                alert(`Please make sure 'data/${typeConfig[currentType].historyFile}' exists and is accessible.`);
            });
    });

    // Initial check
    checkAuth();
});
