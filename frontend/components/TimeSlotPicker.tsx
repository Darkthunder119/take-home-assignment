import { TimeSlot } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { Calendar, Clock } from "lucide-react";

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
}

export function TimeSlotPicker({ slots, selectedSlot, onSelectSlot }: TimeSlotPickerProps) {
  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    // Use parseISO to correctly interpret the ISO timestamp and format
    // the local date. This fixes the problem with new Date(dateString)
    // which can shift the date because of timezone offsets.
    const date = format(parseISO(slot.start_time), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className="space-y-6">
      {Object.entries(slotsByDate).map(([date, dateSlots]) => (
        <div key={date} className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            {format(parseISO(dateSlots[0].start_time), 'EEEE, MMMM d, yyyy')}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {dateSlots.map((slot) => (
              <Button
                key={slot.id}
                variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                disabled={!slot.available}
                onClick={() => onSelectSlot(slot)}
                className={`h-auto py-3 px-4 flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all ${
                  selectedSlot?.id === slot.id 
                    ? "shadow-lg shadow-primary/30" 
                    : "hover:border-primary/40"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {format(new Date(slot.start_time), 'h:mm a')}
                </span>
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}