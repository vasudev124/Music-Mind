require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const querystring = require('querystring');
const cookieSession = require('cookie-session');
const userService = require('./services/userService');


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
                    <a href="/api/me" style="background: #1DB954; color: white; padding: 10px 20px; text-decoration: none; border-radius: 20px;">Check Profile</a>
                    <a href="/logout" style="background: #333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 20px; margin-left: 10px;">Logout</a>
                </div>
            </div>
        `);
    } catch (error) {
        console.error('Login Error:', error);
        res.send('Error during login: ' + error.message);
    }
});


// Protected Route Example: Get My Profile
app.get('/api/me', checkAuth, async (req, res) => {
    try {
        const response = await axios.get('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${req.session.access_token}` }
        });
        res.json(response.data);
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

