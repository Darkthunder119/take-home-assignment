"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from "date-fns";
import { formatUTCTime } from "@/lib/time";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

export function DoctorCalendar({ providerId, appointments }: DoctorCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [openAppointment, setOpenAppointment] = useState<Appointment | null>(null);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const a of appointments) {
      const day = format(parseISO(a.start_time), "yyyy-MM-dd");
      if (!map[day]) map[day] = [];
      map[day].push(a);
    }
    Object.values(map).forEach((arr) => arr.sort((x, y) => (x.start_time > y.start_time ? 1 : -1)));
    return map;
  }, [appointments]);

  function getMonthGrid(date: Date) {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
    const days: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
    return days;
  }

  function getWeekGrid(date: Date) {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }

  const days = viewMode === "month" ? getMonthGrid(currentDate) : getWeekGrid(currentDate);
  const isCurrentMonth = (d: Date) => isSameMonth(d, currentDate);

  function goToday() {
    setCurrentDate(new Date());
  }
  function goPrev() {
    setCurrentDate((prev) => (viewMode === "month" ? subMonths(prev, 1) : subWeeks(prev, 1)));
  }
  function goNext() {
    setCurrentDate((prev) => (viewMode === "month" ? addMonths(prev, 1) : addWeeks(prev, 1)));
  }

  const tagColors = [
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-yellow-100 text-yellow-800",
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Calendar</h2>
          <div className="text-sm text-muted-foreground hidden md:block">
            {format(currentDate, viewMode === "month" ? "MMMM yyyy" : "'Week of' MMM d, yyyy")}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* view toggles hidden on small screens */}
          <button
            onClick={() => setViewMode("month")}
            className={`hidden md:inline-flex px-3 py-1 rounded ${viewMode === "month" ? "bg-primary text-white" : "bg-white border"}`}>
            Month view
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`hidden md:inline-flex px-3 py-1 rounded ${viewMode === "week" ? "bg-primary text-white" : "bg-white border"}`}>
            Week view
          </button>
          {/* navigation - keep for mobile and desktop */}
          <div className="flex items-center gap-2">
            <button onClick={goPrev} className="px-2 py-1 rounded border" aria-label="Previous">
              ‹
            </button>
            <button onClick={goToday} className="px-2 py-1 rounded border" aria-label="Today">
              Today
            </button>
            <button onClick={goNext} className="px-2 py-1 rounded border" aria-label="Next">
              ›
            </button>
          </div>
        </div>
      </div>

      {/* day names */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-t-md overflow-hidden">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="bg-white text-xs text-center py-2 font-semibold text-gray-600">
            {d}
          </div>
        ))}
      </div>

      {/* days grid */}
      {/* Desktop / large screens: grid */}
      <div className="hidden md:grid grid-cols-7 gap-px bg-gray-200">
        {days.map((date) => {
          const key = format(date, "yyyy-MM-dd");
          const dayAppts = appointmentsByDate[key] || [];
          return (
            <div
              key={key}
              className={`bg-white min-h-[100px] p-2 text-sm ${isCurrentMonth(date) ? "" : "bg-gray-50 text-gray-400"} ${isToday(date) ? "ring-2 ring-primary/40 bg-primary/5" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold">{date.getDate()}</div>
                {dayAppts.length > 0 && <Badge variant="secondary">{dayAppts.length}</Badge>}
              </div>

              <div className="flex flex-col gap-1">
                {dayAppts.slice(0, 3).map((apt, i) => (
                  <button
                    key={apt.id}
                    onClick={() => setOpenAppointment(apt)}
                    className={`text-left w-full truncate rounded px-1 py-0.5 text-xs ${tagColors[i % tagColors.length]} hover:brightness-95 focus:outline-none`}
                    title={`${apt.patient_name}: ${apt.reason}`}>
                    {`${formatUTCTime(apt.start_time)} ${apt.patient_name}`}
                  </button>
                ))}
                {dayAppts.length > 3 && (
                  <div className="text-xs text-muted-foreground">+{dayAppts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: stacked vertical day list (simpler for touch) */}
      <div className="md:hidden mt-4 space-y-3">
        {getWeekGrid(currentDate).map((date) => {
          const key = format(date, "yyyy-MM-dd");
          const dayAppts = appointmentsByDate[key] || [];
          return (
            <div
              key={key}
              className={`w-full p-3 rounded-lg border ${isToday(date) ? "ring-2 ring-primary/40 bg-primary/5" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold">{format(date, "EEE, MMM d")}</div>
                </div>
                {dayAppts.length > 0 && <Badge variant="secondary">{dayAppts.length}</Badge>}
              </div>

              <div className="flex flex-col gap-2">
                {dayAppts.length === 0 && <div className="text-sm text-muted-foreground">No appointments</div>}
                {dayAppts.map((apt, i) => (
                  <button
                    key={apt.id}
                    onClick={() => setOpenAppointment(apt)}
                    aria-label={`Open appointment for ${apt.patient_name} at ${formatUTCTime(apt.start_time)}`}
                    className={`text-left w-full truncate rounded px-3 py-3 text-sm ${tagColors[i % tagColors.length]} hover:brightness-95 focus:outline-none`}
                    title={`${apt.patient_name}: ${apt.reason}`}>
                    <div className="flex justify-between">
                      <div className="font-medium">{apt.patient_name}</div>
                      <div className="text-xs">{formatUTCTime(apt.start_time)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{apt.reason}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Appointment details dialog */}
      <Dialog open={!!openAppointment} onOpenChange={(open) => { if (!open) setOpenAppointment(null); }}>
        {openAppointment && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
              <DialogDescription>
                {formatUTCTime(openAppointment.start_time)} - {formatUTCTime(openAppointment.end_time)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Patient</div>
                <div className="font-medium">{openAppointment.patient_name}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Reason</div>
                <div className="font-medium">{openAppointment.reason}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-medium">{openAppointment.status || "confirmed"}</div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={() => setOpenAppointment(null)}>Close</Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}
