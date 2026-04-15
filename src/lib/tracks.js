import { CHOKEPOINTS, COUNTRY_INTEL, LIVE_EVENTS, VESSEL_CLASS_OPTIONS } from "@/data/constants";
import { AIRPORTS, AIR_ROUTES, PORTS, SATELLITE_GROUPS, SEA_LANES } from "@/data/mockAssets";
import { buildArcPoints, chokepointsForCodes, routeChokepointsForPoints } from "@/lib/geo";
import { clamp, countBy, hasLonLat, normalizeLon, seededUnit } from "@/lib/utils";

export function createRouteTrack(kind, route, index) {
  const origin = kind === "aircraft" ? AIRPORTS[route.from] ?? null : PORTS[route.from] ?? null;
  const dest = kind === "aircraft" ? AIRPORTS[route.to] ?? null : PORTS[route.to] ?? null;
  if (!origin || !dest || !hasLonLat(origin) || !hasLonLat(dest)) return null;

  const seed = seededUnit(`${kind}-${route.operator}-${route.from}-${route.to}-${index}`);
  const phase = seededUnit(`phase-${kind}-${route.from}-${route.to}-${index}`);
  const points = buildArcPoints({ lat: origin.lat, lng: origin.lon }, { lat: dest.lat, lng: dest.lon });
  const pointIndex = Math.floor(phase * (points.length - 1));
  const current = points[pointIndex] || points[0];
  const ahead = points[Math.min(points.length - 1, pointIndex + 1)] || current;
  const heading = ((Math.atan2(ahead.lng - current.lng, ahead.lat - current.lat) * 180) / Math.PI + 360) % 360;
  const prefix = route.operator.replace(/[^A-Z]/gi, "").slice(0, kind === "aircraft" ? 3 : 4).toUpperCase() || (kind === "aircraft" ? "AIR" : "SEA");

  return {
    id: `${prefix}${100 + index}`,
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
    delta: (kind === "aircraft" ? 0.004 : 0.001) + seed * (kind === "aircraft" ? 0.004 : 0.0013),
    lon: current.lng,
    lat: current.lat,
    heading,
    speed: kind === "aircraft" ? Math.round(410 + seed * 120) : Math.round(12 + seed * 16),
    altitude: kind === "aircraft" ? Math.round(28000 + seed * 12000) : 0,
    vesselClass: kind === "vessel" ? route.vesselClass || null : null,
    chokepoints: kind === "vessel" ? chokepointsForCodes(route.from, route.to, points) : routeChokepointsForPoints(points),
  };
}

export function createSatelliteTrack(group, index) {
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
    lon: -180 + seed * 360,
    lat: Math.sin(phase) * Math.min(group.inclination, 80),
    heading: seed * 360,
    altitude: group.altitude,
    speed: 26500 + Math.round(seed * 1800),
    vesselClass: null,
    chokepoints: [],
  };
}

export function buildInitialTracks() {
  const aircraft = AIR_ROUTES.flatMap((route, routeIndex) => Array.from({ length: route.count }, (_, i) => createRouteTrack("aircraft", route, routeIndex * 10 + i)).filter(Boolean));
  const vessels = SEA_LANES.flatMap((route, routeIndex) => Array.from({ length: route.count }, (_, i) => createRouteTrack("vessel", route, routeIndex * 10 + i)).filter(Boolean));
  const satellites = SATELLITE_GROUPS.flatMap((group) => Array.from({ length: group.count }, (_, i) => createSatelliteTrack(group, i)).filter(Boolean));
  return [...aircraft, ...vessels, ...satellites].filter(hasLonLat);
}

export function validateTracks(tracks) {
  const errors = [];
  const seen = new Set();
  tracks.forEach((track) => {
    if (!track?.id) errors.push("A track is missing an id.");
    if (track?.id && seen.has(track.id)) errors.push(`Duplicate track id: ${track.id}`);
    if (track?.id) seen.add(track.id);
    if (!hasLonLat(track)) errors.push(`Track ${track?.id || "unknown"} is missing valid coordinates.`);
    if (!["aircraft", "vessel", "satellite"].includes(track?.type)) errors.push(`Track ${track?.id || "unknown"} has an unknown type.`);
  });
  return errors;
}

