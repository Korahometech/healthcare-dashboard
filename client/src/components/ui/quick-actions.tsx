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
  { label: "New Appointment", icon: Calendar, href: "/appointments/new" },
  { label: "Add Patient", icon: UserPlus, href: "/patients/new" },
  { label: "View Analytics", icon: LineChart, href: "/analytics" },
];

export const appointmentActions: QuickAction[] = [
  { label: "New Appointment", icon: Plus, href: "/appointments/new" },
  { label: "Today's Schedule", icon: Calendar, href: "/appointments?filter=today" },
  { label: "Refresh", icon: RefreshCcw, href: "/appointments" },
];

export const patientActions: QuickAction[] = [
  { label: "Add Patient", icon: UserPlus, href: "/patients/new" },
  { label: "View Records", icon: FileText, href: "/patients" },
];

export const analyticsActions: QuickAction[] = [
  { label: "Export Report", icon: FileText, href: "#" },
  { label: "Update Data", icon: RefreshCcw, href: "/analytics" },
];
