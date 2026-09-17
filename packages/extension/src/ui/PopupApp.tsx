import React from "react";
import { StorageProvider, useStorage } from "./state/StorageContext.js";
import { useTheme } from "./hooks/useTheme.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { Icon } from "./components/Icons.js";
import { browser } from "../platform/browserApi.js";

function openDashboard(hash = "") {
  void browser.tabs.create({ url: browser.runtime.getURL(`dashboard.html${hash}`) });
}

function PopupShell() {
  const { settings, loading } = useStorage();
  useTheme();

  if (loading) {
    return (
      <div className="af-popup af-popup-main">
        <div className="af-skeleton" style={{ height: 24, width: 140 }} />
        <div className="af-skeleton af-mt-4" style={{ height: 140 }} />
      </div>
    );
  }

  if (!settings.onboardingCompleted) {
    return (
      <div className="af-popup af-popup-main af-flex-col af-gap-3" style={{ textAlign: "center", paddingTop: 40 }}>
        <div className="af-sidebar-brand-mark" style={{ margin: "0 auto" }}>
          <Icon name="leaf" size={15} strokeWidth={2} />
        </div>
        <h1 className="af-h1" style={{ fontSize: 17 }}>
          Welcome to Treco
        </h1>
        <p className="af-subtitle">Let's set up which AI products to monitor.</p>
        <button className="af-btn af-btn-primary af-btn-block" onClick={() => openDashboard("#/onboarding")}>
          Get started
        </button>
      </div>
    );
  }

  return (
    <div className="af-popup af-popup-main">
      <div className="af-row af-mb-3">
        <span style={{ fontWeight: 650, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="af-sidebar-brand-mark" style={{ width: 20, height: 20 }}>
            <Icon name="leaf" size={12} strokeWidth={2.2} />
          </span>
          Treco
        </span>
        <button className="af-btn af-btn-secondary" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => openDashboard()}>
          Open dashboard
        </button>
      </div>
      <DashboardPage compact />
    </div>
  );
}

export function PopupApp() {
  return (
    <StorageProvider>
      <PopupShell />
    </StorageProvider>
  );
}
