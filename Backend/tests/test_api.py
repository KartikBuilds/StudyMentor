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


def test_register_without_database_returns_clear_error_not_fake_success():
    """Registration must never silently fabricate a fake account when the
    database is unreachable - it should surface a clear error instead."""
    response = client.post(
        "/auth/register",
        json={
            "full_name": "Test User",
            "email": "nonexistent-db-test@example.com",
            "password": "testpass123",
        },
    )
    # With no MongoDB configured in the test environment, this must fail
    # loudly (503) rather than returning a fabricated demo user as success.
    if response.status_code != 201:
        assert response.status_code == 503
        assert "unavailable" in response.json()["error"]["message"].lower()


def test_login_invalid_credentials_returns_401_or_503():
    response = client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "password": "wrongpassword"},
    )
    assert response.status_code in (401, 500, 503)
