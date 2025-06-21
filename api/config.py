import os
from dotenv import load_dotenv

# Load environment variables from a .env file if it exists (for local development)
# In production (e.g., Vercel), environment variables are set directly.
load_dotenv()

class Settings:
    MONGODB_URI: str = os.getenv("MONGODB_URI")
    MAPS_API_KEY_GHANA: str = os.getenv("MAPS_API_KEY_GHANA")

    # Add other future configurations here, e.g.:
    # WMS_API_URL: str = os.getenv("WMS_API_URL")
    # WMS_API_KEY: str = os.getenv("WMS_API_KEY")

    # Basic validation (optional but good practice)
    if not MONGODB_URI:
        raise ValueError("Missing environment variable: MONGODB_URI")
    if not MAPS_API_KEY_GHANA:
        raise ValueError("Missing environment variable: MAPS_API_KEY_GHANA")

    # Retraining API Key
    RETRAIN_API_KEY: str = os.getenv("RETRAIN_API_KEY")
    if not RETRAIN_API_KEY: # Ensure it's set
        raise ValueError("Missing environment variable: RETRAIN_API_KEY")
    if RETRAIN_API_KEY == "your_secret_retrain_api_key_here":
        # In a real production setup, you might want to log a warning or even prevent startup
        # if the default example key is used. For this PoC, a print/log is fine.
        print("WARNING: Using default example RETRAIN_API_KEY. This should be changed for production.")


settings = Settings()
