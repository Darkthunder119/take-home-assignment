import * as React from "react";
import { Card } from "@/components/ui/card";

interface ClickableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  onClick?: () => void;
  roleLabel?: string;
  pressed?: boolean;
}

export const ClickableCard = React.forwardRef<HTMLDivElement, ClickableCardProps>(
  ({ onClick, roleLabel, pressed, className, children, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!onClick) return;
      if (e.key === "Enter") onClick();
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        onClick();
      }
    };

    return (
      <Card
        ref={ref}
        onClick={onClick}
        role="button"
        aria-pressed={pressed}
        aria-label={roleLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={className}
        {...props}
      >
        {children}
      </Card>
    );
  }
);
ClickableCard.displayName = "ClickableCard";

export default ClickableCard;
