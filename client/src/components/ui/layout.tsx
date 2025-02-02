import { useLocation } from "wouter";
import { OnboardingTour } from "./onboarding-tour";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [showTour] = useState(() => {
    // Check if this is the user's first visit
    const hasSeenTour = localStorage.getItem("hasSeenTour");
    if (!hasSeenTour) {
      localStorage.setItem("hasSeenTour", "true");
      return true;
    }
    return false;
  });

  return (
    <div className="flex min-h-screen bg-background antialiased">
      {showTour && <OnboardingTour />}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 lg:p-8 animate-in fade-in slide-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}