from app.workers.celery_app import celery_app
from app.db.database import SessionLocal
from app.db.models import Ticket, TicketStatus
from app.services.ai_triage import analyze_complaint
from datetime import datetime, timedelta

@celery_app.task(name="tasks.async_ai_triage")
def async_ai_triage(ticket_id: int):
    """
    Background task to run Gemini AI analysis on a ticket.
    """
    db = SessionLocal()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            return "Ticket not found"

        print(f"🧠 Background AI Analysis starting for Ticket #{ticket_id}")
        
        # In a real setup, you'd fetch the image bytes from ticket.original_image_url
        # For prototype, we assume analyze_complaint handles the logic
        ai_result = analyze_complaint(ticket.description, image_url=ticket.original_image_url)

        # Update ticket with AI findings
        ticket.department = ai_result.department
        ticket.core_issue = ai_result.core_issue
        ticket.severity_score = ai_result.severity_score
        ticket.status = TicketStatus.OPEN
        
        db.commit()
        return f"Ticket #{ticket_id} triaged to {ai_result.department}"
    
    except Exception as e:
        print(f"🚨 Celery AI Task Error: {e}")
        return str(e)
    finally:
        db.close()

@celery_app.task(name="tasks.check_sla_violations")
def check_sla_violations():
    """
    Periodic task to check for tickets that haven't been picked up in 24 hours.
    """
    db = SessionLocal()
    try:
        threshold = datetime.utcnow() - timedelta(hours=24)
        overdue_tickets = db.query(Ticket).filter(
            Ticket.status == TicketStatus.PENDING,
            Ticket.created_at < threshold
        ).all()

        for ticket in overdue_tickets:
            # Auto-escalate severity if ignored by officials
            ticket.severity_score = min(10, (ticket.severity_score or 5) + 2)
            print(f"⚠️ SLA VIOLATION: Escalated Ticket #{ticket.id}")
        
        db.commit()
    finally:
        db.close()