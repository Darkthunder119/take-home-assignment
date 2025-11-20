from typing import Optional, List, Dict, Set, TypedDict, Union
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.tables.tables import Provider as DBProvider, Appointment as DBAppointment, Patient as DBPatient, TimeSlot as DBTimeSlot
from models import Appointment as AppointmentSchema


class AppointmentCreateData(TypedDict, total=False):
    id: str
    reference_number: str
    slot_id: str
    provider_id: str
    patient_first_name: str
    patient_last_name: str
    patient_email: str
    patient_phone: str
    reason: str
    status: str


def get_providers(db: Optional[Session] = None) -> List[DBProvider]:
    """
    Return a list of providers.

    If a SQLAlchemy session is provided, query the database. Otherwise a
    temporary session will be created and closed.
    """
    close_after = False
    if db is None:
        db = SessionLocal()
        close_after = True

    try:
        providers = db.query(DBProvider).all()
        return providers
    finally:
        if close_after:
            db.close()


def get_provider_by_id(provider_id: str, db: Optional[Session] = None) -> Optional[DBProvider]:
    """
    Get a single provider by ID.

    This will use the provided session if available, otherwise it will
    create a short-lived session.
    """
    close_after = False
    if db is None:
        db = SessionLocal()
        close_after = True

    try:
        provider = db.query(DBProvider).filter(DBProvider.id == provider_id).first()
        return provider
    finally:
        if close_after:
            db.close()


def check_slot_availability(slot_id: str, provider_id: str, db: Optional[Session] = None) -> bool:
    """
    Check if a time slot is available for booking.
    """
    close_after = False
    if db is None:
        db = SessionLocal()
        close_after = True

    try:
        existing = db.query(DBAppointment).filter(
            DBAppointment.slot_id == slot_id,
            DBAppointment.provider_id == provider_id
        ).first()
        return existing is None
    finally:
        if close_after:
            db.close()


