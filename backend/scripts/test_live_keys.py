import logging
from backend.llm_client import llm_pool
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)

class TestVerification(BaseModel):
    provider: str
    status: str
    score: float

def test_live_structured():
    print("\n--- Testing call_structured with Gemini Pool ---")
    res = llm_pool.call_structured(
        TestVerification,
        system_prompt="You are an automated evaluation system. Return valid JSON only.",
        user_prompt='Generate a verification test object with provider="Google Gemini", status="active", score=98.5',
        primary_provider="gemini"
    )
    print("Structured Gemini Object:", res)
    assert res.score == 98.5
    assert res.provider == "Google Gemini"
    print("LIVE GEMINI LLM TEST PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_live_structured()
