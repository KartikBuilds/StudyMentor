# StudyMentor AI Integration Setup Guide

## Backend Setup

1. **Install Python Dependencies**
   ```bash
   cd Backend
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your API keys:
   # - Get Gemini API key from: https://aistudio.google.com/app/apikey
   # - Set LLM_PROVIDER=gemini
   # - Add your MongoDB URL if using database features
   ```

3. **Start the Backend Server**
   ```bash
   python app.py
   ```
   
   The API will be available at: http://localhost:8000
   API Documentation: http://localhost:8000/docs

## Frontend Setup

1. **Install Node.js Dependencies**
   ```bash
   cd my-app
   npm install
   ```

2. **Configure Frontend Environment**
   ```bash
   # The .env file is already created with:
   REACT_APP_API_BASE_URL=http://localhost:8000
   ```

3. **Start the Frontend**
   ```bash
   npm run dev
   ```
   
   The app will be available at: http://localhost:5173

## AI Features Available

### 1. AI Study Buddy Chat
- Real-time conversation with Gemini AI
- Context-aware responses
- Study assistance and explanations
- Available at: `/ai-study-buddy`

### 2. Syllabus Processing Pipeline
- Upload syllabus files (PDF, TXT)
- AI-powered content analysis
- Automatic generation of:
  - Personalized study plans
  - Intelligent flashcards
  - Adaptive quizzes
- Available at: `/syllabus-hub`

## API Endpoints

### Chat Endpoints
- `POST /api/ai/chat` - Chat with AI study buddy

### Syllabus Processing
- `POST /api/ai/syllabus/analyze` - Analyze uploaded syllabus
- `POST /api/ai/syllabus/{id}/generate-study-plan` - Generate study plan
- `POST /api/ai/syllabus/{id}/generate-flashcards` - Generate flashcards
- `POST /api/ai/syllabus/{id}/generate-quizzes` - Generate quizzes

### Health Check
- `GET /api/health` - Check API status

## Getting Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the generated key
4. Add it to your Backend/.env file as `GOOGLE_API_KEY=your-key-here`

## Troubleshooting

### Backend Issues
- Check if port 8000 is available
- Verify your Gemini API key is valid
- Check console logs for detailed error messages

### Frontend Issues
- Ensure backend is running on http://localhost:8000
- Check browser console for API connection errors
- Verify CORS settings if running on different ports

### AI Response Issues
- Verify `LLM_PROVIDER=gemini` in backend .env
- Check API key is correctly set
- Review backend logs for LLM-related errors

## Demo Mode

The application includes demo mode with:
- Mock authentication (bypasses login)
- Fallback responses if AI API is unavailable
- Sample data for testing UI components

To enable full AI features, ensure your Gemini API key is properly configured.