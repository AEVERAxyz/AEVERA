import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { OnchainProviders } from "./OnchainProviders";

import Home from "@/pages/Home";
import CapsulePage from "@/pages/Capsule";
import NotFound from "@/pages/NotFound";
// 1. HIER IMPORT HINZUFÜGEN:
import DeveloperDetail from "@/pages/DeveloperDetail"; 

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/capsule/:id" component={CapsulePage} />

      {/* 2. HIER ROUTE HINZUFÜGEN: */}
      <Route path="/developers" component={DeveloperDetail} />

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <OnchainProviders>
      <Router />
      <Toaster />
    </OnchainProviders>
  );
}