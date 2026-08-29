# StudyMentor AI

An AI-assisted study companion: upload a syllabus PDF, get extracted topics, generate a study plan, take an AI-generated quiz, review flashcards, and export your schedule to a calendar.

## Verified features

- Email/password authentication (register, login, JWT sessions) against a FastAPI + MongoDB backend.
- PDF syllabus upload and text extraction (`Backend/routers/syllabus.py`, using PyPDF2 - text-based PDFs only; scanned/image-only PDFs are not supported in production, see Environment variables below).
- AI-generated study plans, quizzes, and flashcards via Google Gemini or Groq (`LLM_PROVIDER`, configurable), with a `use_mock` flag for offline/demo testing without an API key.
- ICS calendar export (client-side, no external service required) so a generated study plan can be imported into Google Calendar, Outlook, or Apple Calendar.
- Optional Google Calendar OAuth sync (`Backend/CALENDAR_SETUP.md`) — the ICS export above is the reliable default and does not require this setup.
- An AI study-buddy chat assistant.

## Architecture

```
StudyMentor/
├── my-app/    React 19 + Vite + Tailwind frontend
└── Backend/   FastAPI backend (Python), MongoDB via Motor, LangChain (Gemini/Groq)
```

Frontend routes call the backend REST API (`my-app/src/utils/api.js`). Auth state lives in `my-app/src/contexts/AuthContext.jsx` and is off by default in demo mode — real requests go to the FastAPI backend.

## Local setup

### Backend

```bash
cd Backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt   # lean production deps; use requirements-dev.txt for local dev/tests (see Testing below)
cp .env.example .env   # fill in real values - see below
uvicorn app:app --reload --port 8000
```

Verify it's running: `curl http://localhost:8000/api/health`

`requirements.txt` is deliberately minimal (no local OCR, vector-search, or Streamlit dependencies) so the backend runs comfortably within 512 MB, e.g. on Render's free tier. Optional features degrade honestly rather than being silently faked or crashing at startup:
- Image-based OCR syllabus parsing reports "not available" if its packages aren't installed (PDF text extraction via PyPDF2 is unaffected and is the default, supported path).
- Google Calendar OAuth sync (`Backend/CALENDAR_SETUP.md`) only imports its dependencies if you actually configure `credentials.json`; the client-side ICS export is the reliable, dependency-free default.

### Frontend

```bash
cd my-app
npm install
cp .env.example .env   # fill in real values - see below
npm run dev
```

## Environment variables

Never commit `.env` files — only `.env.example` (variable names, no values) belongs in git.

**Backend** (`Backend/.env`, see `Backend/.env.example` for the full list):
- `MONGODB_URL` — MongoDB connection string
- `LLM_PROVIDER` — `gemini` (default) or `groq`. Only the selected provider's key is required, read, or imported — the other provider's SDK/credential is never touched.
- `GOOGLE_API_KEY` (if `LLM_PROVIDER=gemini`) or `GROQ_API_KEY` (if `LLM_PROVIDER=groq`) — or leave unset and pass `use_mock: true` in API requests for offline testing
- `JWT_SECRET_KEY` — a strong random secret, never the placeholder
- `ALLOWED_ORIGINS` — comma-separated production frontend origin(s); required when `ENVIRONMENT=production`

**Frontend** (`my-app/.env`, see `my-app/.env.example`):
- `VITE_API_BASE_URL` — backend URL (defaults to `http://localhost:8000`)
- `VITE_DEMO_MODE` — optional, off by default; set to `true` for an offline demo with mock auth and no real backend/AI calls

There is intentionally no Gemini/AI API key variable on the frontend. The AI Study Buddy chat and all other AI features call the backend (`POST /api/ai/chat`, etc.), which holds the real key server-side — the key is never bundled into the browser.

## Testing

```bash
# Backend - requirements-dev.txt adds pytest/httpx and the Groq SDK
# (needed to test the LLM_PROVIDER=groq code path) on top of the lean
# production requirements.txt
cd Backend && source venv/bin/activate
pip install -r requirements-dev.txt
pytest tests/ -v

# Frontend
cd my-app && npm run lint && npm run build
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for frontend hosting, backend hosting, environment configuration, health checks, and production CORS setup.

## Screenshot checklist (for portfolio use)

When capturing screenshots for a portfolio presentation, include:

- [ ] Dashboard / home screen after login
- [ ] PDF syllabus upload and extracted-topics view
- [ ] Generated study plan
- [ ] Quiz in progress and results
- [ ] Flashcards view
- [ ] Calendar export (ICS download or Google Calendar sync)

## Clone

```bash
git clone https://github.com/KartikBuilds/StudyMentor.git
```

## Security note

If you're setting this up from a clone made before 2026-08-29, rotate any API keys immediately — an earlier commit in this repository's history contained a live Gemini API key and hardcoded Google API keys in unused calendar components. See `docs/COMPLETION_REPORT.md` for the full account of what was found and fixed.
