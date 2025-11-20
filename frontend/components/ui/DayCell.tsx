"use client";

import React from "react";
import { format } from "date-fns";
import { formatUTCTime } from "@/lib/time";
import { Badge } from "@/components/ui/badge";
import { TAG_COLORS } from "@/lib/constants";

interface AppointmentShort {
  id: string;
  start_time: string;
  end_time: string;
  patient_name: string;
  reason: string;
  status?: string;
}

interface DayCellProps {
  date: Date;
  idx?: number;
  dayAppts: AppointmentShort[];
  isCurrentMonth: boolean;
  isToday: boolean;
  variant: "desktop" | "mobile";
  onOpenAppointment: (a: AppointmentShort) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  tagColors?: string[];
}

export default function DayCell({
  date,
  idx,
  dayAppts,
  isCurrentMonth,
  isToday,
  variant,
  onOpenAppointment,
  onKeyDown,
  tagColors = TAG_COLORS,
}: DayCellProps) {
  const key = format(date, "yyyy-MM-dd");

  if (variant === "desktop") {
    return (
      <div
        key={key}
        data-day-index={idx}
        tabIndex={0}
        role="gridcell"
        onKeyDown={onKeyDown}
        className={`bg-white min-h-[100px] p-2 text-sm ${isCurrentMonth ? "" : "bg-gray-50 text-gray-400"} ${isToday ? "ring-2 ring-primary/40 bg-primary/5" : ""}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold">{date.getDate()}</div>
          {dayAppts.length > 0 && (
            <Badge variant="secondary" aria-label={`${dayAppts.length} appointments`}>
              {dayAppts.length}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {dayAppts.slice(0, 3).map((apt, i) => (
            <button
              key={apt.id}
              onClick={() => onOpenAppointment(apt)}
              className={`text-left w-full truncate rounded px-2 py-1 text-sm min-h-[44px] ${tagColors[i % tagColors.length]} hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
              title={`${apt.patient_name}: ${apt.reason}`}
              aria-label={`Appointment for ${apt.patient_name} at ${formatUTCTime(apt.start_time)}: ${apt.reason}`}>
              {`${formatUTCTime(apt.start_time)} ${apt.patient_name}`}
            </button>
          ))}
          {dayAppts.length > 3 && <div className="text-xs text-muted-foreground">+{dayAppts.length - 3} more</div>}
        </div>
      </div>
    );
  }

  // mobile variant
  return (
    <div key={key} className={`w-full p-3 rounded-lg border ${isToday ? "ring-2 ring-primary/40 bg-primary/5" : "bg-white"}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-semibold">{format(date, "EEE, MMM d")}</div>
        </div>
        {dayAppts.length > 0 && <div className="text-xs text-muted-foreground">{dayAppts.length}</div>}
      </div>

      <div className="flex flex-col gap-2">
        {dayAppts.length === 0 && <div className="text-sm text-muted-foreground">No appointments</div>}
        {dayAppts.map((apt, i) => (
          <button
            key={apt.id}
            onClick={() => onOpenAppointment(apt)}
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
}
