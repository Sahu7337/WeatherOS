import os
import hashlib
import edge_tts
from typing import Optional

VOICE_MAP = {
    "en": "en-IN-NeerjaNeural",
    "or": "en-IN-NeerjaNeural",
    "ta": "ta-IN-PallaviNeural",
    "te": "te-IN-MohanNeural",
    "bn": "bn-IN-TanishaaNeural",
    "mr": "mr-IN-AarohiNeural",
    "gu": "gu-IN-DhwaniNeural",
    "kn": "kn-IN-SapnaNeural",
    "ml": "ml-IN-SobhanaNeural",
    "pa": "en-IN-NeerjaNeural"
}

class VoiceService:
    def __init__(self, audio_dir: Optional[str] = None):
        if audio_dir is None:
            self.audio_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio_cache")
        else:
            self.audio_dir = audio_dir
        os.makedirs(self.audio_dir, exist_ok=True)

    def _get_filename(self, text: str, voice: str) -> str:
        h = hashlib.md5(f"{text}_{voice}".encode("utf-8")).hexdigest()
        return os.path.join(self.audio_dir, f"{h}.mp3")

    async def generate_speech(self, text: str, lang: str = "en") -> Optional[str]:
        """Synthesize text to speech using Microsoft Edge Neural TTS voices."""
        voice = VOICE_MAP.get(lang, "en-IN-NeerjaNeural")
        filepath = self._get_filename(text, voice)
        
        # If cached, return existing file
        if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
            return filepath

        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(filepath)
            return filepath
        except Exception as e:
            print(f"Edge TTS synthesis error: {e}")
            return None

voice_service = VoiceService()
