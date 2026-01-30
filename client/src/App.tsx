import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { OnchainProviders } from "./OnchainProviders";

import Home from "@/pages/Home";
import CapsulePage from "@/pages/Capsule";
import NotFound from "@/pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/capsule/:id" component={CapsulePage} />
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