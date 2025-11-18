# Take-Home Assessment: Appointment Booking System

**Time Expectation:** ~4–8 hours

This assessment is designed to understand how you approach real-world product engineering problems — both frontend and backend. You don’t need to build a full production system, but the code should reflect your best practices for clarity, correctness, and structure.

If you're **more frontend-focused**, prioritize user experience, design quality, and responsiveness. We are expecting that you redesign the UI/UX to show off your design skills.
If you're **more backend-focused**, focus on robust scheduling logic, database design, and API reliability.

---

## Project Overview

Build a simplified appointment booking system for a healthcare practice. Patients should be able to view available time slots and book appointments. Doctors should be able to view their schedule. The UI and backend logic should work together to provide a clean, functional experience.

You’ll be implementing:

1. **Patient booking flow:** View and book available appointments.
2. **Doctor schedule view:** Calendar view of upcoming appointments.
3. **Confirmation page:** Display appointment details after booking.

---

## Quick Start

### Installation

**Frontend:**

```bash
pnpm i
```

**Backend:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### Running the Application

**Frontend:**

```bash
pnpm dev:frontend
```

**Backend:**

```bash
pnpm dev:backend
```

---

## Core Requirements

### 1. View Available Appointments

- Calendar or list view of available time slots
- Filter by provider (Dr. Sarah Chen or Dr. James Kumar)
- Show next 14 days only, weekdays 9 AM–5 PM (30-min intervals)
- Exclude lunch (12:00–1:00 PM) and weekends

### 2. Book an Appointment

- Form fields (all required): first name, last name, email, phone, reason for visit
- Input validation and loading states
- Prevent double-booking

### 3. Doctor Schedule View

- Calendar showing appointments with patient name, time, reason, and status
- Filter by date range
- Responsive design

### 4. Confirmation Page

- Show appointment details and reference ID after booking

---

## Technical Requirements

### Frontend

- Responsive, professional UI (healthcare-appropriate)
- Strict TypeScript typing (no `any`)
- Clean component structure with proper loading/error states
- Accessibility (semantic HTML, keyboard navigation, ARIA labels)
- Performance optimizations (code splitting, image optimization)

### Backend

- Real database (PostgreSQL, SQLite, etc.)
- RESTful API design with validation and error handling
- Prevent double-booking and invalid inputs
- Data persistence with Pydantic models
- Basic security (input sanitization, SQL injection prevention)

---

## Implementation Notes

### Backend Setup

The `backend/` folder contains a FastAPI starter. It’s minimal — you’ll need to implement database persistence, validation, and business logic.

Run it directly if needed:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Enable API calls by uncommenting the FastAPI code in `frontend/lib/api.ts` and replacing stub functions.

### Database Schema

Create two tables:

- **providers:** `id, name, specialty, bio`
- **appointments:** `id, reference_number, provider_id, slot_id, patient_first_name, patient_last_name, patient_email, patient_phone, reason, start_time, end_time, status, created_at`

### Required API Endpoints

1. **GET /providers** – Returns list of providers
2. **GET /availability** – Returns available time slots for a given provider and date range
3. **POST /appointments** – Creates a new appointment with validation and reference number generation

### Frontend API Integration

Replace stub functions in `frontend/lib/api.ts` with real fetch requests. Handle CORS as needed:

**FastAPI:**

```python
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"])
```

---

## Testing Checklist

- View providers and available slots
- Book appointment and see confirmation
- Data persists in database
- Double-booking is prevented
- Invalid inputs return clear errors

---

## Submission

### Submit:

1. Complete source code (GitHub or ZIP)
2. Updated README with setup instructions
3. Short write-up (~5–10 mins) covering:
   - Architecture decisions
   - Challenges and solutions
   - Areas for improvement

---

## What We Look For

- Clean, maintainable, and well-structured code
- Correct and complete implementation of core features
- Clear validation, business logic, and error handling
- Attention to design quality, accessibility, and user experience
- Thoughtful architecture and trade-off decisions
- Good documentation and project organization

---

## Stretch Goals (Optional)

If you finish early and want to push further, consider adding any of the following:

- **UI Enhancements:** Animations, micro-interactions, loading skeletons
- **Scheduling Features:** Appointment rescheduling or cancellation flows
- **Platform Features:** PWA support, dark mode, offline-ready UI
- **AI-Powered Enhancements:**
  - Smart appointment suggestions based on history or preferences
  - Natural language booking (e.g. “Book a checkup next Tuesday afternoon”)
  - Simple chatbot for appointment booking assistance
  - Intelligent scheduling (e.g. auto-spacing or conflict detection)

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**We’re excited to see how you approach this challenge. Focus on writing thoughtful, production-quality code and demonstrating how you think through real product problems.**
