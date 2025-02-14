import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AmplifyProvider } from "@/components/providers/amplify-provider";
import { MoodProvider } from "@/hooks/use-mood";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import Appointments from "@/pages/appointments";
import Patients from "@/pages/patients";
import PatientDetails from "@/pages/patient-details";
import Doctors from "@/pages/doctors";
import CarePlans from "@/pages/care-plans";
import GeneticProfiles from "@/pages/genetic-profiles";
import DocumentTranslation from "@/pages/document-translation";
import NotFound from "@/pages/not-found";
import Layout from "@/components/ui/layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/patients" component={Patients} />
        <Route path="/patients/:id" component={PatientDetails} />
        <Route path="/doctors" component={Doctors} />
        <Route path="/care-plans" component={CarePlans} />
        <Route path="/genetic-profiles" component={GeneticProfiles} />
        <Route path="/document-translation" component={DocumentTranslation} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <MoodProvider>
      <AmplifyProvider>
        <QueryClientProvider client={queryClient}>
          <Router />
          <Toaster />
        </QueryClientProvider>
      </AmplifyProvider>
    </MoodProvider>
  );
}

export default App;