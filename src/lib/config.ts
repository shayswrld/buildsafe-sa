export interface FeeConfig {
  platformName: string;
  buyerTrustFeePct: number;
  workerLabourCommissionPct: number;
  repeatClientCommissionPct: number;
  sapsVettingFeeZar: number;
  defaultCallOutZar: number;
}

export const DEFAULT_PLATFORM_CONFIG: FeeConfig = {
  platformName: "BuildSafe SA",
  buyerTrustFeePct: 0.05, // 5% buyer trust & escrow fee on labour
  workerLabourCommissionPct: 0.08, // 8% platform commission on labour (0% on hardware material slips)
  repeatClientCommissionPct: 0.04, // 4% loyalty rate on repeat bookings with the same homeowner
  sapsVettingFeeZar: 200, // HURU / AFISwitch biometric SAPS check fee
  defaultCallOutZar: 250, // Credited toward final job when hired
};

export interface TradeCategoryMeta {
  slug: string;
  label: string;
  shortDesc: string;
  defaultCallOutZar: number;
  cocBody?: "PIRB" | "ECB_WIREMAN" | "NHBRC" | "SAQCC_GAS";
  cocLabel?: string;
  commonProblems: { label: string; requiresCoC?: boolean }[];
}

export const TRADE_CATEGORIES: TradeCategoryMeta[] = [
  {
    slug: "PLUMBING",
    label: "Plumbing & Geysers",
    shortDesc: "Leaks, blocked drains, bathroom plumbing & PIRB geysers",
    defaultCallOutZar: 250,
    cocBody: "PIRB",
    cocLabel: "PIRB Licensed Plumber (Geyser / CoC)",
    commonProblems: [
      { label: "Leaking pipe, tap or toilet cistern" },
      { label: "Blocked drain or sink" },
      { label: "Bathroom / kitchen renovation plumbing" },
      { label: "JoJo water tank & pump hookup" },
      { label: "Burst geyser / new geyser install (PIRB CoC)", requiresCoC: true },
    ],
  },
  {
    slug: "ELECTRICAL",
    label: "Electrical & Backup Power",
    shortDesc: "Fault finding, plugs, lights, DB boards & ECB Wireman CoCs",
    defaultCallOutZar: 300,
    cocBody: "ECB_WIREMAN",
    cocLabel: "Dept. of Labour / ECB Wireman's License",
    commonProblems: [
      { label: "Light fixtures or spotlight replacement" },
      { label: "DB board tripping / earth leakage fault", requiresCoC: true },
      { label: "New plug points & wiring alterations", requiresCoC: true },
      { label: "Inverter / solar backup changeover (CoC)", requiresCoC: true },
      { label: "Property sale Electrical CoC inspection", requiresCoC: true },
    ],
  },
  {
    slug: "PAINTING",
    label: "Painting & Wall Prep",
    shortDesc: "Interior rooms, exterior boundary walls, damp prep & roofs",
    defaultCallOutZar: 200,
    commonProblems: [
      { label: "Paint interior bedrooms / living room" },
      { label: "Exterior house & boundary wall repaint" },
      { label: "Peeling damp wall scraping & crack filling" },
      { label: "Roof high-pressure clean & paint" },
    ],
  },
  {
    slug: "TILING",
    label: "Tiling & Screeding",
    shortDesc: "Bathrooms, kitchens, living areas & outdoor patio tiling",
    defaultCallOutZar: 200,
    commonProblems: [
      { label: "Full bathroom floor & wall retiling" },
      { label: "Kitchen floor or splashback tiling" },
      { label: "Lift old tiles & level floor screed" },
      { label: "Outdoor patio / stoep non-slip tiling" },
    ],
  },
  {
    slug: "BUILDING",
    label: "Building, Bricklaying & Plaster",
    shortDesc: "Boundary walls, alterations, plastering, rhinolite & paving",
    defaultCallOutZar: 250,
    cocBody: "NHBRC",
    cocLabel: "NHBRC Registered Structural Builder",
    commonProblems: [
      { label: "Boundary wall build or storm repair" },
      { label: "Internal wall plastering & rhinolite" },
      { label: "Driveway / courtyard brick paving" },
      { label: "Knock-through opening & lintel install" },
      { label: "Structural room extension (NHBRC)", requiresCoC: true },
    ],
  },
  {
    slug: "CARPENTRY",
    label: "Carpentry, Doors & Cupboards",
    shortDesc: "Hanging doors, locks, built-in cupboards, ceilings & decking",
    defaultCallOutZar: 200,
    commonProblems: [
      { label: "Hang interior or solid wooden exterior door" },
      { label: "Built-in cupboard hinges, drawers or shelving" },
      { label: "Ceiling board & cornice repair" },
      { label: "Wooden deck sanding & sealing" },
    ],
  },
  {
    slug: "WATERPROOFING",
    label: "Roofing & Waterproofing",
    shortDesc: "Roof leaks, torch-on membrane, flashing & gutters",
    defaultCallOutZar: 250,
    commonProblems: [
      { label: "Find & seal roof leak before rain" },
      { label: "Flat concrete roof torch-on waterproofing" },
      { label: "Parapet wall & ridge flashing seal" },
      { label: "Seamless gutter repair or cleaning" },
    ],
  },
];

export const SA_HARDWARE_HUBS = [
  "Builders Warehouse Fourways (Johannesburg)",
  "Builders Warehouse Strubensvalley (Roodepoort)",
  "Builders Warehouse Rivonia (Sandton)",
  "Cashbuild Bara / Soweto Hub (Johannesburg)",
  "Builders Warehouse Boksburg (East Rand)",
  "Builders Warehouse Centurion (Pretoria)",
  "Builders Warehouse Montague Gardens (Cape Town)",
  "Builders Warehouse Bellville (Cape Town)",
  "Builders Warehouse Riverhorse Valley (Durban)",
];

export const SA_LOCATIONS = [
  { suburb: "Fourways", city: "Johannesburg" },
  { suburb: "Randburg", city: "Johannesburg" },
  { suburb: "Sandton", city: "Johannesburg" },
  { suburb: "Soweto (Diepkloof)", city: "Johannesburg" },
  { suburb: "Roodepoort", city: "Johannesburg" },
  { suburb: "Boksburg", city: "Johannesburg" },
  { suburb: "Centurion", city: "Pretoria" },
  { suburb: "Menlyn / Faerie Glen", city: "Pretoria" },
  { suburb: "Bellville", city: "Cape Town" },
  { suburb: "Claremont", city: "Cape Town" },
  { suburb: "Milnerton", city: "Cape Town" },
  { suburb: "Umhlanga", city: "Durban" },
  { suburb: "Berea", city: "Durban" },
];

export function formatZar(amount: number): string {
  return `R${amount.toLocaleString("en-ZA", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
