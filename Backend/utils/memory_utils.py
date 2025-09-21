"""
memory_utils.py
MemoryToolAgent for StudyMentor: tracks user performance, weak topics, and quiz history.
This version uses in-memory storage for testing; swap with Firestore integration later.
"""

from collections import defaultdict

# In-memory mock database: {user_id: {topic: [scores]}}
_user_memory = defaultdict(lambda: defaultdict(list))

def record_quiz_result(user_id, topic, score, total):
    """
    Record a user's quiz result for a topic.
    Args:
        user_id (str): Unique user identifier
        topic (str): Topic name
        score (int): Number of correct answers
        total (int): Total number of questions
    """
    if total > 0:
        _user_memory[user_id][topic].append((score, total))


def get_weak_topics(user_id, threshold=0.6):
    """
    Get topics where user's average score is below threshold.
    Args:
        user_id (str): Unique user identifier
        threshold (float): Weakness threshold (default 0.6)
    Returns:
        list: List of weak topic names
    """
    weak = []
    for topic, results in _user_memory[user_id].items():
        if results:
            avg = sum(s/t for s, t in results) / len(results)
            if avg < threshold:
                weak.append(topic)
    return weak


def get_user_performance(user_id):
    """
    Summarize user's performance across all topics.
    Args:
        user_id (str): Unique user identifier
    Returns:
        dict: {topic: {'attempts': int, 'avg_score': float}}
    """
    summary = {}
    for topic, results in _user_memory[user_id].items():
        if results:
            attempts = len(results)
            avg = sum(s/t for s, t in results) / attempts
            summary[topic] = {'attempts': attempts, 'avg_score': avg}
    return summary
