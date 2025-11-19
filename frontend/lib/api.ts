const API_URL = "http://localhost:8000/api";

export async function getProviders(): Promise<Provider[]> {
  const response = await fetch(`${API_URL}/providers`);
  if (!response.ok) throw new Error("Failed to fetch providers");
  return response.json();
}

export async function getAvailability(
  providerId: string,
  startDate: string,
  endDate: string
): Promise<{ provider: Provider; slots: TimeSlot[] }> {
  const url = `${API_URL}/availability?provider_id=${providerId}&start_date=${startDate}&end_date=${endDate}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch availability");
  return response.json();
}

export async function createAppointment(
  slotId: string,
  providerId: string,
  patient: PatientInfo,
  reason: string
): Promise<Appointment> {
  const response = await fetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slot_id: slotId,
      provider_id: providerId,
      patient,
      reason,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create appointment");
  }
  return response.json();
}


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

export async function getProviderAppointments(
  providerId: string,
  startDate: string,
  endDate: string
): Promise<any> {
  const response = await fetch(
    `${API_URL}/providers/${providerId}/appointments?start_date=${startDate}&end_date=${endDate}`
  );
  if (!response.ok) throw new Error("Failed to fetch appointments");
  return response.json();

}
