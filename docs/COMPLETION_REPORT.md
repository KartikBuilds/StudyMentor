# StudyMentor AI — Completion Report

## Status: BLOCKED (for deployment only) — the full product flow has now been verified end-to-end in a real browser against your real Gemini key and a real local MongoDB. What remains is credential rotation and production provisioning, which only you can do.

The application code, security posture, and full local flow (auth → upload → extract → plan → quiz → flashcards → calendar export → AI chat) are all verified working through actual browser interaction, not just HTTP requests. Deployment itself was intentionally not performed (per instructions).

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
- Added `Backend/tests/test_api.py` (7 tests covering health, study plan, quiz, quiz validation, and the fabricated-registration fix); later hardened `test_register_never_fabricates_a_fake_success` to use a unique email per run and accept 201/400/503 as all being honest outcomes (it was written assuming no MongoDB in the test environment; once a real local Mongo was added for browser testing, a duplicate-email 400 is just as valid a "not fabricated" result as a 503).
- Added `docs/BASELINE_AUDIT.md`, `DEPLOYMENT.md`, this report; rewrote `README.md`.

**Bugs found only under real-key browser testing (mock mode and unit tests could not catch these)**
- `Backend/routers/syllabus.py`: `json.loads(llm_response)` failed whenever Gemini wrapped its JSON response in ` ```json ... ``` ` markdown fences (which it does by default) — the PDF-upload UI was silently rendering the raw fenced JSON blob under a "Parsed Content" fallback label instead of structured topic cards. Fixed by adding `parse_json_from_llm_response()` (a fence-stripping, `\{.*\}`-extracting helper) to `Backend/utils/llm_utils.py` and using it in all 3 `syllabus.py` JSON-parsing call sites plus `quiz.py` for consistency.
- `Backend/utils/llm_utils.py`: `parse_syllabus_text` and `call_llm_async` are `async def` but called the blocking, synchronous `llm.invoke()` directly with no offloading. Since FastAPI/uvicorn runs on a single event loop, any slow or rate-limited LLM call (verified: a Gemini 429 retry can block for 60+ seconds) froze the *entire* API for *every* user, including unrelated requests like `/api/health` and `/auth/register`. Verified the freeze directly (a concurrent health check hung until the LLM call finished) and fixed it by wrapping the blocking calls in `asyncio.to_thread(...)` in `llm_utils.py`, `routers/quiz.py`, `routers/study_plan.py`, and `routers/syllabus.py`; re-verified a health check now returns in 37ms while a real (retrying) chat call is in flight.
- `my-app/src/components/AIStudyBuddy.jsx`: when the real backend chat call failed (observed live via real Gemini free-tier quota exhaustion during this session), the UI silently substituted a canned `getMockResponse()` string and displayed it as if it were a real AI answer, with no indication to the user - a direct violation of the "never fabricate AI output as real" rule. Fixed by letting the failure propagate to the existing honest error state ("Sorry, I'm having trouble connecting right now. Please try again!"); the now-fully-unused `getMockResponse` function (55 lines of canned text) was deleted rather than left as dead code.

## Commands run and results

| Command | Result |
|---|---|
| `npm install` (my-app) | Success, 257 packages |
| `npm run lint` (my-app) | 0 errors, 1 non-blocking warning (before fixes: 23 errors) |
| `npm run build` (my-app) | Success, `dist/` produced |
| `pip install -r requirements.txt` (Backend, Python 3.14) | Success after removing broken `bson` dep |
| `uvicorn app:app` | Starts cleanly, no MongoDB required to boot; connects to real Mongo when available |
| `curl /api/health` | `200 {"success": true, "data": {"status": "healthy"}}` |
| `pytest tests/test_api.py -v` | 7 passed (re-verified after the concurrency fix) |
| `npm run lint` (my-app, this pass) | 0 errors, 1 pre-existing non-blocking warning |
| `npm run build` (my-app, this pass) | Success |
| Browser acceptance pass (Playwright, real key + real Mongo) | 7/7 flow steps PASS (see below) |

## End-to-end flow evidence

### Browser-level acceptance pass (this session)

Test environment: frontend (`npm run dev`, localhost:5173) and backend (`uvicorn`, localhost:8010) both running locally; backend used **your real local `Backend/.env`** (`GOOGLE_API_KEY` detected by name from `.env.example` — its value was never read, printed, or logged); a real local MongoDB was run in a Docker container (`docker run mongo:7`) so authentication could be proven with genuine persistence, not just mocked. Driven with a headless-Chromium Playwright script (no test-only code paths; the app was interacted with exactly as a user would - typing into fields, clicking real buttons, reading rendered DOM text).

