"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Calendar, Clock, User, Mail, Phone } from "lucide-react";
import Avatar from "@/components/ui/avatar";
import { format } from "date-fns";
import { formatUTCDate, formatUTCTime } from "@/lib/time";
import { useEffect, useState, Suspense } from "react";
import { Appointment } from "@/lib/api";
import { Header } from "@/components/Header";

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Header />
          <div className="max-w-2xl mx-auto py-12 px-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-40 bg-gray-200 rounded" />
              <div className="h-64 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    const data = searchParams.get("data");
    if (data) {
      try {
        const parsed = JSON.parse(decodeURIComponent(data));
        setAppointment(parsed);
      } catch (error) {
        console.error("Failed to parse appointment data:", error);
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [searchParams, router]);

  if (!appointment) return null;

  const startTime = new Date(appointment.slot.start_time);
  const endTime = new Date(appointment.slot.end_time);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 animate-scale-in">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Appointment Confirmed!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your appointment has been successfully booked
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-6">
          <div className="bg-accent/30 rounded-lg p-4 text-center" role="status" aria-live="polite">
            <p className="text-sm text-muted-foreground mb-1">
              Reference Number
            </p>
            <p className="text-2xl font-bold text-primary" aria-label={`Reference ${appointment.reference_number}`}>
              {appointment.reference_number}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <User className="w-5 h-5 text-primary" />
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="font-semibold text-foreground">
                  {appointment.provider.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {appointment.provider.specialty}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <Calendar className="w-5 h-5 text-primary" />
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold text-foreground">
                  {formatUTCDate(appointment.slot.start_time)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <Clock className="w-5 h-5 text-primary" />
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold text-foreground">
                  {formatUTCTime(appointment.slot.start_time)} - {formatUTCTime(appointment.slot.end_time)}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-foreground mb-3">
                Patient Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {appointment.patient.first_name} {" "}
                    {appointment.patient.last_name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {appointment.patient.email}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {appointment.patient.phone}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-foreground mb-2">
                Reason for Visit
              </h3>
              <p className="text-sm text-foreground/80">{appointment.reason}</p>
            </div>
          </div>

          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-sm text-foreground">
              📧 A confirmation email has been sent to {" "}
              <span className="font-medium">{appointment.patient.email}</span>
            </p>
          </div>

          <Button
            onClick={() => router.push("/")}
            className="w-full rounded-full font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
          >
            Book Another Appointment
          </Button>
        </Card>
      </div>
    </div>
  );
}
