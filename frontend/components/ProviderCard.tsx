import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Provider } from "@/lib/api";
import { User } from "lucide-react";

interface ProviderCardProps {
  provider: Provider;
  onSelect: (provider: Provider) => void;
}

export function ProviderCard({ provider, onSelect }: ProviderCardProps) {
  return (
    <Card className="p-6 sm:p-8 hover:shadow-[var(--shadow-hover)] hover:border-primary/20 transition-[var(--transition-smooth)] cursor-pointer group border-2">
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-purple-500/20 transition-[var(--transition-smooth)] flex-shrink-0">
          <User className="w-10 h-10 text-primary" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{provider.name}</h3>
            <p className="text-sm sm:text-base text-primary font-medium">{provider.specialty}</p>
          </div>
          {provider.bio && (
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{provider.bio}</p>
          )}
          <Button 
            onClick={() => onSelect(provider)}
            className="w-full sm:w-auto rounded-full px-8 font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
          >
            Book Appointment
          </Button>
        </div>
      </div>
    </Card>
  );
}