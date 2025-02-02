import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trending?: {
    value: number;
    label: string;
  };
}

export function StatsCard({
  title,
  value,
  icon,
  description,
  trending,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="h-10 w-10 rounded-full bg-primary/10 p-2 text-primary transition-transform duration-200"
          >
            {icon}
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, type: "spring" }}
            className="text-3xl font-bold tracking-tight"
          >
            {value}
          </motion.div>
          {description && (
            <p className={cn(
              "mt-2 text-xs",
              trending ? "text-muted-foreground" : "text-muted-foreground"
            )}>
              {description}
            </p>
          )}
          {trending && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-2 flex items-center gap-1 text-xs font-medium"
            >
              <span className={cn(
                "flex items-center",
                trending.value > 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {trending.value > 0 ? "↑" : "↓"} {Math.abs(trending.value)}%
              </span>
              <span className="text-muted-foreground">
                {trending.label}
              </span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}