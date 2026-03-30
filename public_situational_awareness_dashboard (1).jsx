import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { geoDistance, geoGraticule10, geoOrthographic, geoPath, geoInterpolate } from "d3-geo";
import { feature } from "topojson-client";
import countriesAtlas from "world-atlas/countries-50m.json";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Plane, Satellite, Ship, Search, Play, Pause, RotateCcw, Layers, AlertTriangle, Camera, Eye, LocateFixed, ZoomIn, ZoomOut, Activity } from "lucide-react";

const GLOBE_W = 1020;
const GLOBE_H = 600;
const HISTORY_STEPS = 32;

const REGION_PRESETS = {
  global: { key: "global", name: "Global", lon: 0, lat: 15, scale: 255 },
  atlantic: { key: "atlantic", name: "North Atlantic", lon: -35, lat: 35, scale: 360 },
  europe: { key: "europe", name: "Europe / East Med", lon: 20, lat: 38, scale: 470 },
  gulf: { key: "gulf", name: "Gulf / Hormuz", lon: 54, lat: 24, scale: 690 },
  eastAsia: { key: "eastAsia", name: "East Asia", lon: 125, lat: 28, scale: 470 },
  usaEast: { key: "usaEast", name: "US East", lon: -78, lat: 34, scale: 560 },
};

const REGION_KEYS = Object.keys(REGION_PRESETS);

const AIRPORTS = {
  JFK: { code: "JFK", city: "New York", country: "United States", lon: -73.7781, lat: 40.6413 },
  ATL: { code: "ATL", city: "Atlanta", country: "United States", lon: -84.4277, lat: 33.6407 },
  LAX: { code: "LAX", city: "Los Angeles", country: "United States", lon: -118.4085, lat: 33.9416 },
  DFW: { code: "DFW", city: "Dallas", country: "United States", lon: -97.0403, lat: 32.8998 },
  ORD: { code: "ORD", city: "Chicago", country: "United States", lon: -87.9073, lat: 41.9742 },
  LHR: { code: "LHR", city: "London", country: "United Kingdom", lon: -0.4543, lat: 51.47 },
  CDG: { code: "CDG", city: "Paris", country: "France", lon: 2.5479, lat: 49.0097 },
  FRA: { code: "FRA", city: "Frankfurt", country: "Germany", lon: 8.5706, lat: 50.0379 },
  MAD: { code: "MAD", city: "Madrid", country: "Spain", lon: -3.5676, lat: 40.4983 },
  FCO: { code: "FCO", city: "Rome", country: "Italy", lon: 12.2508, lat: 41.7999 },
  IST: { code: "IST", city: "Istanbul", country: "Turkey", lon: 28.8146, lat: 41.2753 },
  DOH: { code: "DOH", city: "Doha", country: "Qatar", lon: 51.6138, lat: 25.2731 },
  DXB: { code: "DXB", city: "Dubai", country: "United Arab Emirates", lon: 55.3657, lat: 25.2532 },
  DEL: { code: "DEL", city: "Delhi", country: "India", lon: 77.1031, lat: 28.5562 },
  BOM: { code: "BOM", city: "Mumbai", country: "India", lon: 72.8679, lat: 19.0896 },
  SIN: { code: "SIN", city: "Singapore", country: "Singapore", lon: 103.994, lat: 1.3644 },
  HND: { code: "HND", city: "Tokyo", country: "Japan", lon: 139.7798, lat: 35.5494 },
  ICN: { code: "ICN", city: "Seoul", country: "South Korea", lon: 126.4407, lat: 37.4602 },
  SYD: { code: "SYD", city: "Sydney", country: "Australia", lon: 151.1772, lat: -33.9399 },
  JNB: { code: "JNB", city: "Johannesburg", country: "South Africa", lon: 28.246, lat: -26.1337 },
  GRU: { code: "GRU", city: "São Paulo", country: "Brazil", lon: -46.4731, lat: -23.4356 },
  MEX: { code: "MEX", city: "Mexico City", country: "Mexico", lon: -99.0721, lat: 19.4361 },
  ANC: { code: "ANC", city: "Anchorage", country: "United States", lon: -149.9964, lat: 61.1743 },
  KEF: { code: "KEF", city: "Reykjavík", country: "Iceland", lon: -22.6056, lat: 63.985 },
  NRT: { code: "NRT", city: "Tokyo", country: "Japan", lon: 140.3929, lat: 35.772 },
  PAE: { code: "PAE", city: "Everett", country: "United States", lon: -122.281, lat: 47.9063 },
  DOV: { code: "DOV", city: "Dover", country: "United States", lon: -75.466, lat: 39.1295 },
  RMS: { code: "RMS", city: "Ramstein", country: "Germany", lon: 7.6003, lat: 49.4369 },
  OKA: { code: "OKA", city: "Okinawa", country: "Japan", lon: 127.6459, lat: 26.1958 },
  HIK: { code: "HIK", city: "Honolulu", country: "United States", lon: -157.9376, lat: 21.3187 },
};

const PORTS = {
  NYC: { code: "NYC", city: "New York", country: "United States", lon: -74.0059, lat: 40.7128 },
  HOU: { code: "HOU", city: "Houston", country: "United States", lon: -95.3698, lat: 29.7604 },
  RDM: { code: "RDM", city: "Rotterdam", country: "Netherlands", lon: 4.47917, lat: 51.9244 },
  HAM: { code: "HAM", city: "Hamburg", country: "Germany", lon: 9.9937, lat: 53.5511 },
  ALG: { code: "ALG", city: "Algeciras", country: "Spain", lon: -5.4562, lat: 36.1408 },
  SUE: { code: "SUE", city: "Suez", country: "Egypt", lon: 32.5498, lat: 29.9668 },
  DXB: { code: "DXB", city: "Dubai", country: "United Arab Emirates", lon: 55.2708, lat: 25.2048 },
  MUM: { code: "MUM", city: "Mumbai", country: "India", lon: 72.8777, lat: 18.9388 },
  SGP: { code: "SGP", city: "Singapore", country: "Singapore", lon: 103.8198, lat: 1.2903 },
  SHA: { code: "SHA", city: "Shanghai", country: "China", lon: 121.4737, lat: 31.2304 },
  HKG: { code: "HKG", city: "Hong Kong", country: "China", lon: 114.1694, lat: 22.3193 },
  TYO: { code: "TYO", city: "Tokyo Bay", country: "Japan", lon: 139.8395, lat: 35.6427 },
  SYD: { code: "SYD", city: "Sydney", country: "Australia", lon: 151.2093, lat: -33.8688 },
  CPT: { code: "CPT", city: "Cape Town", country: "South Africa", lon: 18.4241, lat: -33.9249 },
  RIO: { code: "RIO", city: "Rio de Janeiro", country: "Brazil", lon: -43.1729, lat: -22.9068 },
  NOR: { code: "NOR", city: "Norfolk", country: "United States", lon: -76.2859, lat: 36.8508 },
  GIB: { code: "GIB", city: "Gibraltar", country: "United Kingdom", lon: -5.3536, lat: 36.1408 },
  BUS: { code: "BUS", city: "Busan", country: "South Korea", lon: 129.0756, lat: 35.1796 },
};

