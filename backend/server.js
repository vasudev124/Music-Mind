require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const querystring = require('querystring');

const app = express();
app.use(cors());

// This line reads the secret file you just created
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const PORT = process.env.PORT || 8888;

// 1. The Login Route
app.get('/login', (req, res) => {
    // This builds the official Spotify login URL
    const queryParams = querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: 'user-read-private user-read-email',
        redirect_uri: REDIRECT_URI
    });
    // Send the user to Spotify
    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

// 2. The Callback Route (Where they come back)
app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    try {
        // Ask Spotify to swap the 'code' for a 'token'
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

        // If it works, print the token to the black screen (Terminal)
        console.log('✅ IT WORKED! Here is your Access Token:');
        console.log(response.data.access_token);
        res.send('<h1>Login Successful! Check your terminal.</h1>');
    } catch (error) {
        res.send('Error during login: ' + error.message);
    }
});

// Turn on the server
app.listen(PORT, () => {
    console.log(`🚀 Server is running! Go to http://localhost:${PORT}/login`);
});