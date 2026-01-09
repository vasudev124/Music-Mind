-- Users Table: Stores Spotify user details and tokens
CREATE TABLE IF NOT EXISTS users (
    spotify_id VARCHAR(255) PRIMARY KEY,
    display_name VARCHAR(255),
    refresh_token TEXT, -- Encrypted or raw (ensure security in production)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics Table: Stores computed analytics for a user
CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(spotify_id) ON DELETE CASCADE,
    top_genres JSONB, -- Storing array of genres as JSON
    mood_score FLOAT, -- Computed float value
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recommendations Table: Stores history of recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(spotify_id) ON DELETE CASCADE,
    playlist_data JSONB, -- Snapshot of the recommended playlist
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Friends Table: Stores bi-directional friendships
CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    requester_id VARCHAR(255) REFERENCES users(spotify_id) ON DELETE CASCADE,
    receiver_id VARCHAR(255) REFERENCES users(spotify_id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, receiver_id)
);
