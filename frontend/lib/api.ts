const API_URL = process.env.API_URL || "http://localhost:8000/api";

async function apiFetch(url: string, options: RequestInit = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    try {
      const errorData = await response.json();

      // Normalize common FastAPI/Pydantic error shapes so callers get a
      // readable string instead of `[object Object]`.
      let message = `HTTP error! status: ${response.status}`;

      if (errorData) {
        if (typeof errorData.detail === "string") {
          message = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          // Pydantic validation errors come as an array of { loc, msg, ... }
          const parts = errorData.detail.map((d: any) => {
            if (d && typeof d === "object") {
              if (d.msg) return d.msg;
              // sometimes ctx.error contains nested info
              if (d.input) return `${d.msg || JSON.stringify(d)}`;
              return JSON.stringify(d);
            }
            return String(d);
          });
          message = parts.join("; ");
        } else if (typeof errorData.detail === "object") {
          message = JSON.stringify(errorData.detail);
        }
      }

      throw new Error(message);
    } catch (e) {
      // If parsing JSON fails, throw a generic error
      if (e instanceof Error) {
        throw new Error(e.message || `HTTP error! status: ${response.status}`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
  return response.json();
}

export async function getProviders(): Promise<Provider[]> {
  return apiFetch(`${API_URL}/providers`);
}

export async function getAvailability(
  providerId: string,
  startDate: string,
  endDate: string
): Promise<{ provider: Provider; slots: TimeSlot[] }> {
  const url = `${API_URL}/availability?provider_id=${providerId}&start_date=${startDate}&end_date=${endDate}`;
  return apiFetch(url);
}

export async function createAppointment(
  slotId: string,
  providerId: string,
  patient: PatientInfo,
  reason: string
): Promise<Appointment> {
  return apiFetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slot_id: slotId,
      provider_id: providerId,
      patient,
      reason,
    }),
  });
}

export async function getProviderAppointments(
  providerId: string,
  startDate: string,
  endDate: string
): Promise<any> {
  const url = `${API_URL}/providers/${providerId}/appointments?start_date=${startDate}&end_date=${endDate}`;
  return apiFetch(url);
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


