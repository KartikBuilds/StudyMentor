# StudyMentor AI

An AI-powered study companion that transforms syllabi into structured learning plans. Upload a PDF, extract topics, generate personalized study schedules, take AI-generated quizzes, review flashcards, and export your calendar.

## Live application

- **Frontend**: https://study-mentor-sepia.vercel.app
- **Backend health**: https://studymentor-backend-6ltv.onrender.com/api/health

## Features

- **Authentication**: Email/password registration and login with JWT sessions
- **Syllabus parsing**: Upload PDF syllabi and extract topics (text-based PDFs supported)
- **AI-generated content**: Study plans, quizzes, and flashcards powered by Google Gemini (configurable LLM provider)
- **Calendar export**: Download study schedules as ICS files for import into Google Calendar, Outlook, or Apple Calendar
- **Study buddy**: Real-time AI chat assistant for learning questions
- **Flexible setup**: Optional Google Calendar OAuth sync; default reliable export requires no external configuration

## Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: FastAPI (Python) with async MongoDB (Motor)
- **LLM**: Google Gemini or Groq (configurable via `LLM_PROVIDER` environment variable)
- **Auth**: JWT-based with bcrypt password hashing

All AI API keys remain server-side only. Frontend calls route through the backend (`/api/ai/chat` and related endpoints); no AI credentials are exposed to the browser.

## Quick start

### Backend

```bash
cd Backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Configure MONGODB_URL, LLM_PROVIDER, and GOOGLE_API_KEY
uvicorn app:app --port 8000
```

Verify: `curl https://studymentor-backend-6ltv.onrender.com/api/health`

### Frontend

```bash
cd my-app
npm install
cp .env.example .env  # Configure VITE_API_BASE_URL
npm run dev
```

## Environment variables

Never commit `.env` files. See `.env.example` in each directory for all options.

**Backend essentials**: `MONGODB_URL`, `LLM_PROVIDER` (gemini or groq), provider API key, `JWT_SECRET_KEY`, `ALLOWED_ORIGINS` (production only)

**Frontend essentials**: `VITE_API_BASE_URL` (backend URL), `VITE_DEMO_MODE` (off by default for real mode)

## Testing

```bash
cd Backend && pip install -r requirements-dev.txt && pytest tests/ -v
cd my-app && npm run lint && npm run build
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup, CORS configuration, and cloud hosting guidance.

## License

Open source — use for learning, portfolios, and production deployments.
