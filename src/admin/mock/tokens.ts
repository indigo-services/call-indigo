/**
 * Mock fixtures for the admin dashboard (PRD §9.1, §10, §11).
 *
 * All values are verified [M] against:
 *   - valvoro-prototype/GROUND_TRUTH-source-facts.txt (site facts)
 *   - valvoro-prototype/index.html:22-84 (design tokens, PRD §3.2)
 *
 * This is a MOCK. No data is fetched. No data is persisted. Reloading
 * discards all state (PRD §9.1).
 */

// ── Site facts (PRD §10 — seeded from GROUND_TRUTH-source-facts.txt) ──────
export const siteFacts = {
  brandName: "Call Indigo",
  legalName: "Indigo Home & Facility Services",
  primaryPhone: "(512) 608-4999",
  publicEmail: "support@call-indigo.com",
  address: "1005 Meredith Drive, Austin, TX 78748",
  headquartersCity: "Austin, TX",
  establishedYear: "2012",
  serviceArea: "Hays, Travis, and Williamson counties",
  serviceAreaCities: ["Austin", "Buda", "Kyle", "San Marcos"],
  licenseNumber: "RMP: 45574",
  copyrightName: "Call Indigo LLC",
} as const

// ── Design tokens (PRD §3.2, §11.3 — verbatim from index.html @theme) ──────
export const designTokens = [
  // Brand
  { token: "--color-brand",       hex: "#2a5aa2",           role: "Primary blue",                  group: "Brand" },
  { token: "--color-brand-deep",  hex: "#154d9f",           role: "Deeper blue",                   group: "Brand" },
  { token: "--color-ink",         hex: "#121b3c",           role: "Headings",                      group: "Brand" },
  { token: "--color-ink-2",       hex: "#091f41",           role: "Dark slab / footer",            group: "Brand" },
  { token: "--color-topbar",      hex: "#091f41",           role: "Utility bar",                   group: "Brand" },
  // Accents
  { token: "--color-sky",         hex: "#30c3eb",           role: "Primary accent — eyebrows, CTA",group: "Accents" },
  { token: "--color-sky-soft",    hex: "#aed8f1",           role: "Accent, muted",                 group: "Accents" },
  // Neutrals
  { token: "--color-mist",        hex: "#f4f8fe",           role: "Light surface",                 group: "Neutrals" },
  { token: "--color-line",        hex: "#e3e8f2",           role: "Borders",                       group: "Neutrals" },
  { token: "--color-body",        hex: "#696969",           role: "Body copy",                     group: "Neutrals" },
  { token: "--color-secondary",   hex: "#ffffff",           role: "White",                         group: "Neutrals" },
  // Semantic
  { token: "--color-star",        hex: "#e9bd4b",           role: "Rating accent",                 group: "Semantic" },
  { token: "--color-ring",        hex: "#a8cdf0",           role: "Focus ring",                    group: "Semantic" },
  // Scrim
  { token: "--color-scrim-hero",  hex: "rgb(25 80 160 / 88%)", role: "Hero photo scrim",          group: "Scrim" },
  { token: "--color-scrim-blue",  hex: "rgb(42 90 162 / 90%)", role: "Estimate/area/CTA scrims",  group: "Scrim" },
] as const

// ── Standard accents (PRD §11.4) ──────────────────────────────────────────
export const accentTokens = [
  { token: "--color-sky",        hex: "#30c3eb", role: "Primary accent — eyebrows, pill CTA, checkmarks" },
  { token: "--color-brand",       hex: "#2a5aa2", role: "Structural blue — slabs, scrims" },
  { token: "--color-brand-deep",  hex: "#154d9f", role: "Deeper blue — dark surfaces" },
  { token: "--color-ink-2",       hex: "#091f41", role: "Dark accent — footer, top bar, CTA slabs" },
  { token: "--color-star",       hex: "#e9bd4b", role: "Rating accent — stars only" },
] as const

// ── Segment accents (PRD §11.5 — assigned from existing palette) ──────────
export const segmentAccents = [
  {
    segment: "Residential",
    token: "--color-accent-residential",
    hex: "#30c3eb",
    surface: "Residential pages already lead with the sky accent (9 bg-sky vs commercial's 3)",
  },
  {
    segment: "Commercial",
    token: "--color-accent-commercial",
    hex: "#154d9f",
    surface: "Commercial pages lean on the deeper blue surfaces (3 bg-sky vs residential's 9)",
  },
] as const
