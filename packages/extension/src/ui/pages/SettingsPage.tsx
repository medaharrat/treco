import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PROVIDER_REGISTRY, exportEventsAsCSV, exportEventsAsJSON, getGlobalDefaultAssumptions, parseImportedJSON } from "@ai-footprint/core";
import { useStorage } from "../state/StorageContext.js";
import { Card } from "../components/Card.js";
import { Toggle } from "../components/Toggle.js";
import { Icon } from "../components/Icons.js";

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SettingsPage() {
  const { events, settings, updateSettings, clearAllData, importEvents } = useStorage();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaults = getGlobalDefaultAssumptions();

  function toggleProvider(id: string, on: boolean) {
    const next = on
      ? Array.from(new Set([...settings.enabledProviders, id]))
      : settings.enabledProviders.filter((p) => p !== id);
    void updateSettings({ enabledProviders: next });
  }

  async function handleImportFile(file: File) {
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = parseImportedJSON(text);
      await importEvents([...events, ...parsed]);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not import this file.");
    }
  }

  return (
    <div>
      <h1 className="af-h1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="settings" size={19} strokeWidth={2} />
        Settings
      </h1>
      <p className="af-subtitle">Everything here is stored locally on this device.</p>

      <Card>
        <h2 className="af-h2">Privacy</h2>
        <p className="af-muted" style={{ fontSize: 13 }}>
          Treco never reads or stores your prompts, responses, or any page content beyond a rendered text length used to
          estimate token counts. No account is required, and nothing is sent to any server.
        </p>
        <Link to="/privacy" className="af-btn af-btn-secondary af-mt-3" style={{ display: "inline-flex" }}>
          Read the full privacy page
        </Link>
      </Card>

      <Card>
        <h2 className="af-h2">Providers</h2>
        <p className="af-muted" style={{ fontSize: 13, marginTop: 0 }}>
          Only enabled providers are ever observed. Content scripts don't even activate on disabled providers' pages.
        </p>
        {PROVIDER_REGISTRY.map((p) => (
          <div key={p.id} className="af-toggle-row">
            <span>{p.name}</span>
            <Toggle on={settings.enabledProviders.includes(p.id)} onChange={(on) => toggleProvider(p.id, on)} label={`Monitor ${p.name}`} />
          </div>
        ))}
      </Card>

      <Card>
        <h2 className="af-h2">Units</h2>
        <div className="af-field" style={{ maxWidth: 220 }}>
          <label htmlFor="units-select">Measurement units</label>
          <select
            id="units-select"
            className="af-select"
            value={settings.units}
            onChange={(e) => void updateSettings({ units: e.target.value as "metric" | "imperial" })}
          >
            <option value="metric">Metric (kg, L)</option>
            <option value="imperial">Imperial (lb, gal)</option>
          </select>
        </div>
      </Card>

      <Card>
        <h2 className="af-h2">Theme</h2>
        <div className="af-field" style={{ maxWidth: 220 }}>
          <label htmlFor="theme-select">Appearance</label>
          <select
            id="theme-select"
            className="af-select"
            value={settings.theme}
            onChange={(e) => void updateSettings({ theme: e.target.value as "system" | "light" | "dark" })}
          >
            <option value="system">Match system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </Card>

      <Card>
        <h2 className="af-h2">Environmental methodology</h2>
        <p className="af-muted" style={{ fontSize: 13, marginTop: 0 }}>
          Estimates use published, model-specific figures where available and clearly-labeled fallback tiers otherwise. Nothing is
          presented as an exact measurement.
        </p>
        <div className="af-field">
          <label htmlFor="carbon-override">Grid carbon intensity override (g CO2e / kWh)</label>
          <input
            id="carbon-override"
            className="af-input"
            type="number"
            min="0"
            placeholder={`Default: ${defaults.carbonIntensityGPerKwh} (global average)`}
            value={settings.carbonIntensityOverrideGPerKwh ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              void updateSettings({ carbonIntensityOverrideGPerKwh: v === "" ? null : Number(v) });
            }}
          />
        </div>
        <p className="af-muted" style={{ fontSize: 12 }}>
          If you know your local grid's carbon intensity (for example, from your electricity provider), entering it here makes CO2e
          estimates more relevant to where you live.
        </p>
        <Link to="/methodology" className="af-btn af-btn-secondary af-mt-2" style={{ display: "inline-flex" }}>
          View full methodology &amp; sources
        </Link>
      </Card>

      <Card>
        <h2 className="af-h2">Data storage</h2>
        <p className="af-muted" style={{ fontSize: 13 }}>
          {events.length.toLocaleString()} interaction{events.length === 1 ? "" : "s"} stored locally on this device.
        </p>
        <div className="af-row af-gap-2" style={{ justifyContent: "flex-start" }}>
          <button className="af-btn af-btn-secondary" onClick={() => downloadFile("ai-footprint-export.json", exportEventsAsJSON(events), "application/json")}>
            Export as JSON
          </button>
          <button className="af-btn af-btn-secondary" onClick={() => downloadFile("ai-footprint-export.csv", exportEventsAsCSV(events), "text/csv")}>
            Export as CSV
          </button>
          <button className="af-btn af-btn-secondary" onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {importError && (
          <p style={{ color: "var(--af-danger)", fontSize: 12.5 }} className="af-mt-2">
            {importError}
          </p>
        )}

        <div className="af-mt-4" style={{ borderTop: "1px solid var(--af-border-soft)", paddingTop: 16 }}>
          {!confirmingDelete ? (
            <button className="af-btn af-btn-danger" onClick={() => setConfirmingDelete(true)}>
              Delete all usage history
            </button>
          ) : (
            <div className="af-flex-col af-gap-2">
              <p style={{ fontSize: 13 }}>
                This permanently deletes all locally stored usage history (every recorded interaction). Your goals and
                settings are not affected. This cannot be undone.
              </p>
              <div className="af-row af-gap-2" style={{ justifyContent: "flex-start" }}>
                <button
                  className="af-btn af-btn-danger"
                  onClick={() => {
                    void clearAllData();
                    setConfirmingDelete(false);
                  }}
                >
                  Yes, delete usage history
                </button>
                <button className="af-btn af-btn-secondary" onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="af-h2">About</h2>
        <p className="af-muted" style={{ fontSize: 13 }}>
          Treco v0.1.0. Open source, privacy-first, offline-first. Built to help you understand AI usage without collecting
          any of it.
        </p>
      </Card>

      <Card>
        <h2 className="af-h2">Legal & Support</h2>
        <div className="af-legal-list">
          <Link className="af-legal-list-item" to="/legal/privacy-policy">
            <Icon name="shield" size={16} strokeWidth={1.8} />
            Privacy Policy
            <Icon name="chevronRight" size={15} strokeWidth={2} className="af-legal-list-item-arrow" />
          </Link>
          <Link className="af-legal-list-item" to="/legal/terms">
            <Icon name="file" size={16} strokeWidth={1.8} />
            Terms of Use
            <Icon name="chevronRight" size={15} strokeWidth={2} className="af-legal-list-item-arrow" />
          </Link>
          <Link className="af-legal-list-item" to="/legal/contact">
            <Icon name="mail" size={16} strokeWidth={1.8} />
            Contact & Support
            <Icon name="chevronRight" size={15} strokeWidth={2} className="af-legal-list-item-arrow" />
          </Link>
          <Link className="af-legal-list-item" to="/legal/licenses">
            <Icon name="layers" size={16} strokeWidth={1.8} />
            Open Source & Licenses
            <Icon name="chevronRight" size={15} strokeWidth={2} className="af-legal-list-item-arrow" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
