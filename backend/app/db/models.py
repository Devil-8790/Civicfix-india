import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Text
from datetime import datetime
from app.db.database import Base


class TicketStatus(str, enum.Enum):
    PENDING = "Pending"  # Added to match your web_ingest.py
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"

class DepartmentQueue(str, enum.Enum):
    PUBLIC_WORKS = "Public Works Dept"
    WATER_BOARD = "Water Board"
    MUNICIPAL_OPS = "Municipal Operations"
    SANITATION = "Sanitation"
    ELECTRICAL = "Electrical Dept"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    citizen_contact = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    original_image_url = Column(String, nullable=True)
    resolution_image_url = Column(String, nullable=True)
    location = Column(String, nullable=True) 
    reported_address = Column(String, nullable=True)
    ward_id = Column(String, nullable=True) 
    department = Column(Enum(DepartmentQueue))
    core_issue = Column(String, nullable=True)
    ai_detailed_analysis = Column(Text, nullable=True)
    severity_score = Column(Integer, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    status = Column(Enum(TicketStatus), default=TicketStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    sla_deadline = Column(DateTime, nullable=True)
    # --- ADD THIS COLUMN TO FIX THE ERROR ---
    # This stores the ID of the original ticket if this is a duplicate
    is_duplicate_of = Column(Integer, nullable=True) 
    
    # ----------------------------------------
    
class WorkerStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    BUSY = "BUSY"
    OFF_DUTY = "OFF_DUTY"

# 2. Add the FieldWorker Model
class FieldWorker(Base):
    __tablename__ = "field_workers"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    department = Column(Enum(DepartmentQueue), nullable=False)
    rating = Column(Float, default=5.0)
    active_jobs = Column(Integer, default=0)
    status = Column(Enum(WorkerStatus), default=WorkerStatus.AVAILABLE)