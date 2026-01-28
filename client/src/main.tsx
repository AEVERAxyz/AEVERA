import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Wir nutzen das SDK, das in den Base Docs steht (und in deiner package.json schon drin ist)
import { sdk } from "@farcaster/miniapp-sdk";

// RAINBOWKIT & WAGMI STYLES
import '@rainbow-me/rainbowkit/styles.css';

// Step 2: Trigger App Display (Base/Farcaster Standard)
// Laut Docs: "Call sdk.actions.ready() once your app has loaded"
sdk.actions.ready();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);