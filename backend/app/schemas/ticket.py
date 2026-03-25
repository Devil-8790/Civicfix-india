from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.db.models import TicketStatus, DepartmentQueue

# ==========================================
# 1. INGESTION STAGE (Citizen to Backend)
# ==========================================
class TicketCreate(BaseModel):
    citizen_contact: str = Field(..., description="Phone number or WhatsApp ID of the citizen")
    description: Optional[str] = Field(None, description="Citizen's description of the issue")
    
    # We enforce strict floats so the PostGIS engine doesn't crash on bad data
    latitude: float = Field(..., description="GPS Latitude, e.g., 17.4399")
    longitude: float = Field(..., description="GPS Longitude, e.g., 78.4983")


# ==========================================
# 2. DISPATCH STAGE (Dashboard to Backend)
# ==========================================
class TicketAssign(BaseModel):
    """Payload sent when a Department Head assigns a worker."""
    worker_id: str = Field(..., description="The ID of the field worker being assigned")

# ==========================================
# 3. RESOLUTION & AUDIT STAGE (Worker to Backend)
# ==========================================
class TicketResolve(BaseModel):
    """Payload sent by the Junior Engineer to trigger the AI Anti-Fraud check."""
    # The image will be handled as a File Upload in the route, but we need the dimensions in JSON
    claimed_length_meters: float = Field(..., description="Engineer's physical measurement of length")
    claimed_width_meters: float = Field(..., description="Engineer's physical measurement of width")
    claimed_depth_meters: float = Field(..., description="Engineer's physical measurement of depth")

# ==========================================
# 4. RESPONSE STAGE (Backend to Dashboards)
# ==========================================
# ==========================================
# 4. RESPONSE STAGE (Backend to Dashboards)
# ==========================================
class TicketResponse(BaseModel):
    """The unified payload sent to the Next.js Command Center."""
    id: int
    citizen_contact: str
    description: Optional[str] = None
    original_image_url: str
    
    # Spatial Data
    ward_id: Optional[str] = None
    latitude: Optional[float] = None  
    longitude: Optional[float] = None
    reported_address: Optional[str] = None
    # AI Generated Fields
    department: DepartmentQueue
    core_issue: Optional[str] = None
    
    # --- ADD THIS NEW FIELD ---
    ai_detailed_analysis: Optional[str] = None 
    # --------------------------
    
    severity_score: Optional[int] = None
    estimated_cost: Optional[float] = None
    
    # FSM & Auditing
    status: TicketStatus
    created_at: datetime
    sla_deadline: Optional[datetime] = None
    resolution_image_url: Optional[str] = None
    is_duplicate_of: Optional[int] = None

    class Config:
        from_attributes = True