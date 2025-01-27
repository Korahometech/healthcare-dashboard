import { useState } from "react";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { Loader2, Calendar, Users, TrendingUp, MapPin } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { DashboardLayout, DashboardPanel } from "@/components/ui/dashboard-layout";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  calculateCompletionRate,
  calculateCancellationRate,
  getAppointmentsByTimeRange,
  calculateAgeDistribution,
  calculateGenderDistribution,
  calculateGeographicDistribution,
  calculateHealthConditionsDistribution,
  getPatientVisitFrequency,
} from "@/lib/analytics";

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))'
];

export default function Analytics() {
  const { appointments, isLoading: appointmentsLoading } = useAppointments();
  const { patients, isLoading: patientsLoading } = usePatients();
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("weekly");
  const { t } = useTranslation();

  const isLoading = appointmentsLoading || patientsLoading;

  // Early return if loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">{t('status.loading')}</p>
        </div>
      </div>
    );
  }

  // Early return if data is missing
  if (!appointments || !patients) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p className="text-sm text-muted-foreground">{t('status.error')}</p>
      </div>
    );
  }

  const completionRate = calculateCompletionRate(appointments);
  const cancellationRate = calculateCancellationRate(appointments);
  const ageDistribution = calculateAgeDistribution(patients);
  const genderDistribution = calculateGenderDistribution(patients);
  const geographicDistribution = calculateGeographicDistribution(patients);
  const appointmentTrends = getAppointmentsByTimeRange(appointments, timeRange);
  const healthConditions = calculateHealthConditionsDistribution(patients);
  const visitFrequency = getPatientVisitFrequency(appointments);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Detailed insights and performance metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Patients"
          value={patients.length}
          icon={<Users className="h-4 w-4" />}
          description="Registered patients"
        />
        <StatsCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Successfully completed appointments"
        />
        <StatsCard
          title="Cancellation Rate"
          value={`${cancellationRate}%`}
          icon={<Calendar className="h-4 w-4" />}
          description="Cancelled appointments"
        />
        <StatsCard
          title="Regions"
          value={geographicDistribution.length}
          icon={<MapPin className="h-4 w-4" />}
          description="Covered regions"
        />
      </div>

      <DashboardLayout defaultSizes={[50, 50]}>
        <DashboardPanel>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Age Distribution</h2>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis dataKey="age" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS[0]}>
                  {ageDistribution.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="opacity-80 hover:opacity-100 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Gender Distribution</h2>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderDistribution}
                  dataKey="count"
                  nameKey="gender"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label={({ gender, percent }) =>
                    `${gender} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {genderDistribution.map((_, index) => (
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
        </DashboardPanel>
      </DashboardLayout>

      <DashboardLayout defaultSizes={[50, 50]}>
        <DashboardPanel>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Geographic Distribution</h2>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={geographicDistribution.slice(0, 10)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis type="number" />
                <YAxis dataKey="region" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS[2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Health Conditions</h2>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={healthConditions.slice(0, 10)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis type="number" />
                <YAxis dataKey="condition" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS[3]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>
      </DashboardLayout>

      <DashboardLayout defaultSizes={[60, 40]}>
        <DashboardPanel>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Appointment Trends</h2>
            <Select
              value={timeRange}
              onValueChange={(value: "daily" | "weekly" | "monthly") =>
                setTimeRange(value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={appointmentTrends}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
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
                  type="monotone"
                  dataKey="count"
                  name="Appointments"
                  stroke={COLORS[0]}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Visit Frequency</h2>
            <p className="text-sm text-muted-foreground">
              Number of appointments per patient
            </p>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitFrequency}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis
                  dataKey="visits"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: "Visits", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{
                    value: "Number of Patients",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="count" fill={COLORS[1]}>
                  {visitFrequency.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[1]}
                      className="opacity-80 hover:opacity-100 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>
      </DashboardLayout>
    </div>
  );
}