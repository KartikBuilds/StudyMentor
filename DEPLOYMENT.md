# Deployment Guide

This describes how to deploy StudyMentor AI to production. No deployment has been performed by this guide's author — these are configuration instructions only.

## Architecture

- **Frontend**: static React/Vite build — deploy to any static host (Vercel, Netlify, Cloudflare Pages, S3+CloudFront).
- **Backend**: FastAPI app — deploy to any ASGI-capable host (Render, Railway, Fly.io, a VM/container running `uvicorn`/`gunicorn`).
- **Database**: MongoDB — use MongoDB Atlas (managed) or a self-hosted instance reachable from the backend host.

## Backend deployment

1. **Provision MongoDB** (e.g. MongoDB Atlas) and note the connection string.
2. **Set environment variables** on the host (see `Backend/.env.example` for the full list). At minimum for production:
   - `MONGODB_URL` — your Atlas/production connection string
   - `JWT_SECRET_KEY` — a strong random secret (never the placeholder value)
   - `GOOGLE_API_KEY` and/or `GROQ_API_KEY` — real LLM provider keys
   - `ENVIRONMENT=production`
   - `ALLOWED_ORIGINS` — comma-separated list of your deployed frontend origin(s), e.g. `https://studymentor.example.com`. The backend **refuses to start** in production without this set (see `Backend/app.py`), and never uses a wildcard origin.
   - `DEBUG=False`
3. **Install dependencies**: `pip install -r Backend/requirements.txt`.
4. **Run the server**: `uvicorn app:app --host 0.0.0.0 --port $PORT` (from the `Backend/` directory). Most PaaS providers (Render, Railway) auto-detect this from a `Procfile` or start command field — set the start command to the line above.
5. **Health check**: point your platform's health check at `GET /api/health`. It returns `200` with `{"success": true, "data": {"status": "healthy"}}` once the app is up — this does not depend on MongoDB being reachable, so a green health check does not by itself guarantee database connectivity; check logs for `MongoDB connected successfully` on boot.
6. Google Calendar OAuth (`Backend/CALENDAR_SETUP.md`) is optional; the reliable default is the client-side ICS export in `CalendarIntegrationSimplified.jsx`, which requires no backend configuration.

## Frontend deployment

1. **Set environment variables** at build time (see `my-app/.env.example`):
   - `VITE_API_BASE_URL` — the deployed backend's public URL, e.g. `https://api.studymentor.example.com`
   - `VITE_GEMINI_API_KEY` — only if you intentionally want the AI Study Buddy chat feature to call Gemini directly from the browser; otherwise leave unset. This key **will be visible in the built JS bundle** since it's a Vite `VITE_` variable — do not use a key with billing limits you're not comfortable exposing.
2. **Build**: `npm ci && npm run build` inside `my-app/`. Output is `my-app/dist/`.
3. **Deploy** the `dist/` folder to your static host. Configure the host to serve `index.html` for all routes (SPA fallback) since this is a client-side-routed React app.

## Production CORS

`Backend/app.py` always allows `http://localhost:3000` and `http://localhost:5173` (dev), plus whatever is listed in `ALLOWED_ORIGINS`. It never allows `*` combined with credentials. If you add a new frontend deployment (e.g. a staging URL), add it to `ALLOWED_ORIGINS`.

## Verifying a deployment

1. `curl https://<backend-host>/api/health` → expect `200`.
2. Load the frontend, register/login (or sign in) — confirm it hits the real backend (open browser devtools Network tab, confirm requests go to `VITE_API_BASE_URL`, not `localhost`).
3. Upload a real PDF syllabus, generate a study plan, take a quiz, generate flashcards, and export the schedule as an `.ics` file — confirm each step calls the backend and none show a mock/demo indicator (unless demo mode was intentionally enabled).

## Secrets rotation

Before deploying, rotate the Gemini API key that was previously committed to this repository's git history (`my-app/.env`, historical commits) — see `docs/COMPLETION_REPORT.md` for details. Never reuse that key in production.
