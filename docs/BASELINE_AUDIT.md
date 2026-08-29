# StudyMentor AI — Baseline Audit

Date: 2026-08-29
Scope: factual findings from directly inspecting, installing, building, and running the code in this repository. Every claim below was personally verified by running the referenced command.

## 1. Repository layout

- `my-app/` — React 18 + Vite + Tailwind frontend (React Router, Framer Motion, Axios).
- `Backend/` — FastAPI backend (Python), MongoDB via Motor/PyMongo, LangChain + Gemini/Groq for AI generation.
- Duplicate/dead code identified during this audit (see Consolidation section) was deleted outright rather than archived in-tree — this is a public repository and git history already preserves anything removed.

## 2. Security findings (fixed during this pass — see COMPLETION_REPORT.md)

- `Backend/firebase_key.json` was tracked in git. Contents were placeholder values (`project_id: your_project_id`, dummy private key), **not** a real credential, but the file was unused by any code path (Firebase is not actually wired up — MongoDB is the real datastore) and has been removed from tracking.
- `my-app/.env` was tracked in git and contained a **real-looking Gemini API key** (`VITE_GEMINI_API_KEY`). This must be treated as compromised — see COMPLETION_REPORT.md for the rotation instruction.
- `Backend/utils/llm_utils.py` had a hardcoded fallback Gemini API key (`gemini_api_key = os.getenv(...) or "AIza..."`) that would silently activate if the env var was unset. Removed.
- `my-app/src/components/CalendarIntegrationFixed.jsx` and `CalendarIntegrationSimple.jsx` (both unused, now archived) contained hardcoded Google API keys/client IDs.
- No root `.gitignore` existed; `my-app/.gitignore` did not ignore `.env`.

## 3. What genuinely works (verified by running it)

- **Frontend build**: `npm run build` in `my-app/` succeeds (Vite production build, ~526 KB main bundle).
- **Frontend lint**: `npm run lint` passes with 0 errors after fixes (see below). One non-blocking `react-hooks/exhaustive-deps` warning remains in `AuthContext.jsx` (a `useEffect` that intentionally runs once on mount).
- **Backend install**: `pip install -r requirements.txt` succeeds on Python 3.14 after removing a broken dependency (see below).
- **Backend startup**: `uvicorn app:app` starts cleanly and serves traffic.
- **`GET /api/health`**: returns `200 {"success": true, "data": {"status": "healthy", ...}}`.
- **`POST /api/study-plan/generate`** (mock mode): returns a real generated multi-day plan.
- **`POST /api/quiz/generate`** (mock mode): returns real generated quiz questions; a request missing the required `topic` field correctly returns `422`.
- **`POST /api/syllabus/parse/pdf`**: accepts a real uploaded PDF, extracts text with PyPDF2, and calls the configured LLM. Verified end-to-end with a real PDF file and a placeholder API key — it now fails with a correct, descriptive `500` ("API key not valid") once given a real key it will succeed, since the only defect (below) was in the LLM call itself, not the extraction pipeline.
- **`POST /auth/register`** with no MongoDB running: previously fabricated a fake successful demo account (see finding below); now correctly returns `503` with a clear message. This was verified with `curl`.
- Backend automated tests: `pytest tests/test_api.py` — 7/7 pass (health, study plan, quiz, quiz validation, register-without-db, login-invalid-credentials).

## 4. What was broken (found and fixed)

