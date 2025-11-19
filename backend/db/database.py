# database.py
"""
Database configuration and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Get database URL from environment variable

load_dotenv()  # Load environment variables from .env file

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require" # dummy fallback url
)

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=5,         # Number of connections to maintain
    max_overflow=10      # Maximum overflow connections
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    """
    Dependency that creates a new database session for each request
    and closes it when the request is done
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()