export function stepTrack(track, frame) {
  if (!track || !hasLonLat(track)) return null;
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

  if (!Number.isFinite(track.progress)) return track;
  const nextProgress = (track.progress + track.delta) % 1;
  const points = buildArcPoints({ lat: track.fromLat, lng: track.fromLon }, { lat: track.toLat, lng: track.toLon });
  const pointIndex = Math.floor(nextProgress * (points.length - 1));
  const current = points[pointIndex] || points[0];
  const ahead = points[Math.min(points.length - 1, pointIndex + 1)] || current;
  const heading = ((Math.atan2(ahead.lng - current.lng, ahead.lat - current.lat) * 180) / Math.PI + 360) % 360;

  return {
    ...track,
    progress: nextProgress,
    lon: current.lng,
    lat: current.lat,
    heading,
    altitude: track.type === "aircraft" ? clamp((track.altitude || 34000) + Math.sin(frame * 0.15 + nextProgress * 6) * 40, 25000, 43000) : 0,
    speed: track.type === "aircraft" ? clamp((track.speed || 450) + Math.sin(frame * 0.08 + nextProgress * 8), 360, 620) : clamp((track.speed || 18) + Math.sin(frame * 0.03 + nextProgress * 10) * 0.2, 8, 34),
  };
}

export function filterTracks(tracks, filters) {
  const q = filters.query.trim().toLowerCase();
  return tracks.filter((track) => {
    if (!filters.showTypes[track.type]) return false;
    if (filters.onlyMilitary && !track.military) return false;
    if (filters.hideCommercial && track.category === "commercial") return false;
    if (track.type === "vessel" && filters.vesselClass !== "all" && track.vesselClass !== filters.vesselClass) return false;
    if (!q) return true;
    return [track.id, track.operator, track.type, track.category, track.origin, track.dest, track.vesselClass].filter(Boolean).join(" ").toLowerCase().includes(q);
  });
}

export function getMilitaryProfile(track) {
  if (!track?.military) return null;
  const operator = (track.operator || "").toLowerCase();
  const endpoints = `${track.origin || ""} ${track.dest || ""}`.toLowerCase();

  let nation = "Unknown";
  let service = track.type === "vessel" ? "Navy" : track.type === "aircraft" ? "Air Force" : "Space / ISR";
  let role = track.type === "vessel" ? "Surface combatant" : track.type === "aircraft" ? "Airlift / patrol" : "Recon / ISR";
  let mission = "Strategic watch";
  let priority = "Routine";

  if (operator.includes("us navy") || operator.includes("usaf") || operator.includes("us government")) nation = "United States";
  if (operator.includes("royal navy")) nation = "United Kingdom";
  if (operator.includes("russian")) nation = "Russia";
  if (operator.includes("indian")) nation = "India";
  if (operator.includes("pla") || operator === "plan") nation = "China";

  if (endpoints.includes("tpe") || endpoints.includes("tai")) {
    mission = "Taiwan Strait posture";
    priority = "High";
  } else if (endpoints.includes("fnj") || endpoints.includes("ras")) {
    mission = "Korean Peninsula watch";
    priority = "High";
  } else if (endpoints.includes("dov") || endpoints.includes("rms") || endpoints.includes("gib") || endpoints.includes("sue")) {
    mission = "Atlantic / Med transit";
    priority = "Elevated";
  } else if (endpoints.includes("viz") || endpoints.includes("chn")) {
    mission = "Indian Ocean posture";
    priority = "Elevated";
  }

  let theater = "Global";
  if (hasLonLat(track)) {
    if (track.lon > 115 && track.lon < 145 && track.lat > 20 && track.lat < 50) theater = "East Asia / NW Pacific";
    else if (track.lon > 65 && track.lon < 95 && track.lat > 5 && track.lat < 30) theater = "South Asia / Indian Ocean";
    else if (track.lon > 46 && track.lon < 60 && track.lat > 20 && track.lat < 30) theater = "Gulf / Arabian Sea";
    else if (track.lon > -10 && track.lon < 40 && track.lat > 30 && track.lat < 60) theater = "Europe / East Med";
    else if (track.lon < -20 && track.lon > -90 && track.lat > 20 && track.lat < 55) theater = "North Atlantic";
  }

  return { nation, service, role, mission, theater, priority };
}

export function summarizeMilitary(tracks) {
  const profiles = tracks.map(getMilitaryProfile).filter(Boolean);
  return {
    total: profiles.length,
    nations: countBy(profiles, (item) => item.nation).slice(0, 6),
    services: countBy(profiles, (item) => item.service).slice(0, 4),
    theaters: countBy(profiles, (item) => item.theater).slice(0, 4),
    priorities: countBy(profiles, (item) => item.priority).slice(0, 3),
  };
}

