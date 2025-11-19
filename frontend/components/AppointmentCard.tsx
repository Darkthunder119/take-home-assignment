"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Clock, User, FileText, Mail, ChevronsUpDown } from "lucide-react";
import { formatUTCDateShort, formatUTCTime } from "@/lib/time";

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
  const [isOpen, setIsOpen] = useState(false);
  const dateStr = formatUTCDateShort(appointment.start_time);
  const timeStr = `${formatUTCTime(appointment.start_time)} - ${formatUTCTime(
    appointment.end_time
  )}`;

  const handleReschedule = () => {
    console.log("Reschedule clicked for appointment:", appointment.id);
  };

  const handleCancel = () => {
    console.log("Cancel clicked for appointment:", appointment.id);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="group transition-all duration-300 ease-in-out hover:shadow-lg">
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer">
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
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    appointment.status === "confirmed" ? "default" : "secondary"
                  }
                >
                  {appointment.status}
                </Badge>
                <ChevronsUpDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
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
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t pt-4">
            <p className="text-sm font-medium mb-2">Actions</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReschedule}
                className="w-full"
              >
                Reschedule
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
