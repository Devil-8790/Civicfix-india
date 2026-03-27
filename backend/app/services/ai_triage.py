import json
import base64
import requests
from pydantic import BaseModel
from typing import Optional

# New Google GenAI 1.0.0 Imports
from google import genai # type: ignore
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

# NOTE: Make sure these ALLOWED DEPARTMENTS strings exactly match the names inside your DepartmentQueue Enum!
TRIAGE_PROMPT = """
    ROLE: Expert Municipal Assessor (India).
    TASK: Triage the attached civic issue based on the image, text description, or audio transcript. 
    CRITICAL: If regional audio (e.g., Telugu, Hindi) is provided, seamlessly translate it and incorporate the citizen's context into your analysis. You must be highly objective, frugal, and strictly adhere to the rubrics below.

    SEVERITY RUBRIC (1-10):
    - 1-3: Cosmetic/Minor (e.g., scattered litter, faded paint, minor weeds).
    - 4-6: Moderate (e.g., standard pothole, single broken street light, blocked drain).
    - 7-8: Urgent (e.g., deep crater, burst water main, fallen tree blocking road).
    - 9-10: CRITICAL LIFE SAFETY ONLY (e.g., exposed live electrical wires, collapsed bridge/road).

    BUDGET ESTIMATION (INR ₹):
    - Frugal/Minor Cleanup: ₹500 - ₹2,000
    - Standard Repair (Pothole/Light): ₹2,000 - ₹5,000
    - Moderate Infra (Plumbing/Electrical): ₹10,000 - ₹25,000
    - Major Infra Repair: ₹50,000+

    ALLOWED DEPARTMENTS: "Public Works Dept", "Water Board", "Municipal Operations", "Sanitation", "Electrical Dept".

    OUTPUT FORMAT:
    Return ONLY a valid JSON object. Do not include markdown formatting like ```json. Use this exact structure:
    {
      "department": "Choose from ALLOWED DEPARTMENTS",
      "core_issue": "3-5 word technical title of the problem",
      "severity_score": <int 1-10>,
      "estimated_cost_inr": <float>,
      "ai_detailed_analysis": "A crisp, 2-sentence technical justification for the severity and budget, translated to English if necessary."
    }
"""

def analyze_complaint(description: str, image_bytes: bytes, audio_bytes: bytes = None) -> AITriageResult:
    """Routes the image, text, and optional audio to the AI."""
    try:
        if settings.USE_LOCAL_OLLAMA:
            # Local fallback (Ollama vision model via LLAVA)
            raw_dict = _run_ollama_triage(description, image_bytes)
            return AITriageResult(**raw_dict)
        elif gemini_client:
            raw_dict = _run_gemini_triage(description, image_bytes, audio_bytes)
            return AITriageResult(**raw_dict)
        else:
            return _fallback_rule_based_triage(description)
    except Exception as e:
        print(f"🚨 AI Engine Error: {e}")
        return _fallback_rule_based_triage(description)


def _run_gemini_triage(text: str, image_bytes: bytes, audio_bytes: bytes = None) -> dict:
    image_part = types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg')
    
    # 1. Start building the payload (Fixed Variable Name)
    contents_payload = [TRIAGE_PROMPT, image_part]
    
    # 2. Add Audio if the citizen used the mic
    if audio_bytes:
        # Assuming the frontend sends webm, mp3, or wav
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


def _run_ollama_triage(text: str, image_bytes: bytes) -> dict:
    """Basic Ollama implementation for local testing."""
    # Convert image to base64 for Ollama vision models (like llava)
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    payload = {
        "model": "llava", 
        "prompt": f"{TRIAGE_PROMPT}\n\nCitizen Issue: {text}",
        "images": [base64_image],
        "stream": False,
        "format": "json"
    }
    
    try:
        # Hit the default local Ollama port
        response = requests.post("http://localhost:11434/api/generate", json=payload)
        response.raise_for_status()
        return json.loads(response.json().get("response", "{}"))
    except Exception as e:
        print(f"🚨 Ollama connection failed: {e}")
        # Raise exception to trigger the fallback rule-based triage
        raise e


def _fallback_rule_based_triage(description: str) -> AITriageResult:
    desc = description.lower() if description else ""
    if "water" in desc or "leak" in desc:
        return AITriageResult(department=DepartmentQueue.WATER_BOARD, core_issue="Water Leak", severity_score=8, estimated_cost_inr=5000.0, ai_detailed_analysis="Fallback analysis: Potential water logging issue identified from text.")
    elif "garbage" in desc or "trash" in desc:
        return AITriageResult(department=DepartmentQueue.SANITATION, core_issue="Waste Accumulation", severity_score=4, estimated_cost_inr=1500.0, ai_detailed_analysis="Fallback analysis: Unauthorized garbage dump identified from text.")
    else:
        return AITriageResult(department=DepartmentQueue.PUBLIC_WORKS, core_issue="Infrastructure Damage", severity_score=6, estimated_cost_inr=10000.0, ai_detailed_analysis="Fallback analysis: General infrastructure issue identified. Human inspection required.")