import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
import base64


from app.db.database import get_db
from app.db.models import Ticket, TicketStatus
from app.schemas.ticket import TicketResponse
from app.services.ai_triage import analyze_complaint

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
router = APIRouter()
UPLOAD_DIR = "uploads"

@router.post("/submit", response_model=TicketResponse) # Ensure TicketResponse can handle long strings!
async def submit_web_complaint(
    citizen_contact: str = Form("DEMO_WEB_USER"),
    reported_address: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    description: str = Form("No description provided"),
    file: UploadFile = File(...),
    audio_file: Optional[UploadFile] = File(None, description="Native language voice note"), 
    db: Session = Depends(get_db)
):
    # 1. THE EPHEMERAL DISK FIX: Convert Image to Base64 (NO LOCAL SAVING)
    image_bytes = await file.read()
    base64_encoded = base64.b64encode(image_bytes).decode('utf-8')
    image_data_url = f"data:{file.content_type or 'image/jpeg'};base64,{base64_encoded}"
        
    # 2. Read Audio (if provided)
    audio_bytes = None
    if audio_file:
        audio_bytes = await audio_file.read()
    
    # 3. AI Analysis (Pass the raw bytes just like before)
    print(f"🧠 Routing ticket to AI Triage...")
    ai_result = analyze_complaint(description, image_bytes, audio_bytes)
    
    wkt_point = f"POINT({longitude} {latitude})" if longitude and latitude else None
    
    # 4. DUPLICATION CHECK
    duplicate_ticket = None
    if wkt_point:
        duplicate_ticket = db.query(Ticket).filter(
            Ticket.department == ai_result.department,
            Ticket.location == wkt_point,
            Ticket.status.in_([TicketStatus.PENDING, TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
        ).first()

    new_ticket = Ticket(
        citizen_contact=citizen_contact, 
        description=description,
        # THE FIX IS HERE: Save the Base64 string instead of a URL path!
        original_image_url=image_data_url,        
        location=wkt_point,
        reported_address=reported_address,
        department=ai_result.department,
        core_issue=ai_result.core_issue,
        ai_detailed_analysis=ai_result.ai_detailed_analysis, 
        severity_score=ai_result.severity_score,
        estimated_cost=ai_result.estimated_cost_inr,
        status=TicketStatus.PENDING,
        is_duplicate_of=duplicate_ticket.id if duplicate_ticket else None
    )
    
    try:
        db.add(new_ticket)
        db.commit()
        db.refresh(new_ticket)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    return new_ticket