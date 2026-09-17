import { describe, it, expect } from "vitest";
import { formatMass, formatVolume, formatEnergy, formatCount } from "../src/ui/format.js";

describe("formatMass", () => {
  it("never silently rounds a real, small amount down to 0 g", () => {
    expect(formatMass(0.125)).not.toBe("0 g");
    expect(formatMass(0.125)).toBe("0.13 g");
    expect(formatMass(0.32)).toBe("0.32 g");
  });

  it("shows one decimal for amounts between 1 and 10 g", () => {
    expect(formatMass(4.2)).toBe("4.2 g");
  });

  it("rounds to a whole gram once the amount is comfortably above the false-zero range", () => {
    expect(formatMass(42.7)).toBe("43 g");
  });

  it("only shows exactly 0 g for actual zero", () => {
    expect(formatMass(0)).toBe("0 g");
  });

  it("switches to kg above 1000 g", () => {
    expect(formatMass(1500)).toBe("1.50 kg");
  });
});

describe("formatVolume", () => {
  it("never silently rounds a real, small amount down to 0 mL", () => {
    expect(formatVolume(0.32)).not.toBe("0 mL");
    expect(formatVolume(0.32)).toBe("0.32 mL");
  });

  it("shows one decimal for amounts between 1 and 10 mL", () => {
    expect(formatVolume(4.2)).toBe("4.2 mL");
  });

  it("rounds to a whole mL once comfortably above the false-zero range", () => {
    expect(formatVolume(42.7)).toBe("43 mL");
  });

  it("only shows exactly 0 mL for actual zero", () => {
    expect(formatVolume(0)).toBe("0 mL");
  });

  it("switches to L above 1000 mL", () => {
    expect(formatVolume(1500)).toBe("1.50 L");
  });
});

describe("formatEnergy / formatCount sanity (regression guard for the same class of bug)", () => {
  it("formatEnergy already preserves sub-10 Wh precision", () => {
    expect(formatEnergy(0.34)).toBe("0.3 Wh");
  });

  it("formatCount never collapses a real interaction count to 0", () => {
    expect(formatCount(1)).toBe("1");
  });
});
