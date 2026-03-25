from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import re

from app.db.database import get_db
from app.db.models import Ticket, DepartmentQueue
from app.schemas.ticket import TicketResponse

router = APIRouter()

def extract_lat_lon(wkt_string: str):
    """Safely extracts latitude and longitude from a POINT(lon lat) string."""
    if not wkt_string:
        return None, None
    match = re.search(r"POINT\(([-\d\.]+) ([-\d\.]+)\)", wkt_string)
    if match:
        return float(match.group(2)), float(match.group(1)) # Returns Lat, Lon
    return None, None

@router.get("/tickets", response_model=List[TicketResponse])
def get_dashboard_tickets(department: DepartmentQueue = None, db: Session = Depends(get_db)):
    """Fetches tickets for the Next.js map and list view."""
    
    query = db.query(Ticket)
    if department:
        query = query.filter(Ticket.department == department)
        
    # Get newest tickets first
    tickets = query.order_by(Ticket.created_at.desc()).all()
    
    response_payload = []
    for t in tickets:
        lat, lon = extract_lat_lon(t.location)
        
        response_payload.append({
            "id": t.id,
            "citizen_contact": t.citizen_contact or "Unknown",
            "description": t.description,
            "original_image_url": t.original_image_url or "",
            "ward_id": t.ward_id,
            "latitude": lat,
            "longitude": lon,
            "reported_address": t.reported_address,
            "department": t.department,
            "core_issue": t.core_issue,
            "ai_detailed_analysis": t.ai_detailed_analysis,
            "severity_score": t.severity_score,
            "estimated_cost": t.estimated_cost,
            "status": t.status,
            "created_at": t.created_at,
            "sla_deadline": t.sla_deadline,
            "resolution_image_url": t.resolution_image_url,
            "is_duplicate_of": t.is_duplicate_of
        })
        
    return response_payload