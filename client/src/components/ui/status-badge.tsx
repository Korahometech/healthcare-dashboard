import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const statusVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        scheduled: "bg-blue-50 text-blue-700 border border-blue-300",
        confirmed: "bg-green-50 text-green-700 border border-green-300",
        cancelled: "bg-red-50 text-red-700 border border-red-300",
        completed: "bg-gray-50 text-gray-700 border border-gray-300",
      },
    },
    defaultVariants: {
      variant: "scheduled",
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusVariants> {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
        className={cn(
          statusVariants({ 
            variant: status as "scheduled" | "confirmed" | "cancelled" | "completed"
          }),
          className
        )}
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </motion.span>
      </motion.span>
    </AnimatePresence>
  );
}
