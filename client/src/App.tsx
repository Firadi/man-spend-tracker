import { Switch, Route } from "wouter";
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
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/:rest*">
        {(params) => (
          <Layout>
            <Switch>
              <ProtectedRoute path="/" component={Dashboard} />
              <ProtectedRoute path="/analyse" component={Analyse} />
              <ProtectedRoute path="/simulation" component={Simulation} />
              <ProtectedRoute path="/products" component={Products} />
              <ProtectedRoute path="/countries" component={Countries} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  const { user } = useAuth();
  const fetchData = useStore((state) => state.fetchData);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  return (
    <TooltipProvider>
      <Toaster />
      <Router />
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
