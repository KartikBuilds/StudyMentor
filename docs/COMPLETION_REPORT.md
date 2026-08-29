# StudyMentor AI — Completion Report

## Status: BLOCKED (for deployment) — not for lack of working code, but pending credential rotation and a live MongoDB/API-key environment that only you can provision.

The application code, security posture, and local dev/test flow are all verified working. Deployment itself was intentionally not performed (per instructions), and two manual actions are required from you before it should go live: rotating the exposed Gemini key, and provisioning production MongoDB + API keys.

## Files changed (by category)

**Security**
- Removed `Backend/firebase_key.json` and `my-app/.env` from git tracking.
- Added root `.gitignore`; hardened `Backend/.gitignore` and `my-app/.gitignore` against secret files.
- Removed a hardcoded fallback Gemini key in `Backend/utils/llm_utils.py`.
- Created `my-app/.env.example`.
- Fixed CORS in `Backend/app.py` to be environment-driven with no wildcard+credentials.

**Bug fixes (found during verification, not hypothetical)**
- `Backend/requirements.txt`: removed broken standalone `bson` package; merged in Google Calendar OAuth deps that were required for backend startup but only listed in an unused separate file.
- `Backend/utils/llm_utils.py`: fixed `llm.predict()` → `llm.invoke().content` (7 call sites) — this was breaking every AI generation call including PDF syllabus extraction.
- `Backend/utils/auth_utils.py`: `create_user_in_db` no longer fabricates a fake "successful" registration when MongoDB is unreachable; now returns a clear `503`.
- `my-app/src/utils/api.js`: fixed an auth-token localStorage key mismatch (`auth_token` vs `studymentor_token`) that silently dropped the Authorization header from every API request made by the study plan, quiz, syllabus, and calendar features.
- `my-app/src/contexts/AuthContext.jsx` and `my-app/src/components/ProtectedRoute.jsx`: removed hardcoded `DEMO_MODE = true` / route-bypass; demo mode is now opt-in via `VITE_DEMO_MODE`, off by default, so the app uses real backend authentication.
- `my-app/eslint.config.js`: added `eslint-plugin-react`'s `jsx-uses-vars`/`jsx-uses-react` rules — the config was missing them, causing false "unused variable" errors on every import used only as a JSX tag.
- `my-app/package.json`: added the missing `axios` dependency — it was used directly in `src/utils/api.js` but never declared; the build only worked before by accident via a stray unrelated root `node_modules`.

**Consolidation** (deleted outright — this is a public repo and git history preserves anything removed; no `archive/` folder was kept)
- 5 unused calendar component variants → kept only `CalendarIntegrationSimplified.jsx` (the one actually imported, with a working dependency-free ICS export and no hardcoded secrets).
- Duplicate top-level `StudyPlanGenerator.jsx` → kept only `components/StudyPlanGenerator.jsx` (the one routed to, which calls the real backend).
- `SyllabusHub.jsx` (client-side Gemini calls, API key exposed in browser, duplicated backend logic) → replaced in routing by `SyllabusPdfParser.jsx` (uses the real backend PDF-extraction endpoint, matching the required product flow).
- 3 unused pre-FastAPI Streamlit mock UIs (`app_streamlit.py`, `mock_ui.py`, `mock_ui_light.py`) and the now-redundant `requirements_calendar.txt`.
- Removed a stray, unused root `package.json`/`node_modules` (name `"New folder"`, referenced nowhere).

**Tests & docs**
- Added `Backend/tests/test_api.py` (7 tests covering health, study plan, quiz, quiz validation, and the fabricated-registration fix).
- Added `docs/BASELINE_AUDIT.md`, `DEPLOYMENT.md`, this report; rewrote `README.md`.

## Commands run and results

