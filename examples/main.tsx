import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "virtual:example-app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
