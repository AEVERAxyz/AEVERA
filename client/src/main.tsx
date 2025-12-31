import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css"; // Deine Datei mit den @tailwind Regeln MUSS zuerst kommen
import { OnchainProviders } from "./OnchainProviders";
import "@coinbase/onchainkit/styles.css"; // Die OnchainKit Styles danach

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OnchainProviders>
      <App />
    </OnchainProviders>
  </StrictMode>
);