import os
import re
from typing import Dict, Any, List, Optional
from backend.weather_service import weather_service
from backend.alerts_engine import alerts_engine
from backend.climate_service import climate_service
from backend.decision_engine import decision_engine

# Common Indian cities with their coordinates for instant entity resolution
INDIAN_CITIES_COORDS = {
    "delhi": {"name": "New Delhi", "state": "Delhi", "lat": 28.6139, "lon": 77.2090},
    "new delhi": {"name": "New Delhi", "state": "Delhi", "lat": 28.6139, "lon": 77.2090},
    "mumbai": {"name": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777},
    "bombay": {"name": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777},
    "bengaluru": {"name": "Bengaluru", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946},
    "bangalore": {"name": "Bengaluru", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946},
    "kolkata": {"name": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lon": 88.3639},
    "calcutta": {"name": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lon": 88.3639},
    "chennai": {"name": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707},
    "madras": {"name": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707},
    "hyderabad": {"name": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lon": 78.4867},
    "ahmedabad": {"name": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lon": 72.5714},
    "pune": {"name": "Pune", "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567},
    "jaipur": {"name": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lon": 75.7873},
    "lucknow": {"name": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lon": 80.9462},
    "kanpur": {"name": "Kanpur", "state": "Uttar Pradesh", "lat": 26.4499, "lon": 80.3319},
    "patna": {"name": "Patna", "state": "Bihar", "lat": 25.5941, "lon": 85.1376},
    "bhopal": {"name": "Bhopal", "state": "Madhya Pradesh", "lat": 23.2599, "lon": 77.4126},
    "chandigarh": {"name": "Chandigarh", "state": "Punjab/Haryana", "lat": 30.7333, "lon": 76.7794},
    "bhubaneswar": {"name": "Bhubaneswar", "state": "Odisha", "lat": 20.2961, "lon": 85.8245},
    "puri": {"name": "Puri", "state": "Odisha", "lat": 19.8135, "lon": 85.8312},
    "visakhapatnam": {"name": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6868, "lon": 83.2185},
    "vizag": {"name": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6868, "lon": 83.2185},
    "kochi": {"name": "Kochi", "state": "Kerala", "lat": 9.9312, "lon": 76.2673},
    "cochin": {"name": "Kochi", "state": "Kerala", "lat": 9.9312, "lon": 76.2673},
    "guwahati": {"name": "Guwahati", "state": "Assam", "lat": 26.1445, "lon": 91.7362},
    "srinagar": {"name": "Srinagar", "state": "Jammu & Kashmir", "lat": 34.0837, "lon": 74.7973},
    "shimla": {"name": "Shimla", "state": "Himachal Pradesh", "lat": 31.1048, "lon": 77.1734},
    "amritsar": {"name": "Amritsar", "state": "Punjab", "lat": 31.6340, "lon": 74.8723},
    "ludhiana": {"name": "Ludhiana", "state": "Punjab", "lat": 30.9010, "lon": 75.8573},
    "karnal": {"name": "Karnal", "state": "Haryana", "lat": 29.6857, "lon": 76.9905},
    "surat": {"name": "Surat", "state": "Gujarat", "lat": 21.1702, "lon": 72.8311},
    "varanasi": {"name": "Varanasi", "state": "Uttar Pradesh", "lat": 25.3176, "lon": 82.9739}
}

class ConversationalAgent:
    def __init__(self):
        pass

    def extract_location(self, query: str, default_lat: float, default_lon: float, default_name: str) -> tuple[float, float, str]:
        """Extract city/location from user query or return active default."""
        query_lower = query.lower()
        for city_key, data in INDIAN_CITIES_COORDS.items():
            pattern = r'\b' + re.escape(city_key) + r'\b'
            if re.search(pattern, query_lower):
                return data["lat"], data["lon"], f"{data['name']}, {data['state']}"
        return default_lat, default_lon, default_name

    def identify_intent(self, query: str) -> str:
        """Classify user's natural language question into actionable intents."""
        q = query.lower()
        
        # Spraying / Agriculture Pesticide
        if any(w in q for w in ["spray", "pesticide", "fertilizer", "chemicals", "छिड़काव", "कीटनाशक", "மருந்து தெளிக்க", "మందు పిచికారీ", "কীটনাশক"]):
            return "AGRI_SPRAYING"
        
        # Irrigation / Crop water
        if any(w in q for w in ["irrigate", "irrigation", "water the crop", "field water", "सिंचाई", "पानी देना", "பாசனம்", "నీరు పెట్టవచ్చా", "সেচ"]):
            return "AGRI_IRRIGATION"
        
        # Marine / Fishermen safety
        if any(w in q for w in ["sea", "fishermen", "fishing", "boat", "waves", "trawler", "मछुआरे", "समुद्र", "नाव", "கடல்", "மீன்பிடிக்க", "సముద్రం", "చేపల వేట", "সমুদ্র"]):
            return "MARINE_SAFETY"

        # Alerts / Warnings / Cyclone / Heatwave / Storm
        if any(w in q for w in ["alert", "warning", "cyclone", "heatwave", "danger", "flood", "चेतावनी", "अलर्ट", "चक्रवात", "लू", "तूफान", "எச்சரிக்கை", "புயல்", "హెచ్చరిక", "తుఫాను"]):
            return "ALERTS_WARNINGS"

        # Climate trend / Historical change / Global warming
        if any(w in q for w in ["climate", "trend", "historical", "warming", "decade", "30 years", "40 years", "जलवायु", "रुझान", "तापमान में बदलाव", "காலநிலை", "వాతావరణ మార్పు"]):
            return "CLIMATE_TRENDS"

        # Aviation / Drone
        if any(w in q for w in ["drone", "fly", "aviation", "flight", "pilot", "विमान", "ड्रोन"]):
            return "AVIATION"

        # Air Quality / Pollution
        if any(w in q for w in ["aqi", "air quality", "pollution", "pm2.5", "smog", "प्रदूषण", "हवा की गुणवत्ता"]):
            return "AIR_QUALITY"

        # Forecast
        if any(w in q for w in ["tomorrow", "forecast", "weekend", "rain today", "will it rain", "next week", "forecast", "कल", "बारिश", "होगी क्या"]):
            return "FORECAST"

        # Default Current Weather
        return "CURRENT_WEATHER"

    async def process_query(self, query: str, lang: str = "en", active_lat: float = 28.6139, active_lon: float = 77.2090, active_name: str = "New Delhi") -> Dict[str, Any]:
        """Core multi-turn conversational reasoning pipe with multilingual localization."""
        lat, lon, location_name = self.extract_location(query, active_lat, active_lon, active_name)
        intent = self.identify_intent(query)
        
        # Fetch fresh meteorological data for the target location
        weather_data = await weather_service.get_current_and_forecast(lat, lon)
        current = weather_data.get("current", {})
        daily = weather_data.get("daily", [])
        
        alerts = alerts_engine.evaluate_live_alerts(current, daily, location_name)
        
        response_text = ""
        card_type = ""
        card_data = {}
        
        if intent == "AGRI_SPRAYING":
            agri = decision_engine.evaluate_agriculture(current, daily)
            spray = agri["spraying_advisory"]
            card_type = "AGRI_SPRAYING"
            card_data = agri
            
            if lang == "hi":
                status_hi = "सुरक्षित है" if spray["is_safe"] else "अनुशंसित नहीं है"
                response_text = f"{location_name} के लिए कृषि सलाह: आज कीटनाशक का छिड़काव {status_hi}। {spray['reason']} हवा की गति: {current.get('wind_speed')} किमी/घंटा, तापमान: {current.get('temperature')}°C।"
            elif lang == "ta":
                status_ta = "பாதுகாப்பானது" if spray["is_safe"] else "பரிந்துரைக்கப்படவில்லை"
                response_text = f"{location_name} விவசாய ஆலோசனை: இன்று மருந்து தெளிப்பது {status_ta}. {spray['reason']} காற்றின் வேகம்: {current.get('wind_speed')} கி.மீ/மணி."
            elif lang == "te":
                status_te = "సురక్షితం" if spray["is_safe"] else "సిఫార్సు చేయబడలేదు"
                response_text = f"{location_name} వ్యవసాయ సలహా: ఈరోజు రసాయనాలు పిచికారీ చేయడం {status_te}. {spray['reason']} గాలి వేగం: {current.get('wind_speed')} km/h."
            else:
                status_en = "SAFE & APPROVED" if spray["is_safe"] else "NOT RECOMMENDED"
                response_text = f"Agromet Advisory for {location_name}: Pesticide spraying is {status_en}. {spray['reason']} Current wind speed is {current.get('wind_speed')} km/h and temperature is {current.get('temperature')}°C."

        elif intent == "AGRI_IRRIGATION":
            agri = decision_engine.evaluate_agriculture(current, daily)
            irrig = agri["irrigation_advisory"]
            card_type = "AGRI_IRRIGATION"
            card_data = agri
            
            if lang == "hi":
                response_text = f"{location_name} में सिंचाई सलाह: {irrig['recommendation']} आर्द्रता: {current.get('humidity')}%, वर्षा संभावना: {daily[0].get('precipitation_prob_max', 0)}%।"
            elif lang == "ta":
                response_text = f"{location_name} பாசன ஆலோசனை: {irrig['recommendation']} ஈரப்பதம்: {current.get('humidity')}%."
            elif lang == "te":
                response_text = f"{location_name} నీటిపారుదల సలహా: {irrig['recommendation']} తేమ: {current.get('humidity')}%."
            else:
                response_text = f"Irrigation Advisory for {location_name}: {irrig['recommendation']} Relative humidity is {current.get('humidity')}%, with next 24h rain probability at {daily[0].get('precipitation_prob_max', 0)}%."

        elif intent == "MARINE_SAFETY":
            marine = await weather_service.get_marine_weather(lat, lon)
            marine_eval = decision_engine.evaluate_marine(marine, current)
            card_type = "MARINE_SAFETY"
            card_data = marine_eval
            
            if not marine_eval.get("is_applicable"):
                response_text = f"{location_name} is an inland area. Coastal marine advisories apply along coastal zones (e.g. Visakhapatnam, Chennai, Mumbai, Kochi, Puri)."
            else:
                if lang == "hi":
                    response_text = f"{location_name} तटीय एवं मत्स्य चेतावनी: वर्तमान स्थिति '{marine_eval['status']}'। {marine_eval['advisory']} लहरों की ऊंचाई: {marine_eval.get('wave_height_meters')} मीटर, हवा: {marine_eval.get('wind_speed_knots')} नॉट। आपातकालीन चैनल: VHF 16।"
                elif lang == "ta":
                    response_text = f"{location_name} கடல்சார் எச்சரிக்கை: நிலைமை '{marine_eval['status']}'. {marine_eval['advisory']} அலை உயரம்: {marine_eval.get('wave_height_meters')} மீ, காற்றின் வேகம்: {marine_eval.get('wind_speed_knots')} knots."
                elif lang == "te":
                    response_text = f"{location_name} సముద్ర హెచ్చరిక: స్థితి '{marine_eval['status']}'. {marine_eval['advisory']} అలల ఎత్తు: {marine_eval.get('wave_height_meters')} మీటర్లు."
                else:
                    response_text = f"Marine Safety Advisory for {location_name} Coast: Operational status is {marine_eval['status']}. {marine_eval['advisory']} Significant wave height is {marine_eval.get('wave_height_meters')}m with wind speed at {marine_eval.get('wind_speed_knots')} knots. {marine_eval['imd_port_signal']}."

        elif intent == "ALERTS_WARNINGS":
            card_type = "ALERT_BULLETIN"
            card_data = {"alerts": alerts, "disaster_preparedness": decision_engine.evaluate_disaster_management(current, alerts)}
            
            top_alert = alerts[0]
            if lang == "hi":
                response_text = f"{location_name} के लिए IMD चेतावनी ({top_alert['severity']} श्रेणी): {top_alert['headline']}। संभावित प्रभाव: {top_alert['impact']}। अनुशंसित कार्रवाई: {top_alert['action']}। आपदा हेल्पलाइन: 1078।"
            elif lang == "ta":
                response_text = f"{location_name} எச்சரிக்கை ({top_alert['severity']}): {top_alert['headline']}. நடவடிக்கை: {top_alert['action']}. பேரிடர் உதவி எண்: 1078."
            elif lang == "te":
                response_text = f"{location_name} హెచ్చరిక ({top_alert['severity']}): {top_alert['headline']}. కార్యాచరణ: {top_alert['action']}. విపత్తు హెల్ప్‌లైన్: 1078."
            else:
                response_text = f"IMD Warning for {location_name} [{top_alert['severity']} Alert]: {top_alert['headline']}. Impact: {top_alert['impact']}. Recommended Action: {top_alert['action']}. National Disaster Helpline: 1078."

        elif intent == "CLIMATE_TRENDS":
            trends = await climate_service.get_historical_climate_trends(lat, lon, location_name)
            card_type = "CLIMATE_TRENDS"
            card_data = trends
            
            if lang == "hi":
                response_text = f"{location_name} का 45-वर्षीय जलवायु विश्लेषण (1980 - 2025): कुल औसत तापमान में {trends['net_warming']} की वृद्धि हुई है ({trends['warming_rate_per_decade']})। अत्यधिक गर्मी के दिनों में उल्लेखनीय वृद्धि हुई है। {trends['climate_resilience_advisory']}"
            elif lang == "ta":
                response_text = f"{location_name} காலநிலை பகுப்பாய்வு (1980 - 2025): சராசரி வெப்பநிலை {trends['net_warming']} அதிகரித்துள்ளது. {trends['climate_resilience_advisory']}"
            elif lang == "te":
                response_text = f"{location_name} వాతావరణ ధోరణి (1980 - 2025): ఉష్ణోగ్రత {trends['net_warming']} పెరిగింది. {trends['climate_resilience_advisory']}"
            else:
                response_text = f"Historical Climate Trends for {location_name} (1980 - 2025): Total decadal warming observed is {trends['net_warming']} at a rate of {trends['warming_rate_per_decade']}. Monsoon anomaly: {trends['monsoon_anomaly']}. {trends['key_finding']} Advisory: {trends['climate_resilience_advisory']}"

        elif intent == "AIR_QUALITY":
            aqi_data = await weather_service.get_air_quality(lat, lon)
            card_type = "AIR_QUALITY"
            card_data = aqi_data
            
            if lang == "hi":
                response_text = f"{location_name} में वायु गुणवत्ता सूचकांक (AQI) {aqi_data['aqi']} है, जो '{aqi_data['category']}' श्रेणी में आता है। {aqi_data['advice']} PM2.5: {aqi_data.get('pm2_5', 'N/A')} µg/m³।"
            elif lang == "ta":
                response_text = f"{location_name} காற்றின் தரம் (AQI) {aqi_data['aqi']} ({aqi_data['category']}). {aqi_data['advice']}"
            elif lang == "te":
                response_text = f"{location_name} గాలి నాణ్యత సూచిక (AQI) {aqi_data['aqi']} ({aqi_data['category']}). {aqi_data['advice']}"
            else:
                response_text = f"Air Quality for {location_name}: US AQI is currently {aqi_data['aqi']} ({aqi_data['category']}). {aqi_data['advice']} PM2.5 concentration: {aqi_data.get('pm2_5', 'N/A')} µg/m³."

        elif intent == "AVIATION":
            av = decision_engine.evaluate_aviation(current)
            card_type = "AVIATION"
            card_data = av
            response_text = f"Aviation & Drone Assessment for {location_name}: Flight Category is {av['flight_rule']}. Drone Operations: {av['drone_status']}. Wind gusts: {current.get('wind_gusts', current.get('wind_speed'))} km/h. {av['ceiling_visibility_note']}"

        elif intent == "FORECAST":
            card_type = "WEATHER_FORECAST"
            card_data = {"current": current, "daily": daily[:7]}
            
            tomorrow = daily[0] if daily else {}
            t_max = tomorrow.get("temp_max", 30)
            t_min = tomorrow.get("temp_min", 20)
            t_rain = tomorrow.get("precipitation_prob_max", 0)
            t_cond = tomorrow.get("condition", "Partly Cloudy")
            
            if lang == "hi":
                response_text = f"{location_name} के लिए पूर्वानुमान: कल का मौसम '{t_cond}' रहेगा। अधिकतम तापमान {t_max}°C और न्यूनतम तापमान {t_min}°C रहने का अनुमान है। बारिश की संभावना {t_rain}% है।"
            elif lang == "ta":
                response_text = f"{location_name} வானிலை முன்னறிவிப்பு: நாளை நிலைமை '{t_cond}'. அதிகபட்ச வெப்பநிலை {t_max}°C, குறைந்தபட்சம் {t_min}°C. மழை வாய்ப்பு {t_rain}%."
            elif lang == "te":
                response_text = f"{location_name} వాతావరణ సూచన: రేపటి పరిస్థితి '{t_cond}'. గరిష్ట ఉష్ణోగ్రత {t_max}°C, కనిష్ట ఉష్ణోగ్రత {t_min}°C. వర్ష సూచన {t_rain}%."
            else:
                response_text = f"Weather Forecast for {location_name}: Tomorrow will be {t_cond} with a maximum temperature of {t_max}°C and minimum of {t_min}°C. Chance of precipitation is {t_rain}%."

        else: # CURRENT_WEATHER
            card_type = "WEATHER_CURRENT"
            card_data = {"current": current, "daily": daily[:3]}
            temp = current.get("temperature", 25)
            feels = current.get("apparent_temperature", temp)
            cond = current.get("condition", "Clear")
            hum = current.get("humidity", 50)
            wind = current.get("wind_speed", 10)
            
            if lang == "hi":
                response_text = f"{location_name} में वर्तमान मौसम: {temp}°C (महसूस {feels}°C), स्थिति: {cond}। आर्द्रता {hum}% है और हवा {wind} किमी/घंटा की गति से चल रही है।"
            elif lang == "ta":
                response_text = f"{location_name} தற்போதைய வானிலை: {temp}°C (உணர்தல் {feels}°C), {cond}. ஈரப்பதம் {hum}%, காற்றின் வேகம் {wind} கி.மீ/மணி."
            elif lang == "te":
                response_text = f"{location_name} ప్రస్తుత వాతావరణం: {temp}°C (అనిపించేది {feels}°C), {cond}. తేమ {hum}%, గాలి వేగం {wind} km/h."
            else:
                response_text = f"Current weather in {location_name} is {temp}°C (Feels like {feels}°C) with {cond}. Humidity is at {hum}%, and winds are blowing at {wind} km/h."

        return {
            "query": query,
            "detected_intent": intent,
            "language": lang,
            "location": {
                "name": location_name,
                "latitude": lat,
                "longitude": lon
            },
            "response_text": response_text,
            "card_type": card_type,
            "card_data": card_data,
            "active_alerts": alerts
        }

conversational_agent = ConversationalAgent()