export function getEndpoint(track, side) {
  if (!track) return null;
  const code = side === "origin" ? track.origin : track.dest;
  if (!code) return null;
  const source = track.type === "aircraft" ? AIRPORTS : PORTS;
  return source[code] ? { ...source[code], code } : { code, city: code, country: "Unknown", lon: null, lat: null };
}

export function routeLabel(track) {
  const origin = getEndpoint(track, "origin");
  const dest = getEndpoint(track, "dest");
  if (!origin || !dest) return track?.type === "satellite" ? "Orbital ground track" : "Unknown route";
  return `${origin.city} (${origin.code}) to ${dest.city} (${dest.code})`;
}

export function getAssetNation(track) {
  if (!track) return "Unknown";
  const military = getMilitaryProfile(track);
  if (military?.nation && military.nation !== "Unknown") return military.nation;
  if (track.type === "satellite") {
    if ((track.operator || "").includes("SpaceX")) return "United States";
    if ((track.operator || "").includes("OneWeb")) return "United Kingdom";
    if ((track.operator || "").includes("ISS")) return "Multinational";
    if ((track.operator || "").includes("US Government")) return "United States";
    return "Commercial / multinational";
  }
  return getEndpoint(track, "origin")?.country || getEndpoint(track, "dest")?.country || "Unknown";
}

export function getTrackSignificance(track) {
  if (!track) return "No asset selected.";
  const military = getMilitaryProfile(track);
  if (military) {
    return `${military.nation} ${military.service.toLowerCase()} ${track.type} linked to ${military.mission.toLowerCase()} in ${military.theater}. Priority is ${military.priority.toLowerCase()} because the route touches a live strategic corridor.`;
  }
  if (track.type === "vessel") {
    const vesselClass = track.vesselClass ? `${track.vesselClass} vessel` : "commercial vessel";
    const chokepointText = track.chokepoints?.length ? ` It touches ${track.chokepoints.join(", ")}.` : "";
    return `${vesselClass[0].toUpperCase()}${vesselClass.slice(1)} moving on ${routeLabel(track)}. Shipping lanes are where regional conflict becomes price and supply pressure.${chokepointText}`;
  }
  if (track.type === "aircraft") {
    return `Commercial air traffic on ${routeLabel(track)}. Air routing can bend quickly near conflict, restrictions, or alliance strain.`;
  }
  return "Orbital asset shaping the wider awareness picture rather than a country-to-country route.";
}

export function getPredictedPurpose(track) {
  if (!track) return { purpose: "No track selected.", confidence: "Low" };
  const military = getMilitaryProfile(track);
  if (military) {
    return {
      purpose: `${military.mission}. Route, operator, and service profile suggest ${military.role.toLowerCase()} activity in ${military.theater}.`,
      confidence: military.priority === "High" ? "Medium-high" : "Medium",
    };
  }
  if (track.type === "vessel") {
    const classPurpose = {
      container: "containerized cargo movement across scheduled commercial lanes",
      tanker: "liquid energy or refined product transport with energy-market sensitivity",
      lng: "LNG movement tied to power generation and energy supply contracts",
      bulk: "dry bulk commodity transport such as grain, ore, or industrial inputs",
      "ro-ro": "vehicle or rolling-equipment transport",
    };
    return { purpose: classPurpose[track.vesselClass] || "commercial maritime movement", confidence: "Medium" };
  }
  if (track.type === "aircraft") {
    return { purpose: `Commercial passenger/cargo movement on ${routeLabel(track)}.`, confidence: "Medium" };
  }
  return { purpose: `${track.operator} orbital coverage pass.`, confidence: track.category === "military" ? "Medium" : "Low-medium" };
}

export function getTrackHistory(track, history) {
  const points = history?.[track?.id] || [];
  if (!track || points.length === 0) return "No recent trail points captured yet.";
  const first = points[0];
  const last = points[points.length - 1];
  if (!Array.isArray(first) || !Array.isArray(last)) return "Recent trail is unavailable.";
  return `${points.length} recent positions from ${first[1].toFixed(2)}, ${first[0].toFixed(2)} to ${last[1].toFixed(2)}, ${last[0].toFixed(2)}.`;
}

export function getAssetDossier(track, history) {
  if (!track) return null;
  return {
    id: track.id,
    type: track.type,
    category: track.category,
    operator: track.operator || "Unknown operator",
    nation: getAssetNation(track),
    route: routeLabel(track),
    military: getMilitaryProfile(track),
    prediction: getPredictedPurpose(track),
    historySummary: getTrackHistory(track, history),
    speed: track.speed ? Math.round(track.speed) : null,
    altitude: track.type === "aircraft" || track.type === "satellite" ? Math.round(track.altitude || 0) : null,
    heading: Math.round(track.heading || 0),
    chokepoints: track.chokepoints || [],
    vesselClass: track.vesselClass,
  };
}

