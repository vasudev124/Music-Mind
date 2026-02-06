const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cookieSession = require('cookie-session');

const { cache } = require('./services/cacheService');
const userService = require('./services/userService');
const analyticsService = require('./services/analyticsService');
const friendService = require('./services/friendService');
const recommendationService = require('./services/recommendationService');
const analyticsAlgo = require('./utils/analyticsAlgo');

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 8888;

// ---------------- ENV ----------------
const CLIENT_ID = (process.env.CLIENT_ID || process.env.SPOTIFY_CLIENT_ID || '').trim();
const CLIENT_SECRET = (process.env.CLIENT_SECRET || process.env.SPOTIFY_CLIENT_SECRET || '').trim();

let REDIRECT_URI =
  (process.env.REDIRECT_URI ||
    process.env.SPOTIFY_REDIRECT_URI ||
    (process.env.RENDER_EXTERNAL_URL
      ? `${process.env.RENDER_EXTERNAL_URL}/callback`
      : '')
  ).trim();

if (REDIRECT_URI && !REDIRECT_URI.endsWith('/callback')) {
  REDIRECT_URI += '/callback';
}

const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const frontendUrl = rawFrontendUrl.startsWith('http')
  ? rawFrontendUrl
  : `https://${rawFrontendUrl}`;

// ---------------- MIDDLEWARE ----------------
app.set('trust proxy', 1);

app.use(cookieSession({
  name: 'musicmind-session-v2',
  keys: [process.env.COOKIE_KEY || 'default_secret_key_change_me'],
  maxAge: 24 * 60 * 60 * 1000,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
}));

app.use(cors({
  origin: frontendUrl,
  credentials: true
}));

app.use(express.json());

// ---------------- AUTH MIDDLEWARE ----------------
async function checkAuth(req, res, next) {
  if (!req.session || !req.session.access_token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (Date.now() > req.session.expires_at) {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', req.session.refresh_token);
      params.append('client_id', CLIENT_ID);
      params.append('client_secret', CLIENT_SECRET);

      const refreshRes = await axios.post(
        'https://accounts.spotify.com/api/token',
        params,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      req.session.access_token = refreshRes.data.access_token;
      req.session.expires_at =
        Date.now() + refreshRes.data.expires_in * 1000 - 60000;
    } catch {
      req.session = null;
      return res.status(401).json({ error: 'Session expired' });
    }
  }

  next();
}

// ---------------- SPOTIFY SEARCH HELPER ----------------
async function searchSpotifyTracks(query, accessToken) {
  const res = await axios.get('https://api.spotify.com/v1/search', {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      q: query,
      type: 'track',
      limit: 5
    }
  });

  return res.data.tracks.items.map(track => ({
    title: track.name,
    artist: track.artists[0]?.name || '',
    spotifyUrl: track.external_urls.spotify
  }));
}

// ---------------- DOCS ----------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// ---------------- AUTH ROUTES ----------------
app.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email user-top-read';
  const authUrl =
    `https://accounts.spotify.com/authorize?response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', req.query.code);
    params.append('redirect_uri', REDIRECT_URI);

    const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const tokenRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authHeader}`
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    const profileRes = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    await userService.upsertUser(profileRes.data, refresh_token);

    req.session.access_token = access_token;
    req.session.refresh_token = refresh_token;
    req.session.expires_at = Date.now() + expires_in * 1000 - 60000;

    res.redirect(`${frontendUrl}/dashboard?login=success`);
  } catch {
    res.status(500).send('Authentication failed');
  }
});

// ---------------- LOGOUT ----------------
app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect(frontendUrl);
});

app.get('/auth/logout', (req, res) => res.redirect('/logout'));

