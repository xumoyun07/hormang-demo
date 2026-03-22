import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import RoleSelectPage from "@/pages/auth/role-select";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import BuyerDashboard from "@/pages/dashboard/buyer";
import ProviderDashboard from "@/pages/dashboard/provider";
import ProfileSettingsPage from "@/pages/profile/settings";
import ProviderProfilePage from "@/pages/providers/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

function ProtectedRoute({ component: Component, role }: { component: React.FC; role?: "buyer" | "provider" }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );

  if (!user) {
    setLocation("/auth/login");
    return null;
  }

  if (role && user.role !== role) {
    setLocation(user.role === "buyer" ? "/dashboard/buyer" : "/dashboard/provider");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth/role" component={RoleSelectPage} />
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/dashboard/buyer">
        {() => <ProtectedRoute component={BuyerDashboard} role="buyer" />}
      </Route>
      <Route path="/dashboard/provider">
        {() => <ProtectedRoute component={ProviderDashboard} role="provider" />}
      </Route>
      <Route path="/profile/settings">
        {() => <ProtectedRoute component={ProfileSettingsPage} />}
      </Route>
      <Route path="/providers/:id" component={ProviderProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
