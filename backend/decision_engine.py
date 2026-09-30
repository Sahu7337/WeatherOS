from typing import Dict, Any, List

class DecisionEngine:
    """Decision Support System for Agriculture, Marine, Disaster Response, Aviation, and Urban Health."""

    def evaluate_agriculture(self, current: Dict[str, Any], forecast_daily: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Agricultural (Kisan) Agromet advisory."""
        temp = current.get("temperature", 25.0)
        humidity = current.get("humidity", 60.0)
        wind_speed = current.get("wind_speed", 10.0)
        precip = current.get("precipitation", 0.0)
        
        next_day_rain = forecast_daily[0].get("precipitation_sum", 0.0) if forecast_daily else 0.0
        next_day_prob = forecast_daily[0].get("precipitation_prob_max", 0.0) if forecast_daily else 0.0

        # 1. Spraying Advisory
        can_spray = True
        spray_reason = "Favorable weather window for chemical/organic spraying."
        if wind_speed > 15.0:
            can_spray = False
            spray_reason = f"Unfavorable: High wind speed ({wind_speed} km/h) causes chemical spray drift and poor deposition."
        elif next_day_prob > 50 or next_day_rain > 2.0 or precip > 0.0:
            can_spray = False
            spray_reason = f"Unfavorable: Rain forecast ({next_day_prob}% chance, {next_day_rain}mm) will wash off applied chemicals."
        elif temp > 35.0:
            can_spray = False
            spray_reason = f"Caution: High ambient temperature ({temp}°C) accelerates evaporation and can cause leaf scorch."

        # 2. Irrigation Advisory
        irrigation_needed = True
        irrigation_advice = "Normal scheduled irrigation recommended."
        if next_day_rain >= 10.0:
            irrigation_needed = False
            irrigation_advice = f"Withhold irrigation. Substantial rain ({next_day_rain} mm) expected; prevent root waterlogging."
        elif next_day_rain >= 3.0:
            irrigation_advice = f"Postpone irrigation by 24 hours to utilize expected rainfall ({next_day_rain} mm)."
        elif humidity < 35.0 and temp > 32.0:
            irrigation_advice = "High evapotranspiration rate. Provide light, frequent irrigation to maintain soil moisture."

        # 3. Fungal / Pest Risk
        pest_risk = "Low"
        pest_note = "Standard crop monitoring advised."
        if humidity > 80.0 and 22.0 <= temp <= 30.0:
            pest_risk = "High (Fungal Blast / Rust / Mildew Alert)"
            pest_note = "Prolonged high humidity and warm temperatures create optimal incubation for fungal pathogens. Inspect leaf undersides."
        elif humidity > 70.0:
            pest_risk = "Moderate"
            pest_note = "Watch for sucking pests (aphids/whiteflies) as humidity fluctuates."

        return {
            "spraying_advisory": {
                "status": "APPROVED" if can_spray else "NOT RECOMMENDED",
                "is_safe": can_spray,
                "reason": spray_reason
            },
            "irrigation_advisory": {
                "needed": irrigation_needed,
                "recommendation": irrigation_advice
            },
            "disease_pest_risk": {
                "level": pest_risk,
                "details": pest_note
            },
            "crop_calendar_notes": "Ensure proper field bunding to conserve natural runoff. Inspect drainage outlets in low-lying crop plots."
        }

    def evaluate_marine(self, marine_data: Dict[str, Any], current_weather: Dict[str, Any]) -> Dict[str, Any]:
        """Marine & Fishermen Coastal Advisory."""
        if not marine_data.get("is_marine_available"):
            return {
                "is_applicable": False,
                "message": "Selected location is inland. Marine advisories apply to coastal zones and ports."
            }

        wh = marine_data.get("wave_height", 0.0) or 0.0
        wind_kmh = current_weather.get("wind_speed", 10.0)
        wind_knots = round(wind_kmh / 1.852, 1)

        # Operational Advisory
        if wh >= 3.5 or wind_knots >= 28:
            status = "DANGER - DO NOT VENTURE"
            color = "#EF4444"
            advice = "Total suspension of all fishing operations. Fishermen out at sea are strongly advised to return to coast immediately."
            port_signal = "Local Cautionary Signal No. 3 / Danger Signal 8"
        elif wh >= 2.0 or wind_knots >= 20:
            status = "CAUTION - SMALL CRAFT ADVISORY"
            color = "#F59E0B"
            advice = "Small boats and non-motorized craft advised not to venture into deep sea. Motorized boats proceed with extreme caution."
            port_signal = "Cautionary Signal No. 1"
        else:
            status = "SAFE FOR FISHING"
            color = "#10B981"
            advice = "Normal sea conditions prevailing. Safe for all fishing craft and commercial operations."
            port_signal = "No warning signal hoisted"

        return {
            "is_applicable": True,
            "status": status,
            "color": color,
            "wave_height_meters": wh,
            "wind_speed_knots": wind_knots,
            "sea_state": marine_data.get("sea_state", "Normal"),
            "advisory": advice,
            "imd_port_signal": port_signal,
            "emergency_vhf_channel": "VHF Channel 16 (Marine Distress) & Coast Guard Toll Free 1554"
        }

    def evaluate_disaster_management(self, current: Dict[str, Any], alerts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Disaster Management & Civil Defense preparedness (NDRF / SDMA)."""
        has_red = any(a.get("severity") == "Red" for a in alerts)
        has_orange = any(a.get("severity") == "Orange" for a in alerts)
        
        if has_red:
            threat_level = "CRITICAL / SEVERE EMERGENCY"
            status_color = "#DC2626"
            action_items = [
                "Activate Incident Response System (IRS) and district emergency operations center (EOC).",
                "Pre-position NDRF / SDRF search and rescue battalions in high-risk taluks.",
                "Initiate preemptive evacuation of vulnerable riverine and coastal kutcha households to designated pucca cyclone/flood shelters.",
                "Stock dry rations, chlorine tablets, and mobile drinking water tankers in cyclone shelters.",
                "Issue public warning broadcasts via sirens, WhatsApp community channels, and local radio."
            ]
        elif has_orange:
            threat_level = "HEIGHTENED ALERT / READINESS"
            status_color = "#EA580C"
            action_items = [
                "Place quick reaction teams (QRTs) and municipal desilting pumps on standby.",
                "Inspect dewatering pumps in underpasses, subway shafts, and known waterlogging spots.",
                "Verify backup generators at district hospitals and telecommunication towers.",
                "Advise citizens to limit non-essential travel and keep battery torches and medicines charged."
            ]
        else:
            threat_level = "MONITORING / NORMALCY"
            status_color = "#10B981"
            action_items = [
                "Maintain standard 24x7 district control room telemetry monitoring.",
                "Routine upkeep of emergency equipment and drainage systems."
            ]

        return {
            "threat_level": threat_level,
            "status_color": status_color,
            "emergency_contacts": {
                "National Disaster Helpline": "1078",
                "State Disaster Management (SDMA)": "1070",
                "Ambulance Services": "108",
                "Fire & Rescue": "101",
                "Police Emergency": "112"
            },
            "sop_actions": action_items
        }

    def evaluate_aviation(self, current: Dict[str, Any]) -> Dict[str, Any]:
        """Aviation and Drone Logistics Weather Assessment."""
        cloud_cover = current.get("cloud_cover", 20)
        wind_speed = current.get("wind_speed", 10.0)
        wcode = current.get("weather_code", 0)

        # Basic flight rules classification
        if wcode in [45, 48, 95, 96, 99] or wind_speed > 45:
            flight_rule = "IFR / HAZARDOUS (Instrument Flight Only)"
            drone_status = "GROUNDED (High Risk)"
            notes = "Thunderstorms, dense fog, or high gust shear. Drone operations suspended. Commercial flights require diversion reserves."
        elif wind_speed > 25 or cloud_cover > 80:
            flight_rule = "MVFR (Marginal VFR)"
            drone_status = "RESTRICTED (Experienced Operators Only)"
            notes = "Moderate turbulence and reduced visibility. Monitor crosswinds on active runway."
        else:
            flight_rule = "VFR (Visual Flight Rules - Clear)"
            drone_status = "PERMITTED (Safe Conditions)"
            notes = "Calm to moderate winds with optimal ceiling and horizontal visibility."

        return {
            "flight_rule": flight_rule,
            "drone_status": drone_status,
            "crosswind_assessment": f"{wind_speed} km/h",
            "ceiling_visibility_note": notes
        }

decision_engine = DecisionEngine()
