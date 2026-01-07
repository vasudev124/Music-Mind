const db = require('../db');

/**
 * Save computed analytics for a user
 * @param {string} userId - Spotify User ID
 * @param {Object} analytics - { topGenres: [], moodScore: number }
 */
async function saveAnalytics(userId, analytics) {
    const { topGenres, moodScore } = analytics;

    // Ensure topGenres is a JSON string or object depending on driver handling. 
    // pg handles objects for JSONB automatically.

    const query = `
        INSERT INTO analytics (user_id, top_genres, mood_score)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;

    try {
        const res = await db.query(query, [userId, JSON.stringify(topGenres), moodScore]);
        return res.rows[0];
    } catch (err) {
        console.error('Error saving analytics:', err);
        throw err;
    }
}

/**
 * Get latest analytics for a user
 */
async function getLatestAnalytics(userId) {
    const query = `
        SELECT * FROM analytics 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1;
    `;

    try {
        const res = await db.query(query, [userId]);
        return res.rows[0];
    } catch (err) {
        console.error('Error fetching analytics:', err);
        throw err;
    }
}

module.exports = {
    saveAnalytics,
    getLatestAnalytics
};
