import os
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from backend.config import settings
from backend.weather_service import weather_service
from backend.alerts_engine import alerts_engine
from backend.climate_service import climate_service
from backend.decision_engine import decision_engine
from backend.conversational_agent import conversational_agent
from backend.voice_service import voice_service

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multilingual Conversational AI & Decision Support Platform for Weather, Alerts, and Climate Intelligence",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static frontend directory
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Request Models
class ChatRequest(BaseModel):
    query: str
    language: str = "en"
    latitude: float = 28.6139
    longitude: float = 77.2090
    location_name: str = "New Delhi"

class TTSRequest(BaseModel):
    text: str
    language: str = "en"

@app.get("/")
def root():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "platform": settings.PROJECT_NAME,
        "status": "online",
        "version": "1.0.0",
    }

@app.get("/favicon.ico")
def favicon():
    fav_file = os.path.join(STATIC_DIR, "favicon.svg")
    if os.path.exists(fav_file):
        return FileResponse(fav_file, media_type="image/svg+xml")
    raise HTTPException(status_code=404, detail="Favicon not found")

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/config")
def get_config():
    return {
        "carto_api_key": settings.CARTO_API_KEY,
        "default_lat": settings.DEFAULT_LAT,
        "default_lon": settings.DEFAULT_LON,
        "default_city": settings.DEFAULT_CITY,
        "default_state": settings.DEFAULT_STATE
    }

@app.get("/api/languages")
def get_languages():
    return settings.SUPPORTED_LANGUAGES

@app.get("/api/weather/search")
async def search_locations(query: str = Query(..., min_length=2)):
    results = await weather_service.search_locations(query)
    return {"results": results}

@app.get("/api/weather/current")
async def get_current_weather(
    lat: float = Query(28.6139),
    lon: float = Query(77.2090),
    timezone: str = Query("Asia/Kolkata")
):
    data = await weather_service.get_current_and_forecast(lat, lon, timezone)
    return data

@app.get("/api/weather/air-quality")
async def get_air_quality(lat: float = Query(28.6139), lon: float = Query(77.2090)):
    return await weather_service.get_air_quality(lat, lon)

@app.get("/api/weather/marine")
async def get_marine_weather(lat: float = Query(19.0760), lon: float = Query(72.8777)):
    return await weather_service.get_marine_weather(lat, lon)

@app.get("/api/alerts/live")
async def get_live_alerts(
    lat: float = Query(28.6139),
    lon: float = Query(77.2090),
    location: str = Query("New Delhi")
):
    weather = await weather_service.get_current_and_forecast(lat, lon)
    alerts = alerts_engine.evaluate_live_alerts(
        weather.get("current", {}),
        weather.get("daily", []),
        location
    )
    return {"location": location, "alerts": alerts}

@app.get("/api/alerts/bulletin")
def get_national_bulletin():
    return {"national_bulletin": alerts_engine.get_national_alert_bulletin()}

@app.get("/api/climate/historical")
@app.get("/api/climate/trends")
async def get_climate_trends(
    lat: float = Query(28.6139),
    lon: float = Query(77.2090),
    location: str = Query("")
):
    return await climate_service.get_historical_climate_trends(lat, lon, location)

@app.get("/api/decision/agromet")
@app.get("/api/decision/agriculture")
async def get_agriculture_decision(
    lat: float = Query(28.6139),
    lon: float = Query(77.2090)
):
    weather = await weather_service.get_current_and_forecast(lat, lon)
    return decision_engine.evaluate_agriculture(
        weather.get("current", {}),
        weather.get("daily", [])
    )

@app.get("/api/decision/marine")
async def get_marine_decision(
    lat: float = Query(19.0760),
    lon: float = Query(72.8777)
):
    marine = await weather_service.get_marine_weather(lat, lon)
    weather = await weather_service.get_current_and_forecast(lat, lon)
    return decision_engine.evaluate_marine(marine, weather.get("current", {}))

@app.get("/api/decision/disaster")
async def get_disaster_decision(
    lat: float = Query(28.6139),
    lon: float = Query(77.2090),
    location: str = Query("New Delhi")
):
    weather = await weather_service.get_current_and_forecast(lat, lon)
    alerts = alerts_engine.evaluate_live_alerts(
        weather.get("current", {}),
        weather.get("daily", []),
        location
    )
    return decision_engine.evaluate_disaster_management(weather.get("current", {}), alerts)

@app.post("/api/chat")
async def process_chat(req: ChatRequest):
    result = await conversational_agent.process_query(
        query=req.query,
        lang=req.language,
        active_lat=req.latitude,
        active_lon=req.longitude,
        active_name=req.location_name
    )
    return result

@app.post("/api/voice/tts")
@app.post("/api/tts")
async def synthesize_speech(req: TTSRequest):
    try:
        audio_path = await voice_service.generate_speech(req.text, req.language)
        if audio_path and os.path.exists(audio_path):
            import base64
            with open(audio_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("utf-8")
            return {
                "status": "success",
                "audio_base64": b64,
                "format": "mp3",
                "filename": os.path.basename(audio_path)
            }
    except Exception as e:
        print(f"TTS synthesis error: {e}")
    return {
        "status": "fallback",
        "audio_base64": None,
        "message": "TTS offline or unconfigured. Browser fallback supported."
    }

@app.get("/api/voice/audio/{filename}")
def get_audio_file(filename: str):
    cache_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio_cache")
    path = os.path.join(cache_dir, filename)
    if os.path.exists(path):
        return FileResponse(path, media_type="audio/mpeg", filename=filename)
    raise HTTPException(status_code=404, detail="Audio file not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
