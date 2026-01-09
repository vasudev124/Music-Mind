const db = require('../db');

/**
 * Search users by display name (partial match)
 * @param {string} query 
 * @param {string} currentUserId - to exclude self
 */
async function searchUsers(query, currentUserId) {
    const sql = `
        SELECT spotify_id, display_name 
        FROM users 
        WHERE display_name ILIKE $1 
        AND spotify_id != $2
        LIMIT 10;
    `;
    const res = await db.query(sql, [`%${query}%`, currentUserId]);
    return res.rows;
}

/**
 * Send a friend request
 */
async function sendRequest(requesterId, receiverId) {
    // Check if reverse request exists
    const checkSql = `SELECT * FROM friends WHERE requester_id = $1 AND receiver_id = $2`;
    const checkRes = await db.query(checkSql, [receiverId, requesterId]);

    if (checkRes.rows.length > 0) {
        // Use separate accept logic or auto-accept here?
        // For now, fail or tell user to accept.
        throw new Error('Friend request already exists from this user. Please accept it.');
    }

    const sql = `
        INSERT INTO friends (requester_id, receiver_id, status)
        VALUES ($1, $2, 'pending')
        RETURNING *;
    `;
    return (await db.query(sql, [requesterId, receiverId])).rows[0];
}

/**
 * Get all friends (accepted status)
 */
async function getFriends(userId) {
    const sql = `
        SELECT u.spotify_id, u.display_name
        FROM friends f
        JOIN users u ON (u.spotify_id = f.requester_id OR u.spotify_id = f.receiver_id)
        WHERE (f.requester_id = $1 OR f.receiver_id = $1)
        AND f.status = 'accepted'
        AND u.spotify_id != $1;
    `;
    const res = await db.query(sql, [userId]);
    return res.rows;
}

/**
 * Compare two users' music tastes
 */
async function compareUsers(userId1, userId2) {
    // Fetch latest analytics for both
    const sql = `
        SELECT user_id, top_genres, mood_score 
        FROM analytics 
        WHERE user_id IN ($1, $2)
        ORDER BY created_at DESC
    `;
    const res = await db.query(sql, [userId1, userId2]);
    const data = res.rows;

    const user1Data = data.find(r => r.user_id === userId1);
    const user2Data = data.find(r => r.user_id === userId2);

    if (!user1Data || !user2Data) {
        return { error: 'One or both users have no analytics data generated yet.' };
    }

    // 1. Calculate Genre Overlap
    const genres1 = user1Data.top_genres.map(g => g.genre);
    const genres2 = user2Data.top_genres.map(g => g.genre);
    const commonGenres = genres1.filter(g => genres2.includes(g));
    const overlapScore = (commonGenres.length / Math.max(genres1.length, genres2.length)) * 100;

    // 2. Mood Difference
    const moodDiff = Math.abs(user1Data.mood_score - user2Data.mood_score);
    const moodSimilarity = Math.max(0, 100 - moodDiff);

    // 3. Overall Compatibility
    const compatibility = (overlapScore * 0.7) + (moodSimilarity * 0.3);

    return {
        compatibility: Math.round(compatibility),
        commonGenres,
        moodDifference: Math.round(moodDiff),
        targetUserMood: user2Data.mood_score
    };
}

module.exports = {
    searchUsers,
    sendRequest,
    getFriends,
    compareUsers
};
