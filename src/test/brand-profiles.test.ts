import { describe, expect, it } from "vitest";

import { DEFAULT_BRAND } from "@/lib/brand-theme";
import { activateProfile, createDefaultProfile, type BrandProfile } from "@/lib/brand-profiles";

describe("visual identity profiles", () => {
  it("keeps exactly one profile active when applying another profile", () => {
    const profiles: BrandProfile[] = [
      { id: "one", name: "One", state: DEFAULT_BRAND, active: true, updatedAt: "Earlier" },
      { id: "two", name: "Two", state: DEFAULT_BRAND, active: false, updatedAt: "Earlier" },
    ];

    const result = activateProfile(profiles, "two", DEFAULT_BRAND);

    expect(result.filter((profile) => profile.active)).toHaveLength(1);
    expect(result.find((profile) => profile.id === "two")?.active).toBe(true);
  });

  it("starts a new profile with the AuditFlow default configuration", () => {
    const profile = createDefaultProfile("new", "Nova identidade");

    expect(profile.state.primary).toBe(DEFAULT_BRAND.primary);
    expect(profile.state.font).toBe(DEFAULT_BRAND.font);
  });
});