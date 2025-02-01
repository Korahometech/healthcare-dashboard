import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedContainer({
  children,
  className,
  delay = 0,
}: AnimatedContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        delay,
        ease: "easeOut",
      }}
      className={cn(
        "relative transition-all duration-200",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedItemProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedItem({
  children,
  delay = 0,
  className,
}: AnimatedItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.2,
        delay,
        ease: "easeOut",
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn("relative", className)}
    >
      {children}
    </motion.div>
  );
}

interface FeedbackAnimationProps {
  isVisible: boolean;
  type: "success" | "error" | "loading";
  message: string;
  className?: string;
}

export function FeedbackAnimation({
  isVisible,
  type,
  message,
  className,
}: FeedbackAnimationProps) {
  const variants = {
    success: "bg-green-500/10 text-green-500 border-green-500/20",
    error: "bg-red-500/10 text-red-500 border-red-500/20",
    loading: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={cn(
            "fixed top-4 right-4 z-50 rounded-lg border p-4 shadow-lg",
            variants[type],
            className
          )}
        >
          <div className="flex items-center gap-2">
            {type === "loading" && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
              />
            )}
            {type === "success" && "✓"}
            {type === "error" && "×"}
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedButton({
  children,
  className,
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}