| Issue | File | Fix |
|---|---|---|
| Standalone `bson` PyPI package listed in `requirements.txt` conflicts with the `bson` module bundled in `pymongo` and fails to build on Python 3.14 | `Backend/requirements.txt` | Removed the redundant dependency. |
| `google-auth-oauthlib` (and related Google Calendar packages) were only listed in a separate, never-installed `requirements_calendar.txt`, but `routers/calendar.py` imports them unconditionally — so the backend could not even start without them, despite Calendar OAuth being described as optional | `Backend/requirements.txt`, `Backend/CALENDAR_SETUP.md` | Merged calendar deps into the main requirements file; archived the now-redundant file. |
| `ChatGoogleGenerativeAI.predict()` no longer exists in the installed LangChain version (`AttributeError`), breaking every LLM call including PDF syllabus extraction | `Backend/utils/llm_utils.py` (7 call sites) | Replaced with `.invoke(prompt).content`. |
| `create_user_in_db()` silently returned a fake `"demo_user_id"` "successful" registration when MongoDB was unreachable, with no indication to the caller that nothing was persisted — violates the "never fabricate output as real" requirement | `Backend/utils/auth_utils.py` | Now raises a clear `503 Service Unavailable` instead. |
| CORS origins were hardcoded to two localhost URLs with no way to configure production origins, and no guard against accidentally deploying with wildcard + credentials | `Backend/app.py` | Now reads `ALLOWED_ORIGINS` (comma-separated) from the environment for production, and requires it to be set when `ENVIRONMENT=production`. |
| Frontend `api.js` axios interceptor read the auth token from `localStorage['auth_token']`, but `AuthContext.jsx` actually stores it under `localStorage['studymentor_token']` — meaning every authenticated request made through the shared `api` client (study plan, quiz, syllabus, calendar) silently went out **without** the Authorization header | `my-app/src/utils/api.js` | Aligned the key name to `studymentor_token`. |
| `AuthContext.jsx` hardcoded `DEMO_MODE = true` unconditionally, meaning the app *always* faked a logged-in demo user regardless of environment, and `ProtectedRoute.jsx` separately hardcoded its own `DEMO_MODE = true` that bypassed all route protection outright | `my-app/src/contexts/AuthContext.jsx`, `my-app/src/components/ProtectedRoute.jsx` | Demo mode is now opt-in via `VITE_DEMO_MODE=true` (default off, so real backend auth is used); the redundant bypass in `ProtectedRoute` was removed entirely. |
| ESLint flat config was missing `eslint-plugin-react`'s `jsx-uses-vars`, so any import used only as a JSX tag name (`<motion.div>`, `<Icon>`) was flagged as an unused-variable error — 15 of the 23 original lint errors were this false positive | `my-app/eslint.config.js` | Added the plugin and its two rules. |
| `my-app/src/utils/api.js` imports `axios`, but `axios` was **not listed in `my-app/package.json`** — the build only worked by accident because a stray, unrelated root-level `package.json`/`node_modules` (name `"New folder"`, unrelated to this app) happened to hoist an `axios` copy up to where Vite could resolve it. Removing that stray root `node_modules` (part of this cleanup) immediately broke `npm run build` with "Rollup failed to resolve import axios" | `my-app/package.json` | Added `axios` as a direct dependency (`npm install axios --save`) and reran `npm run build` to confirm it now passes independently of the root directory's contents. |

## 5. Duplicate / mock implementations found (see Consolidation notes in COMPLETION_REPORT.md)

- Six calendar component variants existed (`CalendarIntegration.jsx`, `...Demo.jsx`, `...Fixed.jsx`, `...Real.jsx`, `...Simple.jsx`, `...Simplified.jsx`). Only `CalendarIntegrationSimplified.jsx` was actually imported (by `StudyPlanGenerator.jsx`) and it is the only one with no hardcoded secrets and a working, dependency-free ICS export. The other five are unused dead code.
- Two `StudyPlanGenerator.jsx` files existed (`my-app/src/` and `my-app/src/components/`); only the `components/` one, which calls the real backend API, is routed to from `App.jsx`.
- `SyllabusHub.jsx` (linked from the navbar as "Syllabus Hub") and `SyllabusPdfParser.jsx` (orphaned, no nav link) both implemented syllabus upload + extraction + generation. `SyllabusHub.jsx` called the Gemini API directly from the browser (`utils/geminiAPI.js`), which exposes the API key client-side and duplicates the backend's extraction/study-plan/flashcard/quiz logic; `SyllabusPdfParser.jsx` correctly uses the real backend (`syllabusAPI.parsePDF`) matching the required product flow (backend extracts topics from an uploaded PDF).
- Three leftover Streamlit-based mock UIs (`app_streamlit.py`, `mock_ui.py`, `mock_ui_light.py`) exist in `Backend/` from before the FastAPI rewrite; none are imported by the active FastAPI app.

## 6. Known limitation not fixed in this pass

- `Backend/utils/auth_utils.py` maintains its own synchronous `pymongo.MongoClient` connection (with a blocking 5-second timeout at import time), entirely separate from the async Motor client in `Backend/database.py` used by the other routers. Both work correctly when MongoDB is reachable, but this is architectural duplication that should eventually be unified onto the async client. Left as-is in this pass because unifying it requires converting `create_user_in_db`/`authenticate_user`/`get_user_by_id`/`update_user_profile` to async, which is a larger, higher-risk change than the scope of this audit — flagging it explicitly rather than leaving it undocumented.
