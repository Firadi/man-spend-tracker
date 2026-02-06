import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Analyse from "@/pages/Analyse";
import Simulation from "@/pages/Simulation";
import Products from "@/pages/Products";
import Countries from "@/pages/Countries";
import AuthPage from "@/pages/AuthPage";
import { useStore } from "@/lib/store";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function AppContent() {
  const { user, isLoading } = useAuth();
  const fetchData = useStore((state) => state.fetchData);
  const [location] = useLocation();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    if (location !== "/auth") {
      return <Redirect to="/auth" />;
    }
    return <AuthPage />;
  }

  if (location === "/auth") {
    return <Redirect to="/" />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/analyse" component={Analyse} />
        <Route path="/simulation" component={Simulation} />
        <Route path="/products" component={Products} />
        <Route path="/countries" component={Countries} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <AppContent />
    </TooltipProvider>
  );
}

function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default AppWrapper;
