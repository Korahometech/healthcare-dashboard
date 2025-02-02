import { useState, useEffect, useCallback } from "react";
import { useFloating, offset, flip, shift } from "@floating-ui/react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface FeatureTooltipProps {
  featureId: string;
  content: string;
  children: React.ReactNode;
  className?: string;
}

const TOOLTIP_STORAGE_PREFIX = "feature_tooltip_seen_";

export function FeatureTooltip({
  featureId,
  content,
  children,
  className,
}: FeatureTooltipProps) {
  const [show, setShow] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(() => {
    return !!localStorage.getItem(`${TOOLTIP_STORAGE_PREFIX}${featureId}`);
  });

  const { x, y, strategy, refs } = useFloating({
    placement: "top",
    middleware: [offset(8), flip(), shift()],
  });

  const markAsSeen = useCallback(() => {
    localStorage.setItem(`${TOOLTIP_STORAGE_PREFIX}${featureId}`, "true");
    setHasBeenSeen(true);
    setShow(false);
  }, [featureId]);

  useEffect(() => {
    // Show tooltip after a short delay when hovering for the first time
    const timer = setTimeout(() => {
      if (!hasBeenSeen) {
        setShow(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [hasBeenSeen]);

  if (hasBeenSeen) {
    return <>{children}</>;
  }

  return (
    <div className="relative" ref={refs.setReference}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            ref={refs.setFloating}
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              width: "max-content",
              maxWidth: 320,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "z-50 rounded-lg border bg-background p-4 text-sm shadow-md",
              className
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6"
              onClick={markAsSeen}
            >
              <X className="h-4 w-4" />
            </Button>
            <p>{content}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