// ---------------- 🔍 SEARCH (ML + SPOTIFY) ----------------
app.post('/api/search', checkAuth, async (req, res) => {
  const query = req.body?.query;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const cleanQuery = query.trim();
  let mlResults = [];
  let spotifyResults = [];

 // ML Service
try {
  if (!process.env.ML_SERVICE_URL) {
    throw new Error('ML_SERVICE_URL not set');
  }

  const mlRes = await axios.post(
    `${process.env.ML_SERVICE_URL}/search`,
    { query: cleanQuery },
    { timeout: 10000 }
  );

  mlResults = mlRes.data.results || [];
} catch (e) {
  console.warn('ML service unavailable:', e.message);
}


  // Spotify Search
  try {
    spotifyResults = await searchSpotifyTracks(
      cleanQuery,
      req.session.access_token
    );
  } catch (e) {
    console.warn('Spotify search failed');
  }

  mlResults.sort((a, b) => b.score - a.score);

  const featuredMl = mlResults[0] || null;
  const relatedMl = mlResults.slice(1);

  const attachSpotify = song => {
    const match = spotifyResults.find(
      s =>
        s.title.toLowerCase() === song.title.toLowerCase() &&
        s.artist.toLowerCase() === song.artist.toLowerCase()
    );
    return match ? match.spotifyUrl : null;
  };

  const featured = featuredMl
    ? {
        title: featuredMl.title,
        artist: featuredMl.artist,
        spotifyUrl: attachSpotify(featuredMl)
      }
    : null;

  const results = relatedMl.map(song => ({
    title: song.title,
    artist: song.artist,
    score: song.score,
    spotifyUrl: attachSpotify(song)
  }));

  const mlKeySet = mlResults.map(
    s => `${s.title}-${s.artist}`.toLowerCase()
  );

  const spotifyFallback = spotifyResults.filter(
    s => !mlKeySet.includes(`${s.title}-${s.artist}`.toLowerCase())
  );

  res.json({
    query: cleanQuery,
    featured,
    results,
    spotifyFallback
  });
});

// ---------------- USER PROFILE ----------------
app.get('/api/user/profile', checkAuth, async (req, res) => {
  const meRes = await axios.get('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${req.session.access_token}` }
  });

  const cacheKey = `profile:user:${meRes.data.id}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  await cache.set(cacheKey, meRes.data, 1800);
  res.json(meRes.data);
});

// ---------------- ANALYTICS ----------------
app.get('/api/analytics/dashboard', checkAuth, async (req, res) => {
  try {
    const headers = { Authorization: `Bearer ${req.session.access_token}` };
    const meRes = await axios.get('https://api.spotify.com/v1/me', { headers });

    const userId = meRes.data.id;
    const cacheKey = `dashboard:user:${userId}`;

    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const [artistsRes, tracksRes] = await Promise.all([
      axios.get('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=long_term', { headers }),
      axios.get('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term', { headers })
    ]);

    const topGenres = analyticsAlgo.getTopGenres(artistsRes.data.items);

    let moodScore = 50;
    try {
      const trackIds = tracksRes.data.items.map(t => t.id).join(',');
      const audioRes = await axios.get(
        `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
        { headers }
      );
      moodScore = analyticsAlgo.calculateMoodScore(audioRes.data.audio_features);
    } catch {}

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

    await analyticsService.saveAnalytics(userId, analyticsData);
    await cache.set(cacheKey, analyticsData, 600);

    res.json(analyticsData);
  } catch {
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// ---------------- RECOMMENDATIONS ----------------
app.post('/api/recommend/generate', checkAuth, async (req, res) => {
  const meRes = await axios.get('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${req.session.access_token}` }
  });
  res.json(await recommendationService.generateRecommendations(meRes.data.id));
});

// ---------------- FRIENDS ----------------
app.get('/friends/search', checkAuth, async (req, res) => {
  const me = await axios.get('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${req.session.access_token}` }
  });
  res.json(await friendService.searchUsers(req.query.q, me.data.id));
});

// ---------------- HEALTH ----------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
// ---------------- ROOT ----------------
app.get('/', (req, res) => {
  res.json({
    service: 'MusicMind Backend API',
    status: 'running'
  });
});

// ---------------- START ----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
