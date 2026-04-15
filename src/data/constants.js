export const REGION_PRESETS = {
  global: { key: "global", name: "Global", lat: 15, lng: 0, altitude: 2.15 },
  atlantic: { key: "atlantic", name: "North Atlantic", lat: 35, lng: -35, altitude: 1.2 },
  europe: { key: "europe", name: "Europe / East Med", lat: 38, lng: 20, altitude: 0.82 },
  gulf: { key: "gulf", name: "Gulf / Hormuz", lat: 24, lng: 54, altitude: 0.34 },
  eastAsia: { key: "eastAsia", name: "East Asia", lat: 28, lng: 125, altitude: 0.62 },
  southAsia: { key: "southAsia", name: "South Asia", lat: 18, lng: 80, altitude: 0.58 },
  russia: { key: "russia", name: "Russia", lat: 56, lng: 90, altitude: 0.96 },
  usaEast: { key: "usaEast", name: "US East", lat: 34, lng: -78, altitude: 0.72 },
};

export const REGION_KEYS = Object.keys(REGION_PRESETS);

export const VESSEL_CLASS_OPTIONS = ["all", "container", "tanker", "bulk", "lng", "ro-ro"];

export const CHOKEPOINTS = [
  { name: "Hormuz", centerLon: 55.1, centerLat: 25.3, note: "Oil and LNG hinge point", severity: "high" },
  { name: "Suez", centerLon: 32.5, centerLat: 30.0, note: "Europe-Asia container shortcut", severity: "high" },
  { name: "Bab el-Mandeb", centerLon: 43.4, centerLat: 12.4, note: "Red Sea gate", severity: "high" },
  { name: "Malacca", centerLon: 101.7, centerLat: 3.4, note: "Asia shipping throat", severity: "high" },
  { name: "Panama", centerLon: -79.7, centerLat: 9.1, note: "Atlantic-Pacific transfer", severity: "medium" },
];

export const CHOKEPOINT_RADIUS_DEGREES = {
  Hormuz: 4.2,
  Suez: 4.8,
  "Bab el-Mandeb": 4.0,
  Malacca: 5.4,
  Panama: 4.6,
};

export const NO_FLY_ZONES = [
  { name: "Ukraine conflict airspace", west: 18, south: 43, east: 41, north: 53, kind: "high" },
  { name: "North Korea restricted", west: 124, south: 37, east: 131, north: 43, kind: "high" },
  { name: "Hormuz caution", west: 52, south: 23, east: 58, north: 28, kind: "medium" },
];

export const CITY_LABELS = [
  { name: "New York", lon: -74.0, lat: 40.71, tier: 1 },
  { name: "London", lon: -0.12, lat: 51.5, tier: 1 },
  { name: "Frankfurt", lon: 8.68, lat: 50.11, tier: 2 },
  { name: "Moscow", lon: 37.62, lat: 55.75, tier: 1 },
  { name: "Beijing", lon: 116.4, lat: 39.9, tier: 1 },
  { name: "Shanghai", lon: 121.47, lat: 31.23, tier: 1 },
  { name: "Delhi", lon: 77.21, lat: 28.61, tier: 1 },
  { name: "Mumbai", lon: 72.87, lat: 19.07, tier: 2 },
  { name: "Pyongyang", lon: 125.76, lat: 39.04, tier: 2 },
  { name: "Taipei", lon: 121.56, lat: 25.03, tier: 2 },
  { name: "Seoul", lon: 126.98, lat: 37.56, tier: 2 },
  { name: "Tokyo", lon: 139.65, lat: 35.67, tier: 1 },
  { name: "Singapore", lon: 103.82, lat: 1.35, tier: 2 },
  { name: "Dubai", lon: 55.27, lat: 25.2, tier: 1 },
  { name: "Rotterdam", lon: 4.48, lat: 51.92, tier: 2 },
  { name: "Panama", lon: -79.53, lat: 8.98, tier: 2 },
];

