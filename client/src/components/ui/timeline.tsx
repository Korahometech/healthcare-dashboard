import { cn } from "@/lib/utils";
import { Clock, Calendar, TestTubes, Pill, Stethoscope, Activity } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { format } from "date-fns";

export type TimelineEvent = {
  id: number;
  type: "appointment" | "lab_result" | "medication" | "treatment" | "checkup";
  title: string;
  description: string;
  date: Date;
  status?: string;
  metadata?: Record<string, any>;
};

const eventTypeIcons = {
  appointment: Calendar,
  lab_result: TestTubes,
  medication: Pill,
  treatment: Stethoscope,
  checkup: Activity,
};

const eventTypeColors = {
  appointment: "bg-blue-500",
  lab_result: "bg-purple-500",
  medication: "bg-green-500",
  treatment: "bg-orange-500",
  checkup: "bg-cyan-500",
};

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  const sortedEvents = [...events].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className={cn("space-y-8", className)}>
      {sortedEvents.map((event, index) => {
        const Icon = eventTypeIcons[event.type];
        const color = eventTypeColors[event.type];

        return (
          <div key={event.id} className="relative pl-8">
            {index !== sortedEvents.length - 1 && (
              <div
                className="absolute left-[11px] top-[24px] h-full w-[2px] bg-border"
                aria-hidden="true"
              />
            )}
            <div className="flex items-start space-x-3">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div 
                    className={cn(
                      "relative flex h-6 w-6 items-center justify-center rounded-full",
                      color
                    )}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.description}
                    </p>
                    {event.metadata && (
                      <dl className="text-sm">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <dt className="text-muted-foreground capitalize">
                              {key.replace(/_/g, " ")}:
                            </dt>
                            <dd className="font-medium">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold leading-none">
                    {event.title}
                  </p>
                  {event.status && (
                    <span className={cn(
                      "rounded-full px-2 py-1 text-xs",
                      event.status === "completed" && "bg-green-100 text-green-700",
                      event.status === "scheduled" && "bg-blue-100 text-blue-700",
                      event.status === "cancelled" && "bg-red-100 text-red-700"
                    )}>
                      {event.status}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  <Clock className="mr-1 inline-block h-3 w-3" />
                  {format(event.date, "PPp")}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}