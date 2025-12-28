# Music Mind Backend

This is the backend server for the Music Mind application, utilizing the Spotify API.

## Features
- Spotify Authentication (Login & Callback)
- Access Token retrieval

## Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with your Spotify credentials:
   ```env
   CLIENT_ID=your_spotify_client_id
   CLIENT_SECRET=your_spotify_client_secret
   REDIRECT_URI=http://localhost:8888/callback
   PORT=8888
   ```
4. Start the server:
   ```bash
   node server.js
   ```
5. NOTHING BEATS A JET 2 A HOLIDAY

## API Endpoints
- **GET /login**: Initiates Spotify OAuth flow.
- **GET /callback**: Handles the callback from Spotify and retrieves the access token.


