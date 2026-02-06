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
import { useStore } from "@/lib/store";
import { useEffect } from "react";

function Router() {
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
  const seed = useStore((state) => state.seed);

  useEffect(() => {
    seed();
  }, [seed]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
