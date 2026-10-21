import os
from dotenv import load_dotenv

load_dotenv()

# Any OpenAI-compatible provider works here (Gemini, Groq, OpenAI).
# Defaults point to Google Gemini's free tier.
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv(
    "LLM_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/"
)
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-3.8-flash")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.2"))

# How much the model "thinks" before answering: low / medium / high.
# Leave it empty if your model does not support it.
LLM_REASONING_EFFORT = os.getenv("LLM_REASONING_EFFORT", "").strip()

# Give up after this many seconds instead of waiting forever
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "60"))

DATA_FILE = os.getenv("DATA_FILE", os.path.join(os.path.dirname(__file__), "..", "data", "meetings.json"))

# Websites allowed to call this API, separated by commas.
# Spaces and trailing slashes are cleaned up so small typos don't break login.
FRONTEND_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

# Login tokens. Change JWT_SECRET to any long random string in .env
JWT_SECRET = os.getenv("JWT_SECRET", "afterword-dev-secret-please-change-this-in-the-env-file")
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "72"))
USERS_FILE = os.getenv("USERS_FILE", os.path.join(os.path.dirname(__file__), "..", "data", "users.json"))

# Database. Leave MONGODB_URI empty to use local JSON files (fine on your laptop).
# Set it when deploying, because hosts like Render wipe local files on restart.
MONGODB_URI = os.getenv("MONGODB_URI", "").strip()
MONGODB_DB = os.getenv("MONGODB_DB", "afterword")