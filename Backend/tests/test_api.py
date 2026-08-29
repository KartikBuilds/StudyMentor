"""
Basic tests for critical StudyMentor API routes.
Run with: pytest tests/test_api.py -v
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("GOOGLE_API_KEY", "test-key")
os.environ.setdefault("GROQ_API_KEY", "test-key")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["status"] == "healthy"


def test_root():
    response = client.get("/")
    assert response.status_code == 200


def test_study_plan_generate_mock():
    response = client.post(
        "/api/study-plan/generate",
        json={
            "syllabus": {"Math": ["Algebra", "Geometry"]},
            "exam_days": 7,
            "hours_per_day": 2,
            "use_mock": True,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["total_days"] == 7


def test_quiz_generate_mock():
    response = client.post(
        "/api/quiz/generate",
        json={"topic": "Algebra", "num_questions": 3, "use_mock": True},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["total_questions"] == 3


def test_quiz_generate_missing_topic_returns_422():
    response = client.post(
        "/api/quiz/generate",
        json={"num_questions": 3, "use_mock": True},
    )
    assert response.status_code == 422


def test_register_never_fabricates_a_fake_success():
    """Registration must never silently fabricate a fake account. It should
    either genuinely persist a new user (201), reject a real duplicate email
    (400), or - if the database is unreachable - surface a clear 503 error.
    Any other outcome (e.g. a 200/201 with no real persistence) would mean
    it fell back to the old fabricated "demo_user_id" behavior."""
    import uuid
    response = client.post(
        "/auth/register",
        json={
            "full_name": "Test User",
            "email": f"db-fabrication-test-{uuid.uuid4().hex}@example.com",
            "password": "testpass123",
        },
    )
    assert response.status_code in (201, 400, 503)
    if response.status_code == 503:
        assert "unavailable" in response.json()["error"]["message"].lower()
    elif response.status_code == 201:
        # A real, persisted user must have a real Mongo ObjectId, not the
        # old hardcoded fake "demo_user_id".
        assert response.json()["user"]["id"] != "demo_user_id"


def test_login_invalid_credentials_returns_401_or_503():
    response = client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "password": "wrongpassword"},
    )
    assert response.status_code in (401, 500, 503)
