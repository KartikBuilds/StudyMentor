# Google Calendar Integration Setup

## Prerequisites

1. **Google Cloud Console Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Calendar API for your project

2. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Desktop application" as the application type
   - Download the JSON file and rename it to `credentials.json`
   - Place it in the Backend directory

## Backend Setup

1. **Install Dependencies**
   ```bash
   cd Backend
   pip install -r requirements_calendar.txt
   ```

2. **Place Credentials File**
   ```
   Backend/
   ├── credentials.json  # Your OAuth2 credentials from Google Cloud Console
   ├── utils/
   │   └── calendar_utils.py
   └── routers/
       └── calendar.py
   ```

## Frontend Integration

The frontend components are already integrated:
- `CalendarIntegration.jsx` - Modal for calendar sync
- Updated `StudyPlanGenerator.jsx` with "Add to Calendar" button
- API endpoints in `utils/api.js`

## Usage

1. **Generate a Study Plan**
   - Use the Study Plan Generator to create your personalized plan

2. **Sync to Calendar**
   - Click "Add to Calendar" button
   - Choose your start date
   - Click "Sync to Google Calendar"
   - First-time users will be redirected to Google for authentication

3. **Features**
   - Creates study sessions in 3-hour blocks (Morning: 9 AM-12 PM, Afternoon: 2 PM-5 PM)
   - Adds detailed task descriptions to each event
   - Sets reminders (30 and 10 minutes before)
   - Creates events in a dedicated "StudyMentor" calendar

## API Endpoints

- `POST /api/calendar/sync` - Sync study plan to calendar
- `DELETE /api/calendar/events` - Remove existing StudyMentor events
- `GET /api/calendar/status` - Check authentication status

## Authentication Flow

1. First API call triggers OAuth flow
2. User redirects to Google for permission
3. Credentials stored in `token.json` for future use
4. Subsequent calls use stored token (auto-refresh when needed)

## Troubleshooting

1. **Authentication Errors**
   - Ensure `credentials.json` is in Backend directory
   - Check that Google Calendar API is enabled
   - Verify OAuth client ID is for "Desktop application"

2. **Permission Errors**
   - Make sure the Google account has calendar access
   - Check OAuth scopes in the consent screen

3. **API Quota Issues**
   - Google Calendar API has rate limits
   - For production, consider implementing retry logic

## Security Notes

- `credentials.json` contains client secrets - keep secure
- `token.json` contains user access tokens - exclude from version control
- Consider using environment variables for production deployment

## File Structure

```
Backend/
├── credentials.json          # OAuth2 credentials (not in repo)
├── token.json               # User access token (auto-generated)
├── requirements_calendar.txt # Google Calendar dependencies
├── utils/
│   └── calendar_utils.py    # Calendar integration logic
└── routers/
    └── calendar.py          # FastAPI endpoints
```