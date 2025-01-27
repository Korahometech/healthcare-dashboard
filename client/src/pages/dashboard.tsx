import { StatsCard } from "@/components/ui/stats-card";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { Users, Calendar, CheckCircle, XCircle, Download, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subMonths, isWithinInterval, startOfMonth, endOfMonth, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { SelectAppointment } from "@db/schema";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

type AppointmentWithPatient = SelectAppointment & {
  patient?: {
    name: string;
  };
};

export default function Dashboard() {
  const { appointments, isLoading: appointmentsLoading } = useAppointments();
  const { patients, isLoading: patientsLoading } = usePatients();
  const [timeRange, setTimeRange] = useState("6m");
  const { toast } = useToast();

  const isLoading = appointmentsLoading || patientsLoading;

  // Calculate trending percentages
  const previousPeriodAppointments = appointments.filter(a => {
    const date = new Date(a.date);
    return isWithinInterval(date, {
      start: subDays(new Date(), 60),
      end: subDays(new Date(), 30),
    });
  }).length;

  const currentPeriodAppointments = appointments.filter(a => {
    const date = new Date(a.date);
    return isWithinInterval(date, {
      start: subDays(new Date(), 30),
      end: new Date(),
    });
  }).length;

  const appointmentsTrending = {
    value: previousPeriodAppointments === 0 ? 0 :
      Math.round(((currentPeriodAppointments - previousPeriodAppointments) / previousPeriodAppointments) * 100),
    label: "vs last period"
  };

  const confirmedAppointments = appointments.filter(
    (a) => a.status === "confirmed"
  ).length;
  const canceledAppointments = appointments.filter(
    (a) => a.status === "cancelled"
  ).length;

  const appointmentsByStatus = [
    { name: "Scheduled", value: appointments.length - confirmedAppointments - canceledAppointments },
    { name: "Confirmed", value: confirmedAppointments },
    { name: "Cancelled", value: canceledAppointments },
  ];

  // Calculate monthly stats based on timeRange
  const getMonthlyStats = () => {
    const months = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 12;
    const monthlyData = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const month = format(date, "MMM");
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthlyAppointments = appointments.filter(a => {
        const appointmentDate = new Date(a.date);
        return isWithinInterval(appointmentDate, { start, end });
      });

      monthlyData.push({
        name: month,
        appointments: monthlyAppointments.length,
        patients: patients.filter(p => {
          const createdAt = new Date(p.createdAt!);
          return isWithinInterval(createdAt, { start, end });
        }).length,
      });
    }
    return monthlyData;
  };

  const monthlyStats = getMonthlyStats();

  const exportData = async () => {
    try {
      const data = {
        summary: {
          totalPatients: patients.length,
          totalAppointments: appointments.length,
          confirmedAppointments,
          canceledAppointments,
        },
        appointmentsByStatus,
        monthlyStats,
        detailedAppointments: (appointments as AppointmentWithPatient[]).map(a => ({
          id: a.id,
          date: format(new Date(a.date), "PP"),
          status: a.status,
          patientName: a.patient?.name ?? "Unknown",
          notes: a.notes ?? "",
        })),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard-report-${format(new Date(), "yyyy-MM-dd")}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Your dashboard report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your clinical practice performance
          </p>
        </div>
        <Button onClick={exportData} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Patients"
          value={patients.length}
          icon={<Users className="h-4 w-4" />}
          description="Registered patients"
        />
        <StatsCard
          title="Total Appointments"
          value={appointments.length}
          icon={<Calendar className="h-4 w-4" />}
          description="Appointments to date"
          trending={appointmentsTrending}
        />
        <StatsCard
          title="Confirmed Appointments"
          value={confirmedAppointments}
          icon={<CheckCircle className="h-4 w-4" />}
          description="Successfully completed"
        />
        <StatsCard
          title="Cancelled Appointments"
          value={canceledAppointments}
          icon={<XCircle className="h-4 w-4" />}
          description="Cancelled or missed"
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Appointment Status</h2>
            <div className="text-sm text-muted-foreground">
              Current Period
            </div>
          </div>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appointmentsByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {appointmentsByStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="opacity-80 hover:opacity-100 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Growth Trends</h2>
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12m">Last 12 Months</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="appointments"
                  stroke={COLORS[0]}
                  strokeWidth={2}
                  name="Appointments"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="patients"
                  stroke={COLORS[1]}
                  strokeWidth={2}
                  name="New Patients"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}