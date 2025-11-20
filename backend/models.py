from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re


class Provider(BaseModel):
    id: str
    name: str
    specialty: str
    bio: Optional[str] = None


class TimeSlot(BaseModel):
    id: str
    start_time: str
    end_time: str
    available: bool


class PatientInfo(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: str
    phone: str

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z\s]+$", v):
            raise ValueError("Name must contain only letters and spaces")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        # Flexible phone format: (555) 555-5555 or +1-555-555-5555
        if not re.match(r"^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$", v):
            raise ValueError("Invalid phone number format")
        return v


class CreateAppointmentRequest(BaseModel):
    slot_id: str
    provider_id: str
    patient: PatientInfo
    reason: str = Field(..., min_length=3, max_length=500)


class AppointmentSlot(BaseModel):
    start_time: str
    end_time: str


class AppointmentProvider(BaseModel):
    id: str
    name: str
    specialty: str


class Appointment(BaseModel):
    id: str
    reference_number: str
    status: str
    slot: AppointmentSlot
    provider: AppointmentProvider
    patient: PatientInfo
    reason: str
    created_at: str


class AvailabilityResponse(BaseModel):
    provider: AppointmentProvider
    slots: list[TimeSlot]


class ProviderAppointment(BaseModel):
    id: str
    patient_name: str
    patient_email: str
    start_time: str
    end_time: str
    reason: str
    status: str


class ProviderAppointmentsResponse(BaseModel):
    provider_id: str
    appointments: list[ProviderAppointment]
