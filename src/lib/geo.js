import { CHOKEPOINT_RADIUS_DEGREES, CHOKEPOINTS } from "@/data/constants";
import { normalizeLon } from "@/lib/utils";

export function buildArcPoints(from, to, steps = 44) {
  const points = [];
  const distanceLon = to.lng - from.lng;
  const adjustedLon = Math.abs(distanceLon) > 180 ? to.lng - Math.sign(distanceLon) * 360 : to.lng;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    points.push({
      lat: from.lat + (to.lat - from.lat) * t,
      lng: normalizeLon(from.lng + (adjustedLon - from.lng) * t),
    });
  }

  return points;
}

export function routeChokepointsForPoints(points) {
  if (!Array.isArray(points) || points.length === 0) return [];

  return CHOKEPOINTS.filter((chokepoint) => {
    const radius = CHOKEPOINT_RADIUS_DEGREES[chokepoint.name] || 4;
    return points.some((point) => {
      if (!point || !Number.isFinite(point.lng) || !Number.isFinite(point.lat)) return false;
      return Math.abs(normalizeLon(point.lng - chokepoint.centerLon)) <= radius && Math.abs(point.lat - chokepoint.centerLat) <= radius;
    });
  }).map((item) => item.name);
}

export function chokepointsForCodes(fromCode, toCode, points = []) {
  const codes = [fromCode, toCode].filter(Boolean);
  const hits = routeChokepointsForPoints(points);

  if (codes.some((code) => ["DXB", "MUM", "DOH"].includes(code))) hits.push("Hormuz");
  if (codes.some((code) => ["SUE", "GIB", "RTM", "HAM"].includes(code))) hits.push("Suez");
  if (codes.some((code) => ["SGP", "JKT", "COL", "BUS", "TYO", "SHA", "NBO", "TAI"].includes(code))) hits.push("Malacca");
  if (codes.some((code) => ["PAN", "NYC", "LAXP", "LGB", "SAV"].includes(code))) hits.push("Panama");

  return [...new Set(hits)];
}
