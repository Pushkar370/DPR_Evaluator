import json
import logging
import time
import re
from typing import List, Dict, Any, Optional, Type, TypeVar
from pydantic import BaseModel, ValidationError

from backend.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

class LLMKeyPoolManager:
    """
    Manages API keys for Groq and Gemini with round-robin rotation,
    exponential backoff, cross-provider fallback, and Pydantic validation.
    """
    def __init__(self):
        self.gemini_keys: List[str] = settings.get_gemini_keys()
        self.groq_keys: List[str] = settings.get_groq_keys()
        self.gemini_idx = 0
        self.groq_idx = 0
        
        logger.info(f"[LLM POOL] Loaded {len(self.gemini_keys)} Gemini keys and {len(self.groq_keys)} Groq keys.")

    def refresh_keys(self):
        """Reloads keys from settings (e.g., if .env was updated)."""
        self.gemini_keys = settings.get_gemini_keys()
        self.groq_keys = settings.get_groq_keys()

    def get_groq_key(self) -> Optional[str]:
        if not self.groq_keys:
            return None
        key = self.groq_keys[self.groq_idx % len(self.groq_keys)]
        self.groq_idx += 1
        return key

    def get_gemini_key(self) -> Optional[str]:
        if not self.gemini_keys:
            return None
        key = self.gemini_keys[self.gemini_idx % len(self.gemini_keys)]
        self.gemini_idx += 1
        return key

    def call_groq(
        self,
        system_prompt: str,
        user_prompt: str,
        json_mode: bool = True,
        max_retries: int = 3
    ) -> str:
        from groq import Groq

        if not self.groq_keys:
            raise RuntimeError("No GROQ_API_KEY available in pool.")

        attempts = 0
        last_error = None

        while attempts < max_retries * len(self.groq_keys):
            attempts += 1
            api_key = self.get_groq_key()
            try:
                client = Groq(api_key=api_key)
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
                kwargs = {
                    "messages": messages,
                    "model": settings.GROQ_MODEL_NAME,
                    "temperature": 0.2,
                }
                if json_mode:
                    kwargs["response_format"] = {"type": "json_object"}

                response = client.chat.completions.create(**kwargs)
                return response.choices[0].message.content.strip()

            except Exception as e:
                err_str = str(e).lower()
                clean_err = self._sanitize(str(e))
                last_error = clean_err
                logger.warning(f"[GROQ KEY ROTATE] Attempt {attempts} failed with key ...{api_key[-4:] if api_key else 'none'}: {clean_err}")
                if "invalid_api_key" in err_str or "401" in err_str:
                    if api_key in self.groq_keys:
                        self.groq_keys.remove(api_key)
                    continue
                if "rate limit" in err_str or "429" in err_str or "quota" in err_str or "too many requests" in err_str:
                    time.sleep(min(2 ** attempts, 4))
                    continue
                else:
                    time.sleep(1)

        raise RuntimeError(f"All Groq keys exhausted: {last_error}")

    def _sanitize(self, text: str) -> str:
        if not text:
            return ""
        sanitized = re.sub(r'AIza[0-9A-Za-z-_]{20,}', 'AIza...[REDACTED]', str(text))
        sanitized = re.sub(r'gsk_[0-9A-Za-z-_]{20,}', 'gsk_...[REDACTED]', sanitized)
        sanitized = re.sub(r'xai-[0-9A-Za-z-_]{20,}', 'xai-...[REDACTED]', sanitized)
        return sanitized

    def call_gemini(
        self,
        system_prompt: str,
        user_prompt: str,
        json_mode: bool = True,
        max_retries: int = 3
    ) -> str:
        from google import genai
        from google.genai import types

        if not self.gemini_keys:
            raise RuntimeError("No GEMINI_API_KEY available in pool.")

        attempts = 0
        last_error = None

        while attempts < max_retries * len(self.gemini_keys):
            attempts += 1
            api_key = self.get_gemini_key()
            try:
                client = genai.Client(api_key=api_key)
                config = types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.2,
                    response_mime_type="application/json" if json_mode else "text/plain"
                )
                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL_NAME,
                    contents=user_prompt,
                    config=config
                )
                return response.text.strip()

            except Exception as e:
                err_str = str(e).lower()
                clean_err = self._sanitize(str(e))
                last_error = clean_err
                logger.warning(f"[GEMINI KEY ROTATE] Attempt {attempts} failed with key ...{api_key[-4:] if api_key else 'none'}: {clean_err}")
                if "api_key_invalid" in err_str or "400" in err_str:
                    if api_key in self.gemini_keys:
                        self.gemini_keys.remove(api_key)
                    continue
                if "quota" in err_str or "429" in err_str or "resource_exhausted" in err_str or "503" in err_str:
                    time.sleep(min(2 ** attempts, 4))
                    continue
                else:
                    time.sleep(1)

        raise RuntimeError(f"All Gemini keys exhausted: {last_error}")

    def call_structured(
        self,
        pydantic_cls: Type[T],
        system_prompt: str,
        user_prompt: str,
        primary_provider: str = "groq"
    ) -> T:
        """
        Executes structured JSON completion with primary provider and fallback,
        then validates through Pydantic. Retries once with syntax correction if invalid.
        """
        providers = ["groq", "gemini"] if primary_provider == "groq" else ["gemini", "groq"]
        last_exception = None

        for provider in providers:
            try:
                if provider == "groq" and self.groq_keys:
                    raw_text = self.call_groq(system_prompt, user_prompt, json_mode=True)
                elif provider == "gemini" and self.gemini_keys:
                    raw_text = self.call_gemini(system_prompt, user_prompt, json_mode=True)
                else:
                    continue

                cleaned_json = self._extract_json(raw_text)
                try:
                    return pydantic_cls.model_validate_json(cleaned_json)
                except ValidationError as val_err:
                    logger.warning(f"[STRUCTURED REPAIR] Parsing error from {provider}: {val_err}. Retrying repair...")
                    repair_prompt = f"The following JSON does not match the required schema: {val_err}\n\nJSON to fix:\n{cleaned_json}\n\nFix it and return valid JSON only."
                    if provider == "groq":
                        repaired_text = self.call_groq("You are a JSON schema repair bot. Output valid JSON only.", repair_prompt, json_mode=True)
                    else:
                        repaired_text = self.call_gemini("You are a JSON schema repair bot. Output valid JSON only.", repair_prompt, json_mode=True)
                    return pydantic_cls.model_validate_json(self._extract_json(repaired_text))

            except Exception as e:
                logger.warning(f"[PROVIDER FALLBACK] Provider {provider} failed: {e}. Trying next provider if available.")
                last_exception = e

        raise RuntimeError(f"Failed to obtain valid {pydantic_cls.__name__} from any available LLM provider: {last_exception}")

    def call_vision_transcribe(self, image_bytes: bytes, mime_type: str = "image/png") -> str:
        """
        Uses Gemini Vision via the Gemini key pool to transcribe a scanned page into markdown.
        """
        from google import genai
        from google.genai import types

        if not self.gemini_keys:
            raise RuntimeError("No Gemini API key available for Vision OCR.")

        for _ in range(len(self.gemini_keys)):
            api_key = self.get_gemini_key()
            try:
                client = genai.Client(api_key=api_key)
                prompt = (
                    "Transcribe this scanned DPR (Detailed Project Report) page into structured Markdown text. "
                    "Preserve all headings, tables, numbers, and bullet points verbatim. Do not hallucinate."
                )
                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL_NAME,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        prompt
                    ]
                )
                return response.text.strip()
            except Exception as e:
                logger.warning(f"[VISION OCR] Key rotation due to: {e}")
                time.sleep(1)

        raise RuntimeError("All Gemini keys failed during Vision OCR.")

    @staticmethod
    def _extract_json(text: str) -> str:
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        # In case extra text surrounds the JSON object
        match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
        if match:
            return match.group(0).strip()
        return text

llm_pool = LLMKeyPoolManager()
