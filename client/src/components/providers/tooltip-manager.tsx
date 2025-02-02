import { createContext, useContext, useState } from "react";

interface TooltipManagerContextType {
  dismissedTooltips: Set<string>;
  dismissTooltip: (id: string) => void;
  resetAllTooltips: () => void;
}

const TooltipManagerContext = createContext<TooltipManagerContextType | null>(null);

export function TooltipManagerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dismissedTooltips, setDismissedTooltips] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("dismissed_tooltips");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  const dismissTooltip = (id: string) => {
    setDismissedTooltips((prev) => {
      const next = new Set(prev).add(id);
      localStorage.setItem(
        "dismissed_tooltips",
        JSON.stringify(Array.from(next))
      );
      return next;
    });
  };

  const resetAllTooltips = () => {
    // Clear all tooltip records from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("feature_tooltip_seen_")) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem("dismissed_tooltips");
    setDismissedTooltips(new Set());
  };

  return (
    <TooltipManagerContext.Provider
      value={{ dismissedTooltips, dismissTooltip, resetAllTooltips }}
    >
      {children}
    </TooltipManagerContext.Provider>
  );
}

export function useTooltipManager() {
  const context = useContext(TooltipManagerContext);
  if (!context) {
    throw new Error(
      "useTooltipManager must be used within a TooltipManagerProvider"
    );
  }
  return context;
}
