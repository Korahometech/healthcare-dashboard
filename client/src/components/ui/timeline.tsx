import { cn } from "@/lib/utils";
import { Clock, Calendar, TestTubes, Pill, Stethoscope, Activity, User, AlertCircle } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export type TimelineEvent = {
  id: number;
  type: "appointment" | "lab_result" | "medication" | "treatment" | "checkup" | "note" | "alert";
  title: string;
  description: string;
  date: Date;
  status?: string;
  severity?: "low" | "medium" | "high";
  metadata?: Record<string, any>;
  providers?: Array<{ name: string; role: string }>;
};

const eventTypeIcons = {
  appointment: Calendar,
  lab_result: TestTubes,
  medication: Pill,
  treatment: Stethoscope,
  checkup: Activity,
  note: User,
  alert: AlertCircle,
};

const eventTypeColors = {
  appointment: "bg-blue-500 hover:bg-blue-600",
  lab_result: "bg-purple-500 hover:bg-purple-600",
  medication: "bg-green-500 hover:bg-green-600",
  treatment: "bg-orange-500 hover:bg-orange-600",
  checkup: "bg-cyan-500 hover:bg-cyan-600",
  note: "bg-gray-500 hover:bg-gray-600",
  alert: "bg-red-500 hover:bg-red-600",
};

const severityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
  onEventClick?: (event: TimelineEvent) => void;
}

export function Timeline({ events, className, onEventClick }: TimelineProps) {
  const sortedEvents = [...events].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className={cn("space-y-8", className)}>
        {sortedEvents.map((event, index) => {
          const Icon = eventTypeIcons[event.type];
          const color = eventTypeColors[event.type];

          return (
            <div key={event.id} className="relative pl-8 group">
              {index !== sortedEvents.length - 1 && (
                <div
                  className="absolute left-[11px] top-[24px] h-full w-[2px] bg-border group-hover:bg-primary/20 transition-colors"
                  aria-hidden="true"
                />
              )}
              <div className="flex items-start space-x-3">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button 
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "relative flex h-6 w-6 items-center justify-center rounded-full p-0",
                        color,
                        "transition-all duration-200 ease-in-out transform group-hover:scale-110"
                      )}
                      onClick={() => onEventClick?.(event)}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{event.title}</p>
                        {event.severity && (
                          <Badge variant="outline" className={cn(severityColors[event.severity])}>
                            {event.severity.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                      {event.providers && event.providers.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs font-medium mb-1">Healthcare Providers:</p>
                          {event.providers.map((provider, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{provider.name}</span>
                              <span className="font-medium">{provider.role}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {event.metadata && (
                        <dl className="grid grid-cols-2 gap-1 pt-2 border-t text-sm">
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <dt className="text-xs text-muted-foreground capitalize">
                                {key.replace(/_/g, " ")}:
                              </dt>
                              <dd className="font-medium text-xs">{value}</dd>
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
                      <Badge variant="outline" className={cn(
                        event.status === "completed" && "border-green-200 bg-green-100 text-green-800",
                        event.status === "scheduled" && "border-blue-200 bg-blue-100 text-blue-800",
                        event.status === "cancelled" && "border-red-200 bg-red-100 text-red-800",
                        "text-xs"
                      )}>
                        {event.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Clock className="mr-1 inline-block h-3 w-3" />
                    {format(event.date, "PPp")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}