"use client";

import { useState, useMemo, useEffect } from "react";
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
  subDays,
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
  isLoading?: boolean;
  error?: unknown;
}

export function DoctorCalendar({ providerId, appointments, isLoading, error }: DoctorCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
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

  const days = viewMode === "month" ? getMonthGrid(currentDate) : viewMode === "week" ? getWeekGrid(currentDate) : [currentDate];
  const isCurrentMonth = (d: Date) => isSameMonth(d, currentDate);

  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function goToday() {
    setCurrentDate(new Date());
  }
  function goPrev() {
    // on mobile prefer week navigation regardless of viewMode
    if (isMobile) {
      if (viewMode === "day") {
        setCurrentDate((prev) => subDays(prev, 1));
        return;
      }
      setCurrentDate((prev) => subWeeks(prev, 1));
      return;
    }
    // desktop: step depends on viewMode
    if (viewMode === "month") setCurrentDate((prev) => subMonths(prev, 1));
    else if (viewMode === "week") setCurrentDate((prev) => subWeeks(prev, 1));
    else setCurrentDate((prev) => subDays(prev, 1));
  }
  function goNext() {
    if (isMobile) {
      if (viewMode === "day") {
        setCurrentDate((prev) => addDays(prev, 1));
        return;
      }
      setCurrentDate((prev) => addWeeks(prev, 1));
      return;
    }
    if (viewMode === "month") setCurrentDate((prev) => addMonths(prev, 1));
    else if (viewMode === "week") setCurrentDate((prev) => addWeeks(prev, 1));
    else setCurrentDate((prev) => addDays(prev, 1));
  }

  const prevTitle = isMobile
    ? "Previous week"
    : viewMode === "month"
    ? "Previous month"
    : viewMode === "week"
    ? "Previous week"
    : "Previous day";
  const nextTitle = isMobile
    ? "Next week"
    : viewMode === "month"
    ? "Next month"
    : viewMode === "week"
    ? "Next week"
    : "Next day";
  const todayTitle = "Go to today";

  const tagColors = [
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-yellow-100 text-yellow-800",
  ];

  // Loading state: show skeleton placeholders
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4" />

          <div className="hidden md:grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded" />
            ))}
          </div>

          <div className="md:hidden space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Error state: show message
  if (error) {
    return (
      <Card className="p-6 border-destructive">
        <p className="text-destructive">Error loading calendar. Please try again.</p>
      </Card>
    );
  }

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
          <button
            onClick={() => setViewMode("day")}
            className={`hidden md:inline-flex px-3 py-1 rounded ${viewMode === "day" ? "bg-primary text-white" : "bg-white border"}`}>
            Day view
          </button>
          {/* navigation - keep for mobile and desktop */}
          <div className="flex items-center gap-2">
            <button onClick={goPrev} className="px-2 py-1 rounded border" aria-label="Previous" title={prevTitle}>
              ‹
            </button>
            <button onClick={goToday} className="px-2 py-1 rounded border" aria-label="Today" title={todayTitle}>
              Today
            </button>
            <button onClick={goNext} className="px-2 py-1 rounded border" aria-label="Next" title={nextTitle}>
              ›
            </button>
          </div>
          {/* Mobile view toggle for Week / Day */}
          <div className="flex md:hidden items-center gap-2 ml-2">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded ${viewMode === "week" ? "bg-primary text-white" : "bg-white border"}`}>
              Week
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1 rounded ${viewMode === "day" ? "bg-primary text-white" : "bg-white border"}`}>
              Day
            </button>
          </div>
        </div>
      </div>

      {viewMode === "day" ? (
        // Day view: single day schedule
        <div className="mt-4">
          <div className="mb-4 text-lg font-semibold">{format(currentDate, "EEEE, MMM d")}</div>
          <div>
            {(() => {
              const key = format(currentDate, "yyyy-MM-dd");
              const dayAppts = appointmentsByDate[key] || [];
              if (dayAppts.length === 0) {
                return <div className="p-6 bg-white rounded">No appointments for this day</div>;
              }
              return (
                <div className="space-y-3">
                  {dayAppts.map((apt, i) => (
                    <button
                      key={apt.id}
                      onClick={() => setOpenAppointment(apt)}
                      className={`w-full text-left p-3 rounded shadow-sm border border-transparent ${tagColors[i % tagColors.length]} hover:brightness-95 focus:outline-none`}
                      title={`${apt.patient_name}: ${apt.reason}`}>
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{apt.patient_name}</div>
                        <div className="text-xs">{formatUTCTime(apt.start_time)} - {formatUTCTime(apt.end_time)}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">{apt.reason}</div>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <>
          {/* day names (desktop only) */}
          <div className="hidden md:grid grid-cols-7 gap-px bg-gray-200 rounded-t-md overflow-hidden">
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
        </>
      )}

      {/* Appointment details dialog */}
      <Dialog open={!!openAppointment} onOpenChange={(open) => { if (!open) setOpenAppointment(null); }}>
        {openAppointment && (
          <DialogContent className="rounded-lg shadow-lg">
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
