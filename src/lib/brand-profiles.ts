import { DEFAULT_BRAND, type BrandState } from "@/lib/brand-theme";

export type BrandProfile = {
  id: string;
  name: string;
  state: BrandState;
  active: boolean;
  updatedAt: string;
};

export function activateProfile(profiles: BrandProfile[], activeId: string, state: BrandState) {
  return profiles.map((profile) =>
    profile.id === activeId
      ? { ...profile, name: state.name, state, active: true, updatedAt: "Agora" }
      : { ...profile, active: false },
  );
}

export function createDefaultProfile(id: string, name: string): BrandProfile {
  return {
    id,
    name,
    state: { ...DEFAULT_BRAND, name },
    active: false,
    updatedAt: "Agora",
  };
}