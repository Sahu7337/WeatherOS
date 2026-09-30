import os
import sys

# Configure UTF-8 encoding for Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import uvicorn

def main():
    print("=" * 65)
    print("WeatherOS | MausamAI Platform")
    print("     Multilingual Conversational AI & Climate Decision Support")
    print("=" * 65)
    print("🚀 Starting WeatherOS Server on http://localhost:8000")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🎙️ Neural Voice TTS & Multilingual NLU Engine: ACTIVE")
    print("🌾 Kisan Agromet & Matsya Marine Decision Support: ACTIVE")
    print("🚨 IMD Color-Coded Extreme Alert Monitor: ACTIVE")
    print("📈 45-Year Historical Climate Observatory: ACTIVE")
    print("=" * 65)
    
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()
