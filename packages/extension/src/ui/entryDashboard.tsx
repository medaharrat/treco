import React from "react";
import { createRoot } from "react-dom/client";
import { DashboardApp } from "./DashboardApp.js";
import "../styles/index.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <DashboardApp />
    </React.StrictMode>
  );
}
