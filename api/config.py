import os
from dotenv import load_dotenv

# Load environment variables from a .env file if it exists (for local development)
# In production (e.g., Vercel), environment variables are set directly.
import os.path
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

class Settings:
    MONGODB_URI: str = os.getenv("MONGODB_URI")
    MAPS_API_KEY_GHANA: str = os.getenv("MAPS_API_KEY_GHANA")
    RETRAIN_API_KEY: str = os.getenv("RETRAIN_API_KEY")

    # Add other future configurations here, e.g.:
    # WMS_API_URL: str = os.getenv("WMS_API_URL")
    # WMS_API_KEY: str = os.getenv("WMS_API_KEY")

    # Basic validation with warnings instead of errors for deployment
    if not MONGODB_URI:
        print("WARNING: MONGODB_URI not set - database operations will fail")
        MONGODB_URI = "mongodb://localhost:27017/stagreen_fallback"
        
    if not MAPS_API_KEY_GHANA:
        print("WARNING: MAPS_API_KEY_GHANA not set - maps functionality will be limited")
        MAPS_API_KEY_GHANA = "dummy_key"

    if not RETRAIN_API_KEY:
        print("WARNING: RETRAIN_API_KEY not set - using default key")
        RETRAIN_API_KEY = "default_retrain_key_change_me"
    elif RETRAIN_API_KEY == "your_secret_retrain_api_key_here":
        print("WARNING: Using default example RETRAIN_API_KEY. This should be changed for production.")


settings = Settings()
