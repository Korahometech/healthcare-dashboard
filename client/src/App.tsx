import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import Appointments from "@/pages/appointments";
import Patients from "@/pages/patients";
import CarePlans from "@/pages/care-plans";
import GeneticProfiles from "@/pages/genetic-profiles";
import NotFound from "@/pages/not-found";
import Layout from "@/components/ui/layout";

function Router() {
  const { user, isLoading, error } = useUser();
  const { toast } = useToast();

  // Handle authentication errors
  if (error) {
    toast({
      title: "Authentication Error",
      description: error.message,
      variant: "destructive",
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, show auth page
  if (!user) {
    return <AuthPage />;
  }

  // If authenticated, show main app layout with routes
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/patients" component={Patients} />
        <Route path="/care-plans" component={CarePlans} />
        <Route path="/genetic-profiles" component={GeneticProfiles} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;