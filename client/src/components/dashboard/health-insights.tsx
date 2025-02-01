import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Loader2 } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))'
];

interface HealthMetric {
  date: string;
  value: number;
  category: string;
  confidenceInterval?: {
    upper: number;
    lower: number;
  };
}

interface HealthInsightsProps {
  data: HealthMetric[];
  isLoading?: boolean;
  title: string;
  description?: string;
}

export function HealthInsights({ data, isLoading, title, description }: HealthInsightsProps) {
  const categories = [...new Set(data.map(d => d.category))];

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center h-[300px]"
      >
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading health insights...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View detailed health metrics and trends over time</p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickMargin={8}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                fontSize={12}
                tickMargin={8}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                  padding: "8px",
                }}
                animationDuration={200}
              />
              {categories.map((category, index) => (
                <motion.g key={category} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.2 }}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    data={data.filter(d => d.category === category)}
                    name={category}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, className: "animate-pulse" }}
                  />
                  {data.some(d => d.category === category && d.confidenceInterval) && (
                    <>
                      <Area
                        type="monotone"
                        data={data.filter(d => d.category === category)}
                        dataKey="confidenceInterval.upper"
                        stroke="transparent"
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.1}
                      />
                      <Area
                        type="monotone"
                        data={data.filter(d => d.category === category)}
                        dataKey="confidenceInterval.lower"
                        stroke="transparent"
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.1}
                      />
                    </>
                  )}
                </motion.g>
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
}
