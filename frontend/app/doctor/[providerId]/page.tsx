"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { getProviderAppointments, getProviders } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Loader2, Calendar, Users } from "lucide-react";
import { AppointmentCard } from "@/components/AppointmentCard";
import { DoctorCalendar } from "@/components/DoctorCalendar";
import { format, addDays } from "date-fns";

export default function DoctorSchedulePage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = use(params);
  const [startDate, setStartDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(() => format(addDays(new Date(), 30), "yyyy-MM-dd"));
  // pending inputs (don't refetch until user applies)
  const [pendingStart, setPendingStart] = useState(startDate);
  const [pendingEnd, setPendingEnd] = useState(endDate);

  const { data: providers } = useQuery({
    queryKey: ["providers"],
    queryFn: getProviders,
  });

  const {
    data: appointmentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["provider-appointments", providerId, startDate, endDate],
    queryFn: () =>
      getProviderAppointments(providerId, startDate, endDate),
  });

  const provider = providers?.find((p) => p.id === providerId);
  const appointments = appointmentsData?.appointments || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Doctor Schedule</h1>
          {provider && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>
                {provider.name} - {provider.specialty}
              </span>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <Card className="p-6 border-destructive">
            <p className="text-destructive">
              Error loading appointments. Please try again.
            </p>
          </Card>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DoctorCalendar
                providerId={providerId}
                appointments={appointments}
                isLoading={isLoading}
                error={error}
              />
            </div>

            {/* Appointment List */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  Upcoming Appointments ({appointments.length})
                </h2>
              </div>

              {/* Date filter controls (apply button) - responsive across breakpoints */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <label className="text-sm text-muted-foreground flex-shrink-0 hidden md:block">From</label>
                <input
                  type="date"
                  value={pendingStart}
                  onChange={(e) => setPendingStart(e.target.value)}
                  className="border rounded px-2 py-1 flex-1 min-w-[120px] lg:w-36 text-base md:text-sm"
                />
                <label className="text-sm text-muted-foreground flex-shrink-0 hidden md:block">To</label>
                <input
                  type="date"
                  value={pendingEnd}
                  onChange={(e) => setPendingEnd(e.target.value)}
                  className="border rounded px-2 py-1 flex-1 min-w-[120px] lg:w-36 text-base md:text-sm"
                />
                <button
                  onClick={() => {
                    setStartDate(pendingStart);
                    setEndDate(pendingEnd);
                  }}
                  disabled={new Date(pendingEnd) < new Date(pendingStart)}
                  className={`px-3 py-1 rounded text-sm font-medium flex-shrink-0 ${new Date(pendingEnd) < new Date(pendingStart) ? 'opacity-50 cursor-not-allowed bg-gray-200' : 'bg-primary text-white'}`}>
                  Apply
                </button>
                {new Date(pendingEnd) < new Date(pendingStart) && (
                  <div className="w-full text-sm text-destructive mt-1">End date must be the same or after start date</div>
                )}
              </div>

              {appointments.length === 0 ? (
                <Card className="p-6">
                  <p className="text-muted-foreground text-center">
                    No appointments scheduled
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment: any) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
