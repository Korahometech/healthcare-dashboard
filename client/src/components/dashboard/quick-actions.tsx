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
import { useQuery } from "@tanstack/react-query";
import { getSmartRecommendations } from "@/lib/openai";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap = {
  UserPlus,
  CalendarPlus,
  ClipboardList,
  FileSearch,
  Phone,
};

interface QuickAction {
  title: string;
  description: string;
  icon: keyof typeof iconMap;
  href: string;
  color: string;
  bgColor: string;
  priority: number;
}

export function QuickActions() {
  const { t } = useTranslation();

  // In a real app, these would come from your backend
  const mockRecentActivities = [
    "Reviewed patient records",
    "Updated vaccination schedule",
    "Scheduled follow-up appointments",
  ];

  const { data: aiRecommendations, isLoading } = useQuery({
    queryKey: ["quick-actions-recommendations"],
    queryFn: async () => getSmartRecommendations("doctor", mockRecentActivities),
    staleTime: 5 * 60 * 1000, // Consider recommendations stale after 5 minutes
  });

  const defaultQuickActions: QuickAction[] = [
    {
      title: "New Patient",
      description: "Register a new patient record",
      icon: "UserPlus",
      href: "/patients?action=new",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      priority: 5,
    },
    {
      title: "Schedule Appointment",
      description: "Book a new appointment",
      icon: "CalendarPlus",
      href: "/appointments?action=new",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      priority: 4,
    },
    {
      title: "Emergency Contact",
      description: "Start urgent consultation",
      icon: "Phone",
      href: "/emergency",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      priority: 3,
    },
  ];

  // Combine and sort actions, adding default styling to AI recommendations
  const quickActions: QuickAction[] = [
    ...(aiRecommendations?.actions.map((action) => ({
      ...action,
      color: "text-primary",
      bgColor: "bg-primary/10",
    })) || []),
    ...defaultQuickActions,
  ].sort((a, b) => b.priority - a.priority);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>AI-powered recommendations based on your recent activities</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-[125px] w-full rounded-lg" />
            </div>
          ))
        ) : (
          quickActions.map((action) => {
            const Icon = iconMap[action.icon];
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
          })
        )}
      </CardContent>
    </Card>
  );
}