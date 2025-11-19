import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, FileText, Mail } from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatUTCDateShort, formatUTCTime } from "@/lib/time";

// TODO: Style and enhance appointment card
// Requirements:
// 1. ✅ Show patient info
// 2. ✅ Show time
// 3. ✅ Show reason for visit
// 4. ✅ Add status badge (confirmed/cancelled)
// 5. TODO: Make it more responsive - add better mobile layout

interface AppointmentCardProps {
  appointment: {
    id: string;
    patient_name: string;
    patient_email?: string;
    start_time: string;
    end_time: string;
    reason: string;
    status: string;
  };
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const startTime = parseISO(appointment.start_time);
  const endTime = parseISO(appointment.end_time);
  const dateStr = formatUTCDateShort(appointment.start_time);
  const timeStr = `${formatUTCTime(appointment.start_time)} - ${formatUTCTime(appointment.end_time)}`;

  // TODO: Add hover effects with more information
  // TODO: Add click to expand for more details
  // TODO: Add action buttons (reschedule, cancel)

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{appointment.patient_name}</p>
            {appointment.patient_email && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {appointment.patient_email}
              </p>
            )}
          </div>
        </div>
        <Badge
          variant={appointment.status === "confirmed" ? "default" : "secondary"}
        >
          {appointment.status}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Clock className="w-4 h-4" />
        <span>
          {dateStr} • {timeStr}
        </span>
      </div>

      <div className="flex items-start gap-2 text-sm">
        <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-muted-foreground">{appointment.reason}</p>
      </div>
    </Card>
  );
}