export const SCENARIO_BRIEFINGS = [
  {
    id: "hormuz-pressure",
    title: "Hormuz pressure",
    summary: "Gulf shipping risk is modeled as an energy, insurance, and routing problem.",
    significance: "Chokepoint stress can affect fuel prices, logistics, and regional posture faster than battlefield movement.",
    tags: ["Iran", "United States", "Saudi Arabia", "United Arab Emirates"],
  },
  {
    id: "ukraine-endurance",
    title: "Russia-Ukraine endurance",
    summary: "European air and logistics routes bend around persistent conflict airspace.",
    significance: "Attention and transport capacity remain important even when the map does not visibly change.",
    tags: ["Russia", "United States"],
  },
  {
    id: "taiwan-watch",
    title: "Taiwan and East Asia watch",
    summary: "Pacific deterrence is represented by air, maritime, and orbital tracks around East Asia.",
    significance: "A crowded regional picture makes small changes in posture easier to miss.",
    tags: ["China", "Taiwan", "Japan", "South Korea", "United States"],
  },
  {
    id: "shipping-system",
    title: "Commercial shipping chokepoints",
    summary: "Container, tanker, LNG, and bulk flows cluster around a handful of fragile routes.",
    significance: "The dashboard treats chokepoints as first-class context rather than decorative markers.",
    tags: ["Singapore", "India", "United Arab Emirates"],
  },
];

export const COUNTRY_INTEL = {
  "United States": {
    stance: "Backing allies, protecting shipping lanes, and managing military bandwidth across theaters.",
    alliances: ["NATO", "Japan", "South Korea", "Israel", "Gulf partners"],
    tensions: ["Iran", "Russia", "China", "North Korea"],
    significance: "Still the system-shaping military power. The practical constraint is attention and deployable capacity.",
  },
  Iran: {
    stance: "Modeled as a Gulf actor whose strongest leverage is cost-imposition around energy and shipping.",
    alliances: ["Regional proxy network"],
    tensions: ["Israel", "United States", "Some Gulf states"],
    significance: "Iran can spread economic pain through chokepoint pressure even when direct battlefield options are limited.",
  },
  China: {
    stance: "Prefers stable energy flow while watching whether U.S. focus is divided.",
    alliances: ["Strategic overlap with Russia", "Economic leverage across Asia"],
    tensions: ["Taiwan", "United States", "Japan"],
    significance: "China links Gulf energy dependence with long-run pressure around Taiwan and the western Pacific.",
  },
  Russia: {
    stance: "Centered on endurance in Europe while benefiting from higher energy prices and Western distraction.",
    alliances: ["Belarus", "Security links with North Korea", "Coordination with China"],
    tensions: ["Ukraine", "NATO"],
    significance: "Russia gains when rival crises dilute Western concentration.",
  },
  India: {
    stance: "Strategic hedger with rising Indian Ocean weight.",
    alliances: ["Quad overlap", "Regional maritime partnerships"],
    tensions: ["China"],
    significance: "India matters because the Indian Ocean links Gulf energy to Asia.",
  },
  Taiwan: {
    stance: "Focused on deterrence and resilience under Chinese military pressure.",
    alliances: ["United States", "Support from Japan and some Western partners"],
    tensions: ["China"],
    significance: "A Taiwan crisis would affect technology, shipping, and alliance systems at once.",
  },
  Japan: {
    stance: "Balancing stronger alliance commitments with economic vulnerability to shipping and energy disruption.",
    alliances: ["United States"],
    tensions: ["China", "North Korea"],
    significance: "Japan converts distant conflicts into immediate strategic and economic calculations.",
  },
  "South Korea": {
    stance: "Focused on North Korea deterrence while protecting export-driven regional stability.",
    alliances: ["United States"],
    tensions: ["North Korea"],
    significance: "A frontline ally whose calculations shift quickly when U.S. resources look stretched.",
  },
  Singapore: {
    stance: "Critical logistics and refining node watching energy and shipping shocks move through Asia.",
    alliances: ["Pragmatic security links", "Trade centrality"],
    tensions: [],
    significance: "Singapore shows how distant conflict becomes a shipping and price problem for the whole region.",
  },
};

export const LIVE_EVENTS = [
  { t: 18, title: "Satellite pass", detail: "Orbital coverage lines up with corridor activity.", severity: "low", region: "East Med" },
  { t: 33, title: "Airspace alert", detail: "Routing bends around an active restriction area.", severity: "high", region: "Eastern Europe" },
  { t: 56, title: "Vessel reroute", detail: "Maritime posture shifts near a chokepoint.", severity: "medium", region: "Hormuz" },
  { t: 82, title: "Traffic spike", detail: "Ground and corridor pressure rises in urban hubs.", severity: "low", region: "Global" },
];
