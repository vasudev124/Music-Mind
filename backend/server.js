require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const querystring = require('querystring');
const cookieSession = require('cookie-session');
const userService = require('./services/userService');
const analyticsService = require('./services/analyticsService');
const analyticsAlgo = require('./utils/analyticsAlgo');


const app = express();


// Security: HttpOnly Cookies
app.use(cookieSession({
    name: 'musicmind-session',
    keys: [process.env.COOKIE_KEY || 'default_secret_key_change_me'], // Rotate this in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL (Vite default)
    credentials: true // Allow cookies to be sent
}));

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const PORT = process.env.PORT || 8888;

// --- Middlewares ---

// Check if user is authenticated and refresh token if expired
async function checkAuth(req, res, next) {
    if (!req.session.access_token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    if (Date.now() > req.session.expires_at) {
        console.log('🔄 Token expired. Refreshing...');
        try {
            const refreshResponse = await axios({
                method: 'post',
                url: 'https://accounts.spotify.com/api/token',
                data: querystring.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: req.session.refresh_token
                }),
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
                },
            });

            const { access_token, expires_in } = refreshResponse.data;
            req.session.access_token = access_token;
            // Update expiration (subtract 1 min buffer)
            req.session.expires_at = Date.now() + (expires_in * 1000) - 60000;
            console.log('✅ Token refreshed successfully.');
        } catch (error) {
            console.error('❌ Failed to refresh token:', error.response?.data || error.message);
            req.session = null; // Clear session
            return res.status(401).json({ error: 'Session expired. Please login again.' });
        }
    }
    next();
}

// --- Routes ---

app.get('/login', (req, res) => {
    const scope = 'user-read-private user-read-email user-top-read'; // Added user-top-read for Phase 1 Data
    const queryParams = querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: scope,
        redirect_uri: REDIRECT_URI
    });
    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    try {
        const response = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            data: querystring.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI
            }),
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
            },
        });

        const { access_token, refresh_token, expires_in } = response.data;

        // Fetch User Profile immediately to get ID
        const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const userProfile = profileResponse.data;

        // Save/Update User in DB
        await userService.upsertUser(userProfile, refresh_token);
        console.log(`✅ User ${userProfile.display_name} (${userProfile.id}) saved to DB.`);

        // Store in HttpOnly Cookie
        req.session.access_token = access_token;
        req.session.refresh_token = refresh_token;
        req.session.expires_at = Date.now() + (expires_in * 1000) - 60000; // 1 min buffer

        // Redirect to Frontend (or a success page for now)
        // res.redirect('http://localhost:5173/dashboard?login=success'); // Frontend is not running

        // Show success message directly
        res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1>Login Successful!</h1>
                <p>Welcome, ${userProfile.display_name}!</p>
                <p>Tokens are stored securely in cookies and you are saved in the database.</p>
                <div style="margin-top: 20px;">
                    <a href="/api/user/profile" style="background: #1DB954; color: white; padding: 10px 20px; text-decoration: none; border-radius: 20px;">Check Profile</a>
                    <a href="/logout" style="background: #333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 20px; margin-left: 10px;">Logout</a>
                </div>
            </div>
        `);
    } catch (error) {
        console.error('Login Error:', error);
        res.send('Error during login: ' + error.message);
    }
});


// 1. User Routes: Get Profile (Fetches from Spotify or DB)
app.get('/api/user/profile', checkAuth, async (req, res) => {
    try {
        // Option A: Fetch fresh from Spotify
        const response = await axios.get('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${req.session.access_token}` }
        });
        // Option B: Could also fetch from DB using userService.getUser(response.data.id)
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Alias for backwards compatibility if needed
app.get('/api/me', checkAuth, (req, res) => {
    res.redirect('/api/user/profile');
});

// 2. Analytics Routes: Get Dashboard Data (Mood/Trends)
app.get('/api/analytics/dashboard', checkAuth, async (req, res) => {
    try {
        const accessToken = req.session.access_token;
        const headers = { Authorization: `Bearer ${accessToken}` };

        // A. Fetch Top Artists (long_term for better genre spread)
        const topArtistsReq = axios.get('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=long_term', { headers });

        // B. Fetch Top Tracks (short_term for current mood via audio features)
        const topTracksReq = axios.get('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term', { headers });

        const [artistsRes, tracksRes] = await Promise.all([topArtistsReq, topTracksReq]);

        // C. Calculate Top Genres
        const topGenres = analyticsAlgo.getTopGenres(artistsRes.data.items);

        // D. Calculate Mood Score (requires Audio Features for tracks)
        const trackIds = tracksRes.data.items.map(t => t.id).join(',');
        const audioFeaturesRes = await axios.get(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, { headers });
        const moodScore = analyticsAlgo.calculateMoodScore(audioFeaturesRes.data.audio_features);

        // Result Object
        const analyticsData = {
            topGenres,
            moodScore,
            totalTracksAnalyzed: tracksRes.data.items.length,
            generatedAt: new Date().toISOString()
        };

        // E. Save to DB (Background)
        // We need user ID. First fetch profile or store it in session during login.
        // For now, let's fast fetch profile again or use a cached ID if we had it.
        const meRes = await axios.get('https://api.spotify.com/v1/me', { headers });
        await analyticsService.saveAnalytics(meRes.data.id, analyticsData);

        res.json(analyticsData);

    } catch (error) {
        console.error('Analytics Error:', error.message);
        res.status(500).json({ error: 'Failed to generate analytics', details: error.message });
    }
});

// 3. Recommendation Routes: Trigger Generator
app.post('/api/recommend/generate', checkAuth, async (req, res) => {
    try {
        // Placeholder for calling Python Recommendation Engine
        // const pythonProcess = spawn('python', ['recommend_engine.py', userId]);

        // Mock Response for Phase 3
        res.json({
            message: "Recommendation generation started.",
            status: "processing",
            estimated_time: "5 seconds"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

app.get('/', (req, res) => {
    res.send(`<h1>MusicMind Backend</h1><p>Server is running.</p><a href="/login">Login with Spotify</a>`);
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running! Go to http://localhost:${PORT}/login`);
});