def create_appointment(appointment_data: AppointmentCreateData, db: Optional[Session] = None) -> AppointmentSchema:
    """
    Create a new appointment in the database.
    """
    close_after = False
    if db is None:
        db = SessionLocal()
        close_after = True

    try:
        # Use provided patient details
        p_email = appointment_data.get("patient_email")
        p_first = appointment_data.get("patient_first_name")
        p_last = appointment_data.get("patient_last_name")
        p_phone = appointment_data.get("patient_phone")

        patient = None
        if p_email:
            patient = db.query(DBPatient).filter(DBPatient.email == p_email).first()

        if not patient:
            # create new patient
            patient = DBPatient(
                first_name=p_first or "",
                last_name=p_last or "",
                email=p_email or "",
                phone=p_phone or ""
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)

        # Create appointment record.
        # The availability endpoint generates slots in-memory and doesn't
        # persist them. If the referenced TimeSlot row doesn't exist we
        # create a minimal one using the provided start/end times so the
        # appointment's foreign key constraint can be satisfied.
        slot_id = appointment_data.get("slot_id")
        if slot_id:
            slot = db.query(DBTimeSlot).filter(DBTimeSlot.id == slot_id).first()
            if not slot:
                # Expect start_time/end_time in ISO format (with or without Z)
                s = appointment_data.get("start_time")
                e = appointment_data.get("end_time")
                try:
                    # strip trailing Z if present
                    if isinstance(s, str) and s.endswith("Z"):
                        s = s[:-1]
                    if isinstance(e, str) and e.endswith("Z"):
                        e = e[:-1]
                    start_dt = datetime.fromisoformat(s) if s else None
                    end_dt = datetime.fromisoformat(e) if e else None
                except Exception:
                    start_dt = None
                    end_dt = None

                # Create a minimal TimeSlot if we have times; otherwise raise
                # a clear error so caller knows the slot couldn't be created.
                if start_dt and end_dt:
                    slot = DBTimeSlot(
                        id=slot_id,
                        provider_id=appointment_data.get("provider_id"),
                        start_time=start_dt,
                        end_time=end_dt,
                        available=False,
                    )
                    db.add(slot)
                    # flush so FK will be satisfied for the appointment insert
                    db.flush()
                else:
                    raise ValueError("Missing or invalid start_time/end_time for new time slot")

        appt = DBAppointment(
            id=appointment_data.get("id"),
            reference_number=appointment_data.get("reference_number"),
            slot_id=appointment_data.get("slot_id"),
            provider_id=appointment_data.get("provider_id"),
            patient_id=patient.id,
            reason=appointment_data.get("reason"),
            status=appointment_data.get("status", "scheduled")
        )
        db.add(appt)
        db.commit()
        db.refresh(appt)

        # Build returned payload (keep same shape main.py expects)
        created = {
            "id": appt.id,
            "reference_number": appt.reference_number,
            "slot_id": appt.slot_id,
            "provider_id": appt.provider_id,
            "patient_first_name": p_first,
            "patient_last_name": p_last,
            "patient_email": p_email,
            "patient_phone": p_phone,
            "reason": appt.reason,
            # start_time/end_time are stored on TimeSlot; try to fetch if present
            "start_time": None,
            "end_time": None,
            "status": appt.status,
            "created_at": appt.created_at.isoformat() + "Z" if appt.created_at else datetime.now().isoformat() + "Z"
        }

        if appt.slot_id:
            slot = db.query(DBTimeSlot).filter(DBTimeSlot.id == appt.slot_id).first()
            if slot:
                created["start_time"] = slot.start_time.isoformat() + "Z"
                created["end_time"] = slot.end_time.isoformat() + "Z"

        # Validate/normalize via the Pydantic Appointment schema and return
        # the model. If validation fails, fall back to constructing a minimal
        # AppointmentSchema from the available fields so callers still receive
        # a typed object.
        try:
            validated = AppointmentSchema.model_validate({
                "id": created["id"],
                "reference_number": created["reference_number"],
                "status": created["status"],
                "slot": {"start_time": created["start_time"], "end_time": created["end_time"]},
                "provider": {"id": created["provider_id"], "name": "", "specialty": ""},
                "patient": {
                    "first_name": created["patient_first_name"] or "",
                    "last_name": created["patient_last_name"] or "",
                    "email": created["patient_email"] or "",
                    "phone": created["patient_phone"] or ""
                },
                "reason": created["reason"] or "",
                "created_at": created["created_at"]
            })
            return validated
        except Exception:
            # If validation fails, return a minimal AppointmentSchema constructed
            # from the available fields so callers get a typed object.
            return AppointmentSchema(
                id=created.get("id", ""),
                reference_number=created.get("reference_number", ""),
                status=created.get("status", ""),
                slot={"start_time": created.get("start_time"), "end_time": created.get("end_time")},
                provider={"id": created.get("provider_id", ""), "name": "", "specialty": ""},
                patient={
                    "first_name": created.get("patient_first_name", ""),
                    "last_name": created.get("patient_last_name", ""),
                    "email": created.get("patient_email", ""),
                    "phone": created.get("patient_phone", "")
                },
                reason=created.get("reason", ""),
                created_at=created.get("created_at", datetime.now().isoformat() + "Z")
            )
    finally:
        if close_after:
            db.close()


def get_booked_slots(provider_id: str, start_date: Union[str, datetime], end_date: Union[str, datetime], db: Optional[Session] = None) -> Set[str]:
    """
    Get all booked slot IDs for a provider within a date range.
    """
    close_after = False
    if db is None:
        db = SessionLocal()
        close_after = True

    try:
        # Accept either date strings (YYYY-MM-DD) or datetime objects.
        try:
            if isinstance(start_date, str):
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            else:
                start_dt = start_date

            if isinstance(end_date, str):
                end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            else:
                end_dt = end_date + timedelta(days=1)
        except Exception:
            # if parsing fails, return empty set
            return set()

        # Join appointments to time_slots to filter by slot time range
        results = (
            db.query(DBAppointment.slot_id)
            .join(DBTimeSlot, DBAppointment.slot_id == DBTimeSlot.id)
            .filter(DBAppointment.provider_id == provider_id)
            .filter(DBTimeSlot.start_time >= start_dt)
            .filter(DBTimeSlot.start_time < end_dt)
            .all()
        )

        return {row[0] for row in results if row[0]}
    finally:
        if close_after:
            db.close()

