const { useState, useEffect, useRef } = React;

// Supported Languages Metadata
const LANGUAGES = {
  en: { name: "English", native: "English" },
  or: { name: "Odia", native: "ଓଡ଼ିଆ" },
  bn: { name: "Bengali", native: "বাংলা" },
  ta: { name: "Tamil", native: "தமிழ்" },
  te: { name: "Telugu", native: "తెలుగు" },
  mr: { name: "Marathi", native: "मराठी" },
  gu: { name: "Gujarati", native: "ગુજરાતી" },
  kn: { name: "Kannada", native: "ಕನ್ನಡ" },
  ml: { name: "Malayalam", native: "മലയാളം" },
  pa: { name: "Punjabi", native: "ਪੰਜਾਬੀ" }
};

// Preset Stations
const QUICK_STATIONS = [
  { name: "New Delhi, Delhi", lat: 28.6139, lon: 77.2090, region: "North" },
  { name: "Mumbai, Maharashtra", lat: 19.0760, lon: 72.8777, region: "West / Coast" },
  { name: "Bengaluru, Karnataka", lat: 12.9716, lon: 77.5946, region: "South" },
  { name: "Kolkata, West Bengal", lat: 22.5726, lon: 88.3639, region: "East" },
  { name: "Chennai, Tamil Nadu", lat: 13.0827, lon: 80.2707, region: "South / Coast" },
  { name: "Visakhapatnam, Andhra Pradesh", lat: 17.6868, lon: 83.2185, region: "East / Coast" },
  { name: "Srinagar, Jammu & Kashmir", lat: 34.0837, lon: 74.7973, region: "North / Himalayas" },
  { name: "Guwahati, Assam", lat: 26.1445, lon: 91.7362, region: "North-East" },
  { name: "Jaipur, Rajasthan", lat: 26.9124, lon: 75.7873, region: "Arid / West" },
  { name: "Bhubaneswar, Odisha", lat: 20.2961, lon: 85.8245, region: "East" }
];