export function getCountryFromTrack(track) {
  if (!track) return null;
  const military = getMilitaryProfile(track);
  if (military?.nation && COUNTRY_INTEL[military.nation]) return military.nation;
  const origin = getEndpoint(track, "origin")?.country;
  const dest = getEndpoint(track, "dest")?.country;
  return COUNTRY_INTEL[origin] ? origin : COUNTRY_INTEL[dest] ? dest : null;
}

export function summarizeChokepointTraffic(tracks) {
  return CHOKEPOINTS.map((chokepoint) => {
    const matches = tracks.filter((track) => track.chokepoints?.includes(chokepoint.name));
    const vessels = matches.filter((track) => track.type === "vessel");
    return {
      ...chokepoint,
      tracks: matches,
      vessels,
      aircraft: matches.filter((track) => track.type === "aircraft"),
      military: matches.filter((track) => track.military),
      vesselClasses: VESSEL_CLASS_OPTIONS.filter((name) => name !== "all")
        .map((name) => ({ name, count: vessels.filter((track) => track.vesselClass === name).length }))
        .filter((item) => item.count > 0),
    };
  });
}

export function summarizeStats(tracks) {
  const commercialVessels = tracks.filter((track) => track.type === "vessel" && track.category === "commercial");
  return {
    aircraft: tracks.filter((track) => track.type === "aircraft").length,
    vessels: tracks.filter((track) => track.type === "vessel").length,
    satellites: tracks.filter((track) => track.type === "satellite").length,
    commercialVessels: commercialVessels.length,
    militaryVessels: tracks.filter((track) => track.type === "vessel" && track.category === "military").length,
    vesselClasses: VESSEL_CLASS_OPTIONS.filter((name) => name !== "all").map((name) => ({
      name,
      count: commercialVessels.filter((track) => track.vesselClass === name).length,
    })),
  };
}

export function buildLiveEntries(tracks, frame, selectedId) {
  const now = new Date();
  const selected = tracks.find((track) => track.id === selectedId) || tracks[0] || null;
  const eastAsiaTraffic = tracks.filter((track) => track.lon > 115 && track.lon < 145 && track.lat > 20 && track.lat < 45);
  const gulfTraffic = tracks.filter((track) => track.lon > 46 && track.lon < 60 && track.lat > 20 && track.lat < 30);
  const militaryVisible = tracks.filter((track) => track.military).length;
  const entries = [];

  if (selected) {
    entries.push({
      id: `track-${frame}-${selected.id}`,
      ts: now,
      level: selected.military ? "warning" : "info",
      title: `${selected.id} updated`,
      detail: `${selected.operator} ${selected.type} at ${selected.speed ? Math.round(selected.speed) : "--"}${selected.type === "aircraft" ? " kt" : selected.type === "vessel" ? " kn" : " km/h orbital"}.`,
    });
  }
  if (frame % 2 === 0) entries.push({ id: `global-${frame}`, ts: now, level: "info", title: "Global traffic sweep", detail: `${tracks.filter((track) => track.type === "aircraft").length} air tracks and ${tracks.filter((track) => track.type === "vessel").length} maritime tracks active.` });
  if (frame % 3 === 0) entries.push({ id: `gulf-${frame}`, ts: now, level: gulfTraffic.length > 4 ? "warning" : "info", title: "Gulf watch", detail: `${gulfTraffic.length} tracked assets inside Gulf / Hormuz corridor.` });
  if (frame % 4 === 0) entries.push({ id: `eastasia-${frame}`, ts: now, level: eastAsiaTraffic.length > 10 ? "warning" : "info", title: "East Asia sweep", detail: `${eastAsiaTraffic.length} tracked assets across East Asia and NW Pacific corridors.` });
  if (frame % 5 === 0) entries.push({ id: `mil-${frame}`, ts: now, level: militaryVisible > 10 ? "warning" : "info", title: "Military picture", detail: `${militaryVisible} military-tagged tracks currently active.` });

  return entries.slice(0, 5);
}

export function nearestTimelineEvent(value) {
  return [...LIVE_EVENTS].sort((a, b) => Math.abs(a.t - value) - Math.abs(b.t - value))[0];
}
