import os
import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from google import genai
from google.genai import types
import base64



from app.db.database import get_db
from app.db.models import Ticket, TicketStatus, FieldWorker, WorkerStatus, DepartmentQueue
from app.schemas.ticket import TicketAssign
from app.core.config import settings

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------------------------------------------------
# 1. GET ALL WORKERS (Fixes the 404 error)
# ---------------------------------------------------------
@router.get("/workers")
def get_available_workers(
    department: Optional[DepartmentQueue] = None, 
    db: Session = Depends(get_db)
):
    """Fetches workers from the DB, optionally filtered by department."""
    query = db.query(FieldWorker)
    if department:
        query = query.filter(FieldWorker.department == department)
    return query.all()

# ---------------------------------------------------------
# 2. ASSIGN WORKER
# ---------------------------------------------------------
@router.post("/{ticket_id}/assign")
def assign_field_worker(
    ticket_id: int, 
    payload: TicketAssign, 
    db: Session = Depends(get_db)
):
    """Assigns a worker, updates ticket to IN_PROGRESS, and marks worker as BUSY."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    worker = db.query(FieldWorker).filter(FieldWorker.worker_id == payload.worker_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    if not worker:
        raise HTTPException(status_code=404, detail="Worker ID not found.")
        
    # Update Ticket
    ticket.status = TicketStatus.IN_PROGRESS
    
    # Update Worker
    worker.status = WorkerStatus.BUSY
    worker.active_jobs += 1
    
    try:
        db.commit()
        db.refresh(ticket)
        return {
            "message": f"Successfully assigned {worker.name} to Ticket #{ticket_id}",
            "new_ticket_status": ticket.status,
            "worker_status": worker.status
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# 3. RESOLVE & AI AUDIT
# ---------------------------------------------------------
# ---------------------------------------------------------
# 3. RESOLVE & AI AUDIT
# ---------------------------------------------------------
@router.post("/{ticket_id}/resolve")
async def resolve_ticket_issue(
    ticket_id: int, 
    worker_id: str = Form(...),
    claimed_length_meters: float = Form(...),
    claimed_width_meters: float = Form(...),
    claimed_depth_meters: float = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    # 1. THE EPHEMERAL DISK FIX: Convert new "After" image to Base64
    after_image_bytes = await file.read()
    base64_encoded_after = base64.b64encode(after_image_bytes).decode('utf-8')
    after_image_data_url = f"data:{file.content_type};base64,{base64_encoded_after}"

    # 2. Extract "Before" Image bytes directly from the database Base64 string
    before_image_bytes = None
    if ticket.original_image_url and "base64," in ticket.original_image_url:
        try:
            # Split the string at "base64," and decode the actual image data back into bytes
            base64_str = ticket.original_image_url.split("base64,")[1]
            before_image_bytes = base64.b64decode(base64_str)
        except Exception as e:
            print(f"⚠️ Could not decode original Base64 image: {e}")

    # 3. Setup Gemini Side-by-Side Audit
    gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None
    
    if gemini_client and before_image_bytes:
        fraud_prompt = f"""
        You are an elite AI municipal auditor for CivicFix India.
        Image 1 (Before): Original issue.
        Image 2 (After): Contractor's repair photo.
        Claims: {claimed_length_meters}m x {claimed_width_meters}m x {claimed_depth_meters}m.
        
        Task: 
        1. Are these the same locations? Look closely at surrounding landmarks.
        2. Is the repair legitimate based on the dimensions claimed?
        
        Respond strictly in JSON format:
        {{"is_resolved": true, "fraud_flag": false, "auditor_notes": "short string explaining why"}}
        """
        
        try:
            parts = [
                fraud_prompt,
                types.Part.from_bytes(data=before_image_bytes, mime_type='image/jpeg'),
                types.Part.from_bytes(data=after_image_bytes, mime_type=file.content_type or 'image/jpeg')
            ]
            response = gemini_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=parts,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            audit_result = json.loads(response.text)
        except Exception as e:
            print(f"🚨 Audit failed: {e}")
            audit_result = {"is_resolved": True, "fraud_flag": False, "auditor_notes": "AI Audit Error, manual check needed."}
    else:
        audit_result = {"is_resolved": True, "fraud_flag": False, "auditor_notes": "Manual audit required. Could not load original image."}
    
    # 4. Final Updates to Ticket (Saving the Base64 string, NO LOCAL FILES!)
    ticket.resolution_image_url = after_image_data_url
    ticket.claimed_length_meters = claimed_length_meters
    ticket.claimed_width_meters = claimed_width_meters
    ticket.claimed_depth_meters = claimed_depth_meters
    
    if audit_result.get("fraud_flag"):
        ticket.status = TicketStatus.OPEN
        # Add auditor notes to DB if you have a column for it, otherwise you can print/log it
    else:
        ticket.status = TicketStatus.RESOLVED

    # --- UPDATE THE WORKER STATUS ---
    worker = db.query(FieldWorker).filter(FieldWorker.worker_id == worker_id).first()
    if worker:
        if worker.active_jobs > 0:
            worker.active_jobs -= 1
        
        # Free them up if they finished all their tasks
        if worker.active_jobs == 0:
            worker.status = WorkerStatus.AVAILABLE

    db.commit()
    db.refresh(ticket)

    return {
        "message": "Audit complete.",
        "final_status": ticket.status,
        "audit_notes": audit_result.get("auditor_notes")
    }