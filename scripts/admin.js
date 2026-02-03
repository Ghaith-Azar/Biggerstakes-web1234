document.addEventListener('DOMContentLoaded', function () {
    const usersList = document.getElementById('users-list');
    const addUserBtn = document.getElementById('add-user');
    const saveBtn = document.getElementById('save-leaderboard');
    const lbDateInput = document.getElementById('lb-date');
    const lbStatusInput = document.getElementById('lb-status');
    const archiveBtn = document.getElementById('archive-leaderboard');
    const notif = document.getElementById('notif');

    let leaderboardData = {
        date: "",
        status: "",
        users: []
    };

    // Load initial data
    const loadData = () => {
        const localData = localStorage.getItem('leaderboardData');
        if (localData) {
            leaderboardData = JSON.parse(localData);
            renderForm();
        } else {
            fetch('data/leaderboard.json')
                .then(res => res.json())
                .then(data => {
                    leaderboardData = data;
                    renderForm();
                })
                .catch(err => console.error('Error loading data', err));
        }
    };

    const renderForm = () => {
        lbDateInput.value = leaderboardData.date;
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
        leaderboardData.status = lbStatusInput.value;
        leaderboardData.updatedAt = new Date().toISOString();

        // Save to localStorage for immediate preview
        localStorage.setItem('leaderboardData', JSON.stringify(leaderboardData));

        // Show notification
        notif.style.display = 'block';
        setTimeout(() => notif.style.display = 'none', 3000);

        // Optional: Trigger a download of the JSON file so the user can replace the data/leaderboard.json
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leaderboardData, null, 4));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "leaderboard.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        alert("Changes saved to browser! A 'leaderboard.json' file has been downloaded. To make changes permanent for everyone, please replace the file in 'data/leaderboard.json' with this new one.");
    });

    archiveBtn.addEventListener('click', () => {
        // Fetch current history, add current data, and download new history file
        fetch('data/leaderboard-history.json')
            .then(res => res.json())
            .then(historyData => {
                // Ensure we don't duplicate by date (optional check)
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
                downloadAnchorNode.setAttribute("download", "leaderboard-history.json");
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();

                alert("current data archived! A 'leaderboard-history.json' file has been downloaded. Please replace the file in 'data/leaderboard-history.json' with this new one.");
            })
            .catch(err => {
                console.error('Error archiving:', err);
                alert("Please make sure 'data/leaderboard-history.json' exists and is accessible.");
            });
    });

    loadData();
});
