from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Using SQLite for rapid local testing and building
SQLALCHEMY_DATABASE_URL = "sqlite:///./civicfix.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency to get the database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()