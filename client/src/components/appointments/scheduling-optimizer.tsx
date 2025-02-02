import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppointmentAnalytics, predictOptimalSlots } from "@/hooks/use-appointment-analytics";
import { format } from "date-fns";
import { Clock, Calendar as CalendarIcon, AlertTriangle, Thermometer, Info } from "lucide-react";
import type { SelectAppointment } from "@db/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface SchedulingOptimizerProps {
  appointments: SelectAppointment[];
  onSelectSlot: (date: Date) => void;
}

export function SchedulingOptimizer({
  appointments,
  onSelectSlot,
}: SchedulingOptimizerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [duration, setDuration] = useState(30);

  const { data: analytics, isLoading } = useAppointmentAnalytics(selectedDate);

  const optimization = analytics 
    ? analytics.optimizedSchedule 
    : predictOptimalSlots(appointments, selectedDate, duration);

  const timeGroups = {
    morning: optimization.suggestedTimeSlots.filter(slot => {
      const hour = parseInt(slot.startTime.split(':')[0]);
      return hour >= 9 && hour < 12;
    }),
    afternoon: optimization.suggestedTimeSlots.filter(slot => {
      const hour = parseInt(slot.startTime.split(':')[0]);
      return hour >= 12 && hour < 17;
    }),
    evening: optimization.suggestedTimeSlots.filter(slot => {
      const hour = parseInt(slot.startTime.split(':')[0]);
      return hour >= 17;
    })
  };

  const renderHeatMap = () => {
    const hours = Array.from({ length: 9 }, (_, i) => i + 9); // 9 AM to 5 PM
    return (
      <div className="grid grid-cols-9 gap-1 mt-4">
        {hours.map(hour => {
          const slots = optimization.suggestedTimeSlots.filter(
            slot => parseInt(slot.startTime.split(':')[0]) === hour
          );
          const avgScore = slots.reduce((acc, slot) => acc + slot.probability, 0) / (slots.length || 1);

          return (
            <TooltipProvider key={hour}>
              <Tooltip>
                <TooltipTrigger>
                  <div 
                    className={`h-2 rounded-full ${
                      avgScore > 0.7 ? "bg-primary" :
                      avgScore > 0.4 ? "bg-primary/60" :
                      "bg-primary/20"
                    }`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{`${hour}:00 - ${hour+1}:00`}</p>
                  <p className="text-xs text-muted-foreground">
                    {avgScore > 0.7 ? "Optimal" :
                     avgScore > 0.4 ? "Moderate" :
                     "Busy"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Scheduling Optimizer</h3>
          <p className="text-sm text-muted-foreground">
            Find the optimal time slots based on historical data and current schedule
          </p>
        </div>
        <Select
          value={duration.toString()}
          onValueChange={(value) => setDuration(parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 minutes</SelectItem>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="45">45 minutes</SelectItem>
            <SelectItem value="60">1 hour</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            disabled={(date) => date < new Date()}
            className="rounded-md border"
          />
          {renderHeatMap()}
          {optimization.confidenceScore > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Schedule Quality Score</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Based on historical patterns and current schedule</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-background rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${optimization.confidenceScore * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {Math.round(optimization.confidenceScore * 100)}%
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-4">Recommended Slots</h4>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(timeGroups).map(([period, slots]) => slots.length > 0 && (
                <div key={period} className="space-y-2">
                  <h5 className="text-sm font-medium capitalize flex items-center gap-2">
                    {period}
                    {slots.some(slot => slot.probability > 0.8) && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </h5>
                  {slots.map((slot, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={slot.probability > 0.8 ? "default" : "outline"}
                            className={`w-full justify-start ${
                              slot.probability > 0.8 ? "bg-primary" : 
                              slot.probability > 0.6 ? "bg-primary/20" : ""
                            }`}
                            onClick={() => {
                              const [hours, minutes] = slot.startTime.split(':').map(Number);
                              const date = new Date(selectedDate);
                              date.setHours(hours, minutes);
                              onSelectSlot(date);
                            }}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            <span className="flex-1">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <span className="text-xs opacity-70 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {slot.expectedWaitTime}min
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{slot.suggestion}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Expected wait time: {slot.expectedWaitTime} minutes
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              ))}

              {optimization.suggestedTimeSlots.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertTriangle className="mx-auto h-6 w-6 mb-2" />
                  <p>No optimal slots available for this date.</p>
                  <p className="text-sm">Try selecting a different date.</p>
                </div>
              )}
            </div>
          )}

          {optimization.alternativeSlots.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 text-muted-foreground flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                Alternative Slots
              </h4>
              <div className="space-y-2">
                {optimization.alternativeSlots.slice(0, 3).map((slot, index) => (
                  <div
                    key={index}
                    className="text-sm flex justify-between items-center p-2 rounded-md bg-muted"
                  >
                    <span>{slot.time}</span>
                    <span className="text-xs text-muted-foreground">{slot.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}