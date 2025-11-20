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
import { TAG_COLORS } from "@/lib/constants";
import DayCell from "@/components/ui/DayCell";
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

  // Keyboard navigation for day cells and paging
  function handleDayKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    const key = e.key;
    const target = e.currentTarget as HTMLElement;
    const idx = Number(target.dataset.dayIndex);
    if (Number.isNaN(idx)) return;

    // Arrow navigation across the linear days array
    if (key === "ArrowRight") {
      const next = document.querySelector<HTMLElement>(`[data-day-index=\"${idx + 1}\"]`);
      next?.focus();
      e.preventDefault();
      return;
    }
    if (key === "ArrowLeft") {
      const prev = document.querySelector<HTMLElement>(`[data-day-index=\"${idx - 1}\"]`);
      prev?.focus();
      e.preventDefault();
      return;
    }
    if (key === "Home") {
      const first = document.querySelector<HTMLElement>(`[data-day-index=\"0\"]`);
      first?.focus();
      e.preventDefault();
      return;
    }
    if (key === "End") {
      const last = document.querySelectorAll<HTMLElement>("[data-day-index]");
      const lastEl = last[last.length - 1];
      lastEl?.focus();
      e.preventDefault();
      return;
    }
    if (key === "Enter") {
      // If this day has appointment buttons, activate the first one
      const firstBtn = target.querySelector<HTMLButtonElement>("button");
      firstBtn?.click();
      e.preventDefault();
      return;
    }
    if (key === "PageUp") {
      // Step backwards depending on viewMode
      if (viewMode === "month") setCurrentDate((prev) => subMonths(prev, 1));
      else if (viewMode === "week") setCurrentDate((prev) => subWeeks(prev, 1));
      else setCurrentDate((prev) => subDays(prev, 1));
      e.preventDefault();
      return;
    }
    if (key === "PageDown") {
      if (viewMode === "month") setCurrentDate((prev) => addMonths(prev, 1));
      else if (viewMode === "week") setCurrentDate((prev) => addWeeks(prev, 1));
      else setCurrentDate((prev) => addDays(prev, 1));
      e.preventDefault();
      return;
    }
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

  const tagColors = TAG_COLORS;

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center mb-4">
        {/* Left: title (centered) */}
        <div className="md:col-span-1 flex justify-center md:justify-center">
          <div className="text-center md:text-center">
            <h2 className="text-xl font-semibold">Calendar</h2>
            <div className="text-sm text-muted-foreground hidden md:block">{format(currentDate, viewMode === "month" ? "MMMM yyyy" : "'Week of' MMM d, yyyy")}</div>
          </div>
        </div>

        {/* Center: navigation controls (centered) */}
        <div className="md:col-span-1 flex justify-center">
          <div className="flex items-center gap-2">
            <button onClick={goPrev} className="px-2 py-1 rounded border min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Previous" title={prevTitle}>
              ‹
            </button>
            <button onClick={goToday} className="px-3 py-1 rounded border min-h-[44px] min-w-[64px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Today" title={todayTitle}>
              Today
            </button>
            <button onClick={goNext} className="px-2 py-1 rounded border min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Next" title={nextTitle}>
              ›
            </button>
          </div>
        </div>

        {/* Right: view toggles (centered) */}
        <div className="md:col-span-1 flex justify-center items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 rounded ${viewMode === "month" ? "bg-primary text-white" : "bg-white border"}`}>
              Month
            </button>
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

          {/* Mobile small: compact week/day toggles */}
          <div className="md:hidden flex items-center gap-2">
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
          <div className="hidden md:grid grid-cols-7 gap-px bg-gray-200" role="grid" aria-label="Calendar days">
            {days.map((date, idx) => {
              const key = format(date, "yyyy-MM-dd");
              const dayAppts = appointmentsByDate[key] || [];
              return (
                <DayCell
                  key={key}
                  date={date}
                  idx={idx}
                  dayAppts={dayAppts}
                  isCurrentMonth={isCurrentMonth(date)}
                  isToday={isToday(date)}
                  variant="desktop"
                  onOpenAppointment={(apt) => setOpenAppointment(apt)}
                  onKeyDown={handleDayKeyDown}
                  tagColors={tagColors}
                />
              );
            })}
          </div>

          {/* Mobile: stacked vertical day list (simpler for touch) */}
          <div className="md:hidden mt-4 space-y-3">
            {getWeekGrid(currentDate).map((date) => {
              const key = format(date, "yyyy-MM-dd");
              const dayAppts = appointmentsByDate[key] || [];
              return (
                <DayCell
                  key={key}
                  date={date}
                  dayAppts={dayAppts}
                  isCurrentMonth={isCurrentMonth(date)}
                  isToday={isToday(date)}
                  variant="mobile"
                  onOpenAppointment={(apt: Appointment) => setOpenAppointment(apt)}
                  tagColors={tagColors}
                />
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
