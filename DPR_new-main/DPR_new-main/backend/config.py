from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Application State
    APP_NAME: str = "DPR Compliance Analysis API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Storage & Queue
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Cloud Provider Settings
    # Groq (LLM) & Local Embeddings
    GROQ_API_KEY: str = "YOUR_GROQ_API_KEY"
    GROQ_MODEL_NAME: str = "llama-3.3-70b-versatile"
    LOCAL_EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # Vector DB (Qdrant)
    QDRANT_LOCAL_PATH: str = "local_qdrant_data"
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION_NAME: str = "dpr_guidelines"
    
    # System Paths
    UPLOADS_DIR: str = "uploads"
    
    # Security
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173"
    ]
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
