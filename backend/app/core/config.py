import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

# 1. Dynamically find the absolute path to your backend root folder
# This ensures it finds the .env file even if you run uvicorn from a weird directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, ".env")

# 2. Explicitly load the environment variables
load_dotenv(dotenv_path=ENV_PATH)

class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicFix India Command Center"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str = "sqlite:///./civicfix.db" 
    
    # We parse the string into a list for CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    
    # AI Engine Keys
    GEMINI_API_KEY: str | None = None
    
    # Toggle to True to route to local Ollama instead of Gemini
    USE_LOCAL_OLLAMA: bool = False
    OLLAMA_URL: str = "http://localhost:11434/api/generate"
    OLLAMA_VISION_MODEL: str = "llava" # or gemma3 if you have a vision adapter
    # ... [Keep your AI Engine Keys] ...
    
    # Twilio Keys
    TWILIO_ACCOUNT_SID: str | None = None
    TWILIO_AUTH_TOKEN: str | None = None
    TWILIO_WHATSAPP_NUMBER: str | None = None
    model_config = SettingsConfigDict(
        env_file=ENV_PATH, 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore" # Prevents crashes if you have extra variables in .env
    )

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()