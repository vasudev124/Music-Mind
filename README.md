# Music-Mind

Music-Mind is a personal analytics & recommendations app that analyzes a user's Spotify listening history and surfaces insights (top genres, mood score, top tracks) alongside recommendation tooling. The repository contains a Node/Express backend, a Vite-powered React frontend, and a Python-based data pipeline used for normalization, ETL, and future ML extensions.

## Table of contents
- Project overview
- Repository structure
- Key features
- Tech stack
- Quickstart — local development
  - Prerequisites
  - Backend setup
  - Frontend setup
  - Database & cache
  - Environment variables
- Deployment notes
- Troubleshooting — analytics / frontend shows no data
- Testing & debug endpoints
- Contributing
- License

## Project overview
Frontend requests analytics via a small API contract and renders dashboards and insight pages. Backend authenticates users via Spotify OAuth, handles analytics and recommendation logic, computes user-level insights (genres, mood score, top tracks), and exposes APIs to the frontend. A Python-based data pipeline processes and normalizes Spotify data and performs ETL into PostgreSQL, providing curated data that the backend uses during analytics computation.

## Repository structure
- /frontend — Vite + React frontend (hooks + components)
- /backend — Express server, services, utilities (analytics algorithm, db, cache, services)
- /data_pipeline — Python ETL scripts for Spotify data normalization and database loading
- /docs — API contract and documentation
- render.yaml — deployment manifest (used by Render or similar)

## Key features
- OAuth-based Spotify authentication
- API endpoint: GET /api/analytics/dashboard — returns `genres`, `moodScore`, `topTracks`, and `generatedAt`
- Persistent analytics save & retrieval (backend/services/analyticsService.js)
- Redis-based caching layer for read-heavy analytics endpoints (cacheService)
- Recommendation trigger endpoint (placeholder for future ML integration)
- Python data pipeline for normalization and ETL into PostgreSQL

## Tech stack
- Frontend: React, Vite, axios
- Backend: Node.js, Express, axios, cookie-session
- Database: PostgreSQL (used for persistent analytics and normalized Spotify data)
- Cache: Redis (optional, for caching dashboard responses)
- Data/ML: Python (ETL pipeline and future ML work)

## Quickstart — local development

### Prerequisites
- Node.js (>= 16), npm or yarn
- PostgreSQL (if you want database persistence)
- (Optional) Redis if using a Redis-backed cache
- Spotify developer account & app credentials (Client ID / Client Secret)

### Backend setup
1. Open a terminal and change into the backend directory:
   cd backend
2. Install dependencies:
   npm install
3. Create a `.env` file (see Environment variables below).
4. Start the backend:
   npm run dev
   or
   npm start
   (check `package.json` scripts in `/backend` for exact commands)

Notes:
- The backend uses cookie-based sessions and expects the session cookie to be sent by the browser for authenticated endpoints.
- If running the backend behind a proxy (Render/Heroku), configure `app.set('trust proxy', 1)` (see Troubleshooting).

### Frontend setup
1. Open a terminal and change into the frontend directory:
   cd frontend
2. Install dependencies:
   npm install
3. Set the build-time environment variable `VITE_BACKEND_URL` for local dev (e.g. in `.env.local` or exported in your shell):
   VITE_BACKEND_URL=http://localhost:8888
4. Start the Vite dev server:
   npm run dev

In production, ensure `VITE_BACKEND_URL` is set in the build environment and rebuild the frontend before deploying — this value is baked into the frontend bundle at build time.

## Database & cache
- PostgreSQL: stores normalized Spotify data and persisted analytics rows.
- Redis: optional caching layer for dashboard responses (configured via `cacheService` and `CACHE_URL`).

## Environment variables
Set these in your local `.env` (backend) and in the deployment environment.

Important (backend)
- PORT — server port (default 8888)
- SPOTIFY_CLIENT_ID (or CLIENT_ID) — Spotify app client ID
- SPOTIFY_CLIENT_SECRET — Spotify app client secret
- SESSION_SECRET (or COOKIE_SECRET) — secret used to sign cookie-session keys
- DATABASE_URL — PostgreSQL connection string (if using DB)
- FRONTEND_URL — Frontend origin used for CORS (e.g. `https://app.example.com`)
- CACHE_URL — Redis/other cache URL (optional)

Important (frontend / build-time)
- VITE_BACKEND_URL — full backend base URL (e.g. `https://api.example.com`) — baked into the frontend at build time

Tip: Review `backend/server.js` for exact env var names and any fallback names the server expects.

## Deployment notes
- If deploying static frontend (Netlify/Vercel/Render), ensure `VITE_BACKEND_URL` is set before building the frontend. Changing environment variables after a static build will not change an already-built bundle.
- Backend must allow CORS from your frontend origin and allow credentials (cookies) if using cookie-based sessions.
  - Example CORS config: origin: `FRONTEND_URL`, credentials: true
  - Do not set origin to `*` when credentials are used.
- If the backend is behind a proxy/load balancer (Render/Heroku):
  - In server code: `app.set('trust proxy', 1)`
  - Configure cookie-session with `secure: true` and `sameSite: 'none'` in production when using cross-site cookies over HTTPS
- If using Render, inspect `render.yaml` and set matching environment variables in the Render dashboard.

## Troubleshooting — analytics / frontend shows no data
Common causes and checks:
- Frontend was built with the wrong backend URL — check `VITE_BACKEND_URL` in the production build. If incorrect, rebuild the frontend with the correct value.
- CORS and credentials — frontend uses axios with `withCredentials: true`. Backend must respond with:
  - `Access-Control-Allow-Origin: <frontend-origin>`
  - `Access-Control-Allow-Credentials: true`
- Cookies / sessions not sent — for cross-site cookies you need:
  - HTTPS (secure cookies) in production
  - `sameSite: 'none'`
  - `app.set('trust proxy', 1)` if behind a proxy
- `checkAuth` failing — if the session cookie isn't present or `req.session.access_token` is missing, the dashboard endpoint will return unauthorized or an empty response.
- Server errors — check backend logs for keywords:
  - "Dashboard Error:" — dashboard generation error
  - "DB Save Error:" — DB persistence error
  - "Audio Features warning:" — Spotify audio-features call failed (non-fatal)
  - "⚡ Using Cached Dashboard" — confirms cache hit

If you hit failure, collect:
- Browser console errors (CORS / cookie / blocked requests)
- Network request/response for `GET /api/analytics/dashboard` (status code, response body, request/response headers, especially Cookie and Access-Control headers)
- Backend logs around the same timestamp

Sharing those details makes it straightforward to pinpoint the missing config.

## Testing & debug endpoints
- GET /test-panel — simple server-side debug page that can call `/api/analytics/dashboard` from the backend origin (helps isolate cookie/session issues)

Log messages to check:
- "⚡ Using Cached Dashboard" — cache hit
- "DB Save Error" — DB persistence error
- "Audio Features warning" — Spotify audio-features call failed (non-fatal)

## Contributing
Contributions welcome. Typical workflow:
1. Fork the repository
2. Create a feature branch
3. Implement changes and add tests where applicable
4. Open a PR with a clear description of the change and rationale

Please follow existing code style and update docs in `/docs` when changing API contracts.

## License
[Add license details here — e.g., MIT License]