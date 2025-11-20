"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ProviderCard } from "@/components/ProviderCard";
import { TimeSlotPicker } from "@/components/TimeSlotPicker";
import { BookingForm } from "@/components/BookingForm";
import {
  getProviders,
  getAvailability,
  createAppointment,
  Provider,
  TimeSlot,
  PatientInfo,
} from "@/lib/api";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { formatUTCDateTimeShort } from "@/lib/time";
import { Header } from "@/components/Header";
import { useMedicalProvider } from "@/context/MedicalProviderContext";

export default function HomePage() {
  const router = useRouter();
  const { provider: selectedProvider, setProvider } = useMedicalProvider();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Clear any selected timeslot when the selected provider changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedProvider?.id]);

  const { data: providers, isLoading: loadingProviders } = useQuery({
    queryKey: ["providers"],
    queryFn: getProviders,
  });

  const startDate = format(new Date(), "yyyy-MM-dd");
  const endDate = format(addDays(new Date(), 14), "yyyy-MM-dd");

  const { data: availabilityData, isLoading: loadingSlots } = useQuery({
    queryKey: ["availability", selectedProvider?.id, startDate, endDate],
    queryFn: () => (selectedProvider ? getAvailability(selectedProvider.id, startDate, endDate) : Promise.resolve({ slots: [] })),
    enabled: !!selectedProvider,
  });

  const handleProviderSelect = (provider: Provider) => {
    // toggle selection: deselect if clicking the same provider
    if (selectedProvider?.id === provider.id) setProvider(null);
    else setProvider(provider);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleFormSubmit = async (patient: PatientInfo, reason: string) => {
    if (!selectedSlot || !selectedProvider) return;

    try {
      const appointment = await createAppointment(
        selectedSlot.id,
        selectedProvider.id,
        patient,
        reason
      );

      toast.success("Appointment booked successfully!");

      router.push(
        `/confirmation?data=${encodeURIComponent(JSON.stringify(appointment))}`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to book appointment"
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Top headings removed per design - show two stacked sections below */}

        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Choose Your Provider
            </h2>
            <p className="text-lg text-muted-foreground">
              Select from our experienced healthcare professionals
            </p>
          </div>
          {loadingProviders ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {providers?.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onSelect={handleProviderSelect}
                  selected={selectedProvider?.id === provider.id}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Choose Date and Time
            </h2>
            <p className="text-muted-foreground">
              Select an available time slot for {selectedProvider ? selectedProvider.name : "your chosen provider"}
            </p>
          </div>

          <Card className="p-6 shadow-[var(--shadow-card)] md:min-h-[60vh]">
            {selectedProvider ? (
              <>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : availabilityData?.slots && availabilityData.slots.length > 0 ? (
                  <>
                    {/* Expanded times area (no inner scrollbar) so the date strip remains visible with times below */}
                    <div className="p-1">
                      <TimeSlotPicker
                        slots={availabilityData.slots}
                        selectedSlot={selectedSlot}
                        onSelectSlot={handleSlotSelect}
                        onBook={() => setDialogOpen(true)}
                      />
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Book Appointment</DialogTitle>
                          <DialogDescription>
                            Booking with {selectedProvider?.name} on {selectedSlot ? formatUTCDateTimeShort(selectedSlot.start_time) : ""}
                          </DialogDescription>
                        </DialogHeader>

                        <BookingForm
                          onSubmit={handleFormSubmit}
                          onBack={() => setDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No available slots found for the next 14 days.
                  </p>
                )}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">Please select a provider above to see available times.</p>
            )}
          </Card>
        </div>

        
      </main>
    </div>
  );
}
