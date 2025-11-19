const API_URL = "http://localhost:8000";

export async function getProviders(): Promise<Provider[]> {
  const response = await fetch(`${API_URL}/providers`);
  if (!response.ok) throw new Error("Failed to fetch providers");
  return response.json();
}

// export async function getAvailability(
//   providerId: string,
//   startDate: string,
//   endDate: string
// ): Promise<{ provider: Provider; slots: TimeSlot[] }> {
//   const url = `${API_URL}/availability?provider_id=${providerId}&start_date=${startDate}&end_date=${endDate}`;
//   const response = await fetch(url);
//   if (!response.ok) throw new Error("Failed to fetch availability");
//   return response.json();
// }

// export async function createAppointment(
//   slotId: string,
//   providerId: string,
//   patient: PatientInfo,
//   reason: string
// ): Promise<Appointment> {
//   const response = await fetch(`${API_URL}/appointments`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       slot_id: slotId,
//       provider_id: providerId,
//       patient,
//       reason,
//     }),
//   });
//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.detail || "Failed to create appointment");
//   }
//   return response.json();
// }


export interface Provider {
  id: string;
  name: string;
  specialty: string;
  bio?: string;
}

export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface PatientInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface Appointment {
  id: string;
  reference_number: string;
  status: string;
  slot: {
    start_time: string;
    end_time: string;
  };
  provider: Provider;
  patient: PatientInfo;
  reason: string;
  created_at: string;
}

export async function getAvailability(
  providerId: string,
  startDate: string,
  endDate: string
): Promise<{ provider: Provider; slots: TimeSlot[] }> {
  console.log("[STUB] getAvailability called with:", {
    providerId,
    startDate,
    endDate,
  });

  const providers = await getProviders();
  const provider = providers.find((p) => p.id === providerId);

  if (!provider) {
    throw new Error("Provider not found");
  }

  const slots: TimeSlot[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const dayOfWeek = date.getDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          if (hour === 12) continue;

          const slotStart = new Date(date);
          slotStart.setHours(hour, minute, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + 30);

          if (slotStart > new Date()) {
            slots.push({
              id: `slot-${providerId}-${slotStart.getTime()}`,
              start_time: slotStart.toISOString(),
              end_time: slotEnd.toISOString(),
              available: true,
            });
          }
        }
      }
    }
  }

  console.log(`[STUB] Returning ${slots.length} available slots`);

  return {
    provider: {
      id: provider.id,
      name: provider.name,
      specialty: provider.specialty,
    },
    slots,
  };
}

export async function createAppointment(
  slotId: string,
  providerId: string,
  patient: PatientInfo,
  reason: string
): Promise<Appointment> {
  console.log("[STUB] createAppointment called with:", {
    slotId,
    providerId,
    patient,
    reason,
  });

  const providers = await getProviders();
  const provider = providers.find((p) => p.id === providerId);

  if (!provider) {
    throw new Error("Provider not found");
  }

  const slotTimestamp = parseInt(slotId.split("-").pop() || "0");
  const startTime = new Date(slotTimestamp);
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

  const dateStr = startTime.toISOString().split("T")[0].replace(/-/g, "");
  const randomNum = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  const referenceNumber = `REF-${dateStr}-${randomNum}`;

  const appointment: Appointment = {
    id: `appointment-${Date.now()}`,
    reference_number: referenceNumber,
    status: "confirmed",
    slot: {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    },
    provider: {
      id: provider.id,
      name: provider.name,
      specialty: provider.specialty,
    },
    patient,
    reason,
    created_at: new Date().toISOString(),
  };

  console.log("[STUB] Appointment created successfully:", appointment);

  return appointment;
}

export async function getProviderAppointments(
  providerId: string,
  startDate: string,
  endDate: string
): Promise<any> {
  // TODO: Uncomment when backend is ready
  // const response = await fetch(
  //   `${API_URL}/providers/${providerId}/appointments?start_date=${startDate}&end_date=${endDate}`
  // );
  // if (!response.ok) throw new Error("Failed to fetch appointments");
  // return response.json();

  // Mock data for demonstration
  console.log("[STUB] getProviderAppointments called");
  return {
    provider_id: providerId,
    appointments: [
      {
        id: "appt-001",
        patient_name: "John Doe",
        patient_email: "john.doe@example.com",
        start_time: "2024-10-18T09:00:00Z",
        end_time: "2024-10-18T09:30:00Z",
        reason: "Annual checkup",
        status: "confirmed",
      },
      {
        id: "appt-002",
        patient_name: "Jane Smith",
        patient_email: "jane.smith@example.com",
        start_time: "2024-10-18T10:00:00Z",
        end_time: "2024-10-18T10:30:00Z",
        reason: "Follow-up appointment",
        status: "confirmed",
      },
      {
        id: "appt-003",
        patient_name: "Bob Johnson",
        patient_email: "bob.j@example.com",
        start_time: "2024-10-19T14:00:00Z",
        end_time: "2024-10-19T14:30:00Z",
        reason: "Lab results review",
        status: "confirmed",
      },
      {
        id: "appt-004",
        patient_name: "Alice Williams",
        patient_email: "alice.w@example.com",
        start_time: "2024-10-21T11:00:00Z",
        end_time: "2024-10-21T11:30:00Z",
        reason: "Physical examination",
        status: "confirmed",
      },
    ],
  };
}
