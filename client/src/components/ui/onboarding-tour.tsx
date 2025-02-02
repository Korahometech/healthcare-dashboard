import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";
import { Card } from "./card";
import {
  ChevronRight,
  ChevronLeft,
  X,
  Stethoscope,
  Calendar,
  FileText,
  BarChart,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to Your Healthcare Journey",
    description: "Let's explore how our platform can help manage your healthcare needs effectively.",
    icon: <Stethoscope className="h-12 w-12 text-primary" />,
  },
  {
    title: "Schedule Appointments",
    description: "Easily book and manage appointments with your healthcare providers.",
    icon: <Calendar className="h-12 w-12 text-primary" />,
    highlight: "[data-tour='appointments']",
  },
  {
    title: "Patient Records",
    description: "Access and manage your medical records securely in one place.",
    icon: <FileText className="h-12 w-12 text-primary" />,
    highlight: "[data-tour='records']",
  },
  {
    title: "Health Analytics",
    description: "Track your health trends and get personalized insights.",
    icon: <BarChart className="h-12 w-12 text-primary" />,
    highlight: "[data-tour='analytics']",
  },
  {
    title: "Care Team",
    description: "Connect with your healthcare providers and specialists.",
    icon: <Users className="h-12 w-12 text-primary" />,
    highlight: "[data-tour='team']",
  },
];

export function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const step = tourSteps[currentStep];
    if (step.highlight) {
      const element = document.querySelector(step.highlight) as HTMLElement;
      setHighlightedElement(element);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {highlightedElement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="absolute border-2 border-primary animate-pulse"
              style={{
                top: highlightedElement.offsetTop - 4,
                left: highlightedElement.offsetLeft - 4,
                width: highlightedElement.offsetWidth + 8,
                height: highlightedElement.offsetHeight + 8,
                borderRadius: "0.5rem",
              }}
            />
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative mx-auto max-w-lg"
        >
          <Card className="p-6 shadow-lg">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                {tourSteps[currentStep].icon}
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">
                  {tourSteps[currentStep].title}
                </h2>
                <p className="text-muted-foreground">
                  {tourSteps[currentStep].description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button onClick={handleNext}>
                    {currentStep === tourSteps.length - 1 ? (
                      "Get Started"
                    ) : (
                      <>
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  {tourSteps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full transition-all duration-200",
                        index === currentStep
                          ? "w-3 bg-primary"
                          : "bg-primary/30"
                      )}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
