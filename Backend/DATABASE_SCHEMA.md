# StudyMentor MongoDB Database Schema

## 🗄️ **Database: studymentor**

### **Collections Overview:**

```javascript
// Database Structure
studymentor/
├── users/              # User profiles and authentication
├── syllabi/            # Uploaded syllabus documents
├── study_plans/        # AI-generated study plans
├── quizzes/           # Quiz templates and instances
├── quiz_attempts/      # User quiz attempts and results
├── study_sessions/     # Individual study session records
├── user_progress/      # Aggregated progress tracking
└── notifications/      # User notifications and alerts
```

---

## 📋 **Collection Schemas:**

### **1. Users Collection**
```javascript
{
  "_id": ObjectId("..."),
  "email": "user@example.com",
  "password_hash": "bcrypt_hashed_password",
  "profile": {
    "name": "John Doe",
    "avatar_url": "https://...",
    "bio": "Computer Science Student",
    "timezone": "UTC",
    "language": "en",
    "preferences": {
      "study_hours_per_day": 3,
      "difficulty_level": "medium", // easy, medium, hard
      "notification_settings": {
        "email": true,
        "push": true,
        "study_reminders": true,
        "quiz_reminders": true
      },
      "theme": "light", // light, dark
      "dashboard_layout": "grid" // grid, list
    }
  },
  "stats": {
    "total_syllabi_uploaded": 0,
    "total_study_plans_created": 0,
    "total_quizzes_created": 0,
    "total_quizzes_attempted": 0,
    "total_study_time_minutes": 0,
    "average_quiz_score": 0.0,
    "streak_days": 0,
    "level": 1,
    "experience_points": 0
  },
  "subscription": {
    "plan": "free", // free, pro, premium
    "expires_at": null,
    "features": ["basic_study_plans", "5_syllabi_limit"]
  },
  "auth": {
    "email_verified": false,
    "email_verification_token": "...",
    "password_reset_token": null,
    "password_reset_expires": null,
    "last_login": ISODate("2024-01-15T10:30:00Z"),
    "login_attempts": 0,
    "account_locked_until": null
  },
  "created_at": ISODate("2024-01-15T10:30:00Z"),
  "updated_at": ISODate("2024-01-15T10:30:00Z")
}
```

### **2. Syllabi Collection**
```javascript
{
  "_id": ObjectId("..."),
  "user_id": ObjectId("..."),
  "title": "Introduction to Computer Science",
  "subject": "Computer Science",
  "file_info": {
    "original_name": "cs101_syllabus.pdf",
    "file_path": "/uploads/syllabi/user123/cs101_syllabus.pdf",
    "file_size": 2048576,
    "file_type": "application/pdf",
    "checksum": "sha256_hash"
  },
  "processing": {
    "status": "completed", // uploaded, processing, completed, failed
    "progress": 100,
    "current_step": "content_extraction",
    "error_message": null,
    "started_at": ISODate("2024-01-15T10:30:00Z"),
    "completed_at": ISODate("2024-01-15T10:35:00Z")
  },
  "content": {
    "raw_text": "Course content extracted...",
    "topics": [
      {
        "name": "Introduction to Programming",
        "description": "Basic programming concepts",
        "estimated_hours": 8,
        "difficulty": "beginner",
        "prerequisites": [],
        "learning_objectives": ["Understand variables", "Write basic functions"]
      }
    ],
    "estimated_total_hours": 120,
    "difficulty_level": "beginner"
  },
  "metadata": {
    "course_code": "CS101",
    "instructor": "Dr. Smith",
    "semester": "Fall 2024",
    "credits": 3,
    "tags": ["programming", "computer-science", "beginner"]
  },
  "stats": {
    "study_plans_created": 2,
    "quizzes_generated": 5,
    "total_study_time": 45
  },
  "created_at": ISODate("2024-01-15T10:30:00Z"),
  "updated_at": ISODate("2024-01-15T10:30:00Z")
}
```

