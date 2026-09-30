import os

class Settings:
    PROJECT_NAME: str = "WeatherOS"
    API_V1_STR: str = "/api"
    DEBUG: bool = True
    
    # Supported Indian Languages
    SUPPORTED_LANGUAGES = {
        "en": {"name": "English", "native": "English", "voice": "en-IN-NeerjaNeural"},
        "hi": {"name": "Hindi", "native": "हिंदी", "voice": "hi-IN-SwaraNeural"},
        "ta": {"name": "Tamil", "native": "தமிழ்", "voice": "ta-IN-PallaviNeural"},
        "te": {"name": "Telugu", "native": "తెలుగు", "voice": "te-IN-MohanNeural"},
        "bn": {"name": "Bengali", "native": "বাংলা", "voice": "bn-IN-TanishaaNeural"},
        "mr": {"name": "Marathi", "native": "मराठी", "voice": "mr-IN-AarohiNeural"},
        "gu": {"name": "Gujarati", "native": "ગુજરાતી", "voice": "gu-IN-DhwaniNeural"},
        "kn": {"name": "Kannada", "native": "ಕನ್ನಡ", "voice": "kn-IN-SapnaNeural"},
        "or": {"name": "Odia", "native": "ଓଡ଼ିଆ", "voice": "hi-IN-SwaraNeural"}, # fallback to hi voice
        "pa": {"name": "Punjabi", "native": "ਪੰਜਾਬੀ", "voice": "hi-IN-SwaraNeural"},
        "ml": {"name": "Malayalam", "native": "മലയാളം", "voice": "ml-IN-SobhanaNeural"}
    }

    # Default location (New Delhi, India)
    DEFAULT_LAT: float = 28.6139
    DEFAULT_LON: float = 77.2090
    DEFAULT_CITY: str = "New Delhi"
    DEFAULT_STATE: str = "Delhi"

settings = Settings()
