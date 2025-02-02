import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppointmentAnalytics } from "@/hooks/use-appointment-analytics";
import { Clock, Users } from "lucide-react";
import { format } from "date-fns";

interface AppointmentAnalyticsProps {
  doctorId: number;
  scheduledTime: Date;
}

export function AppointmentAnalytics({ doctorId, scheduledTime }: AppointmentAnalyticsProps) {
  const { getPredictedWaitTime } = useAppointmentAnalytics();
  const { data: waitTimeData, isLoading } = getPredictedWaitTime(doctorId, scheduledTime);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Predicted Wait Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          ) : (
            <>
              <div className="text-2xl font-bold">
                {waitTimeData?.predictedWaitTime} minutes
              </div>
              <p className="text-xs text-muted-foreground">
                Based on historical data for {format(scheduledTime, "EEEE")}s
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