const COUNTRY_LABELS = [
  { name: "United States", lon: -98, lat: 39 },
  { name: "Canada", lon: -103, lat: 58 },
  { name: "Mexico", lon: -102, lat: 23 },
  { name: "Brazil", lon: -53, lat: -10 },
  { name: "Argentina", lon: -64, lat: -35 },
  { name: "United Kingdom", lon: -2, lat: 54 },
  { name: "France", lon: 2, lat: 46 },
  { name: "Germany", lon: 10, lat: 51 },
  { name: "Spain", lon: -3, lat: 40 },
  { name: "Italy", lon: 12, lat: 42 },
  { name: "Norway", lon: 8, lat: 61 },
  { name: "Turkey", lon: 35, lat: 39 },
  { name: "Saudi Arabia", lon: 45, lat: 24 },
  { name: "Egypt", lon: 30, lat: 27 },
  { name: "South Africa", lon: 24, lat: -29 },
  { name: "Russia", lon: 95, lat: 60 },
  { name: "India", lon: 79, lat: 22 },
  { name: "China", lon: 104, lat: 35 },
  { name: "Japan", lon: 138, lat: 37 },
  { name: "South Korea", lon: 127.5, lat: 36.2 },
  { name: "Indonesia", lon: 118, lat: -2 },
  { name: "Australia", lon: 134, lat: -25 },
];

const CITY_LABELS = [
  { name: "New York", lon: -74.0, lat: 40.71, tier: 1 },
  { name: "Miami", lon: -80.19, lat: 25.76, tier: 2 },
  { name: "Washington", lon: -77.03, lat: 38.9, tier: 2 },
  { name: "Los Angeles", lon: -118.24, lat: 34.05, tier: 1 },
  { name: "Chicago", lon: -87.62, lat: 41.88, tier: 2 },
  { name: "London", lon: -0.12, lat: 51.5, tier: 1 },
  { name: "Paris", lon: 2.35, lat: 48.85, tier: 1 },
  { name: "Berlin", lon: 13.4, lat: 52.52, tier: 2 },
  { name: "Rome", lon: 12.49, lat: 41.9, tier: 2 },
  { name: "Madrid", lon: -3.7, lat: 40.42, tier: 2 },
  { name: "Cairo", lon: 31.23, lat: 30.04, tier: 2 },
  { name: "Dubai", lon: 55.27, lat: 25.2, tier: 1 },
  { name: "Mumbai", lon: 72.87, lat: 19.07, tier: 2 },
  { name: "Singapore", lon: 103.82, lat: 1.35, tier: 2 },
  { name: "Tokyo", lon: 139.65, lat: 35.67, tier: 1 },
  { name: "Seoul", lon: 126.98, lat: 37.56, tier: 2 },
  { name: "Hong Kong", lon: 114.17, lat: 22.32, tier: 2 },
  { name: "Sydney", lon: 151.2, lat: -33.87, tier: 1 },
  { name: "São Paulo", lon: -46.63, lat: -23.55, tier: 2 },
  { name: "Johannesburg", lon: 28.04, lat: -26.2, tier: 2 },
];

const EVENTS = [
  { t: 18, title: "Satellite pass", detail: "Orbital coverage lines up with corridor activity.", severity: "low", region: "East Med" },
  { t: 33, title: "Airspace alert", detail: "Restriction advisory bends commercial routing northward.", severity: "high", region: "Eastern Europe" },
  { t: 56, title: "Vessel reroute", detail: "Maritime posture shifts near a chokepoint.", severity: "medium", region: "Hormuz" },
  { t: 82, title: "Traffic spike", detail: "Ground flow pressure intensifies in urban cores.", severity: "low", region: "NYC / London / Tokyo" },
];

const CAMERAS = [
  { name: "NYC DOT Midtown", city: "New York", note: "Public traffic camera placeholder" },
  { name: "Florida 511 I-95", city: "Miami", note: "Public traffic camera placeholder" },
  { name: "TfL Central London", city: "London", note: "Official transport camera directory placeholder" },
];

const NO_FLY = [
  { name: "Ukraine conflict airspace", west: 18, south: 43, east: 41, north: 53, kind: "high" },
  { name: "North Korea restricted", west: 124, south: 37, east: 131, north: 43, kind: "high" },
  { name: "Hormuz caution", west: 52, south: 23, east: 58, north: 28, kind: "medium" },
];

const TRAFFIC_ZONES = [
  { name: "NYC core", lon: -73.98, lat: 40.75, radius: 2.8 },
  { name: "London central", lon: -0.11, lat: 51.51, radius: 2.5 },
  { name: "Tokyo central", lon: 139.76, lat: 35.68, radius: 3.0 },
  { name: "Dubai corridor", lon: 55.27, lat: 25.2, radius: 2.2 },
  { name: "Singapore core", lon: 103.82, lat: 1.35, radius: 1.8 },
];

