from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from db.database import get_db
from db.tables.tables import Provider as DBProvider
import random
from pydantic import TypeAdapter
from models import (
    Provider,
    TimeSlot,
    CreateAppointmentRequest,
    Appointment,
    AvailabilityResponse,
    AppointmentSlot,
    AppointmentProvider
)
from helpers import (
    get_provider_by_id,
    _get_providers,
    check_slot_availability,
    create_appointment,
    get_booked_slots
)

app = FastAPI(title="Healthcare Appointment API", version="1.0.0")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "Healthcare Appointment API",
        "docs": "/docs",
        "endpoints": {
            "providers": "/api/providers",
            "availability": "/api/availability",
            "appointments": "/api/appointments"
        }
    }


@app.get("/providers", response_model=List[Provider])
def get_providers(db: Session = Depends(get_db)):
    """Get all providers (uses helper implementation)."""
    providers = _get_providers(db)
    # Convert SQLAlchemy models (ORM objects) to Pydantic models in one shot
    provider_list_adapter = TypeAdapter(List[Provider])
    return provider_list_adapter.validate_python(providers, from_attributes=True)

@app.get("/api/availability", response_model=AvailabilityResponse)
async def get_availability(
    provider_id: str = Query(..., description="Provider ID"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)")
):
    """
    Get available time slots for a provider within a date range.
    
    Business Rules:
    - 30-minute slots
    - 9:00 AM - 5:00 PM
    - Skip lunch (12:00 PM - 1:00 PM)
    - Skip weekends
    - Only future slots
    """
    # Validate provider exists
    provider = get_provider_by_id(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Parse dates
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    if end <= start:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")
    
    # Get booked slots
    booked_slots = get_booked_slots(provider_id, start_date, end_date)
    
    # Generate time slots
    slots = []
    current_date = start
    now = datetime.now()
    
    while current_date <= end:
        # Skip weekends (0 = Monday, 6 = Sunday)
        if current_date.weekday() < 5:  # Monday to Friday
            # Generate slots from 9 AM to 5 PM
            for hour in range(9, 17):
                for minute in [0, 30]:
                    # Skip lunch hour (12:00 PM - 1:00 PM)
                    if hour == 12:
                        continue
                    
                    slot_start = current_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    slot_end = slot_start + timedelta(minutes=30)
                    
                    # Only include future slots
                    if slot_start > now:
                        slot_id = f"slot-{provider_id}-{int(slot_start.timestamp() * 1000)}"
                        
                        slots.append(TimeSlot(
                            id=slot_id,
                            start_time=slot_start.isoformat() + "Z",
                            end_time=slot_end.isoformat() + "Z",
                            available=slot_id not in booked_slots
                        ))
        
        current_date += timedelta(days=1)
    
    return AvailabilityResponse(
        provider=AppointmentProvider(
            id=provider.id,
            name=provider.name,
            specialty=provider.specialty
        ),
        slots=slots
    )


@app.post("/api/appointments", response_model=Appointment, status_code=201)
async def book_appointment(request: CreateAppointmentRequest):
    """
    Create a new appointment.
    
    Validates:
    - Provider exists
    - Slot is available
    - Patient information is valid
    - Reason for visit is provided
    """
    # Validate provider exists
    provider = get_provider_by_id(request.provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Check slot availability
    is_available = check_slot_availability(request.slot_id, request.provider_id)
    if not is_available:
        raise HTTPException(
            status_code=409,
            detail="This time slot has already been booked"
        )
    
    # Parse slot ID to get times
    try:
        # Extract timestamp from slot_id: "slot-provider-1-1234567890"
        slot_timestamp = int(request.slot_id.split('-')[-1]) / 1000
        start_time = datetime.fromtimestamp(slot_timestamp)
        end_time = start_time + timedelta(minutes=30)
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid slot ID format")
    
    # Generate reference number
    date_str = start_time.strftime("%Y%m%d")
    random_num = str(random.randint(0, 999)).zfill(3)
    reference_number = f"REF-{date_str}-{random_num}"
    
    # Create appointment data
    appointment_data = {
        "id": f"appointment-{int(datetime.now().timestamp() * 1000)}",
        "reference_number": reference_number,
        "slot_id": request.slot_id,
        "provider_id": request.provider_id,
        "patient_first_name": request.patient.first_name,
        "patient_last_name": request.patient.last_name,
        "patient_email": request.patient.email,
        "patient_phone": request.patient.phone,
        "reason": request.reason,
        "start_time": start_time.isoformat() + "Z",
        "end_time": end_time.isoformat() + "Z",
        "status": "confirmed",
        "created_at": datetime.now().isoformat() + "Z"
    }
    
    # Save appointment (mock)
    created = create_appointment(appointment_data)
    
    # Return formatted response
    return Appointment(
        id=created["id"],
        reference_number=created["reference_number"],
        status=created["status"],
        slot=AppointmentSlot(
            start_time=created["start_time"],
            end_time=created["end_time"]
        ),
        provider=AppointmentProvider(
            id=provider.id,
            name=provider.name,
            specialty=provider.specialty
        ),
        patient=request.patient,
        reason=created["reason"],
        created_at=created["created_at"]
    )


@app.get("/api/providers/{provider_id}/appointments")
async def get_provider_appointments(
    provider_id: str,
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)")
):
    """
    Get all appointments for a provider within a date range.
    
    TODO: Implement this endpoint
    - Validate provider exists
    - Parse date range
    - Query database for appointments
    - Return formatted appointment list with patient info
    """
    # TODO: Validate provider
    provider = get_provider_by_id(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # TODO: Validate dates
    # TODO: Query appointments from database
    # TODO: Replace mock data below with real database queries
    
    # Mock appointments for demonstration
    mock_appointments = [
        {
            "id": "appt-001",
            "patient_name": "John Doe",
            "patient_email": "john.doe@example.com",
            "start_time": "2024-10-18T09:00:00Z",
            "end_time": "2024-10-18T09:30:00Z",
            "reason": "Annual checkup",
            "status": "confirmed"
        },
        {
            "id": "appt-002",
            "patient_name": "Jane Smith",
            "patient_email": "jane.smith@example.com",
            "start_time": "2024-10-18T10:00:00Z",
            "end_time": "2024-10-18T10:30:00Z",
            "reason": "Follow-up appointment",
            "status": "confirmed"
        },
        {
            "id": "appt-003",
            "patient_name": "Bob Johnson",
            "patient_email": "bob.j@example.com",
            "start_time": "2024-10-19T14:00:00Z",
            "end_time": "2024-10-19T14:30:00Z",
            "reason": "Lab results review",
            "status": "confirmed"
        },
        {
            "id": "appt-004",
            "patient_name": "Alice Williams",
            "patient_email": "alice.w@example.com",
            "start_time": "2024-10-21T11:00:00Z",
            "end_time": "2024-10-21T11:30:00Z",
            "reason": "Physical examination",
            "status": "confirmed"
        }
    ]
    
    return {
        "provider_id": provider_id,
        "appointments": mock_appointments
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

