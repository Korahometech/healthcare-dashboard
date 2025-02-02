import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppointmentAnalytics } from "@/hooks/use-appointment-analytics";
import { Clock, Users, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AppointmentAnalyticsProps {
  doctorId: number;
  scheduledTime: Date;
  className?: string;
}

export function AppointmentAnalytics({ doctorId, scheduledTime, className }: AppointmentAnalyticsProps) {
  const { getPredictedWaitTime } = useAppointmentAnalytics();
  const { data: waitTimeData, isLoading } = getPredictedWaitTime(doctorId, scheduledTime);

  return (
    <div className={cn("grid gap-6 md:grid-cols-2", className)}>
      <Card className="overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardTitle className="text-lg font-semibold">Predicted Wait Time</CardTitle>
          <Clock className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-48 bg-muted/50 rounded animate-pulse" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold tracking-tight text-primary">
                  {waitTimeData?.predictedWaitTime}
                </div>
                <div className="text-lg text-muted-foreground">minutes</div>
              </div>
              <p className="text-sm text-muted-foreground">
                Based on historical data for {format(scheduledTime, "EEEE")}s
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardTitle className="text-lg font-semibold">Patient Flow</CardTitle>
          <TrendingUp className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Load</span>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-in-out"
                  style={{ 
                    width: `${Math.min(100, (waitTimeData?.predictedWaitTime || 0) / 30 * 100)}%`,
                  }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {waitTimeData?.predictedWaitTime && waitTimeData.predictedWaitTime > 20 
                ? "High patient volume expected"
                : "Normal patient volume expected"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}