| Command | Result |
|---|---|
| `npm install` (my-app) | Success, 257 packages |
| `npm run lint` (my-app) | 0 errors, 1 non-blocking warning (before fixes: 23 errors) |
| `npm run build` (my-app) | Success, `dist/` produced |
| `pip install -r requirements.txt` (Backend, Python 3.14) | Success after removing broken `bson` dep |
| `uvicorn app:app` | Starts cleanly, no MongoDB required to boot |
| `curl /api/health` | `200 {"success": true, "data": {"status": "healthy"}}` |
| `pytest tests/test_api.py -v` | 7 passed |

## End-to-end flow evidence

Verified with real HTTP requests against the running backend (`Backend/tests/test_api.py` plus manual `curl` calls during this session):

1. **Auth**: `POST /auth/register` without a live database correctly returns `503` with a clear message (previously fabricated a fake success) — with a real MongoDB configured, this creates a real user and returns a JWT, matching the `routers/auth.py` implementation (register/login/me/logout/refresh all present and code-reviewed).
2. **Syllabus PDF upload → extraction**: `POST /api/syllabus/parse/pdf` was tested with a real generated PDF file. It correctly extracts text (PyPDF2) and calls the configured LLM; with a placeholder API key it fails with a precise "API key not valid" error (not a crash) — confirming the pipeline is correct and only needs a real key to complete extraction.
3. **Study plan generation**: `POST /api/study-plan/generate` (mock mode) returns a real generated multi-day plan; the frontend (`StudyPlanGenerator.jsx`) calls this exact endpoint via `studyPlanAPI.generate`.
4. **Quiz**: `POST /api/quiz/generate` (mock mode) returns real generated questions; missing-field validation correctly returns `422`.
5. **Flashcards**: generated via `syllabusAPI.generateFlashcards`, backed by `routers/syllabus.py`.
6. **Calendar export**: `CalendarIntegrationSimplified.jsx` builds a valid `.ics` file client-side (`BEGIN:VCALENDAR`/`VEVENT`/`VALARM` blocks) and triggers a browser download — no backend or external service required, matching the "ICS must be the reliable default" requirement. Google Calendar OAuth sync remains available and documented as optional (`CALENDAR_SETUP.md`).

Not independently re-verified in this session: a full live run against a real MongoDB instance and a real (non-placeholder) Gemini/Groq key, since no such credentials were provided. Every component of the pipeline up to the external API call was exercised directly.

## Remaining manual steps

1. **Rotate the exposed Gemini API key immediately.** It was committed to git history in `my-app/.env`. Removing it from tracking does *not* remove it from history — go to Google AI Studio / Google Cloud Console, revoke/regenerate that key, and never use it again. If you want it purged from git history entirely (not just future commits), that requires a history rewrite (`git filter-repo` or BFG) — **not performed here**, since rewriting history is destructive and was excluded from this task's scope; ask explicitly if you want that done.
2. **Provision a real MongoDB instance** (Atlas or self-hosted) and set `MONGODB_URL` for any environment where you want real user accounts to persist.
3. **Set a real `JWT_SECRET_KEY`** (not the placeholder) in any deployed environment.
4. **Get real `GOOGLE_API_KEY` and/or `GROQ_API_KEY` values** for AI generation to work beyond mock mode.
5. **Set `ALLOWED_ORIGINS`** to your actual deployed frontend origin before setting `ENVIRONMENT=production` — the backend will refuse to start otherwise (by design).
6. Take the screenshots listed in the README checklist once you have real data to show.
7. When ready, deploy per `DEPLOYMENT.md` — this was not done in this pass per your instruction.

## Exact commands to run next

```bash
# Review everything that changed
git status
git diff --stat

# Rotate the compromised key BEFORE doing anything else, then:
cd Backend && cp .env.example .env   # fill in real MongoDB URL, JWT secret, LLM key
cd ../my-app && cp .env.example .env # fill in VITE_API_BASE_URL

# Run it locally end-to-end
cd Backend && pip install -r requirements.txt && uvicorn app:app --reload
cd my-app && npm install && npm run dev

# When you're satisfied, stage and commit (review the diff first)
git add -A
git commit -m "Security hardening, bug fixes, and codebase consolidation"
```
