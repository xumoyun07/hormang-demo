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

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );
}

function dashboardFor(role: "buyer" | "provider") {
  return role === "buyer" ? "/dashboard/buyer" : "/dashboard/provider";
}

function PublicOnlyRoute({ component: Component }: { component: React.FC }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) return <Spinner />;

  if (user) {
    setLocation(dashboardFor(user.role));
    return null;
  }

  return <Component />;
}

function ProtectedRoute({ component: Component, role }: { component: React.FC; role?: "buyer" | "provider" }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) return <Spinner />;

  if (!user) {
    setLocation("/auth/login");
    return null;
  }

  if (role && user.role !== role) {
    setLocation(dashboardFor(user.role));
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => <PublicOnlyRoute component={LandingPage} />}
      </Route>
      <Route path="/auth/role">
        {() => <PublicOnlyRoute component={RoleSelectPage} />}
      </Route>
      <Route path="/auth/login">
        {() => <PublicOnlyRoute component={LoginPage} />}
      </Route>
      <Route path="/auth/register">
        {() => <PublicOnlyRoute component={RegisterPage} />}
      </Route>
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