// Toast notification
function showToast(message) {
  let toast = document.getElementById("aj-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "aj-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

// Minimalist Monochromatic Weather Icons
function WeatherIcon({ name, className = "w-6 h-6" }) {
  switch (name) {
    case "Sun":
      return (
        <svg className={`${className} text-current`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      );
    case "CloudSun":
    case "SunDim":
      return (
        <svg className={`${className} text-current`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case "CloudRain":
    case "CloudRainWind":
    case "CloudDrizzle":
      return (
        <svg className={`${className} text-current`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 14l-2 4m5-4l-2 4m-7-4l-2 4" />
        </svg>
      );
    case "CloudLightning":
      return (
        <svg className={`${className} text-current`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    default:
      return (
        <svg className={`${className} text-current`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      );
  }
}

function App() {
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute("data-theme") ||
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  const [language, setLanguage] = useState("en");
  const [selectedCity, setSelectedCity] = useState({
    name: "New Delhi, Delhi",
    lat: 28.6139,
    lon: 77.2090
  });

  const [activeTab, setActiveTab] = useState("overview"); // overview, agromet, marine, disaster, climate, map
  const [weatherData, setWeatherData] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [marineData, setMarineData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [nationalAlerts, setNationalAlerts] = useState([]);
  const [climateTrends, setClimateTrends] = useState(null);
  const [agriAdvisory, setAgriAdvisory] = useState(null);
  const [disasterSop, setDisasterSop] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modals
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isColophonOpen, setIsColophonOpen] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "ai",
      text: "WeatherOS Intelligence active. Query local forecasts, IMD warnings, Kisan agromet directives, marine safety metrics, or 45-year climate trends.",
      cardType: null,
      cardData: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isSubmittingChat, setIsSubmittingChat] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const chatBottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(new Audio());
  const climateChartRef = useRef(null);
  const mapRef = useRef(null);
  const mapTileLayerRef = useRef(null);

  // Toggle Theme Function
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.style.colorScheme = next;
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    showToast(`Theme: ${next}`);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
      const isInputActive = activeTag === "input" || activeTag === "textarea" || activeTag === "select";

      if (e.key === "Escape") {
        if (isPaletteOpen) setIsPaletteOpen(false);
        else if (isShortcutsOpen) setIsShortcutsOpen(false);
        else if (isColophonOpen) setIsColophonOpen(false);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
        return;
      }

      if (isInputActive) return;

      if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleTheme();
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
        return;
      }

      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        setIsColophonOpen(prev => !prev);
        return;
      }

      const tabKeys = {
        "1": "overview",
        "2": "agromet",
        "3": "marine",
        "4": "disaster",
        "5": "climate",
        "6": "map"
      };
      if (tabKeys[e.key]) {
        e.preventDefault();
        setActiveTab(tabKeys[e.key]);
        showToast(`View: ${tabKeys[e.key].toUpperCase()}`);
        return;
      }

      if (e.key.toLowerCase() === "v") {
        e.preventDefault();
        toggleListening();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [theme, isPaletteOpen, isShortcutsOpen, isColophonOpen]);

  // Load weather and decision data whenever selected city changes
  useEffect(() => {
    fetchWeatherData(selectedCity.lat, selectedCity.lon, selectedCity.name);
  }, [selectedCity]);

  // Load national bulletin once
  useEffect(() => {
    fetch("/api/alerts/bulletin")
      .then(res => res.json())
      .then(data => setNationalAlerts(data.national_bulletin || []))
      .catch(err => console.error("Error fetching national alerts:", err));
  }, []);

  // Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      const langCodes = {
        en: "en-IN", or: "or-IN", ta: "ta-IN", te: "te-IN", bn: "bn-IN",
        mr: "mr-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN"
      };
      recognition.lang = langCodes[language] || "en-IN";

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        handleSendChat(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [language]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Initialize / Update Leaflet Map
  useEffect(() => {
    if (activeTab === "map") {
      setTimeout(() => {
        const container = document.getElementById("weather-map");
        if (container && !mapRef.current) {
          const map = L.map("weather-map").setView([selectedCity.lat, selectedCity.lon], 6);
          const tileUrl = theme === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

          const tileLayer = L.tileLayer(tileUrl, {
            attribution: "© OpenStreetMap © CARTO",
            subdomains: "abcd",
            maxZoom: 19
          }).addTo(map);

          mapTileLayerRef.current = tileLayer;

          L.marker([selectedCity.lat, selectedCity.lon]).addTo(map)
            .bindPopup(`<b>${selectedCity.name}</b><br>Lat: ${selectedCity.lat.toFixed(3)}, Lon: ${selectedCity.lon.toFixed(3)}`)
            .openPopup();

          const radarStations = [
            { name: "New Delhi Radar (IMD Palam)", lat: 28.56, lon: 77.10 },
            { name: "Mumbai Doppler Radar (Colaba)", lat: 18.90, lon: 72.81 },
            { name: "Kolkata Doppler Radar", lat: 22.53, lon: 88.34 },
            { name: "Chennai Doppler Radar", lat: 13.08, lon: 80.28 },
            { name: "Visakhapatnam Cyclone Radar", lat: 17.70, lon: 83.30 }
          ];

          radarStations.forEach(st => {
            L.circle([st.lat, st.lon], {
              color: theme === "dark" ? "#a1a1aa" : "#4b5563",
              weight: 1,
              fillColor: theme === "dark" ? "#ffffff" : "#000000",
              fillOpacity: 0.05,
              radius: 120000
            }).addTo(map).bindPopup(`<b>${st.name}</b><br>Radar Sweep Active`);
          });

          mapRef.current = map;
        } else if (mapRef.current) {
          mapRef.current.invalidateSize();
          mapRef.current.setView([selectedCity.lat, selectedCity.lon], 6);

          if (mapTileLayerRef.current) {
            const newTileUrl = theme === "dark"
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
            mapTileLayerRef.current.setUrl(newTileUrl);
          }
        }
      }, 150);
    }
  }, [activeTab, selectedCity, theme]);

  // Render Theme-Aware Monochrome Climate Chart
  useEffect(() => {
    if (activeTab === "climate" && climateTrends) {
      setTimeout(() => {
        const ctx = document.getElementById("climateDecadalChart");
        if (ctx) {
          if (climateChartRef.current) {
            climateChartRef.current.destroy();
          }

          const labels = climateTrends.decadal_trends.map(d => d.decade);
          const temps = climateTrends.decadal_trends.map(d => d.mean_temp);
          const rainfall = climateTrends.decadal_trends.map(d => d.annual_rainfall_mm);

          const isDark = theme === "dark";
          const tempLineColor = isDark ? "#ffffff" : "#000000";
          const barColor = isDark ? "rgba(180, 180, 180, 0.2)" : "rgba(80, 80, 80, 0.15)";
          const gridColor = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)";
          const labelColor = isDark ? "#b5b5b5" : "#666666";

          climateChartRef.current = new Chart(ctx, {
            type: "line",
            data: {
              labels: labels,
              datasets: [
                {
                  label: "Mean Temperature (°C)",
                  data: temps,
                  borderColor: tempLineColor,
                  backgroundColor: "transparent",
                  yAxisID: "y",
                  tension: 0.2,
                  fill: false,
                  borderWidth: 1.5,
                  pointBackgroundColor: tempLineColor,
                  pointBorderColor: isDark ? "#000000" : "#ffffff",
                  pointBorderWidth: 1,
                  pointRadius: 3.5,
                  pointHoverRadius: 5
                },
                {
                  label: "Annual Rainfall (mm)",
                  data: rainfall,
                  borderColor: labelColor,
                  backgroundColor: barColor,
                  yAxisID: "y1",
                  borderWidth: 1,
                  type: "bar"
                }
              ]
            },
            options: {
              responsive: true,
              interaction: {
                mode: "index",
                intersect: false,
              },
              scales: {
                y: {
                  type: "linear",
                  display: true,
                  position: "left",
                  title: { display: true, text: "Temperature (°C)", color: labelColor, font: { size: 11, family: "Poppins" } },
                  grid: { color: gridColor },
                  ticks: { color: labelColor, font: { family: "JetBrains Mono", size: 10 } }
                },
                y1: {
                  type: "linear",
                  display: true,
                  position: "right",
                  title: { display: true, text: "Rainfall (mm)", color: labelColor, font: { size: 11, family: "Poppins" } },
                  grid: { drawOnChartArea: false },
                  ticks: { color: labelColor, font: { family: "JetBrains Mono", size: 10 } }
                },
                x: {
                  grid: { color: gridColor },
                  ticks: { color: labelColor, font: { family: "JetBrains Mono", size: 10 } }
                }
              },
              plugins: {
                legend: {
                  labels: {
                    color: isDark ? "#f0f0f0" : "#000000",
                    font: { size: 11, family: "Poppins" },
                    boxWidth: 10
                  }
                }
              }
            }
          });
        }
      }, 150);
    }
  }, [activeTab, climateTrends, theme]);

  // Main Data Fetcher
  const fetchWeatherData = async (lat, lon, cityName) => {
    try {
      const weatherRes = await fetch(`/api/weather/current?lat=${lat}&lon=${lon}`);
      setWeatherData(await weatherRes.json());

      const aqiRes = await fetch(`/api/weather/air-quality?lat=${lat}&lon=${lon}`);
      setAirQuality(await aqiRes.json());

      const marineRes = await fetch(`/api/weather/marine?lat=${lat}&lon=${lon}`);
      setMarineData(await marineRes.json());

      const alertsRes = await fetch(`/api/alerts/live?lat=${lat}&lon=${lon}&location=${encodeURIComponent(cityName)}`);
      const alertData = await alertsRes.json();
      setAlerts(alertData.alerts || []);

      const climateRes = await fetch(`/api/climate/historical?lat=${lat}&lon=${lon}`);
      setClimateTrends(await climateRes.json());

      const agriRes = await fetch(`/api/decision/agromet?lat=${lat}&lon=${lon}`);
      setAgriAdvisory(await agriRes.json());

      const sopRes = await fetch(`/api/decision/disaster?lat=${lat}&lon=${lon}&location=${encodeURIComponent(cityName)}`);
      setDisasterSop(await sopRes.json());

    } catch (err) {
      console.error("Telemetry error:", err);
      showToast("Telemetry fetch error");
    }
  };

  // Search handler
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/weather/search?query=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectLocation = (loc) => {
    const fullLocName = `${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}`;
    setSelectedCity({
      name: fullLocName,
      lat: loc.latitude,
      lon: loc.longitude
    });
    setSearchQuery("");
    setSearchResults([]);
    setIsPaletteOpen(false);
    showToast(`Station: ${loc.name}`);
  };

  // GPS
  const handleUseGPS = () => {
    if ("geolocation" in navigator) {
      showToast("Accessing GPS...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setSelectedCity({
            name: `Device Station (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
            lat: lat,
            lon: lon
          });
          showToast("Synchronized via GPS");
        },
        () => showToast("GPS access denied")
      );
    } else {
      showToast("Geolocation unavailable");
    }
  };

  // Conversational AI messaging
  const handleSendChat = async (presetText = null) => {
    const queryText = presetText || userInput;
    if (!queryText.trim() || isSubmittingChat) return;

    const userMsg = {
      sender: "user",
      text: queryText,
      cardType: null,
      cardData: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!presetText) setUserInput("");
    setIsSubmittingChat(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryText,
          language: language,
          latitude: selectedCity.lat,
          longitude: selectedCity.lon,
          location_name: selectedCity.name
        })
      });

      const data = await response.json();
      const aiMsg = {
        sender: "ai",
        text: data.reply,
        cardType: data.card_type,
        cardData: data.card_payload,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, aiMsg]);

      if (data.audio_base64) {
        playAudioBase64(data.audio_base64);
      }

    } catch (err) {
      console.error("Chat engine failed:", err);
      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: "Communication with the meteorological intelligence engine was interrupted.",
          cardType: null,
          cardData: null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSubmittingChat(false);
    }
  };

  const playAudioBase64 = (base64) => {
    try {
      const audio = audioRef.current;
      audio.src = `data:audio/mp3;base64,${base64}`;
      setIsPlayingAudio(true);
      audio.play().catch(() => setIsPlayingAudio(false));
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
    } catch (err) {
      setIsPlayingAudio(false);
    }
  };

  const speakResponse = async (text) => {
    try {
      showToast("Generating voice...");
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language })
      });
      const data = await res.json();
      if (data.audio_base64) {
        playAudioBase64(data.audio_base64);
      }
    } catch (err) {
      console.error("TTS error:", err);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showToast("Speech recognition not supported in browser");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      showToast("Microphone closed");
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showToast("Listening... speak query");
      } catch (e) {
        console.error("Speech error:", e);
      }
    }
  };

  const highestAlert = alerts.length > 0
    ? alerts.reduce((max, curr) => {
        const order = { Red: 4, Orange: 3, Yellow: 2, Green: 1 };
        return (order[curr.severity] || 0) > (order[max.severity] || 0) ? curr : max;
      }, alerts[0])
    : { severity: "Green", hazard: "Normal Conditions", headline: "No extreme hazards active" };

  const paletteFilteredStations = QUICK_STATIONS.filter(s =>
    s.name.toLowerCase().includes(paletteQuery.toLowerCase()) ||
    s.region.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      {/* 1. MINIMALIST EDITORIAL HEADER (Strictly on #fafafa ground) */}
      <header className="w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          
          {/* Logo & Operational Status */}
          <div className="flex items-baseline space-x-3 cursor-pointer shrink-0" onClick={() => setActiveTab("overview")}>
            <span className="font-semibold text-xl tracking-tight hover-lift">WeatherOS</span>
            <span className="text-xs text-neutral-400 font-normal">Meteorological Intelligence</span>
          </div>

          {/* Search Line & Controls (Left-aligned) */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Minimalist Search */}
            <div className="relative flex items-center bg-neutral-100 dark:bg-neutral-800/60 px-2.5 py-1 rounded w-48 sm:w-64">
              <input
                type="text"
                placeholder="Search station..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-transparent border-none text-xs text-current placeholder-neutral-400 focus:outline-none w-full"
              />
              <button
                onClick={() => setIsPaletteOpen(true)}
                title="Command Palette (⌘K)"
                className="aj-kbd mr-1 hidden sm:inline-block cursor-pointer hover:border-black dark:hover:border-white"
              >
                ⌘K
              </button>
              <button
                onClick={handleUseGPS}
                title="Use GPS"
                className="text-neutral-400 hover:text-current transition p-0.5 hover-lift"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </button>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-8 bg-[#fafafa] dark:bg-[#171717] shadow-lg rounded z-50 max-h-56 overflow-y-auto">
                  {searchResults.map((loc, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectLocation(loc)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between text-neutral-700 dark:text-neutral-300 transition"
                    >
                      <span>{loc.name}{loc.admin1 ? ` (${loc.admin1})` : ''}</span>
                      <span className="text-[10px] text-neutral-400 font-mono-num">{loc.country_code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Alert Tag */}
            <div
              className={`status-tag cursor-pointer ${highestAlert.severity === 'Red' ? 'alert-pulse-urgent' : ''}`}
              onClick={() => setActiveTab("disaster")}
              title="IMD Early Warnings"
            >
              <span>ALERT: {highestAlert.severity.toUpperCase()}</span>
            </div>

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                showToast(`Language: ${LANGUAGES[e.target.value]?.name}`);
              }}
              className="bg-transparent text-xs py-0.5 text-current focus:outline-none cursor-pointer transition"
            >
              {Object.entries(LANGUAGES).map(([code, meta]) => (
                <option key={code} value={code} className="bg-[#fafafa] dark:bg-[#171717] text-current">
                  {meta.native}
                </option>
              ))}
            </select>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle Theme (L)"
              className="text-neutral-500 hover:text-current transition p-1 hover-lift cursor-pointer"
            >
              {theme === "dark" ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="5" strokeWidth="1.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

          </div>

        </div>
      </header>

      {/* 2. TELEMETRY STATUS LINE (Left-aligned) */}
      <section className="w-full text-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-2 flex flex-wrap items-center gap-4 text-neutral-500">
          <div className="flex items-center space-x-2">
            <span className="section-label">STATION:</span>
            <span className="text-current font-medium">{selectedCity.name}</span>
            <span className="font-mono-num text-[11px] text-neutral-400">
              [{selectedCity.lat.toFixed(3)}°N, {selectedCity.lon.toFixed(3)}°E]
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-mono-num text-neutral-400">
            <span>·</span>
            <span>ECMWF / GFS</span>
            <span className="text-current">SYNCHRONIZED</span>
          </div>
        </div>
      </section>

      {/* 3. MAIN EDITORIAL CONTENT (No Cards, Pure #fafafa Ground) */}
      <main className="w-full flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-12">

        {/* DOMAIN NAVIGATION (Clean Flat Links with Hairline Indicator) */}
        <nav className="tab-nav-bar" aria-label="Navigation Tabs">
          {[
            { id: "overview", label: "Forecast & AQI" },
            { id: "agromet", label: "Kisan Agromet" },
            { id: "marine", label: "Marine & Coast" },
            { id: "disaster", label: "Suraksha Alerts" },
            { id: "climate", label: "Climate Observatory" },
            { id: "map", label: "Radar & Map" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-nav-link ${activeTab === tab.id ? "active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* TAB 1: OVERVIEW & FORECAST */}
        {activeTab === "overview" && weatherData && (
          <div className="space-y-12">
            
            {/* HERO WEATHER DISPLAY (Like Pomodoro Timer Clock on #fafafa, Strictly Left-Aligned) */}
            <div className="space-y-1 text-left">
              <h1 className="text-2xl font-semibold tracking-tight">{selectedCity.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-mono-num">
                <span>{weatherData.current?.time || "Observed"}</span>
                <span>·</span>
                <span className="text-neutral-700 dark:text-neutral-300 font-sans">{weatherData.current?.condition}</span>
                <span>·</span>
                <span>APPARENT {weatherData.current?.apparent_temperature}°C</span>
              </div>

              {/* Massive Minimalist Temperature Numeral */}
              <div className="flex items-baseline space-x-6 my-6 hover-lift">
                <div className="text-8xl sm:text-9xl font-extralight font-mono-num tracking-tighter leading-none text-current">
                  {weatherData.current?.temperature}°
                </div>
                <div className="pb-3 text-neutral-600 dark:text-neutral-300">
                  <WeatherIcon name={weatherData.current?.icon} className="w-16 h-16 sm:w-20 sm:h-20" />
                </div>
              </div>

              {/* Clean Telemetry Metrics Row (Flat, Borderless, Left-Aligned) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-3 text-xs font-mono-num text-left">
                <div className="hover-lift">
                  <div className="section-label">Humidity</div>
                  <div className="text-lg font-light text-current mt-0.5">{weatherData.current?.humidity}%</div>
                </div>
                <div className="hover-lift">
                  <div className="section-label">Wind</div>
                  <div className="text-lg font-light text-current mt-0.5">{weatherData.current?.wind_speed} km/h</div>
                </div>
                <div className="hover-lift">
                  <div className="section-label">Pressure</div>
                  <div className="text-lg font-light text-current mt-0.5">{weatherData.current?.pressure} hPa</div>
                </div>
                <div className="hover-lift">
                  <div className="section-label">Precipitation</div>
                  <div className="text-lg font-light text-current mt-0.5">{weatherData.current?.precipitation} mm</div>
                </div>
              </div>

            </div>

            {/* 24-HOUR HOURLY TIMELINE (Flat, Left-Aligned) */}
            <div className="text-left">
              <div className="section-label mb-3">Hourly Forecast (24h)</div>
              <div className="flex space-x-6 overflow-x-auto pb-2">
                {weatherData.hourly?.slice(0, 14).map((hr, idx) => (
                  <div key={idx} className="hourly-col shrink-0 text-left min-w-[56px] space-y-1.5">
                    <div className="text-[11px] text-neutral-400 font-mono-num">{hr.time?.split("T")[1]}</div>
                    <div className="flex justify-start text-current py-0.5">
                      <WeatherIcon name={hr.weather_code === 0 ? "Sun" : hr.precipitation > 0 ? "CloudRain" : "Cloud"} className="w-4 h-4" />
                    </div>
                    <div className="hourly-temp text-sm font-mono-num font-normal text-current transition">{hr.temperature}°</div>
                    <div className="text-[10px] text-neutral-400 font-mono-num">{hr.precipitation_prob}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AIR QUALITY (AQI) SECTION (Flat Editorial Layout, Borderless, Left-Aligned) */}
            {airQuality && (
              <div className="pt-2 text-left">
                <div className="section-label mb-3">Air Quality Telemetry</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-baseline py-3 text-left">
                  <div className="hover-lift">
                    <div className="text-6xl font-extralight font-mono-num text-current leading-none">
                      {airQuality.aqi}
                    </div>
                    <div className="text-xs font-mono-num uppercase tracking-wider text-current font-medium mt-2">
                      {airQuality.category}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {airQuality.advice}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono-num text-left">
                    <div className="hover-lift">
                      <div className="text-[10px] text-neutral-400 uppercase">PM2.5</div>
                      <div className="font-light text-current">{airQuality.pm2_5 || 'N/A'} µg/m³</div>
                    </div>
                    <div className="hover-lift">
                      <div className="text-[10px] text-neutral-400 uppercase">PM10</div>
                      <div className="font-light text-current">{airQuality.pm10 || 'N/A'} µg/m³</div>
                    </div>
                    <div className="hover-lift">
                      <div className="text-[10px] text-neutral-400 uppercase">NO2</div>
                      <div className="font-light text-current">{airQuality.no2 || 'N/A'} µg/m³</div>
                    </div>
                    <div className="hover-lift">
                      <div className="text-[10px] text-neutral-400 uppercase">Ozone</div>
                      <div className="font-light text-current">{airQuality.o3 || 'N/A'} µg/m³</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 10-DAY SYNOPTIC OUTLOOK (Flat Table / Row Layout, Left-Aligned) */}
            <div className="text-left">
              <div className="section-label mb-3">10-Day Synoptic Meteorological Outlook</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-4 py-3 text-left">
                {weatherData.daily?.map((day, idx) => (
                  <div key={idx} className="synoptic-item text-left space-y-1.5">
                    <div className="text-[11px] font-mono-num text-neutral-400">
                      {idx === 0 ? "Today" : day.date.slice(5)}
                    </div>
                    <div className="flex justify-start text-current">
                      <WeatherIcon name={day.icon} className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-mono-num text-current">
                      {day.temp_max}° <span className="text-neutral-400">{day.temp_min}°</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono-num">
                      {day.precipitation_prob_max}% rain
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: KISAN AGROMET */}
        {activeTab === "agromet" && agriAdvisory && (
          <div className="space-y-8">
            <div className="pb-2">
              <h2 className="text-xl font-semibold tracking-tight">Kisan Agromet Decision Support</h2>
              <p className="text-xs text-neutral-400 mt-1">ICAR / IMD Agromet Protocol · Micro-climate based crop protection</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-2 text-left">
              <div className="space-y-2 hover-lift">
                <div className="flex items-center space-x-3">
                  <span className="section-label">Spraying Feasibility</span>
                  <span className="status-tag active font-mono-num text-[11px]">{agriAdvisory.spraying_advisory.status}</span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {agriAdvisory.spraying_advisory.reason}
                </p>
                <p className="text-[11px] text-neutral-400 font-mono-num pt-1">
                  Threshold: Wind &lt; 15 km/h, Rain &lt; 20%
                </p>
              </div>

              <div className="space-y-2 hover-lift">
                <div className="flex items-center space-x-3">
                  <span className="section-label">Field Irrigation</span>
                  <span className="status-tag active font-mono-num text-[11px]">{agriAdvisory.irrigation_advisory.needed ? 'REQUIRED' : 'WITHHOLD'}</span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {agriAdvisory.irrigation_advisory.recommendation}
                </p>
                <p className="text-[11px] text-neutral-400 font-mono-num pt-1">
                  Optimized for soil moisture deficit
                </p>
              </div>

              <div className="space-y-2 hover-lift">
                <div className="flex items-center space-x-3">
                  <span className="section-label">Disease / Pest Risk</span>
                  <span className="status-tag font-mono-num text-[11px]">{agriAdvisory.disease_pest_risk.level}</span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {agriAdvisory.disease_pest_risk.details}
                </p>
                <p className="text-[11px] text-neutral-400 font-mono-num pt-1">
                  RH trigger &gt; 80%
                </p>
              </div>
            </div>

            <div className="py-3 text-xs leading-relaxed text-left">
              <span className="section-label mr-2">Crop Calendar Directive:</span>
              <span className="text-neutral-700 dark:text-neutral-300">{agriAdvisory.crop_calendar_notes}</span>
            </div>
          </div>
        )}

        {/* TAB 3: MARINE & COAST */}
        {activeTab === "marine" && marineData && (
          <div className="space-y-8 text-left">
            <div className="pb-2">
              <h2 className="text-xl font-semibold tracking-tight">Matsya Mitra — Coastal Marine Safety</h2>
              <p className="text-xs text-neutral-400 mt-1">INCOIS Standard · Sea state, wave dynamics & vessel safety</p>
            </div>

            {!marineData.is_marine_available ? (
              <div className="py-6 text-left text-xs text-neutral-500 space-y-2">
                <p>{marineData.reason}</p>
                <p className="font-mono-num">
                  Select coastal station:{" "}
                  <button onClick={() => setSelectedCity({ name: "Visakhapatnam, Andhra Pradesh", lat: 17.6868, lon: 83.2185 })} className="underline hover:text-current cursor-pointer">Visakhapatnam</button> |{" "}
                  <button onClick={() => setSelectedCity({ name: "Chennai, Tamil Nadu", lat: 13.0827, lon: 80.2707 })} className="underline hover:text-current cursor-pointer">Chennai</button> |{" "}
                  <button onClick={() => setSelectedCity({ name: "Mumbai, Maharashtra", lat: 19.0760, lon: 72.8777 })} className="underline hover:text-current cursor-pointer">Mumbai</button>
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-3 text-left">
                  <div className="hover-lift">
                    <div className="section-label">Significant Wave Height</div>
                    <div className="text-6xl font-extralight font-mono-num text-current mt-2">
                      {marineData.wave_height} <span className="text-xs font-normal text-neutral-400">m</span>
                    </div>
                    <div className="text-xs font-mono-num text-neutral-400 mt-1">Sea State: {marineData.sea_state}</div>
                  </div>

                  <div className="hover-lift">
                    <div className="section-label">Operational Status</div>
                    <div className="text-2xl font-light font-mono-num text-current mt-4">
                      {marineData.safety_level}
                    </div>
                    <div className="text-xs font-mono-num text-neutral-400 mt-2">VHF Channel 16 Active</div>
                  </div>

                  <div className="hover-lift">
                    <div className="section-label">Swell Period & Direction</div>
                    <div className="text-6xl font-extralight font-mono-num text-current mt-2">
                      {marineData.wave_period || '7.5'} <span className="text-xs font-normal text-neutral-400">s</span>
                    </div>
                    <div className="text-xs font-mono-num text-neutral-400 mt-1">Direction: {marineData.wave_direction || 210}°</div>
                  </div>
                </div>

                <div className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed text-left">
                  <span className="section-label mr-2">Fishermen Directive:</span>
                  Small craft and motorized vessels should monitor swell changes and keep marine VHF radio active.
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SURAKSHA ALERTS */}
        {activeTab === "disaster" && (
          <div className="space-y-8 text-left">
            <div className="pb-2">
              <h2 className="text-xl font-semibold tracking-tight">Suraksha — IMD Early Warnings & NDRF Response</h2>
              <p className="text-xs text-neutral-400 mt-1">NDMA Protocols · Color-coded extreme weather notifications</p>
            </div>

            {/* Active Station Alerts */}
            <div className="space-y-4">
              <div className="section-label">Active Warnings: {selectedCity.name}</div>
              {alerts.map((al, idx) => (
                <div key={idx} className="py-2.5 space-y-1 text-xs hover-lift text-left">
                  <div className="flex items-center space-x-2">
                    <span className="status-tag active font-mono-num text-[10px]">{al.severity}</span>
                    <span className="font-semibold">{al.hazard}</span>
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300">{al.headline}</p>
                  <p className="text-neutral-500 font-mono-num"><span className="section-label">Impact:</span> {al.impact}</p>
                  <p className="text-neutral-700 dark:text-neutral-300"><span className="section-label">Directive:</span> {al.action}</p>
                </div>
              ))}
            </div>

            {/* Emergency Helplines */}
            <div className="pt-4 text-left">
              <div className="section-label mb-3">Emergency Helplines (24x7)</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-3 text-left">
                {[
                  { label: "NDRF", num: "1078" },
                  { label: "State Disaster", num: "1070" },
                  { label: "Ambulance", num: "108" },
                  { label: "Fire & Rescue", num: "101" },
                  { label: "Police", num: "112" }
                ].map((h, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(h.num);
                        showToast(`Copied ${h.label} (${h.num})`);
                      }
                    }}
                    className="helpline-item text-left"
                    title="Click to copy helpline"
                  >
                    <div className="section-label">{h.label}</div>
                    <div className="helpline-num text-2xl font-light font-mono-num text-current mt-0.5">{h.num}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* National Bulletins */}
            <div className="text-left">
              <div className="section-label mb-3">National IMD Meteorological Bulletins</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-left">
                {nationalAlerts.map((b, idx) => (
                  <div key={idx} className="py-2 text-xs hover-lift text-left">
                    <div className="flex items-center space-x-3 mb-0.5">
                      <span className="font-medium">{b.subdivision}</span>
                      <span className="status-tag font-mono-num text-[10px]">{b.severity}</span>
                    </div>
                    <div className="text-neutral-600 dark:text-neutral-400">{b.hazard} · {b.headline}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CLIMATE OBSERVATORY */}
        {activeTab === "climate" && climateTrends && (
          <div className="space-y-8 text-left">
            <div className="pb-2">
              <h2 className="text-xl font-semibold tracking-tight">Climate Observatory: 45-Year Historical Analysis</h2>
              <p className="text-xs text-neutral-400 mt-1">ERA5 Baseline · Decadal temperature anomalies (1980 - 2025)</p>
            </div>

            {/* Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-3 text-left">
              <div className="hover-lift">
                <div className="section-label">Net Decadal Warming</div>
                <div className="text-5xl font-extralight font-mono-num text-current mt-1">{climateTrends.net_warming}</div>
                <div className="text-[11px] text-neutral-400 font-mono-num mt-1">{climateTrends.warming_rate_per_decade}</div>
              </div>
              <div className="hover-lift">
                <div className="section-label">Monsoon Anomaly</div>
                <div className="text-5xl font-extralight font-mono-num text-current mt-1">{climateTrends.monsoon_anomaly}</div>
                <div className="text-[11px] text-neutral-400 font-mono-num mt-1">vs 30-Year Normal</div>
              </div>
              <div className="hover-lift">
                <div className="section-label">Dataset Timespan</div>
                <div className="text-5xl font-extralight font-mono-num text-current mt-1">45 Yrs</div>
                <div className="text-[11px] text-neutral-400 font-mono-num mt-1">Continuous Historical Record</div>
              </div>
            </div>

            {/* Chart directly on #fafafa (No box) */}
            <div className="py-2 text-left">
              <div className="section-label mb-4">Historical Temperature & Precipitation Curve</div>
              <canvas id="climateDecadalChart" height="90"></canvas>
            </div>

            {/* Extreme Heat Days */}
            <div className="pt-3 text-left">
              <div className="section-label mb-3">Extreme Heat Days (Temp &gt; 40°C) per Decade</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-left text-xs font-mono-num py-2">
                {climateTrends.heatwave_frequency?.map((h, i) => (
                  <div key={i} className="hover-lift text-left">
                    <div className="text-neutral-400 text-[11px]">{h.decade}</div>
                    <div className="text-xl font-light text-current mt-0.5">{h.avg_days} <span className="text-[10px] text-neutral-400">days</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="py-3 text-xs text-neutral-600 dark:text-neutral-400 text-left">
              <span className="section-label mr-2">Resilience Directive:</span>
              <span>{climateTrends.climate_resilience_advisory}</span>
            </div>
          </div>
        )}

        {/* TAB 6: RADAR & MAP */}
        {activeTab === "map" && (
          <div className="space-y-6 text-left">
            <div className="pb-2 flex flex-wrap items-baseline gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Doppler Weather Radar & Cartography</h2>
                <p className="text-xs text-neutral-400 mt-1">Theme-synchronized cartography with active IMD sweeps</p>
              </div>
              <span className="status-tag font-mono-num text-xs">RADAR ACTIVE</span>
            </div>
            <div id="weather-map"></div>
          </div>
        )}

        {/* CONVERSATIONAL AI & VOICE INTERFACE (Flat Editorial, Directly on #fafafa, Borderless) */}
        <section className="pt-8 space-y-5 text-left">
          <div className="flex items-center space-x-3">
            <h2 className="section-label">Meteorological Conversational Intelligence</h2>
            {isPlayingAudio && (
              <span className="status-tag active font-mono-num text-[10px]">PLAYING AUDIO</span>
            )}
          </div>

          {/* Quick Inquiry Links with Clean Hover */}
          <div className="flex items-center space-x-3 overflow-x-auto text-xs pb-1">
            <span className="text-neutral-400 section-label shrink-0">Inquiries:</span>
            <button
              onClick={() => handleSendChat("Can I spray pesticide on my wheat crop today?")}
              className="inquiry-link cursor-pointer shrink-0"
            >
              Spraying Advisory
            </button>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <button
              onClick={() => handleSendChat("Are sea conditions safe for fishermen off the coast?")}
              className="inquiry-link cursor-pointer shrink-0"
            >
              Fishermen Sea Safety
            </button>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <button
              onClick={() => handleSendChat("Show active extreme weather and cyclone alerts")}
              className="inquiry-link cursor-pointer shrink-0"
            >
              IMD Extreme Alerts
            </button>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <button
              onClick={() => handleSendChat("How has the regional climate changed over past 40 years?")}
              className="inquiry-link cursor-pointer shrink-0"
            >
              45-Year Climate Shift
            </button>
          </div>

          {/* Chat Transcript (Clean Text Stream on #fafafa) */}
          <div className="space-y-4 max-h-80 overflow-y-auto py-2">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="text-xs leading-relaxed space-y-1">
                <div className="flex items-baseline space-x-2">
                  <span className="font-mono-num font-semibold text-[10px] uppercase text-neutral-400">
                    {msg.sender === "user" ? "Query" : "WeatherOS"}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono-num">{msg.timestamp}</span>
                </div>
                <div className="text-neutral-800 dark:text-neutral-200 pl-3">
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Structured Advisory Callouts */}
                  {msg.cardType === "AGRI_SPRAYING" && msg.cardData && (
                    <div className="mt-2 text-[11px] text-neutral-500 font-mono-num space-y-0.5">
                      <div>STATUS: {msg.cardData.spraying_advisory?.status} — {msg.cardData.spraying_advisory?.reason}</div>
                      <div>PEST RISK: {msg.cardData.disease_pest_risk?.level} · IRRIGATION: {msg.cardData.irrigation_advisory?.needed ? 'Required' : 'Hold'}</div>
                    </div>
                  )}

                  {msg.cardType === "MARINE_SAFETY" && msg.cardData && (
                    <div className="mt-2 text-[11px] text-neutral-500 font-mono-num space-y-0.5">
                      <div>STATUS: {msg.cardData.status} · WAVE: {msg.cardData.wave_height_meters}m · WIND: {msg.cardData.wind_speed_knots} kts</div>
                      <div>ADVISORY: {msg.cardData.advisory}</div>
                    </div>
                  )}

                  {msg.cardType === "ALERT_BULLETIN" && msg.cardData && (
                    <div className="mt-2 text-[11px] text-neutral-500 font-mono-num space-y-0.5">
                      <div>DIRECTIVES (Helpline 1078):</div>
                      {msg.cardData.disaster_preparedness?.sop_actions?.slice(0, 3).map((act, i) => (
                        <div key={i}>— {act}</div>
                      ))}
                    </div>
                  )}

                  {msg.cardType === "CLIMATE_TRENDS" && msg.cardData && (
                    <div className="mt-2 text-[11px] text-neutral-500 font-mono-num space-y-0.5">
                      <div>WARMING (1980 - 2025): {msg.cardData.net_warming} · {msg.cardData.key_finding}</div>
                      <div>DIRECTIVE: {msg.cardData.climate_resilience_advisory}</div>
                    </div>
                  )}

                  {msg.sender === "ai" && (
                    <button
                      onClick={() => speakResponse(msg.text)}
                      className="mt-1 text-[10px] text-neutral-400 hover:text-current font-mono-num flex items-center space-x-1 cursor-pointer hover-lift"
                    >
                      <span>▶ Replay Audio</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Minimal Input Area (Borderless) */}
          <div className="flex items-center space-x-3 bg-neutral-100 dark:bg-neutral-800/60 px-3 py-2 rounded transition">
            <button
              onClick={toggleListening}
              className={`p-1 text-neutral-400 hover:text-current transition cursor-pointer hover-lift ${
                isListening ? "mic-active" : ""
              }`}
              title="Voice Input (V)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            <input
              type="text"
              placeholder={isListening ? "Listening..." : "Type or speak weather, crop, marine, or climate query..."}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              className="flex-1 bg-transparent border-none text-xs sm:text-sm text-current placeholder-neutral-400 focus:outline-none"
            />

            <button
              onClick={() => handleSendChat()}
              disabled={isSubmittingChat || !userInput.trim()}
              className="text-xs font-semibold uppercase tracking-wider text-current hover:opacity-70 disabled:opacity-30 cursor-pointer hover-lift"
            >
              Send
            </button>
          </div>
        </section>

        </div>
      </main>

      {/* 4. PROPER EDITORIAL FOOTER PAGE (Borderless) */}
      <footer className="w-full mt-12 text-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-12 pb-16 space-y-12">
          
          {/* 4 Multi-Column Information Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            
            {/* Column 1: Platform & Architecture */}
            <div className="space-y-3">
              <div className="flex items-baseline space-x-2">
                <span className="font-semibold text-base tracking-tight hover-lift cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  WeatherOS
                </span>
                <span className="text-[10px] text-neutral-400 font-mono-num">v1.0</span>
              </div>
              <p className="text-neutral-500 leading-relaxed text-xs">
                Zero-clutter meteorological intelligence and decision support platform. Precision numerical telemetry, agromet directives, marine safety protocols, and 45-year historical trends.
              </p>
              <div className="pt-1">
                <span className="status-tag font-mono-num text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  OPERATIONAL · SUB-50MS
                </span>
              </div>
            </div>

            {/* Column 2: Observatory Domains */}
            <div className="space-y-3">
              <div className="section-label">Observatory</div>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li><button onClick={() => { setActiveTab("overview"); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="footer-link">Synoptic Forecast & AQI</button></li>
                <li><button onClick={() => { setActiveTab("agromet"); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="footer-link">Kisan Agromet Protocols</button></li>
                <li><button onClick={() => { setActiveTab("marine"); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="footer-link">Matsya Coastal Safety</button></li>
                <li><button onClick={() => { setActiveTab("disaster"); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="footer-link">Suraksha Early Warnings</button></li>
                <li><button onClick={() => { setActiveTab("climate"); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="footer-link">45-Year Climate Observatory</button></li>
                <li><button onClick={() => { setActiveTab("map"); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="footer-link">Doppler Radar Cartography</button></li>
              </ul>
            </div>

            {/* Column 3: Data & Standards */}
            <div className="space-y-3">
              <div className="section-label">Data & Standards</div>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li><a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="footer-link">Open-Meteo High-Res Models</a></li>
                <li><a href="https://mausam.imd.gov.in" target="_blank" rel="noreferrer" className="footer-link">India Meteorological Dept (IMD)</a></li>
                <li><a href="https://cds.climate.copernicus.eu" target="_blank" rel="noreferrer" className="footer-link">Copernicus ERA5 Reanalysis</a></li>
                <li><a href="https://incois.gov.in" target="_blank" rel="noreferrer" className="footer-link">INCOIS Ocean State Forecasts</a></li>
                <li><a href="https://icar.org.in" target="_blank" rel="noreferrer" className="footer-link">ICAR Kisan Agromet Rules</a></li>
                <li><a href="https://ndma.gov.in" target="_blank" rel="noreferrer" className="footer-link">NDMA Disaster Protocols</a></li>
              </ul>
            </div>

            {/* Column 4: Command & Ergonomics */}
            <div className="space-y-3">
              <div className="section-label">Ergonomics</div>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li><button onClick={() => setIsPaletteOpen(true)} className="footer-link">Command Palette <span className="aj-kbd ml-1">⌘K</span></button></li>
                <li><button onClick={toggleTheme} className="footer-link">Toggle Theme <span className="aj-kbd ml-1">L</span></button></li>
                <li><button onClick={toggleListening} className="footer-link">Voice Input <span className="aj-kbd ml-1">V</span></button></li>
                <li><button onClick={() => setIsShortcutsOpen(true)} className="footer-link">Shortcuts Cheatsheet <span className="aj-kbd ml-1">?</span></button></li>
                <li><button onClick={() => setIsColophonOpen(true)} className="footer-link">Colophon & Craft Notes <span className="aj-kbd ml-1">C</span></button></li>
                <li>
                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText("1078");
                        showToast("Emergency NDRF 1078 copied");
                      }
                    }}
                    className="footer-link text-neutral-900 dark:text-neutral-100 font-medium"
                  >
                    Helpline NDRF: 1078 <span className="aj-kbd ml-1">SOS</span>
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Clean Bar (Borderless, Left-Aligned) */}
          <div className="pt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-neutral-400 font-mono-num text-[11px] text-left">
            <div>
              <span>© 2026 WeatherOS · Form follows climate intelligence.</span>
            </div>

            <div className="flex items-center space-x-4">
              <span>Set in Poppins & JetBrains Mono</span>
              <span>·</span>
              <button
                onClick={() => setIsColophonOpen(true)}
                className="hover:text-current transition hover-underline cursor-pointer"
              >
                Colophon
              </button>
              <span>·</span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="hover:text-current transition hover-underline cursor-pointer"
              >
                Back to top ↑
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* 5. COMMAND PALETTE MODAL (⌘K / Ctrl+K) */}
      {isPaletteOpen && (
        <div className="aj-modal-backdrop" onClick={() => setIsPaletteOpen(false)}>
          <div className="aj-modal-card" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Search stations, views, or directives..."
                value={paletteQuery}
                onChange={e => setPaletteQuery(e.target.value)}
                className="aj-search-input"
              />
              <span className="absolute right-3 top-3 text-[10px] text-neutral-400 aj-kbd cursor-pointer" onClick={() => setIsPaletteOpen(false)}>ESC</span>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 text-xs space-y-1">
              <div className="px-2 pt-1 pb-1 section-label">Stations</div>
              {paletteFilteredStations.map((st, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedCity({ name: st.name, lat: st.lat, lon: st.lon });
                    setIsPaletteOpen(false);
                    showToast(`Station: ${st.name}`);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between text-neutral-700 dark:text-neutral-300 transition"
                >
                  <span className="font-medium text-current">{st.name}</span>
                  <span className="text-[10px] text-neutral-400 font-mono-num">{st.region}</span>
                </button>
              ))}

              <div className="px-2 pt-3 pb-1 section-label">
                Navigation Views
              </div>
              {[
                { id: "overview", label: "Forecast & AQI Outlook", key: "1" },
                { id: "agromet", label: "Kisan Agromet Decision Support", key: "2" },
                { id: "marine", label: "Matsya Marine Coastal Safety", key: "3" },
                { id: "disaster", label: "Suraksha Alerts & Helplines", key: "4" },
                { id: "climate", label: "45-Year Climate Observatory", key: "5" },
                { id: "map", label: "Doppler Radar & Cartography", key: "6" }
              ].filter(v => v.label.toLowerCase().includes(paletteQuery.toLowerCase())).map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setActiveTab(v.id);
                    setIsPaletteOpen(false);
                    showToast(`View: ${v.id.toUpperCase()}`);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between text-neutral-700 dark:text-neutral-300 transition"
                >
                  <span>{v.label}</span>
                  <span className="aj-kbd">{v.key}</span>
                </button>
              ))}

              <div className="px-2 pt-3 pb-1 section-label">
                Inquiries & Actions
              </div>
              {[
                { label: "Pesticide Spraying Advisory", query: "Can I spray pesticide on my wheat crop today?" },
                { label: "Fishermen Sea Safety Status", query: "Are sea conditions safe for fishermen off the coast?" },
                { label: "IMD Extreme Weather Bulletins", query: "Show active extreme weather and cyclone alerts" },
                { label: "45-Year Historical Climate Shift", query: "How has the regional climate changed over past 40 years?" },
                { label: "Toggle Dark / Light Theme", action: toggleTheme },
                { label: "View Colophon & Design Notes", action: () => setIsColophonOpen(true) }
              ].filter(q => q.label.toLowerCase().includes(paletteQuery.toLowerCase())).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsPaletteOpen(false);
                    if (q.action) q.action();
                    else handleSendChat(q.query);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between text-neutral-700 dark:text-neutral-300 transition"
                >
                  <span>{q.label}</span>
                  <span className="text-[10px] text-neutral-400">Execute</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. KEYBOARD SHORTCUTS MODAL (?) */}
      {isShortcutsOpen && (
        <div className="aj-modal-backdrop" onClick={() => setIsShortcutsOpen(false)}>
          <div className="aj-modal-card p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-1">
              <h3 className="text-sm font-semibold text-current">Keyboard Shortcuts</h3>
              <span className="aj-kbd cursor-pointer" onClick={() => setIsShortcutsOpen(false)}>ESC</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-600 dark:text-neutral-400">Command Palette</span>
                <span className="aj-kbd">⌘K / Ctrl+K</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-600 dark:text-neutral-400">Toggle Theme</span>
                <span className="aj-kbd">L</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-600 dark:text-neutral-400">Voice Input</span>
                <span className="aj-kbd">V</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-600 dark:text-neutral-400">Colophon & Notes</span>
                <span className="aj-kbd">C</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-600 dark:text-neutral-400">Shortcuts Cheatsheet</span>
                <span className="aj-kbd">?</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-600 dark:text-neutral-400">Switch Views 1 to 6</span>
                <span className="aj-kbd">1 - 6</span>
              </div>
            </div>

            <div className="mt-5 pt-2 text-left">
              <button
                onClick={() => setIsShortcutsOpen(false)}
                className="aj-button-primary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. COLOPHON & CRAFT STATEMENT MODAL (C / Footer) */}
      {isColophonOpen && (
        <div className="aj-modal-backdrop" onClick={() => setIsColophonOpen(false)}>
          <div className="aj-modal-card p-6 max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-1">
              <h3 className="text-sm font-semibold text-current">WeatherOS • Colophon</h3>
              <span className="aj-kbd cursor-pointer" onClick={() => setIsColophonOpen(false)}>ESC</span>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
              <div>
                <div className="section-label mb-1">Philosophy & Architecture</div>
                <p>
                  Zero compilation layers, zero bloated runtime frameworks, and zero tracking. WeatherOS renders instantly with sub-50ms paint times, presenting meteorological intelligence as calm, tactile editorial paper.
                </p>
              </div>

              <div>
                <div className="section-label mb-1">Typography</div>
                <p>
                  Set in <strong>Poppins</strong> by the Indian Type Foundry for effortless legibility across light and dark surfaces, paired with <strong>JetBrains Mono</strong> for tabular coordinate and numerical telemetry.
                </p>
              </div>

              <div>
                <div className="section-label mb-1">Monochrome Canvas</div>
                <p>
                  Anchored on pure <code>#fafafa</code> paper ground with deep <code>#000000</code> text in light mode, and matte ink <code>#171717</code> with <code>#f0f0f0</code> text in dark mode. No card boxes, no shadows, no noise.
                </p>
              </div>

              <div>
                <div className="section-label mb-1">Decision Intelligence</div>
                <p>
                  Powered by ECMWF and GFS synoptic models, IMD color-coded disaster protocols, ICAR agromet directives, INCOIS marine ocean state forecasts, and 45-year Copernicus ERA5 reanalysis.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-2 flex justify-between items-center text-xs">
              <span className="text-neutral-400 font-mono-num text-[11px]">Crafted in Asish Ranjan's design language</span>
              <button
                onClick={() => setIsColophonOpen(false)}
                className="aj-button-primary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Mount React Root
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
