import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout, DashboardPanel } from "@/components/ui/dashboard-layout";
import { CardSkeleton, StatsCardSkeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";

function Dashboard() {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">
            Monitor your healthcare platform
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={0}
          icon={<Users className="h-4 w-4" />}
          description="Registered users"
        />
      </div>

      <DashboardLayout defaultSizes={[40, 60]}>
        <DashboardPanel>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">System Status</h2>
              <p className="text-xs text-muted-foreground">Current system health</p>
            </div>
            <Card className="p-6">
              <p>System is running normally</p>
            </Card>
          </div>
        </DashboardPanel>
        <DashboardPanel>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Activity</h2>
                <p className="text-xs text-muted-foreground">Recent system activity</p>
              </div>
            </div>
            <Card className="p-6">
              <p>No recent activity</p>
            </Card>
          </div>
        </DashboardPanel>
      </DashboardLayout>
    </div>
  );
}

export default Dashboard;