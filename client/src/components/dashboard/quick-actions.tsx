import { UserPlus, CalendarPlus, ClipboardList, FileSearch, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const quickActions = [
  {
    title: "New Patient",
    description: "Register a new patient record",
    icon: UserPlus,
    href: "/patients?action=new",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Schedule Appointment",
    description: "Book a new appointment",
    icon: CalendarPlus,
    href: "/appointments?action=new",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Record Symptoms",
    description: "Log patient symptoms",
    icon: ClipboardList,
    href: "/patients?action=symptoms",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    title: "Recent Records",
    description: "View latest patient records",
    icon: FileSearch,
    href: "/patients?view=recent",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Emergency Contact",
    description: "Start urgent consultation",
    icon: Phone,
    href: "/emergency",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
];

export function QuickActions() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common medical tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Button
                variant="outline"
                className="h-auto w-full justify-start gap-4 p-4 transition-colors hover:bg-muted"
              >
                <div
                  className={cn(
                    "rounded-lg p-2",
                    action.bgColor
                  )}
                >
                  <Icon className={cn("h-6 w-6", action.color)} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </Button>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
