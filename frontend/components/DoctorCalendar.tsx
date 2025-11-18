"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, parseISO } from "date-fns";

// TODO: Complete calendar component
// Requirements:
// 1. ✅ Use shadcn calendar component as base
// 2. TODO: Mark days with appointments - add custom day styling
// 3. TODO: Show appointment count per day - add badges to calendar days
// 4. ✅ Click day to see appointment details
// 5. TODO: Add filters (week/month view)

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  patient_name: string;
  reason: string;
  status?: string;
}

interface DoctorCalendarProps {
  providerId: string;
  appointments: Appointment[];
}

export function DoctorCalendar({
  providerId,
  appointments,
}: DoctorCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  // Group appointments by date
  const appointmentsByDate = appointments.reduce(
    (acc: Record<string, Appointment[]>, appointment) => {
      const dateKey = format(parseISO(appointment.start_time), "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(appointment);
      return acc;
    },
    {}
  );

  // Get appointments for selected date
  const selectedDateAppointments = selectedDate
    ? appointments.filter((apt) =>
        isSameDay(parseISO(apt.start_time), selectedDate)
      )
    : [];

  // Get days that have appointments
  const daysWithAppointments = Object.keys(appointmentsByDate).map((dateStr) =>
    parseISO(dateStr)
  );

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Calendar View</h2>

      {/* TODO: Enhance calendar styling to show appointment indicators */}
      <div className="flex justify-center mb-6">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border"
          modifiers={{
            hasAppointments: daysWithAppointments,
          }}
          modifiersStyles={{
            hasAppointments: {
              fontWeight: "bold",
              textDecoration: "underline",
            },
          }}
        />
      </div>

      {/* Selected Date Appointments */}
      {selectedDate && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-3">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h3>

          {selectedDateAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No appointments scheduled for this day
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDateAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{apt.patient_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(apt.start_time), "h:mm a")} -{" "}
                        {format(parseISO(apt.end_time), "h:mm a")}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {apt.status || "confirmed"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {apt.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TODO: Add week/month view toggle */}
      {/* TODO: Add better visual indicators for days with appointments */}
    </Card>
  );
}
