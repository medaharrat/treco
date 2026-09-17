import React from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { StorageProvider, useStorage } from "./state/StorageContext.js";
import { useTheme } from "./hooks/useTheme.js";
import { Sidebar } from "./components/Sidebar.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { ProvidersPage } from "./pages/ProvidersPage.js";
import { ProviderDetailPage } from "./pages/ProviderDetailPage.js";
import { ModelsPage } from "./pages/ModelsPage.js";
import { HistoryPage } from "./pages/HistoryPage.js";
import { InsightsPage } from "./pages/InsightsPage.js";
import { GoalsPage } from "./pages/GoalsPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { MethodologyPage } from "./pages/MethodologyPage.js";
import { PrivacyPage } from "./pages/PrivacyPage.js";
import { OnboardingPage } from "./pages/OnboardingPage.js";

function Gate({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useStorage();
  const location = useLocation();

  if (loading) return null;
  if (!settings.onboardingCompleted && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

function Shell() {
  const location = useLocation();
  useTheme();

  if (location.pathname === "/onboarding") {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Routes>
    );
  }

  return (
    <Gate>
      <div className="af-app">
        <Sidebar />
        <main className="af-main af-scroll">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/providers" element={<ProvidersPage />} />
            <Route path="/providers/:providerId" element={<ProviderDetailPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Gate>
  );
}

export function DashboardApp() {
  return (
    <StorageProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </StorageProvider>
  );
}
