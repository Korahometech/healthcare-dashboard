import { StatsCard } from "@/components/ui/stats-card";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { Users, Calendar, CheckCircle, XCircle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout, DashboardPanel } from "@/components/ui/dashboard-layout";
import { CardSkeleton, StatsCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subMonths, isWithinInterval, startOfMonth, endOfMonth, subDays } from "date-fns";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { DashboardPDFReport } from "@/components/dashboard/pdf-report";
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
import { QuickActions, dashboardActions } from "@/components/ui/quick-actions";

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))'
];

type AppointmentWithPatient = SelectAppointment & {
  patient?: {
    name: string;
  };
};

function Dashboard() {
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

  const reportData = {
    summary: {
      totalPatients: patients.length,
      totalAppointments: appointments.length,
      confirmedAppointments,
      canceledAppointments,
    },
    appointmentsByStatus,
    monthlyStats,
    appointments: (appointments as AppointmentWithPatient[]).map(a => ({
      id: a.id,
      date: format(new Date(a.date), "PP"),
      status: a.status,
      patientName: a.patient?.name ?? "Unknown",
      notes: a.notes ?? "",
    })),
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>
          <Button variant="outline" size="lg" className="gap-2" disabled>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} className="transform transition-all duration-200 hover:scale-[1.02]" />
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} className="transform transition-all duration-200 hover:scale-[1.02]" />
          ))}
        </div>

        <DashboardLayout defaultSizes={[40, 60]}>
          <DashboardPanel>
            <div className="space-y-4">
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              <ChartSkeleton />
            </div>
          </DashboardPanel>
          <DashboardPanel>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                <div className="w-[180px]">
                  <div className="h-10 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <ChartSkeleton />
            </div>
          </DashboardPanel>
        </DashboardLayout>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground">
            Monitor your clinical practice performance
          </p>
        </div>
        <PDFDownloadLink
          document={<DashboardPDFReport data={reportData} />}
          fileName={`healthcare-dashboard-${format(new Date(), "yyyy-MM-dd")}.pdf`}
        >
          {({ loading }: { loading: boolean }) => (
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2 shadow-sm transition-all duration-200 hover:shadow-md"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export PDF
                </>
              )}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <QuickActions actions={dashboardActions} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Patients"
          value={patients.length}
          icon={<Users className="h-4 w-4" />}
          description="Registered patients"
          className="transform transition-all duration-200 hover:scale-[1.02]"
        />
        <StatsCard
          title="Total Appointments"
          value={appointments.length}
          icon={<Calendar className="h-4 w-4" />}
          description="Appointments to date"
          trending={appointmentsTrending}
          className="transform transition-all duration-200 hover:scale-[1.02]"
        />
        <StatsCard
          title="Confirmed"
          value={confirmedAppointments}
          icon={<CheckCircle className="h-4 w-4" />}
          description="Completed"
          className="transform transition-all duration-200 hover:scale-[1.02]"
        />
        <StatsCard
          title="Cancelled"
          value={canceledAppointments}
          icon={<XCircle className="h-4 w-4" />}
          description="Cancelled/missed"
          className="transform transition-all duration-200 hover:scale-[1.02]"
        />
      </div>

      <DashboardLayout defaultSizes={[40, 60]}>
        <DashboardPanel className="p-6 bg-card rounded-lg shadow-sm">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Appointment Status</h2>
              <p className="text-sm text-muted-foreground">Current distribution</p>
            </div>
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
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    className="transition-all duration-300"
                  >
                    {appointmentsByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        className="opacity-80 hover:opacity-100 transition-opacity"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconSize={8}
                    iconType="circle"
                    formatter={(value: string) => (
                      <span className="text-sm font-medium">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel className="p-6 bg-card rounded-lg shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Growth Trends</h2>
                <p className="text-sm text-muted-foreground">Patient and appointment growth</p>
              </div>
              <Select
                value={timeRange}
                onValueChange={setTimeRange}
              >
                <SelectTrigger className="w-[180px] h-9">
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
                <LineChart data={monthlyStats} className="transition-all duration-300">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickMargin={8}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickMargin={8}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickMargin={8}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                      padding: "8px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconSize={8}
                    iconType="circle"
                    formatter={(value: string) => (
                      <span className="text-sm font-medium">{value}</span>
                    )}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="appointments"
                    stroke={COLORS[0]}
                    strokeWidth={2}
                    name="Appointments"
                    dot={false}
                    activeDot={{ r: 4, className: "animate-pulse" }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="patients"
                    stroke={COLORS[1]}
                    strokeWidth={2}
                    name="New Patients"
                    dot={false}
                    activeDot={{ r: 4, className: "animate-pulse" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DashboardPanel>
      </DashboardLayout>
    </div>
  );
}

export default Dashboard;