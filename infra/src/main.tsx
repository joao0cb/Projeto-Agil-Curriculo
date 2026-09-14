import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider } from "@convex-dev/react";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider>
      <App />
    </ConvexProvider>
  </React.StrictMode>
);
