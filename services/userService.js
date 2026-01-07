const db = require('../db');

/**
 * Upsert user: Create if new, update token if exists.
 * @param {Object} spotifyProfile - Profile data from Spotify API
 * @param {string} refreshToken - The refresh token to store
 */
async function upsertUser(spotifyProfile, refreshToken) {
    const { id, display_name } = spotifyProfile;

    const query = `
        INSERT INTO users (spotify_id, display_name, refresh_token, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (spotify_id) 
        DO UPDATE SET 
            display_name = EXCLUDED.display_name,
            refresh_token = EXCLUDED.refresh_token,
            updated_at = NOW()
        RETURNING *;
    `;

    try {
        const res = await db.query(query, [id, display_name, refreshToken]);
        return res.rows[0];
    } catch (err) {
        console.error('Error upserting user:', err);
        throw err;
    }
}

/**
 * Get user by Spotify ID
 * @param {string} spotifyId 
 */
async function getUser(spotifyId) {
    try {
        const res = await db.query('SELECT * FROM users WHERE spotify_id = $1', [spotifyId]);
        return res.rows[0];
    } catch (err) {
        console.error('Error fetching user:', err);
        throw err;
    }
}

module.exports = {
    upsertUser,
    getUser
};
