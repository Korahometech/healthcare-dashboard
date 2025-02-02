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
import { useAppointmentAnalytics, predictOptimalSlots } from "@/hooks/use-appointment-analytics";
import { format } from "date-fns";
import { Clock, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import type { SelectAppointment } from "@db/schema";

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scheduling Optimizer</h3>
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
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-2">Recommended Slots</h4>
          <div className="space-y-2">
            {optimization.suggestedTimeSlots.map((slot, index) => (
              <Button
                key={index}
                variant={slot.probability > 0.8 ? "default" : "outline"}
                className="w-full justify-start"
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
                <span className="text-xs opacity-70">
                  {slot.expectedWaitTime}min wait
                </span>
              </Button>
            ))}

            {optimization.suggestedTimeSlots.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <AlertTriangle className="mx-auto h-6 w-6 mb-2" />
                <p>No optimal slots available for this date.</p>
                <p className="text-sm">Try selecting a different date.</p>
              </div>
            )}
          </div>

          {optimization.alternativeSlots.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 text-muted-foreground">
                Alternative Slots
              </h4>
              <div className="space-y-2">
                {optimization.alternativeSlots.slice(0, 3).map((slot, index) => (
                  <div
                    key={index}
                    className="text-sm flex justify-between items-center text-muted-foreground"
                  >
                    <span>{slot.time}</span>
                    <span className="text-xs">{slot.reason}</span>
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
