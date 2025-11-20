from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from db.database import get_db
from db.tables.tables import Provider as DBProvider
from db.tables.tables import (
    Appointment as DBAppointment,
    TimeSlot as DBTimeSlot,
    Patient as DBPatient,
)
import random
from pydantic import TypeAdapter
from models import (
    Provider,
    TimeSlot,
    CreateAppointmentRequest,
    Appointment,
    AvailabilityResponse,
    ProviderAppointmentsResponse,
    AppointmentSlot,
    AppointmentProvider,
)
from helpers import (
    get_provider_by_id,
    get_providers,
    check_slot_availability,
    create_appointment,
    get_booked_slots,
)

app = FastAPI(title="Healthcare Appointment API", version="1.0.0")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    # Allow the common local dev origins. Add more if you serve the frontend
    # from a different host (127.0.0.1) or port.
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://decoda-booking.vercel.app",
    ],
    allow_credentials=False,
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
            "appointments": "/api/appointments",
        },
    }


@app.get("/api/providers", response_model=List[Provider])
def api_get_providers(db: Session = Depends(get_db)):
    """Get all providers (uses helper implementation)."""
    providers = get_providers(db)
    # Convert SQLAlchemy models (ORM objects) to Pydantic models in one shot
    provider_list_adapter = TypeAdapter(List[Provider])
    return provider_list_adapter.validate_python(providers, from_attributes=True)


@app.get("/api/availability", response_model=AvailabilityResponse)
async def get_availability(
    provider_id: str = Query(..., description="Provider ID"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
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
        raise HTTPException(
            status_code=400, detail="Invalid date format. Use YYYY-MM-DD"
        )

    if end <= start:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")

    # Get booked slots (pass parsed datetimes so we don't re-parse inside helper)
    booked_slots = get_booked_slots(provider_id, start, end)

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

                    slot_start = current_date.replace(
                        hour=hour, minute=minute, second=0, microsecond=0
                    )
                    slot_end = slot_start + timedelta(minutes=30)

                    # Only include future slots
                    if slot_start > now:
                        slot_id = (
                            f"slot-{provider_id}-{int(slot_start.timestamp() * 1000)}"
                        )

                        slots.append(
                            TimeSlot(
                                id=slot_id,
                                start_time=slot_start.isoformat() + "Z",
                                end_time=slot_end.isoformat() + "Z",
                                available=slot_id not in booked_slots,
                            )
                        )

        current_date += timedelta(days=1)

    return AvailabilityResponse(
        provider=AppointmentProvider(
            id=provider.id, name=provider.name, specialty=provider.specialty
        ),
        slots=slots,
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
            status_code=409, detail="This time slot has already been booked"
        )

    # Parse slot ID to get times
    try:
        # Extract timestamp from slot_id: "slot-provider-1-1234567890"
        slot_timestamp = int(request.slot_id.split("-")[-1]) / 1000
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
        "created_at": datetime.now().isoformat() + "Z",
    }

    # Save appointment (creates DB TimeSlot if missing)
    try:
        created = create_appointment(appointment_data)
    except ValueError as ve:
        # Missing or invalid start/end times for slot creation
        raise HTTPException(status_code=400, detail=str(ve))
    except IntegrityError as ie:
        # Database integrity issue (unique constraint, FK, race-condition)
        # Return 422 Unprocessable Entity so client understands request
        # was syntactically valid but couldn't be processed.
        raise HTTPException(
            status_code=422,
            detail="Database integrity error: unable to create appointment",
        )
    except Exception as e:
        # Fallback to 500 for unexpected errors
        raise HTTPException(status_code=500, detail="Internal server error")

    # `create_appointment` now returns a Pydantic `Appointment` model.
    # Build the response using that model but override provider & patient
    return Appointment(
        id=created.id,
        reference_number=created.reference_number,
        status=created.status,
        slot=AppointmentSlot(
            start_time=created.slot.start_time, end_time=created.slot.end_time
        ),
        provider=AppointmentProvider(
            id=provider.id, name=provider.name, specialty=provider.specialty
        ),
        patient=request.patient,
        reason=created.reason,
        created_at=created.created_at,
    )


@app.get(
    "/api/providers/{provider_id}/appointments",
    response_model=ProviderAppointmentsResponse,
)
async def get_provider_appointments(
    provider_id: str,
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    """
    Get all appointments for a provider within a date range.

    - Validate provider exists
    - Parse date range
    - Query database for appointments
    - Return formatted appointment list with patient info
    """
    provider = get_provider_by_id(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Validate dates
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(
            days=1
        )  # make end exclusive
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Invalid date format. Use YYYY-MM-DD"
        )

    if end_dt <= start_dt:
        raise HTTPException(
            status_code=400, detail="end_date must be after or equal to start_date"
        )

    # Query appointments joined with time slots and patients
    results = (
        db.query(DBAppointment, DBTimeSlot, DBPatient)
        .join(DBTimeSlot, DBAppointment.slot_id == DBTimeSlot.id)
        .join(DBPatient, DBAppointment.patient_id == DBPatient.id)
        .filter(DBAppointment.provider_id == provider_id)
        .filter(DBTimeSlot.start_time >= start_dt)
        .filter(DBTimeSlot.start_time < end_dt)
        .order_by(DBTimeSlot.start_time)
        .all()
    )

    appointments = []
    for appt, slot, patient in results:
        appointments.append(
            {
                "id": appt.id,
                "patient_name": f"{patient.first_name} {patient.last_name}",
                "patient_email": patient.email,
                "start_time": (
                    slot.start_time.isoformat() + "Z" if slot.start_time else None
                ),
                "end_time": slot.end_time.isoformat() + "Z" if slot.end_time else None,
                "reason": appt.reason,
                "status": appt.status,
            }
        )

    # Also include any appointments that may not have a timeslot join (defensive)
    # but in this schema appointments must have a time slot, so above should suffice.

    return {
        "provider_id": provider_id,
        "appointments": appointments,
    }


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Healthcare Appointment API"}


if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
