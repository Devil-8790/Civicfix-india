from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.db.models import TicketStatus, DepartmentQueue

# ==========================================
# 1. INCOMING WEBHOOKS (External -> CivicFix)
# ==========================================

class TwilioIncomingPayload(BaseModel):
    """
    Standardizes the incoming WhatsApp payload from Twilio.
    While FastAPI parses Twilio as Form Data initially, we can map it to this 
    Pydantic model for strict validation before passing it to the AI.
    """
    message_sid: str = Field(..., description="Unique ID of the Twilio message")
    sender_id: str = Field(..., description="WhatsApp number of the citizen")
    body: Optional[str] = Field(None, description="Text caption sent with the message")
    
    # Media Attachments (Photos/Audio)
    num_media: int = Field(0, description="Number of attached media files")
    media_url_0: Optional[str] = Field(None, description="Direct URL to download the media")
    media_content_type_0: Optional[str] = Field(None, description="MIME type (e.g., image/jpeg or audio/ogg)")
    
    # Location Data (If they used "Share Location" on WhatsApp)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


# ==========================================
# 2. OUTGOING WEBHOOKS (CivicFix -> External)
# ==========================================

class TicketStatusUpdateWebhook(BaseModel):
    """
    Payload sent OUT by CivicFix to third-party municipal systems 
    (e.g., the GHMC central contractor dashboard) when a ticket status changes.
    """
    webhook_id: str = Field(..., description="Unique UUID for this webhook event")
    ticket_id: int = Field(..., description="The CivicFix Ticket ID")
    department: DepartmentQueue = Field(..., description="The responsible department")
    
    # State change tracking
    previous_status: TicketStatus
    new_status: TicketStatus
    
    # Context
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    worker_id: Optional[str] = Field(None, description="ID of the engineer who resolved it")
    resolution_notes: Optional[str] = Field(None, description="Engineer's final notes")
    resolution_image_url: Optional[str] = Field(None, description="Proof of work image")

    class Config:
        from_attributes = True