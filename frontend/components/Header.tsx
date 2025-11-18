import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Stethoscope,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Decoda Appointments
              </h1>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/" className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Book Appointment</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link
                href="/doctor/provider-1"
                className="flex items-center gap-2"
              >
                <Stethoscope className="w-4 h-4" />
                <span className="hidden sm:inline">Doctor Schedule</span>
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
