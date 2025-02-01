import React, { useState } from "react";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { useHealthTrends, type TimeRange, Specialty, MetricGroup } from "@/hooks/use-health-trends";
import { Loader2, Calendar, Users, TrendingUp, MapPin, Download, HelpCircle } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { DashboardLayout, DashboardPanel } from "@/components/ui/dashboard-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { AnalyticsPDFReport } from "@/components/analytics/pdf-report";
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
  Tooltip as RechartsTooltip
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
import { ChartTooltip } from "@/components/ui/chart-tooltip";
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))'
];

const SPECIALTIES: { label: string; value: Specialty }[] = [
  { label: "General Practice", value: "general" },
  { label: "Cardiology", value: "cardiology" },
  { label: "Endocrinology", value: "endocrinology" },
  { label: "Neurology", value: "neurology" },
  { label: "Pediatrics", value: "pediatrics" },
  { label: "Oncology", value: "oncology" },
];

const DEFAULT_METRIC_GROUPS: MetricGroup[] = [
  {
    id: "vitals",
    name: "Vital Signs",
    metrics: ["heart_rate", "blood_pressure", "temperature", "respiratory_rate"],
    priority: "high",
    thresholds: {
      warning: 140,
      critical: 180,
    },
  },
  {
    id: "lab_results",
    name: "Laboratory Results",
    metrics: ["glucose", "cholesterol", "hemoglobin"],
    priority: "medium",
    thresholds: {
      warning: 126,
      critical: 200,
    },
  },
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
  const [specialty, setSpecialty] = useState<Specialty>("general");
  const [metricGroups, setMetricGroups] = useState<MetricGroup[]>(DEFAULT_METRIC_GROUPS);
  const [appointmentTimeRange, setAppointmentTimeRange] = useState<AppointmentTimeRange>("weekly");
  const { appointments = [], isLoading: appointmentsLoading } = useAppointments();
  const { patients = [], isLoading: patientsLoading } = usePatients();
  const { data: healthTrends, isLoading: healthTrendsLoading } = useHealthTrends(
    undefined,
    timeRange,
    specialty,
    metricGroups
  );
  const { toast } = useToast();

  const isLoading = appointmentsLoading || patientsLoading || healthTrendsLoading;

  const analyticsData = {
    timeRange,
    appointmentStats: {
      total: appointments.length,
      completionRate: calculateCompletionRate(appointments),
      cancellationRate: calculateCancellationRate(appointments),
    },
    patientStats: {
      total: patients.length,
      ageDistribution: calculateAgeDistribution(patients),
      genderDistribution: calculateGenderDistribution(patients),
      healthConditions: calculateHealthConditionsDistribution(patients),
      bmiDistribution: calculateBMIDistribution(patients),
    },
    healthTrends,
  };

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
    const appointmentOptimization = {
    peakHours: [
      { hour: '9 AM', count: 12 },
      { hour: '10 AM', count: 25 },
      { hour: '11 AM', count: 18 },
      { hour: '12 PM', count: 10 },
      { hour: '1 PM', count: 8 },
      { hour: '2 PM', count: 15 },
      { hour: '3 PM', count: 22 },
      { hour: '4 PM', count: 14 },
    ],
    noShowRate: [
      { date: "1/1", rate: 0.1 },
      { date: "1/2", rate: 0.08 },
      { date: "1/3", rate: 0.12 },
      { date: "1/4", rate: 0.15 },
      { date: "1/5", rate: 0.1 },
    ],
    waitTimes: [
      { date: "1/1", avgWaitMinutes: 10 },
      { date: "1/2", avgWaitMinutes: 15 },
      { date: "1/3", avgWaitMinutes: 8 },
      { date: "1/4", avgWaitMinutes: 12 },
      { date: "1/5", avgWaitMinutes: 14 },
    ],
    schedulingEfficiency: 85.5,
  }
    const formatPercent = (value: number) => `${value.toFixed(1)}%`;
    const formatCount = (value: number) => value.toLocaleString();
    const formatDate = (date: string) => format(new Date(date), 'MMM d, yyyy');

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive healthcare insights and metrics
            </p>
          </div>
          <PDFDownloadLink
            document={<AnalyticsPDFReport data={analyticsData} />}
            fileName={`healthcare-analytics-${format(new Date(), "yyyy-MM-dd")}.pdf`}
          >
            {({ loading, error }) => (
              <Button variant="outline" className="gap-2" disabled={loading}>
                <Download className="h-4 w-4" />
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  "Export Analytics (PDF)"
                )}
              </Button>
            )}
          </PDFDownloadLink>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Patients"
            value={patients.length}
            icon={<Users className="h-4 w-4" />}
            description="Active patient records"
          />
          <StatsCard
            title="Completion Rate"
            value={`${completionRate}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            description="Successful appointments"
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
            description="Monitored conditions"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Select
            value={specialty}
            onValueChange={(value: Specialty) => setSpecialty(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select specialty" />
            </SelectTrigger>
            <SelectContent>
              {SPECIALTIES.map(({ label, value }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">
              {SPECIALTIES.find(s => s.value === specialty)?.label} Dashboard
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Customized health metrics for {SPECIALTIES.find(s => s.value === specialty)?.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

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

        {healthTrends?.alerts && healthTrends.alerts.length > 0 && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Critical Alerts
            </h3>
            <div className="space-y-2">
              {healthTrends.alerts.map((alert: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded bg-background"
                >
                  <div>
                    <span className="font-medium">{alert.group}: </span>
                    <span>{alert.metric}</span>
                  </div>
                  <Badge
                    variant={alert.severity === "critical" ? "destructive" : "secondary"}
                  >
                    {alert.value.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <DashboardLayout defaultSizes={[60, 40]}>
          <DashboardPanel>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">Health Metrics Trends</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Visualizes key health metrics over time with confidence intervals</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">
                Trend analysis with statistical confidence
              </p>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis dataKey="date" fontSize={12} tickMargin={8} />
                  <YAxis fontSize={12} tickMargin={8} />
                    <RechartsTooltip
                        content={({ active, payload, label }) => (
                            <ChartTooltip
                                active={active}
                                payload={payload}
                                label={label}
                                formatter={(value) => value.toFixed(2)}
                                labelFormatter={formatDate}
                            />
                        )}
                    />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconSize={8}
                    iconType="circle"
                    formatter={(value: string) => (
                      <span className="text-xs">{value}</span>
                    )}
                  />
                  {healthTrends?.detailedTrends?.map((trend, index) => (
                    <React.Fragment key={trend.category}>
                      <Line
                        type="monotone"
                        data={trend.trends}
                        name={trend.category}
                        dataKey="average"
                        stroke={`hsl(var(--chart-${(index % 4) + 1}))`}
                        dot={false}
                        strokeWidth={2}
                        activeDot={{ r: 4, className: "animate-pulse" }}
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
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">Metric Correlations</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Shows relationships between different health indicators</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">
                Statistical correlation analysis
              </p>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis
                    type="number"
                    dataKey="value1"
                    name="metric1"
                    fontSize={12}
                    tickMargin={8}
                    label={{ value: healthTrends?.metricCorrelations?.[0]?.metric1 ?? '', position: 'bottom', fontSize: 12 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="value2"
                    name="metric2"
                    fontSize={12}
                    tickMargin={8}
                    label={{ value: healthTrends?.metricCorrelations?.[0]?.metric2 ?? '', angle: -90, position: 'left', fontSize: 12 }}
                  />
                  <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
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
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Patient Demographics</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Age distribution of registered patients</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis dataKey="age" fontSize={12} tickMargin={8} />
                  <YAxis fontSize={12} tickMargin={8} />
                    <RechartsTooltip
                        content={({ active, payload, label }) => (
                            <ChartTooltip
                                active={active}
                                payload={payload}
                                label={`Age: ${label}`}
                                formatter={formatCount}
                            />
                        )}
                    />
                  <Bar dataKey="count" fill={COLORS[0]}>
                    {ageDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Gender Distribution</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Gender distribution across patient population</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderDistribution}
                    dataKey="count"
                    nameKey="gender"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                      className="transition-all duration-300"
                    label={({ gender, percent }) =>
                      `${gender} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {genderDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                          className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                      content={({ active, payload }) => (
                          <ChartTooltip
                              active={active}
                              payload={payload}
                              formatter={(value) => `${value} patients (${formatPercent((value / patients.length) * 100)})`}
                          />
                      )}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconSize={8}
                    iconType="circle"
                    formatter={(value: string) => (
                      <span className="text-xs">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>
        </DashboardLayout>

        <DashboardLayout defaultSizes={[60, 40]}>
          <DashboardPanel>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Appointment Analytics</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Appointment frequency and distribution over time</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={appointmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickMargin={8}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickMargin={8}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                      padding: "8px",
                    }}
                      content={({ active, payload, label }) => (
                          <ChartTooltip
                              active={active}
                              payload={payload}
                              label={label}
                              formatter={formatCount}
                              labelFormatter={formatDate}
                          />
                      )}
                  />
                   <Legend
                    verticalAlign="top"
                    height={36}
                    iconSize={8}
                    iconType="circle"
                    formatter={(value: string) => (
                      <span className="text-xs">{value}</span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Appointments"
                    stroke={COLORS[0]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, className: "animate-pulse" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>
           <DashboardPanel>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Appointment Optimization</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Insights for optimizing appointment scheduling and reducing wait times</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-[200px]">
                <h3 className="text-sm font-medium mb-2">Peak Hours</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentOptimization?.peakHours ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-[200px]">
                <h3 className="text-sm font-medium mb-2">No-Show Rates</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={appointmentOptimization?.noShowRate ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="rate" stroke={COLORS[1]} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="h-[200px]">
                <h3 className="text-sm font-medium mb-2">Average Wait Times</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={appointmentOptimization?.waitTimes ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line
                      type="monotone"
                      dataKey="avgWaitMinutes"
                      stroke={COLORS[2]}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-medium mb-2">Scheduling Efficiency</h3>
                  <div className="text-2xl font-bold">
                    {appointmentOptimization?.schedulingEfficiency.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Appointments completed on time
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-medium mb-2">Recommended Actions</h3>
                  <ul className="text-sm space-y-2">
                    <li>• Schedule more appointments during off-peak hours</li>
                    <li>• Follow up with patients who frequently miss appointments</li>
                    <li>• Adjust buffer times during peak hours</li>
                  </ul>
                </div>
              </div>
            </div>
          </DashboardPanel>
          <DashboardPanel>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Lab Results Trends</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Trends in laboratory test results over time</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
                  <RechartsTooltip />
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
      </div>
    </TooltipProvider>
  );
}