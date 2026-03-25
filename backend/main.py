from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os

from app.api.v1 import dashboard, dispatch, web_ingest, whatsapp
from app.core.config import settings
from app.db.database import engine, Base, SessionLocal
from app.db.models import FieldWorker, DepartmentQueue  # <--- FIXED: Added missing models

def seed_database():
    db = SessionLocal()
    try:
        # Check if we already have workers
        if db.query(FieldWorker).count() == 0:
            print("🌱 Seeding database with prototype workers...")
            prototype_workers = [
                FieldWorker(worker_id="W-PWD-101", name="Venkat Reddy", phone="9876511111", department=DepartmentQueue.PUBLIC_WORKS),
                FieldWorker(worker_id="W-HMW-201", name="Syed Ali", phone="9876522221", department=DepartmentQueue.WATER_BOARD),
                FieldWorker(worker_id="W-SAN-301", name="Prakash Kumar", phone="9876533331", department=DepartmentQueue.SANITATION),
                # FIXED: Changed ELECTRICAL_DEPT to ELECTRICAL to match your models.py
                FieldWorker(worker_id="W-ELE-401", name="Karthik Sharma", phone="9876544441", department=DepartmentQueue.ELECTRICAL) 
            ]
            db.add_all(prototype_workers)
            db.commit()
            print("✅ Prototype workers loaded!")
    finally:
        db.close()

# ==========================================
# 1. LIFESPAN WORKFLOW (Startup & Shutdown)
# ==========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles everything that must happen BEFORE the server accepts traffic,
    and cleanly tears down resources when the server stops.
    """
    print(f"🚀 Booting up {settings.PROJECT_NAME}...")
    
    # 1. Verify Database connection and ensure tables exist FIRST
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables verified.")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        
    # 2. Seed the database AFTER the tables are created
    seed_database()
    
    print("✅ CivicFix India Backend is ready to receive traffic.")
    
    yield  # The application serves requests during this yield
    
    # --- Shutdown Phase ---
    print("🛑 Shutting down gracefully...")


# ==========================================
# 2. APPLICATION FACTORY
# ==========================================
def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan
    )

    # --- 3. CORS Middleware Wiring ---
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], # <--- CHANGE THIS TO "*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- 4. Global Exception Handling ---
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """
        Catches any unhandled errors so Uvicorn doesn't crash.
        Returns a clean JSON response to the Next.js frontend.
        """
        print(f"🚨 CRITICAL UNHANDLED ERROR: {exc}") 
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error. Our engineering team has been notified."},
        )

    # --- 5. MOUNT THE UPLOADS FOLDER ---
    os.makedirs("uploads", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

    # --- 6. Router Wiring ---
    app.include_router(web_ingest.router, prefix=f"{settings.API_V1_STR}/ingest", tags=["Ingestion"])
    app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
    app.include_router(dispatch.router, prefix=f"{settings.API_V1_STR}/dispatch", tags=["Dispatch"])
    app.include_router(whatsapp.router, prefix=f"{settings.API_V1_STR}/whatsapp", tags=["WhatsApp"])

    # --- 7. Health Check ---
    @app.get("/health", tags=["System"])
    def health_check():
        return {
            "status": "operational", 
            "version": settings.VERSION,
            "environment": "production"
        }

    return app

# Initialize the application
app = create_app()