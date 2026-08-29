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
   - `LLM_PROVIDER` — `gemini` (default) or `groq`; only that provider's key is required/used
   - `GOOGLE_API_KEY` (if `LLM_PROVIDER=gemini`) or `GROQ_API_KEY` (if `LLM_PROVIDER=groq`)
   - `ENVIRONMENT=production`
   - `ALLOWED_ORIGINS` — comma-separated list of your deployed frontend origin(s), e.g. `https://studymentor.example.com`. The backend **refuses to start** in production without this set (see `Backend/app.py`), and never uses a wildcard origin.
   - `DEBUG=False`
3. **Install dependencies**: `pip install -r Backend/requirements.txt`. This is a deliberately lean, production-only dependency set (no ML/OCR/vector-search stack) sized to fit low-memory free tiers like Render's 512 MB web service - typical runtime RSS is under 150 MB. For local development or to test the alternate Groq provider path, use `pip install -r Backend/requirements-dev.txt` instead, which layers test tooling and the Groq SDK on top.
4. **Run the server**: `uvicorn app:app --host 0.0.0.0 --port $PORT` (from the `Backend/` directory). Most PaaS providers (Render, Railway) auto-detect this from a `Procfile` or start command field — set the start command to the line above.
5. **Health check**: point your platform's health check at `GET /api/health`. It returns `200` with `{"success": true, "data": {"status": "healthy"}}` once the app is up — this does not depend on MongoDB being reachable, so a green health check does not by itself guarantee database connectivity; check logs for `MongoDB connected successfully` on boot.
6. Google Calendar OAuth (`Backend/CALENDAR_SETUP.md`) is optional and its dependencies are **not** in `requirements.txt` — `utils/calendar_utils.py` imports them lazily and only if a real `credentials.json` is present. The reliable default that needs no backend dependency at all is the client-side ICS export in `CalendarIntegrationSimplified.jsx`.
7. Image-based OCR syllabus parsing is likewise not installed in production - PDF text extraction (PyPDF2) is the default and only supported syllabus-upload path. An OCR call without the optional packages installed returns an honest "not available" message rather than crashing or faking extraction.

## Frontend deployment

1. **Set environment variables** at build time (see `my-app/.env.example`):
   - `VITE_API_BASE_URL` — the deployed backend's public URL, e.g. `https://api.studymentor.example.com`
   - `VITE_DEMO_MODE` — optional, leave `false`/unset for production

   Never add a Gemini/Groq API key as a `VITE_`-prefixed variable. Any `VITE_` variable is compiled into the static JS bundle and is publicly visible to anyone who opens devtools — there is no server boundary protecting it. All AI calls are routed through the backend (`POST /api/ai/chat` and friends), which holds `GOOGLE_API_KEY`/`GROQ_API_KEY` server-side only.
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
