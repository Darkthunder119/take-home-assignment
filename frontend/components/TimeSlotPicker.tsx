import { TimeSlot } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { formatUTCDate, formatUTCDateShort, formatUTCTime, formatUTCDateTimeShort } from "@/lib/time";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  onBook?: () => void;
}

export function TimeSlotPicker({ slots, selectedSlot, onSelectSlot, onBook }: TimeSlotPickerProps) {
  // Only show available slots — hide already-taken slots entirely from the UI
  const availableSlots = slots.filter((s) => s.available);

  // Group slots by date (yyyy-MM-dd)
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    const date = format(parseISO(slot.start_time), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  const dates = Object.keys(slotsByDate).sort();

  // show only one date's times at a time (selectable date strip)
  const [selectedDate, setSelectedDate] = useState<string | null>(dates[0] ?? null);

  // If the incoming slots change, make sure selectedDate is valid
  useEffect(() => {
    if ((!selectedDate || !dates.includes(selectedDate)) && dates.length > 0) {
      setSelectedDate(dates[0]);
    }
    if (dates.length === 0) setSelectedDate(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates.join(",")]);

  const renderDatePill = (dateKey: string) => {
    const start = slotsByDate[dateKey][0].start_time;
    return (
      <div className="flex flex-col items-center">
        <div className="text-xs text-muted-foreground">{formatUTCDateTimeShort(start).split(' ')[0]}</div>
        <div className="text-sm font-semibold">{formatUTCDateShort(start)}</div>
      </div>
    );
  };

  const currentSlots = selectedDate ? slotsByDate[selectedDate] ?? [] : [];

  // brief highlight for the Book button when a slot is selected
  const [buttonPulse, setButtonPulse] = useState(false);

  useEffect(() => {
    if (!selectedSlot) return;
    setButtonPulse(true);
    const t = setTimeout(() => setButtonPulse(false), 300);
    return () => clearTimeout(t);
  }, [selectedSlot?.id]);

  return (
    <div className="space-y-4">
      {/* Date strip */}
      <div className="overflow-x-auto">
        <div className="flex gap-3 py-2 sticky top-0 bg-background/60 backdrop-blur-sm z-20">
          {dates.length === 0 && <div className="text-sm text-muted-foreground">No available dates</div>}
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`min-w-[96px] px-4 py-3 rounded-2xl border transition-colors text-left flex items-center justify-center ${
                selectedDate === d
                  ? 'bg-primary text-white border-primary shadow-md transform translate-y-0'
                  : 'bg-white/50 border-transparent text-foreground'
              }`}
            >
              {renderDatePill(d)}
            </button>
          ))}
        </div>
      </div>

      {/* Times for selected date */}
      <div>
        {currentSlots.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No times available for selected date.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {currentSlots.map((slot) => (
              <Button
                key={slot.id}
                variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                onClick={() => onSelectSlot(slot)}
                className={`h-auto py-3 px-4 flex flex-col items-start justify-center gap-1 rounded-xl transition-all ${
                  selectedSlot?.id === slot.id ? "shadow-lg shadow-primary/30" : "hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    {formatUTCTime(slot.start_time)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Duration: 30m</div>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Yellow summary bar with Book action (sticky + animated) */}
      <div className={`mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-md flex items-center justify-between gap-4 sticky bottom-0 z-10 transition-transform transition-opacity duration-300 ${
        selectedSlot ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        <div>
              {selectedSlot ? (
            <div>
              <div className="text-sm text-foreground font-medium">Selected</div>
              <div className="text-base font-semibold">{formatUTCDate(selectedSlot.start_time)} at {formatUTCTime(selectedSlot.start_time)}</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No time selected</div>
          )}
        </div>

        <div>
          <Button
            onClick={() => onBook && onBook()}
            disabled={!selectedSlot || !selectedSlot.available}
            className={`rounded-full px-6 font-semibold bg-amber-400 text-white hover:bg-amber-500 transition-transform duration-200 ${
              buttonPulse ? 'scale-105 shadow-xl' : ''
            }`}
          >
            Book
          </Button>
        </div>
      </div>
    </div>
  );
}