const AIR_ROUTES = [
  { operator: "Delta", from: "JFK", to: "LHR", category: "commercial", count: 3 },
  { operator: "American", from: "DFW", to: "LHR", category: "commercial", count: 2 },
  { operator: "United", from: "ORD", to: "FRA", category: "commercial", count: 2 },
  { operator: "British Airways", from: "LHR", to: "JFK", category: "commercial", count: 3 },
  { operator: "Air France", from: "CDG", to: "JFK", category: "commercial", count: 2 },
  { operator: "Lufthansa", from: "FRA", to: "ORD", category: "commercial", count: 2 },
  { operator: "Qatar Airways", from: "DOH", to: "FRA", category: "commercial", count: 2 },
  { operator: "Emirates", from: "DXB", to: "LHR", category: "commercial", count: 2 },
  { operator: "Singapore Airlines", from: "SIN", to: "LAX", category: "commercial", count: 2 },
  { operator: "ANA", from: "HND", to: "LAX", category: "commercial", count: 2 },
  { operator: "JAL", from: "NRT", to: "JFK", category: "commercial", count: 2 },
  { operator: "Air India", from: "DEL", to: "LHR", category: "commercial", count: 2 },
  { operator: "Qantas", from: "SYD", to: "SIN", category: "commercial", count: 2 },
  { operator: "LATAM", from: "GRU", to: "MAD", category: "commercial", count: 2 },
  { operator: "Aeromexico", from: "MEX", to: "ATL", category: "commercial", count: 1 },
  { operator: "Korean Air", from: "ICN", to: "LAX", category: "commercial", count: 2 },
  { operator: "Icelandair", from: "KEF", to: "JFK", category: "commercial", count: 1 },
  { operator: "USAF", from: "DOV", to: "RMS", category: "military", count: 2 },
  { operator: "USAF", from: "HIK", to: "OKA", category: "military", count: 1 },
  { operator: "RAF", from: "LHR", to: "RMS", category: "military", count: 1 },
  { operator: "NATO", from: "RMS", to: "IST", category: "military", count: 1 },
  { operator: "Boeing Test", from: "PAE", to: "ANC", category: "commercial", count: 1 },
];

const SEA_LANES = [
  { operator: "Maersk", from: "NYC", to: "RDM", category: "commercial", count: 2 },
  { operator: "MSC", from: "SGP", to: "SHA", category: "commercial", count: 3 },
  { operator: "CMA CGM", from: "ALG", to: "SUE", category: "commercial", count: 2 },
  { operator: "COSCO", from: "SHA", to: "SGP", category: "commercial", count: 2 },
  { operator: "Evergreen", from: "SGP", to: "BUS", category: "commercial", count: 2 },
  { operator: "Hapag-Lloyd", from: "HAM", to: "RDM", category: "commercial", count: 1 },
  { operator: "ONE", from: "TYO", to: "SGP", category: "commercial", count: 2 },
  { operator: "MOL", from: "TYO", to: "BUS", category: "commercial", count: 1 },
  { operator: "US Navy", from: "NOR", to: "GIB", category: "military", count: 1 },
  { operator: "US Navy", from: "GIB", to: "SUE", category: "military", count: 1 },
  { operator: "Royal Navy", from: "GIB", to: "ALG", category: "military", count: 1 },
  { operator: "MSC", from: "RIO", to: "CPT", category: "commercial", count: 2 },
  { operator: "Maersk", from: "DXB", to: "MUM", category: "commercial", count: 2 },
  { operator: "CMA CGM", from: "SUE", to: "DXB", category: "commercial", count: 2 },
];

const SATELLITE_GROUPS = [
  { operator: "ISS partnership", name: "ISS", category: "civil", count: 1, inclination: 51.6, altitude: 408, drift: 2.8 },
  { operator: "SpaceX", name: "STARLINK", category: "commercial", count: 18, inclination: 53, altitude: 550, drift: 3.2 },
  { operator: "OneWeb", name: "ONEWEB", category: "commercial", count: 12, inclination: 87, altitude: 1200, drift: 2.2 },
  { operator: "Planet", name: "PLANET", category: "commercial", count: 8, inclination: 97.4, altitude: 500, drift: 2.9 },
  { operator: "US Government", name: "USA", category: "military", count: 6, inclination: 63.4, altitude: 520, drift: 2.5 },
  { operator: "EU Copernicus", name: "SENTINEL", category: "civil", count: 4, inclination: 98.2, altitude: 690, drift: 2.6 },
];

