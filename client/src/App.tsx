import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NeynarContextProvider, Theme } from "@neynar/react";
import "@neynar/react/dist/style.css";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CapsulePage from "@/pages/capsule";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/capsule/:id">
        {(params) => <CapsulePage id={params.id} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const neynarClientId = import.meta.env.VITE_NEYNAR_CLIENT_ID || "";

  return (
    <NeynarContextProvider
      settings={{
        clientId: neynarClientId,
        defaultTheme: Theme.Dark,
        eventsCallbacks: {
          onAuthSuccess: () => {
            console.log("Farcaster auth success");
          },
          onSignout: () => {
            console.log("Farcaster signout");
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </NeynarContextProvider>
  );
}

export default App;
