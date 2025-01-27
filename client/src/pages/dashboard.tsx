import { StatsCard } from "@/components/ui/stats-card";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { Users, Calendar, CheckCircle, XCircle, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subMonths, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
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
} from "recharts";
import { useState } from "react";
import type { SelectAppointment } from "@db/schema";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

type AppointmentWithPatient = SelectAppointment & {
  patient?: {
    name: string;
  };
};

export default function Dashboard() {
  const { appointments } = useAppointments();
  const { patients } = usePatients();
  const [timeRange, setTimeRange] = useState("all");

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

  // Calculate monthly stats for the past 6 months
  const getMonthlyStats = () => {
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
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

  const exportData = () => {
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
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <Button onClick={exportData} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Patients"
          value={patients.length}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="All registered patients"
        />
        <StatsCard
          title="Total Appointments"
          value={appointments.length}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          description="Appointments to date"
        />
        <StatsCard
          title="Confirmed Appointments"
          value={confirmedAppointments}
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
          description="Successfully completed"
        />
        <StatsCard
          title="Cancelled Appointments"
          value={canceledAppointments}
          icon={<XCircle className="h-4 w-4 text-muted-foreground" />}
          description="Cancelled or missed"
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Appointments Distribution</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appointmentsByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {appointmentsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Monthly Trends</h2>
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="appointments"
                  stroke={COLORS[0]}
                  name="Appointments"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="patients"
                  stroke={COLORS[1]}
                  name="New Patients"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}