function normalizeLon(lon) {
  let out = lon;
  while (out > 180) out -= 360;
  while (out < -180) out += 360;
  return out;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function seededUnit(key) {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

function createRouteTrack(kind, route, index) {
  const origin = kind === "aircraft" ? AIRPORTS[route.from] : PORTS[route.from];
  const dest = kind === "aircraft" ? AIRPORTS[route.to] : PORTS[route.to];
  const seed = seededUnit(`${kind}-${route.operator}-${route.from}-${route.to}-${index}`);
  const phase = seededUnit(`phase-${kind}-${route.from}-${route.to}-${index}`);
  const interp = geoInterpolate([origin.lon, origin.lat], [dest.lon, dest.lat]);
  const here = interp(phase);
  const ahead = interp(Math.min(0.999, phase + 0.02));
  const heading = ((Math.atan2(ahead[0] - here[0], ahead[1] - here[1]) * 180) / Math.PI + 360) % 360;
  const idPrefix = kind === "aircraft" ? route.operator.replace(/[^A-Z]/gi, "").slice(0, 3).toUpperCase() : route.operator.replace(/[^A-Z]/gi, "").slice(0, 4).toUpperCase();
  return {
    id: `${idPrefix}${100 + index}`,
    type: kind,
    category: route.category,
    operator: route.operator,
    military: route.category === "military",
    origin: route.from,
    dest: route.to,
    fromLon: origin.lon,
    fromLat: origin.lat,
    toLon: dest.lon,
    toLat: dest.lat,
    progress: phase,
    delta: (kind === "aircraft" ? 0.0025 : 0.00065) + seed * (kind === "aircraft" ? 0.0045 : 0.0012),
    lon: here[0],
    lat: here[1],
    heading,
    speed: kind === "aircraft" ? Math.round(410 + seed * 110) : Math.round(12 + seed * 18),
    altitude: kind === "aircraft" ? Math.round(28000 + seed * 13000) : 0,
  };
}

function createSatelliteTrack(group, index) {
  const seed = seededUnit(`${group.name}-${index}`);
  const phase = seed * Math.PI * 2;
  return {
    id: `${group.name}-${String(index + 1).padStart(2, "0")}`,
    type: "satellite",
    category: group.category,
    operator: group.operator,
    military: group.category === "military",
    lonBase: -180 + seed * 360,
    phase,
    inclination: group.inclination,
    drift: group.drift * (seed > 0.5 ? 1 : -1),
    delta: 0.02 + seed * 0.018,
    lon: normalizeLon(-180 + seed * 360),
    lat: Math.sin(phase) * Math.min(group.inclination, 80),
    heading: seed * 360,
    altitude: group.altitude,
    speed: 26500 + Math.round(seed * 1800),
  };
}

function buildInitialTracks() {
  const aircraft = AIR_ROUTES.flatMap((route, routeIndex) => Array.from({ length: route.count }, (_, i) => createRouteTrack("aircraft", route, routeIndex * 10 + i)));
  const vessels = SEA_LANES.flatMap((route, routeIndex) => Array.from({ length: route.count }, (_, i) => createRouteTrack("vessel", route, routeIndex * 10 + i)));
  const satellites = SATELLITE_GROUPS.flatMap((group) => Array.from({ length: group.count }, (_, i) => createSatelliteTrack(group, i)));
  return [...aircraft, ...vessels, ...satellites];
}

const TRACKS_SEED = buildInitialTracks();

function validateSeed(seed) {
  const ids = new Set();
  const errors = [];
  seed.forEach((track) => {
    if (ids.has(track.id)) errors.push(`Duplicate track id: ${track.id}`);
    ids.add(track.id);
    if (!["aircraft", "vessel", "satellite"].includes(track.type)) errors.push(`Invalid type for ${track.id}`);
    if (typeof track.lon !== "number" || typeof track.lat !== "number") errors.push(`Invalid coordinates for ${track.id}`);
  });
  return errors;
}

function validateRegionPresets(defs) {
  const errors = [];
  Object.values(defs).forEach((r) => {
    if (typeof r.lon !== "number" || typeof r.lat !== "number" || typeof r.scale !== "number") errors.push(`Invalid region preset: ${r.name}`);
  });
  return errors;
}

function formatClock(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function buildLiveEntries(tracks, frame, selectedId) {
  const now = new Date();
  const entries = [];
  const selected = tracks.find((t) => t.id === selectedId) || tracks[0];
  const gulfTraffic = tracks.filter((t) => t.lon > 46 && t.lon < 60 && t.lat > 20 && t.lat < 30);
  const eastMedTraffic = tracks.filter((t) => t.lon > 20 && t.lon < 38 && t.lat > 28 && t.lat < 40);
  const militaryVisible = tracks.filter((t) => t.military).length;

  if (selected) {
    entries.push({
      id: `track-${frame}`,
      ts: now,
      level: selected.military ? "warning" : "info",
      title: `${selected.id} updated`,
      detail: `${selected.operator} ${selected.type} at ${selected.speed ? Math.round(selected.speed) : "--"}${selected.type === "aircraft" ? " kt" : selected.type === "vessel" ? " kn" : " km/h orbital"}.`,
    });
  }

  if (frame % 3 === 0) {
    entries.push({
      id: `gulf-${frame}`,
      ts: now,
      level: gulfTraffic.length > 4 ? "warning" : "info",
      title: "Gulf watch",
      detail: `${gulfTraffic.length} tracked assets inside Gulf / Hormuz corridor.`,
    });
  }

  if (frame % 4 === 0) {
    entries.push({
      id: `med-${frame}`,
      ts: now,
      level: eastMedTraffic.length > 5 ? "warning" : "info",
      title: "East Med corridor",
      detail: `${eastMedTraffic.length} tracked assets across the Eastern Mediterranean lane.`,
    });
  }

  if (frame % 5 === 0) {
    entries.push({
      id: `mil-${frame}`,
      ts: now,
      level: militaryVisible > 8 ? "warning" : "info",
      title: "Military picture",
      detail: `${militaryVisible} military-tagged tracks currently active in the global set.`,
    });
  }

  return entries.slice(0, 3);
}

function stepTrack(track, frame) {
  if (track.type === "satellite") {
    const nextPhase = track.phase + track.delta;
    return {
      ...track,
      phase: nextPhase,
      lat: Math.sin(nextPhase) * Math.min(track.inclination, 80),
      lon: normalizeLon(track.lonBase + nextPhase * track.drift * 22),
      heading: normalizeLon((track.heading || 0) + track.drift * 3),
    };
  }

  const nextProgress = (track.progress + track.delta) % 1;
  const interp = geoInterpolate([track.fromLon, track.fromLat], [track.toLon, track.toLat]);
  const here = interp(nextProgress);
  const ahead = interp(Math.min(0.999, nextProgress + 0.01));
  const heading = ((Math.atan2(ahead[0] - here[0], ahead[1] - here[1]) * 180) / Math.PI + 360) % 360;

  return {
    ...track,
    progress: nextProgress,
    lon: normalizeLon(here[0]),
    lat: clamp(here[1], -82, 82),
    heading,
    altitude: track.type === "aircraft" ? clamp((track.altitude || 34000) + Math.sin(frame * 0.15 + nextProgress * 6) * 40, 25000, 43000) : 0,
    speed: track.type === "aircraft" ? clamp((track.speed || 450) + Math.sin(frame * 0.08 + nextProgress * 8), 360, 620) : clamp((track.speed || 18) + Math.sin(frame * 0.03 + nextProgress * 10) * 0.2, 8, 34),
  };
}

function tone(track) {
  if (track.type === "aircraft") return track.category === "military" ? "#fb923c" : "#67e8f9";
  if (track.type === "satellite") return track.category === "military" ? "#fb7185" : "#c4b5fd";
  return track.category === "military" ? "#fda4af" : "#86efac";
}

function badgeTone(type, category) {
  if (type === "aircraft") return category === "military" ? "bg-orange-500/15 text-orange-200 border-orange-400/20" : "bg-cyan-500/15 text-cyan-200 border-cyan-400/20";
  if (type === "satellite") return category === "military" ? "bg-rose-500/15 text-rose-200 border-rose-400/20" : "bg-violet-500/15 text-violet-200 border-violet-400/20";
  return category === "military" ? "bg-pink-500/15 text-pink-200 border-pink-400/20" : "bg-emerald-500/15 text-emerald-200 border-emerald-400/20";
}

function TrackIcon({ type }) {
  if (type === "aircraft") return <Plane className="h-4 w-4" />;
  if (type === "satellite") return <Satellite className="h-4 w-4" />;
  return <Ship className="h-4 w-4" />;
}

function useDragGlobe(setView) {
  const dragRef = useRef(null);
  const onPointerDown = (event, view) => {
    dragRef.current = { x: event.clientX, y: event.clientY, lon: view.lon, lat: view.lat, scale: view.scale };
  };
  const onPointerMove = (event) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    const sensitivity = 140 / dragRef.current.scale;
    setView((prev) => ({
      ...prev,
      lon: normalizeLon(dragRef.current.lon - dx * sensitivity),
      lat: clamp(dragRef.current.lat + dy * sensitivity, -80, 80),
    }));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };
  return { onPointerDown, onPointerMove, onPointerUp };
}

function projectedLabels(items, projection, minDistance) {
  const accepted = [];
  items.forEach((item) => {
    const p = projection([item.lon, item.lat]);
    if (!p) return;
    const clear = accepted.every((existing) => ((existing.x - p[0]) ** 2 + (existing.y - p[1]) ** 2) > minDistance ** 2);
    if (clear) accepted.push({ ...item, x: p[0], y: p[1] });
  });
  return accepted;
}

function RegistryRow({ track, selected, onSelect }) {
  return (
    <button onClick={() => onSelect(track)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === track.id ? "border-cyan-400/50 bg-zinc-900" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-zinc-900 p-2"><TrackIcon type={track.type} /></div>
          <div>
            <div className="font-medium text-zinc-100">{track.id}</div>
            <div className="text-xs text-zinc-400">{track.operator}</div>
          </div>
        </div>
        <Badge className={badgeTone(track.type, track.category)}>{track.category}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-400">
        <div>{track.type}</div>
        <div>Lat {track.lat.toFixed(1)}</div>
        <div>Lon {track.lon.toFixed(1)}</div>
      </div>
    </button>
  );
}

function GlobeSurface({
  tracks,
  history,
  selected,
  onSelect,
  regionKey,
  setRegionKey,
  view,
  setView,
  ui,
  setUi,
  focusSelected,
}) {
  const countries = useMemo(() => feature(countriesAtlas, countriesAtlas.objects.countries).features, []);
  const projection = useMemo(
    () => geoOrthographic().translate([GLOBE_W / 2, GLOBE_H / 2]).scale(view.scale).rotate([-view.lon, -view.lat]).clipAngle(90).precision(0.45),
    [view]
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const graticule = useMemo(() => geoGraticule10(), []);
  const drag = useDragGlobe(setView);

  const isFront = (lon, lat) => geoDistance([lon, lat], [view.lon, view.lat]) <= Math.PI / 2;
  const visibleTracks = tracks.filter((track) => isFront(track.lon, track.lat));

  const visibleCountryLabels = useMemo(() => {
    const minDistance = view.scale > 600 ? 26 : view.scale > 420 ? 34 : 46;
    return projectedLabels(COUNTRY_LABELS.filter((item) => isFront(item.lon, item.lat)), projection, minDistance);
  }, [projection, view.scale, view.lon, view.lat]);

  const visibleCityLabels = useMemo(() => {
    const minDistance = view.scale > 600 ? 20 : 28;
    return projectedLabels(CITY_LABELS.filter((item) => isFront(item.lon, item.lat)), projection, minDistance);
  }, [projection, view.scale, view.lon, view.lat]);

  const zoomIn = () => setView((prev) => ({ ...prev, scale: clamp(prev.scale * 1.15, 180, 1200) }));
  const zoomOut = () => setView((prev) => ({ ...prev, scale: clamp(prev.scale / 1.15, 180, 1200) }));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-100">Areas</div>
            <div className="text-xs text-zinc-400">Theater tabs to jump fast, then drag the globe to refine.</div>
          </div>
          <Badge className="border-zinc-700 bg-zinc-900 text-zinc-100">{REGION_PRESETS[regionKey].name}</Badge>
        </div>
        <Tabs value={regionKey} onValueChange={(key) => { setRegionKey(key); setView(REGION_PRESETS[key]); }} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-zinc-950">
            {REGION_KEYS.map((key) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {REGION_PRESETS[key].name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200">{tracks.filter((t) => t.type === "aircraft").length} aircraft</Badge>
            <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">{tracks.filter((t) => t.type === "vessel").length} vessels</Badge>
            <Badge className="border-violet-400/20 bg-violet-400/10 text-violet-200">{tracks.filter((t) => t.type === "satellite").length} satellites</Badge>
            <Badge className="border-zinc-700 bg-zinc-900 text-zinc-100">{visibleTracks.length} visible</Badge>
          </div>
          <div className="text-xs text-zinc-400">Drag to rotate. Use zoom buttons or mouse wheel. Click a marker to inspect it.</div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-zinc-800 bg-black">
          <svg
            viewBox={`0 0 ${GLOBE_W} ${GLOBE_H}`}
            className="h-[600px] w-full touch-none cursor-grab"
            onPointerDown={(e) => drag.onPointerDown(e, view)}
            onPointerMove={drag.onPointerMove}
            onPointerUp={drag.onPointerUp}
            onPointerLeave={drag.onPointerUp}
            onWheel={(e) => {
              e.preventDefault();
              if (e.deltaY < 0) zoomIn(); else zoomOut();
            }}
          >
            <defs>
              <radialGradient id="globeFill" cx="45%" cy="35%" r="75%">
                <stop offset="0%" stopColor={ui.mode === "thermal" ? "#3a1609" : ui.mode === "night" ? "#0b1c39" : "#12314d"} />
                <stop offset="62%" stopColor={ui.mode === "thermal" ? "#170a06" : ui.mode === "night" ? "#07101d" : "#091321"} />
                <stop offset="100%" stopColor="#03060b" />
              </radialGradient>
              <linearGradient id="rimGlow" x1="0" x2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.08" />
              </linearGradient>
            </defs>

            <path d={path({ type: "Sphere" }) || ""} fill="url(#globeFill)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.3" />
            <path d={path({ type: "Sphere" }) || ""} fill="none" stroke="url(#rimGlow)" strokeWidth="14" opacity="0.45" />
            <path d={path(graticule) || ""} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

            {countries.map((country, index) => (
              <path key={index} d={path(country) || ""} fill="rgba(96,165,250,0.14)" stroke="rgba(226,232,240,0.42)" strokeWidth={view.scale > 650 ? 0.95 : 0.75} />
            ))}

            {NO_FLY.map((zone) => {
              const shape = {
                type: "Polygon",
                coordinates: [[
                  [zone.west, zone.south],
                  [zone.east, zone.south],
                  [zone.east, zone.north],
                  [zone.west, zone.north],
                  [zone.west, zone.south],
                ]],
              };
              return (
                <path
                  key={zone.name}
                  d={path(shape) || ""}
                  fill={zone.kind === "high" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)"}
                  stroke={zone.kind === "high" ? "rgba(248,113,113,0.9)" : "rgba(251,191,36,0.9)"}
                  strokeDasharray="6 5"
                  strokeWidth="1.5"
                />
              );
            })}

            {ui.traffic && TRAFFIC_ZONES.filter((z) => isFront(z.lon, z.lat)).map((zone) => {
              const p = projection([zone.lon, zone.lat]);
              if (!p) return null;
              const r = zone.radius * (view.scale / 255);
              return <circle key={zone.name} cx={p[0]} cy={p[1]} r={r} fill="rgba(239,68,68,0.12)" stroke="rgba(248,113,113,0.8)" />;
            })}

            {ui.trails && visibleTracks.map((track) => {
              const line = { type: "LineString", coordinates: history[track.id] || [] };
              const d = path(line);
              if (!d) return null;
              return <path key={`${track.id}-trail`} d={d} fill="none" stroke={tone(track)} strokeOpacity="0.36" strokeWidth={track.type === "satellite" ? 1.6 : 2} />;
            })}

            {visibleTracks.map((track) => {
              const p = projection([track.lon, track.lat]);
              if (!p) return null;
              const fill = tone(track);
              const selectedNow = selected?.id === track.id;
              return (
                <g key={track.id} onClick={() => onSelect(track)} className="cursor-pointer">
                  <circle cx={p[0]} cy={p[1]} r={selectedNow ? 10 : track.type === "satellite" ? 5 : 6} fill={fill} fillOpacity="0.18" />
                  {track.type === "aircraft" && <path d={`M ${p[0]} ${p[1] - 5} L ${p[0] + 4} ${p[1] + 5} L ${p[0]} ${p[1] + 2} L ${p[0] - 4} ${p[1] + 5} Z`} fill={fill} />}
                  {track.type === "satellite" && <g><rect x={p[0] - 2} y={p[1] - 2} width="4" height="4" fill={fill} /><line x1={p[0] - 6} y1={p[1]} x2={p[0] - 2} y2={p[1]} stroke={fill} /><line x1={p[0] + 2} y1={p[1]} x2={p[0] + 6} y2={p[1]} stroke={fill} /></g>}
                  {track.type === "vessel" && <path d={`M ${p[0]} ${p[1] - 5} L ${p[0] + 4} ${p[1] + 5} L ${p[0] - 4} ${p[1] + 5} Z`} fill={fill} />}
                  {ui.labels && view.scale > 320 && <><line x1={p[0]} y1={p[1]} x2={p[0] + 14} y2={p[1] - 10} stroke={fill} strokeOpacity="0.65" /><text x={p[0] + 17} y={p[1] - 12} fill={fill} fontSize="10.5">{track.id}</text></>}
                </g>
              );
            })}

            {ui.labels && view.scale > 260 && visibleCountryLabels.map((country) => (
              <text key={country.name} x={country.x} y={country.y} textAnchor="middle" fill="rgba(255,255,255,0.72)" fontSize={view.scale > 650 ? 12 : 10.8} style={{ letterSpacing: 1.05 }}>{country.name.toUpperCase()}</text>
            ))}

            {ui.labels && view.scale > 340 && visibleCityLabels.map((city) => (
              <g key={city.name}>
                <circle cx={city.x} cy={city.y} r={city.tier === 1 ? 2.8 : 2.2} fill="rgba(255,255,255,0.9)" />
                <text x={city.x + 5} y={city.y - 5} fill="rgba(255,255,255,0.72)" fontSize={city.tier === 1 ? 10.2 : 9.2}>{city.name}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 lg:grid-cols-[1fr_1fr_1fr]">
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Camera</div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="justify-start border-zinc-700 bg-zinc-950 text-zinc-100" onClick={focusSelected}><LocateFixed className="mr-2 h-4 w-4" />Focus asset</Button>
            <Button variant="outline" className="justify-start border-zinc-700 bg-zinc-950 text-zinc-300" onClick={() => { setRegionKey("global"); setView(REGION_PRESETS.global); }}><Globe className="mr-2 h-4 w-4" />Reset view</Button>
            <Button variant="outline" className="justify-start border-zinc-700 bg-zinc-950 text-zinc-300" onClick={() => setView((prev) => ({ ...prev, scale: clamp(prev.scale * 1.15, 180, 1200) }))}><ZoomIn className="mr-2 h-4 w-4" />Zoom in</Button>
            <Button variant="outline" className="justify-start border-zinc-700 bg-zinc-950 text-zinc-300" onClick={() => setView((prev) => ({ ...prev, scale: clamp(prev.scale / 1.15, 180, 1200) }))}><ZoomOut className="mr-2 h-4 w-4" />Zoom out</Button>
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Display</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setUi((v) => ({ ...v, labels: !v.labels }))} className={`rounded-xl border px-3 py-2 text-left text-sm ${ui.labels ? "border-cyan-400/50 bg-zinc-900 text-zinc-100" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}>Labels {ui.labels ? "On" : "Off"}</button>
            <button onClick={() => setUi((v) => ({ ...v, trails: !v.trails }))} className={`rounded-xl border px-3 py-2 text-left text-sm ${ui.trails ? "border-cyan-400/50 bg-zinc-900 text-zinc-100" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}>Trails {ui.trails ? "On" : "Off"}</button>
            <button onClick={() => setUi((v) => ({ ...v, traffic: !v.traffic }))} className={`rounded-xl border px-3 py-2 text-left text-sm ${ui.traffic ? "border-cyan-400/50 bg-zinc-900 text-zinc-100" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}>Traffic {ui.traffic ? "On" : "Off"}</button>
            <button onClick={() => setUi((v) => ({ ...v, labels: true, trails: true, traffic: true }))} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-left text-sm text-zinc-400">Restore defaults</button>
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Modes</div>
          <div className="grid grid-cols-2 gap-2">
            {[["standard", "Standard"], ["night", "Night"], ["thermal", "Thermal"], ["traffic", "Traffic"]].map(([value, label]) => (
              <button key={value} onClick={() => setUi((v) => ({ ...v, mode: value }))} className={`rounded-xl border px-3 py-2 text-left text-sm ${ui.mode === value ? "border-cyan-400/50 bg-zinc-900 text-zinc-100" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicSituationalAwarenessDashboard() {
  const [tracks, setTracks] = useState(TRACKS_SEED);
  const [history, setHistory] = useState(Object.fromEntries(TRACKS_SEED.map((t) => [t.id, [[t.lon, t.lat]]])));
  const [selected, setSelected] = useState(TRACKS_SEED[0]);
  const [playing, setPlaying] = useState(true);
  const [liveMode, setLiveMode] = useState(true);
  const [frame, setFrame] = useState(0);
  const [timeline, setTimeline] = useState([56]);
  const [regionKey, setRegionKey] = useState("global");
  const [view, setView] = useState(REGION_PRESETS.global);
  const [ui, setUi] = useState({ labels: true, trails: true, traffic: true, mode: "standard" });
  const [query, setQuery] = useState("");
  const [onlyMilitary, setOnlyMilitary] = useState(false);
  const [hideCommercial, setHideCommercial] = useState(false);
  const [showTypes, setShowTypes] = useState({ aircraft: true, vessel: true, satellite: true });
  const [refreshMs, setRefreshMs] = useState([1200]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [liveFeed, setLiveFeed] = useState(() => [
    { id: "boot-0", ts: new Date(), level: "info", title: "Live feed ready", detail: "Synthetic global watch surface online." },
  ]);
  const validationErrors = useMemo(() => [...validateSeed(TRACKS_SEED), ...validateRegionPresets(REGION_PRESETS)], []);

  useEffect(() => {
    if (!playing || !liveMode) return;
    const timer = setInterval(() => {
      setFrame((f) => f + 1);
      setTracks((prev) => {
        const next = prev.map((t) => stepTrack(t, frame + 1));
        setHistory((old) => {
          const copy = { ...old };
          next.forEach((t) => {
            const arr = [...(copy[t.id] || []), [t.lon, t.lat]];
            copy[t.id] = arr.slice(-HISTORY_STEPS);
          });
          return copy;
        });
        setLastUpdated(new Date());
        setLiveFeed((old) => {
          const entries = buildLiveEntries(next, frame + 1, selected?.id);
          return [...entries, ...old].slice(0, 24);
        });
        return next;
      });
    }, refreshMs[0]);
    return () => clearInterval(timer);
  }, [playing, liveMode, frame, refreshMs, selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tracks.filter((t) => {
      if (!showTypes[t.type]) return false;
      if (onlyMilitary && !t.military) return false;
      if (hideCommercial && t.category === "commercial") return false;
      if (!q) return true;
      return [t.id, t.operator, t.type, t.category, t.origin, t.dest, t.course].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [tracks, query, onlyMilitary, hideCommercial, showTypes]);

  const selectedLive = filtered.find((t) => t.id === selected?.id) || tracks.find((t) => t.id === selected?.id) || filtered[0] || tracks[0];

  const focusSelected = () => {
    if (!selectedLive) return;
    setView({
      key: "focus",
      name: `${selectedLive.id} focus`,
      lon: selectedLive.lon,
      lat: selectedLive.lat,
      scale: selectedLive.type === "satellite" ? 820 : selectedLive.type === "aircraft" ? 700 : 620,
    });
  };

  const timelineEvent = [...EVENTS].sort((a, b) => Math.abs(a.t - timeline[0]) - Math.abs(b.t - timeline[0]))[0];
  const stats = useMemo(() => ({
    aircraft: tracks.filter((t) => t.type === "aircraft").length,
    vessels: tracks.filter((t) => t.type === "vessel").length,
    satellites: tracks.filter((t) => t.type === "satellite").length,
  }), [tracks]);

  const liveStatus = liveMode ? (playing ? "Live" : "Standby") : "Offline";

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100 md:p-8">
      <div className="mx-auto max-w-[1820px] space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Search className="h-5 w-5 text-cyan-300" /> Focus</CardTitle>
                <CardDescription className="text-zinc-400">Synthetic global traffic system inspired by public feed categories, now with a controllable live stream layer.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
                  <div><span className="text-zinc-200">1.</span> Choose a theater from the tabs above the globe.</div>
                  <div><span className="text-zinc-200">2.</span> Drag and zoom until country labels settle.</div>
                  <div><span className="text-zinc-200">3.</span> Click a track or use the registry to inspect it.</div>
                </div>
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search track, operator, route, airport, port" className="border-zinc-700 bg-zinc-950" />
                <div className="grid grid-cols-2 gap-2">
                  {[["aircraft", `Aircraft ${stats.aircraft}`], ["vessel", `Vessels ${stats.vessels}`], ["satellite", `Satellites ${stats.satellites}`]].map(([key, label]) => (
                    <button key={key} onClick={() => setShowTypes((s) => ({ ...s, [key]: !s[key] }))} className={`rounded-xl border px-3 py-2 text-left text-sm ${showTypes[key] ? "border-cyan-400/40 bg-zinc-900 text-zinc-100" : "border-zinc-800 bg-zinc-950 text-zinc-500"}`}>{label}</button>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                  <div>
                    <div className="font-medium">Only military</div>
                    <div className="text-xs text-zinc-400">Cut the noise fast</div>
                  </div>
                  <Switch checked={onlyMilitary} onCheckedChange={setOnlyMilitary} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                  <div>
                    <div className="font-medium">Hide commercial</div>
                    <div className="text-xs text-zinc-400">Remove normal traffic</div>
                  </div>
                  <Switch checked={hideCommercial} onCheckedChange={setHideCommercial} />
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Activity className={`h-4 w-4 ${liveMode ? "text-emerald-300" : "text-zinc-500"}`} />
                      <div>
                        <div className="text-sm font-medium text-zinc-100">Live stream</div>
                        <div className="text-xs text-zinc-400">{liveStatus} • last update {formatClock(lastUpdated)}</div>
                      </div>
                    </div>
                    <Switch checked={liveMode} onCheckedChange={setLiveMode} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Refresh cadence</span>
                      <span>{refreshMs[0]} ms</span>
                    </div>
                    <Slider value={refreshMs} onValueChange={setRefreshMs} min={500} max={3000} step={100} />
                  </div>
                </div>
                {validationErrors.length > 0 && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-100">
                    {validationErrors.map((err) => <div key={err}>{err}</div>)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Layers className="h-5 w-5 text-violet-300" /> Registry</CardTitle>
                <CardDescription className="text-zinc-400">Global fleet, route-by-route.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[620px] pr-4">
                  <div className="space-y-3">
                    {filtered.map((track) => <RegistryRow key={track.id} track={track} selected={selectedLive} onSelect={setSelected} />)}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60 shadow-2xl shadow-black/30">
              <CardHeader>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl"><Globe className="h-6 w-6 text-cyan-300" /> Theater Globe</CardTitle>
                    <CardDescription className="mt-2 text-zinc-400">More map detail, denser world traffic, stronger labels, and a live operator loop feeding state changes into the dashboard.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`${liveMode ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-zinc-700 bg-zinc-900 text-zinc-400"}`}>{liveStatus}</Badge>
                    <Button variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-100" onClick={() => setPlaying((v) => !v)}>{playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{playing ? "Pause" : "Play"}</Button>
                    <Button variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-100" onClick={() => { const reset = buildInitialTracks(); setTracks(reset); setHistory(Object.fromEntries(reset.map((t) => [t.id, [[t.lon, t.lat]]]))); setSelected(reset[0]); setRegionKey("global"); setView(REGION_PRESETS.global); setTimeline([56]); setLastUpdated(new Date()); setLiveFeed([{ id: `boot-${Date.now()}`, ts: new Date(), level: "info", title: "Feed reset", detail: "Live stream reset to baseline synthetic state." }]); }}><RotateCcw className="mr-2 h-4 w-4" />Reset</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <GlobeSurface
                  tracks={filtered}
                  history={history}
                  selected={selectedLive}
                  onSelect={setSelected}
                  regionKey={regionKey}
                  setRegionKey={setRegionKey}
                  view={view}
                  setView={setView}
                  ui={ui}
                  setUi={setUi}
                  focusSelected={focusSelected}
                />
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Eye className="h-5 w-5 text-zinc-300" /> Event timeline</CardTitle>
                <CardDescription className="text-zinc-400">Use the globe to understand where, then the timeline to understand when.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-400">Closest event at current time marker</div>
                  <Badge className="border-zinc-700 bg-zinc-900 text-zinc-100">T+ {timeline[0]} min</Badge>
                </div>
                <Slider value={timeline} onValueChange={setTimeline} min={0} max={100} step={1} />
                <div className="grid gap-3 md:grid-cols-4">
                  {EVENTS.map((event) => (
                    <button key={event.t} onClick={() => setTimeline([event.t])} className={`rounded-2xl border p-4 text-left ${timelineEvent.t === event.t ? "border-cyan-400/40 bg-zinc-900" : "border-zinc-800 bg-zinc-950"}`}>
                      <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">T+ {event.t}</div>
                      <div className="mt-1 font-medium text-zinc-100">{event.title}</div>
                      <div className="mt-2 text-xs text-zinc-400">{event.detail}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-emerald-300" /> Live feed</CardTitle>
                <CardDescription className="text-zinc-400">Rolling updates generated from the moving global traffic picture.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {liveFeed.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-zinc-100">{entry.title}</div>
                          <div className="text-xs text-zinc-400">{formatClock(entry.ts)}</div>
                        </div>
                        <Badge className={entry.level === "warning" ? "border-orange-400/20 bg-orange-500/10 text-orange-200" : "border-zinc-700 bg-zinc-900 text-zinc-100"}>{entry.level}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-zinc-300">{entry.detail}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5 text-amber-300" /> Narrative</CardTitle>
                <CardDescription className="text-zinc-400">A tighter read of what matters right now.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">What changed</div>
                  <div className="mt-2 text-sm text-zinc-200">{timelineEvent.detail}</div>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Region</div>
                  <div className="mt-2 text-sm text-zinc-200">{timelineEvent.region}</div>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Selected asset</div>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-zinc-100">{selectedLive?.id}</div>
                      <div className="text-xs text-zinc-400">{selectedLive?.operator}</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={badgeTone(selectedLive?.type, selectedLive?.category)}>{selectedLive?.category}</Badge>
                      <Badge className="border-zinc-700 bg-zinc-900 text-zinc-100">{selectedLive?.type}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
                    <div className="rounded-xl bg-zinc-900 p-3">Lat<br /><span className="text-zinc-200">{selectedLive?.lat?.toFixed(2)}</span></div>
                    <div className="rounded-xl bg-zinc-900 p-3">Lon<br /><span className="text-zinc-200">{selectedLive?.lon?.toFixed(2)}</span></div>
                    <div className="rounded-xl bg-zinc-900 p-3">Heading<br /><span className="text-zinc-200">{Math.round(selectedLive?.heading || 0)}°</span></div>
                    <div className="rounded-xl bg-zinc-900 p-3">Speed<br /><span className="text-zinc-200">{Math.round(selectedLive?.speed || 0)}</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Layers className="h-5 w-5 text-cyan-300" /> Sources</CardTitle>
                <CardDescription className="text-zinc-400">What this surface is actually showing you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  ["Map layer", "Higher-resolution world geometry with country and city labels."],
                  ["Air / sea / orbit", "A synthetic tracking system built from airport corridors, shipping lanes, and satellite constellations."],
                  ["Public cameras", "Traffic and transit only, not person-level insight."],
                ].map(([title, note]) => (
                  <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{title}</div>
                    <div className="mt-2 text-sm text-zinc-300">{note}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Tabs defaultValue="alerts">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-900/60">
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
                <TabsTrigger value="cameras">Cameras</TabsTrigger>
              </TabsList>
              <TabsContent value="alerts">
                <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
                  <CardContent className="space-y-3 p-6">
                    {EVENTS.map((event) => (
                      <div key={event.t} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-zinc-100">{event.title}</div>
                            <div className="text-xs text-zinc-400">{event.region}</div>
                          </div>
                          <Badge className={event.severity === "high" ? "border-red-400/20 bg-red-500/10 text-red-200" : event.severity === "medium" ? "border-orange-400/20 bg-orange-500/10 text-orange-200" : "border-zinc-700 bg-zinc-900 text-zinc-100"}>{event.severity}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-zinc-300">{event.detail}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="cameras">
                <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/60">
                  <CardContent className="space-y-3 p-6">
                    {CAMERAS.map((cam) => (
                      <div key={cam.name} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-zinc-100">{cam.name}</div>
                            <div className="text-xs text-zinc-400">{cam.city}</div>
                          </div>
                          <Camera className="h-4 w-4 text-zinc-400" />
                        </div>
                        <div className="mt-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 p-5 text-center text-xs text-zinc-500">{cam.note}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
