import { Card } from "@/components/ui/card";
import { Provider } from "@/lib/api";
import { User, Check } from "lucide-react";

interface ProviderCardProps {
  provider: Provider;
  onSelect: (provider: Provider) => void;
  selected?: boolean;
}

export function ProviderCard({ provider, onSelect, selected }: ProviderCardProps) {
  return (
    <Card
      onClick={() => onSelect(provider)}
      role="button"
      aria-pressed={!!selected}
      aria-label={`${provider.name}, ${provider.specialty}`}
      tabIndex={0}
      onKeyDown={(e) => {
        // Support Enter and Space to activate the card. Prevent space from scrolling.
        if (e.key === "Enter") {
          onSelect(provider);
        }
        if (e.key === " " || e.code === "Space") {
          e.preventDefault();
          onSelect(provider);
        }
      }}
      className={`relative p-6 sm:p-8 transition-transform duration-200 ease-out cursor-pointer group border-2 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
        selected
          ? 'scale-105 border-primary bg-primary/5 shadow-[0_14px_40px_rgba(59,130,246,0.12)]'
          : 'hover:scale-102 hover:shadow-[var(--shadow-hover)] hover:border-primary/20'
      }`}>
      {selected && (
        <div className="absolute top-3 right-3 inline-flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-sm shadow transition-opacity duration-200 opacity-100">
          <Check className="w-4 h-4" />
          Selected
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
          selected ? 'scale-105' : ''
        }`}>
          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-purple-500/20">
            <User className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{provider.name}</h3>
            <p className="text-sm sm:text-base text-primary font-medium">{provider.specialty}</p>
          </div>
          {provider.bio && (
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{provider.bio}</p>
          )}
        </div>
      </div>
    </Card>
  );
}