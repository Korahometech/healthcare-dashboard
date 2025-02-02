import { Button } from "./button";
import { Plus, FileText, Calendar, LineChart, Edit, User, UserPlus, RefreshCcw } from "lucide-react";
import { Link } from "wouter";

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {actions.map((action, index) => (
        action.href ? (
          <Link key={index} href={action.href}>
            <Button variant="outline" size="sm" className="gap-2">
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={action.onClick}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        )
      ))}
    </div>
  );
}

// Predefined quick action sets for different pages
export const dashboardActions: QuickAction[] = [
  { label: "New Appointment", icon: Calendar, href: "/appointments" },
  { label: "Add Patient", icon: UserPlus, href: "/patients" },
  { label: "View Analytics", icon: LineChart, href: "/analytics" },
];

export const appointmentActions: QuickAction[] = [
  { label: "New Appointment", icon: Plus, href: "/appointments" },
  { label: "Today's Schedule", icon: Calendar, href: "/appointments" },
  { label: "View Patients", icon: User, href: "/patients" },
];

export const patientActions: QuickAction[] = [
  { label: "Add Patient", icon: UserPlus, href: "/patients" },
  { label: "View Records", icon: FileText, href: "/patients" },
  { label: "Schedule Appointment", icon: Calendar, href: "/appointments" },
];

export const analyticsActions: QuickAction[] = [
  { label: "View Patients", icon: User, href: "/patients" },
  { label: "View Appointments", icon: Calendar, href: "/appointments" },
  { label: "Update Data", icon: RefreshCcw, href: "/analytics" },
];