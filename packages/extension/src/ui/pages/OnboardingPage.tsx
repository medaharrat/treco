import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PROVIDER_REGISTRY } from "@ai-footprint/core";
import { useStorage } from "../state/StorageContext.js";
import { Icon, type IconName } from "../components/Icons.js";
import { BrandIcon, hasBrandIcon } from "../components/BrandIcons.js";

interface IntroStep {
  icon: IconName;
  eyebrow: string;
  title: string;
  body: string;
}

const INTRO_STEPS: IntroStep[] = [
  {
    icon: "leaf",
    eyebrow: "Why Treco exists",
    title: "Every AI reply has a footprint.",
    body: "Running AI models consumes real energy and water, and produces real emissions - but it's invisible in the moment. Treco makes it visible for the AI you actually use, every day."
  },
  {
    icon: "shield",
    eyebrow: "How it helps",
    title: "Clear insights, zero data collection.",
    body: "Treco estimates your tokens, energy, CO2e and water use entirely on your device - trends, goals, plain-language insights. It never reads your conversations, and nothing is ever sent to a server, because there isn't one."
  }
];

const TOTAL_STEPS = INTRO_STEPS.length + 1;

/** Fallback for the one provider with no verifiable brand mark available anywhere (see BrandIcons.tsx). */
const PROVIDER_MONOGRAMS: Record<string, string> = {
  characterai: "AI"
};

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const { settings, updateSettings } = useStorage();
  const [selected, setSelected] = useState<Set<string>>(new Set(PROVIDER_REGISTRY.map((p) => p.id)));
  const navigate = useNavigate();

  const isIntegrationsStep = step === INTRO_STEPS.length;

  async function finish() {
    await updateSettings({ enabledProviders: Array.from(selected), onboardingCompleted: true });
    navigate("/");
  }

  function toggleProvider(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  const intro = INTRO_STEPS[step];

  return (
    <div className="af-onboarding">
      <div className="af-onboarding-glow" aria-hidden />
      <div className="af-onboarding-glow-2" aria-hidden />

      <div className="af-onboarding-content">
        <div className="af-onboarding-dots" role="tablist" aria-label="Onboarding progress">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span key={i} className={`af-onboarding-dot${i === step ? " active" : ""}`} />
          ))}
        </div>

        {!isIntegrationsStep && intro ? (
          <>
            <div className="af-onboarding-icon">
              <Icon name={intro.icon} size={30} strokeWidth={1.8} />
            </div>
            <div className="af-onboarding-eyebrow">{intro.eyebrow}</div>
            <h1 className="af-onboarding-title">{intro.title}</h1>
            <p className="af-onboarding-body">{intro.body}</p>

            <div className="af-onboarding-actions">
              <button className="af-btn af-btn-primary af-btn-block" onClick={() => setStep(step + 1)}>
                Continue
              </button>
              {step > 0 && (
                <button className="af-onboarding-back" onClick={() => setStep(step - 1)}>
                  Back
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="af-onboarding-icon">
              <Icon name="globe" size={30} strokeWidth={1.8} />
            </div>
            <div className="af-onboarding-eyebrow">Integrations</div>
            <h1 className="af-onboarding-title">Works where you already chat.</h1>
            <p className="af-onboarding-body">
              Choose which AI products to monitor - only enabled ones are ever observed. You can change this anytime
              in Settings.
            </p>

            <div className="af-onboarding-grid">
              {PROVIDER_REGISTRY.map((p) => {
                const isSelected = selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`af-onboarding-tile${isSelected ? " selected" : ""}`}
                    onClick={() => toggleProvider(p.id)}
                    aria-pressed={isSelected}
                  >
                    {isSelected && (
                      <span className="af-onboarding-tile-check">
                        <Icon name="check" size={10} strokeWidth={3} />
                      </span>
                    )}
                    <span className="af-onboarding-tile-icon" style={{ background: p.color }}>
                      {hasBrandIcon(p.id) ? (
                        <BrandIcon providerId={p.id} size={18} />
                      ) : (
                        (PROVIDER_MONOGRAMS[p.id] ?? p.name.charAt(0))
                      )}
                    </span>
                    <span className="af-onboarding-tile-name">{p.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="af-onboarding-actions">
              <button className="af-btn af-btn-primary af-btn-block" onClick={finish}>
                Get Started
              </button>
              <button className="af-onboarding-back" onClick={() => setStep(step - 1)}>
                Back
              </button>
            </div>
          </>
        )}

        {settings.onboardingCompleted && (
          <p className="af-muted af-mt-5" style={{ fontSize: 12 }}>
            You've already completed onboarding - you can safely close this tab, or continue to adjust your provider
            selection.
          </p>
        )}
      </div>
    </div>
  );
}
