import React, { useState } from "react";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { useHealthTrends, type TimeRange } from "@/hooks/use-health-trends";
import { Loader2, Calendar, Users, TrendingUp, MapPin } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { DashboardLayout, DashboardPanel } from "@/components/ui/dashboard-layout";
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
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from "recharts";
import {
  calculateCompletionRate,
  calculateCancellationRate,
  getAppointmentsByTimeRange,
  calculateAgeDistribution,
  calculateGenderDistribution,
  calculateHealthConditionsDistribution,
  calculateBMIDistribution,
} from "@/lib/analytics";
import { format } from 'date-fns';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))'
];

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: "1 Month", value: "1M" },
  { label: "3 Months", value: "3M" },
  { label: "6 Months", value: "6M" },
  { label: "1 Year", value: "1Y" },
  { label: "All Time", value: "ALL" },
];

const APPOINTMENT_TIME_RANGES = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

type AppointmentTimeRange = "daily" | "weekly" | "monthly";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>("6M");
  const [appointmentTimeRange, setAppointmentTimeRange] = useState<AppointmentTimeRange>("weekly");
  const { appointments = [], isLoading: appointmentsLoading } = useAppointments();
  const { patients = [], isLoading: patientsLoading } = usePatients();
  const { data: healthTrends, isLoading: healthTrendsLoading } = useHealthTrends(undefined, timeRange);

  const isLoading = appointmentsLoading || patientsLoading || healthTrendsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  const completionRate = calculateCompletionRate(appointments);
  const cancellationRate = calculateCancellationRate(appointments);
  const ageDistribution = calculateAgeDistribution(patients);
  const genderDistribution = calculateGenderDistribution(patients);
  const appointmentTrends = getAppointmentsByTimeRange(appointments, appointmentTimeRange);
  const healthConditions = calculateHealthConditionsDistribution(patients);
  const bmiDistribution = calculateBMIDistribution(patients);

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
          title="Health Conditions"
          value={healthConditions.length}
          icon={<MapPin className="h-4 w-4" />}
          description="Tracked conditions"
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Advanced Health Analytics</h2>
        <Select
          value={timeRange}
          onValueChange={(value: TimeRange) => setTimeRange(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGES.map(({ label, value }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DashboardLayout defaultSizes={[60, 40]}>
        <DashboardPanel>
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Health Metrics Trends</h3>
            <p className="text-sm text-muted-foreground">
              Detailed view with confidence intervals
            </p>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {healthTrends?.detailedTrends?.map((trend, index) => (
                  <React.Fragment key={trend.category}>
                    <Line
                      type="monotone"
                      data={trend.trends}
                      name={trend.category}
                      dataKey="average"
                      stroke={`hsl(var(--chart-${(index % 4) + 1}))`}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      data={trend.trends}
                      dataKey="confidenceInterval.upper"
                      stroke="transparent"
                      fill={`hsl(var(--chart-${(index % 4) + 1}))`}
                      fillOpacity={0.1}
                    />
                    <Area
                      type="monotone"
                      data={trend.trends}
                      dataKey="confidenceInterval.lower"
                      stroke="transparent"
                      fill={`hsl(var(--chart-${(index % 4) + 1}))`}
                      fillOpacity={0.1}
                    />
                  </React.Fragment>
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Metric Correlations</h3>
            <p className="text-sm text-muted-foreground">
              Relationship between different health indicators
            </p>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid />
                <XAxis
                  type="number"
                  dataKey="value1"
                  name="metric1"
                  label={{ value: healthTrends?.metricCorrelations?.[0]?.metric1 ?? '', position: 'bottom' }}
                />
                <YAxis
                  type="number"
                  dataKey="value2"
                  name="metric2"
                  label={{ value: healthTrends?.metricCorrelations?.[0]?.metric2 ?? '', angle: -90, position: 'left' }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter
                  name="Health Metrics"
                  data={healthTrends?.metricCorrelations ?? []}
                  fill={COLORS[0]}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>
      </DashboardLayout>

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

      <DashboardLayout defaultSizes={[60, 40]}>
        <DashboardPanel>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Appointment Trends</h2>
            <Select
              value={appointmentTimeRange}
              onValueChange={(value: AppointmentTimeRange) =>
                setAppointmentTimeRange(value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                {APPOINTMENT_TIME_RANGES.map(({ label, value }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
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
            <h2 className="text-xl font-semibold">Lab Results Trends</h2>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis
                  dataKey="date"
                  type="category"
                  allowDuplicatedCategory={false}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {healthTrends?.labTrends?.map((test, index) => (
                  <Line
                    key={test.testName}
                    data={test.trends}
                    name={test.testName}
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>
      </DashboardLayout>

      <div>
        <h2 className="text-2xl font-bold mb-4">Advanced Health Analytics</h2>

        <DashboardLayout defaultSizes={[50, 50]}>
          <DashboardPanel>
            <div className="mb-4">
              <h3 className="text-xl font-semibold">Health Metrics Correlation</h3>
              <p className="text-sm text-muted-foreground">
                Relationship between different health indicators
              </p>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid />
                  <XAxis 
                    type="number" 
                    dataKey="value1" 
                    name="metric1"
                    label={{ value: healthTrends?.metricCorrelations?.[0]?.metric1 ?? '', position: 'bottom' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="value2" 
                    name="metric2"
                    label={{ value: healthTrends?.metricCorrelations?.[0]?.metric2 ?? '', angle: -90, position: 'left' }}
                  />
                  <ZAxis 
                    type="number"
                    range={[100, 100]}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Metrics" data={healthTrends?.metricCorrelations ?? []} fill={COLORS[0]} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <div className="mb-4">
              <h3 className="text-xl font-semibold">Health Risk Radar</h3>
              <p className="text-sm text-muted-foreground">
                Multi-dimensional view of health risk factors
              </p>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%">
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="riskFactor"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <PolarRadiusAxis />
                  <Radar
                    name="Risk Factors"
                    dataKey="patientCount"
                    data={healthTrends?.riskFactors ?? []}
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>
        </DashboardLayout>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="font-semibold">{format(new Date(label), 'MMM d, yyyy')}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="mt-2">
          <p style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(2)}
            {entry.payload.confidenceInterval && (
              <span className="text-sm text-muted-foreground">
                {' '}(±{((entry.payload.confidenceInterval.upper - entry.payload.confidenceInterval.lower) / 2).toFixed(2)})
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
};