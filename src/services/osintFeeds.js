import { LIVE_OSINT_SOURCES } from "@/data/osintSources";

const USGS_FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
const EONET_FEED_URL = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30&limit=20";
const NWS_FEED_URL = "https://api.weather.gov/alerts/active?status=actual";

const EONET_CATEGORY_SEVERITY = {
  wildfires: "high",
  severeStorms: "high",
  volcanoes: "high",
  landslides: "high",
  floods: "medium",
  drought: "medium",
  dustHaze: "medium",
  snow: "medium",
  waterColor: "low",
};

const EONET_EXCLUDED_CATEGORIES = new Set(["seaLakeIce"]);

function flattenCoordinates(value, points = []) {
  if (!Array.isArray(value)) return points;
  if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
    points.push([value[0], value[1]]);
    return points;
  }
  value.forEach((item) => flattenCoordinates(item, points));
  return points;
}

function averageCoordinates(points) {
  if (!Array.isArray(points) || points.length === 0) return null;
  const [lonSum, latSum] = points.reduce((acc, [lon, lat]) => [acc[0] + lon, acc[1] + lat], [0, 0]);
  return { lon: lonSum / points.length, lat: latSum / points.length };
}

function getGeometryCenter(geometry) {
  if (!geometry?.type) return null;
  const points = flattenCoordinates(geometry.coordinates);
  return averageCoordinates(points);
}

function sortNewestFirst(items, getDate) {
  return [...items].sort((a, b) => new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime());
}

function mapSeverity(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "extreme" || normalized === "severe") return "high";
  if (normalized === "moderate") return "medium";
  return "low";
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

function normalizeUsgsFeature(feature) {
  const [lon, lat] = feature.geometry?.coordinates || [];
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  const magnitude = Number(feature.properties?.mag || 0);
  const alertLevel = feature.properties?.alert ? `USGS alert ${String(feature.properties.alert).toUpperCase()}` : null;

  return {
    id: `usgs-${feature.id}`,
    sourceId: "usgs-earthquakes",
    sourceName: "USGS Earthquakes",
    category: "Earthquake",
    title: feature.properties?.title || "Earthquake",
    detail: feature.properties?.place ? `M ${magnitude.toFixed(1)} near ${feature.properties.place}` : `M ${magnitude.toFixed(1)} earthquake`,
    severity: alertLevel ? "high" : magnitude >= 6 ? "high" : magnitude >= 4.5 ? "medium" : "low",
    lon,
    lat,
    updatedAt: feature.properties?.time || feature.properties?.updated || null,
    link: feature.properties?.url || null,
    note: alertLevel,
  };
}

export async function fetchUsgsEarthquakes() {
  const payload = await fetchJson(USGS_FEED_URL);
  const events = (payload.features || []).map(normalizeUsgsFeature).filter(Boolean);
  return sortNewestFirst(events, (item) => item.updatedAt).slice(0, 10);
}

function normalizeEonetEvent(event) {
  const categories = event.categories || [];
  if (categories.some((category) => EONET_EXCLUDED_CATEGORIES.has(category.id))) return null;

  const latestGeometry = sortNewestFirst(event.geometry || [], (item) => item.date)[0];
  if (!latestGeometry) return null;

  const center = latestGeometry.type === "Point"
    ? { lon: latestGeometry.coordinates?.[0], lat: latestGeometry.coordinates?.[1] }
    : getGeometryCenter(latestGeometry);
  if (!Number.isFinite(center?.lon) || !Number.isFinite(center?.lat)) return null;

  const primaryCategory = categories[0];
  const magnitude = latestGeometry.magnitudeValue;
  const magnitudeLabel = Number.isFinite(magnitude) && latestGeometry.magnitudeUnit
    ? `${magnitude} ${latestGeometry.magnitudeUnit}`
    : null;

  return {
    id: `eonet-${event.id}`,
    sourceId: "nasa-eonet",
    sourceName: "NASA EONET",
    category: primaryCategory?.title || "Open event",
    title: event.title || "Open natural event",
    detail: magnitudeLabel
      ? `${primaryCategory?.title || "Open event"} - ${magnitudeLabel}`
      : `${primaryCategory?.title || "Open event"} tracked by NASA EONET`,
    severity: EONET_CATEGORY_SEVERITY[primaryCategory?.id] || "medium",
    lon: center.lon,
    lat: center.lat,
    updatedAt: latestGeometry.date || null,
    link: event.link || null,
    note: (event.sources || []).map((source) => source.id).join(", ") || null,
  };
}

export async function fetchEonetEvents() {
  const payload = await fetchJson(EONET_FEED_URL);
  const events = (payload.events || []).map(normalizeEonetEvent).filter(Boolean);
  return sortNewestFirst(events, (item) => item.updatedAt).slice(0, 10);
}

function normalizeNwsFeature(feature) {
  const center = getGeometryCenter(feature.geometry);
  if (!Number.isFinite(center?.lon) || !Number.isFinite(center?.lat)) return null;

  const properties = feature.properties || {};
  return {
    id: `nws-${feature.id || properties.id}`,
    sourceId: "nws-alerts",
    sourceName: "NWS Alerts",
    category: properties.event || "Weather alert",
    title: properties.headline || properties.event || "Weather alert",
    detail: properties.areaDesc ? `${properties.event || "Alert"} for ${properties.areaDesc}` : properties.event || "Weather alert",
    severity: mapSeverity(properties.severity),
    lon: center.lon,
    lat: center.lat,
    updatedAt: properties.sent || properties.effective || properties.onset || null,
    link: properties["@id"] || feature.id || null,
    note: [properties.senderName, properties.urgency, properties.certainty].filter(Boolean).join(" • ") || null,
  };
}

export async function fetchNwsAlerts() {
  const payload = await fetchJson(NWS_FEED_URL, {
    headers: {
      Accept: "application/geo+json",
    },
  });

  const events = (payload.features || [])
    .map(normalizeNwsFeature)
    .filter(Boolean)
    .filter((item) => item.severity !== "low");

  return sortNewestFirst(events, (item) => item.updatedAt).slice(0, 10);
}

export async function fetchLiveOsintSnapshot() {
  const tasks = [
    { source: LIVE_OSINT_SOURCES[0], run: fetchUsgsEarthquakes },
    { source: LIVE_OSINT_SOURCES[1], run: fetchEonetEvents },
    { source: LIVE_OSINT_SOURCES[2], run: fetchNwsAlerts },
  ];

  const results = await Promise.allSettled(tasks.map((task) => task.run()));
  const events = [];
  const sources = results.map((result, index) => {
    const meta = tasks[index].source;
    if (result.status === "fulfilled") {
      const sourceEvents = result.value || [];
      events.push(...sourceEvents);
      return {
        ...meta,
        ok: true,
        count: sourceEvents.length,
        error: null,
      };
    }
    return {
      ...meta,
      ok: false,
      count: 0,
      error: result.reason?.message || String(result.reason || "Unknown error"),
    };
  });

  const okCount = sources.filter((source) => source.ok).length;
  const state = okCount === sources.length ? "connected" : okCount > 0 ? "degraded" : "error";

  return {
    ok: okCount > 0,
    state,
    generatedAt: new Date().toISOString(),
    sources,
    events: sortNewestFirst(events, (item) => item.updatedAt).slice(0, 24),
  };
}