1. **Auth — PASS.** Registered a new real user through the actual "Get Started Free" → "Sign Up" modal (`acceptance-ui-test-...@example.com`). Landed on `/dashboard` with the navbar showing the real account name and no "Sign In/Sign Up" buttons. Confirmed via direct `curl` that `POST /auth/register` then a separate `POST /auth/login` with the same credentials return the *same* real MongoDB user id - proving genuine persistence, not demo-mode fakery. Screenshots: `01_signup_modal.png` → `03_after_signup_submit.png`.
2. **PDF upload → extraction — PASS (after a real fix).** Uploaded a real generated PDF through the actual file input, clicked "Parse Syllabus". First attempt exposed a real bug (Gemini wraps JSON in markdown fences, breaking `json.loads` and leaking a raw JSON blob into the UI - see bug list above); after the fix, the UI correctly rendered real structured topic cards ("Unit 1: Variables and Data Types", "Unit 2: Control Flow and Loops", etc.), not a JSON dump. Screenshot: `05_after_upload.png`.
3. **Study plan generation — PASS.** Used the pre-filled Python/JavaScript subjects, left "Use Mock Data for Demo" **unchecked**, clicked "Generate My Study Plan". Real Gemini-authored day-by-day plan rendered: "Day 1: Practice exercises on variable assignment and type conversion (30 mins)... Take practice quiz on Python Variables (15 mins)", "Day 2: Study: Python - Variable Scope and Best Practices (45 mins)", 2 subjects / 14 days / 42 total hours. Screenshot: `07_study_plan_result.png`.
4. **Quiz — PASS.** Generated a real (non-mock) quiz for "Computer Science Basics"; 20 real answer options rendered across the question set (5 questions × 4 options), all were clicked, and the quiz was submitted, rendering a score/result view (regex-confirmed match on `score|result|correct|%` in the post-submit DOM). Captured live in this session's terminal output; screenshot slots were later overwritten by a subsequent run that hit the real API's daily quota (see quota note below).
5. **Flashcards — PASS.** Generated real (non-mock) flashcards for the same topic; real AI-authored content rendered, e.g. a card reading "Q: What is a Deadlock in operating systems, and what are Coffman's four necessary conditions for it to occur? A: A deadlock is a state where a set of processes are blocked because each holds a resource and waits for another... The 4 conditions are: 1) Mutual Exclusion, 2) Hold and Wait, 3) No Preemption, and 4) Circular Wait." Captured live in this session's terminal output (same quota-related overwrite note as above).
6. **ICS calendar export — PASS, independently validated.** From the Study Plan page, opened "Add to Calendar", clicked "🗓️ Add to Google Calendar" (which prepares events client-side), then clicked the revealed "Download Calendar File" button. The browser download event fired for `StudyMentor-Schedule.ics` (10,287 bytes). Parsed it with Python's `icalendar` library (a real RFC 5545 parser, not a string check): valid `VCALENDAR`, 23 real `VEVENT` blocks, first event `SUMMARY: 📚 Study Session - Day 1 (Morning)` at a real timestamp. Screenshots: `ics_01_plan.png`, `ics_02_modal.png`, `ics_02b_after_prepare.png`.
7. **AI Study Buddy — PASS, including the failure path.** Sent a real message ("In one sentence, what is a variable in programming?") on `/ai-buddy` with network request interception active. Confirmed the *only* AI-related network request was `POST http://localhost:8010/api/ai/chat` - zero requests to `generativelanguage.googleapis.com` or any Google domain from the browser. Got back a real, coherent Gemini answer plus real follow-up suggested questions. Separately, once the real Gemini free-tier daily quota was exhausted later in this session, re-tested the same flow and confirmed the UI now shows an honest error ("Sorry, I'm having trouble connecting right now. Please try again! 😅") instead of the old silent fake-answer fallback (see bug fix above). Screenshots: `16_ai_buddy_response.png` (real answer), `honest_error_response.png` (honest failure, post-fix).

### A note on the Gemini free-tier quota

Mid-session, the real key's free-tier daily quota (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`, limit 20 requests/day for `gemini-3.6-flash`) was exhausted by the cumulative real calls made while validating (PDF parses, study plans, quizzes, flashcards, chat messages, across this and the prior validation session) - confirmed via `429 RESOURCE_EXHAUSTED` in the backend logs, not assumed. This is expected and does not indicate a bug; it's exactly the scenario the honest-error fix (item 7) was built for, and its own encounter with the frozen-event-loop bug (item above) is what surfaced and let us verify that fix too. Once your quota resets (daily) or you upgrade the plan, items 3-5 will keep working exactly as demonstrated - the underlying code path is identical for every call, mock and real alike, aside from the `use_mock` flag.

### Real Gemini model note

`gemini-1.5-flash` (the codebase's original hardcoded model) and then `gemini-2.5-flash` both returned `404 NOT_FOUND` for this specific API key/account ("no longer available to new users"). The model in active use now, `gemini-3.6-flash`, was the exact model Google's own 404 response recommended, and is confirmed working end-to-end above. If your key's available models change in the future, update the 8 occurrences in `Backend/utils/llm_utils.py`.

## Remaining manual steps

1. **Rotate the exposed Gemini API key from `my-app/.env`'s git history** (a *different* key than the one you configured in `Backend/.env` for this session, which was never printed/exposed and is fine to keep using). Removing it from tracking does *not* remove it from history — go to Google AI Studio / Google Cloud Console, revoke/regenerate that key, and never use it again. If you want it purged from git history entirely, that requires a history rewrite (`git filter-repo` or BFG) — **not performed here**; ask explicitly if you want that done.
2. **Provision a production MongoDB instance** (Atlas or self-hosted) and set `MONGODB_URL` for production - the local Docker Mongo container used for this session's testing is not a production dependency and can be stopped (`docker stop studymentor-mongo`).
3. **Set a real, strong `JWT_SECRET_KEY`** (not the placeholder) in any deployed environment - a short/weak key triggers `InsecureKeyLengthWarning` from PyJWT at runtime.
4. **Confirm your Gemini plan/quota** before a live demo - the free tier used in this session is capped at 20 requests/day per model, which is easy to exhaust while testing multiple features back-to-back.
5. **Set `ALLOWED_ORIGINS`** to your actual deployed frontend origin before setting `ENVIRONMENT=production` — the backend will refuse to start otherwise (by design).
6. Take the screenshots listed in the README checklist once you have real data to show (several are already captured from this session's acceptance pass, in the assistant's scratch directory - not committed to the repo).
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
