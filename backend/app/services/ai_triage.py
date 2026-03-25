import json
import base64
import requests
from pydantic import BaseModel

# New Google GenAI 1.0.0 Imports
from google import genai
from google.genai import types

from app.db.models import DepartmentQueue
from app.core.config import settings

class AITriageResult(BaseModel):
    department: DepartmentQueue
    core_issue: str
    severity_score: int
    estimated_cost_inr: float
    ai_detailed_analysis: str

# Initialize the new Gemini Client securely
gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None

# The core prompt used by both Gemini and Ollama
# ... [Keep your existing imports] ...

# Updated Prompt to handle audio translation
SYSTEM_PROMPT = """
You are the core AI triage engine for CivicFix India. 
Analyze the provided image, citizen text description, AND/OR audio recording of a municipal infrastructure issue. 
If regional audio (e.g., Telugu, Hindi) is provided, translate and incorporate the citizen's context into your analysis.
Base your repair cost estimations and severity ratings on real-world civic realities.

You MUST respond ONLY with a raw JSON object exactly matching this schema:
{
    "department": "Public Works Dept" | "Water Board" | "Municipal Operations" | "Sanitation" | "Electrical Dept",
    "core_issue": "A concise, 3-5 word professional description of the visual problem",
    "severity_score": an integer between 1 and 10,
    "estimated_cost_inr": a realistic float estimate for the repair cost in Indian Rupees,
    "ai_detailed_analysis": "A detailed 2-3 sentence expert analysis combining the visual evidence and the citizen's audio/text context."
}
"""

def analyze_complaint(description: str, image_bytes: bytes, audio_bytes: bytes = None) -> AITriageResult:
    """Routes the image, text, and optional audio to the AI."""
    
    try:
        if settings.USE_LOCAL_OLLAMA:
            # Local fallback (Ollama doesn't natively do audio well yet, so we pass just text/image)
            return AITriageResult(**_run_ollama_triage(description, image_bytes))
        elif gemini_client:
            return AITriageResult(**_run_gemini_triage(description, image_bytes, audio_bytes))
        else:
            return _fallback_rule_based_triage(description)
    except Exception as e:
        print(f"🚨 AI Engine Error: {e}")
        return _fallback_rule_based_triage(description)


def _run_gemini_triage(text: str, image_bytes: bytes, audio_bytes: bytes = None) -> dict:
    image_part = types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg')
    
    # 1. Start building the payload
    contents_payload = [SYSTEM_PROMPT, image_part]
    
    # 2. Add Audio if the citizen used the mic
    if audio_bytes:
        # Assuming the frontend sends webm or mp3
        audio_part = types.Part.from_bytes(data=audio_bytes, mime_type='audio/webm') 
        contents_payload.append(audio_part)
        
    # 3. Add text if they typed something
    if text and text != "No description provided":
        contents_payload.append(f"Citizen typed: {text}")

    response = gemini_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=contents_payload,
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    
    return json.loads(response.text)
    
# ... [Keep your fallback and ollama functions exactly the same] ...

def _fallback_rule_based_triage(description: str) -> AITriageResult:
    desc = description.lower() if description else ""
    if "water" in desc or "leak" in desc:
        return AITriageResult(department=DepartmentQueue.WATER_BOARD, core_issue="Water Leak", severity_score=8, estimated_cost_inr=5000.0, ai_detailed_analysis="Fallback analysis: Potential water logging issue identified from text.")
    elif "garbage" in desc or "trash" in desc:
        return AITriageResult(department=DepartmentQueue.SANITATION, core_issue="Waste Accumulation", severity_score=4, estimated_cost_inr=1500.0, ai_detailed_analysis="Fallback analysis: Unauthorized garbage dump identified from text.")
    else:
        return AITriageResult(department=DepartmentQueue.PUBLIC_WORKS, core_issue="Infrastructure Damage", severity_score=6, estimated_cost_inr=10000.0, ai_detailed_analysis="Fallback analysis: General infrastructure issue identified. Human inspection required.")