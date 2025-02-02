import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AmplifyProvider } from "@/components/providers/amplify-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import Appointments from "@/pages/appointments";
import Patients from "@/pages/patients";
import PatientDetails from "@/pages/patient-details";
import Doctors from "@/pages/doctors";
import CarePlans from "@/pages/care-plans";
import GeneticProfiles from "@/pages/genetic-profiles";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import Layout from "@/components/ui/layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/" component={Dashboard} />
        <ProtectedRoute path="/analytics" component={Analytics} />
        <ProtectedRoute path="/appointments" component={Appointments} />
        <ProtectedRoute path="/patients" component={Patients} />
        <ProtectedRoute path="/patients/:id" component={PatientDetails} />
        <ProtectedRoute path="/doctors" component={Doctors} />
        <ProtectedRoute path="/care-plans" component={CarePlans} />
        <ProtectedRoute path="/genetic-profiles" component={GeneticProfiles} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <AmplifyProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </AmplifyProvider>
  );
}

export default App;