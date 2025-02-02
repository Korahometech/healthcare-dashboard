import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface TourStep {
  id: string;
  element: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourContextType {
  currentStep: number;
  isActive: boolean;
  steps: TourStep[];
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

const defaultSteps: TourStep[] = [
  {
    id: 'dashboard-overview',
    element: '[data-tour="dashboard-overview"]',
    title: 'Welcome to Your Healthcare Dashboard',
    description: 'This is your main dashboard where you can manage patient records, appointments, and medical data.',
    placement: 'bottom',
  },
  {
    id: 'patient-management',
    element: '[data-tour="patient-management"]',
    title: 'Patient Management',
    description: 'Easily add, view, and manage your patients from this section.',
    placement: 'right',
  },
  {
    id: 'appointments',
    element: '[data-tour="appointments"]',
    title: 'Appointment Scheduling',
    description: 'Schedule and manage patient appointments efficiently.',
    placement: 'left',
  },
  {
    id: 'medical-records',
    element: '[data-tour="medical-records"]',
    title: 'Medical Records',
    description: 'Access and update patient medical records securely.',
    placement: 'top',
  },
];

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState(defaultSteps);
  const [location] = useLocation();

  // Reset tour when location changes
  useEffect(() => {
    if (isActive) {
      setIsActive(false);
      setCurrentStep(0);
    }
  }, [location]);

  const startTour = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const endTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    // Store in localStorage that user has completed the tour
    localStorage.setItem('tourCompleted', 'true');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipTour = () => {
    endTour();
  };

  return (
    <TourContext.Provider
      value={{
        currentStep,
        isActive,
        steps,
        startTour,
        endTour,
        nextStep,
        previousStep,
        skipTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
