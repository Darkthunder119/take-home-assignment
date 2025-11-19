"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { Header } from "@/components/Header";

type BookingStep = "select-provider" | "select-slot" | "patient-info";

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState<BookingStep>("select-provider");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null
  );
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const { data: providers, isLoading: loadingProviders } = useQuery({
    queryKey: ["providers"],
    queryFn: getProviders,
  });

  const startDate = format(new Date(), "yyyy-MM-dd");
  const endDate = format(addDays(new Date(), 14), "yyyy-MM-dd");

  const { data: availabilityData, isLoading: loadingSlots } = useQuery({
    queryKey: ["availability", selectedProvider?.id, startDate, endDate],
    queryFn: () => getAvailability(selectedProvider!.id, startDate, endDate),
    enabled: !!selectedProvider && step === "select-slot",
  });

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setStep("select-slot");
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleContinueToForm = () => {
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }
    // Open modal handled by Dialog trigger; keep step unchanged
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

  const handleBack = () => {
    if (step === "select-slot") {
      setStep("select-provider");
      setSelectedProvider(null);
      setSelectedSlot(null);
    } else if (step === "patient-info") {
      setStep("select-slot");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <div
              className={`flex items-center gap-2 transition-all ${
                step === "select-provider"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step === "select-provider"
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                Select Provider
              </span>
            </div>
            <div className="w-8 sm:w-16 h-0.5 bg-border" />
            <div
              className={`flex items-center gap-2 transition-all ${
                step === "select-slot"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step === "select-slot"
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                Choose Time
              </span>
            </div>
            <div className="w-8 sm:w-16 h-0.5 bg-border" />
            <div
              className={`flex items-center gap-2 transition-all ${
                step === "patient-info"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step === "patient-info"
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                Your Details
              </span>
            </div>
          </div>
        </div>

        {step === "select-provider" && (
          <div>
            <div className="text-center mb-10">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {providers?.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onSelect={handleProviderSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {step === "select-slot" && selectedProvider && (
          <div>
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Card className="p-6 shadow-[var(--shadow-card)]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Select Appointment Time
                </h2>
                <p className="text-muted-foreground">
                  Booking with {selectedProvider.name}
                </p>
              </div>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : availabilityData?.slots &&
                availabilityData.slots.length > 0 ? (
                <>
                  <TimeSlotPicker
                    slots={availabilityData.slots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={handleSlotSelect}
                  />
                  <div className="mt-6 pt-6 border-t">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setDialogOpen(true)}
                          disabled={!selectedSlot}
                          className="w-full sm:w-auto rounded-full font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 px-8"
                        >
                          Book
                        </Button>
                      </DialogTrigger>

                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Book Appointment</DialogTitle>
                          <DialogDescription>
                            Booking with {selectedProvider.name} on {selectedSlot ? new Date(selectedSlot.start_time).toLocaleString() : ""}
                          </DialogDescription>
                        </DialogHeader>

                        <BookingForm
                          onSubmit={async (patient, reason) => {
                            try {
                              const appointment = await createAppointment(
                                selectedSlot!.id,
                                selectedProvider!.id,
                                patient,
                                reason
                              );
                              setDialogOpen(false);
                              toast.success("Appointment booked successfully!");
                              router.push(
                                `/confirmation?data=${encodeURIComponent(JSON.stringify(appointment))}`
                              );
                            } catch (error) {
                              toast.error(
                                error instanceof Error ? error.message : "Failed to book appointment"
                              );
                            }
                          }}
                          onBack={() => setDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No available slots found for the next 14 days.
                </p>
              )}
            </Card>
          </div>
        )}

        {step === "patient-info" && selectedSlot && selectedProvider && (
          <div>
            <Card className="p-6 shadow-[var(--shadow-card)] max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Patient Information
              </h2>
              <BookingForm onSubmit={handleFormSubmit} onBack={handleBack} />
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
