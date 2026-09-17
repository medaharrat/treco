import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PROVIDER_REGISTRY } from "@ai-footprint/core";
import { useStorage } from "../state/StorageContext.js";
import { Toggle } from "../components/Toggle.js";

const SCREENS = [
  {
    title: "Understand your AI footprint.",
    body: "AI Footprint shows you how much you're using AI, and estimates the energy, CO2e and water associated with that usage - right on your device."
  },
  {
    title: "We track usage, not conversations.",
    body: "AI Footprint never reads or stores your prompts or responses. It only measures things like token count estimates, timestamps and which model you used."
  },
  {
    title: "Your data stays on your device.",
    body: "There's no account, no server, and no sync by default. Everything is stored locally, and you can export or delete it at any time."
  }
];

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const { settings, updateSettings } = useStorage();
  const [selected, setSelected] = useState<Set<string>>(new Set(PROVIDER_REGISTRY.map((p) => p.id)));
  const navigate = useNavigate();

  const isProviderStep = step === SCREENS.length;
  const isLast = step === SCREENS.length;

  async function finish() {
    await updateSettings({ enabledProviders: Array.from(selected), onboardingCompleted: true });
    navigate("/");
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "64px 24px", textAlign: isProviderStep ? "left" : "center" }}>
      {!isProviderStep ? (
        <>
          <div className="af-eyebrow af-mb-3">
            Step {step + 1} of {SCREENS.length + 1}
          </div>
          <h1 className="af-h1" style={{ fontSize: 28 }}>
            {SCREENS[step]?.title}
          </h1>
          <p className="af-subtitle" style={{ fontSize: 15, maxWidth: 440, margin: "0 auto 32px" }}>
            {SCREENS[step]?.body}
          </p>
          <button className="af-btn af-btn-primary" onClick={() => setStep(step + 1)}>
            Continue
          </button>
        </>
      ) : (
        <>
          <div className="af-eyebrow af-mb-3" style={{ textAlign: "center" }}>
            Step {SCREENS.length + 1} of {SCREENS.length + 1}
          </div>
          <h1 className="af-h1" style={{ textAlign: "center", fontSize: 26 }}>
            Choose which AI websites to monitor.
          </h1>
          <p className="af-subtitle" style={{ textAlign: "center" }}>
            Only enabled products are ever observed. You can change this anytime in Settings.
          </p>
          <div className="af-card" style={{ marginTop: 24 }}>
            {PROVIDER_REGISTRY.map((p) => (
              <div key={p.id} className="af-toggle-row">
                <span>{p.name}</span>
                <Toggle
                  on={selected.has(p.id)}
                  onChange={(on) => {
                    const next = new Set(selected);
                    if (on) next.add(p.id);
                    else next.delete(p.id);
                    setSelected(next);
                  }}
                  label={`Monitor ${p.name}`}
                />
              </div>
            ))}
          </div>
          <div className="af-row af-mt-5">
            <button className="af-btn af-btn-secondary" onClick={() => setStep(step - 1)}>
              Back
            </button>
            <button className="af-btn af-btn-primary" onClick={finish}>
              Start using AI Footprint
            </button>
          </div>
        </>
      )}
      {!isLast && step > 0 && !isProviderStep && (
        <button className="af-btn af-btn-secondary af-mt-3" onClick={() => setStep(step - 1)}>
          Back
        </button>
      )}
      {settings.onboardingCompleted && (
        <p className="af-muted af-mt-5" style={{ fontSize: 12 }}>
          You've already completed onboarding - you can safely close this tab, or continue to adjust your provider selection.
        </p>
      )}
    </div>
  );
}
