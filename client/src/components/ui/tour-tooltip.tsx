import { useRef, useEffect, useState } from "react";
import { useFloating, offset, flip, shift, arrow } from "@floating-ui/react-dom";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface TourTooltipProps {
  title: string;
  description: string;
  targetElement: string;
  placement?: "top" | "bottom" | "left" | "right";
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
  className?: string;
}

export function TourTooltip({
  title,
  description,
  targetElement,
  placement = "bottom",
  onNext,
  onPrevious,
  onSkip,
  isFirst,
  isLast,
  className,
}: TourTooltipProps) {
  const [mounted, setMounted] = useState(false);
  const arrowRef = useRef(null);
  const { x, y, reference, floating, strategy, middlewareData } = useFloating({
    placement,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
  });

  useEffect(() => {
    const element = document.querySelector(targetElement);
    if (element) {
      reference(element);
      setMounted(true);
    }
  }, [targetElement, reference]);

  if (!mounted) return null;

  return (
    <div
      ref={floating}
      style={{
        position: strategy,
        top: y ?? 0,
        left: x ?? 0,
        width: "max-content",
        maxWidth: "320px",
      }}
      className={cn(
        "z-50 rounded-lg border bg-background p-4 text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className
      )}
    >
      <div className="space-y-2">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button size="sm" variant="outline" onClick={onPrevious}>
              Previous
            </Button>
          )}
          <Button size="sm" onClick={onNext}>
            {isLast ? "Finish" : "Next"}
          </Button>
        </div>
        <Button size="sm" variant="ghost" onClick={onSkip}>
          Skip
        </Button>
      </div>
      <div
        ref={arrowRef}
        className="absolute h-2 w-2 rotate-45 bg-border"
        style={{
          left: middlewareData.arrow?.x,
          top: middlewareData.arrow?.y,
        }}
      />
    </div>
  );
}
