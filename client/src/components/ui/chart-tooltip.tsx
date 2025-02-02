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
        "rounded-lg border bg-background p-3 shadow-lg animate-in fade-in-0 zoom-in-95",
        className
      )}
    >
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">{labelFormatter(label!)}</span>
        </div>
        <div className="grid gap-1">
          {payload.map((entry, index) => (
            <div
              key={`item-${index}`}
              className="flex items-center justify-between gap-8"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {entry.name}
                </span>
              </div>
              <span className="text-sm font-medium">
                {formatter(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
