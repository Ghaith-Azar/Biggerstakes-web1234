require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const SteamStrategy = require('passport-steam').Strategy;
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./database');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3333;

// Multer setup for prize image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './icons and images/prizes/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Middleware
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'biggerstakes_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport Serialization
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Steam Strategy
passport.use(new SteamStrategy({
    returnURL: process.env.RETURN_URL || `http://localhost:${PORT}/auth/steam/return`,
    realm: process.env.REALM || `http://localhost:${PORT}/`,
    apiKey: process.env.STEAM_API_KEY
}, async (identifier, profile, done) => {
    try {
        let user = await db.get("SELECT * FROM users WHERE steam_id = ?", [identifier]);
        if (!user) {
            const result = await db.run(
                "INSERT INTO users (steam_id, username, avatar) VALUES (?, ?, ?)",
                [identifier, profile.displayName, profile.photos[2].value]
            );
            user = await db.get("SELECT * FROM users WHERE id = ?", [result.id]);
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await db.get("SELECT * FROM users WHERE google_id = ?", [profile.id]);
        if (!user) {
            const result = await db.run(
                "INSERT INTO users (google_id, username, avatar) VALUES (?, ?, ?)",
                [profile.id, profile.displayName, profile.photos[0].value]
            );
            user = await db.get("SELECT * FROM users WHERE id = ?", [result.id]);
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// --- Auth Routes ---
app.get('/auth/steam', passport.authenticate('steam'));
app.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }), (req, res) => res.redirect('/'));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => res.redirect('/'));

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

// --- API Routes ---

// Get current user status
app.get('/api/user-status', (req, res) => {
    if (!req.isAuthenticated()) return res.json({ loggedIn: false });
    res.json({
        loggedIn: true,
        user: req.user
    });
});

// Get all active prizes
app.get('/api/prizes', async (req, res) => {
    try {
        const prizes = await db.query("SELECT * FROM prizes WHERE is_active = 1");
        res.json(prizes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Spin the case
app.post('/api/spin', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Please log in first" });

    try {
        const user = req.user;
        const cooldownSecondsRow = await db.get("SELECT value FROM admin_settings WHERE key = 'claim_cooldown_hours'");
        const cooldownSeconds = parseInt(cooldownSecondsRow.value);

        if (user.last_claim_at) {
            const lastClaim = new Date(user.last_claim_at);
            const now = new Date();
            const hoursSince = (now - lastClaim) / (1000 * 60 * 60);

            if (hoursSince < (cooldownSeconds / 3600)) {
                return res.status(403).json({ error: "Cooldown active", nextClaimAt: new Date(lastClaim.getTime() + cooldownSeconds * 1000) });
            }
        }

        // Weighted random selection
        const prizes = await db.query("SELECT * FROM prizes WHERE is_active = 1");
        const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedPrize = prizes[0];

        for (const prize of prizes) {
            if (random < prize.weight) {
                selectedPrize = prize;
                break;
            }
            random -= prize.weight;
        }

        // Record claim
        await db.run("INSERT INTO claims (user_id, prize_id, amount) VALUES (?, ?, ?)", [user.id, selectedPrize.id, selectedPrize.value]);
        await db.run("UPDATE users SET last_claim_at = ? WHERE id = ?", [new Date().toISOString(), user.id]);

        res.json({
            success: true,
            prize: selectedPrize
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Admin API ---
const isAdmin = (req, res, next) => {
    // Simple session-based admin check
    if (req.session.isAdmin) return next();
    res.status(401).json({ error: "Unauthorized" });
};

app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const adminUser = await db.get("SELECT value FROM admin_settings WHERE key = 'admin_username'");
    const adminPass = await db.get("SELECT value FROM admin_settings WHERE key = 'admin_password'");

    if (username === adminUser.value && password === adminPass.value) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: "Invalid credentials" });
    }
});

app.get('/api/admin/prizes', isAdmin, async (req, res) => {
    const prizes = await db.query("SELECT * FROM prizes");
    res.json(prizes);
});

app.post('/api/admin/prizes', isAdmin, upload.single('image'), async (req, res) => {
    const { name, value, weight } = req.body;
    const imageUrl = req.file ? `/icons and images/prizes/${req.file.filename}` : '';
    await db.run("INSERT INTO prizes (name, value, weight, image_url) VALUES (?, ?, ?, ?)", [name, value, weight, imageUrl]);
    res.json({ success: true });
});

app.put('/api/admin/prizes/:id', isAdmin, async (req, res) => {
    const { name, value, weight, is_active } = req.body;
    await db.run("UPDATE prizes SET name=?, value=?, weight=?, is_active=? WHERE id=?", [name, value, weight, is_active, req.params.id]);
    res.json({ success: true });
});

app.delete('/api/admin/prizes/:id', isAdmin, async (req, res) => {
    await db.run("DELETE FROM prizes WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

app.get('/api/admin/claims', isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT c.*, u.username, p.name as prize_name 
            FROM claims c
            JOIN users u ON c.user_id = u.id
            JOIN prizes p ON c.prize_id = p.id
            ORDER BY c.claimed_at DESC
        `;
        const claims = await db.query(query);
        res.json(claims);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