### **3. Study Plans Collection**
```javascript
{
  "_id": ObjectId("..."),
  "user_id": ObjectId("..."),
  "syllabus_id": ObjectId("..."),
  "title": "CS101 - 8 Week Study Plan",
  "description": "Comprehensive study plan for Introduction to Computer Science",
  "config": {
    "total_weeks": 8,
    "hours_per_week": 15,
    "sessions_per_week": 5,
    "difficulty_level": "medium",
    "focus_areas": ["programming", "theory", "practice"]
  },
  "schedule": [
    {
      "week": 1,
      "topics": ["Introduction to Programming", "Variables and Data Types"],
      "sessions": [
        {
          "session_id": "week1_session1",
          "title": "Getting Started with Programming",
          "duration_minutes": 60,
          "content_type": "reading", // reading, video, practice, quiz
          "materials": ["Chapter 1", "Exercise Set A"],
          "learning_objectives": ["Understand programming basics"],
          "completed": false,
          "completed_at": null,
          "notes": ""
        }
      ]
    }
  ],
  "progress": {
    "completed_sessions": 0,
    "total_sessions": 40,
    "current_week": 1,
    "completion_percentage": 0,
    "time_spent_minutes": 0,
    "estimated_completion_date": ISODate("2024-03-15T00:00:00Z")
  },
  "status": "active", // active, paused, completed, abandoned
  "created_at": ISODate("2024-01-15T10:30:00Z"),
  "updated_at": ISODate("2024-01-15T10:30:00Z")
}
```

### **4. Quizzes Collection**
```javascript
{
  "_id": ObjectId("..."),
  "user_id": ObjectId("..."),
  "syllabus_id": ObjectId("..."),
  "title": "Programming Basics Quiz",
  "description": "Test your understanding of basic programming concepts",
  "config": {
    "question_count": 10,
    "time_limit_minutes": 30,
    "difficulty": "medium",
    "question_types": ["multiple_choice", "true_false", "short_answer"],
    "topics": ["variables", "functions", "loops"],
    "passing_score": 70
  },
  "questions": [
    {
      "question_id": "q1",
      "type": "multiple_choice",
      "question": "What is a variable in programming?",
      "options": [
        "A storage location with a name",
        "A type of loop",
        "A function parameter",
        "A programming language"
      ],
      "correct_answer": 0,
      "explanation": "A variable is a storage location that has a name and can hold data.",
      "points": 1,
      "topic": "variables",
      "difficulty": "easy"
    }
  ],
  "stats": {
    "attempts_count": 0,
    "average_score": 0,
    "completion_rate": 0,
    "time_analytics": {
      "average_completion_time": 0,
      "fastest_completion": 0,
      "slowest_completion": 0
    }
  },
  "status": "published", // draft, published, archived
  "created_at": ISODate("2024-01-15T10:30:00Z"),
  "updated_at": ISODate("2024-01-15T10:30:00Z")
}
```

### **5. Quiz Attempts Collection**
```javascript
{
  "_id": ObjectId("..."),
  "user_id": ObjectId("..."),
  "quiz_id": ObjectId("..."),
  "attempt_number": 1,
  "answers": [
    {
      "question_id": "q1",
      "user_answer": 0,
      "is_correct": true,
      "points_earned": 1,
      "time_spent_seconds": 45
    }
  ],
  "results": {
    "total_questions": 10,
    "correct_answers": 8,
    "score_percentage": 80,
    "points_earned": 8,
    "total_points": 10,
    "time_taken_minutes": 25,
    "passed": true
  },
  "analytics": {
    "topic_performance": {
      "variables": { "correct": 3, "total": 4, "percentage": 75 },
      "functions": { "correct": 2, "total": 3, "percentage": 67 },
      "loops": { "correct": 3, "total": 3, "percentage": 100 }
    },
    "difficulty_performance": {
      "easy": { "correct": 4, "total": 4, "percentage": 100 },
      "medium": { "correct": 3, "total": 4, "percentage": 75 },
      "hard": { "correct": 1, "total": 2, "percentage": 50 }
    }
  },
  "status": "completed", // in_progress, completed, abandoned
  "started_at": ISODate("2024-01-15T10:30:00Z"),
  "completed_at": ISODate("2024-01-15T10:55:00Z"),
  "created_at": ISODate("2024-01-15T10:30:00Z")
}
```

