from typing import Dict, Any, List
import datetime

class AlertsEngine:
    def __init__(self):
        # Sample active regional advisories representing real-world IMD subdivision feeds
        self.subdivision_alerts = [
            {
                "id": "ALERT-IMD-2026-081",
                "subdivision": "Odisha & Coastal Andhra Pradesh",
                "hazard": "Depression / Severe Squall",
                "severity": "Orange",
                "color_hex": "#F97316",
                "headline": "Squally winds 50-60 kmph gusting to 70 kmph over Westcentral Bay of Bengal",
                "valid_until": "Next 48 Hours",
                "impact": "Uprooting of small trees, localized waterlogging, rough to very rough sea conditions.",
                "action": "Fishermen are advised not to venture into Westcentral & adjoining Southwest Bay of Bengal. Regulate port operations."
            },
            {
                "id": "ALERT-IMD-2026-082",
                "subdivision": "West Rajasthan & Vidarbha",
                "hazard": "Heatwave to Severe Heatwave",
                "severity": "Orange",
                "color_hex": "#EA580C",
                "headline": "Maximum temperatures likely between 43°C - 45°C with severe heatwave conditions",
                "valid_until": "Next 72 Hours",
                "impact": "High probability of heat illness, dehydration, sunstroke, stress on livestock and power grids.",
                "action": "Avoid sun exposure between 12:00 noon and 3:30 pm. Keep cattle sheltered, ensure hydration."
            },
            {
                "id": "ALERT-IMD-2026-083",
                "subdivision": "Assam, Meghalaya & Sub-Himalayan West Bengal",
                "hazard": "Isolated Extremely Heavy Rainfall",
                "severity": "Red",
                "color_hex": "#DC2626",
                "headline": "Extremely heavy rainfall (> 204.4 mm) with flash flood threat in catchment areas",
                "valid_until": "Next 24 Hours",
                "impact": "Inundation of low-lying areas, localized landslides in hilly terrain, disruption of traffic.",
                "action": "Take extreme precaution. Evacuate vulnerable settlements near river embankments. Keep disaster response units on standby."
            },
            {
                "id": "ALERT-IMD-2026-084",
                "subdivision": "Konkan & Goa",
                "hazard": "Heavy Rainfall & Gusty Winds",
                "severity": "Yellow",
                "color_hex": "#EAB308",
                "headline": "Moderate to heavy rain accompanied with gusty winds 40-50 kmph",
                "valid_until": "Next 48 Hours",
                "impact": "Minor water pooling on city roads, temporary slowing of traffic.",
                "action": "Be aware of local weather updates before planning travel."
            },
            {
                "id": "ALERT-IMD-2026-085",
                "subdivision": "Punjab & Haryana",
                "hazard": "Thunderstorm & Lightning with Hail",
                "severity": "Yellow",
                "color_hex": "#EAB308",
                "headline": "Isolated thunderstorm with lightning and gusty winds (speed reaching 30-40 kmph)",
                "valid_until": "Next 24 Hours",
                "impact": "Risk of lightning strikes in open fields; minor damage to standing crops.",
                "action": "Do not take shelter under tall trees or metal sheds during lightning strikes."
            }
        ]

    def evaluate_live_alerts(self, current_weather: Dict[str, Any], forecast_daily: List[Dict[str, Any]], location_name: str = "") -> List[Dict[str, Any]]:
        """Evaluate incoming live telemetry against IMD warning thresholds."""
        alerts = []
        
        temp = current_weather.get("temperature", 25.0)
        wind_speed = current_weather.get("wind_speed", 10.0)
        wind_gusts = current_weather.get("wind_gusts", 15.0)
        wcode = current_weather.get("weather_code", 0)
        
        # 1. Heatwave Detection
        if temp >= 44.0:
            alerts.append({
                "id": f"LIVE-HW-{datetime.date.today()}",
                "hazard": "Severe Heatwave",
                "severity": "Red",
                "color_hex": "#DC2626",
                "headline": f"Severe Heatwave Alert: Local temperature currently {temp}°C",
                "impact": "Severe risk of heat stroke, heat cramps, and dehydration across all age demographics.",
                "action": "Stay indoors. Maintain high water and oral rehydration salt intake. Avoid peak afternoon sun."
            })
        elif temp >= 40.0:
            alerts.append({
                "id": f"LIVE-HW-{datetime.date.today()}",
                "hazard": "Heatwave Conditions",
                "severity": "Orange",
                "color_hex": "#EA580C",
                "headline": f"Heatwave Warning: Temperature at {temp}°C",
                "impact": "Moderate health concern for vulnerable individuals (infants, elderly, chronic illness).",
                "action": "Drink plenty of water even if not thirsty. Wear light, loose cotton clothes."
            })

        # 2. Thunderstorm / Lightning / Hail (WMO 95, 96, 99)
        if wcode in [95, 96, 99]:
            sev = "Red" if wcode == 99 else "Orange"
            alerts.append({
                "id": f"LIVE-TS-{datetime.date.today()}",
                "hazard": "Severe Thunderstorm & Lightning",
                "severity": sev,
                "color_hex": "#DC2626" if sev == "Red" else "#EA580C",
                "headline": "Active Thunderstorm with Lightning Activity Detected",
                "impact": "High risk of lightning strikes, localized flash pooling, minor structural damage.",
                "action": "Suspend all outdoor and farming activities immediately. Stay away from open fields and wire fences."
            })

        # 3. Squall / Wind Hazard
        if wind_speed >= 55.0 or wind_gusts >= 70.0:
            alerts.append({
                "id": f"LIVE-WIND-{datetime.date.today()}",
                "hazard": "Gale / Squally Winds",
                "severity": "Orange",
                "color_hex": "#EA580C",
                "headline": f"Squally Wind Alert: Gusts up to {wind_gusts} km/h",
                "impact": "Disruption of overhead power lines, falling branches, hazardous driving conditions.",
                "action": "Secure loose rooftop objects and hoardings. Drive with extreme caution."
            })

        # 4. Check upcoming 24-48h daily forecast for Heavy Rainfall
        if forecast_daily:
            tomorrow_rain = forecast_daily[0].get("precipitation_sum", 0.0)
            if tomorrow_rain >= 115.5:
                alerts.append({
                    "id": f"LIVE-RAIN-RED-{datetime.date.today()}",
                    "hazard": "Extremely Heavy Rainfall Forecast",
                    "severity": "Red",
                    "color_hex": "#DC2626",
                    "headline": f"Forecast predicts {tomorrow_rain} mm rainfall in next 24h",
                    "impact": "Severe urban waterlogging, potential flash flood in low-lying catchments.",
                    "action": "Avoid travel unless essential. Move livestock and valuables to elevated shelters."
                })
            elif tomorrow_rain >= 64.5:
                alerts.append({
                    "id": f"LIVE-RAIN-ORG-{datetime.date.today()}",
                    "hazard": "Heavy to Very Heavy Rainfall",
                    "severity": "Orange",
                    "color_hex": "#EA580C",
                    "headline": f"Heavy rainfall forecast ({tomorrow_rain} mm expected)",
                    "impact": "Localized water accumulation on roads and crop fields.",
                    "action": "Ensure agricultural field drainage channels are cleared."
                })

        # If no severe alerts, check if regional subdivision matches location
        matched_sub = [
            a for a in self.subdivision_alerts 
            if location_name.lower() in a["subdivision"].lower() or any(word in a["subdivision"].lower() for word in location_name.lower().split())
        ]
        
        combined = alerts + matched_sub
        if not combined:
            combined.append({
                "id": "IMD-ALL-CLEAR",
                "hazard": "Normal Weather Conditions",
                "severity": "Green",
                "color_hex": "#10B981",
                "headline": "No adverse weather warning for this region.",
                "impact": "Normal seasonal conditions prevailing.",
                "action": "No special actions required. Continue routine operations."
            })
            
        return combined

    def get_national_alert_bulletin(self) -> List[Dict[str, Any]]:
        """Return the current national active alert registry."""
        return self.subdivision_alerts

alerts_engine = AlertsEngine()
