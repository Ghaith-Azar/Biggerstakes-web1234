const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'data', 'daily_case.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database at', dbPath);
        initializeSchema();
    }
});

function initializeSchema() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            steam_id TEXT UNIQUE,
            google_id TEXT UNIQUE,
            username TEXT,
            avatar TEXT,
            last_claim_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Prizes Table
        db.run(`CREATE TABLE IF NOT EXISTS prizes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            value REAL DEFAULT 0,
            image_url TEXT,
            weight INTEGER DEFAULT 1,
            is_active INTEGER DEFAULT 1
        )`, () => {
             // Add a default "No Prize" if empty
             db.get("SELECT COUNT(*) as count FROM prizes", (err, row) => {
                if (row && row.count === 0) {
                    db.run("INSERT INTO prizes (name, value, image_url, weight) VALUES (?, ?, ?, ?)", 
                    ["Better Luck Tomorrow", 0, "/icons and images/no-prize.png", 100]);
                }
             });
        });

        // Claims Log
        db.run(`CREATE TABLE IF NOT EXISTS claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            prize_id INTEGER,
            amount REAL,
            claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(prize_id) REFERENCES prizes(id)
        )`);

        // Admin Settings
        db.run(`CREATE TABLE IF NOT EXISTS admin_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`, () => {
            db.run("INSERT OR IGNORE INTO admin_settings (key, value) VALUES ('claim_cooldown_hours', '5')");
            db.run("INSERT OR IGNORE INTO admin_settings (key, value) VALUES ('admin_username', 'azar')");
            db.run("INSERT OR IGNORE INTO admin_settings (key, value) VALUES ('admin_password', '1234')");
        });
    });
}

module.exports = {
    db,
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }
};
