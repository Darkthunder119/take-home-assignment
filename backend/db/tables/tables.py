# models.py
"""
SQLAlchemy models matching your database schema
"""

from sqlalchemy import Column, String, Text, TIMESTAMP, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base


class Provider(Base):
    __tablename__ = "providers"

    id = Column(String(255), primary_key=True)
    name = Column(String(255), nullable=False)
    specialty = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    time_slots = relationship("TimeSlot", back_populates="provider", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="provider")

    def __repr__(self):
        return f"<Provider(id={self.id}, name={self.name}, specialty={self.specialty})>"


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(String(255), primary_key=True)
    provider_id = Column(String(255), ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(TIMESTAMP, nullable=False)
    end_time = Column(TIMESTAMP, nullable=False)
    available = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    provider = relationship("Provider", back_populates="time_slots")
    appointments = relationship("Appointment", back_populates="slot")

    def __repr__(self):
        return f"<TimeSlot(id={self.id}, start={self.start_time}, available={self.available})>"


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    appointments = relationship("Appointment", back_populates="patient")

    def __repr__(self):
        return f"<Patient(id={self.id}, name={self.first_name} {self.last_name})>"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(255), primary_key=True)
    reference_number = Column(String(50), unique=True, nullable=False)
    slot_id = Column(String(255), ForeignKey("time_slots.id", ondelete="RESTRICT"), nullable=False)
    provider_id = Column(String(255), ForeignKey("providers.id", ondelete="RESTRICT"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="RESTRICT"), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="scheduled")
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    slot = relationship("TimeSlot", back_populates="appointments")
    provider = relationship("Provider", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")

    def __repr__(self):
        return f"<Appointment(id={self.id}, ref={self.reference_number}, status={self.status})>"
