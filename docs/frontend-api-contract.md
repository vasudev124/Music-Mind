# MusicMind – Frontend API Contract (Phase 2)

This document defines the API contract between the **Frontend** and **Backend**
for Phase 2 of the MusicMind application.

The purpose of this contract is to ensure a clear and stable agreement on:
- API endpoints
- Request methods
- Response data structures

---

## 1. Authentication API

### Endpoint
GET /auth/login

### Purpose
Redirects the user to Spotify OAuth login.

### Notes
- No response body is required.
- After successful login, the backend should redirect the user back to the frontend dashboard.
- Authentication is maintained using session cookies or JWT.

---

## 2. Analytics Dashboard API

### Endpoint
GET /analytics

### Purpose
Returns processed analytics data required to render the user dashboard.

### Authentication
Requires authenticated user.

### Response (200 OK)
```json
{
  "topArtists": [
    {
      "name": "The Weeknd",
      "image": "https://image-url",
      "playCount": 120
    }
  ],
  "topGenres": [
    {
      "genre": "Pop",
      "percentage": 35
    }
  ]
}
