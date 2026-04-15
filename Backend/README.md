# Flashcards Backend

Node.js + Express backend for the Flashcards frontend.

## Features
- MongoDB via Mongoose
- Email/password auth with bcrypt
- JWT access tokens and refresh tokens
- Google login support via Google ID token verification
- CRUD APIs for flashcard sets
- Favorite/unfavorite and duplicate set support

## Setup
1. Copy `.env.example` to `.env`
2. Update `MONGO_URI`, `JWT_SECRET`, and `GOOGLE_CLIENT_ID`
3. Run:

```bash
npm install
npm run dev
```

## API base URL
`http://localhost:5000/api`

## Authentication routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`

## Set routes
- `GET /api/set`
- `GET /api/set/search?q=...`
- `GET /api/set/user/:userId`
- `GET /api/set/:id`
- `POST /api/set`
- `PUT /api/set/:id`
- `DELETE /api/set/:id`
- `POST /api/set/:id/duplicate`
- `POST /api/set/:id/favorite`
- `DELETE /api/set/:id/favorite`
