import os
import uuid
import re
import requests
from fastapi import APIRouter, Request, Depends, Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Ticket, TicketStatus
from app.services.ai_triage import analyze_complaint
from app.core.config import settings

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

def generate_twiml_response(message: str) -> Response:
    """Helper function to format the XML response that Twilio requires."""
    xml_data = f"""<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Message>{message}</Message>
    </Response>"""
    return Response(content=xml_data, media_type="application/xml")

@router.post("/webhook")
async def whatsapp_incoming(request: Request, db: Session = Depends(get_db)):
    """
    Receives incoming WhatsApp messages from citizens via Twilio.
    """
    # Twilio sends data as URL-encoded form data
    form_data = await request.form()
    
    # Extract sender info (Twilio formats this as 'whatsapp:+919876543210')
    sender = form_data.get("From", "Unknown Citizen")
    if sender.startswith("whatsapp:"):
        sender = sender.replace("whatsapp:", "")
        
    description = form_data.get("Body", "No description provided")
    
    # ---------------------------------------------------------
    # LOCATION EXTRACTION (Native + Link Support)
    # ---------------------------------------------------------
    latitude = form_data.get("Latitude")
    longitude = form_data.get("Longitude")

    # If native location is missing, check for a pasted Google Maps link
    if not latitude or not longitude:
        maps_match = re.search(r'@([-\d\.]+),([-\d\.]+)', description)
        if maps_match:
            latitude = maps_match.group(1)
            longitude = maps_match.group(2)
            print(f"📍 Extracted coordinates from Google Maps link: {latitude}, {longitude}")

    wkt_point = f"POINT({longitude} {latitude})" if longitude and latitude else None
    # ---------------------------------------------------------

    # Check for Media (Images or Audio)
    num_media = int(form_data.get("NumMedia", 0))
    media_url = form_data.get("MediaUrl0")

    if num_media == 0 or not media_url:
        return generate_twiml_response(
            "Welcome to CivicFix India! 🇮🇳 Please reply with a *Photo* of the civic issue (pothole, water leak, garbage) to generate a ticket. "
            "(Tip: You can also use the WhatsApp 'Share Location' pin!)"
        )

    # --- THE CRITICAL FIX: SECURE MEDIA DOWNLOAD ---
    try:
        # We MUST pass the SID and Auth Token to prove we own this Twilio account
        media_response = requests.get(
            media_url, 
            auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
            timeout=15
        )
        media_response.raise_for_status()
        media_bytes = media_response.content
        
        # Save locally
        media_type = form_data.get("MediaContentType0", "")
        ext = "jpg" if "image" in media_type else "webm" # Rough fallback, can handle audio later
        filename = f"wa_{uuid.uuid4().hex}.{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as f:
            f.write(media_bytes)
            
        local_media_url = f"{BASE_URL}/uploads/{filename}"
        
    except Exception as e:
        print(f"🚨 Error downloading WhatsApp media: {e}")
        return generate_twiml_response("Sorry, we had trouble downloading your image. Please try sending it again.")
    # -----------------------------------------------

    # AI Analysis
    print(f"🧠 Routing WhatsApp ticket from {sender} to AI Triage...")
    ai_result = analyze_complaint(description, image_bytes=media_bytes)

    # Save to Database
    new_ticket = Ticket(
        citizen_contact=sender,
        description=description,
        original_image_url=local_media_url,
        location=wkt_point,
        department=ai_result.department,
        core_issue=ai_result.core_issue,
        ai_detailed_analysis=ai_result.ai_detailed_analysis,
        severity_score=ai_result.severity_score,
        estimated_cost=ai_result.estimated_cost_inr,
        status=TicketStatus.PENDING
    )

    try:
        db.add(new_ticket)
        db.commit()
        db.refresh(new_ticket)
        print(f"✅ WhatsApp Ticket #{new_ticket.id} successfully saved.")
        
        # Send Auto-Reply back to the Citizen's WhatsApp
        reply_message = (
            f"✅ *Ticket #{new_ticket.id} Registered!*\n\n"
            f"🏢 Department: {ai_result.department}\n"
            f"⚠️ Issue: {ai_result.core_issue}\n\n"
            f"Our AI has analyzed your photo and alerted the municipal authorities."
        )
        return generate_twiml_response(reply_message)
        
    except Exception as e:
        db.rollback()
        print(f"🚨 Database error on WhatsApp ingest: {e}")
        return generate_twiml_response("We experienced an internal error while saving your ticket. Please try again later.")