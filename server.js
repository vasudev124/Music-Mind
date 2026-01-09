const path = require('path');
// 1. Load Environment Variables immediately
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const querystring = require('querystring');
const cookieSession = require('cookie-session');

// 2. Import Services (must exist)
const userService = require('./services/userService');
const analyticsService = require('./services/analyticsService');
const friendService = require('./services/friendService');
const analyticsAlgo = require('./utils/analyticsAlgo');

// 3. Initialize App & Constants
const app = express();
const PORT = process.env.PORT || 8888;

// Sanitize Envs
const CLIENT_ID = (process.env.CLIENT_ID || '').trim();
const CLIENT_SECRET = (process.env.CLIENT_SECRET || '').trim();
const REDIRECT_URI = (process.env.REDIRECT_URI || '').trim();

// Diagnostics Log
console.log('--- SERVER CONFIG ---');
console.log(`CLIENT_ID: ${CLIENT_ID ? 'Set (Length ' + CLIENT_ID.length + ')' : 'MISSING'}`);
console.log(`REDIRECT_URI: ${REDIRECT_URI || 'MISSING'}`);
console.log('---------------------');

// 4. Middlewares (Global)
app.set('trust proxy', 1);
app.use(cookieSession({
    name: 'musicmind-session-v2',
    keys: [process.env.COOKIE_KEY || 'default_secret_key_change_me'],
    maxAge: 24 * 60 * 60 * 1000,
    secure: false,
    httpOnly: true,
    sameSite: 'lax'
}));

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// 5. Custom Middlewares (Definitions)

/**
 * Middleware to check authentication status.
 * Defined BEFORE usage in routes to avoid ReferenceError.
 */
async function checkAuth(req, res, next) {
    if (!req.session || !req.session.access_token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    if (Date.now() > req.session.expires_at) {
        console.log('🔄 Token expired. Refreshing...');
        try {
            // Refresh Token Request - Using Body Params for stability
            const params = new URLSearchParams();
            params.append('grant_type', 'refresh_token');
            params.append('refresh_token', req.session.refresh_token);
            params.append('client_id', CLIENT_ID);
            params.append('client_secret', CLIENT_SECRET);

            const refreshResponse = await axios.post('https://accounts.spotify.com/api/token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { access_token, expires_in } = refreshResponse.data;
            req.session.access_token = access_token;
            req.session.expires_at = Date.now() + (expires_in * 1000) - 60000;
            console.log('✅ Token refreshed.');
        } catch (error) {
            console.error('❌ Failed to refresh:', error.response?.data || error.message);
            req.session = null;
            return res.status(401).json({ error: 'Session expired' });
        }
    }
    next();
}

// 6. Routes

// --- Auth Routes ---

app.get('/login', (req, res) => {
    const scope = 'user-read-private user-read-email user-top-read';
    // Strictly use the sanitized env var for redirect
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const error = req.query.error || null;

    if (error) return res.send(`Spotify Error: ${error}`);

    try {
        // Raw String Construction to avoid any serialization issues
        // We put credentials in BOTH Body (as fallback) and Header
        const rawBody = `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;

        console.log('[CALLBACK] Sending Raw Payload (Hidden Secrets)');

        const response = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            data: rawBody,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, refresh_token, expires_in } = response.data;

        // Get Profile
        const profileRes = await axios.get('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        // Save User
        await userService.upsertUser(profileRes.data, refresh_token);

        // Update Session
        req.session.access_token = access_token;
        req.session.refresh_token = refresh_token;
        req.session.expires_at = Date.now() + (expires_in * 1000) - 60000;

        res.redirect('http://localhost:5173/dashboard?login=success');

    } catch (err) {
        console.error('Login Callback Error:', err.message);
        if (err.response) {
            console.error('Spotify Response:', err.response.data);
            res.send(`Spotify Auth Error: ${JSON.stringify(err.response.data)}`);
        } else {
            res.send(`Auth Error: ${err.message}`);
        }
    }
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

// Aliases
app.get('/auth/login', (req, res) => res.redirect('/login'));
app.get('/auth/me', checkAuth, (req, res) => res.redirect('/api/user/profile'));
app.get('/auth/logout', (req, res) => res.redirect('/logout'));

// --- User & Analytics API ---

app.get('/api/user/profile', checkAuth, async (req, res) => {
    try {
        const response = await axios.get('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${req.session.access_token}` }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/analytics/dashboard', checkAuth, async (req, res) => {
    try {
        const headers = { Authorization: `Bearer ${req.session.access_token}` };

        // Parallel Fetch for speed
        const [artistsRes, tracksRes] = await Promise.all([
            axios.get('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=long_term', { headers }),
            axios.get('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term', { headers })
        ]);

        const topGenres = analyticsAlgo.getTopGenres(artistsRes.data.items);
        const trackIds = tracksRes.data.items.map(t => t.id).join(',');

        let moodScore = 50;
        try {
            const audioRes = await axios.get(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, { headers });
            moodScore = analyticsAlgo.calculateMoodScore(audioRes.data.audio_features);
        } catch (e) {
            console.error('Audio Features warning:', e.message);
        }

        const analyticsData = {
            topGenres,
            moodScore,
            topTracks: tracksRes.data.items.slice(0, 5).map(t => ({
                name: t.name,
                artist: t.artists[0].name,
                image: t.album.images[0]?.url,
                preview: t.preview_url
            })),
            generatedAt: new Date().toISOString()
        };

        // Async save to DB
        const meRes = await axios.get('https://api.spotify.com/v1/me', { headers });
        analyticsService.saveAnalytics(meRes.data.id, analyticsData).catch(e => console.error('DB Save Error:', e));

        res.json(analyticsData);
    } catch (error) {
        console.error('Dashboard Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// --- Friends API ---

app.get('/friends/search', checkAuth, async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: "Query required" });
        const me = await axios.get('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${req.session.access_token}` } });
        const users = await friendService.searchUsers(query, me.data.id);
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/friends/request', checkAuth, async (req, res) => {
    try {
        const { receiverId } = req.body;
        const me = await axios.get('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${req.session.access_token}` } });
        const result = await friendService.sendRequest(me.data.id, receiverId);
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/friends', checkAuth, async (req, res) => {
    try {
        const me = await axios.get('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${req.session.access_token}` } });
        const friends = await friendService.getFriends(me.data.id);
        res.json(friends);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/friends/compare', checkAuth, async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const me = await axios.get('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${req.session.access_token}` } });
        const result = await friendService.compareUsers(me.data.id, targetUserId);
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Test Panel ---
app.get('/test-panel', (req, res) => {
    res.send(`
    <html>
    <body style="font-family:sans-serif; padding:20px;">
        <h1>MusicMind Debug Panel</h1>
        <p>Status: Server Running</p>
        <button onclick="window.location.href='/login'">Login (Spotify)</button>
        <button onclick="fetch('/api/analytics/dashboard').then(r=>r.json()).then(d=>document.body.append(JSON.stringify(d)))">Data</button>
    </body>
    </html>
    `);
});

app.get('/', (req, res) => res.send('<h1>MusicMind Backend</h1><a href="/login">Login</a>'));

// 7. Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
