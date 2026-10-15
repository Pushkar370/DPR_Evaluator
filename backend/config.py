import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List

class Settings(BaseSettings):
    # Application State
    APP_NAME: str = "DPR Compliance Analysis API"
    VERSION: str = "2.0.0"
    DEBUG: bool = False
    
    # SQLite Database
    SQLITE_DB_PATH: str = "dpr_evaluation.db"
    
    # Gemini Key Pool (Up to 3 keys)
    GEMINI_API_KEY_1: Optional[str] = None
    GEMINI_API_KEY_2: Optional[str] = None
    GEMINI_API_KEY_3: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None  # Fallback single key
    GEMINI_MODEL_NAME: str = "gemini-3.5-flash-lite"
    
    # Groq Key Pool (Up to 2 keys)
    GROQ_API_KEY_1: Optional[str] = None
    GROQ_API_KEY_2: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None    # Fallback single key
    GROQ_MODEL_NAME: str = "llama-3.3-70b-versatile"
    
    # Embeddings & Vector DB (Qdrant)
    LOCAL_EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    QDRANT_LOCAL_PATH: str = "local_qdrant_data"
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION_NAME: str = "dpr_documents"
    GUIDELINES_COLLECTION_NAME: str = "dpr_guidelines"
    
    # System Paths
    UPLOADS_DIR: str = "uploads"
    GUIDELINES_DIR: str = "guidelines"
    
    # Pillar Weights (Total = 1.0)
    WEIGHT_TECHNICAL: float = 0.30
    WEIGHT_FINANCIAL: float = 0.30
    WEIGHT_ADMINISTRATIVE: float = 0.20
    WEIGHT_SOCIAL: float = 0.20
    
    # Security
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173"
    ]
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    def get_gemini_keys(self) -> List[str]:
        """Returns non-empty Gemini API keys in priority order."""
        keys = []
        for k in [self.GEMINI_API_KEY_1, self.GEMINI_API_KEY_2, self.GEMINI_API_KEY_3, self.GEMINI_API_KEY]:
            if k and k.strip() and not k.startswith("YOUR_") and k not in keys:
                keys.append(k.strip())
        return keys

    def get_groq_keys(self) -> List[str]:
        """Returns non-empty Groq API keys in priority order."""
        keys = []
        for k in [self.GROQ_API_KEY_1, self.GROQ_API_KEY_2, self.GROQ_API_KEY]:
            if k and k.strip() and not k.startswith("YOUR_") and k.startswith("gsk_") and k not in keys:
                keys.append(k.strip())
        return keys

settings = Settings()
