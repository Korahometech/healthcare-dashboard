import { cn } from "@/lib/utils";

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  className?: string;
  formatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  className,
  formatter = (value) => value.toString(),
  labelFormatter = (label) => label,
}: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-3 shadow-lg",
        "animate-in fade-in-0 zoom-in-95 data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
    >
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-foreground/90 animate-in slide-in-from-left-1">
            {labelFormatter(label!)}
          </span>
        </div>
        <div className="grid gap-1">
          {payload.map((entry, index) => (
            <div
              key={`item-${index}`}
              className="flex items-center justify-between gap-8 group"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full transition-all duration-300 group-hover:scale-125"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  {entry.name}
                </span>
              </div>
              <span className="text-sm font-medium animate-in slide-in-from-right-1">
                {formatter(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}