### **6. User Progress Collection (Aggregated)**
```javascript
{
  "_id": ObjectId("..."),
  "user_id": ObjectId("..."),
  "date": ISODate("2024-01-15T00:00:00Z"), // Daily progress record
  "daily_stats": {
    "study_time_minutes": 120,
    "sessions_completed": 3,
    "quizzes_attempted": 1,
    "quiz_average_score": 85,
    "topics_studied": ["variables", "functions"],
    "achievements": ["first_quiz_passed", "study_streak_7"]
  },
  "weekly_goals": {
    "target_study_hours": 15,
    "actual_study_hours": 12,
    "target_sessions": 10,
    "completed_sessions": 8,
    "goal_progress": 80
  },
  "streaks": {
    "current_study_streak": 7,
    "longest_study_streak": 15,
    "current_quiz_streak": 3,
    "longest_quiz_streak": 8
  },
  "created_at": ISODate("2024-01-15T10:30:00Z"),
  "updated_at": ISODate("2024-01-15T10:30:00Z")
}
```

---

## 🔍 **Database Indexes for Performance:**

```javascript
// Users Collection Indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "auth.email_verification_token": 1 })
db.users.createIndex({ "auth.password_reset_token": 1 })

// Syllabi Collection Indexes
db.syllabi.createIndex({ "user_id": 1 })
db.syllabi.createIndex({ "user_id": 1, "created_at": -1 })
db.syllabi.createIndex({ "processing.status": 1 })

// Study Plans Collection Indexes
db.study_plans.createIndex({ "user_id": 1 })
db.study_plans.createIndex({ "syllabus_id": 1 })
db.study_plans.createIndex({ "user_id": 1, "status": 1 })

// Quizzes Collection Indexes
db.quizzes.createIndex({ "user_id": 1 })
db.quizzes.createIndex({ "syllabus_id": 1 })
db.quizzes.createIndex({ "status": 1 })

// Quiz Attempts Collection Indexes
db.quiz_attempts.createIndex({ "user_id": 1, "created_at": -1 })
db.quiz_attempts.createIndex({ "quiz_id": 1 })
db.quiz_attempts.createIndex({ "user_id": 1, "quiz_id": 1, "attempt_number": 1 })

// User Progress Collection Indexes
db.user_progress.createIndex({ "user_id": 1, "date": -1 })
db.user_progress.createIndex({ "date": -1 })
```

---

## 📊 **Aggregation Queries for Dashboard:**

```javascript
// Get User Dashboard Stats
db.users.aggregate([
  { $match: { _id: ObjectId("user_id") } },
  {
    $lookup: {
      from: "syllabi",
      localField: "_id",
      foreignField: "user_id",
      as: "syllabi"
    }
  },
  {
    $lookup: {
      from: "study_plans",
      localField: "_id",
      foreignField: "user_id",
      as: "study_plans"
    }
  },
  {
    $lookup: {
      from: "quiz_attempts",
      localField: "_id",
      foreignField: "user_id",
      as: "quiz_attempts"
    }
  },
  {
    $project: {
      profile: 1,
      stats: 1,
      total_syllabi: { $size: "$syllabi" },
      total_study_plans: { $size: "$study_plans" },
      total_quiz_attempts: { $size: "$quiz_attempts" },
      average_quiz_score: { $avg: "$quiz_attempts.results.score_percentage" }
    }
  }
])
```

This schema provides:
- ✅ **Complete user profile tracking**
- ✅ **Detailed analytics and progress**
- ✅ **Flexible quiz system**
- ✅ **Real-time progress updates**
- ✅ **Scalable for future features**

Ready to implement the authentication system with this database structure?